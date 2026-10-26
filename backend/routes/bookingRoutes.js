const express = require('express');
const router = express.Router();
const {
  lockSeats,
  releaseSeats,
  createBooking,
  getMyBookings,
  getBookingById,
  getAllBookings,
  cancelBooking
} = require('../controllers/bookingController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.post('/lock-seats', protect, lockSeats);
router.post('/release-seats', protect, releaseSeats);
router.post('/', protect, createBooking);
router.get('/my-bookings', protect, getMyBookings);
router.get('/', protect, authorize('admin'), getAllBookings);
router.get('/:id', protect, getBookingById);
router.patch('/:id/cancel', protect, cancelBooking);

module.exports = router;
