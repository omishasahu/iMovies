import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MdTheaters, MdLocationOn, MdStar, MdMovie } from 'react-icons/md';
import API from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';

const TheatresPage = () => {
  const [theatres, setTheatres] = useState([]);
  const [cities, setCities] = useState([]);
  const [selectedCity, setSelectedCity] = useState('All');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTheatres = async () => {
      setLoading(true);
      try {
        const res = await API.get('/theatres', {
          params: selectedCity !== 'All' ? { city: selectedCity } : {}
        });
        if (res.data.success) {
          setTheatres(res.data.theatres);
          if (res.data.cities) setCities(['All', ...res.data.cities]);
        }
      } catch (err) {
        console.error('Failed to load theatres:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchTheatres();
  }, [selectedCity]);

  if (loading) return <LoadingSpinner text="Locating cinema theatres near you..." />;

  return (
    <div className="py-5">
      <div className="container">
        {/* Header */}
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4 pb-2 border-bottom border-secondary">
          <div>
            <h3 className="text-light fw-bold mb-1 d-flex align-items-center gap-2">
              <MdTheaters className="text-danger" /> Cinema Theatres & Multiplexes
            </h3>
            <p className="text-muted small mb-0">Discover top-tier screens equipped with Dolby Atmos, 4K Projection, and luxury recliners</p>
          </div>

          {/* City Filter */}
          {cities.length > 0 && (
            <div className="d-flex align-items-center gap-2">
              <span className="text-muted small fw-bold">Select City:</span>
              <select
                className="form-select form-select-sm cinema-input"
                style={{ width: '150px' }}
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
              >
                {cities.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Theatres Grid */}
        <div className="row g-4">
          {theatres.map((t) => (
            <div key={t._id} className="col-lg-6">
              <div className="cinema-glass-card h-100 p-4 d-flex flex-column justify-content-between">
                <div>
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <div>
                      <h4 className="text-light fw-bold mb-1">{t.name}</h4>
                      <div className="text-muted small d-flex align-items-center gap-1 mb-2">
                        <MdLocationOn className="text-danger" /> {t.location}, {t.city}
                      </div>
                    </div>
                    <span className="badge bg-secondary">{t.screenName || 'Audi 1'}</span>
                  </div>

                  <p className="text-secondary small mb-3">{t.address || `${t.location}, ${t.city}`}</p>

                  {/* Seating Categories */}
                  <div className="p-3 bg-dark rounded border border-secondary mb-3 small">
                    <div className="text-muted fw-bold mb-2">SEATING & PRICING:</div>
                    <div className="row g-2">
                      <div className="col-4">
                        <div className="text-warning fw-semibold">Balcony</div>
                        <div className="text-light">₹{t.seatConfiguration?.balcony?.price || 350}</div>
                      </div>
                      <div className="col-4">
                        <div className="text-info fw-semibold">Executive</div>
                        <div className="text-light">₹{t.seatConfiguration?.middle?.price || 250}</div>
                      </div>
                      <div className="col-4">
                        <div className="text-secondary fw-semibold">Classic</div>
                        <div className="text-light">₹{t.seatConfiguration?.lower?.price || 180}</div>
                      </div>
                    </div>
                  </div>

                  {/* Facilities */}
                  {t.facilities && (
                    <div className="d-flex flex-wrap gap-1 mb-3">
                      {t.facilities.map((f) => (
                        <span key={f} className="badge bg-dark border border-secondary text-secondary small">
                          {f}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="pt-3 border-top border-secondary">
                  <Link to="/" className="btn btn-cinema-primary btn-sm w-100 py-2 d-flex align-items-center justify-content-center gap-2">
                    <MdMovie /> Browse Movies Showing at this Theatre
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TheatresPage;
