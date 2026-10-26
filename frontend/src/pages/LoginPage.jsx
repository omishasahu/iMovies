import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { MdEmail, MdLock, MdVisibility, MdVisibilityOff } from 'react-icons/md';
import { BiCameraMovie } from 'react-icons/bi';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';

const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const from = location.state?.from?.pathname || '/';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      toast.warn('Please fill in both email and password.');
      return;
    }

    setLoading(true);
    try {
      const res = await login(email, password);
      if (res.success) {
        toast.success(`Welcome back, ${res.user.username}! 🎬`);
        if (res.user.role === 'admin' && from === '/') {
          navigate('/admin/dashboard');
        } else {
          navigate(from, { replace: true });
        }
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemoLogin = async (demoEmail, demoPassword) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
    setLoading(true);
    try {
      const res = await login(demoEmail, demoPassword);
      if (res.success) {
        toast.success(`Logged in as ${res.user.role === 'admin' ? 'Administrator' : 'Cinema User'}!`);
        if (res.user.role === 'admin') {
          navigate('/admin/dashboard');
        } else {
          navigate(from, { replace: true });
        }
      }
    } catch (err) {
      toast.error('Quick demo login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="py-5 d-flex align-items-center justify-content-center flex-grow-1">
      <div className="container" style={{ maxWidth: '460px' }}>
        <div className="cinema-glass-card p-4 p-sm-5 shadow-lg">
          {/* Brand & Heading */}
          <div className="text-center mb-4">
            <Link to="/" className="d-inline-flex align-items-center gap-2 text-decoration-none mb-2">
              <span className="brand-badge d-flex align-items-center justify-content-center">
                <BiCameraMovie size={22} />
              </span>
              <span className="fw-bold fs-3 text-light" style={{ fontFamily: 'Cinzel, serif' }}>
                iMovies
              </span>
            </Link>
            <h4 className="text-light fw-bold mb-1">Sign In to Your Account</h4>
            <p className="text-muted small">Access your bookings, tickets, and watchlist</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="form-label text-muted small fw-semibold">Email Address</label>
              <div className="input-group">
                <span className="input-group-text bg-dark border-secondary text-secondary">
                  <MdEmail />
                </span>
                <input
                  type="email"
                  className="form-control cinema-input border-secondary"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="mb-4">
              <label className="form-label text-muted small fw-semibold">Password</label>
              <div className="input-group">
                <span className="input-group-text bg-dark border-secondary text-secondary">
                  <MdLock />
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="form-control cinema-input border-secondary"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="input-group-text bg-dark border-secondary text-secondary"
                  onClick={() => setShowPassword(!showPassword)}
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <MdVisibilityOff /> : <MdVisibility />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-cinema-primary w-100 py-2 fw-bold mb-3"
              disabled={loading}
            >
              {loading ? 'Authenticating...' : 'Sign In'}
            </button>
          </form>

          {/* Demo Quick Logins */}
          <div className="border-top border-secondary pt-3 mt-3 text-center">
            <span className="text-muted small d-block mb-2">Quick 1-Click Demo Login:</span>
            <div className="d-flex gap-2">
              <button
                type="button"
                className="btn btn-outline-warning btn-sm flex-grow-1"
                onClick={() => handleQuickDemoLogin('admin@imovies.com', 'AdminPassword@123')}
                disabled={loading}
              >
                Admin Demo
              </button>
              <button
                type="button"
                className="btn btn-outline-info btn-sm flex-grow-1"
                onClick={() => handleQuickDemoLogin('user@imovies.com', 'UserPassword@123')}
                disabled={loading}
              >
                User Demo
              </button>
            </div>
          </div>

          {/* Link to Register */}
          <div className="text-center mt-4 text-muted small">
            Don't have an iMovies account?{' '}
            <Link to="/register" className="text-danger text-decoration-none fw-bold">
              Sign Up here
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
