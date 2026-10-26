import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { io } from 'socket.io-client';
import { MdArrowBack, MdAccessTime, MdConfirmationNumber } from 'react-icons/md';
import API from '../services/api';
import SeatGrid from '../components/SeatGrid';
import LoadingSpinner from '../components/LoadingSpinner';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';

const SeatSelectionPage = () => {
  const { showId } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  const [show, setShow] = useState(null);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lockingLoading, setLockingLoading] = useState(false);

  // Fetch show details with seats
  const fetchShowData = async () => {
    try {
      const res = await API.get(`/shows/${showId}`);
      if (res.data.success) {
        setShow(res.data.show);
      }
    } catch (err) {
      toast.error('Failed to load show details.');
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShowData();
  }, [showId]);

  // Real-time Socket.IO listener for live seat updates
  useEffect(() => {
    const socketUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';
    const socket = io(socketUrl, { transports: ['websocket', 'polling'] });

    socket.emit('join_show', showId);

    socket.on('seats_locked', (data) => {
      if (data.showId === showId) {
        // Refresh show seat matrix to reflect newly locked seats by others
        fetchShowData();
      }
    });

    socket.on('seats_booked', (data) => {
      if (data.showId === showId) {
        fetchShowData();
      }
    });

    socket.on('seats_released', (data) => {
      if (data.showId === showId) {
        fetchShowData();
      }
    });

    return () => {
      socket.emit('leave_show', showId);
      socket.disconnect();
    };
  }, [showId]);

  // Handle seat click
  const handleSeatClick = (seat) => {
    if (seat.status === 'booked') {
      toast.warn(`Seat ${seat.seatNumber} is already booked.`);
      return;
    }

    const isAlreadySelected = selectedSeats.some((s) => s.seatNumber === seat.seatNumber);

    if (isAlreadySelected) {
      setSelectedSeats(selectedSeats.filter((s) => s.seatNumber !== seat.seatNumber));
    } else {
      if (selectedSeats.length >= 10) {
        toast.info('Maximum 10 tickets can be booked in a single transaction.');
        return;
      }
      setSelectedSeats([...selectedSeats, seat]);
    }
  };

  // Pricing calculations
  const subtotal = selectedSeats.reduce((acc, s) => acc + s.price, 0);
  const convenienceFee = selectedSeats.length * 30;
  const grandTotal = subtotal + convenienceFee;

  // Proceed to Lock & Checkout
  const handleProceedToCheckout = async () => {
    if (selectedSeats.length === 0) {
      toast.warn('Please select at least one seat to proceed.');
      return;
    }

    if (!isAuthenticated) {
      toast.info('Please log in to continue with seat booking.');
      navigate('/login', { state: { from: `/seats/${showId}` } });
      return;
    }

    setLockingLoading(true);
    try {
      const seatNumbers = selectedSeats.map((s) => s.seatNumber);
      const res = await API.post('/bookings/lock-seats', {
        showId,
        seatNumbers
      });

      if (res.data.success) {
        toast.success(res.data.message);
        // Store lock details in sessionStorage for checkout
        sessionStorage.setItem(
          'imovies_active_booking',
          JSON.stringify({
            showId,
            show,
            seatNumbers,
            seatDetails: res.data.seatDetails,
            pricing: res.data.pricing,
            expiresAt: res.data.expiresAt,
            lockDurationMinutes: res.data.lockDurationMinutes
          })
        );
        navigate('/checkout');
      }
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Failed to lock seats. Some seats may have been taken.';
      toast.error(errMsg);
      // Refresh seat matrix
      fetchShowData();
      // Clear invalid seats from selection
      if (err.response?.data?.unavailableSeats) {
        setSelectedSeats([]);
      }
    } finally {
      setLockingLoading(false);
    }
  };

  if (loading || !show) {
    return <LoadingSpinner text="Configuring interactive cinema seat matrix..." />;
  }

  return (
    <div className="py-4 pb-5">
      <div className="container">
        {/* Top Navigation & Info Header */}
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
          <Link
            to={`/booking/${show.movie?._id}`}
            className="btn btn-outline-secondary btn-sm d-inline-flex align-items-center gap-1 text-light border-secondary"
          >
            <MdArrowBack /> Change Showtime
          </Link>

          {/* Show summary pill */}
          <div className="d-flex flex-wrap align-items-center gap-3 text-secondary small">
            <div>
              <strong className="text-light fs-6">{show.movie?.title}</strong>
            </div>
            <span>•</span>
            <div>
              <span className="text-light">{show.theatre?.name}</span> ({show.screenName})
            </div>
            <span>•</span>
            <div className="text-danger fw-bold">
              {show.showDate} at {show.showTime}
            </div>
          </div>
        </div>

        {/* Seat Grid Layout */}
        <SeatGrid
          seats={show.seats}
          selectedSeatNumbers={selectedSeats.map((s) => s.seatNumber)}
          onSeatClick={handleSeatClick}
          currentUserId={user?._id}
        />
      </div>

      {/* Floating Summary & Checkout Footer */}
      {selectedSeats.length > 0 && (
        <div className="booking-summary-bar">
          <div className="container d-flex flex-column flex-sm-row justify-content-between align-items-center gap-3">
            <div>
              <div className="d-flex align-items-center gap-2 mb-1">
                <span className="badge bg-danger fs-6 px-3 py-1">
                  {selectedSeats.length} {selectedSeats.length === 1 ? 'Seat' : 'Seats'}
                </span>
                <span className="text-light fw-bold text-truncate" style={{ maxWidth: '280px' }}>
                  {selectedSeats.map((s) => s.seatNumber).join(', ')}
                </span>
              </div>
              <div className="text-muted small">
                Subtotal: ₹{subtotal} + Conv. Fee: ₹{convenienceFee} = Total:{' '}
                <strong className="text-warning fs-5">₹{grandTotal}</strong>
              </div>
            </div>

            <div className="d-flex gap-2">
              <button
                type="button"
                className="btn btn-outline-secondary btn-sm text-light border-secondary px-3"
                onClick={() => setSelectedSeats([])}
              >
                Clear
              </button>
              <button
                type="button"
                className="btn btn-cinema-primary px-4 py-2 d-flex align-items-center gap-2"
                onClick={handleProceedToCheckout}
                disabled={lockingLoading}
              >
                <MdConfirmationNumber />
                {lockingLoading ? 'Securing Seats...' : `Proceed to Pay (₹${grandTotal})`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SeatSelectionPage;
