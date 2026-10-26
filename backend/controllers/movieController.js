const Movie = require('../models/Movie');
const Show = require('../models/Show');

// @desc    Get all movies with search, filter, and pagination
// @route   GET /api/movies
// @access  Public
exports.getAllMovies = async (req, res, next) => {
  try {
    const { search, genre, language, status, sort } = req.query;
    let query = {};

    if (search && search.trim() !== '') {
      query.$or = [
        { title: { $regex: search.trim(), $options: 'i' } },
        { description: { $regex: search.trim(), $options: 'i' } },
        { language: { $regex: search.trim(), $options: 'i' } }
      ];
    }

    if (genre && genre !== 'All') {
      query.genres = { $in: [new RegExp(`^${genre.trim()}$`, 'i')] };
    }

    if (language && language !== 'All') {
      query.language = { $regex: `^${language.trim()}$`, $options: 'i' };
    }

    if (status && status !== 'All') {
      query.status = status;
    }

    let sortOption = { releaseDate: -1 };
    if (sort === 'rating') sortOption = { rating: -1 };
    if (sort === 'title') sortOption = { title: 1 };
    if (sort === 'releaseDate') sortOption = { releaseDate: -1 };

    const movies = await Movie.find(query).sort(sortOption);

    // Get distinct genres and languages for frontend filter dropdowns
    const genresList = await Movie.distinct('genres');
    const languagesList = await Movie.distinct('language');

    res.json({
      success: true,
      count: movies.length,
      genresList,
      languagesList,
      movies
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single movie by ID
// @route   GET /api/movies/:id
// @access  Public
exports.getMovieById = async (req, res, next) => {
  try {
    const movie = await Movie.findById(req.params.id);
    if (!movie) {
      return res.status(404).json({
        success: false,
        message: 'Movie not found.'
      });
    }

    res.json({
      success: true,
      movie
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get featured & trending movies
// @route   GET /api/movies/featured-trending
// @access  Public
exports.getFeaturedAndTrending = async (req, res, next) => {
  try {
    const featured = await Movie.find({ isFeatured: true, status: 'now_showing' }).limit(6);
    const trending = await Movie.find({ isTrending: true }).sort({ rating: -1 }).limit(6);

    res.json({
      success: true,
      featured,
      trending
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Create a movie
// @route   POST /api/movies
// @access  Private/Admin
exports.createMovie = async (req, res, next) => {
  try {
    const {
      title,
      description,
      genres,
      language,
      posterUrl,
      bannerUrl,
      trailerUrl,
      releaseDate,
      runtime,
      certification,
      rating,
      cast,
      director,
      isFeatured,
      isTrending,
      status
    } = req.body;

    if (!title || !description || !genres || !language || !posterUrl || !releaseDate || !runtime) {
      return res.status(400).json({
        success: false,
        message: 'Please fill in all required fields (title, description, genres, language, posterUrl, releaseDate, runtime).'
      });
    }

    const formattedGenres = Array.isArray(genres)
      ? genres
      : genres.split(',').map((g) => g.trim()).filter(Boolean);

    const formattedCast = Array.isArray(cast)
      ? cast
      : typeof cast === 'string'
      ? cast.split(',').map((c) => c.trim()).filter(Boolean)
      : [];

    const movie = await Movie.create({
      title: title.trim(),
      description: description.trim(),
      genres: formattedGenres,
      language: language.trim(),
      posterUrl: posterUrl.trim(),
      bannerUrl: bannerUrl ? bannerUrl.trim() : posterUrl.trim(),
      trailerUrl: trailerUrl ? trailerUrl.trim() : '',
      releaseDate: releaseDate.trim(),
      runtime: Number(runtime),
      certification: certification || 'U/A',
      rating: rating ? Number(rating) : 8.0,
      cast: formattedCast,
      director: director ? director.trim() : '',
      isFeatured: !!isFeatured,
      isTrending: !!isTrending,
      status: status || 'now_showing'
    });

    res.status(201).json({
      success: true,
      message: 'Movie created successfully.',
      movie
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update a movie
// @route   PUT /api/movies/:id
// @access  Private/Admin
exports.updateMovie = async (req, res, next) => {
  try {
    let movie = await Movie.findById(req.params.id);
    if (!movie) {
      return res.status(404).json({
        success: false,
        message: 'Movie not found.'
      });
    }

    const updateData = { ...req.body };
    if (updateData.genres && typeof updateData.genres === 'string') {
      updateData.genres = updateData.genres.split(',').map((g) => g.trim()).filter(Boolean);
    }
    if (updateData.cast && typeof updateData.cast === 'string') {
      updateData.cast = updateData.cast.split(',').map((c) => c.trim()).filter(Boolean);
    }

    movie = await Movie.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true
    });

    res.json({
      success: true,
      message: 'Movie updated successfully.',
      movie
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete a movie
// @route   DELETE /api/movies/:id
// @access  Private/Admin
exports.deleteMovie = async (req, res, next) => {
  try {
    const movie = await Movie.findById(req.params.id);
    if (!movie) {
      return res.status(404).json({
        success: false,
        message: 'Movie not found.'
      });
    }

    // Check if there are active shows scheduled for this movie
    const activeShowsCount = await Show.countDocuments({ movie: req.params.id });
    if (activeShowsCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete movie because it has ${activeShowsCount} scheduled shows. Please delete or reassign those shows first.`
      });
    }

    await Movie.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Movie deleted successfully.'
    });
  } catch (err) {
    next(err);
  }
};
