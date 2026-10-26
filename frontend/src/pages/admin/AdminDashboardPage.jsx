import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  MdPeople,
  MdMovie,
  MdTheaters,
  MdSchedule,
  MdConfirmationNumber,
  MdAttachMoney,
  MdTrendingUp
} from 'react-icons/md';
import API from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';

const AdminDashboardPage = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await API.get('/admin/stats');
        if (res.data.success) {
          setData(res.data);
        }
      } catch (err) {
        console.error('Failed to load admin stats:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) return <LoadingSpinner text="Aggregating cinema revenue and performance metrics..." />;

  const stats = data?.stats || {
    totalUsers: 0,
    totalMovies: 0,
    totalTheatres: 0,
    totalShows: 0,
    totalBookings: 0,
    totalRevenue: 0,
    totalTicketsSold: 0
  };

  return (
    <div>
      {/* Title */}
      <div className="d-flex justify-content-between align-items-center mb-4 pb-2 border-bottom border-secondary">
        <div>
          <h3 className="text-light fw-bold mb-1">Cinema Management Overview</h3>
          <p className="text-muted small mb-0">Live operations, booking metrics, and revenue analytics</p>
        </div>
        <div className="d-flex gap-2">
          <Link to="/admin/movies" className="btn btn-cinema-primary btn-sm">
            + Add Movie
          </Link>
          <Link to="/admin/shows" className="btn btn-cinema-outline btn-sm">
            + Schedule Show
          </Link>
        </div>
      </div>

      {/* 6 Metric Cards */}
      <div className="row g-3 mb-4">
        {/* Total Revenue */}
        <div className="col-xl-4 col-md-6">
          <div className="cinema-glass-card p-3 border-danger bg-danger bg-opacity-10">
            <div className="d-flex justify-content-between align-items-start">
              <div>
                <span className="text-muted small fw-semibold text-uppercase">Total Paid Revenue</span>
                <h2 className="text-warning fw-bold mt-1 mb-0">₹{stats.totalRevenue.toLocaleString()}</h2>
                <span className="text-success small fw-medium">
                  <MdTrendingUp /> Verified from confirmed bookings
                </span>
              </div>
              <div className="p-3 rounded-circle bg-danger text-light shadow">
                <MdAttachMoney size={26} />
              </div>
            </div>
          </div>
        </div>

        {/* Total Bookings */}
        <div className="col-xl-4 col-md-6">
          <div className="cinema-glass-card p-3">
            <div className="d-flex justify-content-between align-items-start">
              <div>
                <span className="text-muted small fw-semibold text-uppercase">Total Bookings</span>
                <h2 className="text-light fw-bold mt-1 mb-0">{stats.totalBookings}</h2>
                <span className="text-info small fw-medium">
                  {stats.totalTicketsSold} tickets sold across all shows
                </span>
              </div>
              <div className="p-3 rounded-circle bg-dark border border-secondary text-info">
                <MdConfirmationNumber size={26} />
              </div>
            </div>
          </div>
        </div>

        {/* Total Users */}
        <div className="col-xl-4 col-md-6">
          <div className="cinema-glass-card p-3">
            <div className="d-flex justify-content-between align-items-start">
              <div>
                <span className="text-muted small fw-semibold text-uppercase">Registered Users</span>
                <h2 className="text-light fw-bold mt-1 mb-0">{stats.totalUsers}</h2>
                <span className="text-secondary small">Active customer accounts</span>
              </div>
              <div className="p-3 rounded-circle bg-dark border border-secondary text-primary">
                <MdPeople size={26} />
              </div>
            </div>
          </div>
        </div>

        {/* Total Movies */}
        <div className="col-xl-4 col-md-6">
          <div className="cinema-glass-card p-3">
            <div className="d-flex justify-content-between align-items-start">
              <div>
                <span className="text-muted small fw-semibold text-uppercase">Catalog Movies</span>
                <h2 className="text-light fw-bold mt-1 mb-0">{stats.totalMovies}</h2>
                <Link to="/admin/movies" className="text-danger small text-decoration-none">
                  View and edit movie titles &rarr;
                </Link>
              </div>
              <div className="p-3 rounded-circle bg-dark border border-secondary text-danger">
                <MdMovie size={26} />
              </div>
            </div>
          </div>
        </div>

        {/* Total Theatres */}
        <div className="col-xl-4 col-md-6">
          <div className="cinema-glass-card p-3">
            <div className="d-flex justify-content-between align-items-start">
              <div>
                <span className="text-muted small fw-semibold text-uppercase">Cinema Theatres</span>
                <h2 className="text-light fw-bold mt-1 mb-0">{stats.totalTheatres}</h2>
                <Link to="/admin/theatres" className="text-warning small text-decoration-none">
                  Manage seats & layouts &rarr;
                </Link>
              </div>
              <div className="p-3 rounded-circle bg-dark border border-secondary text-warning">
                <MdTheaters size={26} />
              </div>
            </div>
          </div>
        </div>

        {/* Total Scheduled Shows */}
        <div className="col-xl-4 col-md-6">
          <div className="cinema-glass-card p-3">
            <div className="d-flex justify-content-between align-items-start">
              <div>
                <span className="text-muted small fw-semibold text-uppercase">Scheduled Shows</span>
                <h2 className="text-light fw-bold mt-1 mb-0">{stats.totalShows}</h2>
                <Link to="/admin/shows" className="text-success small text-decoration-none">
                  Manage show schedules &rarr;
                </Link>
              </div>
              <div className="p-3 rounded-circle bg-dark border border-secondary text-success">
                <MdSchedule size={26} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Bookings Table */}
      <div className="cinema-glass-card p-4">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h5 className="text-light fw-bold mb-0">Recent Confirmed Bookings</h5>
          <Link to="/admin/bookings" className="btn btn-outline-secondary btn-sm text-light border-secondary">
            View All Bookings
          </Link>
        </div>

        {data?.recentBookings && data.recentBookings.length > 0 ? (
          <div className="table-responsive">
            <table className="table cinema-table mb-0">
              <thead>
                <tr>
                  <th>Booking ID</th>
                  <th>Customer</th>
                  <th>Movie</th>
                  <th>Theatre</th>
                  <th>Seats</th>
                  <th>Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {data.recentBookings.map((b) => (
                  <tr key={b._id}>
                    <td>
                      <strong className="text-light">{b.bookingId}</strong>
                    </td>
                    <td>
                      <div className="text-light fw-medium">{b.user?.username || 'Guest'}</div>
                      <div className="text-muted small">{b.user?.email}</div>
                    </td>
                    <td className="text-light">{b.movieTitle}</td>
                    <td className="text-secondary small">{b.theatreName}</td>
                    <td>
                      <span className="badge bg-dark border border-secondary text-danger">
                        {b.seats?.map((s) => s.seatNumber).join(', ')}
                      </span>
                    </td>
                    <td className="text-warning fw-bold">₹{b.totalAmount}</td>
                    <td>
                      <span
                        className={`badge ${
                          b.bookingStatus === 'confirmed'
                            ? 'bg-success'
                            : b.bookingStatus === 'cancelled'
                            ? 'bg-danger'
                            : 'bg-secondary'
                        }`}
                      >
                        {b.bookingStatus}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-muted small mb-0">No recent bookings recorded yet.</p>
        )}
      </div>
    </div>
  );
};

export default AdminDashboardPage;
