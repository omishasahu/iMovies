const mongoose = require('mongoose');

const theatreSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Theatre name is required'],
      trim: true
    },
    location: {
      type: String,
      required: [true, 'Location is required'],
      trim: true
    },
    city: {
      type: String,
      required: [true, 'City is required'],
      default: 'Mumbai',
      trim: true
    },
    address: {
      type: String,
      default: ''
    },
    screenName: {
      type: String,
      default: 'Audi 1'
    },
    seatingCapacity: {
      type: Number,
      required: [true, 'Total seating capacity is required']
    },
    seatConfiguration: {
      balcony: {
        rows: { type: Number, default: 2 },
        seatsPerRow: { type: Number, default: 10 },
        price: { type: Number, default: 350 },
        label: { type: String, default: 'Balcony (Premium Recliner)' }
      },
      middle: {
        rows: { type: Number, default: 4 },
        seatsPerRow: { type: Number, default: 10 },
        price: { type: Number, default: 250 },
        label: { type: String, default: 'Executive (Middle Class)' }
      },
      lower: {
        rows: { type: Number, default: 2 },
        seatsPerRow: { type: Number, default: 10 },
        price: { type: Number, default: 180 },
        label: { type: String, default: 'Classic (Lower Tier)' }
      }
    },
    facilities: {
      type: [String],
      default: ['Dolby Atmos 7.1', '4K Projection', 'Food & Beverages', 'Wheelchair Accessible', 'Parking']
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

module.exports = mongoose.model('Theatre', theatreSchema);
