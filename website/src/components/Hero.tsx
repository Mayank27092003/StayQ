"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  Compass,
  MapPin,
  Calendar,
  Users,
  Search,
  Star,
  Tent,
  Palmtree,
  Mountain,
  ArrowUpRight,
  Waves,
  Car,
  Flame,
} from "lucide-react";
import { useApp } from "../context/AppContext";

interface HeroMode {
  id: string;
  pillLabel: string;
  pillIcon: typeof Tent;
  pillColor: string;
  image: string;
  titleBadge: string;
  tagline: string;
  flowerLabel: string;
  hotspotLeft: { icon: typeof Waves; label: string };
  hotspotRight: { icon: typeof Car; label: string };
  cardTitle: string;
  cardDesc: string;
  destination: string;
}

const MODES: HeroMode[] = [
  {
    id: "rvs",
    pillLabel: "4x4 RVs",
    pillIcon: Tent,
    pillColor: "#F59E0B",
    image: "/images/campervan_wide_8k.jpg",
    titleBadge: "Ladakh 4x4 Expedition",
    tagline: "FEEL UNCHARTED INDIA\nWITH 5-STAR LUXURY\n& 0% BROKERAGE",
    flowerLabel: "Book\nYour RV",
    hotspotLeft: { icon: Waves, label: "Ladakh Sunset View" },
    hotspotRight: { icon: Car, label: "Off-Grid Campsite" },
    cardTitle: "Start 3D Caravan Tours",
    cardDesc: "3D off-grid campervan route makes this possible, offering realistic and immersive Indian expeditions.",
    destination: "Leh Ladakh",
  },
  {
    id: "camps",
    pillLabel: "Camps",
    pillIcon: Mountain,
    pillColor: "#C084FC",
    image: "/images/kedarnath_camp_wide_8k.jpg",
    titleBadge: "Garhwal Alpine Glamping",
    tagline: "HEATED GEODESIC DOMES\nAMIDST SACRED HIMALAYAS\n& 0% BROKERAGE",
    flowerLabel: "Book\nYour Camp",
    hotspotLeft: { icon: Flame, label: "Campfire & Stargazing" },
    hotspotRight: { icon: Mountain, label: "Garhwal Valley View" },
    cardTitle: "Start 3D Dome Tour",
    cardDesc: "Explore heated panoramic glass domes with private sundecks at 11,500 ft elevation.",
    destination: "Kedarnath",
  },
  {
    id: "villas",
    pillLabel: "Villas",
    pillIcon: Sparkles,
    pillColor: "#F59E0B",
    image: "/images/indian_villa_wide_8k.jpg",
    titleBadge: "Udaipur Royal Heritage Haveli",
    tagline: "ROYAL LAKE HAVELI VILLAS\nWITH PRIVATE LOTUS POOL\n& 0% BROKERAGE",
    flowerLabel: "Book\nYour Villa",
    hotspotLeft: { icon: Sparkles, label: "Lotus Plunge Pool" },
    hotspotRight: { icon: Waves, label: "Lake Pichola Sunset" },
    cardTitle: "Start 3D Royal Villa Tour",
    cardDesc: "360° walkthrough of private lakeside jharokhas, candlelit lotus courtyards, and royal master suites.",
    destination: "Udaipur",
  },
];

export function Hero() {
  const { setSelectedStay, stays, setIsSearchModalOpen, updateFilters, setIsQubeOpen } = useApp();
  const [activeModeIndex, setActiveModeIndex] = useState(0);
  const [activeHotspot, setActiveHotspot] = useState<string | null>(null);

  const currentMode = MODES[activeModeIndex];

  // Auto-slide every 5 seconds continuously
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveModeIndex((prev) => (prev + 1) % MODES.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleBookCurrentStay = () => {
    const matchedStay =
      stays.find(
        (s) =>
          s.city?.toLowerCase().includes(currentMode.destination.toLowerCase()) ||
          s.location?.toLowerCase().includes(currentMode.destination.toLowerCase()) ||
          s.title?.toLowerCase().includes(currentMode.destination.toLowerCase())
      ) || stays[0];
    if (matchedStay) {
      setSelectedStay(matchedStay);
    }
  };

  const handleQuickSearch = (dest: string) => {
    updateFilters({ destination: dest });
    const el = document.getElementById("stays-catalog");
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    } else {
      window.location.hash = "#stays-catalog";
    }
  };

  const handleExploreTestimonials = (e: React.MouseEvent) => {
    e.preventDefault();
    const el = document.getElementById("testimonials");
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    } else {
      window.location.hash = "#testimonials";
    }
  };

  return (
    <section
      className="hero-clean-root"
      id="home"
      aria-label="Stay Q Luxury Expedition Hero"
    >
      {/* ================= DESKTOP EDITORIAL HERO (>= 900px) ================= */}
      <div className="hero-clean-desktop">
      {/* ================= PRELOADED DUAL-LAYER CROSSFADE BACKGROUNDS ================= */}
      {MODES.map((mode, index) => (
        <img
          key={mode.id}
          src={mode.image}
          alt={mode.titleBadge}
          className={`hero-clean__bg-img ${
            index === activeModeIndex ? "hero-clean__bg-img--active" : "hero-clean__bg-img--hidden"
          }`}
          loading="eager"
        />
      ))}

      {/* Subtle Atmospheric Gradient for Perfect Text & UI Contrast */}
      <div className="hero-clean__overlay" />

      {/* ================= PRISTINE, UNOBSTRUCTED 'STAY Q' ARCHITECTURAL TYPOGRAPHY ================= */}
      <div className="hero-clean__title-layer" aria-hidden="true">
        <span className="hero-clean__title-text">STAY Q</span>
      </div>

      <div className="hero-clean__container">
        {/* Main 3-Column Clean Stage */}
        <div className="hero-clean__stage">

          {/* ================= LEFT COLUMN: CLEAN & SPACED ================= */}
          <div className="hero-clean__col-left">
            {/* Top-Left Mode Switcher Pills: 4x4 RVs | Camps | Villas */}
            <div className="hero-clean__pills-row">
              {MODES.map((m, idx) => {
                const Icon = m.pillIcon;
                const isActive = idx === activeModeIndex;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => {
                      setActiveModeIndex(idx);
                    }}
                    className={`hero-clean__pill ${isActive ? "hero-clean__pill--active" : ""}`}
                    title={m.titleBadge}
                  >
                    <Icon size={14} style={{ color: isActive ? "#5A31F4" : m.pillColor }} />
                    <span>{m.pillLabel}</span>
                    {isActive && (
                      <motion.div
                        className="hero-clean__pill-progress"
                        initial={{ width: "0%" }}
                        animate={{ width: "100%" }}
                        transition={{ duration: 5.0, ease: "linear" }}
                        key={`progress-${activeModeIndex}`}
                      />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Mid-Left Scalloped 12-Lobe Flower Badge (Cleanly Spaced) */}
            <motion.div
              className="hero-clean__flower-wrap"
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.15 }}
              onClick={handleBookCurrentStay}
              role="button"
              tabIndex={0}
              title={`Click to Book ${currentMode.pillLabel}`}
            >
              <div className="hero-clean__flower-badge">
                <svg
                  viewBox="0 0 120 120"
                  className="hero-clean__flower-svg"
                  aria-hidden="true"
                >
                  <path
                    d="M 100.0 60.0 Q 115.2 82.9 88.3 88.3 Q 82.9 115.2 60.0 100.0 Q 37.1 115.2 31.7 88.3 Q 4.8 82.9 20.0 60.0 Q 4.8 37.1 31.7 31.7 Q 37.1 4.8 60.0 20.0 Q 82.9 4.8 88.3 31.7 Q 115.2 37.1 100.0 60.0 Z"
                    fill="rgba(255, 255, 255, 0.95)"
                    stroke="rgba(255, 255, 255, 1)"
                    strokeWidth="2.5"
                  />
                </svg>
                <div className="hero-clean__flower-inner">
                  <ArrowUpRight size={24} className="hero-clean__flower-arrow" />
                  <span
                    className="hero-clean__flower-lbl"
                    dangerouslySetInnerHTML={{ __html: currentMode.flowerLabel }}
                  />
                </div>
              </div>
            </motion.div>

            {/* Bottom-Left Statement */}
            <div className="hero-clean__left-bottom">
              <div className="hero-clean__asterisk" aria-hidden="true">
                ✳
              </div>
              <AnimatePresence mode="wait">
                <motion.h2
                  key={currentMode.id}
                  className="hero-clean__statement"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.4 }}
                >
                  {currentMode.tagline.split("\n").map((line, i) => (
                    <React.Fragment key={i}>
                      {line}
                      {i < currentMode.tagline.split("\n").length - 1 && <br />}
                    </React.Fragment>
                  ))}
                </motion.h2>
              </AnimatePresence>
            </div>
          </div>

          {/* ================= CENTER COLUMN: CLEAN, OPEN VISUALS ================= */}
          <div className="hero-clean__col-center">
            {/* Left Subtle Hotspot */}
            <AnimatePresence mode="wait">
              <motion.div
                key={`left-${currentMode.id}`}
                className={`hero-clean__hotspot hero-clean__hotspot--left ${
                  activeHotspot === "left" ? "hero-clean__hotspot--active" : ""
                }`}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.35 }}
                onMouseEnter={() => setActiveHotspot("left")}
                onMouseLeave={() => setActiveHotspot(null)}
                onClick={handleBookCurrentStay}
              >
                <span className="hero-clean__hotspot-icon">
                  {React.createElement(currentMode.hotspotLeft.icon, {
                    size: 13,
                    style: { color: "#38BDF8" },
                  })}
                </span>
                <span className="hero-clean__hotspot-text">{currentMode.hotspotLeft.label}</span>
              </motion.div>
            </AnimatePresence>

            {/* Right Subtle Hotspot */}
            <AnimatePresence mode="wait">
              <motion.div
                key={`right-${currentMode.id}`}
                className={`hero-clean__hotspot hero-clean__hotspot--right ${
                  activeHotspot === "right" ? "hero-clean__hotspot--active" : ""
                }`}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.35 }}
                onMouseEnter={() => setActiveHotspot("right")}
                onMouseLeave={() => setActiveHotspot(null)}
                onClick={handleBookCurrentStay}
              >
                <span className="hero-clean__hotspot-icon">
                  {React.createElement(currentMode.hotspotRight.icon, {
                    size: 13,
                    style: { color: "#34D399" },
                  })}
                </span>
                <span className="hero-clean__hotspot-text">{currentMode.hotspotRight.label}</span>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* ================= RIGHT COLUMN: UNOBSTRUCTED 'Q' ================= */}
          <div className="hero-clean__col-right">
            {/* Top-Right 3D Interactive Card (Cleanly positioned below 'Q') */}
            <motion.div
              className="hero-clean__tour-card-wrap"
              initial={{ x: 25, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              {/* Pointer Connection Dot & Line extending to Center Object */}
              <div className="hero-clean__pointer-line" aria-hidden="true">
                <span className="hero-clean__pointer-dot" />
              </div>

              <div
                className="hero-clean__tour-card"
                onClick={() => setIsQubeOpen(true)}
                role="button"
                tabIndex={0}
                title="Open Qube AI 3D Route Planner"
              >
                <div className="hero-clean__tour-header">
                  <div className="hero-clean__tour-icon-wrap">
                    <Compass size={18} style={{ color: "#5A31F4" }} />
                  </div>
                  <div className="hero-clean__tour-btn">
                    <ArrowUpRight size={16} />
                  </div>
                </div>

                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentMode.id}
                    className="hero-clean__tour-body"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.3 }}
                  >
                    <h4 className="hero-clean__tour-title">{currentMode.cardTitle}</h4>
                    <p className="hero-clean__tour-desc">{currentMode.cardDesc}</p>
                  </motion.div>
                </AnimatePresence>
              </div>
            </motion.div>

            {/* Bottom-Right Verified Guest Social Proof */}
            <div className="hero-clean__right-bottom">
              <div className="hero-clean__avatar-stack">
                <img
                  src="/images/avatar_rohan.jpg"
                  alt="Rohan"
                  className="hero-clean__avatar"
                />
                <img
                  src="/images/avatar_sophia.jpg"
                  alt="Sophia"
                  className="hero-clean__avatar"
                />
                <img
                  src="/images/avatar_alex.jpg"
                  alt="Alex"
                  className="hero-clean__avatar"
                />
                <img
                  src="/images/avatar_elena.jpg"
                  alt="Elena"
                  className="hero-clean__avatar"
                />
                <div className="hero-clean__rating-badge">
                  <span className="hero-clean__rating-score">
                    <Star size={12} fill="#F59E0B" color="#F59E0B" /> 4.98
                  </span>
                  <span className="hero-clean__rating-count">
                    (1,420+ Verified Stays)
                  </span>
                </div>
              </div>

              <div className="hero-clean__avatar-divider" />

              <a
                href="#testimonials"
                onClick={handleExploreTestimonials}
                className="hero-clean__testimonial-link"
              >
                <span>Read 1,420+ Verified Guest Reviews</span>
                <ArrowUpRight size={14} />
              </a>
            </div>
          </div>
        </div>

        {/* ================= CLAYMORPHIC FLOATING SEARCH CONSOLE ================= */}
        <motion.div
          className="hero-clean__search-wrapper"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          {/* Mobile Single-Capsule Luxury Search Bar (Visible on phones) */}
          <div
            className="hero-clean__search-bar-mobile"
            onClick={() => setIsSearchModalOpen(true)}
            role="button"
            tabIndex={0}
            aria-label="Open stay search"
          >
            <div className="hero-clean__search-mobile-left">
              <div className="hero-clean__search-mobile-icon-wrap">
                <Search size={17} style={{ color: "#ffffff" }} />
              </div>
              <div className="hero-clean__search-mobile-text">
                <span className="hero-clean__search-mobile-title">Where in India?</span>
                <span className="hero-clean__search-mobile-sub">Caravans · Domes · Villas · 0% Brokerage</span>
              </div>
            </div>
            <div className="hero-clean__search-mobile-filter-btn" aria-label="Explore Stays">
              <Compass size={17} style={{ color: "#5A31F4" }} />
            </div>
          </div>

          {/* Desktop Full 3-Segment Search Bar (Visible on tablets & desktops) */}
          <div
            className="hero-clean__search-bar hero-clean__search-bar--desktop"
            onClick={() => setIsSearchModalOpen(true)}
            role="button"
            tabIndex={0}
            aria-label="Open stay search"
          >
            {/* Segment 1: Where */}
            <div className="hero-clean__search-seg">
              <div className="hero-clean__search-icon">
                <MapPin size={17} style={{ color: "#5A31F4" }} />
              </div>
              <div className="hero-clean__search-info">
                <span className="hero-clean__search-lbl">Where in India?</span>
                <span className="hero-clean__search-val">Goa, Manali, Ladakh, Kedarnath...</span>
              </div>
            </div>

            <div className="hero-clean__search-sep" />

            {/* Segment 2: When */}
            <div className="hero-clean__search-seg">
              <div className="hero-clean__search-icon">
                <Calendar size={17} style={{ color: "#5A31F4" }} />
              </div>
              <div className="hero-clean__search-info">
                <span className="hero-clean__search-lbl">When?</span>
                <span className="hero-clean__search-val">Select check-in &amp; check-out</span>
              </div>
            </div>

            <div className="hero-clean__search-sep" />

            {/* Segment 3: Who */}
            <div className="hero-clean__search-seg">
              <div className="hero-clean__search-icon">
                <Users size={17} style={{ color: "#5A31F4" }} />
              </div>
              <div className="hero-clean__search-info">
                <span className="hero-clean__search-lbl">Who?</span>
                <span className="hero-clean__search-val">Add guests &amp; pets</span>
              </div>
            </div>

            {/* Search CTA */}
            <button
              type="button"
              className="hero-clean__search-submit"
              onClick={(e) => {
                e.stopPropagation();
                setIsSearchModalOpen(true);
              }}
              aria-label="Search stays and caravans"
            >
              <Search size={16} />
              <span>Search Stays</span>
            </button>
          </div>

          {/* Quick Destination Presets */}
          <div className="hero-clean__presets-row">
            <span className="hero-clean__presets-lbl">Trending:</span>
            <button
              type="button"
              className="hero-clean__preset-pill"
              onClick={() => handleQuickSearch("Leh Ladakh")}
            >
              🚙 Ladakh 4x4 Caravans
            </button>
            <button
              type="button"
              className="hero-clean__preset-pill"
              onClick={() => handleQuickSearch("Kedarnath")}
            >
              ⛺ Kedarnath Alpine Domes
            </button>
            <button
              type="button"
              className="hero-clean__preset-pill"
              onClick={() => handleQuickSearch("Goa")}
            >
              🏖️ Goa Pool Villas
            </button>
            <button
              type="button"
              className="hero-clean__preset-pill"
              onClick={() => handleQuickSearch("Manali")}
            >
              🏔️ Manali Glass Cabins
            </button>
            <button
              type="button"
              className="hero-clean__preset-pill"
              onClick={() => handleQuickSearch("Bengaluru")}
            >
              🔑 Bangalore 0% Broker Lofts
            </button>
          </div>
        </motion.div>
      </div>
      </div>

      {/* =====================================================================
          MOBILE ULTRA-LUXURY APP-STYLE HERO (< 900px)
          Aspect-ratio 16:10 for 100% full uncropped view of the 3 photos!
          ===================================================================== */}
      <div className="hero-clean-mobile" aria-label="Stay Q Mobile Showcase">
        {/* 1. Mobile Search Capsule at Top (Easy 1-tap thumb access) */}
        <div
          className="hero-mob__search"
          onClick={() => setIsSearchModalOpen(true)}
          role="button"
          tabIndex={0}
          aria-label="Search destinations in India"
        >
          <div className="hero-mob__search-left">
            <div className="hero-mob__search-icon">
              <Search size={16} color="#ffffff" />
            </div>
            <div className="hero-mob__search-text">
              <span className="hero-mob__search-title">Where in India?</span>
              <span className="hero-mob__search-sub">Any week · Add guests · 0% Broker</span>
            </div>
          </div>
          <div className="hero-mob__search-filter" aria-label="Explore">
            <Compass size={17} color="#5A31F4" />
          </div>
        </div>

        {/* 2. Mode Switcher Segmented Pills */}
        <div className="hero-mob__pills" role="tablist">
          {MODES.map((m, idx) => {
            const Icon = m.pillIcon;
            const isActive = idx === activeModeIndex;
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => setActiveModeIndex(idx)}
                className={`hero-mob__pill ${isActive ? "hero-mob__pill--active" : ""}`}
                role="tab"
                aria-selected={isActive}
              >
                <Icon size={14} style={{ color: isActive ? "#5A31F4" : m.pillColor }} />
                <span>{m.pillLabel}</span>
              </button>
            );
          })}
        </div>

        {/* 3. The Cinematic Showcase Card (Full 16:10 aspect ratio, ZERO cropping!) */}
        <div
          className="hero-mob__card"
          onClick={handleBookCurrentStay}
          role="button"
          tabIndex={0}
          title={`View and book ${currentMode.pillLabel}`}
        >
          {/* Preloaded crossfade images from the website */}
          {MODES.map((mode, index) => (
            <img
              key={mode.id}
              src={mode.image}
              alt={mode.titleBadge}
              className={`hero-mob__card-img ${
                index === activeModeIndex ? "hero-mob__card-img--active" : "hero-mob__card-img--hidden"
              }`}
              loading="eager"
            />
          ))}

          {/* Soft cinematic vignette */}
          <div className="hero-mob__card-overlay" />

          {/* Top Badge on Card */}
          <div className="hero-mob__card-badge">
            <Sparkles size={12} color="#F59E0B" />
            <span>{currentMode.titleBadge}</span>
          </div>

          {/* Bottom Card Content */}
          <div className="hero-mob__card-bottom">
            <h3 className="hero-mob__card-title">
              {currentMode.id === "rvs" && "Ladakh 4x4 Overland Expeditions"}
              {currentMode.id === "camps" && "Heated Geodesic Domes at 11,500 ft"}
              {currentMode.id === "villas" && "Royal Lake Haveli and Lotus Pool"}
            </h3>

            <div className="hero-mob__card-meta">
              <div className="hero-mob__rating">
                <Star size={12} fill="#F59E0B" color="#F59E0B" />
                <span>4.98</span>
                <small>(1,420+ Stays)</small>
              </div>
              <div className="hero-mob__cta-pill">
                <span>Explore</span>
                <ArrowUpRight size={13} />
              </div>
            </div>
          </div>
        </div>

        {/* 4. Quick Trending Destination Chips */}
        <div className="hero-mob__chips">
          <button
            type="button"
            className="hero-mob__chip"
            onClick={() => handleQuickSearch("Leh Ladakh")}
          >
            🚙 Ladakh
          </button>
          <button
            type="button"
            className="hero-mob__chip"
            onClick={() => handleQuickSearch("Kedarnath")}
          >
            ⛺ Kedarnath
          </button>
          <button
            type="button"
            className="hero-mob__chip"
            onClick={() => handleQuickSearch("Goa")}
          >
            🏖️ Goa
          </button>
          <button
            type="button"
            className="hero-mob__chip"
            onClick={() => handleQuickSearch("Manali")}
          >
            🏔️ Manali
          </button>
          <button
            type="button"
            className="hero-mob__chip"
            onClick={() => handleQuickSearch("Bengaluru")}
          >
            🔑 Bangalore
          </button>
        </div>
      </div>
    </section>
  );
}
