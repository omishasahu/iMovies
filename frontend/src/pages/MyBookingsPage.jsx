import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  MdConfirmationNumber,
  MdLocationOn,
  MdCalendarToday,
  MdSchedule,
  MdCancel,
  MdQrCode,
  MdArrowForward
} from 'react-icons/md';
import API from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import TicketCard from '../components/TicketCard';
import { toast } from 'react-toastify';

const MyBookingsPage = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [cancellingBooking, setCancellingBooking] = useState(null);
  const [cancelLoading, setCancelLoading] = useState(false);

  const fetchBookings = async () => {
    try {
      const res = await API.get('/bookings/my-bookings');
      if (res.data.success) {
        setBookings(res.data.bookings);
      }
    } catch (err) {
      toast.error('Failed to load your bookings.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const handleCancelBooking = async () => {
    if (!cancellingBooking) return;
    setCancelLoading(true);
    try {
      const res = await API.patch(`/bookings/${cancellingBooking._id}/cancel`, {
        reason: 'User cancelled from booking dashboard'
      });
      if (res.data.success) {
        toast.success(res.data.message);
        setCancellingBooking(null);
        fetchBookings();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to cancel booking.');
    } finally {
      setCancelLoading(false);
    }
  };

  if (loading) return <LoadingSpinner text="Retrieving your cinema passes..." />;

  return (
    <div className="py-5">
      <div className="container">
        <div className="d-flex justify-content-between align-items-center mb-4 pb-2 border-bottom border-secondary">
          <div>
            <h3 className="text-light fw-bold mb-1 d-flex align-items-center gap-2">
              <MdConfirmationNumber className="text-danger" /> My Bookings
            </h3>
            <p className="text-muted small mb-0">View your active movie tickets and previous history</p>
          </div>
          <Link to="/" className="btn btn-cinema-primary btn-sm">
            Book More Tickets
          </Link>
        </div>

        {bookings.length > 0 ? (
          <div className="row g-4">
            {bookings.map((b) => {
              const isCancelled = b.bookingStatus === 'cancelled';
              const seatNums = b.seats?.map((s) => s.seatNumber).join(', ');

              return (
                <div key={b._id} className="col-lg-6">
                  <div className="cinema-glass-card h-100 d-flex flex-column justify-content-between p-4">
                    <div>
                      {/* Status & ID Header */}
                      <div className="d-flex justify-content-between align-items-center pb-3 border-bottom border-secondary mb-3">
                        <span className="text-secondary small">
                          ID: <strong className="text-light">{b.bookingId}</strong>
                        </span>
                        <span
                          className={`badge ${
                            isCancelled
                              ? 'bg-danger-subtle text-danger border border-danger'
                              : 'bg-success-subtle text-success border border-success'
                          } fw-bold px-2 py-1`}
                        >
                          {b.bookingStatus.toUpperCase()}
                        </span>
                      </div>

                      {/* Movie Info */}
                      <div className="d-flex gap-3 mb-3">
                        {b.moviePoster && (
                          <img
                            src={b.moviePoster}
                            alt={b.movieTitle}
                            className="rounded"
                            style={{ width: '70px', height: '95px', objectFit: 'cover' }}
                          />
                        )}
                        <div>
                          <h5 className="text-light fw-bold mb-1">{b.movieTitle}</h5>
                          <div className="text-muted small d-flex align-items-center gap-1 mb-1">
                            <MdLocationOn className="text-danger" />
                            <strong>{b.theatreName}</strong>
                          </div>
                          <div className="text-secondary small">{b.theatreLocation}</div>
                          <div className="text-danger small fw-bold mt-1">
                            {b.showDate} • {b.showTime} ({b.screenName})
                          </div>
                        </div>
                      </div>

                      {/* Seats & Price */}
                      <div className="row g-2 p-2 bg-dark rounded border border-secondary mb-3 small">
                        <div className="col-6">
                          <span className="text-muted d-block">SEATS ({b.ticketCount})</span>
                          <span className="text-light fw-bold">{seatNums}</span>
                        </div>
                        <div className="col-6 text-end">
                          <span className="text-muted d-block">AMOUNT</span>
                          <span className="text-warning fw-bold fs-6">₹{b.totalAmount}</span>
                        </div>
                      </div>

                      {isCancelled && b.cancellation?.refundAmount > 0 && (
                        <div className="alert alert-danger p-2 small mb-3">
                          Refund of ₹{b.cancellation.refundAmount} issued.
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="d-flex gap-2 pt-2 border-top border-secondary">
                      <button
                        className="btn btn-cinema-outline btn-sm flex-grow-1 d-flex align-items-center justify-content-center gap-1"
                        onClick={() => setSelectedTicket(b)}
                      >
                        <MdQrCode size={16} /> View Ticket Pass
                      </button>

                      {!isCancelled && (
                        <button
                          className="btn btn-outline-danger btn-sm"
                          onClick={() => setCancellingBooking(b)}
                        >
                          Cancel Booking
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-5 cinema-glass-card">
            <MdConfirmationNumber size={52} className="text-secondary mb-3" />
            <h4 className="text-light">No Bookings Found</h4>
            <p className="text-muted small">You haven't booked any movie tickets yet.</p>
            <Link to="/" className="btn btn-cinema-primary mt-2">
              Browse Now Showing Movies
            </Link>
          </div>
        )}
      </div>

      {/* View Ticket Modal */}
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

      {/* Cancel Confirmation Modal */}
      {cancellingBooking && (
        <div
          className="modal fade show d-block"
          style={{ backgroundColor: 'rgba(0,0,0,0.85)' }}
          tabIndex="-1"
          onClick={() => setCancellingBooking(null)}
        >
          <div
            className="modal-dialog modal-dialog-centered"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-content cinema-modal border border-danger">
              <div className="modal-header">
                <h5 className="modal-title text-light fw-bold">Cancel Movie Booking?</h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setCancellingBooking(null)}
                ></button>
              </div>
              <div className="modal-body">
                <p className="text-light">
                  Are you sure you want to cancel your booking for{' '}
                  <strong className="text-danger">{cancellingBooking.movieTitle}</strong> on{' '}
                  <strong>
                    {cancellingBooking.showDate} at {cancellingBooking.showTime}
                  </strong>
                  ?
                </p>
                <div className="p-3 bg-dark rounded border border-secondary text-muted small mb-3">
                  <div>• Subtotal: ₹{cancellingBooking.subtotal}</div>
                  <div>• Refundable Amount (85%): <strong className="text-success">₹{Math.round(cancellingBooking.subtotal * 0.85)}</strong></div>
                  <div>• All booked seats will be immediately released back to available.</div>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-outline-secondary btn-sm"
                  onClick={() => setCancellingBooking(null)}
                >
                  Keep Tickets
                </button>
                <button
                  type="button"
                  className="btn btn-danger btn-sm"
                  onClick={handleCancelBooking}
                  disabled={cancelLoading}
                >
                  {cancelLoading ? 'Cancelling...' : 'Confirm Cancellation'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyBookingsPage;
