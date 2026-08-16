import React, { useState, useEffect, useRef } from 'react';
import { Search, Calendar, Users, MapPin, X, Compass, Loader2, Palmtree, Mountain, Landmark, Trees, Building, Tent } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { LuxuryCalendarPicker } from './LuxuryCalendarPicker';
import { GuestsAndPetsPopover } from './GuestsAndPetsPopover';

interface SearchBarProps {
  compact?: boolean;
  className?: string;
}

interface LocationSuggestion {
  title: string;
  subtitle: string;
  type: 'CITY' | 'BEACH' | 'MOUNTAIN' | 'HERITAGE';
}

interface RegionCategory {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  cities: string[];
}

const REGION_CATEGORIES: RegionCategory[] = [
  {
    title: 'Coastal Beaches & Villas',
    subtitle: 'Goa, Alibaug, Gokarna & Pondicherry',
    icon: <Palmtree size={18} style={{ color: '#0EA5E9' }} />,
    cities: ['Goa', 'Alibaug', 'Gokarna', 'Pondicherry'],
  },
  {
    title: 'Himalayan Mountain Cabins',
    subtitle: 'Manali, Shimla, Rishikesh & Kasol',
    icon: <Mountain size={18} style={{ color: '#6366F1' }} />,
    cities: ['Manali', 'Shimla', 'Rishikesh', 'Kasol', 'Leh Ladakh'],
  },
  {
    title: 'Royal Heritage Palaces',
    subtitle: 'Udaipur, Jaipur & Jodhpur',
    icon: <Landmark size={18} style={{ color: '#F59E0B' }} />,
    cities: ['Udaipur', 'Jaipur', 'Jodhpur'],
  },
  {
    title: 'Plantations & Rain Forests',
    subtitle: 'Wayanad, Coorg, Ooty & Munnar',
    icon: <Trees size={18} style={{ color: '#10B981' }} />,
    cities: ['Wayanad', 'Coorg', 'Ooty', 'Munnar'],
  },
  {
    title: 'Zero Broker Metro Lofts',
    subtitle: 'Bengaluru, Mumbai & Delhi NCR',
    icon: <Building size={18} style={{ color: '#8B5CF6' }} />,
    cities: ['Bengaluru', 'Mumbai', 'Delhi NCR'],
  },
  {
    title: 'Off-Grid Glamping & RVs',
    subtitle: 'Ladakh, Spiti Valley & Jaisalmer Dunes',
    icon: <Tent size={18} style={{ color: '#EC4899' }} />,
    cities: ['Leh Ladakh', 'Spiti Valley', 'Jaisalmer'],
  },
];

const CURATED_DESTINATIONS: LocationSuggestion[] = [
  { title: 'Goa', subtitle: 'Candolim, Anjuna, Morjim · Beaches & Private Villas', type: 'BEACH' },
  { title: 'Manali', subtitle: 'Himachal Pradesh · Snow Peaks & Cozy Cabins', type: 'MOUNTAIN' },
  { title: 'Wayanad', subtitle: 'Kerala · Rainforest Treehouses & Coffee Estates', type: 'MOUNTAIN' },
  { title: 'Udaipur', subtitle: 'Rajasthan · Lakefront Palaces & Royal Havelis', type: 'HERITAGE' },
  { title: 'Bengaluru', subtitle: 'Karnataka · Indiranagar & Koramangala Zero Broker Lofts', type: 'CITY' },
  { title: 'Jaipur', subtitle: 'Rajasthan · Heritage Stays & Courtyards', type: 'HERITAGE' },
  { title: 'Alibaug', subtitle: 'Maharashtra · Sunset Beach Villas & Pool Estates', type: 'BEACH' },
  { title: 'Rishikesh', subtitle: 'Uttarakhand · Riverside Stargazer Domes & Retreats', type: 'MOUNTAIN' },
  { title: 'Leh Ladakh', subtitle: 'Ladakh · High Altitude Glamping & RV Camps', type: 'MOUNTAIN' },
  { title: 'Mumbai', subtitle: 'Maharashtra · Bandra & Juhu Sea-Facing Stays', type: 'CITY' },
];

export const SearchBar: React.FC<SearchBarProps> = ({ compact = false, className = '' }) => {
  const { filters, updateFilters } = useApp();
  const [destination, setDestination] = useState(filters.destination || '');
  const [checkIn, setCheckIn] = useState(filters.checkIn || '');
  const [checkOut, setCheckOut] = useState(filters.checkOut || '');
  
  // Detailed Guests & Pets Breakdown
  const [adults, setAdults] = useState(filters.adults || 1);
  const [childrenCount, setChildrenCount] = useState(filters.children || 0);
  const [infants, setInfants] = useState(filters.infants || 0);
  const [pets, setPets] = useState(filters.pets || 0);

  const [showDestDropdown, setShowDestDropdown] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [showGuestsDropdown, setShowGuestsDropdown] = useState(false);
  const [liveSuggestions, setLiveSuggestions] = useState<LocationSuggestion[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [activeVibeTag, setActiveVibeTag] = useState<string>('ALL');

  const debounceTimerRef = useRef<any>(null);

  // Live Location Autocomplete with real geocoding search
  useEffect(() => {
    if (!destination.trim()) {
      setLiveSuggestions([]);
      setLoadingSuggestions(false);
      return;
    }

    const q = destination.toLowerCase().trim();

    // 1. Instant local fuzzy filter
    const localMatches = CURATED_DESTINATIONS.filter(
      (d) => d.title.toLowerCase().includes(q) || d.subtitle.toLowerCase().includes(q)
    );

    setLiveSuggestions(localMatches);

    // 2. Fetch live online geocoding suggestions from Photon OpenStreetMap API
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);

    debounceTimerRef.current = setTimeout(async () => {
      setLoadingSuggestions(true);
      try {
        const res = await fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(destination)}&limit=5`);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.features) && data.features.length > 0) {
            const apiSuggestions: LocationSuggestion[] = data.features.map((f: any) => {
              const name = f.properties.name || f.properties.city || 'Location';
              const state = f.properties.state || f.properties.country || '';
              const type: LocationSuggestion['type'] =
                name.toLowerCase().includes('beach') || name.toLowerCase().includes('goa')
                  ? 'BEACH'
                  : name.toLowerCase().includes('hill') || name.toLowerCase().includes('manali') || name.toLowerCase().includes('valley')
                  ? 'MOUNTAIN'
                  : 'CITY';
              return {
                title: name,
                subtitle: state ? `${state}, ${f.properties.country || ''}` : f.properties.country || '',
                type,
              };
            });

            // Merge without duplicates
            const combined = [...localMatches];
            apiSuggestions.forEach((apiItem) => {
              if (!combined.some((c) => c.title.toLowerCase() === apiItem.title.toLowerCase())) {
                combined.push(apiItem);
              }
            });
            setLiveSuggestions(combined);
          }
        }
      } catch {
        // Local fallback already present
      } finally {
        setLoadingSuggestions(false);
      }
    }, 280);

    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, [destination]);

  const handleSelectLocation = (loc: string) => {
    setDestination(loc);
    setShowDestDropdown(false);
    updateFilters({ destination: loc });
  };

  const handleSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setShowCalendar(false);
    setShowGuestsDropdown(false);
    setShowDestDropdown(false);

    const totalGuests = adults + childrenCount;
    updateFilters({
      destination,
      checkIn,
      checkOut,
      guests: totalGuests,
      adults,
      children: childrenCount,
      infants,
      pets,
    });

    // Scroll smoothly to catalog or switch hash to stays
    if (window.location.hash !== '#/stays' && window.location.hash !== '#stays') {
      const el = document.getElementById('stays-catalog');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      } else {
        window.location.hash = '#/stays';
      }
    }
  };

  const formatDateDisplay = (dateStr: string) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getGuestsSummary = () => {
    const total = adults + childrenCount;
    const parts = [`${total} ${total === 1 ? 'Guest' : 'Guests'}`];
    if (infants > 0) parts.push(`${infants} ${infants === 1 ? 'Infant' : 'Infants'}`);
    if (pets > 0) parts.push(`${pets} ${pets === 1 ? 'Pet' : 'Pets'}`);
    return parts.join(', ');
  };

  return (
    <div className={`search-bar-wrap ${compact ? 'search-bar-wrap--compact' : ''} ${className}`}>
      <form className="search-bar" onSubmit={handleSearch}>
        {/* Destination Field with Live Autocomplete & Region Explorer */}
        <div
          className="search-bar__field search-bar__field--dest"
          onClick={() => {
            setShowDestDropdown(true);
            setShowCalendar(false);
            setShowGuestsDropdown(false);
          }}
        >
          <div className="search-bar__icon">
            <MapPin size={18} />
          </div>
          <div className="search-bar__content">
            <label className="search-bar__label">Choose Your Vibe</label>
            <input
              type="text"
              className="search-bar__input"
              placeholder="Goa beaches, himalayan cabins, lofts..."
              value={destination}
              onChange={(e) => {
                setDestination(e.target.value);
                setShowDestDropdown(true);
              }}
              onFocus={() => {
                setShowDestDropdown(true);
                setShowCalendar(false);
                setShowGuestsDropdown(false);
              }}
            />
          </div>
          {destination && (
            <button
              type="button"
              className="search-bar__clear-btn"
              onClick={(e) => {
                e.stopPropagation();
                setDestination('');
                updateFilters({ destination: '' });
              }}
              aria-label="Clear destination"
            >
              <X size={14} />
            </button>
          )}

          {/* Autocomplete & Regional Explorer Dropdown */}
          {showDestDropdown && (
            <>
              <div
                className="search-bar__backdrop"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowDestDropdown(false);
                }}
              />
              <div
                className="search-bar__dropdown"
                style={{
                  width: '95vw',
                  maxWidth: '480px',
                  maxHeight: '440px',
                  overflowY: 'auto',
                  padding: '1.25rem',
                  borderRadius: '24px',
                  boxShadow: '0 20px 48px rgba(0,0,0,0.16)',
                  background: 'var(--white, #ffffff)',
                  border: '1px solid var(--border)',
                  zIndex: 2000,
                }}
                onClick={(e) => e.stopPropagation()}
              >
                {destination.trim() === '' ? (
                  <div>
                    {/* Quick Vibe Chips */}
                    <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
                      {[
                        { label: '✨ All Vibes', value: 'ALL' },
                        { label: '🏖️ Beaches', value: 'BEACH' },
                        { label: '🏔️ Hills', value: 'HILLS' },
                        { label: '🏰 Royal', value: 'HERITAGE' },
                        { label: '⚡ Zero Broker', value: 'ZB' },
                      ].map((vibe) => (
                        <button
                          key={vibe.value}
                          type="button"
                          onClick={() => setActiveVibeTag(vibe.value)}
                          style={{
                            padding: '0.35rem 0.75rem',
                            borderRadius: '999px',
                            border: '1px solid',
                            borderColor: activeVibeTag === vibe.value ? 'var(--violet)' : 'var(--border)',
                            background: activeVibeTag === vibe.value ? 'rgba(90, 49, 244, 0.08)' : 'var(--gray-50)',
                            color: activeVibeTag === vibe.value ? 'var(--violet)' : 'var(--ink)',
                            fontSize: '0.78rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                          }}
                        >
                          {vibe.label}
                        </button>
                      ))}
                    </div>

                    <div
                      style={{
                        fontSize: '0.75rem',
                        fontWeight: 800,
                        color: 'var(--violet)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.06em',
                        marginBottom: '0.75rem',
                      }}
                    >
                      Explore By Region
                    </div>

                    {/* Regional Cards Grid */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {REGION_CATEGORIES.map((region, idx) => (
                        <div
                          key={idx}
                          onClick={() => handleSelectLocation(region.cities[0])}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.85rem',
                            padding: '0.75rem',
                            borderRadius: '16px',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                            background: 'var(--gray-50, #fafafa)',
                            border: '1px solid var(--border-soft, #f4f4f5)',
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(90, 49, 244, 0.05)')}
                          onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--gray-50, #fafafa)')}
                        >
                          <div
                            style={{
                              width: '38px',
                              height: '38px',
                              borderRadius: '12px',
                              background: '#ffffff',
                              boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0,
                            }}
                          >
                            {region.icon}
                          </div>
                          <div style={{ flex: 1 }}>
                            <strong style={{ fontSize: '0.9rem', color: 'var(--ink)', display: 'block' }}>
                              {region.title}
                            </strong>
                            <span style={{ fontSize: '0.75rem', color: 'var(--gray-500)' }}>{region.subtitle}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  /* Autocomplete Live Search List */
                  <div>
                    {loadingSuggestions && (
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          padding: '0.75rem',
                          fontSize: '0.82rem',
                          color: 'var(--gray-500)',
                        }}
                      >
                        <Loader2 size={15} className="spin-icon" /> Searching Indian destinations...
                      </div>
                    )}
                    {liveSuggestions.length === 0 && !loadingSuggestions ? (
                      <div style={{ padding: '1.25rem', textAlign: 'center', color: 'var(--gray-500)', fontSize: '0.85rem' }}>
                        No destinations found for "{destination}"
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                        {liveSuggestions.map((loc, idx) => (
                          <div
                            key={idx}
                            onClick={() => handleSelectLocation(loc.title)}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.75rem',
                              padding: '0.7rem 0.85rem',
                              borderRadius: '14px',
                              cursor: 'pointer',
                              transition: 'background 0.15s ease',
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--gray-50)')}
                            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                          >
                            <div
                              style={{
                                width: '34px',
                                height: '34px',
                                borderRadius: '10px',
                                background: 'rgba(90, 49, 244, 0.08)',
                                color: 'var(--violet)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0,
                              }}
                            >
                              <Compass size={16} />
                            </div>
                            <div style={{ overflow: 'hidden' }}>
                              <strong style={{ fontSize: '0.9rem', color: 'var(--ink)', display: 'block' }}>
                                {loc.title}
                              </strong>
                              <span style={{ fontSize: '0.75rem', color: 'var(--gray-500)' }}>{loc.subtitle}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        <div className="search-bar__divider" />

        {/* Check-In / Check-Out Interactive Dates Field */}
        <div
          className="search-bar__field search-bar__field--dates"
          style={{ position: 'relative' }}
          onClick={() => {
            setShowCalendar(!showCalendar);
            setShowDestDropdown(false);
            setShowGuestsDropdown(false);
          }}
        >
          <div className="search-bar__icon">
            <Calendar size={18} />
          </div>
          <div className="search-bar__content">
            <label className="search-bar__label">Pick Your Dates</label>
            <span className="search-bar__value" style={{ fontWeight: 600 }}>
              {checkIn && checkOut
                ? `${formatDateDisplay(checkIn)} – ${formatDateDisplay(checkOut)}`
                : checkIn
                ? `${formatDateDisplay(checkIn)} – Select Check-out`
                : 'Select Check-in & Out'}
            </span>
          </div>

          {/* Luxury Range Calendar Popover */}
          {showCalendar && (
            <>
              <div
                className="search-bar__backdrop"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowCalendar(false);
                }}
              />
              <LuxuryCalendarPicker
                checkIn={checkIn}
                checkOut={checkOut}
                onChange={(inDate, outDate) => {
                  setCheckIn(inDate);
                  setCheckOut(outDate);
                  updateFilters({ checkIn: inDate, checkOut: outDate });
                }}
                onClose={() => setShowCalendar(false)}
              />
            </>
          )}
        </div>

        <div className="search-bar__divider" />

        {/* Detailed Guests & Pets Field */}
        <div
          className="search-bar__field search-bar__field--guests"
          style={{ position: 'relative' }}
          onClick={() => {
            setShowGuestsDropdown(!showGuestsDropdown);
            setShowCalendar(false);
            setShowDestDropdown(false);
          }}
        >
          <div className="search-bar__icon">
            <Users size={18} />
          </div>
          <div className="search-bar__content">
            <label className="search-bar__label">Travel Crew</label>
            <span className="search-bar__value" style={{ fontWeight: 600 }}>
              {getGuestsSummary()}
            </span>
          </div>

          {/* Guests & Pets Breakdown Popover */}
          {showGuestsDropdown && (
            <>
              <div
                className="search-bar__backdrop"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowGuestsDropdown(false);
                }}
              />
              <GuestsAndPetsPopover
                adults={adults}
                childrenCount={childrenCount}
                infants={infants}
                pets={pets}
                onChange={({ adults: a, children: c, infants: inf, pets: p }) => {
                  setAdults(a);
                  setChildrenCount(c);
                  setInfants(inf);
                  setPets(p);
                  updateFilters({
                    guests: a + c,
                    adults: a,
                    children: c,
                    infants: inf,
                    pets: p,
                  });
                }}
                onClose={() => setShowGuestsDropdown(false)}
              />
            </>
          )}
        </div>

        {/* Search Submit Button */}
        <button type="submit" className="search-bar__submit" aria-label="Search stays">
          <Search size={18} />
          {!compact && <span>Search</span>}
        </button>
      </form>
    </div>
  );
};
