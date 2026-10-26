const User = require('../models/User');
const Movie = require('../models/Movie');
const Theatre = require('../models/Theatre');
const Show = require('../models/Show');
const Booking = require('../models/Booking');

// @desc    Get Admin Dashboard Stats & Metrics
// @route   GET /api/admin/stats
// @access  Private/Admin
exports.getDashboardStats = async (req, res, next) => {
  try {
    const [
      totalUsers,
      totalMovies,
      totalTheatres,
      totalShows,
      totalBookings,
      recentBookings,
      revenueResult
    ] = await Promise.all([
      User.countDocuments(),
      Movie.countDocuments(),
      Theatre.countDocuments(),
      Show.countDocuments(),
      Booking.countDocuments(),
      Booking.find().sort({ createdAt: -1 }).limit(8).populate('user', 'username email'),
      Booking.aggregate([
        { $match: { bookingStatus: 'confirmed', paymentStatus: 'completed' } },
        { $group: { _id: null, totalRevenue: { $sum: '$totalAmount' }, totalTickets: { $sum: '$ticketCount' } } }
      ])
    ]);

    const totalRevenue = revenueResult[0]?.totalRevenue || 0;
    const totalTicketsSold = revenueResult[0]?.totalTickets || 0;

    // Monthly revenue breakdown for charts
    const monthlyRevenue = await Booking.aggregate([
      { $match: { bookingStatus: 'confirmed', paymentStatus: 'completed' } },
      {
        $group: {
          _id: { $substr: ['$createdAt', 0, 7] }, // YYYY-MM
          revenue: { $sum: '$totalAmount' },
          bookingsCount: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } },
      { $limit: 6 }
    ]);

    // Top movies by bookings
    const topMovies = await Booking.aggregate([
      { $match: { bookingStatus: 'confirmed' } },
      {
        $group: {
          _id: '$movieTitle',
          totalBookings: { $sum: 1 },
          ticketsSold: { $sum: '$ticketCount' },
          revenue: { $sum: '$totalAmount' }
        }
      },
      { $sort: { ticketsSold: -1 } },
      { $limit: 5 }
    ]);

    res.json({
      success: true,
      stats: {
        totalUsers,
        totalMovies,
        totalTheatres,
        totalShows,
        totalBookings,
        totalRevenue,
        totalTicketsSold
      },
      recentBookings,
      monthlyRevenue,
      topMovies
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get all users (Admin only)
// @route   GET /api/admin/users
// @access  Private/Admin
exports.getAllUsers = async (req, res, next) => {
  try {
    const { search, role } = req.query;
    let query = {};

    if (role && role !== 'All') {
      query.role = role;
    }

    if (search && search.trim() !== '') {
      query.$or = [
        { username: { $regex: search.trim(), $options: 'i' } },
        { email: { $regex: search.trim(), $options: 'i' } }
      ];
    }

    const users = await User.find(query).select('-password').sort({ createdAt: -1 });

    res.json({
      success: true,
      count: users.length,
      users
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update user role
// @route   PUT /api/admin/users/:id/role
// @access  Private/Admin
exports.updateUserRole = async (req, res, next) => {
  try {
    const { role } = req.body;
    if (!['user', 'admin'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role.' });
    }

    // Prevent removing own admin privileges
    if (req.user._id.toString() === req.params.id && role !== 'admin') {
      return res.status(400).json({
        success: false,
        message: 'You cannot revoke your own admin rights.'
      });
    }

    const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true }).select('-password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    res.json({
      success: true,
      message: `User role updated to ${role}.`,
      user
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete user
// @route   DELETE /api/admin/users/:id
// @access  Private/Admin
exports.deleteUser = async (req, res, next) => {
  try {
    if (req.user._id.toString() === req.params.id) {
      return res.status(400).json({
        success: false,
        message: 'You cannot delete your own admin account.'
      });
    }

    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    res.json({
      success: true,
      message: 'User deleted successfully.'
    });
  } catch (err) {
    next(err);
  }
};
