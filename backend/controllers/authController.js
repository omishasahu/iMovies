const jwt = require('jsonwebtoken');
const User = require('../models/User');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'imovies_super_secret_jwt_key_2026_cinema_hub_xyz', {
    expiresIn: process.env.JWT_EXPIRE || '7d'
  });
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res, next) => {
  try {
    const { username, email, password, confirmPassword, phone } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide username, email, and password.'
      });
    }

    if (confirmPassword && password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Passwords do not match.'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long.'
      });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email address already exists.'
      });
    }

    // Default to 'user'. First registered user or seed will be admin if specified.
    const user = await User.create({
      username: username.trim(),
      email: email.toLowerCase().trim(),
      password,
      phone: phone || '',
      role: 'user'
    });

    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      message: 'Account registered successfully.',
      token,
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        phone: user.phone,
        watchlist: user.watchlist
      }
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please enter both email and password.'
      });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
    }

    const token = generateToken(user._id);

    res.json({
      success: true,
      message: 'Login successful.',
      token,
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        phone: user.phone,
        watchlist: user.watchlist
      }
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).populate('watchlist');
    res.json({
      success: true,
      user
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Toggle movie in watchlist
// @route   POST /api/auth/watchlist/:movieId
// @access  Private
exports.toggleWatchlist = async (req, res, next) => {
  try {
    const { movieId } = req.params;
    const user = await User.findById(req.user._id);

    const exists = user.watchlist.some((id) => id.toString() === movieId);
    if (exists) {
      user.watchlist = user.watchlist.filter((id) => id.toString() !== movieId);
    } else {
      user.watchlist.push(movieId);
    }

    await user.save();
    const updated = await User.findById(req.user._id).populate('watchlist');

    res.json({
      success: true,
      isWatchlisted: !exists,
      message: !exists ? 'Added to watchlist.' : 'Removed from watchlist.',
      watchlist: updated.watchlist
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update profile
// @route   PUT /api/auth/profile
// @access  Private
exports.updateProfile = async (req, res, next) => {
  try {
    const { username, phone } = req.body;
    const user = await User.findById(req.user._id);

    if (username) user.username = username.trim();
    if (phone !== undefined) user.phone = phone.trim();

    await user.save();

    res.json({
      success: true,
      message: 'Profile updated successfully.',
      user
    });
  } catch (err) {
    next(err);
  }
};
