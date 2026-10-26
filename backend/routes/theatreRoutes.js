const express = require('express');
const router = express.Router();
const {
  getAllTheatres,
  getTheatreById,
  createTheatre,
  updateTheatre,
  deleteTheatre
} = require('../controllers/theatreController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.get('/', getAllTheatres);
router.get('/:id', getTheatreById);

// Admin-only endpoints
router.post('/', protect, authorize('admin'), createTheatre);
router.put('/:id', protect, authorize('admin'), updateTheatre);
router.delete('/:id', protect, authorize('admin'), deleteTheatre);

module.exports = router;
