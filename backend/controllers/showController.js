const Show = require('../models/Show');
const Movie = require('../models/Movie');
const Theatre = require('../models/Theatre');
const Booking = require('../models/Booking');

// @desc    Get all shows (with optional filtering by movie, theatre, date)
// @route   GET /api/shows
// @access  Public
exports.getAllShows = async (req, res, next) => {
  try {
    const { movie, theatre, date } = req.query;
    let query = { isActive: true };

    if (movie) query.movie = movie;
    if (theatre) query.theatre = theatre;
    if (date) query.showDate = date;

    const shows = await Show.find(query)
      .populate('movie', 'title posterUrl genres language runtime certification rating')
      .populate('theatre', 'name location city screenName seatConfiguration facilities')
      .select('-seats') // Don't send entire 80+ seat array for list view to keep it super fast
      .sort({ showDate: 1, showTime: 1 });

    res.json({
      success: true,
      count: shows.length,
      shows
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single show by ID (includes seat grid and auto-cleans expired locks)
// @route   GET /api/shows/:id
// @access  Public
exports.getShowById = async (req, res, next) => {
  try {
    const show = await Show.findById(req.params.id)
      .populate('movie')
      .populate('theatre');

    if (!show) {
      return res.status(404).json({
        success: false,
        message: 'Show not found.'
      });
    }

    // Auto-release expired locked seats (5 min duration)
    const lockDuration = Number(process.env.SEAT_LOCK_DURATION_MINUTES) || 5;
    const changed = show.releaseExpiredLocks(lockDuration);
    if (changed) {
      await show.save();
    }

    res.json({
      success: true,
      show
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Create a new show
// @route   POST /api/shows
// @access  Private/Admin
exports.createShow = async (req, res, next) => {
  try {
    const { movie, theatre, showDate, showTime, screenName, seatTiers } = req.body;

    if (!movie || !theatre || !showDate || !showTime) {
      return res.status(400).json({
        success: false,
        message: 'Movie, Theatre, Show Date, and Show Time are required.'
      });
    }

    // Verify movie exists
    const movieDoc = await Movie.findById(movie);
    if (!movieDoc) {
      return res.status(404).json({ success: false, message: 'Movie not found.' });
    }

    // Verify theatre exists
    const theatreDoc = await Theatre.findById(theatre);
    if (!theatreDoc) {
      return res.status(404).json({ success: false, message: 'Theatre not found.' });
    }

    // Check for duplicate / conflict
    const existing = await Show.findOne({ theatre, showDate, showTime });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: `A show is already scheduled at this theatre on ${showDate} at ${showTime}.`
      });
    }

    // Generate fresh seats from theatre seating layout
    const generatedSeats = Show.generateSeatsFromTheatre(theatreDoc, seatTiers);

    const show = await Show.create({
      movie,
      theatre,
      showDate,
      showTime,
      screenName: screenName || theatreDoc.screenName || 'Audi 1',
      seatTiers: seatTiers || {
        balcony: { price: theatreDoc.seatConfiguration.balcony.price },
        middle: { price: theatreDoc.seatConfiguration.middle.price },
        lower: { price: theatreDoc.seatConfiguration.lower.price }
      },
      seats: generatedSeats,
      totalSeats: generatedSeats.length,
      availableSeatsCount: generatedSeats.length
    });

    const populated = await Show.findById(show._id).populate('movie').populate('theatre');

    res.status(201).json({
      success: true,
      message: 'Show scheduled successfully.',
      show: populated
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update a show
// @route   PUT /api/shows/:id
// @access  Private/Admin
exports.updateShow = async (req, res, next) => {
  try {
    const { showDate, showTime, screenName, isActive } = req.body;
    const show = await Show.findById(req.params.id);

    if (!show) {
      return res.status(404).json({ success: false, message: 'Show not found.' });
    }

    if (showDate) show.showDate = showDate;
    if (showTime) show.showTime = showTime;
    if (screenName) show.screenName = screenName;
    if (isActive !== undefined) show.isActive = isActive;

    await show.save();

    const populated = await Show.findById(show._id).populate('movie').populate('theatre');

    res.json({
      success: true,
      message: 'Show updated successfully.',
      show: populated
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete a show
// @route   DELETE /api/shows/:id
// @access  Private/Admin
exports.deleteShow = async (req, res, next) => {
  try {
    const show = await Show.findById(req.params.id);
    if (!show) {
      return res.status(404).json({ success: false, message: 'Show not found.' });
    }

    // Check if any bookings exist for this show
    const bookingsCount = await Booking.countDocuments({ show: req.params.id, bookingStatus: 'confirmed' });
    if (bookingsCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete show because ${bookingsCount} confirmed bookings exist for it. Please cancel them or keep the show.`
      });
    }

    await Show.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Show deleted successfully.'
    });
  } catch (err) {
    next(err);
  }
};
