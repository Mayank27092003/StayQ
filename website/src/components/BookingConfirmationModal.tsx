import React from 'react';
import { CheckCircle2, QrCode, Download, Calendar, MapPin, Sparkles, X } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const BookingConfirmationModal: React.FC = () => {
  const { activeConfirmation, setActiveConfirmation } = useApp();

  if (!activeConfirmation) return null;

  const handleGoToTrips = () => {
    setActiveConfirmation(null);
    window.location.hash = '#/trips';
  };

  return (
    <div className="confirmation-modal-backdrop" onClick={() => setActiveConfirmation(null)}>
      <div className="confirmation-modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-btn" onClick={() => setActiveConfirmation(null)}>
          <X size={20} />
        </button>

        <div className="confirmation-badge-icon">
          <CheckCircle2 size={48} color="#12b76a" />
        </div>

        <span className="eyebrow" style={{ color: 'var(--green)' }}>
          <Sparkles size={14} /> Booking Confirmed
        </span>
        <h2 className="h2" style={{ marginTop: '0.4rem', marginBottom: '0.4rem' }}>
          You're all set to go!
        </h2>
        <p className="lead" style={{ fontSize: '1rem', color: 'var(--gray-600)' }}>
          We've sent the confirmation receipt, host directions, and check-in keypad code to <strong>{activeConfirmation.guestEmail}</strong>.
        </p>

        {/* Boarding Card Ticket */}
        <div className="ticket-card">
          <div className="ticket-card__header">
            <div>
              <span className="ticket-card__ref-label">Booking Reference</span>
              <div className="ticket-card__ref-code">{activeConfirmation.referenceCode}</div>
            </div>
            <div className="ticket-card__status">CONFIRMED</div>
          </div>

          <div className="ticket-card__body">
            <div className="ticket-card__img-wrap">
              <img src={activeConfirmation.itemImage} alt={activeConfirmation.itemTitle} />
            </div>
            <div className="ticket-card__details">
              <h4>{activeConfirmation.itemTitle}</h4>
              <p className="ticket-card__loc">
                <MapPin size={14} /> {activeConfirmation.itemLocation}
              </p>

              <div className="ticket-card__grid">
                <div>
                  <span className="ticket-label">Check-in</span>
                  <strong>{activeConfirmation.checkInDate}</strong>
                </div>
                <div>
                  <span className="ticket-label">Check-out</span>
                  <strong>{activeConfirmation.checkOutDate}</strong>
                </div>
                <div>
                  <span className="ticket-label">Guest</span>
                  <strong>{activeConfirmation.guestName}</strong>
                </div>
                <div>
                  <span className="ticket-label">Total Paid</span>
                  <strong className="text-violet">₹{activeConfirmation.totalPrice.toLocaleString('en-IN')}</strong>
                </div>
              </div>
            </div>
          </div>

          <div className="ticket-card__footer">
            <div className="ticket-card__qr">
              <QrCode size={40} />
              <span>Smart Entry Pass</span>
            </div>
            <div className="ticket-card__entry-note">
              Show this code to the host or key in on the smart lock door upon arrival.
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="confirmation-actions">
          <button className="btn btn--primary btn--lg" onClick={handleGoToTrips}>
            <Calendar size={18} />
            View in My Trips
          </button>
          <button
            className="btn btn--ghost btn--lg"
            onClick={() => {
              window.print();
            }}
          >
            <Download size={18} />
            Print Receipt
          </button>
        </div>
      </div>
    </div>
  );
};
