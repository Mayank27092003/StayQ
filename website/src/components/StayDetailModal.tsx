import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Star,
  MapPin,
  Heart,
  Share2,
  Sparkles,
  ShieldCheck,
  Check,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Users,
  User,
  Baby,
  Dog,
  Bot,
  Tv,
  Wifi,
  Flame,
  Car,
  Coffee,
  Waves,
  Truck,
  Tent,
  FileText,
  CheckCircle2,
  Compass,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { calculateBookingQuote } from '../services/api';

export const StayDetailModal: React.FC = () => {
  const {
    selectedStay,
    setSelectedStay,
    setCheckoutItem,
    isWishlisted,
    toggleWishlist,
    setIsQubeOpen,
    filters,
    user,
    setIsAuthModalOpen,
  } = useApp();

  const [activePhoto, setActivePhoto] = useState(0);
  const [checkIn, setCheckIn] = useState(filters.checkIn || getTomorrowDate());
  const [checkOut, setCheckOut] = useState(filters.checkOut || getDayAfterTomorrowDate());
  const [adults, setAdults] = useState(filters.adults || (filters.guests ? Math.min(filters.guests, 2) : 2));
  const [childrenCount, setChildrenCount] = useState(filters.children || 0);
  const [infants, setInfants] = useState(filters.infants || 0);
  const [pets, setPets] = useState(filters.pets || 0);
  const [isCrewPopoverOpen, setIsCrewPopoverOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const crewRef = useRef<HTMLDivElement>(null);

  // Close crew popover on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (crewRef.current && !crewRef.current.contains(e.target as Node)) {
        setIsCrewPopoverOpen(false);
      }
    };
    if (isCrewPopoverOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isCrewPopoverOpen]);

  if (!selectedStay) return null;

  const totalGuests = adults + childrenCount;
  const isSaved = isWishlisted(selectedStay.id);
  const quote = calculateBookingQuote(selectedStay.pricePerNight, checkIn, checkOut);

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleProceedToCheckout = () => {
    if (!user) {
      setIsAuthModalOpen(true);
      return;
    }
    setCheckoutItem({
      stay: selectedStay,
      checkIn,
      checkOut,
      guests: totalGuests,
      adults,
      children: childrenCount,
      infants,
      pets,
    });
    setSelectedStay(null);
  };

  const handleAskQube = () => {
    if (!user) {
      setIsAuthModalOpen(true);
      return;
    }
    setIsQubeOpen(true);
  };

  return (
    <div className="detail-modal-backdrop" onClick={() => setSelectedStay(null)}>
      <div className="detail-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header bar */}
        <div className="detail-modal__topbar">
          <button className="detail-modal__back-btn" onClick={() => setSelectedStay(null)}>
            &larr; Back to Stays
          </button>
          <div className="detail-modal__actions">
            <button className="detail-icon-btn" onClick={handleShare} aria-label="Share">
              <Share2 size={16} />
              <span>{copied ? 'Link Copied!' : 'Share'}</span>
            </button>
            <button
              className={`detail-icon-btn ${isSaved ? 'detail-icon-btn--saved' : ''}`}
              onClick={() => toggleWishlist(selectedStay.id)}
              aria-label="Save to wishlist"
            >
              <Heart size={16} fill={isSaved ? '#f04438' : 'none'} color={isSaved ? '#f04438' : 'currentColor'} />
              <span>{isSaved ? 'Saved' : 'Save'}</span>
            </button>
            <button className="detail-modal__close" onClick={() => setSelectedStay(null)}>
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="detail-modal__scrollable">
          {/* Title & Location Header */}
          <div className="detail-header">
            <h1 className="detail-title">{selectedStay.title}</h1>
            <div className="detail-subhead">
              <div className="detail-rating">
                <Star size={15} fill="var(--gold)" color="var(--gold)" />
                <strong>{selectedStay.rating.toFixed(2)}</strong>
                <span className="detail-reviews">· {selectedStay.reviewCount} verified reviews</span>
              </div>
              <span className="detail-divider">·</span>
              <span className="detail-location">
                <MapPin size={15} /> {selectedStay.location}
              </span>
              {(selectedStay.isSuperhost || (selectedStay as any).isStarHost) && (
                <>
                  <span className="detail-divider">·</span>
                  <span className="badge-superhost" style={{ background: '#FEF3C7', color: '#B45309', border: '1px solid #FDE68A', display: 'inline-flex', alignItems: 'center', gap: '4px', fontWeight: 800 }}>
                    <Star size={12} fill="#F59E0B" color="#F59E0B" /> Starhost
                  </span>
                </>
              )}
              {selectedStay.isZeroBroker && (
                <>
                  <span className="detail-divider">·</span>
                  <span className="badge-zerobroker">
                    <ShieldCheck size={14} /> Zero Brokerage
                  </span>
                </>
              )}
              <span className="detail-divider">·</span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'rgba(157, 0, 255, 0.08)', color: '#9D00FF', padding: '2px 8px', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 800, letterSpacing: '0.02em' }}>
                Property ID: {(selectedStay as any).propertyCode || `ST${(selectedStay.id || '').slice(0, 5).toUpperCase()}`}
              </span>
            </div>
          </div>

          {/* Photo Gallery Grid */}
          <div className="detail-gallery">
            <div className="detail-gallery__main">
              <img src={selectedStay.imageUrls[activePhoto] || '/images/villa_1.jpg'} alt={selectedStay.title} />
            </div>
            <div className="detail-gallery__thumbs">
              {selectedStay.imageUrls.map((img, idx) => (
                <button
                  key={idx}
                  type="button"
                  className={`detail-gallery__thumb ${idx === activePhoto ? 'detail-gallery__thumb--active' : ''}`}
                  onClick={() => setActivePhoto(idx)}
                >
                  <img src={img} alt={`View ${idx + 1}`} />
                </button>
              ))}
            </div>
          </div>

          {/* Two-Column Main Content */}
          <div className="detail-content-grid">
            {/* Left Column: Property Info */}
            <div className="detail-main-col">
              {/* Host & Specs Bar */}
              <div className="detail-host-card">
                <img src={selectedStay.hostAvatar || '/images/avatar_alex.jpg'} alt={selectedStay.hostName} className="detail-host-avatar" />
                <div className="detail-host-meta">
                  <h3>Hosted by {selectedStay.hostName}</h3>
                  <p>
                    {selectedStay.maxGuests} guests · {selectedStay.bedrooms} bedrooms · {selectedStay.beds} beds · {selectedStay.baths} baths
                  </p>
                </div>
              </div>

              {/* Badges Callouts */}
              <div className="detail-callouts">
                {selectedStay.isZeroBroker && (
                  <div className="detail-callout">
                    <div className="detail-callout__icon detail-callout__icon--zb">
                      <ShieldCheck size={20} />
                    </div>
                    <div>
                      <h4>Direct Owner Lease — 0% Brokerage</h4>
                      <p>No brokerage or middleman commission. Transparent lease with standard deposit protection.</p>
                    </div>
                  </div>
                )}
                {selectedStay.isGuestFavorite && (
                  <div className="detail-callout">
                    <div className="detail-callout__icon">
                      <Sparkles size={20} />
                    </div>
                    <div>
                      <h4>Guest Favorite</h4>
                      <p>One of the most loved homes on Stay Q based on ratings, reviews, and host reliability.</p>
                    </div>
                  </div>
                )}
                <div className="detail-callout">
                  <div className="detail-callout__icon">
                    <Check size={20} />
                  </div>
                  <div>
                    <h4>Self check-in & Keyless Access</h4>
                    <p>Check yourself in easily with the smart door keypad code provided upon confirmation.</p>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="detail-section">
                <h3 className="detail-section-title">About this space</h3>
                <p className="detail-description">{selectedStay.description}</p>
              </div>

              {/* Amenities */}
              <div className="detail-section">
                <h3 className="detail-section-title">What this place offers</h3>
                <div className="detail-amenities-grid">
                  {selectedStay.amenities.map((am) => (
                    <div key={am} className="detail-amenity-item">
                      <AmenityIcon name={am} />
                      <span>{am}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* RV Specifics & Digital Handover Card (from STAY Q RV Implementation PDF) */}
              {(selectedStay.category === 'RV' || selectedStay.title.toLowerCase().includes('rv') || selectedStay.title.toLowerCase().includes('campervan') || selectedStay.title.toLowerCase().includes('motorhome')) && (
                <div className="detail-section" style={{ background: '#FAF5FF', border: '1.5px solid rgba(90, 49, 244, 0.2)', borderRadius: '20px', padding: '1.5rem', marginTop: '1.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'var(--violet)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Truck size={20} />
                      </div>
                      <div>
                        <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: 'var(--ink)' }}>Stay Q Verified RV Experience</h4>
                        <span style={{ fontSize: '0.78rem', color: 'var(--gray-600)' }}>Motorhomes, Campervans &amp; 4x4 Overlanding</span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', background: 'rgba(18, 183, 106, 0.1)', color: '#12b76a', padding: '0.3rem 0.75rem', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 800 }}>
                      <CheckCircle2 size={14} /> RV Verified (RC + Commercial Insurance)
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem', marginBottom: '1.25rem' }}>
                    <div style={{ background: '#fff', padding: '0.75rem 1rem', borderRadius: '12px', border: '1px solid var(--border)' }}>
                      <span style={{ fontSize: '0.72rem', color: 'var(--gray-500)', textTransform: 'uppercase', fontWeight: 800, display: 'block' }}>Engine &amp; Fuel</span>
                      <strong style={{ fontSize: '0.88rem', color: 'var(--ink)' }}>Turbo Diesel · Manual/Auto</strong>
                    </div>
                    <div style={{ background: '#fff', padding: '0.75rem 1rem', borderRadius: '12px', border: '1px solid var(--border)' }}>
                      <span style={{ fontSize: '0.72rem', color: 'var(--gray-500)', textTransform: 'uppercase', fontWeight: 800, display: 'block' }}>Sleeping Berths</span>
                      <strong style={{ fontSize: '0.88rem', color: 'var(--ink)' }}>{selectedStay.beds || 2} Berths · {selectedStay.maxGuests || 4} Occupants</strong>
                    </div>
                    <div style={{ background: '#fff', padding: '0.75rem 1rem', borderRadius: '12px', border: '1px solid var(--border)' }}>
                      <span style={{ fontSize: '0.72rem', color: 'var(--gray-500)', textTransform: 'uppercase', fontWeight: 800, display: 'block' }}>Power System</span>
                      <strong style={{ fontSize: '0.88rem', color: 'var(--ink)' }}>Solar + Inverter + Generator</strong>
                    </div>
                    <div style={{ background: '#fff', padding: '0.75rem 1rem', borderRadius: '12px', border: '1px solid var(--border)' }}>
                      <span style={{ fontSize: '0.72rem', color: 'var(--gray-500)', textTransform: 'uppercase', fontWeight: 800, display: 'block' }}>Driver Eligibility</span>
                      <strong style={{ fontSize: '0.88rem', color: 'var(--ink)' }}>Age 21+ · Valid LMV Driving License</strong>
                    </div>
                  </div>

                  <div style={{ background: '#fff', padding: '1rem', borderRadius: '14px', border: '1px solid var(--border)' }}>
                    <strong style={{ fontSize: '0.85rem', color: 'var(--ink)', display: 'block', marginBottom: '0.35rem' }}>
                      📸 2-Way Digital Handover Protocol
                    </strong>
                    <p style={{ fontSize: '0.78rem', color: 'var(--gray-600)', margin: 0, lineHeight: 1.5 }}>
                      At pickup, host and driver record vehicle odometer mileage, fuel level, and 360° exterior photos in the Stay Q app. Security deposit is safely held via escrow and released within 48h of return.
                    </p>
                  </div>
                </div>
              )}

              {/* Camping & Glamping 7-Point Specifications (from STAY Q CAMP FLOW PDF) */}
              {(selectedStay.category === 'CAMPING_SITE' || selectedStay.title.toLowerCase().includes('camp') || selectedStay.title.toLowerCase().includes('glamping') || selectedStay.title.toLowerCase().includes('tent')) && (
                <div className="detail-section" style={{ background: '#F0FDF4', border: '1.5px solid rgba(18, 183, 106, 0.25)', borderRadius: '20px', padding: '1.5rem', marginTop: '1.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#12b76a', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Tent size={20} />
                      </div>
                      <div>
                        <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: 'var(--ink)' }}>Stay Q Wilderness Camp &amp; Trek</h4>
                        <span style={{ fontSize: '0.78rem', color: 'var(--gray-600)' }}>Eco Glamping, Geodesic Domes &amp; Mountain Sites</span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', background: 'rgba(2, 122, 72, 0.1)', color: '#027a48', padding: '0.3rem 0.75rem', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 800 }}>
                      <Compass size={14} /> Guided Trek &amp; Bonfire Included
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem', marginBottom: '1.25rem' }}>
                    <div style={{ background: '#fff', padding: '0.75rem 1rem', borderRadius: '12px', border: '1px solid var(--border)' }}>
                      <span style={{ fontSize: '0.72rem', color: 'var(--gray-500)', textTransform: 'uppercase', fontWeight: 800, display: 'block' }}>Accommodation</span>
                      <strong style={{ fontSize: '0.88rem', color: 'var(--ink)' }}>Weatherproof Alpine Tents</strong>
                    </div>
                    <div style={{ background: '#fff', padding: '0.75rem 1rem', borderRadius: '12px', border: '1px solid var(--border)' }}>
                      <span style={{ fontSize: '0.72rem', color: 'var(--gray-500)', textTransform: 'uppercase', fontWeight: 800, display: 'block' }}>Food &amp; Dining</span>
                      <strong style={{ fontSize: '0.88rem', color: 'var(--ink)' }}>Organic Local Camp Meals</strong>
                    </div>
                    <div style={{ background: '#fff', padding: '0.75rem 1rem', borderRadius: '12px', border: '1px solid var(--border)' }}>
                      <span style={{ fontSize: '0.72rem', color: 'var(--gray-500)', textTransform: 'uppercase', fontWeight: 800, display: 'block' }}>Trekking Trails</span>
                      <strong style={{ fontSize: '0.88rem', color: 'var(--ink)' }}>Sunrise Ridge &amp; River Crossing</strong>
                    </div>
                    <div style={{ background: '#fff', padding: '0.75rem 1rem', borderRadius: '12px', border: '1px solid var(--border)' }}>
                      <span style={{ fontSize: '0.72rem', color: 'var(--gray-500)', textTransform: 'uppercase', fontWeight: 800, display: 'block' }}>Eco Features</span>
                      <strong style={{ fontSize: '0.88rem', color: 'var(--ink)' }}>Solar Lighting · Zero Plastic</strong>
                    </div>
                  </div>
                </div>
              )}

              {/* Guest House Rules Preview (from STAY Q GUEST RULES PDF) */}
              <div className="detail-section" style={{ background: '#F8FAFC', border: '1px solid var(--border)', borderRadius: '20px', padding: '1.5rem', marginTop: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <FileText size={18} style={{ color: 'var(--violet)' }} />
                    <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: 'var(--ink)' }}>Stay Q Guest House Rules</h4>
                  </div>
                  <a
                    href="#/guest-rules"
                    onClick={() => setSelectedStay(null)}
                    style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--violet)', textDecoration: 'none' }}
                  >
                    View All 39 Articles →
                  </a>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--gray-700)' }}>
                  <div>🕒 Check-in: 2:00 PM · Checkout: 11:00 AM</div>
                  <div>🔇 Quiet Hours: 10:00 PM – 07:00 AM</div>
                  <div>🚫 No unauthorized parties or events</div>
                  <div>🪪 Government ID required at check-in</div>
                </div>
              </div>

              {/* Location & Neighborhood Privacy Section (Airbnb Style) */}
              <div className="detail-section" style={{ borderTop: '1px solid var(--gray-200)', paddingTop: '1.5rem', marginTop: '1.5rem' }}>
                <h3 className="detail-section-title" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <MapPin size={20} color="var(--primary)" />
                  Where you'll be
                </h3>
                <p style={{ fontSize: '0.95rem', color: 'var(--gray-700)', fontWeight: 600, margin: '0.3rem 0 0.75rem 0' }}>
                  {selectedStay.location || `${selectedStay.city}, ${selectedStay.state || 'India'}`}
                </p>

                {/* Approximate Map Visual Container */}
                <div style={{ position: 'relative', height: '220px', borderRadius: '16px', overflow: 'hidden', border: '1px solid var(--gray-300)', background: '#eef2f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <iframe
                    title="Approximate Area Map"
                    width="100%"
                    height="100%"
                    style={{ border: 0, filter: 'saturate(1.2)' }}
                    loading="lazy"
                    src={`https://maps.google.com/maps?q=${encodeURIComponent(selectedStay.city || 'Goa')}&t=m&z=13&ie=UTF8&iwloc=&output=embed`}
                  />
                  {/* Floating Approximate Radius Bubble overlay */}
                  <div style={{ position: 'absolute', pointerEvents: 'none', width: '130px', height: '130px', borderRadius: '50%', background: 'rgba(157, 0, 255, 0.15)', border: '2px dashed #9D00FF', display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'pulse 3s infinite' }}>
                    <div style={{ width: '16px', height: '16px', borderRadius: '50%', background: '#9D00FF', boxShadow: '0 0 12px rgba(157,0,255,0.8)' }} />
                  </div>
                </div>

                {/* Privacy Assurance Notice */}
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', background: '#f8fafc', padding: '0.85rem 1rem', borderRadius: '12px', border: '1px solid var(--gray-200)', marginTop: '0.85rem' }}>
                  <ShieldCheck size={22} color="#059669" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <strong style={{ fontSize: '0.85rem', color: '#0f172a', display: 'block' }}>
                      Exact location provided after booking is confirmed
                    </strong>
                    <span style={{ fontSize: '0.78rem', color: '#64748b', lineHeight: 1.4, display: 'block', marginTop: '0.15rem' }}>
                      To protect host and guest privacy, the exact street address, building landmark, host contact, and GPS navigation pin will be unlocked in your booking confirmation ticket.
                    </span>
                  </div>
                </div>
              </div>

              {/* Qube AI Trip Assistant integration */}
              <div className="detail-ai-banner">
                <div className="detail-ai-banner__icon">
                  <Bot size={28} />
                </div>
                <div className="detail-ai-banner__content">
                  <h4>Have questions about nearby spots or food?</h4>
                  <p>Ask Qube AI to craft a daily itinerary around this stay or find hidden gems in {selectedStay.city}.</p>
                  <button className="btn btn--primary btn--sm" onClick={handleAskQube} style={{ marginTop: '0.6rem' }}>
                    <Sparkles size={14} /> Ask Qube AI Assistant
                  </button>
                </div>
              </div>
            </div>

            {/* Right Column: Sticky Booking Widget */}
            <div className="detail-sidebar-col">
              <div className="booking-card">
                <div className="booking-card__top">
                  <div>
                    <span className="booking-card__price">₹{selectedStay.pricePerNight.toLocaleString('en-IN')}</span>
                    <span className="booking-card__unit"> / night</span>
                  </div>
                  <div className="booking-card__rating">
                    <Star size={14} fill="var(--gold)" color="var(--gold)" />
                    <strong>{selectedStay.rating.toFixed(2)}</strong>
                    <span>({selectedStay.reviewCount})</span>
                  </div>
                </div>

                {/* Date & Guest Inputs */}
                <div className="booking-picker">
                  <div className="booking-picker__row">
                    <div className="booking-picker__col">
                      <label>CHECK-IN</label>
                      <input
                        type="date"
                        value={checkIn}
                        min={getTodayDate()}
                        onChange={(e) => setCheckIn(e.target.value)}
                      />
                    </div>
                    <div className="booking-picker__col">
                      <label>CHECK-OUT</label>
                      <input
                        type="date"
                        value={checkOut}
                        min={checkIn}
                        onChange={(e) => setCheckOut(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Travel Crew & Guests Dropdown Picker */}
                  <div className="booking-picker__guests" ref={crewRef} style={{ position: 'relative' }}>
                    <div
                      onClick={() => setIsCrewPopoverOpen(!isCrewPopoverOpen)}
                      style={{ padding: '0.85rem 1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', userSelect: 'none' }}
                    >
                      <div>
                        <label style={{ fontSize: '0.68rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--gray-500)', display: 'block', marginBottom: '2px', cursor: 'pointer' }}>
                          GUESTS / TRAVEL CREW
                        </label>
                        <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--ink)' }}>
                          {totalGuests} {totalGuests === 1 ? 'Guest' : 'Guests'}
                          {infants > 0 ? `, ${infants} infant${infants > 1 ? 's' : ''}` : ''}
                          {pets > 0 ? `, ${pets} pet${pets > 1 ? 's' : ''}` : ''}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--gray-500)', marginTop: '2px' }}>
                          {[
                            `${adults} adult${adults > 1 ? 's' : ''}`,
                            childrenCount > 0 ? `${childrenCount} child${childrenCount > 1 ? 'ren' : ''}` : null,
                          ].filter(Boolean).join(', ')}
                        </div>
                      </div>
                      <div style={{ color: 'var(--violet)', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.82rem', fontWeight: 700 }}>
                        {isCrewPopoverOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                      </div>
                    </div>

                    {/* Travel Crew Dropdown Popover */}
                    {isCrewPopoverOpen && (
                      <div
                        style={{
                          position: 'absolute',
                          top: 'calc(100% + 8px)',
                          left: 0,
                          right: 0,
                          background: '#ffffff',
                          borderRadius: '20px',
                          padding: '1.25rem',
                          boxShadow: '0 20px 48px rgba(0, 0, 0, 0.18), 0 0 0 1px rgba(0, 0, 0, 0.08)',
                          zIndex: 50,
                        }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border)' }}>
                          <div>
                            <span style={{ fontSize: '0.78rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--violet)', display: 'block' }}>
                              Travel Crew &amp; Companions
                            </span>
                            <span style={{ fontSize: '0.72rem', color: 'var(--gray-500)' }}>
                              Max capacity: {selectedStay.maxGuests} guests
                            </span>
                          </div>
                        </div>

                        {/* Adults Stepper */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.65rem 0', borderBottom: '1px solid var(--border)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(90, 49, 244, 0.08)', color: 'var(--violet)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <User size={16} />
                            </div>
                            <div>
                              <strong style={{ fontSize: '0.88rem', color: 'var(--ink)', display: 'block' }}>Adults</strong>
                              <span style={{ fontSize: '0.72rem', color: 'var(--gray-500)' }}>Age 13 or above</span>
                            </div>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                            <button
                              type="button"
                              disabled={adults <= 1}
                              onClick={() => setAdults(Math.max(1, adults - 1))}
                              style={{ width: '28px', height: '28px', borderRadius: '50%', border: '1px solid var(--border)', background: adults <= 1 ? '#f4f4f5' : '#fff', color: adults <= 1 ? '#a1a1aa' : '#18181b', fontWeight: 700, cursor: adults <= 1 ? 'not-allowed' : 'pointer' }}
                            >
                              -
                            </button>
                            <span style={{ fontSize: '0.9rem', fontWeight: 800, minWidth: '16px', textAlign: 'center' }}>{adults}</span>
                            <button
                              type="button"
                              disabled={totalGuests >= selectedStay.maxGuests}
                              onClick={() => setAdults(adults + 1)}
                              style={{ width: '28px', height: '28px', borderRadius: '50%', border: '1px solid var(--border)', background: totalGuests >= selectedStay.maxGuests ? '#f4f4f5' : '#fff', color: totalGuests >= selectedStay.maxGuests ? '#a1a1aa' : '#18181b', fontWeight: 700, cursor: totalGuests >= selectedStay.maxGuests ? 'not-allowed' : 'pointer' }}
                            >
                              +
                            </button>
                          </div>
                        </div>

                        {/* Children Stepper */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.65rem 0', borderBottom: '1px solid var(--border)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(90, 49, 244, 0.08)', color: 'var(--violet)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <Users size={16} />
                            </div>
                            <div>
                              <strong style={{ fontSize: '0.88rem', color: 'var(--ink)', display: 'block' }}>Children</strong>
                              <span style={{ fontSize: '0.72rem', color: 'var(--gray-500)' }}>Ages 2–12</span>
                            </div>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                            <button
                              type="button"
                              disabled={childrenCount <= 0}
                              onClick={() => setChildrenCount(Math.max(0, childrenCount - 1))}
                              style={{ width: '28px', height: '28px', borderRadius: '50%', border: '1px solid var(--border)', background: childrenCount <= 0 ? '#f4f4f5' : '#fff', color: childrenCount <= 0 ? '#a1a1aa' : '#18181b', fontWeight: 700, cursor: childrenCount <= 0 ? 'not-allowed' : 'pointer' }}
                            >
                              -
                            </button>
                            <span style={{ fontSize: '0.9rem', fontWeight: 800, minWidth: '16px', textAlign: 'center' }}>{childrenCount}</span>
                            <button
                              type="button"
                              disabled={totalGuests >= selectedStay.maxGuests}
                              onClick={() => setChildrenCount(childrenCount + 1)}
                              style={{ width: '28px', height: '28px', borderRadius: '50%', border: '1px solid var(--border)', background: totalGuests >= selectedStay.maxGuests ? '#f4f4f5' : '#fff', color: totalGuests >= selectedStay.maxGuests ? '#a1a1aa' : '#18181b', fontWeight: 700, cursor: totalGuests >= selectedStay.maxGuests ? 'not-allowed' : 'pointer' }}
                            >
                              +
                            </button>
                          </div>
                        </div>

                        {/* Infants Stepper */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.65rem 0', borderBottom: '1px solid var(--border)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(90, 49, 244, 0.08)', color: 'var(--violet)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <Baby size={16} />
                            </div>
                            <div>
                              <strong style={{ fontSize: '0.88rem', color: 'var(--ink)', display: 'block' }}>Infants</strong>
                              <span style={{ fontSize: '0.72rem', color: 'var(--gray-500)' }}>Under 2 (Stays free)</span>
                            </div>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                            <button
                              type="button"
                              disabled={infants <= 0}
                              onClick={() => setInfants(Math.max(0, infants - 1))}
                              style={{ width: '28px', height: '28px', borderRadius: '50%', border: '1px solid var(--border)', background: infants <= 0 ? '#f4f4f5' : '#fff', color: infants <= 0 ? '#a1a1aa' : '#18181b', fontWeight: 700, cursor: infants <= 0 ? 'not-allowed' : 'pointer' }}
                            >
                              -
                            </button>
                            <span style={{ fontSize: '0.9rem', fontWeight: 800, minWidth: '16px', textAlign: 'center' }}>{infants}</span>
                            <button
                              type="button"
                              disabled={infants >= 5}
                              onClick={() => setInfants(Math.min(5, infants + 1))}
                              style={{ width: '28px', height: '28px', borderRadius: '50%', border: '1px solid var(--border)', background: infants >= 5 ? '#f4f4f5' : '#fff', color: infants >= 5 ? '#a1a1aa' : '#18181b', fontWeight: 700, cursor: infants >= 5 ? 'not-allowed' : 'pointer' }}
                            >
                              +
                            </button>
                          </div>
                        </div>

                        {/* Pets Stepper */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.65rem 0' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(90, 49, 244, 0.08)', color: 'var(--violet)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <Dog size={16} />
                            </div>
                            <div>
                              <strong style={{ fontSize: '0.88rem', color: 'var(--ink)', display: 'block' }}>Pets</strong>
                              <span style={{ fontSize: '0.72rem', color: 'var(--gray-500)' }}>Bringing a pet?</span>
                            </div>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                            <button
                              type="button"
                              disabled={pets <= 0}
                              onClick={() => setPets(Math.max(0, pets - 1))}
                              style={{ width: '28px', height: '28px', borderRadius: '50%', border: '1px solid var(--border)', background: pets <= 0 ? '#f4f4f5' : '#fff', color: pets <= 0 ? '#a1a1aa' : '#18181b', fontWeight: 700, cursor: pets <= 0 ? 'not-allowed' : 'pointer' }}
                            >
                              -
                            </button>
                            <span style={{ fontSize: '0.9rem', fontWeight: 800, minWidth: '16px', textAlign: 'center' }}>{pets}</span>
                            <button
                              type="button"
                              disabled={pets >= 5}
                              onClick={() => setPets(Math.min(5, pets + 1))}
                              style={{ width: '28px', height: '28px', borderRadius: '50%', border: '1px solid var(--border)', background: pets >= 5 ? '#f4f4f5' : '#fff', color: pets >= 5 ? '#a1a1aa' : '#18181b', fontWeight: 700, cursor: pets >= 5 ? 'not-allowed' : 'pointer' }}
                            >
                              +
                            </button>
                          </div>
                        </div>

                        {pets > 0 && (
                          <div style={{ marginTop: '0.5rem', padding: '0.5rem 0.75rem', background: '#F0FDF4', borderRadius: '10px', border: '1px solid #BBF7D0', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <ShieldCheck size={14} style={{ color: '#16A34A', flexShrink: 0 }} />
                            <span style={{ fontSize: '0.74rem', color: '#166534', fontWeight: 600 }}>
                              Pet-friendly stay confirmed
                            </span>
                          </div>
                        )}

                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.85rem', paddingTop: '0.5rem', borderTop: '1px solid var(--border)' }}>
                          <button
                            type="button"
                            onClick={() => setIsCrewPopoverOpen(false)}
                            style={{ background: 'var(--violet)', color: '#fff', border: 'none', padding: '0.45rem 1.25rem', borderRadius: '10px', fontSize: '0.82rem', fontWeight: 800, cursor: 'pointer' }}
                          >
                            Done
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Price Breakdown */}
                <div className="booking-breakdown" style={{ marginTop: '1rem' }}>
                  <div className="booking-breakdown__row">
                    <span>
                      ₹{selectedStay.pricePerNight.toLocaleString('en-IN')} × {quote.nights} {quote.nights === 1 ? 'night' : 'nights'}
                    </span>
                    <span>₹{quote.baseTotal.toLocaleString('en-IN')}</span>
                  </div>
                  {quote.cleaningFee > 0 && (
                    <div className="booking-breakdown__row">
                      <span>Cleaning & Sanitization</span>
                      <span>₹{quote.cleaningFee.toLocaleString('en-IN')}</span>
                    </div>
                  )}
                  <div className="booking-breakdown__row">
                    <span>Taxes & GST (18%)</span>
                    <span>₹{quote.gstAmount.toLocaleString('en-IN')}</span>
                  </div>
                  {quote.discountAmount > 0 && (
                    <div className="booking-breakdown__row booking-breakdown__row--discount">
                      <span>Long Stay Discount (5%)</span>
                      <span>-₹{quote.discountAmount.toLocaleString('en-IN')}</span>
                    </div>
                  )}

                  <div className="booking-breakdown__divider" style={{ margin: '0.85rem 0' }} />

                  {/* Bottom Row: Total on Left, Reserve Stay Button in Right Corner */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '1rem',
                      marginTop: '0.5rem',
                    }}
                  >
                    <div>
                      <span style={{ fontSize: '0.72rem', color: 'var(--gray-500)', fontWeight: 600, display: 'block' }}>
                        Total (INR)
                      </span>
                      <strong style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--ink)', display: 'block', letterSpacing: '-0.02em' }}>
                        ₹{quote.totalAmount.toLocaleString('en-IN')}
                      </strong>
                      <span style={{ fontSize: '0.68rem', color: 'var(--gray-400)', display: 'block', marginTop: '1px' }}>
                        You won't be charged yet
                      </span>
                    </div>

                    <button
                      type="button"
                      className="btn btn--primary booking-reserve-btn"
                      style={{
                        padding: '0.75rem 1.4rem',
                        fontSize: '0.95rem',
                        fontWeight: 800,
                        borderRadius: '14px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        boxShadow: '0 8px 20px rgba(90, 49, 244, 0.28)',
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                        flexShrink: 0,
                      }}
                      onClick={handleProceedToCheckout}
                    >
                      Reserve Stay
                      <ChevronRight size={17} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

function AmenityIcon({ name }: { name: string }) {
  const n = name.toLowerCase();
  if (n.includes('wifi')) return <Wifi size={18} />;
  if (n.includes('pool') || n.includes('ocean')) return <Waves size={18} />;
  if (n.includes('fire')) return <Flame size={18} />;
  if (n.includes('park')) return <Car size={18} />;
  if (n.includes('coffee') || n.includes('breakfast')) return <Coffee size={18} />;
  if (n.includes('tv')) return <Tv size={18} />;
  return <Check size={18} />;
}

function getTodayDate() {
  return new Date().toISOString().split('T')[0];
}

function getTomorrowDate() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().split('T')[0];
}

function getDayAfterTomorrowDate() {
  const d = new Date();
  d.setDate(d.getDate() + 3);
  return d.toISOString().split('T')[0];
}
