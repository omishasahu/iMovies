const express = require('express');
const router = express.Router();
const {
  getAllShows,
  getShowById,
  createShow,
  updateShow,
  deleteShow
} = require('../controllers/showController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.get('/', getAllShows);
router.get('/:id', getShowById);

// Admin-only endpoints
router.post('/', protect, authorize('admin'), createShow);
router.put('/:id', protect, authorize('admin'), updateShow);
router.delete('/:id', protect, authorize('admin'), deleteShow);

module.exports = router;
