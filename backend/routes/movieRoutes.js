const express = require('express');
const router = express.Router();
const {
  getAllMovies,
  getMovieById,
  getFeaturedAndTrending,
  createMovie,
  updateMovie,
  deleteMovie
} = require('../controllers/movieController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.get('/featured-trending', getFeaturedAndTrending);
router.get('/', getAllMovies);
router.get('/:id', getMovieById);

// Admin-only endpoints
router.post('/', protect, authorize('admin'), createMovie);
router.put('/:id', protect, authorize('admin'), updateMovie);
router.delete('/:id', protect, authorize('admin'), deleteMovie);

module.exports = router;
