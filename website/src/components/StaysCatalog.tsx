import React, { useState } from 'react';
import { Star, Heart, SlidersHorizontal, Sparkles, ShieldCheck, MapPin, Check, ChevronLeft, ChevronRight } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Stay } from '../types';
import { CategoryFilter } from './CategoryFilter';

const AMENITY_OPTIONS = [
  'Private Pool',
  'High-Speed Wi-Fi',
  'Ocean View',
  'Mountain View',
  'Air Conditioning',
  'Fireplace',
  'Kitchen',
  'Pet Friendly',
];

export const StaysCatalog: React.FC = () => {
  const { stays, isLoadingStays, filters, updateFilters, resetFilters, setSelectedStay, isWishlisted, toggleWishlist } = useApp();
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [tempPriceMax, setTempPriceMax] = useState(filters.priceMax);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>(filters.amenities);

  const toggleAmenity = (amenity: string) => {
    setSelectedAmenities((prev) =>
      prev.includes(amenity) ? prev.filter((a) => a !== amenity) : [...prev, amenity]
    );
  };

  const applyAdvancedFilters = () => {
    updateFilters({
      priceMax: tempPriceMax,
      amenities: selectedAmenities,
    });
    setShowFilterModal(false);
  };

  return (
    <section className="catalog-section" id="stays-catalog">
      <div className="shell">
        {/* Header & Search */}
        <div className="catalog-header">
          <div className="catalog-header__top">
            <div>
              <span className="eyebrow">
                <Sparkles size={14} /> Live Explore & Book
              </span>
              <h2 className="h2">
                Discover exceptional <span className="grad-text">places to stay.</span>
              </h2>
            </div>
            <button
              type="button"
              className="catalog-filter-btn"
              onClick={() => setShowFilterModal(true)}
              aria-label="Filter stays"
            >
              <SlidersHorizontal size={16} />
              <span>Filters</span>
              {(filters.priceMax < 50000 || filters.amenities.length > 0) && (
                <span className="catalog-filter-badge">Active</span>
              )}
            </button>
          </div>

          <CategoryFilter />
        </div>

        {/* Stays Grid */}
        {isLoadingStays ? (
          <div className="catalog-grid">
            {Array.from({ length: 6 }).map((_, i) => (
              <div className="stay-card stay-card--skeleton" key={i}>
                <div className="stay-card__img-skeleton" />
                <div className="stay-card__meta-skeleton">
                  <div className="skeleton-line skeleton-line--short" />
                  <div className="skeleton-line skeleton-line--medium" />
                  <div className="skeleton-line skeleton-line--small" />
                </div>
              </div>
            ))}
          </div>
        ) : stays.length === 0 ? (
          <div className="catalog-empty">
            <div className="catalog-empty__icon">
              <MapPin size={40} />
            </div>
            <h3 className="h3">No stays found for this search</h3>
            <p className="lead" style={{ maxWidth: 450 }}>
              Try loosening your filters, choosing a different destination, or reset all search filters.
            </p>
            <button className="btn btn--primary" onClick={resetFilters} style={{ marginTop: '1rem' }}>
              Reset All Filters
            </button>
          </div>
        ) : (
          <div className="catalog-grid">
            {stays.map((stay) => (
              <StayCard
                key={stay.id}
                stay={stay}
                isSaved={isWishlisted(stay.id)}
                onToggleSave={() => toggleWishlist(stay.id)}
                onClick={() => setSelectedStay(stay)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Advanced Filters Modal */}
      {showFilterModal && (
        <div className="modal-backdrop" onClick={() => setShowFilterModal(false)}>
          <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="modal-sheet__header">
              <h3 className="h3">Filter Stays</h3>
              <button className="modal-close-btn" onClick={() => setShowFilterModal(false)}>
                &times;
              </button>
            </div>

            <div className="modal-sheet__body">
              {/* Price Range */}
              <div className="filter-group">
                <div className="filter-group__label">
                  <span>Max Price per Night</span>
                  <strong className="text-violet">₹{tempPriceMax.toLocaleString('en-IN')}</strong>
                </div>
                <input
                  type="range"
                  min="2000"
                  max="50000"
                  step="1000"
                  value={tempPriceMax}
                  onChange={(e) => setTempPriceMax(Number(e.target.value))}
                  className="filter-slider"
                />
                <div className="filter-slider__bounds">
                  <span>₹2,000</span>
                  <span>₹50,000+</span>
                </div>
              </div>

              {/* Amenities */}
              <div className="filter-group">
                <div className="filter-group__label">
                  <span>Amenities</span>
                </div>
                <div className="amenity-chips">
                  {AMENITY_OPTIONS.map((am) => {
                    const isSelected = selectedAmenities.includes(am);
                    return (
                      <button
                        key={am}
                        type="button"
                        className={`amenity-chip ${isSelected ? 'amenity-chip--active' : ''}`}
                        onClick={() => toggleAmenity(am)}
                      >
                        {isSelected && <Check size={14} />}
                        <span>{am}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="modal-sheet__footer">
              <button
                className="btn btn--ghost"
                onClick={() => {
                  setTempPriceMax(50000);
                  setSelectedAmenities([]);
                  updateFilters({ priceMax: 50000, amenities: [] });
                  setShowFilterModal(false);
                }}
              >
                Clear All
              </button>
              <button className="btn btn--primary" onClick={applyAdvancedFilters}>
                Show {stays.length} Stays
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

interface StayCardProps {
  stay: Stay;
  isSaved: boolean;
  onToggleSave: () => void;
  onClick: () => void;
}

const StayCard: React.FC<StayCardProps> = ({ stay, isSaved, onToggleSave, onClick }) => {
  const [photoIndex, setPhotoIndex] = useState(0);

  const handleNextPhoto = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPhotoIndex((prev) => (prev + 1) % stay.imageUrls.length);
  };

  const handlePrevPhoto = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPhotoIndex((prev) => (prev === 0 ? stay.imageUrls.length - 1 : prev - 1));
  };

  return (
    <article className="stay-card" onClick={onClick}>
      <div className="stay-card__media">
        <img
          src={stay.imageUrls[photoIndex] || '/images/villa_1.jpg'}
          alt={stay.title}
          className="stay-card__img"
          loading="lazy"
        />

        {/* Heart Wishlist Button */}
        <button
          type="button"
          className={`stay-card__heart-btn ${isSaved ? 'stay-card__heart-btn--saved' : ''}`}
          onClick={(e) => {
            e.stopPropagation();
            onToggleSave();
          }}
          aria-label={isSaved ? 'Remove from wishlist' : 'Save to wishlist'}
        >
          <Heart size={18} fill={isSaved ? '#f04438' : 'none'} color={isSaved ? '#f04438' : '#ffffff'} />
        </button>

        {/* Badge Ribbon */}
        {stay.isZeroBroker ? (
          <div className="stay-card__badge stay-card__badge--zb">
            <ShieldCheck size={13} /> Zero Brokerage
          </div>
        ) : stay.isGuestFavorite ? (
          <div className="stay-card__badge stay-card__badge--gf">
            <Sparkles size={13} /> Guest Favorite
          </div>
        ) : stay.isSuperhost ? (
          <div className="stay-card__badge">StarHost</div>
        ) : null}

        {/* Photo Navigation Arrows */}
        {stay.imageUrls.length > 1 && (
          <>
            <button
              type="button"
              className="stay-card__nav-arrow stay-card__nav-arrow--left"
              onClick={handlePrevPhoto}
              aria-label="Previous photo"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              type="button"
              className="stay-card__nav-arrow stay-card__nav-arrow--right"
              onClick={handleNextPhoto}
              aria-label="Next photo"
            >
              <ChevronRight size={16} />
            </button>

            {/* Dots */}
            <div className="stay-card__dots">
              {stay.imageUrls.map((_, i) => (
                <span
                  key={i}
                  className={`stay-card__dot ${i === photoIndex ? 'stay-card__dot--active' : ''}`}
                />
              ))}
            </div>
          </>
        )}
      </div>

      <div className="stay-card__content">
        <div className="stay-card__top">
          <span className="stay-card__location">{stay.location}</span>
          <div className="stay-card__rating">
            <Star size={14} fill="var(--gold)" color="var(--gold)" />
            <span>{stay.rating.toFixed(2)}</span>
            <span className="stay-card__reviews">({stay.reviewCount})</span>
          </div>
        </div>

        <h3 className="stay-card__title">{stay.title}</h3>

        <p className="stay-card__tagline">
          {stay.category} · {stay.bedrooms} {stay.bedrooms === 1 ? 'bed' : 'beds'} · up to {stay.maxGuests} guests
        </p>

        <div className="stay-card__bottom">
          <div className="stay-card__price">
            <span className="stay-card__amount">₹{stay.pricePerNight.toLocaleString('en-IN')}</span>
            <span className="stay-card__period"> / night</span>
          </div>
          <span className="stay-card__book-cta">View Details &rarr;</span>
        </div>
      </div>
    </article>
  );
};
