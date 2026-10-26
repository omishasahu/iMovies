import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  MdLocationOn,
  MdCalendarToday,
  MdArrowBack,
  MdConfirmationNumber,
  MdInfoOutline
} from 'react-icons/md';
import API from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import { toast } from 'react-toastify';

const ShowSelectionPage = () => {
  const { movieId } = useParams();
  const navigate = useNavigate();

  const [movie, setMovie] = useState(null);
  const [shows, setShows] = useState([]);
  const [theatres, setTheatres] = useState([]);
  const [selectedDate, setSelectedDate] = useState('');
  const [loading, setLoading] = useState(true);

  // Generate next 5 dates for date picker
  const generateDatesList = () => {
    const dates = [];
    const today = new Date();
    for (let i = 0; i < 5; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const iso = `${year}-${month}-${day}`;

      const weekday = i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : d.toLocaleDateString('en-US', { weekday: 'short' });
      const monthName = d.toLocaleDateString('en-US', { month: 'short' });
      dates.push({
        iso,
        dayNumber: d.getDate(),
        monthName,
        weekday
      });
    }
    return dates;
  };

  const datesList = generateDatesList();

  useEffect(() => {
    if (!selectedDate && datesList.length > 0) {
      setSelectedDate(datesList[0].iso);
    }
  }, [datesList, selectedDate]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [movieRes, showsRes] = await Promise.all([
          API.get(`/movies/${movieId}`),
          API.get('/shows', {
            params: {
              movie: movieId,
              date: selectedDate
            }
          })
        ]);

        if (movieRes.data.success) {
          setMovie(movieRes.data.movie);
        }
        if (showsRes.data.success) {
          setShows(showsRes.data.shows);
        }
      } catch (err) {
        toast.error('Failed to load show schedules.');
      } finally {
        setLoading(false);
      }
    };

    if (movieId && selectedDate) {
      fetchData();
    }
  }, [movieId, selectedDate]);

  // Group shows by Theatre
  const groupedShowsByTheatre = () => {
    const groups = {};
    shows.forEach((show) => {
      const tId = show.theatre?._id || 'unknown';
      if (!groups[tId]) {
        groups[tId] = {
          theatre: show.theatre,
          showsList: []
        };
      }
      groups[tId].showsList.push(show);
    });
    return Object.values(groups);
  };

  const theatreGroups = groupedShowsByTheatre();

  if (loading && !movie) {
    return <LoadingSpinner text="Finding available cinema theatres and showtimes..." />;
  }

  return (
    <div className="py-4">
      <div className="container">
        {/* Back Link */}
        <Link
          to={`/movies/${movieId}`}
          className="btn btn-outline-secondary btn-sm mb-3 d-inline-flex align-items-center gap-1 text-light border-secondary"
        >
          <MdArrowBack /> Back to Movie Details
        </Link>

        {/* Movie Summary Bar */}
        {movie && (
          <div className="cinema-glass-card mb-4 p-3 d-flex flex-wrap align-items-center justify-content-between gap-3">
            <div className="d-flex align-items-center gap-3">
              <img
                src={movie.posterUrl}
                alt={movie.title}
                className="rounded"
                style={{ width: '50px', height: '70px', objectFit: 'cover' }}
              />
              <div>
                <h4 className="text-light fw-bold mb-1">{movie.title}</h4>
                <div className="text-muted small">
                  <span className="badge bg-danger me-2">{movie.certification}</span>
                  <span>{movie.language}</span> • <span>{movie.runtime}m</span> •{' '}
                  <span>{Array.isArray(movie.genres) ? movie.genres.join(', ') : movie.genres}</span>
                </div>
              </div>
            </div>

            <div className="text-end text-muted small">
              <div>Instant e-Ticket booking</div>
              <div className="text-success fw-bold">✓ Seat selection available</div>
            </div>
          </div>
        )}

        {/* Date Selector Tabs */}
        <div className="mb-4">
          <h6 className="text-light fw-bold text-uppercase small mb-2 d-flex align-items-center gap-1">
            <MdCalendarToday className="text-danger" /> Select Show Date:
          </h6>
          <div className="d-flex gap-2 overflow-auto pb-2">
            {datesList.map((d) => (
              <button
                key={d.iso}
                type="button"
                className={`btn text-center px-3 py-2 rounded-3 ${
                  selectedDate === d.iso
                    ? 'btn-danger shadow-sm'
                    : 'btn-outline-secondary text-light border-secondary'
                }`}
                style={{ minWidth: '85px' }}
                onClick={() => setSelectedDate(d.iso)}
              >
                <div className="small fw-semibold text-uppercase" style={{ fontSize: '0.72rem' }}>
                  {d.weekday}
                </div>
                <div className="fs-5 fw-bold">{d.dayNumber}</div>
                <div className="small opacity-75" style={{ fontSize: '0.75rem' }}>
                  {d.monthName}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Theatres and Showtimes List */}
        <div>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h5 className="text-light fw-bold mb-0">Theatres & Showtimes</h5>
            <span className="text-secondary small">
              Showing shows for <strong className="text-light">{selectedDate}</strong>
            </span>
          </div>

          {loading ? (
            <LoadingSpinner text="Updating shows for selected date..." />
          ) : theatreGroups.length > 0 ? (
            <div className="d-flex flex-column gap-3">
              {theatreGroups.map((group) => (
                <div
                  key={group.theatre?._id || Math.random()}
                  className="cinema-glass-card p-4 transition-hover"
                >
                  <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-3 border-bottom border-secondary pb-3">
                    <div>
                      <h5 className="text-light fw-bold mb-1">{group.theatre?.name}</h5>
                      <div className="text-muted small d-flex align-items-center gap-1 mb-2">
                        <MdLocationOn className="text-danger" />
                        <span>
                          {group.theatre?.location}, {group.theatre?.city}
                        </span>
                      </div>
                      {/* Facilities Badges */}
                      {group.theatre?.facilities && (
                        <div className="d-flex flex-wrap gap-1">
                          {group.theatre.facilities.map((fac) => (
                            <span
                              key={fac}
                              className="badge bg-dark border border-secondary text-secondary small"
                              style={{ fontSize: '0.7rem' }}
                            >
                              {fac}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="text-muted small">
                      <span className="badge bg-secondary me-2">{group.theatre?.screenName || 'Audi 1'}</span>
                      <span>Total Capacity: {group.theatre?.seatingCapacity || 80}</span>
                    </div>
                  </div>

                  {/* Showtimes row */}
                  <div>
                    <span className="text-muted small d-block mb-2 fw-semibold">AVAILABLE TIMINGS:</span>
                    <div className="d-flex flex-wrap gap-3">
                      {group.showsList.map((show) => (
                        <Link
                          key={show._id}
                          to={`/seats/${show._id}`}
                          className="btn btn-cinema-outline text-center py-2 px-3 d-flex flex-column align-items-center text-decoration-none"
                          style={{ minWidth: '120px' }}
                        >
                          <span className="fw-bold text-light fs-6">{show.showTime}</span>
                          <span className="small text-success mt-1" style={{ fontSize: '0.72rem' }}>
                            {show.availableSeatsCount} seats left
                          </span>
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-5 cinema-glass-card">
              <MdConfirmationNumber size={48} className="text-secondary mb-3" />
              <h5 className="text-light">No shows scheduled for {selectedDate}.</h5>
              <p className="text-muted small">
                Please select another date above or explore other movies showing today.
              </p>
              <button
                className="btn btn-cinema-outline btn-sm"
                onClick={() => setSelectedDate(datesList[0].iso)}
              >
                View Today's Shows
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ShowSelectionPage;
