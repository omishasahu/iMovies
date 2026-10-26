import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MdBookmarkBorder, MdDelete, MdMovie } from 'react-icons/md';
import API from '../services/api';
import MovieCard from '../components/MovieCard';
import LoadingSpinner from '../components/LoadingSpinner';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';

const WatchlistPage = () => {
  const { user, toggleWatchlist } = useAuth();
  const [watchlistMovies, setWatchlistMovies] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchWatchlist = async () => {
    try {
      const res = await API.get('/auth/me');
      if (res.data.success && res.data.user) {
        setWatchlistMovies(res.data.user.watchlist || []);
      }
    } catch (err) {
      toast.error('Failed to load watchlist.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWatchlist();
  }, []);

  const handleRemove = async (movieId) => {
    try {
      const res = await toggleWatchlist(movieId);
      if (res.success) {
        toast.success(res.message);
        setWatchlistMovies((prev) => prev.filter((m) => m._id !== movieId));
      }
    } catch (err) {
      toast.error('Failed to remove from watchlist.');
    }
  };

  if (loading) return <LoadingSpinner text="Loading your saved movies..." />;

  return (
    <div className="py-5">
      <div className="container">
        <div className="d-flex justify-content-between align-items-center mb-4 pb-2 border-bottom border-secondary">
          <div>
            <h3 className="text-light fw-bold mb-1 d-flex align-items-center gap-2">
              <MdBookmarkBorder className="text-danger" /> My Watchlist
            </h3>
            <p className="text-muted small mb-0">Movies you have bookmarked to watch later</p>
          </div>
          <span className="badge bg-secondary px-3 py-2">
            {watchlistMovies.length} Saved {watchlistMovies.length === 1 ? 'Movie' : 'Movies'}
          </span>
        </div>

        {watchlistMovies.length > 0 ? (
          <div className="row g-4">
            {watchlistMovies.map((movie) => (
              <div key={movie._id} className="col-xl-3 col-lg-4 col-md-6 col-sm-6">
                <div className="position-relative">
                  <MovieCard movie={movie} />
                  <button
                    type="button"
                    className="btn btn-dark btn-sm position-absolute text-danger border border-danger p-1"
                    style={{ bottom: '70px', right: '15px', zIndex: 10 }}
                    onClick={() => handleRemove(movie._id)}
                    title="Remove from Watchlist"
                  >
                    <MdDelete size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-5 cinema-glass-card">
            <MdBookmarkBorder size={52} className="text-secondary mb-3" />
            <h4 className="text-light">Your Watchlist is Empty</h4>
            <p className="text-muted small">
              Browse movies and click the heart icon to save movies you want to watch.
            </p>
            <Link to="/" className="btn btn-cinema-primary mt-2">
              <MdMovie className="me-1" /> Discover Movies
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default WatchlistPage;
