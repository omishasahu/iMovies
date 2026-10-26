import React from 'react';
import '../styles/seating.css';

const SeatGrid = ({
  seats = [],
  selectedSeatNumbers = [],
  onSeatClick,
  currentUserId
}) => {
  // Group seats by tier
  const balconySeats = seats.filter((s) => s.tier === 'balcony');
  const middleSeats = seats.filter((s) => s.tier === 'middle');
  const lowerSeats = seats.filter((s) => s.tier === 'lower');

  // Helper to group array of seats by row letter
  const groupByRow = (seatList) => {
    const rows = {};
    seatList.forEach((seat) => {
      if (!rows[seat.row]) {
        rows[seat.row] = [];
      }
      rows[seat.row].push(seat);
    });
    // Sort each row by number
    Object.keys(rows).forEach((r) => {
      rows[r].sort((a, b) => a.number - b.number);
    });
    return rows;
  };

  const renderTier = (tierName, tierPrice, tierSeats, badgeColor) => {
    if (!tierSeats || tierSeats.length === 0) return null;

    const rowGroups = groupByRow(tierSeats);
    const rowKeys = Object.keys(rowGroups).sort();

    return (
      <div className="seat-tier-section mb-4">
        <div className="tier-header d-flex justify-content-between align-items-center mb-3">
          <div className="d-flex align-items-center gap-2">
            <span className={`badge ${badgeColor} text-uppercase px-2 py-1`}>
              {tierName}
            </span>
            <span className="text-secondary small">({tierSeats.length} seats)</span>
          </div>
          <div className="tier-price">₹{tierPrice} <span className="small text-muted fw-normal">/ ticket</span></div>
        </div>

        {rowKeys.map((rowKey) => (
          <div key={rowKey} className="seat-row">
            <span className="row-label">{rowKey}</span>
            <div className="seats-group">
              {rowGroups[rowKey].map((seat, index) => {
                const isSelected = selectedSeatNumbers.includes(seat.seatNumber);
                const isBooked = seat.status === 'booked';
                // Locked by someone else
                const isLockedOther =
                  seat.status === 'locked' &&
                  seat.lockedBy &&
                  currentUserId &&
                  seat.lockedBy.toString() !== currentUserId.toString();

                let seatClass = 'available';
                if (isBooked) {
                  seatClass = 'booked';
                } else if (isLockedOther) {
                  seatClass = 'locked';
                } else if (isSelected) {
                  seatClass = 'selected';
                }

                // Split into 2 blocks with an aisle in the middle (e.g. after seat 5)
                const isAisle = index === 4;

                return (
                  <React.Fragment key={seat.seatNumber}>
                    <button
                      type="button"
                      className={`seat-btn ${seatClass}`}
                      disabled={isBooked || isLockedOther}
                      onClick={() => onSeatClick(seat)}
                      title={`${seat.seatNumber} • ₹${seat.price} (${seatClass})`}
                    >
                      {seat.number}
                    </button>
                    {isAisle && <div className="seat-aisle" />}
                  </React.Fragment>
                );
              })}
            </div>
            <span className="row-label">{rowKey}</span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="seating-container">
      {/* Curved Screen Area */}
      <div className="screen-area">
        <div className="cinema-screen-curve"></div>
        <div className="screen-text">
          <span>Cinema Screen This Way</span>
        </div>
      </div>

      {/* 1. Balcony (Premium / Recliner) */}
      {renderTier(
        'Balcony (Premium Recliner)',
        balconySeats[0]?.price || 350,
        balconySeats,
        'bg-warning text-dark'
      )}

      {/* 2. Middle (Executive) */}
      {renderTier(
        'Executive (Middle Tier)',
        middleSeats[0]?.price || 250,
        middleSeats,
        'bg-info text-dark'
      )}

      {/* 3. Lower (Classic) */}
      {renderTier(
        'Classic (Lower Tier)',
        lowerSeats[0]?.price || 180,
        lowerSeats,
        'bg-secondary text-light'
      )}

      {/* Legend */}
      <div className="seat-legend">
        <div className="legend-item">
          <span className="legend-swatch available"></span>
          <span>Available</span>
        </div>
        <div className="legend-item">
          <span className="legend-swatch selected"></span>
          <span>Selected</span>
        </div>
        <div className="legend-item">
          <span className="legend-swatch booked"></span>
          <span>Already Booked</span>
        </div>
        <div className="legend-item">
          <span className="legend-swatch locked"></span>
          <span>Locked by another user</span>
        </div>
      </div>
    </div>
  );
};

export default SeatGrid;
