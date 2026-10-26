import React, { useState, useEffect } from 'react';
import {
  MdPeople,
  MdSearch,
  MdShield,
  MdDelete,
  MdAdminPanelSettings,
  MdPerson
} from 'react-icons/md';
import API from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';

const AdminUsersPage = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (roleFilter !== 'All') params.role = roleFilter;

      const res = await API.get('/admin/users', { params });
      if (res.data.success) {
        setUsers(res.data.users);
      }
    } catch (err) {
      toast.error('Failed to load user accounts.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [roleFilter]);

  const handleRoleToggle = async (targetUser) => {
    const newRole = targetUser.role === 'admin' ? 'user' : 'admin';
    if (!window.confirm(`Change ${targetUser.username}'s access role to "${newRole.toUpperCase()}"?`)) {
      return;
    }

    try {
      const res = await API.put(`/admin/users/${targetUser._id}/role`, { role: newRole });
      if (res.data.success) {
        toast.success(res.data.message);
        fetchUsers();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update role.');
    }
  };

  const handleDeleteUser = async (targetUser) => {
    if (!window.confirm(`Are you sure you want to delete user ${targetUser.email}? This cannot be undone.`)) {
      return;
    }

    try {
      const res = await API.delete(`/admin/users/${targetUser._id}`);
      if (res.data.success) {
        toast.success(res.data.message);
        fetchUsers();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete user.');
    }
  };

  return (
    <div>
      {/* Top Header */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4 pb-2 border-bottom border-secondary">
        <div>
          <h3 className="text-light fw-bold mb-1 d-flex align-items-center gap-2">
            <MdPeople className="text-primary" /> User Accounts
          </h3>
          <p className="text-muted small mb-0">View registered moviegoers and manage administrator access privileges</p>
        </div>

        <div className="d-flex gap-2">
          <div className="input-group input-group-sm" style={{ width: '220px' }}>
            <span className="input-group-text bg-dark border-secondary text-secondary">
              <MdSearch />
            </span>
            <input
              type="text"
              className="form-control cinema-input border-secondary"
              placeholder="Search user..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchUsers()}
            />
          </div>

          <select
            className="form-select form-select-sm cinema-input"
            style={{ width: '130px' }}
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
          >
            <option value="All">All Roles</option>
            <option value="user">Users</option>
            <option value="admin">Admins</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      {loading ? (
        <LoadingSpinner text="Loading accounts directory..." />
      ) : (
        <div className="cinema-glass-card p-0 overflow-hidden">
          <div className="table-responsive">
            <table className="table cinema-table mb-0">
              <thead>
                <tr>
                  <th>User Profile</th>
                  <th>Email Address</th>
                  <th>Phone</th>
                  <th>Role</th>
                  <th>Joined Date</th>
                  <th className="text-end">Role / Action</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => {
                  const isCurrent = u._id === currentUser?._id;
                  return (
                    <tr key={u._id}>
                      <td>
                        <div className="d-flex align-items-center gap-2">
                          <div
                            className="rounded-circle bg-danger text-light d-flex align-items-center justify-content-center fw-bold small"
                            style={{ width: '32px', height: '32px' }}
                          >
                            {u.username.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <strong className="text-light">{u.username}</strong>
                            {isCurrent && (
                              <span className="badge bg-secondary ms-2 small" style={{ fontSize: '0.65rem' }}>
                                (YOU)
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="text-secondary">{u.email}</td>
                      <td className="text-muted small">{u.phone || '—'}</td>
                      <td>
                        {u.role === 'admin' ? (
                          <span className="badge bg-warning text-dark fw-bold d-inline-flex align-items-center gap-1">
                            <MdShield size={14} /> ADMIN
                          </span>
                        ) : (
                          <span className="badge bg-secondary d-inline-flex align-items-center gap-1">
                            <MdPerson size={14} /> USER
                          </span>
                        )}
                      </td>
                      <td className="text-muted small">
                        {new Date(u.createdAt).toLocaleDateString()}
                      </td>
                      <td className="text-end">
                        <div className="d-flex justify-content-end gap-2">
                          {!isCurrent && (
                            <>
                              <button
                                className={`btn btn-sm ${
                                  u.role === 'admin' ? 'btn-outline-warning' : 'btn-outline-info'
                                } px-2 py-1`}
                                onClick={() => handleRoleToggle(u)}
                                title={u.role === 'admin' ? 'Revoke Admin' : 'Promote to Admin'}
                              >
                                {u.role === 'admin' ? 'Demote' : 'Make Admin'}
                              </button>
                              <button
                                className="btn btn-outline-danger btn-sm p-1 px-2"
                                onClick={() => handleDeleteUser(u)}
                                title="Delete user"
                              >
                                <MdDelete size={16} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsersPage;
