import React, { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import {
  MdMovieFilter,
  MdBookmarkBorder,
  MdConfirmationNumber,
  MdAdminPanelSettings,
  MdPerson,
  MdLogout,
  MdSearch
} from 'react-icons/md';
import { BiCameraMovie } from 'react-icons/bi';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const [navSearch, setNavSearch] = useState('');
  const [isNavCollapsed, setIsNavCollapsed] = useState(true);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (navSearch.trim()) {
      navigate(`/?search=${encodeURIComponent(navSearch.trim())}`);
      setNavSearch('');
      setIsNavCollapsed(true);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="navbar navbar-expand-lg cinema-navbar sticky-top py-2">
      <div className="container">
        {/* Brand */}
        <Link className="brand-logo" to="/">
          <span className="brand-badge d-flex align-items-center justify-content-center">
            <BiCameraMovie size={22} />
          </span>
          <span>iMovies</span>
        </Link>

        {/* Mobile Toggle */}
        <button
          className="navbar-toggler border-secondary text-light"
          type="button"
          onClick={() => setIsNavCollapsed(!isNavCollapsed)}
          aria-expanded={!isNavCollapsed}
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon" style={{ filter: 'invert(1)' }}></span>
        </button>

        {/* Collapsible Content */}
        <div className={`collapse navbar-collapse ${!isNavCollapsed ? 'show' : ''}`} id="navbarContent">
          {/* Main Nav Links */}
          <ul className="navbar-nav me-auto mb-2 mb-lg-0 ms-lg-3 gap-1">
            <li className="nav-item">
              <NavLink className="nav-link" to="/" end onClick={() => setIsNavCollapsed(true)}>
                Home
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink className="nav-link" to="/movies" onClick={() => setIsNavCollapsed(true)}>
                Movies
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink className="nav-link" to="/theatres" onClick={() => setIsNavCollapsed(true)}>
                Theatres
              </NavLink>
            </li>
            {isAuthenticated && (
              <>
                <li className="nav-item">
                  <NavLink className="nav-link" to="/my-bookings" onClick={() => setIsNavCollapsed(true)}>
                    <MdConfirmationNumber className="me-1" /> My Bookings
                  </NavLink>
                </li>
                <li className="nav-item">
                  <NavLink className="nav-link" to="/watchlist" onClick={() => setIsNavCollapsed(true)}>
                    <MdBookmarkBorder className="me-1" />
                    Watchlist
                    {user?.watchlist?.length > 0 && (
                      <span className="badge bg-danger ms-1 rounded-pill small">
                        {user.watchlist.length}
                      </span>
                    )}
                  </NavLink>
                </li>
              </>
            )}
            {isAdmin && (
              <li className="nav-item">
                <NavLink
                  className="nav-link text-warning fw-bold"
                  to="/admin/dashboard"
                  onClick={() => setIsNavCollapsed(true)}
                >
                  <MdAdminPanelSettings className="me-1" /> Admin Portal
                </NavLink>
              </li>
            )}
          </ul>

          {/* Quick Search in Navbar */}
          <form className="d-flex my-2 my-lg-0 me-lg-3" onSubmit={handleSearchSubmit}>
            <div className="input-group input-group-sm" style={{ maxWidth: '240px' }}>
              <input
                type="text"
                className="form-control cinema-input border-secondary py-1 ps-3"
                placeholder="Search movies..."
                value={navSearch}
                onChange={(e) => setNavSearch(e.target.value)}
              />
              <button className="btn btn-cinema-primary px-3" type="submit">
                <MdSearch size={18} />
              </button>
            </div>
          </form>

          {/* Auth Actions */}
          <div className="d-flex align-items-center gap-2 mt-2 mt-lg-0">
            {isAuthenticated ? (
              <div className="dropdown">
                <button
                  className="btn btn-cinema-outline dropdown-toggle d-flex align-items-center gap-2 py-1 px-3"
                  type="button"
                  data-bs-toggle="dropdown"
                  aria-expanded="false"
                >
                  <div
                    className="rounded-circle bg-danger text-light d-flex align-items-center justify-content-center fw-bold"
                    style={{ width: '28px', height: '28px', fontSize: '0.85rem' }}
                  >
                    {user.username.charAt(0).toUpperCase()}
                  </div>
                  <span className="small fw-semibold">{user.username}</span>
                  {isAdmin && (
                    <span className="badge bg-warning text-dark small" style={{ fontSize: '0.65rem' }}>
                      ADMIN
                    </span>
                  )}
                </button>
                <ul
                  className="dropdown-menu dropdown-menu-end shadow-lg py-2 mt-2"
                  style={{ backgroundColor: '#0d1527', border: '1px solid #1e293b', minWidth: '220px' }}
                >
                  <li className="px-3 py-2 border-bottom border-secondary mb-1">
                    <div className="fw-bold text-light small">{user.username}</div>
                    <div className="text-muted small text-truncate">{user.email}</div>
                  </li>
                  {isAdmin && (
                    <li>
                      <Link className="dropdown-item text-warning py-2" to="/admin/dashboard">
                        <MdAdminPanelSettings className="me-2" /> Admin Dashboard
                      </Link>
                    </li>
                  )}
                  <li>
                    <Link className="dropdown-item text-light py-2" to="/profile">
                      <MdPerson className="me-2" /> My Profile
                    </Link>
                  </li>
                  <li>
                    <Link className="dropdown-item text-light py-2" to="/my-bookings">
                      <MdConfirmationNumber className="me-2" /> Booking History
                    </Link>
                  </li>
                  <li>
                    <Link className="dropdown-item text-light py-2" to="/watchlist">
                      <MdBookmarkBorder className="me-2" /> Saved Watchlist
                    </Link>
                  </li>
                  <li>
                    <hr className="dropdown-divider border-secondary my-1" />
                  </li>
                  <li>
                    <button
                      className="dropdown-item text-danger py-2 d-flex align-items-center"
                      onClick={handleLogout}
                    >
                      <MdLogout className="me-2" /> Logout
                    </button>
                  </li>
                </ul>
              </div>
            ) : (
              <div className="d-flex align-items-center gap-2">
                <Link to="/login" className="btn btn-cinema-outline btn-sm px-3">
                  Sign In
                </Link>
                <Link to="/register" className="btn btn-cinema-primary btn-sm px-3">
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
