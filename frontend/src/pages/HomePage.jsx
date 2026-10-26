import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { MdSearch, MdLocalFireDepartment, MdMovie, MdStar, MdFilterList } from 'react-icons/md';
import { BiCameraMovie } from 'react-icons/bi';
import API from '../services/api';
import MovieCard from '../components/MovieCard';
import LoadingSpinner from '../components/LoadingSpinner';
import { useAuth } from '../context/AuthContext';

const genresList = ['All', 'Action', 'Sci-Fi', 'Drama', 'Adventure', 'Crime', 'Biography'];
const languagesList = ['All', 'English', 'Hindi', 'Telugu'];

const HomePage = () => {
  const { isAuthenticated } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const [movies, setMovies] = useState([]);
  const [featuredMovies, setFeaturedMovies] = useState([]);
  const [trendingMovies, setTrendingMovies] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters state
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [selectedGenre, setSelectedGenre] = useState(searchParams.get('genre') || 'All');
  const [selectedLanguage, setSelectedLanguage] = useState(searchParams.get('language') || 'All');

  // Sync state if URL query param changes
  useEffect(() => {
    const qSearch = searchParams.get('search') || '';
    const qGenre = searchParams.get('genre') || 'All';
    const qLanguage = searchParams.get('language') || 'All';
    setSearchTerm(qSearch);
    setSelectedGenre(qGenre);
    setSelectedLanguage(qLanguage);
  }, [searchParams]);

  // Fetch movies and featured
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const params = {};
        if (searchTerm) params.search = searchTerm;
        if (selectedGenre && selectedGenre !== 'All') params.genre = selectedGenre;
        if (selectedLanguage && selectedLanguage !== 'All') params.language = selectedLanguage;

        const [moviesRes, featRes] = await Promise.all([
          API.get('/movies', { params }),
          API.get('/movies/featured-trending')
        ]);

        if (moviesRes.data.success) {
          setMovies(moviesRes.data.movies);
        }
        if (featRes.data.success) {
          setFeaturedMovies(featRes.data.featured || []);
          setTrendingMovies(featRes.data.trending || []);
        }
      } catch (err) {
        console.error('Failed to load movies:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [searchTerm, selectedGenre, selectedLanguage]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const newParams = {};
    if (searchTerm.trim()) newParams.search = searchTerm.trim();
    if (selectedGenre !== 'All') newParams.genre = selectedGenre;
    if (selectedLanguage !== 'All') newParams.language = selectedLanguage;
    setSearchParams(newParams);
  };

  const handleGenreClick = (genre) => {
    setSelectedGenre(genre);
    const newParams = {};
    if (searchTerm.trim()) newParams.search = searchTerm.trim();
    if (genre !== 'All') newParams.genre = genre;
    if (selectedLanguage !== 'All') newParams.language = selectedLanguage;
    setSearchParams(newParams);
  };

  const nowShowingMovies = movies.filter((m) => m.status === 'now_showing');
  const comingSoonMovies = movies.filter((m) => m.status === 'coming_soon');

  return (
    <div>
      {/* Hero Section */}
      <section className="hero-section text-center text-light">
        <div className="container">
          <div className="d-inline-flex align-items-center gap-2 px-3 py-1 rounded-pill bg-danger bg-opacity-25 border border-danger border-opacity-50 text-danger-subtle small fw-bold mb-3">
            <BiCameraMovie /> Cinema Ticket Booking Made Simple
          </div>
          <h1 className="hero-title mb-3">
            Welcome to <span className="text-danger">iMovies</span>
          </h1>
          <p className="hero-subtitle mx-auto mb-4">
            Your ultimate destination for the latest blockbusters and timeless classics.
            Experience luxury reclining seats, Dolby Atmos surround sound, and instant QR tickets.
          </p>

          {/* Quick Sign In / Sign Up CTAs if not logged in */}
          {!isAuthenticated && (
            <div className="d-flex justify-content-center gap-3 mb-4">
              <Link to="/register" className="btn btn-cinema-primary btn-lg px-4">
                Get Started – Sign Up
              </Link>
              <Link to="/login" className="btn btn-cinema-outline btn-lg px-4">
                Sign In
              </Link>
            </div>
          )}

          {/* Search Box */}
          <div className="row justify-content-center mt-3">
            <div className="col-lg-7 col-md-9">
              <form onSubmit={handleSearchSubmit} className="cinema-glass-card p-2 d-flex gap-2">
                <div className="input-group">
                  <span className="input-group-text bg-transparent border-0 text-secondary ps-3">
                    <MdSearch size={22} />
                  </span>
                  <input
                    type="text"
                    className="form-control bg-transparent border-0 text-light shadow-none"
                    placeholder="Search movies by title, actor, or genre..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  {searchTerm && (
                    <button
                      type="button"
                      className="btn btn-sm btn-link text-muted"
                      onClick={() => {
                        setSearchTerm('');
                        setSearchParams({});
                      }}
                    >
                      Clear
                    </button>
                  )}
                </div>
                <button type="submit" className="btn btn-cinema-primary px-4 text-nowrap">
                  Find Movies
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* Featured & Trending Carousel/Strip */}
      {featuredMovies.length > 0 && !searchTerm && selectedGenre === 'All' && (
        <section className="py-4 border-bottom border-secondary" style={{ backgroundColor: '#090e1a' }}>
          <div className="container">
            <div className="d-flex align-items-center justify-content-between mb-3">
              <div className="d-flex align-items-center gap-2">
                <MdLocalFireDepartment className="text-danger fs-4" />
                <h4 className="fw-bold text-light mb-0">Trending Blockbusters</h4>
              </div>
              <span className="text-muted small">Handpicked for cinema lovers</span>
            </div>

            <div className="row g-3">
              {featuredMovies.slice(0, 4).map((movie) => (
                <div key={movie._id} className="col-lg-3 col-md-6 col-sm-6">
                  <div
                    className="position-relative rounded-3 overflow-hidden shadow-lg border border-secondary"
                    style={{ height: '180px' }}
                  >
                    <img
                      src={movie.bannerUrl || movie.posterUrl}
                      alt={movie.title}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                    <div
                      className="position-absolute bottom-0 start-0 end-0 p-3"
                      style={{
                        background: 'linear-gradient(0deg, rgba(6,9,15,0.95) 0%, rgba(6,9,15,0.2) 100%)'
                      }}
                    >
                      <div className="d-flex justify-content-between align-items-end">
                        <div>
                          <div className="badge bg-danger mb-1">{movie.language}</div>
                          <h6 className="text-light fw-bold mb-0 text-truncate">{movie.title}</h6>
                        </div>
                        <Link
                          to={`/booking/${movie._id}`}
                          className="btn btn-danger btn-sm px-3 py-1 shadow"
                        >
                          Book
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Main Catalog & Filter Section */}
      <section className="py-5">
        <div className="container">
          {/* Filter Bar */}
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4 pb-3 border-bottom border-secondary">
            {/* Genre Pills */}
            <div className="d-flex align-items-center gap-2 overflow-auto pb-2 pb-md-0">
              <span className="text-muted small fw-bold me-1 d-flex align-items-center gap-1">
                <MdFilterList /> Genre:
              </span>
              {genresList.map((g) => (
                <button
                  key={g}
                  type="button"
                  className={`btn btn-sm rounded-pill px-3 ${
                    selectedGenre === g
                      ? 'btn-danger shadow-sm'
                      : 'btn-outline-secondary text-light border-secondary'
                  }`}
                  onClick={() => handleGenreClick(g)}
                >
                  {g}
                </button>
              ))}
            </div>

            {/* Language Dropdown */}
            <div className="d-flex align-items-center gap-2 ms-md-auto">
              <span className="text-muted small fw-bold">Language:</span>
              <select
                className="form-select form-select-sm cinema-input py-1 pe-4"
                style={{ width: '140px' }}
                value={selectedLanguage}
                onChange={(e) => {
                  setSelectedLanguage(e.target.value);
                  const newParams = {};
                  if (searchTerm) newParams.search = searchTerm;
                  if (selectedGenre !== 'All') newParams.genre = selectedGenre;
                  if (e.target.value !== 'All') newParams.language = e.target.value;
                  setSearchParams(newParams);
                }}
              >
                {languagesList.map((lang) => (
                  <option key={lang} value={lang}>
                    {lang}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Active Search & Filter Indicators */}
          {(searchTerm || selectedGenre !== 'All' || selectedLanguage !== 'All') && (
            <div className="d-flex align-items-center gap-2 mb-4">
              <span className="text-secondary small">Filters active:</span>
              {searchTerm && (
                <span className="badge bg-secondary">
                  Search: "{searchTerm}"
                </span>
              )}
              {selectedGenre !== 'All' && (
                <span className="badge bg-danger">
                  Genre: {selectedGenre}
                </span>
              )}
              {selectedLanguage !== 'All' && (
                <span className="badge bg-info text-dark">
                  Language: {selectedLanguage}
                </span>
              )}
              <button
                className="btn btn-link btn-sm text-muted text-decoration-none p-0 ms-2"
                onClick={() => {
                  setSearchTerm('');
                  setSelectedGenre('All');
                  setSelectedLanguage('All');
                  setSearchParams({});
                }}
              >
                Reset all
              </button>
            </div>
          )}

          {/* Loading Indicator */}
          {loading ? (
            <LoadingSpinner text="Fetching cinema blockbusters..." />
          ) : (
            <>
              {/* Now Showing Grid */}
              <div className="mb-5">
                <div className="d-flex align-items-center justify-content-between mb-4">
                  <div>
                    <h3 className="fw-bold text-light mb-1 d-flex align-items-center gap-2">
                      <MdMovie className="text-danger" /> Now Showing
                    </h3>
                    <p className="text-muted small mb-0">Book your favorite seats right now</p>
                  </div>
                  <span className="badge bg-dark border border-secondary text-secondary px-3 py-2">
                    {nowShowingMovies.length} Movies Available
                  </span>
                </div>

                {nowShowingMovies.length > 0 ? (
                  <div className="row g-4">
                    {nowShowingMovies.map((movie) => (
                      <div key={movie._id} className="col-xl-3 col-lg-4 col-md-6 col-sm-6">
                        <MovieCard movie={movie} />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-5 cinema-glass-card">
                    <BiCameraMovie size={48} className="text-secondary mb-3" />
                    <h5 className="text-light">No movies match your search or filter.</h5>
                    <p className="text-muted small">Try adjusting your filters or search keywords.</p>
                    <button
                      className="btn btn-cinema-outline btn-sm"
                      onClick={() => {
                        setSearchTerm('');
                        setSelectedGenre('All');
                        setSelectedLanguage('All');
                        setSearchParams({});
                      }}
                    >
                      Clear Filters
                    </button>
                  </div>
                )}
              </div>

              {/* Coming Soon Section */}
              {comingSoonMovies.length > 0 && (
                <div className="mt-5 pt-4 border-top border-secondary">
                  <div className="mb-4">
                    <h3 className="fw-bold text-light mb-1">Coming Soon to iMovies</h3>
                    <p className="text-muted small mb-0">Get ready for upcoming cinema sensations</p>
                  </div>

                  <div className="row g-4">
                    {comingSoonMovies.map((movie) => (
                      <div key={movie._id} className="col-xl-3 col-lg-4 col-md-6 col-sm-6">
                        <MovieCard movie={movie} />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </div>
  );
};

export default HomePage;
