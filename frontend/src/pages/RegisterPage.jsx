import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MdPerson, MdEmail, MdLock, MdPhone, MdVisibility, MdVisibilityOff } from 'react-icons/md';
import { BiCameraMovie } from 'react-icons/bi';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';

const RegisterPage = () => {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!username || !email || !password || !confirmPassword) {
      toast.warn('Please fill in all required fields.');
      return;
    }

    if (password !== confirmPassword) {
      toast.error('Passwords do not match. Please verify.');
      return;
    }

    if (password.length < 6) {
      toast.warn('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);
    try {
      const res = await register(username, email, password, confirmPassword, phone);
      if (res.success) {
        toast.success('Registration successful! Welcome to iMovies 🎉');
        navigate('/');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed. Email might already exist.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="py-5 d-flex align-items-center justify-content-center flex-grow-1">
      <div className="container" style={{ maxWidth: '480px' }}>
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
            <h4 className="text-light fw-bold mb-1">Create an Account</h4>
            <p className="text-muted small">Join iMovies to book seats & unlock cinema perks</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="form-label text-muted small fw-semibold">Username *</label>
              <div className="input-group">
                <span className="input-group-text bg-dark border-secondary text-secondary">
                  <MdPerson />
                </span>
                <input
                  type="text"
                  className="form-control cinema-input border-secondary"
                  placeholder="e.g. John Doe"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="mb-3">
              <label className="form-label text-muted small fw-semibold">Email Address *</label>
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

            <div className="mb-3">
              <label className="form-label text-muted small fw-semibold">Mobile Phone (Optional)</label>
              <div className="input-group">
                <span className="input-group-text bg-dark border-secondary text-secondary">
                  <MdPhone />
                </span>
                <input
                  type="tel"
                  className="form-control cinema-input border-secondary"
                  placeholder="+91 98765 43210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
            </div>

            <div className="mb-3">
              <label className="form-label text-muted small fw-semibold">Password *</label>
              <div className="input-group">
                <span className="input-group-text bg-dark border-secondary text-secondary">
                  <MdLock />
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="form-control cinema-input border-secondary"
                  placeholder="Minimum 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="input-group-text bg-dark border-secondary text-secondary"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <MdVisibilityOff /> : <MdVisibility />}
                </button>
              </div>
            </div>

            <div className="mb-4">
              <label className="form-label text-muted small fw-semibold">Confirm Password *</label>
              <div className="input-group">
                <span className="input-group-text bg-dark border-secondary text-secondary">
                  <MdLock />
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="form-control cinema-input border-secondary"
                  placeholder="Re-enter password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-cinema-primary w-100 py-2 fw-bold mb-3"
              disabled={loading}
            >
              {loading ? 'Creating Account...' : 'Register Account'}
            </button>
          </form>

          {/* Link to Login */}
          <div className="text-center mt-3 text-muted small">
            Already have an account?{' '}
            <Link to="/login" className="text-danger text-decoration-none fw-bold">
              Sign In here
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
