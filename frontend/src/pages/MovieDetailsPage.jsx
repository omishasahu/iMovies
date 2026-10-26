import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  MdStar,
  MdSchedule,
  MdLanguage,
  MdCalendarToday,
  MdFavorite,
  MdFavoriteBorder,
  MdPlayCircleOutline,
  MdArrowBack
} from 'react-icons/md';
import API from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';

const MovieDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, toggleWatchlist, isWatchlisted } = useAuth();

  const [movie, setMovie] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showTrailerModal, setShowTrailerModal] = useState(false);

  useEffect(() => {
    const fetchMovie = async () => {
      setLoading(true);
      try {
        const res = await API.get(`/movies/${id}`);
        if (res.data.success) {
          setMovie(res.data.movie);
        }
      } catch (err) {
        toast.error('Failed to load movie details.');
        navigate('/');
      } finally {
        setLoading(false);
      }
    };

    fetchMovie();
  }, [id, navigate]);

  if (loading) return <LoadingSpinner text="Loading movie details..." />;
  if (!movie) return null;

  const watchlisted = isWatchlisted(movie._id);

  const handleWatchlistToggle = async () => {
    if (!isAuthenticated) {
      toast.info('Please log in to add this movie to your watchlist.');
      navigate('/login');
      return;
    }
    try {
      const res = await toggleWatchlist(movie._id);
      if (res.success) {
        toast.success(res.message);
      }
    } catch (err) {
      toast.error('Failed to update watchlist.');
    }
  };

  // Convert YouTube standard watch URL to embed URL if needed
  const getEmbedUrl = (url) => {
    if (!url) return '';
    if (url.includes('embed')) return url;
    if (url.includes('youtube.com/watch?v=')) {
      return url.replace('watch?v=', 'embed/');
    }
    if (url.includes('youtu.be/')) {
      const id = url.split('youtu.be/')[1];
      return `https://www.youtube.com/embed/${id}`;
    }
    return url;
  };

  return (
    <div className="pb-5">
      {/* Backdrop Banner */}
      <div
        className="position-relative py-5"
        style={{
          backgroundImage: `linear-gradient(180deg, rgba(6, 9, 15, 0.75) 0%, rgba(6, 9, 15, 0.98) 100%), url(${
            movie.bannerUrl || movie.posterUrl
          })`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          minHeight: '440px'
        }}
      >
        <div className="container">
          <Link to="/" className="btn btn-outline-secondary btn-sm mb-4 d-inline-flex align-items-center gap-1 text-light border-secondary">
            <MdArrowBack /> Back to Movies
          </Link>

          <div className="row g-4 align-items-center">
            {/* Poster Column */}
            <div className="col-md-4 col-lg-3 text-center text-md-start">
              <img
                src={movie.posterUrl}
                alt={movie.title}
                className="rounded-3 shadow-lg border border-secondary"
                style={{ width: '100%', maxWidth: '280px', height: '390px', objectFit: 'cover' }}
              />
            </div>

            {/* Info Column */}
            <div className="col-md-8 col-lg-9">
              <div className="d-flex flex-wrap gap-2 mb-2">
                <span className="badge bg-danger px-3 py-1">{movie.certification}</span>
                <span className="badge bg-dark border border-secondary px-3 py-1">{movie.language}</span>
                {Array.isArray(movie.genres) &&
                  movie.genres.map((g) => (
                    <span key={g} className="badge bg-secondary px-3 py-1">
                      {g}
                    </span>
                  ))}
              </div>

              <h1 className="fw-bold text-light display-5 mb-2">{movie.title}</h1>

              {/* Rating & Stats Bar */}
              <div className="d-flex flex-wrap align-items-center gap-4 py-2 mb-3 text-muted">
                <div className="d-flex align-items-center gap-2">
                  <div className="d-flex align-items-center gap-1 text-warning fw-bold fs-5">
                    <MdStar size={24} /> {movie.rating ? Number(movie.rating).toFixed(1) : '8.0'}
                  </div>
                  <span className="small">({movie.votes ? movie.votes.toLocaleString() : '1,200'} votes)</span>
                </div>
                <div className="d-flex align-items-center gap-1">
                  <MdSchedule className="text-secondary" />
                  <span>{movie.runtime} minutes</span>
                </div>
                <div className="d-flex align-items-center gap-1">
                  <MdCalendarToday className="text-secondary" />
                  <span>Release: {movie.releaseDate}</span>
                </div>
              </div>

              {/* Synopsis */}
              <p className="text-light-50 fs-6 mb-4" style={{ maxWidth: '750px', lineHeight: '1.6' }}>
                {movie.description}
              </p>

              {/* CTAs */}
              <div className="d-flex flex-wrap gap-3 align-items-center">
                {movie.status !== 'coming_soon' ? (
                  <Link
                    to={`/booking/${movie._id}`}
                    className="btn btn-cinema-primary btn-lg px-4 d-flex align-items-center gap-2"
                  >
                    Book Tickets Now
                  </Link>
                ) : (
                  <button className="btn btn-secondary btn-lg px-4" disabled>
                    Coming Soon
                  </button>
                )}

                {movie.trailerUrl && (
                  <button
                    className="btn btn-cinema-outline btn-lg px-4 d-flex align-items-center gap-2"
                    onClick={() => setShowTrailerModal(true)}
                  >
                    <MdPlayCircleOutline size={22} className="text-danger" /> Watch Trailer
                  </button>
                )}

                <button
                  className={`btn ${
                    watchlisted ? 'btn-danger' : 'btn-outline-secondary text-light'
                  } btn-lg px-3 d-flex align-items-center gap-2`}
                  onClick={handleWatchlistToggle}
                >
                  {watchlisted ? <MdFavorite /> : <MdFavoriteBorder />}
                  {watchlisted ? 'Watchlisted' : 'Add to Watchlist'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Cast & Crew Section */}
      <div className="container mt-5">
        <div className="row g-4">
          <div className="col-lg-8">
            <div className="cinema-glass-card mb-4">
              <h4 className="text-light fw-bold mb-3 border-bottom border-secondary pb-2">
                Movie Details
              </h4>
              <div className="row g-3 mb-3">
                <div className="col-sm-6">
                  <span className="text-muted small d-block">DIRECTOR</span>
                  <strong className="text-light">{movie.director || 'Christopher Nolan'}</strong>
                </div>
                <div className="col-sm-6">
                  <span className="text-muted small d-block">RUN TIME</span>
                  <strong className="text-light">{movie.runtime} Minutes</strong>
                </div>
                <div className="col-sm-6">
                  <span className="text-muted small d-block">LANGUAGE</span>
                  <strong className="text-light">{movie.language}</strong>
                </div>
                <div className="col-sm-6">
                  <span className="text-muted small d-block">CERTIFICATION</span>
                  <strong className="text-light">{movie.certification} (Viewer Discretion)</strong>
                </div>
              </div>

              {movie.cast && movie.cast.length > 0 && (
                <div className="mt-4">
                  <span className="text-muted small d-block mb-2">TOP CAST</span>
                  <div className="d-flex flex-wrap gap-2">
                    {movie.cast.map((actor) => (
                      <span key={actor} className="badge bg-dark border border-secondary text-light px-3 py-2">
                        {actor}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="col-lg-4">
            <div className="cinema-glass-card text-center p-4">
              <h5 className="text-light fw-bold mb-3">Cinema Experience</h5>
              <p className="text-muted small mb-4">
                Watch <strong className="text-light">{movie.title}</strong> with ultimate surround sound, pristine 4K projection, and plush recliner seating at your nearest theatre.
              </p>
              {movie.status !== 'coming_soon' ? (
                <Link to={`/booking/${movie._id}`} className="btn btn-cinema-primary w-100 py-2">
                  Select Theatre & Showtimes
                </Link>
              ) : (
                <div className="badge bg-secondary p-2 w-100">Coming Soon to Theatres</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Trailer Modal */}
      {showTrailerModal && (
        <div
          className="modal fade show d-block"
          style={{ backgroundColor: 'rgba(0,0,0,0.85)' }}
          tabIndex="-1"
          onClick={() => setShowTrailerModal(false)}
        >
          <div
            className="modal-dialog modal-dialog-centered modal-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-content cinema-modal border border-secondary">
              <div className="modal-header">
                <h5 className="modal-title text-light fw-bold">{movie.title} – Official Trailer</h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setShowTrailerModal(false)}
                ></button>
              </div>
              <div className="modal-body p-0">
                <div className="ratio ratio-16x9">
                  <iframe
                    src={getEmbedUrl(movie.trailerUrl)}
                    title="Movie Trailer"
                    allowFullScreen
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  ></iframe>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MovieDetailsPage;
