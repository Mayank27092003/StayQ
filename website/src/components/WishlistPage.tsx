import React from 'react';
import { Heart, Star, MapPin, Building, ArrowRight } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const WishlistPage: React.FC = () => {
  const { wishlistIds, toggleWishlist, setSelectedStay, stays } = useApp();

  const savedStays = stays.filter((s) => wishlistIds.includes(s.id));
  const recommendedStays = stays.slice(0, 3);

  return (
    <div style={{ minHeight: '85vh', background: 'var(--bg)', padding: '6.5rem 1rem 5rem' }}>
      <div className="shell" style={{ maxWidth: '1160px' }}>
        {/* Header */}
        <div style={{ marginBottom: '2.5rem' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.35rem 0.85rem',
              background: 'rgba(240, 68, 56, 0.08)',
              color: '#f04438',
              borderRadius: '999px',
              fontSize: '0.8rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              marginBottom: '0.75rem',
            }}
          >
            <Heart size={14} fill="#f04438" /> Saved Collection
          </div>

          <h1 className="h1" style={{ fontSize: '2.4rem', margin: '0 0 0.5rem', letterSpacing: '-0.03em' }}>
            Your Curated <span className="grad-text">Wishlist</span> ({savedStays.length})
          </h1>
          <p className="lead" style={{ margin: 0, color: 'var(--gray-600)', fontSize: '1.05rem', maxWidth: '600px' }}>
            Handpicked dream stays, cliffside villas, and cozy mountain cabins saved across your devices.
          </p>
        </div>

        {savedStays.length === 0 ? (
          /* Empty State */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '3.5rem' }}>
            <div
              style={{
                background: 'linear-gradient(135deg, var(--white) 0%, rgba(255, 245, 245, 0.6) 100%)',
                borderRadius: '28px',
                border: '1px solid var(--border)',
                padding: '4rem 2rem',
                textAlign: 'center',
                boxShadow: 'var(--shadow-md)',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  width: '80px',
                  height: '80px',
                  borderRadius: '24px',
                  background: 'linear-gradient(135deg, #f04438 0%, #d92d20 100%)',
                  color: 'var(--white)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 1.5rem',
                  boxShadow: '0 12px 24px rgba(240, 68, 56, 0.25)',
                }}
              >
                <Heart size={40} fill="var(--white)" />
              </div>

              <h2 className="h2" style={{ fontSize: '1.85rem', marginBottom: '0.5rem', color: 'var(--ink)' }}>
                Your Wishlist is Empty
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
                Tap the heart icon on any stay, cabin, or experience while browsing to save it to your private collection.
              </p>

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
                <span>Explore Live Stays</span>
                <ArrowRight size={16} />
              </a>
            </div>

            {/* Recommendations */}
            {recommendedStays.length > 0 && (
              <div>
                <div style={{ marginBottom: '1.25rem' }}>
                  <h3 className="h3" style={{ fontSize: '1.35rem', margin: 0 }}>
                    Popular Stays Guests Love Saving
                  </h3>
                  <p style={{ margin: '0.2rem 0 0', color: 'var(--gray-600)', fontSize: '0.9rem' }}>
                    Top-rated boutique homes trending in India this week.
                  </p>
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
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleWishlist(stay.id);
                          }}
                          style={{
                            position: 'absolute',
                            top: '12px',
                            right: '12px',
                            width: '36px',
                            height: '36px',
                            borderRadius: '50%',
                            background: 'rgba(255, 255, 255, 0.9)',
                            backdropFilter: 'blur(8px)',
                            border: 'none',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                          }}
                        >
                          <Heart
                            size={18}
                            fill={wishlistIds.includes(stay.id) ? '#f04438' : 'none'}
                            color={wishlistIds.includes(stay.id) ? '#f04438' : 'var(--gray-700)'}
                          />
                        </button>
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
                            View &rarr;
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
          /* Saved Grid */
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '1.75rem',
            }}
          >
            {savedStays.map((stay) => (
              <div
                key={stay.id}
                onClick={() => setSelectedStay(stay)}
                style={{
                  background: 'var(--white)',
                  borderRadius: '22px',
                  border: '1px solid var(--border)',
                  overflow: 'hidden',
                  cursor: 'pointer',
                  boxShadow: 'var(--shadow-sm)',
                  transition: 'transform 0.25s ease, box-shadow 0.25s ease',
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
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleWishlist(stay.id);
                    }}
                    style={{
                      position: 'absolute',
                      top: '12px',
                      right: '12px',
                      width: '38px',
                      height: '38px',
                      borderRadius: '50%',
                      background: 'rgba(255, 255, 255, 0.95)',
                      backdropFilter: 'blur(8px)',
                      border: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                    }}
                  >
                    <Heart size={20} fill="#f04438" color="#f04438" />
                  </button>
                  {stay.isZeroBroker && (
                    <span
                      style={{
                        position: 'absolute',
                        top: '12px',
                        left: '12px',
                        background: '#12b76a',
                        color: '#fff',
                        padding: '0.25rem 0.65rem',
                        borderRadius: '999px',
                        fontSize: '0.72rem',
                        fontWeight: 800,
                        textTransform: 'uppercase',
                      }}
                    >
                      Zero Broker
                    </span>
                  )}
                </div>

                <div style={{ padding: '1.25rem' }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: '0.35rem',
                    }}
                  >
                    <span style={{ fontSize: '0.82rem', color: 'var(--gray-500)' }}>{stay.location}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', fontSize: '0.82rem', fontWeight: 700 }}>
                      <Star size={14} fill="var(--gold)" color="var(--gold)" />
                      <span>{stay.rating.toFixed(2)}</span>
                    </div>
                  </div>

                  <h3
                    style={{
                      fontSize: '1.1rem',
                      fontWeight: 800,
                      margin: '0 0 0.5rem',
                      color: 'var(--ink)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {stay.title}
                  </h3>

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
                      <strong style={{ fontSize: '1.2rem', color: 'var(--ink)' }}>
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
                      Reserve &rarr;
                    </span>
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
