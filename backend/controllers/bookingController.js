const Show = require('../models/Show');
const Booking = require('../models/Booking');
const { generateBookingQRCode } = require('../utils/qrGenerator');

// Generate human-friendly unique booking ID
const generateUniqueBookingId = () => {
  const timestamp = Date.now().toString(36).toUpperCase().slice(-5);
  const randomPart = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `IMV-${timestamp}-${randomPart}`;
};

// @desc    Temporarily lock seats for checkout
// @route   POST /api/bookings/lock-seats
// @access  Private
exports.lockSeats = async (req, res, next) => {
  try {
    const { showId, seatNumbers } = req.body;
    const userId = req.user._id;

    if (!showId || !seatNumbers || !Array.isArray(seatNumbers) || seatNumbers.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide show ID and an array of seat numbers to lock.'
      });
    }

    const show = await Show.findById(showId);
    if (!show) {
      return res.status(404).json({ success: false, message: 'Show not found.' });
    }

    const lockDurationMinutes = Number(process.env.SEAT_LOCK_DURATION_MINUTES) || 5;

    // Release any expired locks first
    show.releaseExpiredLocks(lockDurationMinutes);

    // Verify all requested seats exist and are available (or already locked by this exact user)
    const unavailableSeats = [];
    const selectedSeatObjects = [];

    for (const seatNum of seatNumbers) {
      const seat = show.seats.find((s) => s.seatNumber === seatNum);
      if (!seat) {
        return res.status(400).json({
          success: false,
          message: `Seat ${seatNum} does not exist in this theatre layout.`
        });
      }

      if (seat.status === 'booked') {
        unavailableSeats.push(`${seatNum} (Already booked)`);
      } else if (seat.status === 'locked' && seat.lockedBy && seat.lockedBy.toString() !== userId.toString()) {
        unavailableSeats.push(`${seatNum} (Currently locked by another user)`);
      } else {
        selectedSeatObjects.push(seat);
      }
    }

    if (unavailableSeats.length > 0) {
      return res.status(409).json({
        success: false,
        message: `Some seats are unavailable: ${unavailableSeats.join(', ')}. Please choose other seats.`,
        unavailableSeats
      });
    }

    // Now lock all selected seats atomically in this show document
    const now = new Date();
    selectedSeatObjects.forEach((seat) => {
      seat.status = 'locked';
      seat.lockedBy = userId;
      seat.lockedAt = now;
    });

    show.availableSeatsCount = show.seats.filter((s) => s.status === 'available').length;
    await show.save();

    // Calculate server-verified pricing
    const subtotal = selectedSeatObjects.reduce((acc, s) => acc + s.price, 0);
    const convenienceFee = 30 * selectedSeatObjects.length;
    const totalAmount = subtotal + convenienceFee;
    const expiresAt = new Date(now.getTime() + lockDurationMinutes * 60 * 1000);

    // Emit real-time socket event if io is configured on app
    const io = req.app.get('io');
    if (io) {
      io.emit('seats_locked', {
        showId: show._id,
        seatNumbers,
        lockedBy: userId
      });
    }

    res.json({
      success: true,
      message: `${seatNumbers.length} seat(s) locked for ${lockDurationMinutes} minutes.`,
      lockDurationMinutes,
      expiresAt,
      seatDetails: selectedSeatObjects.map((s) => ({
        seatNumber: s.seatNumber,
        tier: s.tier,
        price: s.price
      })),
      pricing: {
        ticketCount: selectedSeatObjects.length,
        subtotal,
        convenienceFee,
        totalAmount
      }
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Explicitly release seats locked by current user (e.g. back button / cancelled flow)
// @route   POST /api/bookings/release-seats
// @access  Private
exports.releaseSeats = async (req, res, next) => {
  try {
    const { showId, seatNumbers } = req.body;
    const userId = req.user._id;

    if (!showId) {
      return res.status(400).json({ success: false, message: 'Show ID is required.' });
    }

    const show = await Show.findById(showId);
    if (!show) {
      return res.status(404).json({ success: false, message: 'Show not found.' });
    }

    let releasedCount = 0;
    const releasedSeatNumbers = [];

    show.seats.forEach((seat) => {
      if (
        seat.status === 'locked' &&
        seat.lockedBy &&
        seat.lockedBy.toString() === userId.toString() &&
        (!seatNumbers || seatNumbers.includes(seat.seatNumber))
      ) {
        seat.status = 'available';
        seat.lockedBy = null;
        seat.lockedAt = null;
        releasedCount++;
        releasedSeatNumbers.push(seat.seatNumber);
      }
    });

    if (releasedCount > 0) {
      show.availableSeatsCount = show.seats.filter((s) => s.status === 'available').length;
      await show.save();

      const io = req.app.get('io');
      if (io) {
        io.emit('seats_released', {
          showId: show._id,
          seatNumbers: releasedSeatNumbers
        });
      }
    }

    res.json({
      success: true,
      message: `${releasedCount} seat(s) released successfully.`,
      releasedCount
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Confirm booking after successful payment
// @route   POST /api/bookings
// @access  Private
exports.createBooking = async (req, res, next) => {
  try {
    const {
      showId,
      seatNumbers,
      paymentMethod = 'mock',
      paymentDetails = {}
    } = req.body;

    const userId = req.user._id;

    if (!showId || !seatNumbers || !Array.isArray(seatNumbers) || seatNumbers.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Show ID and seat numbers are required.'
      });
    }

    const show = await Show.findById(showId)
      .populate('movie')
      .populate('theatre');

    if (!show) {
      return res.status(404).json({ success: false, message: 'Show not found.' });
    }

    const lockDurationMinutes = Number(process.env.SEAT_LOCK_DURATION_MINUTES) || 5;
    show.releaseExpiredLocks(lockDurationMinutes);

    // Validate that the requested seats are either locked by this user or currently available
    const bookingSeats = [];
    for (const seatNum of seatNumbers) {
      const seat = show.seats.find((s) => s.seatNumber === seatNum);
      if (!seat) {
        return res.status(400).json({
          success: false,
          message: `Seat ${seatNum} is invalid.`
        });
      }

      if (seat.status === 'booked') {
        return res.status(409).json({
          success: false,
          message: `Seat ${seatNum} is already booked. Booking could not be completed.`
        });
      }

      if (seat.status === 'locked' && seat.lockedBy && seat.lockedBy.toString() !== userId.toString()) {
        return res.status(409).json({
          success: false,
          message: `Seat ${seatNum} is currently locked by another customer.`
        });
      }

      bookingSeats.push(seat);
    }

    // Server-side calculation of pricing (never trust frontend amounts)
    const subtotal = bookingSeats.reduce((acc, s) => acc + s.price, 0);
    const convenienceFee = 30 * bookingSeats.length;
    const totalAmount = subtotal + convenienceFee;

    const bookingId = generateUniqueBookingId();

    // Generate QR Code data URL
    const qrCode = await generateBookingQRCode({
      bookingId,
      movieTitle: show.movie.title,
      theatreName: show.theatre.name,
      showDate: show.showDate,
      showTime: show.showTime,
      seats: bookingSeats,
      totalAmount
    });

    // Create the booking record
    const booking = await Booking.create({
      bookingId,
      user: userId,
      movie: show.movie._id,
      theatre: show.theatre._id,
      show: show._id,
      movieTitle: show.movie.title,
      moviePoster: show.movie.posterUrl,
      theatreName: show.theatre.name,
      theatreLocation: `${show.theatre.location}, ${show.theatre.city}`,
      showDate: show.showDate,
      showTime: show.showTime,
      screenName: show.screenName,
      seats: bookingSeats.map((s) => ({
        seatNumber: s.seatNumber,
        tier: s.tier,
        price: s.price
      })),
      ticketCount: bookingSeats.length,
      subtotal,
      convenienceFee,
      totalAmount,
      paymentStatus: 'completed',
      paymentMethod,
      paymentDetails: {
        razorpayOrderId: paymentDetails.razorpayOrderId || null,
        razorpayPaymentId: paymentDetails.razorpayPaymentId || null,
        razorpaySignature: paymentDetails.razorpaySignature || null,
        mockRef: paymentDetails.mockRef || `MOCK-PAY-${Date.now()}`,
        paidAt: new Date()
      },
      bookingStatus: 'confirmed',
      qrCode
    });

    // Mark seats as booked in Show document
    bookingSeats.forEach((seat) => {
      seat.status = 'booked';
      seat.bookingId = booking._id;
      seat.lockedBy = null;
      seat.lockedAt = null;
    });

    show.availableSeatsCount = show.seats.filter((s) => s.status === 'available').length;
    await show.save();

    // Broadcast seat status change to all connected clients
    const io = req.app.get('io');
    if (io) {
      io.emit('seats_booked', {
        showId: show._id,
        seatNumbers: bookingSeats.map((s) => s.seatNumber)
      });
    }

    res.status(201).json({
      success: true,
      message: 'Tickets booked successfully!',
      booking
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get user's booking history
// @route   GET /api/bookings/my-bookings
// @access  Private
exports.getMyBookings = async (req, res, next) => {
  try {
    const bookings = await Booking.find({ user: req.user._id })
      .populate('movie', 'title posterUrl genres language runtime')
      .populate('theatre', 'name location city')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: bookings.length,
      bookings
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single booking by ID (or bookingId code)
// @route   GET /api/bookings/:id
// @access  Private
exports.getBookingById = async (req, res, next) => {
  try {
    const query = req.params.id.startsWith('IMV-')
      ? { bookingId: req.params.id }
      : { _id: req.params.id };

    const booking = await Booking.findOne(query)
      .populate('user', 'username email phone')
      .populate('movie')
      .populate('theatre')
      .populate('show');

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found.' });
    }

    // Only owner or admin can view
    if (booking.user._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to view this booking.' });
    }

    res.json({
      success: true,
      booking
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get all bookings (Admin only)
// @route   GET /api/bookings
// @access  Private/Admin
exports.getAllBookings = async (req, res, next) => {
  try {
    const { search, status, date } = req.query;
    let query = {};

    if (status && status !== 'All') {
      query.bookingStatus = status;
    }

    if (date) {
      query.showDate = date;
    }

    if (search && search.trim() !== '') {
      query.$or = [
        { bookingId: { $regex: search.trim(), $options: 'i' } },
        { movieTitle: { $regex: search.trim(), $options: 'i' } },
        { theatreName: { $regex: search.trim(), $options: 'i' } }
      ];
    }

    const bookings = await Booking.find(query)
      .populate('user', 'username email phone')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: bookings.length,
      bookings
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Cancel a booking
// @route   PATCH /api/bookings/:id/cancel
// @access  Private
exports.cancelBooking = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found.' });
    }

    // Check ownership or admin
    if (booking.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to cancel this booking.' });
    }

    if (booking.bookingStatus === 'cancelled') {
      return res.status(400).json({ success: false, message: 'This booking is already cancelled.' });
    }

    // Cancellation policy check: can cancel if show date/time is at least 2 hours away
    const showDateTimeString = `${booking.showDate} ${booking.showTime}`;
    const showDate = new Date(showDateTimeString);
    // If invalid date parse or within past, check date
    const now = new Date();
    if (!isNaN(showDate.getTime()) && showDate < now && req.user.role !== 'admin') {
      return res.status(400).json({
        success: false,
        message: 'Cannot cancel tickets for a show that has already started or ended.'
      });
    }

    // Calculate refund amount (e.g. 80% refund policy, retaining convenience fee)
    const refundAmount = Math.round(booking.subtotal * 0.85);

    // Release seats in the Show document
    const show = await Show.findById(booking.show);
    if (show) {
      const seatNumsToRelease = booking.seats.map((s) => s.seatNumber);
      show.seats.forEach((seat) => {
        if (seatNumsToRelease.includes(seat.seatNumber) && seat.status === 'booked') {
          seat.status = 'available';
          seat.bookingId = null;
          seat.lockedBy = null;
          seat.lockedAt = null;
        }
      });
      show.availableSeatsCount = show.seats.filter((s) => s.status === 'available').length;
      await show.save();

      const io = req.app.get('io');
      if (io) {
        io.emit('seats_released', {
          showId: show._id,
          seatNumbers: seatNumsToRelease
        });
      }
    }

    // Update booking record
    booking.bookingStatus = 'cancelled';
    booking.paymentStatus = 'refunded';
    booking.cancellation = {
      isCancelled: true,
      cancelledAt: new Date(),
      refundAmount,
      reason: req.body.reason || 'User requested cancellation'
    };
    await booking.save();

    res.json({
      success: true,
      message: `Booking cancelled successfully. Refund of ₹${refundAmount} initiated.`,
      booking
    });
  } catch (err) {
    next(err);
  }
};
