const mongoose = require('mongoose');

const movieSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Movie title is required'],
      trim: true,
      index: true
    },
    description: {
      type: String,
      required: [true, 'Movie description is required']
    },
    genres: {
      type: [String],
      required: [true, 'At least one genre is required'],
      index: true
    },
    language: {
      type: String,
      required: [true, 'Language is required'],
      trim: true,
      index: true
    },
    posterUrl: {
      type: String,
      required: [true, 'Poster URL is required']
    },
    bannerUrl: {
      type: String,
      default: ''
    },
    trailerUrl: {
      type: String,
      default: ''
    },
    releaseDate: {
      type: String,
      required: [true, 'Release date is required']
    },
    runtime: {
      type: Number, // in minutes
      required: [true, 'Runtime in minutes is required']
    },
    certification: {
      type: String,
      enum: ['U', 'U/A', 'A', 'PG', 'PG-13', 'R'],
      default: 'U/A'
    },
    rating: {
      type: Number,
      min: 0,
      max: 10,
      default: 8.0
    },
    votes: {
      type: Number,
      default: 1200
    },
    cast: {
      type: [String],
      default: []
    },
    director: {
      type: String,
      default: ''
    },
    isFeatured: {
      type: Boolean,
      default: false
    },
    isTrending: {
      type: Boolean,
      default: false
    },
    status: {
      type: String,
      enum: ['now_showing', 'coming_soon', 'ended'],
      default: 'now_showing',
      index: true
    }
  },
  {
    timestamps: true
  }
);

// Text index for search with language_override disabled
movieSchema.index({ title: 'text', description: 'text' }, { language_override: 'dummy_language_override' });

module.exports = mongoose.model('Movie', movieSchema);
