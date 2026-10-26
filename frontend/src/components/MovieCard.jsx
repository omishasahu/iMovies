import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MdStar, MdFavorite, MdFavoriteBorder, MdSchedule, MdLanguage } from 'react-icons/md';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';

const fallbackPoster = 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=600&q=80';

const MovieCard = ({ movie }) => {
  const { isAuthenticated, toggleWatchlist, isWatchlisted } = useAuth();
  const navigate = useNavigate();
  const [imgSrc, setImgSrc] = useState(movie.posterUrl || fallbackPoster);
  const [watchlistLoading, setWatchlistLoading] = useState(false);

  const watchlisted = isWatchlisted(movie._id);

  const handleWatchlistClick = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) {
      toast.info('Please log in to add movies to your watchlist.');
      navigate('/login');
      return;
    }
    setWatchlistLoading(true);
    try {
      const res = await toggleWatchlist(movie._id);
      if (res.success) {
        toast.success(res.message);
      }
    } catch (err) {
      toast.error('Failed to update watchlist.');
    } finally {
      setWatchlistLoading(false);
    }
  };

  return (
    <div className="movie-card">
      <div className="movie-poster-wrap">
        <img
          src={imgSrc}
          alt={movie.title}
          className="movie-poster-img"
          onError={() => setImgSrc(fallbackPoster)}
          loading="lazy"
        />

        {/* Watchlist Bookmark Icon */}
        <button
          type="button"
          className={`watchlist-btn-overlay ${watchlisted ? 'active' : ''}`}
          onClick={handleWatchlistClick}
          disabled={watchlistLoading}
          title={watchlisted ? 'Remove from Watchlist' : 'Add to Watchlist'}
        >
          {watchlisted ? <MdFavorite color="#fff" size={18} /> : <MdFavoriteBorder size={18} />}
        </button>

        {/* Certification Badge */}
        {movie.certification && (
          <div className="movie-cert-badge">{movie.certification}</div>
        )}

        {/* Rating Badge */}
        <div className="movie-rating-badge">
          <MdStar color="#f59e0b" size={16} />
          <span>{movie.rating ? Number(movie.rating).toFixed(1) : '8.0'}</span>
          <span className="text-muted small" style={{ fontSize: '0.7rem' }}>/10</span>
        </div>
      </div>

      <div className="p-3 d-flex flex-column flex-grow-1 justify-content-between">
        <div>
          {/* Language & Runtime Bar */}
          <div className="d-flex justify-content-between align-items-center mb-1 text-muted small">
            <span className="d-flex align-items-center gap-1">
              <MdLanguage size={14} className="text-secondary" />
              <strong className="text-light">{movie.language}</strong>
            </span>
            <span className="d-flex align-items-center gap-1">
              <MdSchedule size={14} className="text-secondary" />
              <span>{movie.runtime}m</span>
            </span>
          </div>

          {/* Title */}
          <h5 className="text-light fw-bold mb-1 text-truncate" title={movie.title}>
            <Link to={`/movies/${movie._id}`} className="text-decoration-none text-light hover-danger">
              {movie.title}
            </Link>
          </h5>

          {/* Genres */}
          <div className="text-muted small text-truncate mb-3">
            {Array.isArray(movie.genres) ? movie.genres.join(' • ') : movie.genres}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="d-flex gap-2 pt-2 border-top border-secondary">
          <Link
            to={`/movies/${movie._id}`}
            className="btn btn-cinema-outline btn-sm flex-grow-1 text-center py-2"
          >
            Details
          </Link>
          {movie.status !== 'coming_soon' ? (
            <Link
              to={`/booking/${movie._id}`}
              className="btn btn-cinema-primary btn-sm flex-grow-1 text-center py-2"
            >
              Book Tickets
            </Link>
          ) : (
            <button className="btn btn-secondary btn-sm flex-grow-1 py-2" disabled>
              Coming Soon
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default MovieCard;
