import React, { useState, useEffect } from 'react';
import {
  MdTheaters,
  MdAdd,
  MdEdit,
  MdDelete,
  MdLocationOn,
  MdSearch,
  MdEventSeat
} from 'react-icons/md';
import API from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import { toast } from 'react-toastify';

const initialTheatreForm = {
  name: '',
  location: '',
  city: 'Mumbai',
  address: '',
  screenName: 'Audi 1',
  facilities: 'Dolby Atmos 7.1, 4K Projection, Food & Beverages, Valet Parking',
  seatConfiguration: {
    balcony: { rows: 2, seatsPerRow: 10, price: 350, label: 'Balcony (Premium Recliner)' },
    middle: { rows: 4, seatsPerRow: 10, price: 250, label: 'Executive (Middle Class)' },
    lower: { rows: 2, seatsPerRow: 10, price: 180, label: 'Classic (Lower Tier)' }
  }
};

const AdminTheatresPage = () => {
  const [theatres, setTheatres] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTheatreId, setEditingTheatreId] = useState(null);
  const [formData, setFormData] = useState(initialTheatreForm);
  const [submitting, setSubmitting] = useState(false);

  const fetchTheatres = async () => {
    try {
      const res = await API.get('/theatres');
      if (res.data.success) {
        setTheatres(res.data.theatres);
      }
    } catch (err) {
      toast.error('Failed to load theatres.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTheatres();
  }, []);

  const calculateCapacity = (cfg) => {
    const b = (Number(cfg?.balcony?.rows) || 0) * (Number(cfg?.balcony?.seatsPerRow) || 0);
    const m = (Number(cfg?.middle?.rows) || 0) * (Number(cfg?.middle?.seatsPerRow) || 0);
    const l = (Number(cfg?.lower?.rows) || 0) * (Number(cfg?.lower?.seatsPerRow) || 0);
    return b + m + l;
  };

  const handleOpenAdd = () => {
    setEditingTheatreId(null);
    setFormData(initialTheatreForm);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (theatre) => {
    setEditingTheatreId(theatre._id);
    setFormData({
      name: theatre.name,
      location: theatre.location,
      city: theatre.city || 'Mumbai',
      address: theatre.address || '',
      screenName: theatre.screenName || 'Audi 1',
      facilities: Array.isArray(theatre.facilities) ? theatre.facilities.join(', ') : '',
      seatConfiguration: {
        balcony: {
          rows: theatre.seatConfiguration?.balcony?.rows || 2,
          seatsPerRow: theatre.seatConfiguration?.balcony?.seatsPerRow || 10,
          price: theatre.seatConfiguration?.balcony?.price || 350,
          label: theatre.seatConfiguration?.balcony?.label || 'Balcony (Premium Recliner)'
        },
        middle: {
          rows: theatre.seatConfiguration?.middle?.rows || 4,
          seatsPerRow: theatre.seatConfiguration?.middle?.seatsPerRow || 10,
          price: theatre.seatConfiguration?.middle?.price || 250,
          label: theatre.seatConfiguration?.middle?.label || 'Executive (Middle Class)'
        },
        lower: {
          rows: theatre.seatConfiguration?.lower?.rows || 2,
          seatsPerRow: theatre.seatConfiguration?.lower?.seatsPerRow || 10,
          price: theatre.seatConfiguration?.lower?.price || 180,
          label: theatre.seatConfiguration?.lower?.label || 'Classic (Lower Tier)'
        }
      }
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.location) {
      toast.warn('Theatre name and location are required.');
      return;
    }

    setSubmitting(true);
    try {
      if (editingTheatreId) {
        const res = await API.put(`/theatres/${editingTheatreId}`, formData);
        if (res.data.success) {
          toast.success('Theatre updated successfully!');
        }
      } else {
        const res = await API.post('/theatres', formData);
        if (res.data.success) {
          toast.success('Theatre added successfully!');
        }
      }
      setIsModalOpen(false);
      fetchTheatres();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save theatre.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this theatre? Shows assigned to this theatre must be removed first.')) {
      return;
    }

    try {
      const res = await API.delete(`/theatres/${id}`);
      if (res.data.success) {
        toast.success(res.data.message);
        fetchTheatres();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Cannot delete theatre with scheduled shows.');
    }
  };

  const filteredTheatres = theatres.filter(
    (t) =>
      t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.city.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <LoadingSpinner text="Loading theatre networks..." />;

  const currentCapacity = calculateCapacity(formData.seatConfiguration);

  return (
    <div>
      {/* Top Header */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4 pb-2 border-bottom border-secondary">
        <div>
          <h3 className="text-light fw-bold mb-1 d-flex align-items-center gap-2">
            <MdTheaters className="text-warning" /> Theatre Management
          </h3>
          <p className="text-muted small mb-0">Configure multiplex screens, seating tiers, and default prices</p>
        </div>

        <div className="d-flex gap-2">
          <div className="input-group input-group-sm" style={{ width: '220px' }}>
            <span className="input-group-text bg-dark border-secondary text-secondary">
              <MdSearch />
            </span>
            <input
              type="text"
              className="form-control cinema-input border-secondary"
              placeholder="Search theatre..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button className="btn btn-cinema-primary btn-sm d-flex align-items-center gap-1" onClick={handleOpenAdd}>
            <MdAdd size={18} /> Add Theatre
          </button>
        </div>
      </div>

      {/* Theatres Grid */}
      <div className="row g-4">
        {filteredTheatres.map((t) => (
          <div key={t._id} className="col-lg-6">
            <div className="cinema-glass-card h-100 p-4 d-flex flex-column justify-content-between">
              <div>
                <div className="d-flex justify-content-between align-items-start mb-2">
                  <div>
                    <h5 className="text-light fw-bold mb-1">{t.name}</h5>
                    <div className="text-muted small d-flex align-items-center gap-1">
                      <MdLocationOn className="text-danger" /> {t.location}, {t.city}
                    </div>
                  </div>
                  <span className="badge bg-warning text-dark fw-bold px-3 py-2">
                    {t.seatingCapacity} Total Seats
                  </span>
                </div>

                <div className="text-secondary small mb-3">{t.screenName || 'Audi 1'}</div>

                {/* Seat Tiers Summary */}
                <div className="p-3 bg-dark rounded border border-secondary mb-3 small">
                  <div className="d-flex justify-content-between py-1 border-bottom border-secondary">
                    <span>Balcony (Top Class):</span>
                    <strong className="text-warning">
                      ₹{t.seatConfiguration?.balcony?.price} • {t.seatConfiguration?.balcony?.rows} rows ×{' '}
                      {t.seatConfiguration?.balcony?.seatsPerRow} seats
                    </strong>
                  </div>
                  <div className="d-flex justify-content-between py-1 border-bottom border-secondary">
                    <span>Executive (Middle):</span>
                    <strong className="text-info">
                      ₹{t.seatConfiguration?.middle?.price} • {t.seatConfiguration?.middle?.rows} rows ×{' '}
                      {t.seatConfiguration?.middle?.seatsPerRow} seats
                    </strong>
                  </div>
                  <div className="d-flex justify-content-between py-1">
                    <span>Classic (Lower):</span>
                    <strong className="text-secondary">
                      ₹{t.seatConfiguration?.lower?.price} • {t.seatConfiguration?.lower?.rows} rows ×{' '}
                      {t.seatConfiguration?.lower?.seatsPerRow} seats
                    </strong>
                  </div>
                </div>

                {/* Facilities */}
                {t.facilities && (
                  <div className="d-flex flex-wrap gap-1 mb-3">
                    {t.facilities.map((fac) => (
                      <span key={fac} className="badge bg-dark border border-secondary text-secondary small">
                        {fac}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="d-flex justify-content-end gap-2 pt-2 border-top border-secondary">
                <button className="btn btn-outline-info btn-sm px-3" onClick={() => handleOpenEdit(t)}>
                  <MdEdit className="me-1" /> Edit
                </button>
                <button className="btn btn-outline-danger btn-sm px-3" onClick={() => handleDelete(t._id)}>
                  <MdDelete className="me-1" /> Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal: Add / Edit Theatre */}
      {isModalOpen && (
        <div
          className="modal fade show d-block"
          style={{ backgroundColor: 'rgba(0,0,0,0.85)' }}
          tabIndex="-1"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="modal-dialog modal-dialog-centered modal-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-content cinema-modal border border-secondary">
              <div className="modal-header">
                <h5 className="modal-title text-light fw-bold">
                  {editingTheatreId ? 'Edit Theatre Configuration' : 'Add New Cinema Theatre'}
                </h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setIsModalOpen(false)}
                ></button>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="modal-body p-4">
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label text-muted small fw-semibold">Theatre Name *</label>
                      <input
                        type="text"
                        className="form-control cinema-input"
                        placeholder="e.g. PVR ICON: Phoenix Palladium"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                      />
                    </div>

                    <div className="col-md-3">
                      <label className="form-label text-muted small fw-semibold">City *</label>
                      <input
                        type="text"
                        className="form-control cinema-input"
                        placeholder="Mumbai"
                        value={formData.city}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                        required
                      />
                    </div>

                    <div className="col-md-3">
                      <label className="form-label text-muted small fw-semibold">Screen Name</label>
                      <input
                        type="text"
                        className="form-control cinema-input"
                        placeholder="Audi 1"
                        value={formData.screenName}
                        onChange={(e) => setFormData({ ...formData, screenName: e.target.value })}
                      />
                    </div>

                    <div className="col-12">
                      <label className="form-label text-muted small fw-semibold">Location / Area *</label>
                      <input
                        type="text"
                        className="form-control cinema-input"
                        placeholder="e.g. Lower Parel, South Mumbai"
                        value={formData.location}
                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                        required
                      />
                    </div>

                    {/* Seating Layout Generator Card */}
                    <div className="col-12 mt-4">
                      <div className="p-3 bg-dark rounded border border-secondary">
                        <div className="d-flex justify-content-between align-items-center mb-3">
                          <h6 className="text-light fw-bold mb-0 d-flex align-items-center gap-2">
                            <MdEventSeat className="text-danger" /> Seating Layout & Tier Configuration
                          </h6>
                          <span className="badge bg-warning text-dark fs-6 fw-bold">
                            Total Capacity: {currentCapacity} Seats
                          </span>
                        </div>

                        {/* Balcony Config */}
                        <div className="row g-2 align-items-center mb-3 pb-3 border-bottom border-secondary">
                          <div className="col-md-4">
                            <strong className="text-warning small d-block">1. Balcony (Premium Tier)</strong>
                            <span className="text-muted small">Top rows of cinema hall</span>
                          </div>
                          <div className="col-md-2">
                            <label className="form-label text-muted small mb-0">Rows</label>
                            <input
                              type="number"
                              min="1"
                              className="form-control cinema-input form-control-sm"
                              value={formData.seatConfiguration.balcony.rows}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  seatConfiguration: {
                                    ...formData.seatConfiguration,
                                    balcony: {
                                      ...formData.seatConfiguration.balcony,
                                      rows: Number(e.target.value)
                                    }
                                  }
                                })
                              }
                            />
                          </div>
                          <div className="col-md-3">
                            <label className="form-label text-muted small mb-0">Seats per Row</label>
                            <input
                              type="number"
                              min="1"
                              className="form-control cinema-input form-control-sm"
                              value={formData.seatConfiguration.balcony.seatsPerRow}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  seatConfiguration: {
                                    ...formData.seatConfiguration,
                                    balcony: {
                                      ...formData.seatConfiguration.balcony,
                                      seatsPerRow: Number(e.target.value)
                                    }
                                  }
                                })
                              }
                            />
                          </div>
                          <div className="col-md-3">
                            <label className="form-label text-muted small mb-0">Ticket Price (₹)</label>
                            <input
                              type="number"
                              min="50"
                              className="form-control cinema-input form-control-sm"
                              value={formData.seatConfiguration.balcony.price}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  seatConfiguration: {
                                    ...formData.seatConfiguration,
                                    balcony: {
                                      ...formData.seatConfiguration.balcony,
                                      price: Number(e.target.value)
                                    }
                                  }
                                })
                              }
                            />
                          </div>
                        </div>

                        {/* Middle Config */}
                        <div className="row g-2 align-items-center mb-3 pb-3 border-bottom border-secondary">
                          <div className="col-md-4">
                            <strong className="text-info small d-block">2. Executive (Middle Tier)</strong>
                            <span className="text-muted small">Main central seating rows</span>
                          </div>
                          <div className="col-md-2">
                            <label className="form-label text-muted small mb-0">Rows</label>
                            <input
                              type="number"
                              min="1"
                              className="form-control cinema-input form-control-sm"
                              value={formData.seatConfiguration.middle.rows}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  seatConfiguration: {
                                    ...formData.seatConfiguration,
                                    middle: {
                                      ...formData.seatConfiguration.middle,
                                      rows: Number(e.target.value)
                                    }
                                  }
                                })
                              }
                            />
                          </div>
                          <div className="col-md-3">
                            <label className="form-label text-muted small mb-0">Seats per Row</label>
                            <input
                              type="number"
                              min="1"
                              className="form-control cinema-input form-control-sm"
                              value={formData.seatConfiguration.middle.seatsPerRow}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  seatConfiguration: {
                                    ...formData.seatConfiguration,
                                    middle: {
                                      ...formData.seatConfiguration.middle,
                                      seatsPerRow: Number(e.target.value)
                                    }
                                  }
                                })
                              }
                            />
                          </div>
                          <div className="col-md-3">
                            <label className="form-label text-muted small mb-0">Ticket Price (₹)</label>
                            <input
                              type="number"
                              min="50"
                              className="form-control cinema-input form-control-sm"
                              value={formData.seatConfiguration.middle.price}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  seatConfiguration: {
                                    ...formData.seatConfiguration,
                                    middle: {
                                      ...formData.seatConfiguration.middle,
                                      price: Number(e.target.value)
                                    }
                                  }
                                })
                              }
                            />
                          </div>
                        </div>

                        {/* Lower Config */}
                        <div className="row g-2 align-items-center">
                          <div className="col-md-4">
                            <strong className="text-secondary small d-block">3. Classic (Lower Tier)</strong>
                            <span className="text-muted small">Front rows near the screen</span>
                          </div>
                          <div className="col-md-2">
                            <label className="form-label text-muted small mb-0">Rows</label>
                            <input
                              type="number"
                              min="1"
                              className="form-control cinema-input form-control-sm"
                              value={formData.seatConfiguration.lower.rows}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  seatConfiguration: {
                                    ...formData.seatConfiguration,
                                    lower: {
                                      ...formData.seatConfiguration.lower,
                                      rows: Number(e.target.value)
                                    }
                                  }
                                })
                              }
                            />
                          </div>
                          <div className="col-md-3">
                            <label className="form-label text-muted small mb-0">Seats per Row</label>
                            <input
                              type="number"
                              min="1"
                              className="form-control cinema-input form-control-sm"
                              value={formData.seatConfiguration.lower.seatsPerRow}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  seatConfiguration: {
                                    ...formData.seatConfiguration,
                                    lower: {
                                      ...formData.seatConfiguration.lower,
                                      seatsPerRow: Number(e.target.value)
                                    }
                                  }
                                })
                              }
                            />
                          </div>
                          <div className="col-md-3">
                            <label className="form-label text-muted small mb-0">Ticket Price (₹)</label>
                            <input
                              type="number"
                              min="50"
                              className="form-control cinema-input form-control-sm"
                              value={formData.seatConfiguration.lower.price}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  seatConfiguration: {
                                    ...formData.seatConfiguration,
                                    lower: {
                                      ...formData.seatConfiguration.lower,
                                      price: Number(e.target.value)
                                    }
                                  }
                                })
                              }
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Facilities */}
                    <div className="col-12 mt-3">
                      <label className="form-label text-muted small fw-semibold">Facilities (comma-separated)</label>
                      <input
                        type="text"
                        className="form-control cinema-input"
                        placeholder="Dolby Atmos 7.1, 4K Projection, Recliner Seats"
                        value={formData.facilities}
                        onChange={(e) => setFormData({ ...formData, facilities: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-outline-secondary btn-sm"
                    onClick={() => setIsModalOpen(false)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-cinema-primary btn-sm" disabled={submitting}>
                    {submitting ? 'Saving...' : editingTheatreId ? 'Update Theatre' : 'Create Theatre'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminTheatresPage;
