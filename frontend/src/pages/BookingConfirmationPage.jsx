import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { MdCheckCircle, MdConfirmationNumber, MdMovie, MdPrint } from 'react-icons/md';
import API from '../services/api';
import TicketCard from '../components/TicketCard';
import LoadingSpinner from '../components/LoadingSpinner';

const BookingConfirmationPage = () => {
  const { id } = useParams();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if we have cached last booking in sessionStorage
    const cached = sessionStorage.getItem('imovies_last_booking');
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (parsed._id === id || parsed.bookingId === id) {
          setBooking(parsed);
          setLoading(false);
          return;
        }
      } catch (e) {}
    }

    // Fetch from backend API
    const fetchBooking = async () => {
      try {
        const res = await API.get(`/bookings/${id}`);
        if (res.data.success) {
          setBooking(res.data.booking);
        }
      } catch (err) {
        console.error('Failed to load booking:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchBooking();
  }, [id]);

  if (loading) return <LoadingSpinner text="Rendering your confirmed cinema pass..." />;
  if (!booking) {
    return (
      <div className="container py-5 text-center">
        <h4 className="text-light">Booking details not found.</h4>
        <Link to="/my-bookings" className="btn btn-cinema-primary mt-3">
          Go to My Bookings
        </Link>
      </div>
    );
  }

  return (
    <div className="py-5">
      <div className="container">
        {/* Celebration Header */}
        <div className="text-center mb-4">
          <div className="d-inline-flex p-3 rounded-circle bg-success bg-opacity-25 border border-success border-opacity-50 text-success mb-3">
            <MdCheckCircle size={48} />
          </div>
          <h2 className="text-light fw-bold mb-1">Booking Confirmed!</h2>
          <p className="text-muted small">
            Your movie tickets have been booked and confirmed. An e-Ticket pass has been issued below.
          </p>
        </div>

        {/* Realistic Printable Ticket Pass */}
        <TicketCard booking={booking} />

        {/* Action Buttons */}
        <div className="text-center mt-4 d-flex justify-content-center gap-3 no-print">
          <Link to="/my-bookings" className="btn btn-cinema-outline">
            <MdConfirmationNumber className="me-1" /> View All My Bookings
          </Link>
          <Link to="/" className="btn btn-cinema-primary">
            <MdMovie className="me-1" /> Browse More Movies
          </Link>
        </div>
      </div>
    </div>
  );
};

export default BookingConfirmationPage;
