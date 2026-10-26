import React, { useState, useEffect } from 'react';
import {
  MdConfirmationNumber,
  MdSearch,
  MdFilterList,
  MdQrCode,
  MdCancel,
  MdFileDownload
} from 'react-icons/md';
import API from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import TicketCard from '../../components/TicketCard';
import { toast } from 'react-toastify';

const AdminBookingsPage = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [dateFilter, setDateFilter] = useState('');

  // Ticket modal
  const [selectedTicket, setSelectedTicket] = useState(null);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (statusFilter !== 'All') params.status = statusFilter;
      if (dateFilter) params.date = dateFilter;

      const res = await API.get('/bookings', { params });
      if (res.data.success) {
        setBookings(res.data.bookings);
      }
    } catch (err) {
      toast.error('Failed to load bookings.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [statusFilter, dateFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchBookings();
  };

  const handleAdminCancel = async (bookingId) => {
    if (!window.confirm('Are you sure you want to cancel this booking and release its seats?')) {
      return;
    }

    try {
      const res = await API.patch(`/bookings/${bookingId}/cancel`, {
        reason: 'Cancelled by Administrator'
      });
      if (res.data.success) {
        toast.success(res.data.message);
        fetchBookings();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to cancel booking.');
    }
  };

  const confirmedBookings = bookings.filter((b) => b.bookingStatus === 'confirmed');
  const totalRevenueConfirmed = confirmedBookings.reduce((acc, b) => acc + b.totalAmount, 0);

  return (
    <div>
      {/* Top Header */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4 pb-2 border-bottom border-secondary">
        <div>
          <h3 className="text-light fw-bold mb-1 d-flex align-items-center gap-2">
            <MdConfirmationNumber className="text-danger" /> Booking Management
          </h3>
          <p className="text-muted small mb-0">Search and manage all confirmed customer transactions across the network</p>
        </div>

        {/* Total Confirmed Revenue Badge */}
        <div className="badge bg-danger bg-opacity-25 border border-danger text-light p-2 px-3 fs-6">
          Confirmed Revenue: <strong className="text-warning">₹{totalRevenueConfirmed.toLocaleString()}</strong>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="cinema-glass-card p-3 mb-4">
        <form onSubmit={handleSearchSubmit} className="row g-2 align-items-center">
          <div className="col-md-4">
            <div className="input-group input-group-sm">
              <span className="input-group-text bg-dark border-secondary text-secondary">
                <MdSearch />
              </span>
              <input
                type="text"
                className="form-control cinema-input border-secondary"
                placeholder="Search Booking ID or Movie..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="col-md-3">
            <select
              className="form-select form-select-sm cinema-input"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="All">All Booking Statuses</option>
              <option value="confirmed">Confirmed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          <div className="col-md-3">
            <input
              type="date"
              className="form-control form-control-sm cinema-input"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
            />
          </div>

          <div className="col-md-2 d-flex gap-1">
            <button type="submit" className="btn btn-cinema-primary btn-sm flex-grow-1">
              Filter
            </button>
            {(search || statusFilter !== 'All' || dateFilter) && (
              <button
                type="button"
                className="btn btn-outline-secondary btn-sm text-light border-secondary"
                onClick={() => {
                  setSearch('');
                  setStatusFilter('All');
                  setDateFilter('');
                  API.get('/bookings').then((res) => setBookings(res.data.bookings));
                }}
              >
                Reset
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Bookings Table */}
      {loading ? (
        <LoadingSpinner text="Loading bookings records..." />
      ) : (
        <div className="cinema-glass-card p-0 overflow-hidden">
          <div className="table-responsive">
            <table className="table cinema-table mb-0">
              <thead>
                <tr>
                  <th>Booking ID</th>
                  <th>Customer Email</th>
                  <th>Movie & Theatre</th>
                  <th>Show Date & Time</th>
                  <th>Seats</th>
                  <th>Total Amount</th>
                  <th>Payment</th>
                  <th>Status</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((b) => {
                  const isCancelled = b.bookingStatus === 'cancelled';
                  return (
                    <tr key={b._id}>
                      <td>
                        <strong className="text-light">{b.bookingId}</strong>
                        <div className="text-muted small" style={{ fontSize: '0.72rem' }}>
                          {new Date(b.createdAt).toLocaleDateString()}
                        </div>
                      </td>
                      <td>
                        <div className="text-light fw-medium">{b.user?.username || 'Customer'}</div>
                        <div className="text-muted small">{b.user?.email}</div>
                      </td>
                      <td>
                        <div className="text-light fw-bold">{b.movieTitle}</div>
                        <div className="text-secondary small">{b.theatreName}</div>
                      </td>
                      <td>
                        <span className="text-light small d-block">{b.showDate}</span>
                        <span className="badge bg-dark border border-secondary text-secondary">
                          {b.showTime}
                        </span>
                      </td>
                      <td>
                        <span className="badge bg-danger">
                          {b.seats?.map((s) => s.seatNumber).join(', ')}
                        </span>
                      </td>
                      <td>
                        <span className="text-warning fw-bold fs-6">₹{b.totalAmount}</span>
                      </td>
                      <td>
                        <span
                          className={`badge ${
                            b.paymentStatus === 'completed'
                              ? 'bg-success'
                              : b.paymentStatus === 'refunded'
                              ? 'bg-danger'
                              : 'bg-warning text-dark'
                          }`}
                        >
                          {b.paymentStatus.toUpperCase()}
                        </span>
                        <div className="text-muted small" style={{ fontSize: '0.7rem' }}>
                          {b.paymentMethod}
                        </div>
                      </td>
                      <td>
                        <span
                          className={`badge ${
                            b.bookingStatus === 'confirmed' ? 'bg-success' : 'bg-danger'
                          }`}
                        >
                          {b.bookingStatus.toUpperCase()}
                        </span>
                      </td>
                      <td className="text-end">
                        <div className="d-flex justify-content-end gap-1">
                          <button
                            className="btn btn-outline-info btn-sm p-1 px-2"
                            onClick={() => setSelectedTicket(b)}
                            title="View Ticket QR"
                          >
                            <MdQrCode size={16} />
                          </button>
                          {!isCancelled && (
                            <button
                              className="btn btn-outline-danger btn-sm p-1 px-2"
                              onClick={() => handleAdminCancel(b._id)}
                              title="Cancel booking"
                            >
                              <MdCancel size={16} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Ticket Modal */}
      {selectedTicket && (
        <div
          className="modal fade show d-block"
          style={{ backgroundColor: 'rgba(0,0,0,0.85)' }}
          tabIndex="-1"
          onClick={() => setSelectedTicket(null)}
        >
          <div
            className="modal-dialog modal-dialog-centered"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-content cinema-modal border-0 p-0">
              <div className="modal-header border-0 pb-0">
                <button
                  type="button"
                  className="btn-close btn-close-white ms-auto"
                  onClick={() => setSelectedTicket(null)}
                ></button>
              </div>
              <div className="modal-body p-0 pb-3">
                <TicketCard booking={selectedTicket} />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminBookingsPage;
