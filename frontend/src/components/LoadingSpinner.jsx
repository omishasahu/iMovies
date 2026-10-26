import React from 'react';
import { BiCameraMovie } from 'react-icons/bi';

const LoadingSpinner = ({ text = 'Loading cinematic experience...' }) => {
  return (
    <div className="d-flex flex-column align-items-center justify-content-center py-5">
      <div className="position-relative mb-3">
        <div
          className="spinner-border text-danger"
          style={{ width: '3.5rem', height: '3.5rem', borderWidth: '3px' }}
          role="status"
        >
          <span className="visually-hidden">Loading...</span>
        </div>
        <div
          className="position-absolute top-50 start-50 translate-middle text-light"
          style={{ fontSize: '1.4rem' }}
        >
          <BiCameraMovie />
        </div>
      </div>
      <p className="text-secondary small fw-medium mb-0">{text}</p>
    </div>
  );
};

export default LoadingSpinner;
