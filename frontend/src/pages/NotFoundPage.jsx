import React from 'react';
import { Link } from 'react-router-dom';
import { BiCameraMovie } from 'react-icons/bi';
import { MdHome } from 'react-icons/md';

const NotFoundPage = () => {
  return (
    <div className="py-5 text-center flex-grow-1 d-flex align-items-center justify-content-center">
      <div className="container" style={{ maxWidth: '520px' }}>
        <div className="cinema-glass-card p-5">
          <BiCameraMovie size={64} className="text-danger mb-3" />
          <h1 className="text-light fw-bold display-4 mb-2">404</h1>
          <h4 className="text-light mb-3">Scene Not Found!</h4>
          <p className="text-muted small mb-4">
            The cinema page you are searching for does not exist or has been relocated to another theater auditorium.
          </p>
          <Link to="/" className="btn btn-cinema-primary d-inline-flex align-items-center gap-2">
            <MdHome size={18} /> Return to Home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;
