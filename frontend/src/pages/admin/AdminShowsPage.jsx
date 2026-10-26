import React, { useState, useEffect } from 'react';
import {
  MdSchedule,
  MdAdd,
  MdDelete,
  MdMovie,
  MdTheaters,
  MdCalendarToday,
  MdSearch,
  MdFilterList
} from 'react-icons/md';
import API from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import { toast } from 'react-toastify';

const standardShowTimes = ['10:30 AM', '02:00 PM', '06:30 PM', '09:45 PM', '11:15 PM'];

const initialShowForm = {
  movie: '',
  theatre: '',
  showDate: '',
  showTime: '06:30 PM',
  screenName: 'Audi 1'
};

const AdminShowsPage = () => {
  const [shows, setShows] = useState([]);
  const [movies, setMovies] = useState([]);
  const [theatres, setTheatres] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [filterMovie, setFilterMovie] = useState('All');
  const [filterTheatre, setFilterTheatre] = useState('All');

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState(initialShowForm);
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    try {
      const [showsRes, moviesRes, theatresRes] = await Promise.all([
        API.get('/shows'),
        API.get('/movies'),
        API.get('/theatres')
      ]);

      if (showsRes.data.success) setShows(showsRes.data.shows);
      if (moviesRes.data.success) setMovies(moviesRes.data.movies);
      if (theatresRes.data.success) setTheatres(theatresRes.data.theatres);
    } catch (err) {
      toast.error('Failed to load show schedules.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenAdd = () => {
    const today = new Date().toISOString().split('T')[0];
    setFormData({
      movie: movies[0]?._id || '',
      theatre: theatres[0]?._id || '',
      showDate: today,
      showTime: '06:30 PM',
      screenName: theatres[0]?.screenName || 'Audi 1'
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.movie || !formData.theatre || !formData.showDate || !formData.showTime) {
      toast.warn('Please select movie, theatre, date, and showtime.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await API.post('/shows', formData);
      if (res.data.success) {
        toast.success('Show scheduled successfully! Seating layout generated.');
        setIsModalOpen(false);
        fetchData();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to schedule show.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this show schedule? Confirmed bookings will block deletion.')) {
      return;
    }

    try {
      const res = await API.delete(`/shows/${id}`);
      if (res.data.success) {
        toast.success(res.data.message);
        fetchData();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Cannot delete show with confirmed bookings.');
    }
  };

  const filteredShows = shows.filter((s) => {
    const matchMovie = filterMovie === 'All' || s.movie?._id === filterMovie;
    const matchTheatre = filterTheatre === 'All' || s.theatre?._id === filterTheatre;
    return matchMovie && matchTheatre;
  });

  if (loading) return <LoadingSpinner text="Loading scheduled screenings..." />;

  return (
    <div>
      {/* Top Header */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4 pb-2 border-bottom border-secondary">
        <div>
          <h3 className="text-light fw-bold mb-1 d-flex align-items-center gap-2">
            <MdSchedule className="text-success" /> Show Scheduling
          </h3>
          <p className="text-muted small mb-0">Schedule screenings, link movies to theatre auditoriums, and manage seat inventory</p>
        </div>

        <button className="btn btn-cinema-primary btn-sm d-flex align-items-center gap-1" onClick={handleOpenAdd}>
          <MdAdd size={18} /> Schedule New Show
        </button>
      </div>

      {/* Filter Bar */}
      <div className="cinema-glass-card p-3 mb-4 d-flex flex-wrap gap-3 align-items-center">
        <span className="text-muted small fw-bold d-flex align-items-center gap-1">
          <MdFilterList /> Filter by:
        </span>

        {/* Filter Movie */}
        <select
          className="form-select form-select-sm cinema-input py-1"
          style={{ width: '220px' }}
          value={filterMovie}
          onChange={(e) => setFilterMovie(e.target.value)}
        >
          <option value="All">All Movies</option>
          {movies.map((m) => (
            <option key={m._id} value={m._id}>
              {m.title}
            </option>
          ))}
        </select>

        {/* Filter Theatre */}
        <select
          className="form-select form-select-sm cinema-input py-1"
          style={{ width: '240px' }}
          value={filterTheatre}
          onChange={(e) => setFilterTheatre(e.target.value)}
        >
          <option value="All">All Theatres</option>
          {theatres.map((t) => (
            <option key={t._id} value={t._id}>
              {t.name}
            </option>
          ))}
        </select>

        <span className="text-secondary small ms-auto">
          Showing {filteredShows.length} scheduled show(s)
        </span>
      </div>

      {/* Shows Table */}
      <div className="cinema-glass-card p-0 overflow-hidden">
        <div className="table-responsive">
          <table className="table cinema-table mb-0">
            <thead>
              <tr>
                <th>Movie</th>
                <th>Theatre & Audi</th>
                <th>Show Date</th>
                <th>Show Time</th>
                <th>Available Seats</th>
                <th className="text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredShows.map((s) => (
                <tr key={s._id}>
                  <td>
                    <div className="d-flex align-items-center gap-2">
                      {s.movie?.posterUrl && (
                        <img
                          src={s.movie.posterUrl}
                          alt={s.movie?.title}
                          className="rounded"
                          style={{ width: '32px', height: '45px', objectFit: 'cover' }}
                        />
                      )}
                      <div>
                        <div className="fw-bold text-light">{s.movie?.title || 'Unknown Movie'}</div>
                        <div className="text-muted small">
                          {s.movie?.language} • {s.movie?.runtime}m
                        </div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="text-light fw-medium">{s.theatre?.name || 'Unknown Theatre'}</div>
                    <div className="text-secondary small">
                      {s.screenName} • {s.theatre?.location}
                    </div>
                  </td>
                  <td>
                    <span className="badge bg-dark border border-secondary text-light">
                      {s.showDate}
                    </span>
                  </td>
                  <td>
                    <span className="badge bg-danger fs-6 px-2 py-1">{s.showTime}</span>
                  </td>
                  <td>
                    <span className="badge bg-success-subtle text-success border border-success fw-bold">
                      {s.availableSeatsCount} / {s.totalSeats} seats
                    </span>
                  </td>
                  <td className="text-end">
                    <button
                      className="btn btn-outline-danger btn-sm p-1 px-2"
                      onClick={() => handleDelete(s._id)}
                      title="Delete show"
                    >
                      <MdDelete size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Schedule Show */}
      {isModalOpen && (
        <div
          className="modal fade show d-block"
          style={{ backgroundColor: 'rgba(0,0,0,0.85)' }}
          tabIndex="-1"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="modal-dialog modal-dialog-centered"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-content cinema-modal border border-secondary">
              <div className="modal-header">
                <h5 className="modal-title text-light fw-bold">Schedule New Screening</h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setIsModalOpen(false)}
                ></button>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="modal-body p-4">
                  <div className="mb-3">
                    <label className="form-label text-muted small fw-semibold">Select Movie *</label>
                    <select
                      className="form-select cinema-input"
                      value={formData.movie}
                      onChange={(e) => setFormData({ ...formData, movie: e.target.value })}
                      required
                    >
                      {movies.map((m) => (
                        <option key={m._id} value={m._id}>
                          {m.title} ({m.language} - {m.certification})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="mb-3">
                    <label className="form-label text-muted small fw-semibold">Select Theatre *</label>
                    <select
                      className="form-select cinema-input"
                      value={formData.theatre}
                      onChange={(e) => {
                        const selT = theatres.find((t) => t._id === e.target.value);
                        setFormData({
                          ...formData,
                          theatre: e.target.value,
                          screenName: selT?.screenName || 'Audi 1'
                        });
                      }}
                      required
                    >
                      {theatres.map((t) => (
                        <option key={t._id} value={t._id}>
                          {t.name} – {t.location} ({t.seatingCapacity} seats)
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="row g-2 mb-3">
                    <div className="col-6">
                      <label className="form-label text-muted small fw-semibold">Show Date *</label>
                      <input
                        type="date"
                        className="form-control cinema-input"
                        value={formData.showDate}
                        onChange={(e) => setFormData({ ...formData, showDate: e.target.value })}
                        required
                      />
                    </div>
                    <div className="col-6">
                      <label className="form-label text-muted small fw-semibold">Show Time *</label>
                      <select
                        className="form-select cinema-input"
                        value={formData.showTime}
                        onChange={(e) => setFormData({ ...formData, showTime: e.target.value })}
                        required
                      >
                        {standardShowTimes.map((time) => (
                          <option key={time} value={time}>
                            {time}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label text-muted small fw-semibold">Auditorium / Screen Name</label>
                    <input
                      type="text"
                      className="form-control cinema-input"
                      value={formData.screenName}
                      onChange={(e) => setFormData({ ...formData, screenName: e.target.value })}
                    />
                  </div>

                  <div className="alert alert-dark p-2 small border-secondary mb-0">
                    ℹ️ Seating layout will be automatically generated from the selected theatre's Balcony, Middle, and Lower tier configuration.
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
                    {submitting ? 'Generating Layout...' : 'Schedule Show'}
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

export default AdminShowsPage;
