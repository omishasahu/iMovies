const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema(
  {
    bookingId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
      index: true
    },
    movie: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Movie',
      required: [true, 'Movie reference is required']
    },
    theatre: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Theatre',
      required: [true, 'Theatre reference is required']
    },
    show: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Show',
      required: [true, 'Show reference is required'],
      index: true
    },
    // Snapshots of display data for reliable ticket generation even if original entity is modified
    movieTitle: {
      type: String,
      required: true
    },
    moviePoster: {
      type: String,
      default: ''
    },
    theatreName: {
      type: String,
      required: true
    },
    theatreLocation: {
      type: String,
      required: true
    },
    showDate: {
      type: String,
      required: true
    },
    showTime: {
      type: String,
      required: true
    },
    screenName: {
      type: String,
      default: 'Audi 1'
    },
    seats: [
      {
        seatNumber: { type: String, required: true },
        tier: { type: String, enum: ['balcony', 'middle', 'lower'], required: true },
        price: { type: Number, required: true }
      }
    ],
    ticketCount: {
      type: Number,
      required: true
    },
    subtotal: {
      type: Number,
      required: true
    },
    convenienceFee: {
      type: Number,
      default: 30
    },
    totalAmount: {
      type: Number,
      required: true
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'refunded'],
      default: 'pending',
      index: true
    },
    paymentMethod: {
      type: String,
      enum: ['razorpay', 'mock'],
      default: 'mock'
    },
    paymentDetails: {
      razorpayOrderId: { type: String, default: null },
      razorpayPaymentId: { type: String, default: null },
      razorpaySignature: { type: String, default: null },
      mockRef: { type: String, default: null },
      paidAt: { type: Date, default: null }
    },
    bookingStatus: {
      type: String,
      enum: ['confirmed', 'cancelled', 'pending', 'expired'],
      default: 'pending',
      index: true
    },
    qrCode: {
      type: String, // Data URI image
      default: ''
    },
    cancellation: {
      isCancelled: { type: Boolean, default: false },
      cancelledAt: { type: Date, default: null },
      refundAmount: { type: Number, default: 0 },
      reason: { type: String, default: '' }
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Booking', bookingSchema);
