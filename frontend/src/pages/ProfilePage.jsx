import React, { useState } from 'react';
import { MdPerson, MdEmail, MdPhone, MdShield, MdSave, MdConfirmationNumber } from 'react-icons/md';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';

const ProfilePage = () => {
  const { user, updateProfile, isAdmin } = useAuth();
  const [username, setUsername] = useState(user?.username || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim()) {
      toast.warn('Username cannot be empty.');
      return;
    }

    setLoading(true);
    try {
      const res = await updateProfile({ username, phone });
      if (res.success) {
        toast.success('Profile updated successfully.');
      }
    } catch (err) {
      toast.error('Failed to update profile.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="py-5">
      <div className="container" style={{ maxWidth: '650px' }}>
        <div className="cinema-glass-card p-4">
          {/* Header */}
          <div className="d-flex align-items-center gap-3 pb-4 mb-4 border-bottom border-secondary">
            <div
              className="rounded-circle bg-danger text-light d-flex align-items-center justify-content-center fw-bold fs-3 shadow"
              style={{ width: '64px', height: '64px' }}
            >
              {user?.username?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div>
              <h4 className="text-light fw-bold mb-1">{user?.username}</h4>
              <div className="text-muted small">{user?.email}</div>
              <div className="mt-1">
                {isAdmin ? (
                  <span className="badge bg-warning text-dark fw-bold">ADMINISTRATOR</span>
                ) : (
                  <span className="badge bg-secondary">CINEMA MEMBER</span>
                )}
              </div>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="form-label text-muted small fw-semibold">
                <MdPerson className="text-danger me-1" /> Username
              </label>
              <input
                type="text"
                className="form-control cinema-input"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>

            <div className="mb-3">
              <label className="form-label text-muted small fw-semibold">
                <MdEmail className="text-danger me-1" /> Email Address
              </label>
              <input
                type="email"
                className="form-control cinema-input opacity-75"
                value={user?.email || ''}
                disabled
              />
              <span className="text-secondary small">Email address cannot be changed.</span>
            </div>

            <div className="mb-4">
              <label className="form-label text-muted small fw-semibold">
                <MdPhone className="text-danger me-1" /> Mobile Contact Number
              </label>
              <input
                type="text"
                className="form-control cinema-input"
                placeholder="+91 98765 43210"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>

            <button
              type="submit"
              className="btn btn-cinema-primary w-100 py-2 d-flex align-items-center justify-content-center gap-2"
              disabled={loading}
            >
              <MdSave /> {loading ? 'Saving Changes...' : 'Save Profile Changes'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
