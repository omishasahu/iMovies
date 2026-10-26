import React, { useState, useEffect } from 'react';
import {
  MdAdd,
  MdEdit,
  MdDelete,
  MdSearch,
  MdStar,
  MdSchedule,
  MdClose,
  MdMovie
} from 'react-icons/md';
import API from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import { toast } from 'react-toastify';

const initialMovieForm = {
  title: '',
  description: '',
  genres: '',
  language: 'English',
  posterUrl: '',
  bannerUrl: '',
  trailerUrl: '',
  releaseDate: '',
  runtime: 120,
  certification: 'U/A',
  rating: 8.0,
  director: '',
  cast: '',
  isFeatured: false,
  isTrending: false,
  status: 'now_showing'
};

const AdminMoviesPage = () => {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMovieId, setEditingMovieId] = useState(null);
  const [formData, setFormData] = useState(initialMovieForm);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const fetchMovies = async () => {
    try {
      const res = await API.get('/movies');
      if (res.data.success) {
        setMovies(res.data.movies);
      }
    } catch (err) {
      toast.error('Failed to load movies.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMovies();
  }, []);

  const handleOpenAdd = () => {
    setEditingMovieId(null);
    setFormData(initialMovieForm);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (movie) => {
    setEditingMovieId(movie._id);
    setFormData({
      title: movie.title,
      description: movie.description,
      genres: Array.isArray(movie.genres) ? movie.genres.join(', ') : movie.genres,
      language: movie.language,
      posterUrl: movie.posterUrl,
      bannerUrl: movie.bannerUrl || '',
      trailerUrl: movie.trailerUrl || '',
      releaseDate: movie.releaseDate,
      runtime: movie.runtime,
      certification: movie.certification || 'U/A',
      rating: movie.rating || 8.0,
      director: movie.director || '',
      cast: Array.isArray(movie.cast) ? movie.cast.join(', ') : '',
      isFeatured: !!movie.isFeatured,
      isTrending: !!movie.isTrending,
      status: movie.status || 'now_showing'
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.title || !formData.description || !formData.genres || !formData.posterUrl || !formData.releaseDate) {
      toast.warn('Please complete all required fields.');
      return;
    }

    setSubmitting(true);
    try {
      if (editingMovieId) {
        const res = await API.put(`/movies/${editingMovieId}`, formData);
        if (res.data.success) {
          toast.success('Movie updated successfully!');
        }
      } else {
        const res = await API.post('/movies', formData);
        if (res.data.success) {
          toast.success('New movie created successfully!');
        }
      }
      setIsModalOpen(false);
      fetchMovies();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save movie.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this movie? This action cannot be undone.')) {
      return;
    }

    setDeletingId(id);
    try {
      const res = await API.delete(`/movies/${id}`);
      if (res.data.success) {
        toast.success(res.data.message);
        fetchMovies();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Cannot delete movie with active shows.');
    } finally {
      setDeletingId(null);
    }
  };

  const filteredMovies = movies.filter(
    (m) =>
      m.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.language.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <LoadingSpinner text="Loading cinema catalog..." />;

  return (
    <div>
      {/* Top Header */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4 pb-2 border-bottom border-secondary">
        <div>
          <h3 className="text-light fw-bold mb-1 d-flex align-items-center gap-2">
            <MdMovie className="text-danger" /> Movie Management
          </h3>
          <p className="text-muted small mb-0">Create, edit, or remove movies from the iMovies theater directory</p>
        </div>

        <div className="d-flex gap-2">
          <div className="input-group input-group-sm" style={{ width: '220px' }}>
            <span className="input-group-text bg-dark border-secondary text-secondary">
              <MdSearch />
            </span>
            <input
              type="text"
              className="form-control cinema-input border-secondary"
              placeholder="Search title..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button className="btn btn-cinema-primary btn-sm d-flex align-items-center gap-1" onClick={handleOpenAdd}>
            <MdAdd size={18} /> Add Movie
          </button>
        </div>
      </div>

      {/* Movies Table */}
      <div className="cinema-glass-card p-0 overflow-hidden">
        <div className="table-responsive">
          <table className="table cinema-table mb-0">
            <thead>
              <tr>
                <th>Poster</th>
                <th>Title & Info</th>
                <th>Language</th>
                <th>Certification</th>
                <th>Rating</th>
                <th>Status</th>
                <th className="text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredMovies.map((m) => (
                <tr key={m._id}>
                  <td style={{ width: '65px' }}>
                    <img
                      src={m.posterUrl}
                      alt={m.title}
                      className="rounded"
                      style={{ width: '45px', height: '62px', objectFit: 'cover' }}
                      onError={(e) => {
                        e.target.src =
                          'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=100&q=80';
                      }}
                    />
                  </td>
                  <td>
                    <div className="fw-bold text-light">{m.title}</div>
                    <div className="text-muted small">
                      {Array.isArray(m.genres) ? m.genres.join(', ') : m.genres} • {m.runtime}m
                    </div>
                  </td>
                  <td>
                    <span className="badge bg-dark border border-secondary text-light">{m.language}</span>
                  </td>
                  <td>
                    <span className="badge bg-danger">{m.certification}</span>
                  </td>
                  <td>
                    <div className="d-flex align-items-center gap-1 text-warning fw-bold small">
                      <MdStar /> {m.rating}
                    </div>
                  </td>
                  <td>
                    <span
                      className={`badge ${
                        m.status === 'now_showing' ? 'bg-success' : 'bg-secondary'
                      }`}
                    >
                      {m.status === 'now_showing' ? 'Now Showing' : 'Coming Soon'}
                    </span>
                  </td>
                  <td className="text-end">
                    <div className="d-flex justify-content-end gap-1">
                      <button
                        className="btn btn-outline-info btn-sm p-1 px-2"
                        onClick={() => handleOpenEdit(m)}
                        title="Edit movie"
                      >
                        <MdEdit size={16} />
                      </button>
                      <button
                        className="btn btn-outline-danger btn-sm p-1 px-2"
                        onClick={() => handleDelete(m._id)}
                        disabled={deletingId === m._id}
                        title="Delete movie"
                      >
                        <MdDelete size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Movie Modal */}
      {isModalOpen && (
        <div
          className="modal fade show d-block"
          style={{ backgroundColor: 'rgba(0,0,0,0.85)' }}
          tabIndex="-1"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="modal-dialog modal-dialog-centered modal-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-content cinema-modal border border-secondary">
              <div className="modal-header">
                <h5 className="modal-title text-light fw-bold">
                  {editingMovieId ? 'Edit Movie Details' : 'Add New Movie to Catalog'}
                </h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setIsModalOpen(false)}
                ></button>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="modal-body p-4">
                  <div className="row g-3">
                    {/* Title */}
                    <div className="col-md-8">
                      <label className="form-label text-muted small fw-semibold">Movie Title *</label>
                      <input
                        type="text"
                        className="form-control cinema-input"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        required
                      />
                    </div>

                    {/* Language */}
                    <div className="col-md-4">
                      <label className="form-label text-muted small fw-semibold">Language *</label>
                      <input
                        type="text"
                        className="form-control cinema-input"
                        placeholder="e.g. English, Hindi"
                        value={formData.language}
                        onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                        required
                      />
                    </div>

                    {/* Description */}
                    <div className="col-12">
                      <label className="form-label text-muted small fw-semibold">Synopsis / Description *</label>
                      <textarea
                        className="form-control cinema-input"
                        rows="3"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        required
                      ></textarea>
                    </div>

                    {/* Genres */}
                    <div className="col-md-6">
                      <label className="form-label text-muted small fw-semibold">Genres (comma-separated) *</label>
                      <input
                        type="text"
                        className="form-control cinema-input"
                        placeholder="Action, Sci-Fi, Thriller"
                        value={formData.genres}
                        onChange={(e) => setFormData({ ...formData, genres: e.target.value })}
                        required
                      />
                    </div>

                    {/* Certification */}
                    <div className="col-md-3">
                      <label className="form-label text-muted small fw-semibold">Certification</label>
                      <select
                        className="form-select cinema-input"
                        value={formData.certification}
                        onChange={(e) => setFormData({ ...formData, certification: e.target.value })}
                      >
                        <option value="U">U (Universal)</option>
                        <option value="U/A">U/A (12+)</option>
                        <option value="A">A (Adult 18+)</option>
                        <option value="PG-13">PG-13</option>
                        <option value="R">R</option>
                      </select>
                    </div>

                    {/* Runtime */}
                    <div className="col-md-3">
                      <label className="form-label text-muted small fw-semibold">Runtime (Minutes) *</label>
                      <input
                        type="number"
                        className="form-control cinema-input"
                        value={formData.runtime}
                        onChange={(e) => setFormData({ ...formData, runtime: Number(e.target.value) })}
                        required
                      />
                    </div>

                    {/* Poster URL */}
                    <div className="col-md-6">
                      <label className="form-label text-muted small fw-semibold">Poster Image URL *</label>
                      <input
                        type="url"
                        className="form-control cinema-input"
                        placeholder="https://..."
                        value={formData.posterUrl}
                        onChange={(e) => setFormData({ ...formData, posterUrl: e.target.value })}
                        required
                      />
                    </div>

                    {/* Banner URL */}
                    <div className="col-md-6">
                      <label className="form-label text-muted small fw-semibold">Banner Backdrop URL</label>
                      <input
                        type="url"
                        className="form-control cinema-input"
                        placeholder="https://..."
                        value={formData.bannerUrl}
                        onChange={(e) => setFormData({ ...formData, bannerUrl: e.target.value })}
                      />
                    </div>

                    {/* Trailer URL */}
                    <div className="col-md-6">
                      <label className="form-label text-muted small fw-semibold">YouTube Trailer URL</label>
                      <input
                        type="url"
                        className="form-control cinema-input"
                        placeholder="https://youtube.com/watch?v=..."
                        value={formData.trailerUrl}
                        onChange={(e) => setFormData({ ...formData, trailerUrl: e.target.value })}
                      />
                    </div>

                    {/* Release Date */}
                    <div className="col-md-6">
                      <label className="form-label text-muted small fw-semibold">Release Date *</label>
                      <input
                        type="date"
                        className="form-control cinema-input"
                        value={formData.releaseDate}
                        onChange={(e) => setFormData({ ...formData, releaseDate: e.target.value })}
                        required
                      />
                    </div>

                    {/* Rating & Director */}
                    <div className="col-md-4">
                      <label className="form-label text-muted small fw-semibold">Critic Rating (0 - 10)</label>
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        max="10"
                        className="form-control cinema-input"
                        value={formData.rating}
                        onChange={(e) => setFormData({ ...formData, rating: Number(e.target.value) })}
                      />
                    </div>

                    <div className="col-md-4">
                      <label className="form-label text-muted small fw-semibold">Director</label>
                      <input
                        type="text"
                        className="form-control cinema-input"
                        value={formData.director}
                        onChange={(e) => setFormData({ ...formData, director: e.target.value })}
                      />
                    </div>

                    <div className="col-md-4">
                      <label className="form-label text-muted small fw-semibold">Catalog Status</label>
                      <select
                        className="form-select cinema-input"
                        value={formData.status}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      >
                        <option value="now_showing">Now Showing</option>
                        <option value="coming_soon">Coming Soon</option>
                      </select>
                    </div>

                    {/* Cast */}
                    <div className="col-12">
                      <label className="form-label text-muted small fw-semibold">Top Cast Members (comma-separated)</label>
                      <input
                        type="text"
                        className="form-control cinema-input"
                        placeholder="Cillian Murphy, Robert Downey Jr., Emily Blunt"
                        value={formData.cast}
                        onChange={(e) => setFormData({ ...formData, cast: e.target.value })}
                      />
                    </div>

                    {/* Toggles */}
                    <div className="col-12 d-flex gap-4 pt-2">
                      <div className="form-check">
                        <input
                          type="checkbox"
                          className="form-check-input"
                          id="featCheck"
                          checked={formData.isFeatured}
                          onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
                        />
                        <label className="form-check-label text-light small" htmlFor="featCheck">
                          Feature in Hero Showcase
                        </label>
                      </div>
                      <div className="form-check">
                        <input
                          type="checkbox"
                          className="form-check-input"
                          id="trendCheck"
                          checked={formData.isTrending}
                          onChange={(e) => setFormData({ ...formData, isTrending: e.target.checked })}
                        />
                        <label className="form-check-label text-light small" htmlFor="trendCheck">
                          Mark as Trending
                        </label>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-outline-secondary btn-sm"
                    onClick={() => setIsModalOpen(false)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-cinema-primary btn-sm" disabled={submitting}>
                    {submitting ? 'Saving...' : editingMovieId ? 'Update Movie' : 'Create Movie'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminMoviesPage;
