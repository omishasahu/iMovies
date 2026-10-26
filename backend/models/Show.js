const mongoose = require('mongoose');

const seatSchema = new mongoose.Schema(
  {
    seatNumber: {
      type: String,
      required: true
    },
    row: {
      type: String,
      required: true
    },
    number: {
      type: Number,
      required: true
    },
    tier: {
      type: String,
      enum: ['balcony', 'middle', 'lower'],
      required: true
    },
    price: {
      type: Number,
      required: true
    },
    status: {
      type: String,
      enum: ['available', 'locked', 'booked'],
      default: 'available',
      index: true
    },
    lockedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    lockedAt: {
      type: Date,
      default: null
    },
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      default: null
    }
  },
  { _id: false }
);

const showSchema = new mongoose.Schema(
  {
    movie: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Movie',
      required: [true, 'Movie reference is required'],
      index: true
    },
    theatre: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Theatre',
      required: [true, 'Theatre reference is required'],
      index: true
    },
    showDate: {
      type: String, // Format: YYYY-MM-DD
      required: [true, 'Show date is required'],
      index: true
    },
    showTime: {
      type: String, // Format: e.g. "10:30 AM", "02:15 PM", "06:45 PM", "10:00 PM"
      required: [true, 'Show time is required']
    },
    screenName: {
      type: String,
      default: 'Audi 1'
    },
    seatTiers: {
      balcony: { price: { type: Number, default: 350 } },
      middle: { price: { type: Number, default: 250 } },
      lower: { price: { type: Number, default: 180 } }
    },
    seats: [seatSchema],
    totalSeats: {
      type: Number,
      default: 0
    },
    availableSeatsCount: {
      type: Number,
      default: 0
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

// Compound index to prevent exact duplicate show scheduling for the same theatre, date and time
showSchema.index({ theatre: 1, showDate: 1, showTime: 1 }, { unique: true });

// Static helper to generate seating layout based on theatre configuration
showSchema.statics.generateSeatsFromTheatre = function (theatre, customPricing = null) {
  const seats = [];
  const cfg = theatre.seatConfiguration || {
    balcony: { rows: 2, seatsPerRow: 10, price: 350 },
    middle: { rows: 4, seatsPerRow: 10, price: 250 },
    lower: { rows: 2, seatsPerRow: 10, price: 180 }
  };

  const rowLetters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let rowIndex = 0;

  // 1. Balcony (Top/Back)
  const bRows = cfg.balcony?.rows || 2;
  const bPer = cfg.balcony?.seatsPerRow || 10;
  const bPrice = customPricing?.balcony ?? (cfg.balcony?.price || 350);
  for (let r = 0; r < bRows; r++) {
    const rowChar = rowLetters[rowIndex++];
    for (let c = 1; c <= bPer; c++) {
      seats.push({
        seatNumber: `${rowChar}${c}`,
        row: rowChar,
        number: c,
        tier: 'balcony',
        price: bPrice,
        status: 'available',
        lockedBy: null,
        lockedAt: null,
        bookingId: null
      });
    }
  }

  // 2. Middle / Executive
  const mRows = cfg.middle?.rows || 4;
  const mPer = cfg.middle?.seatsPerRow || 10;
  const mPrice = customPricing?.middle ?? (cfg.middle?.price || 250);
  for (let r = 0; r < mRows; r++) {
    const rowChar = rowLetters[rowIndex++];
    for (let c = 1; c <= mPer; c++) {
      seats.push({
        seatNumber: `${rowChar}${c}`,
        row: rowChar,
        number: c,
        tier: 'middle',
        price: mPrice,
        status: 'available',
        lockedBy: null,
        lockedAt: null,
        bookingId: null
      });
    }
  }

  // 3. Lower / Classic
  const lRows = cfg.lower?.rows || 2;
  const lPer = cfg.lower?.seatsPerRow || 10;
  const lPrice = customPricing?.lower ?? (cfg.lower?.price || 180);
  for (let r = 0; r < lRows; r++) {
    const rowChar = rowLetters[rowIndex++];
    for (let c = 1; c <= lPer; c++) {
      seats.push({
        seatNumber: `${rowChar}${c}`,
        row: rowChar,
        number: c,
        tier: 'lower',
        price: lPrice,
        status: 'available',
        lockedBy: null,
        lockedAt: null,
        bookingId: null
      });
    }
  }

  return seats;
};

// Instance method to release expired locked seats
showSchema.methods.releaseExpiredLocks = function (lockDurationMinutes = 5) {
  const expiryThreshold = new Date(Date.now() - lockDurationMinutes * 60 * 1000);
  let changed = false;

  this.seats.forEach((seat) => {
    if (seat.status === 'locked' && seat.lockedAt && new Date(seat.lockedAt) < expiryThreshold) {
      seat.status = 'available';
      seat.lockedBy = null;
      seat.lockedAt = null;
      changed = true;
    }
  });

  if (changed) {
    this.availableSeatsCount = this.seats.filter((s) => s.status === 'available').length;
  }
  return changed;
};

module.exports = mongoose.model('Show', showSchema);
