import React from 'react';
import { Link } from 'react-router-dom';
import { BiCameraMovie } from 'react-icons/bi';
import { MdEmail, MdPhone, MdLocationOn, MdShield, MdHeadsetMic } from 'react-icons/md';

const Footer = () => {
  return (
    <footer className="mt-auto border-top border-secondary pt-5 pb-4" style={{ backgroundColor: '#070b14' }}>
      <div className="container">
        {/* Perks Banner */}
        <div className="row g-4 pb-4 mb-4 border-bottom border-secondary text-secondary">
          <div className="col-md-3 col-sm-6 d-flex align-items-center gap-3">
            <div className="rounded-circle p-2 bg-danger text-light">
              <BiCameraMovie size={24} />
            </div>
            <div>
              <div className="text-light fw-bold small">Latest Blockbusters</div>
              <div className="small text-muted">Daily updated showtimes</div>
            </div>
          </div>
          <div className="col-md-3 col-sm-6 d-flex align-items-center gap-3">
            <div className="rounded-circle p-2 bg-danger text-light">
              <MdShield size={24} />
            </div>
            <div>
              <div className="text-light fw-bold small">100% Safe Payments</div>
              <div className="small text-muted">Razorpay & Verified Mock Gateway</div>
            </div>
          </div>
          <div className="col-md-3 col-sm-6 d-flex align-items-center gap-3">
            <div className="rounded-circle p-2 bg-danger text-light">
              <MdHeadsetMic size={24} />
            </div>
            <div>
              <div className="text-light fw-bold small">24/7 Dedicated Support</div>
              <div className="small text-muted">Instant ticket assistance</div>
            </div>
          </div>
          <div className="col-md-3 col-sm-6 d-flex align-items-center gap-3">
            <div className="rounded-circle p-2 bg-danger text-light">
              <MdLocationOn size={24} />
            </div>
            <div>
              <div className="text-light fw-bold small">Prime Theatres</div>
              <div className="small text-muted">Dolby Atmos & 4K Laser Screens</div>
            </div>
          </div>
        </div>

        {/* Links Grid */}
        <div className="row g-4 py-2">
          {/* Brand Col */}
          <div className="col-lg-4 col-md-6">
            <div className="d-flex align-items-center gap-2 mb-3">
              <span className="brand-badge d-flex align-items-center justify-content-center">
                <BiCameraMovie size={20} />
              </span>
              <span className="fw-bold fs-4 text-light" style={{ fontFamily: 'Cinzel, serif' }}>
                iMovies
              </span>
            </div>
            <p className="text-muted small pe-lg-4">
              iMovies is your premier cinema ticket booking companion. Enjoy seamless seat selection, live theater updates, instant QR tickets, and unforgettable movie moments.
            </p>
            <div className="d-flex gap-3 text-secondary small">
              <span className="badge bg-dark border border-secondary px-3 py-2">Dolby Atmos</span>
              <span className="badge bg-dark border border-secondary px-3 py-2">IMAX Laser</span>
              <span className="badge bg-dark border border-secondary px-3 py-2">VIP Recliners</span>
            </div>
          </div>

          {/* Quick Links */}
          <div className="col-lg-2 col-md-6 col-6">
            <h6 className="text-light fw-bold mb-3 text-uppercase small" style={{ letterSpacing: '1px' }}>
              Navigation
            </h6>
            <ul className="list-unstyled text-muted small d-flex flex-column gap-2">
              <li><Link to="/" className="text-decoration-none text-muted hover-light">Home</Link></li>
              <li><Link to="/movies" className="text-decoration-none text-muted">All Movies</Link></li>
              <li><Link to="/theatres" className="text-decoration-none text-muted">Cinema Theatres</Link></li>
              <li><Link to="/my-bookings" className="text-decoration-none text-muted">My Bookings</Link></li>
              <li><Link to="/watchlist" className="text-decoration-none text-muted">Saved Watchlist</Link></li>
            </ul>
          </div>

          {/* Genres */}
          <div className="col-lg-3 col-md-6 col-6">
            <h6 className="text-light fw-bold mb-3 text-uppercase small" style={{ letterSpacing: '1px' }}>
              Explore Genres
            </h6>
            <ul className="list-unstyled text-muted small d-flex flex-column gap-2">
              <li><Link to="/?genre=Action" className="text-decoration-none text-muted">Action & Adventure</Link></li>
              <li><Link to="/?genre=Sci-Fi" className="text-decoration-none text-muted">Science Fiction</Link></li>
              <li><Link to="/?genre=Drama" className="text-decoration-none text-muted">Emotional Drama</Link></li>
              <li><Link to="/?genre=Crime" className="text-decoration-none text-muted">Crime & Thriller</Link></li>
              <li><Link to="/?genre=Biography" className="text-decoration-none text-muted">Biographical Epic</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div className="col-lg-3 col-md-6">
            <h6 className="text-light fw-bold mb-3 text-uppercase small" style={{ letterSpacing: '1px' }}>
              Cinema Helpdesk
            </h6>
            <ul className="list-unstyled text-muted small d-flex flex-column gap-2 mb-3">
              <li className="d-flex align-items-center gap-2">
                <MdEmail className="text-danger" /> support@imovies.com
              </li>
              <li className="d-flex align-items-center gap-2">
                <MdPhone className="text-danger" /> +91 (022) 8000-IMOVIE
              </li>
              <li className="d-flex align-items-center gap-2">
                <MdLocationOn className="text-danger" /> Cinema Plaza, Bandra West, Mumbai 400050
              </li>
            </ul>
            <div className="text-muted small">
              Cancellation Policy: Instant refund up to 2 hours prior to scheduled showtime.
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-center pt-4 mt-4 border-top border-secondary text-muted small">
          <div>
            &copy; {new Date().getFullYear()} <strong className="text-light">iMovies Inc.</strong> All rights reserved. Movie Ticket Booking Made Simple.
          </div>
          <div className="d-flex gap-3 mt-2 mt-md-0">
            <span>Privacy Policy</span>
            <span>•</span>
            <span>Terms of Service</span>
            <span>•</span>
            <span>Security Guidelines</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
