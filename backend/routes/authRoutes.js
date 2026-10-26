const express = require('express');
const router = express.Router();
const {
  register,
  login,
  getMe,
  toggleWatchlist,
  updateProfile
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const { authLimiter } = require('../middleware/rateLimiter');

router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);
router.get('/me', protect, getMe);
router.post('/watchlist/:movieId', protect, toggleWatchlist);
router.put('/profile', protect, updateProfile);

module.exports = router;
