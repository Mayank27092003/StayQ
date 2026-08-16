import React, { useState, useEffect } from 'react';
import { Star, Clock, MapPin, Check, Sparkles, X, ChevronRight } from 'lucide-react';
import { fetchExperiences } from '../services/api';
import { Experience, ExperienceSlot } from '../types';
import { useApp } from '../context/AppContext';

const EXP_CATEGORIES = ['All', 'Adventure', 'Food & Drink', 'Art & Culture', 'Wellness'];

export const ExperiencesCatalog: React.FC = () => {
  const { setCheckoutItem, user, setIsAuthModalOpen } = useApp();
  const [selectedCat, setSelectedCat] = useState('All');
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeExp, setActiveExp] = useState<Experience | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<ExperienceSlot | null>(null);
  const [ticketCount, setTicketCount] = useState(1);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    fetchExperiences(selectedCat).then((data) => {
      if (isMounted) {
        setExperiences(data);
        setLoading(false);
      }
    });
    return () => {
      isMounted = false;
    };
  }, [selectedCat]);

  const filtered = experiences;

  const handleOpenSlotModal = (exp: Experience) => {
    setActiveExp(exp);
    setSelectedSlot(exp.slots[0] || null);
    setTicketCount(1);
  };

  const handleProceedToSlotCheckout = () => {
    if (!user) {
      setIsAuthModalOpen(true);
      return;
    }
    if (!activeExp || !selectedSlot) return;
    setCheckoutItem({
      experience: activeExp,
      slotId: `${selectedSlot.date} - ${selectedSlot.time}`,
      guests: ticketCount,
    });
    setActiveExp(null);
  };

  return (
    <section className="exp-catalog-section" id="experiences-catalog">
      <div className="shell">
        <div className="catalog-header">
          <div className="catalog-header__top">
            <div>
              <span className="eyebrow" style={{ color: 'var(--violet)' }}>
                <Sparkles size={14} /> Curated Local Experiences
              </span>
              <h2 className="h2">
                Unforgettable activities hosted by <span className="grad-text">local experts.</span>
              </h2>
            </div>
          </div>

          {/* Category Tabs */}
          <div className="exp-cat-tabs">
            {EXP_CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                className={`exp-cat-tab ${selectedCat === cat ? 'exp-cat-tab--active' : ''}`}
                onClick={() => setSelectedCat(cat)}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Experiences Grid */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem 0', color: '#64748b' }}>
            Loading experiences from database...
          </div>
        ) : (
          <div className="exp-grid">
            {filtered.map((exp: Experience) => (
              <article key={exp.id} className="exp-card" onClick={() => handleOpenSlotModal(exp)}>
              <div className="exp-card__media">
                <img src={exp.imageUrls[0]} alt={exp.title} className="exp-card__img" loading="lazy" />
                <div className="exp-card__duration">
                  <Clock size={13} /> {exp.duration}
                </div>
                <div className="exp-card__cat-pill">{exp.category}</div>
              </div>

              <div className="exp-card__content">
                <div className="exp-card__top">
                  <div className="exp-card__host">
                    <img src={exp.hostAvatar} alt={exp.hostName} className="exp-card__host-avatar" />
                    <span>Hosted by {exp.hostName}</span>
                  </div>
                  <div className="exp-card__rating">
                    <Star size={13} fill="var(--gold)" color="var(--gold)" />
                    <strong>{exp.rating.toFixed(2)}</strong>
                    <span>({exp.reviewCount})</span>
                  </div>
                </div>

                <h3 className="exp-card__title">{exp.title}</h3>
                <p className="exp-card__loc">
                  <MapPin size={14} /> {exp.location}
                </p>

                <div className="exp-card__bottom">
                  <div className="exp-card__price">
                    <span className="exp-card__amount">₹{exp.pricePerPerson.toLocaleString('en-IN')}</span>
                    <span className="exp-card__period"> / person</span>
                  </div>
                  <button type="button" className="btn btn--primary btn--sm">
                    Book Slots &rarr;
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
        )}
      </div>

      {/* Experience Slot Booking Modal */}
      {activeExp && (
        <div className="detail-modal-backdrop" onClick={() => setActiveExp(null)}>
          <div className="detail-modal exp-slot-modal" onClick={(e) => e.stopPropagation()}>
            <div className="detail-modal__topbar">
              <button className="detail-modal__back-btn" onClick={() => setActiveExp(null)}>
                &larr; Back to Experiences
              </button>
              <button className="detail-modal__close" onClick={() => setActiveExp(null)}>
                <X size={20} />
              </button>
            </div>

            <div className="detail-modal__scrollable">
              <div className="detail-header">
                <span className="eyebrow">{activeExp.category}</span>
                <h1 className="detail-title">{activeExp.title}</h1>
                <div className="detail-subhead">
                  <div className="detail-rating">
                    <Star size={15} fill="var(--gold)" color="var(--gold)" />
                    <strong>{activeExp.rating.toFixed(2)}</strong>
                    <span className="detail-reviews">· {activeExp.reviewCount} reviews</span>
                  </div>
                  <span className="detail-divider">·</span>
                  <span className="detail-location">
                    <MapPin size={15} /> {activeExp.location}
                  </span>
                  <span className="detail-divider">·</span>
                  <span>
                    <Clock size={15} /> {activeExp.duration}
                  </span>
                </div>
              </div>

              {/* Gallery Image */}
              <div className="exp-gallery-banner">
                <img src={activeExp.imageUrls[0]} alt={activeExp.title} />
              </div>

              {/* Content Grid */}
              <div className="detail-content-grid">
                <div className="detail-main-col">
                  {/* Host info */}
                  <div className="detail-host-card">
                    <img src={activeExp.hostAvatar} alt={activeExp.hostName} className="detail-host-avatar" />
                    <div className="detail-host-meta">
                      <h3>Hosted by {activeExp.hostName}</h3>
                      <p>{activeExp.hostBio}</p>
                    </div>
                  </div>

                  <div className="detail-section">
                    <h3 className="detail-section-title">What you will do</h3>
                    <p className="detail-description">{activeExp.description}</p>
                  </div>

                  <div className="detail-section">
                    <h3 className="detail-section-title">What's included</h3>
                    <div className="exp-inclusions-grid">
                      {activeExp.included.map((item) => (
                        <div key={item} className="exp-inclusion-item">
                          <Check size={16} color="var(--green)" />
                          <span>{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="detail-section">
                    <h3 className="detail-section-title">Meeting point</h3>
                    <p className="detail-description">
                      <MapPin size={16} className="inline-icon" /> {activeExp.meetingPoint}
                    </p>
                  </div>
                </div>

                {/* Right Column: Slot Picker Widget */}
                <div className="detail-sidebar-col">
                  <div className="booking-card">
                    <div className="booking-card__top">
                      <div>
                        <span className="booking-card__price">₹{activeExp.pricePerPerson.toLocaleString('en-IN')}</span>
                        <span className="booking-card__unit"> / person</span>
                      </div>
                    </div>

                    <h4 style={{ margin: '1rem 0 0.5rem', fontSize: '0.95rem' }}>Select Available Slot</h4>
                    <div className="exp-slots-list">
                      {activeExp.slots.map((slot) => {
                        const isSelected = selectedSlot?.id === slot.id;
                        const remaining = slot.capacity - slot.bookedCount;
                        return (
                          <div
                            key={slot.id}
                            className={`exp-slot-card ${isSelected ? 'exp-slot-card--selected' : ''}`}
                            onClick={() => setSelectedSlot(slot)}
                          >
                            <div>
                              <strong>{slot.date}</strong>
                              <p>{slot.time}</p>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                              <span className={`exp-slot-cap ${remaining <= 3 ? 'exp-slot-cap--few' : ''}`}>
                                {remaining} spots left
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Quantity Picker */}
                    <div className="booking-picker__guests" style={{ marginTop: '1rem' }}>
                      <label>NUMBER OF TICKETS</label>
                      <div className="booking-guests-control">
                        <span>{ticketCount} {ticketCount === 1 ? 'Person' : 'People'}</span>
                        <div className="booking-guests-buttons">
                          <button
                            type="button"
                            disabled={ticketCount <= 1}
                            onClick={() => setTicketCount(Math.max(1, ticketCount - 1))}
                          >
                            -
                          </button>
                          <button
                            type="button"
                            disabled={ticketCount >= (selectedSlot ? selectedSlot.capacity - selectedSlot.bookedCount : 6)}
                            onClick={() => setTicketCount(ticketCount + 1)}
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="booking-breakdown" style={{ marginTop: '1rem' }}>
                      <div className="booking-breakdown__row">
                        <span>₹{activeExp.pricePerPerson.toLocaleString('en-IN')} × {ticketCount} tickets</span>
                        <span>₹{(activeExp.pricePerPerson * ticketCount).toLocaleString('en-IN')}</span>
                      </div>
                      <div className="booking-breakdown__row">
                        <span>Taxes & GST (18%)</span>
                        <span>₹{Math.round(activeExp.pricePerPerson * ticketCount * 0.18).toLocaleString('en-IN')}</span>
                      </div>
                      <div className="booking-breakdown__divider" />
                      <div className="booking-breakdown__total">
                        <span>Total (INR)</span>
                        <strong>₹{Math.round(activeExp.pricePerPerson * ticketCount * 1.18).toLocaleString('en-IN')}</strong>
                      </div>
                    </div>

                    <button
                      type="button"
                      className="btn btn--primary btn--block"
                      style={{ marginTop: '1.2rem' }}
                      onClick={handleProceedToSlotCheckout}
                    >
                      Reserve Slots
                      <ChevronRight size={18} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
