import React from 'react';
import { MdPrint, MdLocationOn, MdSchedule, MdConfirmationNumber } from 'react-icons/md';
import { BiCameraMovie } from 'react-icons/bi';

const TicketCard = ({ booking, onPrint }) => {
  if (!booking) return null;

  const handlePrint = () => {
    if (onPrint) {
      onPrint();
    } else {
      window.print();
    }
  };

  const seatsList = Array.isArray(booking.seats)
    ? booking.seats.map((s) => s.seatNumber).join(', ')
    : '';

  return (
    <div className="ticket-wrapper mx-auto" style={{ maxWidth: '480px' }}>
      {/* Header */}
      <div className="ticket-header p-4 text-center">
        <div className="d-flex align-items-center justify-content-between mb-2">
          <div className="d-flex align-items-center gap-2">
            <span className="brand-badge d-flex align-items-center justify-content-center">
              <BiCameraMovie size={18} />
            </span>
            <span className="fw-bold text-light" style={{ fontFamily: 'Cinzel, serif', fontSize: '1.2rem' }}>
              iMovies
            </span>
          </div>
          <span className="badge bg-success-subtle text-success border border-success fw-bold px-2 py-1">
            CONFIRMED
          </span>
        </div>
        <div className="text-secondary small">
          Booking ID: <strong className="text-light">{booking.bookingId}</strong>
        </div>

        {/* Perforated Notches */}
        <div className="ticket-notch-left"></div>
        <div className="ticket-notch-right"></div>
      </div>

      {/* Body */}
      <div className="ticket-body p-4">
        {/* Movie Info */}
        <div className="d-flex gap-3 mb-4 align-items-center">
          {booking.moviePoster && (
            <img
              src={booking.moviePoster}
              alt={booking.movieTitle}
              className="rounded"
              style={{ width: '65px', height: '90px', objectFit: 'cover' }}
            />
          )}
          <div>
            <h5 className="text-light fw-bold mb-1">{booking.movieTitle}</h5>
            <div className="text-muted small d-flex align-items-center gap-1 mb-1">
              <MdLocationOn className="text-danger" /> {booking.theatreName}
            </div>
            <div className="text-secondary small">{booking.theatreLocation}</div>
          </div>
        </div>

        {/* Details Grid */}
        <div className="row g-3 py-3 border-top border-bottom border-secondary mb-4 small">
          <div className="col-6">
            <span className="text-muted d-block">DATE & TIME</span>
            <strong className="text-light">
              {booking.showDate} • {booking.showTime}
            </strong>
          </div>
          <div className="col-6">
            <span className="text-muted d-block">SCREEN</span>
            <strong className="text-light">{booking.screenName || 'Audi 1'}</strong>
          </div>
          <div className="col-6">
            <span className="text-muted d-block">SEATS ({booking.ticketCount})</span>
            <span className="badge bg-danger fs-6 px-2 py-1">{seatsList}</span>
          </div>
          <div className="col-6">
            <span className="text-muted d-block">TOTAL PAID</span>
            <strong className="text-warning fs-5">₹{booking.totalAmount}</strong>
          </div>
        </div>

        {/* QR Code */}
        {booking.qrCode && (
          <div className="text-center py-2">
            <div className="bg-light p-2 d-inline-block rounded shadow-sm mb-2">
              <img
                src={booking.qrCode}
                alt="Ticket QR Code"
                style={{ width: '140px', height: '140px', display: 'block' }}
              />
            </div>
            <div className="text-muted small">Scan this QR code at cinema turnstile for entry</div>
          </div>
        )}

        {/* Print / Save Action */}
        <div className="d-flex gap-2 mt-4 no-print">
          <button className="btn btn-cinema-outline flex-grow-1" onClick={handlePrint}>
            <MdPrint className="me-2" /> Print Ticket
          </button>
        </div>
      </div>
    </div>
  );
};

export default TicketCard;
