import React from 'react';
import { NavLink, Outlet, Link } from 'react-router-dom';
import {
  MdDashboard,
  MdMovie,
  MdTheaters,
  MdSchedule,
  MdConfirmationNumber,
  MdPeople,
  MdArrowBack
} from 'react-icons/md';
import { BiCameraMovie } from 'react-icons/bi';

const AdminLayout = () => {
  return (
    <div className="container-fluid">
      <div className="row">
        {/* Admin Sidebar */}
        <div className="col-lg-2 col-md-3 admin-sidebar p-3 d-flex flex-column justify-content-between">
          <div>
            {/* Header */}
            <div className="d-flex align-items-center gap-2 mb-4 px-2">
              <span className="brand-badge d-flex align-items-center justify-content-center">
                <BiCameraMovie size={18} />
              </span>
              <div>
                <div className="fw-bold text-light" style={{ fontFamily: 'Cinzel, serif' }}>
                  iMovies Admin
                </div>
                <div className="text-warning small" style={{ fontSize: '0.7rem' }}>
                  CONTROL PANEL
                </div>
              </div>
            </div>

            {/* Nav Links */}
            <nav className="d-flex flex-column gap-1">
              <NavLink to="/admin/dashboard" className="admin-nav-item">
                <MdDashboard size={20} /> Overview & Stats
              </NavLink>
              <NavLink to="/admin/movies" className="admin-nav-item">
                <MdMovie size={20} /> Manage Movies
              </NavLink>
              <NavLink to="/admin/theatres" className="admin-nav-item">
                <MdTheaters size={20} /> Manage Theatres
              </NavLink>
              <NavLink to="/admin/shows" className="admin-nav-item">
                <MdSchedule size={20} /> Manage Shows
              </NavLink>
              <NavLink to="/admin/bookings" className="admin-nav-item">
                <MdConfirmationNumber size={20} /> Manage Bookings
              </NavLink>
              <NavLink to="/admin/users" className="admin-nav-item">
                <MdPeople size={20} /> Manage Users
              </NavLink>
            </nav>
          </div>

          {/* Bottom Back Button */}
          <div className="pt-3 border-top border-secondary">
            <Link to="/" className="btn btn-outline-secondary btn-sm w-100 text-light border-secondary d-flex align-items-center justify-content-center gap-2">
              <MdArrowBack /> Exit to Website
            </Link>
          </div>
        </div>

        {/* Admin Main Content Area */}
        <div className="col-lg-10 col-md-9 p-4" style={{ backgroundColor: '#070b14', minHeight: 'calc(100vh - 70px)' }}>
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default AdminLayout;
