import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { MdMovie, MdSearch, MdFilterList, MdSort } from 'react-icons/md';
import API from '../services/api';
import MovieCard from '../components/MovieCard';
import LoadingSpinner from '../components/LoadingSpinner';

const genresList = ['All', 'Action', 'Sci-Fi', 'Drama', 'Adventure', 'Crime', 'Biography'];
const languagesList = ['All', 'English', 'Hindi', 'Telugu'];

const MoviesCatalogPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [genre, setGenre] = useState(searchParams.get('genre') || 'All');
  const [language, setLanguage] = useState(searchParams.get('language') || 'All');
  const [sortBy, setSortBy] = useState('rating');

  useEffect(() => {
    const fetchMovies = async () => {
      setLoading(true);
      try {
        const params = { sort: sortBy };
        if (search) params.search = search;
        if (genre !== 'All') params.genre = genre;
        if (language !== 'All') params.language = language;

        const res = await API.get('/movies', { params });
        if (res.data.success) {
          setMovies(res.data.movies);
        }
      } catch (err) {
        console.error('Failed to load movies:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchMovies();
  }, [search, genre, language, sortBy]);

  return (
    <div className="py-5">
      <div className="container">
        {/* Header */}
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4 pb-2 border-bottom border-secondary">
          <div>
            <h3 className="text-light fw-bold mb-1 d-flex align-items-center gap-2">
              <MdMovie className="text-danger" /> All Movies
            </h3>
            <p className="text-muted small mb-0">Browse our comprehensive catalog of blockbusters and timeless classics</p>
          </div>

          <div className="d-flex gap-2 align-items-center">
            <span className="text-muted small fw-bold">Sort by:</span>
            <select
              className="form-select form-select-sm cinema-input"
              style={{ width: '150px' }}
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="rating">Top Rated</option>
              <option value="releaseDate">Latest Release</option>
              <option value="title">Alphabetical (A-Z)</option>
            </select>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="cinema-glass-card p-3 mb-4">
          <div className="row g-2 align-items-center">
            <div className="col-md-5">
              <div className="input-group input-group-sm">
                <span className="input-group-text bg-dark border-secondary text-secondary">
                  <MdSearch />
                </span>
                <input
                  type="text"
                  className="form-control cinema-input border-secondary"
                  placeholder="Search movie title or actor..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>

            <div className="col-md-3">
              <select
                className="form-select form-select-sm cinema-input"
                value={genre}
                onChange={(e) => setGenre(e.target.value)}
              >
                <option value="All">All Genres</option>
                {genresList.filter((g) => g !== 'All').map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-md-3">
              <select
                className="form-select form-select-sm cinema-input"
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
              >
                <option value="All">All Languages</option>
                {languagesList.filter((l) => l !== 'All').map((l) => (
                  <option key={l} value={l}>
                    {l}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-md-1">
              <button
                type="button"
                className="btn btn-outline-secondary btn-sm w-100 text-light border-secondary"
                onClick={() => {
                  setSearch('');
                  setGenre('All');
                  setLanguage('All');
                  setSortBy('rating');
                }}
              >
                Reset
              </button>
            </div>
          </div>
        </div>

        {/* Movies Grid */}
        {loading ? (
          <LoadingSpinner text="Fetching movies catalog..." />
        ) : movies.length > 0 ? (
          <div className="row g-4">
            {movies.map((movie) => (
              <div key={movie._id} className="col-xl-3 col-lg-4 col-md-6 col-sm-6">
                <MovieCard movie={movie} />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-5 cinema-glass-card">
            <h5 className="text-light">No movies found matching your filters.</h5>
            <button
              className="btn btn-cinema-outline btn-sm mt-3"
              onClick={() => {
                setSearch('');
                setGenre('All');
                setLanguage('All');
              }}
            >
              Reset Filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MoviesCatalogPage;
