import React, { useState } from 'react';
import {
  Calendar,
  MapPin,
  QrCode,
  XCircle,
  Sparkles,
  Compass,
  ArrowRight,
  ShieldCheck,
  Building,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Booking, Stay } from '../types';

export const TripsPage: React.FC = () => {
  const { bookings, cancelBooking, setActiveConfirmation, stays, setSelectedStay } = useApp();
  const [filterTab, setFilterTab] = useState<'UPCOMING' | 'COMPLETED' | 'CANCELLED'>('UPCOMING');

  const upcomingCount = bookings.filter((b) => b.status === 'CONFIRMED').length;
  const completedCount = bookings.filter((b) => b.status === 'COMPLETED').length;
  const cancelledCount = bookings.filter((b) => b.status === 'CANCELLED').length;

  const filteredBookings = bookings.filter((b) => {
    if (filterTab === 'CANCELLED') return b.status === 'CANCELLED';
    if (filterTab === 'COMPLETED') return b.status === 'COMPLETED';
    return b.status === 'CONFIRMED';
  });

  const handleCancel = (booking: Booking) => {
    if (
      window.confirm(
        `Are you sure you want to cancel booking ${booking.referenceCode}? 100% full refund will be processed immediately to your original payment method.`
      )
    ) {
      cancelBooking(booking.id);
    }
  };

  // 3 sample recommendations for empty state from live stays
  const recommendedStays: Stay[] = stays.slice(0, 3);

  return (
    <div style={{ minHeight: '85vh', background: 'var(--bg)', padding: '6.5rem 1rem 5rem' }}>
      <div className="shell" style={{ maxWidth: '1160px' }}>
        {/* Page Header */}
        <div style={{ marginBottom: '2.5rem' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.35rem 0.85rem',
              background: 'rgba(90, 49, 244, 0.08)',
              color: 'var(--violet)',
              borderRadius: '999px',
              fontSize: '0.8rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              marginBottom: '0.75rem',
            }}
          >
            <Sparkles size={14} /> My Travel Itinerary
          </div>

          <div
            style={{
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'flex-end',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '1rem',
            }}
          >
            <div>
              <h1 className="h1" style={{ fontSize: '2.4rem', margin: 0, letterSpacing: '-0.03em' }}>
                Your Bookings &amp; <span className="grad-text">Trips</span>
              </h1>
              <p
                className="lead"
                style={{
                  margin: '0.5rem 0 0',
                  color: 'var(--gray-600)',
                  fontSize: '1.05rem',
                  maxWidth: '600px',
                }}
              >
                Instant access to your verified digital check-in passes, host keycodes, GPS directions, and invoices.
              </p>
            </div>

            {/* Filter Pills */}
            <div
              style={{
                display: 'inline-flex',
                background: 'var(--white)',
                padding: '0.35rem',
                borderRadius: '999px',
                border: '1px solid var(--border)',
                boxShadow: 'var(--shadow-sm)',
                gap: '0.25rem',
              }}
            >
              <button
                type="button"
                onClick={() => setFilterTab('UPCOMING')}
                style={{
                  padding: '0.55rem 1.15rem',
                  borderRadius: '999px',
                  border: 'none',
                  background: filterTab === 'UPCOMING' ? 'var(--violet)' : 'transparent',
                  color: filterTab === 'UPCOMING' ? 'var(--white)' : 'var(--gray-700)',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                }}
              >
                {filterTab === 'UPCOMING' && (
                  <span
                    style={{
                      width: '7px',
                      height: '7px',
                      borderRadius: '50%',
                      background: '#12b76a',
                      boxShadow: '0 0 8px #12b76a',
                    }}
                  />
                )}
                Upcoming ({upcomingCount})
              </button>

              <button
                type="button"
                onClick={() => setFilterTab('COMPLETED')}
                style={{
                  padding: '0.55rem 1.15rem',
                  borderRadius: '999px',
                  border: 'none',
                  background: filterTab === 'COMPLETED' ? 'var(--violet)' : 'transparent',
                  color: filterTab === 'COMPLETED' ? 'var(--white)' : 'var(--gray-700)',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                }}
              >
                Past Trips ({completedCount})
              </button>

              <button
                type="button"
                onClick={() => setFilterTab('CANCELLED')}
                style={{
                  padding: '0.55rem 1.15rem',
                  borderRadius: '999px',
                  border: 'none',
                  background: filterTab === 'CANCELLED' ? 'var(--violet)' : 'transparent',
                  color: filterTab === 'CANCELLED' ? 'var(--white)' : 'var(--gray-700)',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                }}
              >
                Cancelled ({cancelledCount})
              </button>
            </div>
          </div>
        </div>

        {/* Content Area */}
        {filteredBookings.length === 0 ? (
          /* Ultra-Beautiful Empty State Experience */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '3.5rem' }}>
            <div
              style={{
                background: 'linear-gradient(135deg, var(--white) 0%, rgba(247, 245, 255, 0.6) 100%)',
                borderRadius: '28px',
                border: '1px solid var(--border)',
                padding: '4rem 2rem',
                textAlign: 'center',
                boxShadow: 'var(--shadow-md)',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              {/* Background Glow */}
              <div
                style={{
                  position: 'absolute',
                  top: '-30%',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: '500px',
                  height: '300px',
                  background: 'radial-gradient(circle, rgba(90, 49, 244, 0.12) 0%, transparent 70%)',
                  pointerEvents: 'none',
                }}
              />

              <div
                style={{
                  width: '80px',
                  height: '80px',
                  borderRadius: '24px',
                  background: 'linear-gradient(135deg, var(--violet) 0%, #7b52f9 100%)',
                  color: 'var(--white)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 1.5rem',
                  boxShadow: '0 12px 24px rgba(90, 49, 244, 0.25)',
                }}
              >
                <Compass size={40} />
              </div>

              <h2 className="h2" style={{ fontSize: '1.85rem', marginBottom: '0.5rem', color: 'var(--ink)' }}>
                {filterTab === 'UPCOMING'
                  ? 'No Upcoming Reservations'
                  : filterTab === 'COMPLETED'
                  ? 'No Past Trips Found'
                  : 'No Cancelled Reservations'}
              </h2>

              <p
                className="lead"
                style={{
                  maxWidth: '540px',
                  margin: '0 auto 2rem',
                  color: 'var(--gray-600)',
                  fontSize: '1.02rem',
                  lineHeight: 1.6,
                }}
              >
                {filterTab === 'UPCOMING'
                  ? 'When you book a luxury stay, overland campervan, or zero-broker city loft, your live entry keycode, digital pass, and host route will appear here in real-time.'
                  : 'Your complete travel and stay history will be archived here with downloadable VAT invoices and review summaries.'}
              </p>

              {/* Quick Action Navigation Buttons */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexWrap: 'wrap',
                  gap: '0.75rem',
                  marginBottom: '1rem',
                }}
              >
                <a
                  href="#/stays"
                  className="btn btn--primary btn--lg"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    boxShadow: '0 8px 20px rgba(90, 49, 244, 0.25)',
                  }}
                >
                  <Building size={18} />
                  <span>Browse Luxury Stays</span>
                  <ArrowRight size={16} />
                </a>

                <a
                  href="#/zero-broker"
                  className="btn btn--secondary btn--lg"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    background: 'var(--white)',
                    borderColor: 'var(--border)',
                  }}
                >
                  <ShieldCheck size={18} style={{ color: '#12b76a' }} />
                  <span>0% Brokerage Homes</span>
                </a>

                <a
                  href="#/experiences"
                  className="btn btn--secondary btn--lg"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    background: 'var(--white)',
                    borderColor: 'var(--border)',
                  }}
                >
                  <Sparkles size={18} style={{ color: '#f79009' }} />
                  <span>Curated Experiences</span>
                </a>
              </div>
            </div>

            {/* Curated Recommendations Header */}
            {recommendedStays.length > 0 && (
              <div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '1.25rem',
                  }}
                >
                  <div>
                    <h3 className="h3" style={{ fontSize: '1.35rem', margin: 0 }}>
                      Handpicked Escapes for Your Next Trip
                    </h3>
                    <p style={{ margin: '0.2rem 0 0', color: 'var(--gray-600)', fontSize: '0.9rem' }}>
                      Top-rated luxury villas and beachfront properties with instant check-in.
                    </p>
                  </div>
                  <a
                    href="#/stays"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      fontSize: '0.9rem',
                      fontWeight: 700,
                      color: 'var(--violet)',
                      textDecoration: 'none',
                    }}
                  >
                    View All Stays &rarr;
                  </a>
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                    gap: '1.5rem',
                  }}
                >
                  {recommendedStays.map((stay) => (
                    <div
                      key={stay.id}
                      onClick={() => setSelectedStay(stay)}
                      style={{
                        background: 'var(--white)',
                        borderRadius: '20px',
                        border: '1px solid var(--border)',
                        overflow: 'hidden',
                        cursor: 'pointer',
                        transition: 'transform 0.25s ease, box-shadow 0.25s ease',
                        boxShadow: 'var(--shadow-sm)',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-4px)';
                        e.currentTarget.style.boxShadow = 'var(--shadow-lg)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
                      }}
                    >
                      <div style={{ position: 'relative', aspectRatio: '16/10', overflow: 'hidden' }}>
                        <img
                          src={stay.imageUrls?.[0] || '/images/villa_1.jpg'}
                          alt={stay.title}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                        <span
                          style={{
                            position: 'absolute',
                            top: '12px',
                            left: '12px',
                            background: 'rgba(255, 255, 255, 0.92)',
                            backdropFilter: 'blur(8px)',
                            padding: '0.25rem 0.65rem',
                            borderRadius: '999px',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            color: 'var(--ink)',
                            textTransform: 'uppercase',
                          }}
                        >
                          {stay.category}
                        </span>
                      </div>

                      <div style={{ padding: '1.25rem' }}>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.25rem',
                            color: 'var(--gray-500)',
                            fontSize: '0.82rem',
                            marginBottom: '0.35rem',
                          }}
                        >
                          <MapPin size={13} />
                          <span>{stay.location}</span>
                        </div>
                        <h4
                          style={{
                            fontSize: '1.05rem',
                            fontWeight: 800,
                            margin: '0 0 0.5rem',
                            color: 'var(--ink)',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {stay.title}
                        </h4>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            paddingTop: '0.75rem',
                            borderTop: '1px solid var(--border)',
                          }}
                        >
                          <div>
                            <span style={{ fontSize: '0.75rem', color: 'var(--gray-500)' }}>From </span>
                            <strong style={{ fontSize: '1.15rem', color: 'var(--ink)' }}>
                              ₹{stay.pricePerNight.toLocaleString('en-IN')}
                            </strong>
                            <span style={{ fontSize: '0.8rem', color: 'var(--gray-500)' }}> / night</span>
                          </div>
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.25rem',
                              fontSize: '0.85rem',
                              fontWeight: 700,
                              color: 'var(--violet)',
                            }}
                          >
                            Book &rarr;
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Live Booked Trip Cards */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {filteredBookings.map((b) => (
              <div
                key={b.id}
                style={{
                  background: 'var(--white)',
                  borderRadius: '24px',
                  border: '1px solid var(--border)',
                  overflow: 'hidden',
                  boxShadow: 'var(--shadow-md)',
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                  transition: 'box-shadow 0.2s ease',
                }}
              >
                <div style={{ position: 'relative', minHeight: '220px', maxHeight: '280px' }}>
                  <img
                    src={b.itemImage}
                    alt={b.itemTitle}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                  <span
                    style={{
                      position: 'absolute',
                      top: '14px',
                      left: '14px',
                      padding: '0.35rem 0.85rem',
                      borderRadius: '999px',
                      fontSize: '0.75rem',
                      fontWeight: 800,
                      letterSpacing: '0.05em',
                      textTransform: 'uppercase',
                      background:
                        b.status === 'CONFIRMED'
                          ? '#12b76a'
                          : b.status === 'COMPLETED'
                          ? 'var(--violet)'
                          : '#f04438',
                      color: 'var(--white)',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                    }}
                  >
                    {b.status}
                  </span>
                </div>

                <div
                  style={{
                    padding: '1.75rem',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: '1rem',
                  }}
                >
                  <div>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: '0.5rem',
                      }}
                    >
                      <span
                        style={{
                          fontSize: '0.75rem',
                          fontFamily: 'monospace',
                          fontWeight: 700,
                          color: 'var(--violet)',
                          background: 'rgba(90, 49, 244, 0.08)',
                          padding: '0.2rem 0.5rem',
                          borderRadius: '6px',
                        }}
                      >
                        REF #{b.referenceCode}
                      </span>
                      <span
                        style={{
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          color: 'var(--gray-500)',
                          textTransform: 'uppercase',
                        }}
                      >
                        {b.type}
                      </span>
                    </div>

                    <h3 style={{ fontSize: '1.35rem', fontWeight: 800, margin: '0 0 0.4rem', color: 'var(--ink)' }}>
                      {b.itemTitle}
                    </h3>

                    <p
                      style={{
                        fontSize: '0.88rem',
                        color: 'var(--gray-600)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                        margin: 0,
                      }}
                    >
                      <MapPin size={14} style={{ color: 'var(--violet)' }} />
                      {b.itemLocation}
                    </p>
                  </div>

                  <div
                    style={{
                      background: 'var(--gray-50)',
                      borderRadius: '14px',
                      padding: '0.85rem 1rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      border: '1px solid var(--border)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Calendar size={16} style={{ color: 'var(--violet)' }} />
                      <div>
                        <span style={{ fontSize: '0.72rem', color: 'var(--gray-500)', display: 'block' }}>
                          Check-in &rarr; Check-out
                        </span>
                        <strong style={{ fontSize: '0.88rem', color: 'var(--ink)' }}>
                          {b.checkInDate} &rarr; {b.checkOutDate}
                        </strong>
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: '0.72rem', color: 'var(--gray-500)', display: 'block' }}>Guests</span>
                      <strong style={{ fontSize: '0.88rem', color: 'var(--ink)' }}>
                        {b.guestsCount} {b.guestsCount === 1 ? 'Guest' : 'Guests'}
                      </strong>
                    </div>
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      paddingTop: '0.75rem',
                      borderTop: '1px solid var(--border)',
                      flexWrap: 'wrap',
                      gap: '0.75rem',
                    }}
                  >
                    <div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--gray-500)', display: 'block' }}>
                        Total Paid
                      </span>
                      <strong style={{ fontSize: '1.3rem', color: 'var(--ink)' }}>
                        ₹{b.totalPrice.toLocaleString('en-IN')}
                      </strong>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <button
                        type="button"
                        className="btn btn--primary btn--sm"
                        onClick={() => setActiveConfirmation(b)}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                      >
                        <QrCode size={15} />
                        <span>Digital Entry Pass</span>
                      </button>

                      {b.status === 'CONFIRMED' && (
                        <button
                          type="button"
                          className="btn btn--secondary btn--sm"
                          onClick={() => handleCancel(b)}
                          style={{
                            color: '#f04438',
                            borderColor: 'rgba(240, 68, 56, 0.25)',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                          }}
                        >
                          <XCircle size={15} />
                          <span>Cancel</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
