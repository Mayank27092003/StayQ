import React, { useState, useMemo, useEffect } from 'react';
import {
  Truck,
  Tent,
  Search,
  MapPin,
  Star,
  Heart,
  SlidersHorizontal,
  Layers,
  Map as MapIcon,
  Grid,
} from 'lucide-react';
import { useApp } from '../context/AppContext';

interface AdventureExplorePageProps {
  initialCategory?: 'ALL' | 'RV' | 'CAMPING_SITE';
}

export const AdventureExplorePage: React.FC<AdventureExplorePageProps> = ({ initialCategory = 'ALL' }) => {
  const { stays, setSelectedStay, isWishlisted, toggleWishlist } = useApp();

  const [activeTab, setActiveTab] = useState<'ALL' | 'RV' | 'CAMPING_SITE'>(initialCategory);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'split' | 'grid' | 'map'>('split');
  const [selectedStayId, setSelectedStayId] = useState<string | null>(null);
  const [hoveredStayId, setHoveredStayId] = useState<string | null>(null);

  // Filters
  const [priceMax, setPriceMax] = useState<number>(25000);
  const [selectedTag, setSelectedTag] = useState<string>('ALL');
  const [showFiltersModal, setShowFiltersModal] = useState<boolean>(false);
  const [onlyAwd, setOnlyAwd] = useState<boolean>(false);
  const [onlySolar, setOnlySolar] = useState<boolean>(false);
  const [onlyBonfire, setOnlyBonfire] = useState<boolean>(false);

  useEffect(() => {
    if (initialCategory) {
      setActiveTab(initialCategory);
    }
  }, [initialCategory]);

  // Real backend stays filter (RVs and Camping sites)
  const adventureStays = useMemo(() => {
    return stays.filter((s) => {
      const isRv =
        s.category?.toLowerCase().includes('rv') ||
        s.propertyType === 'RV' ||
        s.title?.toLowerCase().includes('rv') ||
        s.title?.toLowerCase().includes('camper') ||
        s.tags?.some((t) => t.toLowerCase().includes('rv') || t.toLowerCase().includes('camper'));
      const isCamp =
        s.category?.toLowerCase().includes('camp') ||
        s.propertyType === 'CAMPING_SITE' ||
        s.title?.toLowerCase().includes('camp') ||
        s.title?.toLowerCase().includes('glamp') ||
        s.title?.toLowerCase().includes('dome') ||
        s.tags?.some((t) => t.toLowerCase().includes('camp') || t.toLowerCase().includes('glamp'));

      if (activeTab === 'RV') return isRv;
      if (activeTab === 'CAMPING_SITE') return isCamp;
      return isRv || isCamp || s.category !== 'LONG_TERM';
    });
  }, [stays, activeTab]);

  // Filtered by search and specs
  const filteredStays = useMemo(() => {
    return adventureStays.filter((s) => {
      // Search match
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesLocation =
          s.location?.toLowerCase().includes(q) ||
          s.city?.toLowerCase().includes(q) ||
          s.state?.toLowerCase().includes(q) ||
          s.title?.toLowerCase().includes(q);
        if (!matchesLocation) return false;
      }

      // Price filter
      if (s.pricePerNight && s.pricePerNight > priceMax) return false;

      // Tag filter
      if (selectedTag !== 'ALL') {
        const hasTag = s.tags?.some((t) => t.toLowerCase().includes(selectedTag.toLowerCase()));
        if (!hasTag) return false;
      }

      // Specific filters
      if (onlyAwd) {
        const hasAwd =
          s.tags?.some((t) => t.toLowerCase().includes('4x4') || t.toLowerCase().includes('awd')) ||
          s.amenities?.some((a) => a.toLowerCase().includes('4x4') || a.toLowerCase().includes('awd'));
        if (!hasAwd) return false;
      }

      if (onlySolar) {
        const hasSolar = s.amenities?.some((a) => a.toLowerCase().includes('solar'));
        if (!hasSolar) return false;
      }

      if (onlyBonfire) {
        const hasBonfire =
          s.tags?.some((t) => t.toLowerCase().includes('bonfire')) ||
          s.amenities?.some((a) => a.toLowerCase().includes('bonfire') || a.toLowerCase().includes('campfire'));
        if (!hasBonfire) return false;
      }

      return true;
    });
  }, [adventureStays, searchQuery, priceMax, selectedTag, onlyAwd, onlySolar, onlyBonfire]);

  const activeStayForPin = useMemo(() => {
    if (selectedStayId) {
      return filteredStays.find((s) => s.id === selectedStayId);
    }
    if (hoveredStayId) {
      return filteredStays.find((s) => s.id === hoveredStayId);
    }
    return filteredStays[0] || null;
  }, [filteredStays, selectedStayId, hoveredStayId]);

  // Compute live Google Map Embed URL based on selected stay or location search
  const mapEmbedUrl = useMemo(() => {
    if (activeStayForPin && activeStayForPin.lat && activeStayForPin.lng) {
      return `https://maps.google.com/maps?q=${activeStayForPin.lat},${activeStayForPin.lng}&hl=en&z=12&output=embed`;
    }
    if (activeStayForPin && activeStayForPin.city) {
      return `https://maps.google.com/maps?q=${encodeURIComponent(activeStayForPin.city + ', India')}&hl=en&z=10&output=embed`;
    }
    if (searchQuery.trim()) {
      return `https://maps.google.com/maps?q=${encodeURIComponent(searchQuery + ', India')}&hl=en&z=9&output=embed`;
    }
    return `https://maps.google.com/maps?q=India&hl=en&z=5&output=embed`;
  }, [activeStayForPin, searchQuery]);

  return (
    <div style={{ paddingTop: '5.5rem', background: '#FBFBFC', minHeight: '100vh' }}>
      {/* Top Header & Category Selector */}
      <div
        style={{
          background: 'var(--white)',
          borderBottom: '1px solid var(--border)',
          padding: '1.25rem 0',
          position: 'sticky',
          top: '4.5rem',
          zIndex: 40,
          backdropFilter: 'blur(12px)',
        }}
      >
        <div className="container" style={{ maxWidth: '1440px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '1rem',
              flexWrap: 'wrap',
            }}
          >
            {/* Category Tabs */}
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <button
                type="button"
                onClick={() => setActiveTab('ALL')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  padding: '0.55rem 1.1rem',
                  borderRadius: '999px',
                  border: activeTab === 'ALL' ? '1.5px solid var(--violet)' : '1px solid var(--border)',
                  background: activeTab === 'ALL' ? 'var(--violet)' : 'var(--white)',
                  color: activeTab === 'ALL' ? '#ffffff' : 'var(--ink)',
                  fontSize: '0.85rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
              >
                <Layers size={16} />
                <span>All Wilderness ({adventureStays.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('RV')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  padding: '0.55rem 1.1rem',
                  borderRadius: '999px',
                  border: activeTab === 'RV' ? '1.5px solid var(--violet)' : '1px solid var(--border)',
                  background: activeTab === 'RV' ? 'var(--violet)' : 'var(--white)',
                  color: activeTab === 'RV' ? '#ffffff' : 'var(--ink)',
                  fontSize: '0.85rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
              >
                <Truck size={16} />
                <span>RVs &amp; Campervans</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('CAMPING_SITE')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  padding: '0.55rem 1.1rem',
                  borderRadius: '999px',
                  border: activeTab === 'CAMPING_SITE' ? '1.5px solid var(--violet)' : '1px solid var(--border)',
                  background: activeTab === 'CAMPING_SITE' ? 'var(--violet)' : 'var(--white)',
                  color: activeTab === 'CAMPING_SITE' ? '#ffffff' : 'var(--ink)',
                  fontSize: '0.85rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
              >
                <Tent size={16} />
                <span>Camping &amp; Glamping Sites</span>
              </button>
            </div>

            {/* Quick Destination Search */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, maxWidth: '420px' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  background: 'var(--gray-50)',
                  border: '1px solid var(--border)',
                  borderRadius: '999px',
                  padding: '0.45rem 1rem',
                  width: '100%',
                }}
              >
                <Search size={16} style={{ color: 'var(--gray-400)' }} />
                <input
                  type="text"
                  placeholder="Search Ladakh, Manali, Kasol, Goa..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    border: 'none',
                    background: 'transparent',
                    outline: 'none',
                    fontSize: '0.85rem',
                    color: 'var(--ink)',
                    width: '100%',
                  }}
                />
              </div>
            </div>

            {/* View Mode & Filter Toggles */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <button
                type="button"
                onClick={() => setShowFiltersModal(true)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  padding: '0.55rem 0.95rem',
                  borderRadius: '999px',
                  border: '1px solid var(--border)',
                  background: 'var(--white)',
                  color: 'var(--ink)',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                <SlidersHorizontal size={15} />
                <span>Filters</span>
              </button>

              <div
                style={{
                  display: 'flex',
                  background: 'var(--gray-100)',
                  padding: '0.25rem',
                  borderRadius: '999px',
                }}
              >
                <button
                  type="button"
                  onClick={() => setViewMode('split')}
                  style={{
                    border: 'none',
                    background: viewMode === 'split' ? 'var(--white)' : 'transparent',
                    color: viewMode === 'split' ? 'var(--violet)' : 'var(--gray-600)',
                    padding: '0.35rem 0.75rem',
                    borderRadius: '999px',
                    fontSize: '0.78rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.3rem',
                    boxShadow: viewMode === 'split' ? '0 2px 6px rgba(0,0,0,0.08)' : 'none',
                  }}
                >
                  <Layers size={14} /> Split Map
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('grid')}
                  style={{
                    border: 'none',
                    background: viewMode === 'grid' ? 'var(--white)' : 'transparent',
                    color: viewMode === 'grid' ? 'var(--violet)' : 'var(--gray-600)',
                    padding: '0.35rem 0.75rem',
                    borderRadius: '999px',
                    fontSize: '0.78rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.3rem',
                    boxShadow: viewMode === 'grid' ? '0 2px 6px rgba(0,0,0,0.08)' : 'none',
                  }}
                >
                  <Grid size={14} /> Cards
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('map')}
                  style={{
                    border: 'none',
                    background: viewMode === 'map' ? 'var(--white)' : 'transparent',
                    color: viewMode === 'map' ? 'var(--violet)' : 'var(--gray-600)',
                    padding: '0.35rem 0.75rem',
                    borderRadius: '999px',
                    fontSize: '0.78rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.3rem',
                    boxShadow: viewMode === 'map' ? '0 2px 6px rgba(0,0,0,0.08)' : 'none',
                  }}
                >
                  <MapIcon size={14} /> Map Only
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="container" style={{ maxWidth: '1440px', padding: '2rem 1.5rem' }}>
        {/* Results Banner */}
        <div style={{ marginBottom: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <p style={{ fontSize: '0.88rem', color: 'var(--gray-600)', margin: 0 }}>
            Showing <strong>{filteredStays.length}</strong> verified off-grid stays with Starhost support &amp; direct booking.
          </p>
        </div>

        {/* Dynamic Split Layout */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns:
              viewMode === 'grid'
                ? '1fr'
                : viewMode === 'map'
                ? '1fr'
                : 'repeat(auto-fit, minmax(400px, 1fr)) 1.15fr',
            gap: '2rem',
            alignItems: 'start',
          }}
        >
          {/* Column 1: Stay Cards */}
          {(viewMode === 'split' || viewMode === 'grid') && (
            <div>
              {filteredStays.length === 0 ? (
                <div
                  style={{
                    background: 'var(--white)',
                    borderRadius: '24px',
                    padding: '3.5rem 2rem',
                    textAlign: 'center',
                    border: '1px solid var(--border)',
                  }}
                >
                  <div
                    style={{
                      width: '64px',
                      height: '64px',
                      borderRadius: '50%',
                      background: 'rgba(90, 49, 244, 0.08)',
                      color: 'var(--violet)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 1.25rem',
                    }}
                  >
                    <Search size={28} />
                  </div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--ink)', marginBottom: '0.5rem' }}>
                    No stays matching filters
                  </h3>
                  <p style={{ fontSize: '0.88rem', color: 'var(--gray-600)', maxWidth: '380px', margin: '0 auto 1.5rem' }}>
                    Try searching for another destination or reset your filters to explore all available properties.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedTag('ALL');
                      setPriceMax(25000);
                      setOnlyAwd(false);
                      setOnlySolar(false);
                      setOnlyBonfire(false);
                    }}
                    className="btn btn--primary"
                    style={{ padding: '0.65rem 1.5rem', borderRadius: '999px' }}
                  >
                    Reset All Filters
                  </button>
                </div>
              ) : (
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: viewMode === 'grid' ? 'repeat(auto-fill, minmax(280px, 1fr))' : 'repeat(auto-fill, minmax(260px, 1fr))',
                    gap: '1.25rem',
                  }}
                >
                  {filteredStays.map((stay) => {
                    const isSelected = selectedStayId === stay.id;
                    const isHovered = hoveredStayId === stay.id;
                    const isRv =
                      stay.category?.toLowerCase().includes('rv') || stay.propertyType === 'RV' || stay.title?.toLowerCase().includes('rv');

                    return (
                      <div
                        key={stay.id}
                        onMouseEnter={() => setHoveredStayId(stay.id)}
                        onMouseLeave={() => setHoveredStayId(null)}
                        onClick={() => {
                          setSelectedStayId(stay.id);
                          setSelectedStay(stay);
                        }}
                        style={{
                          background: 'var(--white)',
                          borderRadius: '20px',
                          overflow: 'hidden',
                          border: isSelected || isHovered ? '1.5px solid var(--violet)' : '1px solid var(--border)',
                          boxShadow: isSelected || isHovered
                            ? '0 12px 28px rgba(90, 49, 244, 0.12)'
                            : 'var(--shadow-sm)',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          display: 'flex',
                          flexDirection: 'column',
                        }}
                      >
                        {/* Image & Badges */}
                        <div style={{ position: 'relative', height: '200px', width: '100%', overflow: 'hidden' }}>
                          <img
                            src={stay.imageUrls?.[0] || '/images/villa_1.jpg'}
                            alt={stay.title}
                            style={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover',
                              transition: 'transform 0.3s ease',
                              transform: isHovered ? 'scale(1.04)' : 'scale(1)',
                            }}
                          />

                          {/* Category Badge */}
                          <div
                            style={{
                              position: 'absolute',
                              top: '12px',
                              left: '12px',
                              background: 'rgba(15, 13, 21, 0.75)',
                              backdropFilter: 'blur(8px)',
                              color: '#ffffff',
                              padding: '0.3rem 0.65rem',
                              borderRadius: '999px',
                              fontSize: '0.72rem',
                              fontWeight: 800,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.35rem',
                            }}
                          >
                            {isRv ? <Truck size={12} /> : <Tent size={12} />}
                            {isRv ? 'RV / Campervan' : 'Camping & Glamping'}
                          </div>

                          {/* Wishlist Heart */}
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
                              width: '34px',
                              height: '34px',
                              borderRadius: '50%',
                              background: 'rgba(255, 255, 255, 0.9)',
                              border: 'none',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: 'pointer',
                              color: isWishlisted(stay.id) ? '#f04438' : 'var(--gray-600)',
                            }}
                            aria-label="Save stay"
                          >
                            <Heart size={16} fill={isWishlisted(stay.id) ? '#f04438' : 'none'} />
                          </button>
                        </div>

                        {/* Card Content */}
                        <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', flex: 1 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem', marginBottom: '0.4rem' }}>
                            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--gray-500)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                              <MapPin size={12} /> {stay.location || `${stay.city}, ${stay.state || 'India'}`}
                            </span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', fontSize: '0.82rem', fontWeight: 800, color: 'var(--ink)' }}>
                              <Star size={13} fill="#f59e0b" color="#f59e0b" />
                              <span>{(stay.rating || 4.9).toFixed(2)}</span>
                            </div>
                          </div>

                          <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--ink)', margin: '0 0 0.5rem', lineHeight: 1.35 }}>
                            {stay.title}
                          </h3>

                          {/* Spec Pills */}
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginBottom: '1rem' }}>
                            {(stay.amenities || []).slice(0, 3).map((tag) => (
                              <span
                                key={tag}
                                style={{
                                  fontSize: '0.7rem',
                                  fontWeight: 600,
                                  background: 'var(--gray-100)',
                                  color: 'var(--gray-700)',
                                  padding: '0.2rem 0.55rem',
                                  borderRadius: '6px',
                                }}
                              >
                                {tag}
                              </span>
                            ))}
                          </div>

                          {/* Price & Book CTA */}
                          <div style={{ marginTop: 'auto', paddingTop: '0.75rem', borderTop: '1px solid var(--gray-100)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                              <span style={{ fontSize: '1.15rem', fontWeight: 900, color: 'var(--ink)' }}>
                                ₹{(stay.pricePerNight || 5000).toLocaleString('en-IN')}
                              </span>
                              <span style={{ fontSize: '0.75rem', color: 'var(--gray-500)', marginLeft: '0.2rem' }}>
                                / night
                              </span>
                            </div>

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedStay(stay);
                              }}
                              className="btn btn--primary btn--sm"
                              style={{ padding: '0.45rem 0.85rem', fontSize: '0.8rem', fontWeight: 700 }}
                            >
                              Explore &amp; Book
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Column 2: Live Embedded Interactive Google Map View */}
          {(viewMode === 'split' || viewMode === 'map') && (
            <div
              style={{
                position: 'sticky',
                top: '9.5rem',
                height: 'calc(100vh - 12rem)',
                minHeight: '520px',
                borderRadius: '24px',
                overflow: 'hidden',
                border: '1.5px solid var(--border)',
                boxShadow: 'var(--shadow-md)',
                background: '#E5E7EB',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <div
                style={{
                  position: 'relative',
                  width: '100%',
                  height: '100%',
                }}
              >
                {/* Live Real Interactive Map Embed */}
                <iframe
                  title="Stay Q Interactive Map"
                  width="100%"
                  height="100%"
                  style={{ border: 0, width: '100%', height: '100%' }}
                  loading="lazy"
                  allowFullScreen
                  referrerPolicy="no-referrer-when-downgrade"
                  src={mapEmbedUrl}
                />

                {/* Regional India Map Header Badge */}
                <div
                  style={{
                    position: 'absolute',
                    top: '15px',
                    left: '20px',
                    background: 'rgba(255, 255, 255, 0.95)',
                    backdropFilter: 'blur(8px)',
                    padding: '0.5rem 0.85rem',
                    borderRadius: '12px',
                    border: '1px solid var(--border)',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
                    zIndex: 10,
                  }}
                >
                  <span style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--violet)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <MapIcon size={14} /> Interactive Live GPS Map
                  </span>
                  <span style={{ fontSize: '0.7rem', color: 'var(--gray-600)' }}>
                    {activeStayForPin?.title || (searchQuery ? `Targeting: ${searchQuery}` : 'India Regional Overview')}
                  </span>
                </div>

                {/* Selected Map Pin Popup Card */}
                {activeStayForPin && (
                  <div
                    style={{
                      position: 'absolute',
                      bottom: '20px',
                      left: '20px',
                      right: '20px',
                      background: 'var(--white)',
                      borderRadius: '20px',
                      border: '1px solid var(--border)',
                      padding: '1rem',
                      boxShadow: '0 16px 36px rgba(0,0,0,0.22)',
                      zIndex: 30,
                      display: 'flex',
                      gap: '1rem',
                      alignItems: 'center',
                    }}
                  >
                    <img
                      src={activeStayForPin.imageUrls?.[0] || '/images/villa_1.jpg'}
                      alt={activeStayForPin.title}
                      style={{
                        width: '80px',
                        height: '80px',
                        borderRadius: '14px',
                        objectFit: 'cover',
                        flexShrink: 0,
                      }}
                    />

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.2rem' }}>
                        <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--violet)', textTransform: 'uppercase' }}>
                          {activeStayForPin.category || 'Adventure Stay'}
                        </span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--gray-500)' }}>•</span>
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--gray-600)', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                          <MapPin size={11} /> {activeStayForPin.city || 'India'}
                        </span>
                      </div>

                      <h4 style={{ fontSize: '0.92rem', fontWeight: 800, color: 'var(--ink)', margin: '0 0 0.4rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {activeStayForPin.title}
                      </h4>

                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <strong style={{ fontSize: '1rem', fontWeight: 900, color: 'var(--ink)' }}>
                          ₹{(activeStayForPin.pricePerNight || 5000).toLocaleString('en-IN')} <span style={{ fontSize: '0.72rem', color: 'var(--gray-500)', fontWeight: 500 }}>/ night</span>
                        </strong>

                        <button
                          type="button"
                          onClick={() => setSelectedStay(activeStayForPin)}
                          className="btn btn--primary btn--sm"
                          style={{ padding: '0.4rem 0.85rem', fontSize: '0.78rem', fontWeight: 800, borderRadius: '999px' }}
                        >
                          Book Now
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Filters Modal */}
      {showFiltersModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            background: 'rgba(0, 0, 0, 0.6)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1.5rem',
          }}
          onClick={() => setShowFiltersModal(false)}
        >
          <div
            style={{
              background: 'var(--white)',
              borderRadius: '24px',
              maxWidth: '520px',
              width: '100%',
              padding: '2rem',
              boxShadow: 'var(--shadow-xl)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--ink)', margin: 0 }}>
                Wilderness &amp; Adventure Filters
              </h3>
              <button
                type="button"
                onClick={() => setShowFiltersModal(false)}
                style={{ background: 'none', border: 'none', fontSize: '1.25rem', cursor: 'pointer', color: 'var(--gray-500)' }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <label style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--ink)', display: 'block', marginBottom: '0.5rem' }}>
                  Max Price per Night: ₹{priceMax.toLocaleString('en-IN')}
                </label>
                <input
                  type="range"
                  min={1000}
                  max={50000}
                  step={500}
                  value={priceMax}
                  onChange={(e) => setPriceMax(Number(e.target.value))}
                  style={{ width: '100%', accentColor: 'var(--violet)' }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', fontWeight: 600, color: 'var(--ink)', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={onlyAwd}
                    onChange={(e) => setOnlyAwd(e.target.checked)}
                    style={{ accentColor: 'var(--violet)' }}
                  />
                  <span>4x4 AWD Overland Capabilities</span>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', fontWeight: 600, color: 'var(--ink)', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={onlySolar}
                    onChange={(e) => setOnlySolar(e.target.checked)}
                    style={{ accentColor: 'var(--violet)' }}
                  />
                  <span>Solar Powered Off-Grid Setup</span>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', fontWeight: 600, color: 'var(--ink)', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={onlyBonfire}
                    onChange={(e) => setOnlyBonfire(e.target.checked)}
                    style={{ accentColor: 'var(--violet)' }}
                  />
                  <span>Includes Bonfire &amp; Stargazing Session</span>
                </label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
                <button
                  type="button"
                  onClick={() => {
                    setPriceMax(25000);
                    setOnlyAwd(false);
                    setOnlySolar(false);
                    setOnlyBonfire(false);
                    setShowFiltersModal(false);
                  }}
                  className="btn btn--secondary"
                  style={{ padding: '0.6rem 1.25rem', borderRadius: '12px' }}
                >
                  Reset
                </button>
                <button
                  type="button"
                  onClick={() => setShowFiltersModal(false)}
                  className="btn btn--primary"
                  style={{ padding: '0.6rem 1.5rem', borderRadius: '12px' }}
                >
                  Apply Filters
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
