"use client";

import React, { useState } from "react";
import { 
  Compass, 
  MapPin, 
  Zap, 
  Droplets, 
  Utensils, 
  ShieldCheck, 
  CheckCircle2, 
  ArrowRight, 
  Navigation, 
  Building2, 
  PhoneCall, 
  Sparkles, 
  Car, 
  Check 
} from "lucide-react";
import { Reveal } from "./Reveal";
import { useApp } from "../context/AppContext";

interface RouteOption {
  id: string;
  name: string;
  badge: string;
  distance: string;
  duration: string;
  pickup: string;
  drop: string;
  type: string;
  description: string;
  highlights: string[];
  stops: string[];
}

const ROUTES: RouteOption[] = [
  {
    id: "goa-kerala",
    name: "Coastal Highway Expedition",
    badge: "Most Popular",
    distance: "950 km total",
    duration: "6 – 8 Days",
    pickup: "North / South Goa Hub",
    drop: "Kochi Hub (or Goa Round-Trip)",
    type: "Round-Trip or One-Way Drop",
    description: "Cruise along the scenic Arabian Sea coastline from Goa through Gokarna, Murudeshwar, and Mangalore down to Kochi backwaters.",
    highlights: ["Beachside RV Parking", "Seafood Corridors", "Backwater Pit-Stops"],
    stops: ["Goa Hub", "Gokarna Cliff Resort", "Mangalore Coast Inn", "Kochi Backwaters Point"],
  },
  {
    id: "western-ghats",
    name: "Western Ghats Monsoon Trail",
    badge: "Scenic Wilderness",
    distance: "620 km total",
    duration: "4 – 6 Days",
    pickup: "Mumbai / Pune Hub",
    drop: "Goa Hub (or Pune Return)",
    type: "Hub-to-Hub or Loop",
    description: "Wind through mist-covered hills, roaring waterfalls, tea estates, and deep forest reserves with verified mountain resort hookups.",
    highlights: ["Mountain RV Decks", "Campfire Permitted", "River View Parking"],
    stops: ["Pune Hub", "Lonavala Valley Resort", "Mahabaleshwar Woods", "Goa Coastal Hub"],
  },
  {
    id: "himalayan-circuit",
    name: "Himalayan High Passes",
    badge: "Overland Adventure",
    distance: "1,150 km total",
    duration: "8 – 12 Days",
    pickup: "Chandigarh / Manali Hub",
    drop: "Leh Hub (or Manali Loop)",
    type: "All-Terrain Overland",
    description: "The ultimate road trip across Rohtang, Baralacha La, and Tanglang La with high-altitude solar-powered RV pit-stops.",
    highlights: ["4x4 Overland RVs", "Heated Living Cabins", "Oxygen Support Points"],
    stops: ["Manali Base Hub", "Jispa Valley Camp", "Sarchu Glamp Point", "Leh High-Altitude Stop"],
  },
];

const PIT_STOP_FEATURES = [
  {
    icon: Zap,
    title: "Shore Power & 220V Hookups",
    desc: "Plug your campervan in for continuous AC, refrigerator, lights, and battery recharging overnight.",
    color: "#eab308",
  },
  {
    icon: Droplets,
    title: "Potable Water & Drainage",
    desc: "Refill fresh filtered drinking water and empty greywater tanks safely with sanitized plumbing docks.",
    color: "#0284c7",
  },
  {
    icon: Sparkles,
    title: "Sanitized Restrooms & Hot Showers",
    desc: "Clean private resort washrooms with 24x7 hot water showers after a long day of scenic driving.",
    color: "#8b5cf6",
  },
  {
    icon: Utensils,
    title: "Resort Dining & Refreshments",
    desc: "Enjoy multi-cuisine dining, poolside snacks, or breakfast buffet at partner resorts (discounted or bundled).",
    color: "#10b981",
  },
  {
    icon: ShieldCheck,
    title: "24/7 Gated Security & Leisure",
    desc: "Guarded parking with CCTV, swimming pool and lawn access, lush gardens, and complimentary high-speed Wi-Fi.",
    color: "#f43f5e",
  },
];

const KM_PACKAGES = [
  {
    km: "80 km / Day",
    tier: "Leisure Cruiser",
    tagline: "Slow-paced scenic hops & weekend staycations.",
    extra: "₹15/extra km",
    idealFor: "Campers staying 2-3 nights at a single destination.",
  },
  {
    km: "100 km / Day",
    tier: "Standard Voyager",
    tagline: "Our most balanced package for regional road trips.",
    extra: "₹14/extra km",
    idealFor: "Coastal highway explorations with daily sightseeing.",
    recommended: true,
  },
  {
    km: "150 km / Day",
    tier: "Interstate Explorer",
    tagline: "High-distance touring across multiple states.",
    extra: "₹12/extra km",
    idealFor: "Cross-country road expeditions like Goa to Kerala.",
  },
  {
    km: "Unlimited km",
    tier: "Grand Overland",
    tagline: "No limits. Drive across India with total peace of mind.",
    extra: "Zero extra km charges",
    idealFor: "Himalayan expeditions & long multi-week journeys.",
  },
];

export function RvOverlandNetwork() {
  const { updateFilters } = useApp();
  const [activeRoute, setActiveRoute] = useState<string>("goa-kerala");
  const [activeKm, setActiveKm] = useState<string>("100 km / Day");

  const selectedRoute = ROUTES.find((r) => r.id === activeRoute) || ROUTES[0];

  const handleExploreRvs = (e: React.MouseEvent) => {
    e.preventDefault();
    updateFilters({ category: "RV" });
    const catalogElem = document.getElementById("stays-catalog");
    if (catalogElem) {
      catalogElem.scrollIntoView({ behavior: "smooth" });
    } else {
      window.location.hash = "#/stays";
    }
  };

  const handlePartnerWithUs = (e: React.MouseEvent) => {
    e.preventDefault();
    const message = encodeURIComponent(
      "Hello Stay Q Team, I am a Resort / Hotel owner and I want to register our property as a Stay Q RV Pit-Stop & Recreational Point."
    );
    window.open(`https://wa.me/919225270718?text=${message}`, "_blank");
  };

  return (
    <section 
      className="section" 
      id="rv-overland-ecosystem" 
      style={{ 
        background: "linear-gradient(180deg, #f7f5fd 0%, #ede8fa 40%, #f9f8fe 100%)",
        position: "relative",
        overflow: "hidden",
        padding: "6rem 0 5rem 0",
        borderTop: "1px solid rgba(90, 49, 244, 0.08)",
        borderBottom: "1px solid rgba(90, 49, 244, 0.08)",
      }}
    >
      {/* Background Clay Ambient Orbs */}
      <div
        style={{
          position: "absolute",
          top: "-5%",
          right: "-5%",
          width: "600px",
          height: "600px",
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(90, 49, 244, 0.12) 0%, transparent 70%)",
          filter: "blur(60px)",
          pointerEvents: "none",
        }}
        aria-hidden="true"
      />
      <div
        style={{
          position: "absolute",
          bottom: "-5%",
          left: "-5%",
          width: "550px",
          height: "550px",
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(16, 185, 129, 0.1) 0%, transparent 70%)",
          filter: "blur(60px)",
          pointerEvents: "none",
        }}
        aria-hidden="true"
      />

      <div className="shell rel">
        {/* Section Header */}
        <div className="section-head section-head--center" style={{ maxWidth: "880px", margin: "0 auto 3.5rem auto" }}>
          <Reveal>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: "1.25rem" }}>
              {/* 3D Clay Eyebrow Pill */}
              <span 
                style={{ 
                  background: "linear-gradient(135deg, #ffffff 0%, #f4f0ff 100%)",
                  color: "#5a31f4",
                  fontWeight: 800,
                  fontSize: "0.85rem",
                  letterSpacing: "0.04em",
                  padding: "0.55rem 1.35rem",
                  borderRadius: "9999px",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.6rem",
                  border: "1px solid rgba(255, 255, 255, 0.95)",
                  boxShadow: 
                    "0 8px 20px rgba(90, 49, 244, 0.15), 0 2px 6px rgba(15, 23, 42, 0.05), inset 0 2px 4px rgba(255, 255, 255, 0.98), inset 0 -2px 4px rgba(90, 49, 244, 0.08)",
                }}
              >
                <Compass size={16} color="#5a31f4" />
                India&apos;s 1st Overland &amp; RV Tourism Ecosystem
              </span>
            </div>
          </Reveal>

          <Reveal delay={0.06}>
            <h2 className="h1" style={{ fontSize: "clamp(2.1rem, 4vw, 3.25rem)", lineHeight: 1.15, fontWeight: 900 }}>
              Drive the Journey. <span className="grad-text">Live the Freedom.</span>
            </h2>
          </Reveal>

          <Reveal delay={0.12}>
            <p className="lead" style={{ fontSize: "1.15rem", color: "#4b5563", marginTop: "1rem", lineHeight: 1.6 }}>
              India is opening up to overland campervan travel. Stay Q bridges vehicle owners, travelers, 
              and partner resorts into a unified national road-trip infrastructure with certified pit-stops, 
              flexible route hubs, and transparent daily kilometer allowances.
            </p>
          </Reveal>
        </div>

        {/* Feature 1: Routes & Hub-to-Hub Flexibility (Claymorphic Master Container) */}
        <div 
          style={{
            background: "linear-gradient(145deg, #ffffff 0%, #f9f8ff 100%)",
            borderRadius: "32px",
            border: "1.5px solid rgba(255, 255, 255, 0.95)",
            boxShadow: 
              "0 24px 50px -10px rgba(90, 49, 244, 0.12), 0 6px 18px rgba(15, 23, 42, 0.04), inset 0 3px 6px rgba(255, 255, 255, 0.98), inset 0 -2px 6px rgba(90, 49, 244, 0.05)",
            padding: "clamp(1.5rem, 3.5vw, 2.75rem)",
            marginBottom: "3.5rem",
          }}
        >
          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "flex-end", gap: "1.5rem", marginBottom: "2rem" }}>
            <div>
              <span 
                style={{ 
                  fontSize: "0.8rem", 
                  fontWeight: 800, 
                  textTransform: "uppercase", 
                  color: "#6d28d9", 
                  letterSpacing: "0.08em",
                  background: "rgba(90, 49, 244, 0.08)",
                  padding: "0.3rem 0.75rem",
                  borderRadius: "9999px",
                  display: "inline-block",
                  boxShadow: "inset 0 1px 3px rgba(255, 255, 255, 0.9)",
                }}
              >
                Corridor Networks
              </span>
              <h3 style={{ fontSize: "clamp(1.5rem, 2.5vw, 1.85rem)", fontWeight: 900, marginTop: "0.5rem", color: "#111827" }}>
                Cross-Country Routes &amp; Flexible Hubs
              </h3>
              <p style={{ color: "#4b5563", fontSize: "0.95rem", maxWidth: "620px", marginTop: "0.35rem" }}>
                Choose circular routes (pickup &amp; return to same city) or one-way interstate drops where the host enables drop-off at your destination.
              </p>
            </div>

            {/* 3D Clay Route Tabs */}
            <div style={{ display: "flex", gap: "0.65rem", flexWrap: "wrap" }}>
              {ROUTES.map((route) => {
                const isActive = activeRoute === route.id;
                return (
                  <button
                    key={route.id}
                    onClick={() => setActiveRoute(route.id)}
                    style={{
                      padding: "0.65rem 1.35rem",
                      borderRadius: "9999px",
                      fontSize: "0.9rem",
                      fontWeight: 700,
                      cursor: "pointer",
                      transition: "all 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
                      border: isActive ? "none" : "1px solid rgba(255, 255, 255, 0.9)",
                      background: isActive 
                        ? "linear-gradient(135deg, #7c3aed 0%, #5a31f4 100%)" 
                        : "linear-gradient(145deg, #ffffff 0%, #f7f6fd 100%)",
                      color: isActive ? "#ffffff" : "#4b5563",
                      boxShadow: isActive 
                        ? "0 10px 24px rgba(90, 49, 244, 0.42), 0 3px 8px rgba(15, 23, 42, 0.12), inset 0 3px 6px rgba(255, 255, 255, 0.65), inset 0 -3px 6px rgba(0, 0, 0, 0.25)" 
                        : "0 6px 16px rgba(15, 23, 42, 0.08), 0 2px 4px rgba(15, 23, 42, 0.03), inset 0 2px 4px rgba(255, 255, 255, 0.98), inset 0 -2px 4px rgba(90, 49, 244, 0.04)",
                      transform: isActive ? "translateY(-2px)" : "none",
                    }}
                  >
                    {route.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active Route Highlight Box (Nested 3D Clay Surface) */}
          <div 
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(310px, 1fr))",
              gap: "2rem",
              background: "linear-gradient(145deg, #fbfaff 0%, #f4efff 100%)",
              borderRadius: "26px",
              padding: "clamp(1.25rem, 2.5vw, 2.25rem)",
              border: "1.5px solid rgba(255, 255, 255, 0.95)",
              boxShadow: 
                "0 14px 34px rgba(90, 49, 244, 0.08), inset 0 3px 6px rgba(255, 255, 255, 0.98), inset 0 -2px 5px rgba(90, 49, 244, 0.06)",
            }}
          >
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.85rem" }}>
                <span 
                  style={{ 
                    background: "linear-gradient(135deg, #10b981 0%, #059669 100%)", 
                    color: "#fff", 
                    fontSize: "0.75rem", 
                    fontWeight: 800, 
                    padding: "0.3rem 0.8rem", 
                    borderRadius: "9999px",
                    boxShadow: "0 4px 12px rgba(16, 185, 129, 0.35), inset 0 1px 3px rgba(255, 255, 255, 0.6)",
                  }}
                >
                  {selectedRoute.badge}
                </span>
                <span style={{ fontSize: "0.85rem", color: "#6b7280", fontWeight: 700 }}>
                  {selectedRoute.type}
                </span>
              </div>

              <h4 style={{ fontSize: "1.55rem", fontWeight: 900, color: "#111827", marginBottom: "0.75rem" }}>
                {selectedRoute.name}
              </h4>

              <p style={{ color: "#4b5563", fontSize: "0.95rem", lineHeight: 1.6, marginBottom: "1.35rem" }}>
                {selectedRoute.description}
              </p>

              {/* 3D Clay Spec Cards */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.85rem", marginBottom: "1.5rem" }}>
                <div 
                  style={{ 
                    background: "#ffffff", 
                    padding: "0.7rem 1.15rem", 
                    borderRadius: "18px", 
                    border: "1px solid rgba(255, 255, 255, 0.95)",
                    boxShadow: "0 6px 16px rgba(15, 23, 42, 0.06), inset 0 2px 4px rgba(255, 255, 255, 0.98), inset 0 -2px 4px rgba(90, 49, 244, 0.04)",
                  }}
                >
                  <div style={{ fontSize: "0.72rem", color: "#6b7280", fontWeight: 700, textTransform: "uppercase" }}>Total Corridor</div>
                  <div style={{ fontSize: "1rem", fontWeight: 900, color: "#111827", marginTop: "2px" }}>{selectedRoute.distance}</div>
                </div>
                <div 
                  style={{ 
                    background: "#ffffff", 
                    padding: "0.7rem 1.15rem", 
                    borderRadius: "18px", 
                    border: "1px solid rgba(255, 255, 255, 0.95)",
                    boxShadow: "0 6px 16px rgba(15, 23, 42, 0.06), inset 0 2px 4px rgba(255, 255, 255, 0.98), inset 0 -2px 4px rgba(90, 49, 244, 0.04)",
                  }}
                >
                  <div style={{ fontSize: "0.72rem", color: "#6b7280", fontWeight: 700, textTransform: "uppercase" }}>Recommended Stay</div>
                  <div style={{ fontSize: "1rem", fontWeight: 900, color: "#111827", marginTop: "2px" }}>{selectedRoute.duration}</div>
                </div>
                <div 
                  style={{ 
                    background: "#ffffff", 
                    padding: "0.7rem 1.15rem", 
                    borderRadius: "18px", 
                    border: "1px solid rgba(255, 255, 255, 0.95)",
                    boxShadow: "0 6px 16px rgba(15, 23, 42, 0.06), inset 0 2px 4px rgba(255, 255, 255, 0.98), inset 0 -2px 4px rgba(90, 49, 244, 0.04)",
                  }}
                >
                  <div style={{ fontSize: "0.72rem", color: "#6b7280", fontWeight: 700, textTransform: "uppercase" }}>Flexible Hubs</div>
                  <div style={{ fontSize: "1rem", fontWeight: 900, color: "#5a31f4", marginTop: "2px" }}>Same-City or Drop</div>
                </div>
              </div>

              {/* Highlights Clay Pills */}
              <div style={{ display: "flex", gap: "0.65rem", flexWrap: "wrap" }}>
                {selectedRoute.highlights.map((hl) => (
                  <span 
                    key={hl}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "0.4rem",
                      fontSize: "0.85rem",
                      fontWeight: 700,
                      color: "#1f2937",
                      background: "linear-gradient(145deg, #ffffff 0%, #f5f2fe 100%)",
                      padding: "0.4rem 0.85rem",
                      borderRadius: "9999px",
                      border: "1px solid rgba(255, 255, 255, 0.95)",
                      boxShadow: "0 4px 10px rgba(90, 49, 244, 0.08), inset 0 1px 3px rgba(255, 255, 255, 0.95)",
                    }}
                  >
                    <CheckCircle2 size={14} color="#5a31f4" />
                    {hl}
                  </span>
                ))}
              </div>
            </div>

            {/* Route Waypoints 3D Clay Console */}
            <div 
              style={{ 
                background: "linear-gradient(145deg, #ffffff 0%, #faf9fe 100%)", 
                borderRadius: "22px", 
                padding: "1.75rem", 
                border: "1.5px solid rgba(255, 255, 255, 0.98)",
                boxShadow: 
                  "0 12px 28px rgba(15, 23, 42, 0.07), inset 0 2px 5px rgba(255, 255, 255, 0.98), inset 0 -2px 4px rgba(90, 49, 244, 0.03)",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1.25rem" }}>
                <Navigation size={17} color="#5a31f4" />
                <span style={{ fontSize: "0.85rem", fontWeight: 800, color: "#111827", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                  Route Corridors &amp; RV Pit-Stops
                </span>
              </div>

              <div style={{ position: "relative", paddingLeft: "1.85rem" }}>
                {/* Vertical Track Line */}
                <div 
                  style={{ 
                    position: "absolute", 
                    top: "12px", 
                    bottom: "12px", 
                    left: "8px", 
                    width: "3px", 
                    borderRadius: "3px",
                    background: "linear-gradient(180deg, #5a31f4 0%, #10b981 100%)",
                    boxShadow: "0 0 8px rgba(90, 49, 244, 0.4)",
                  }} 
                />

                {selectedRoute.stops.map((stop, index) => {
                  const isFirst = index === 0;
                  const isLast = index === selectedRoute.stops.length - 1;
                  return (
                    <div key={stop} style={{ position: "relative", marginBottom: isLast ? 0 : "1.35rem" }}>
                      <div 
                        style={{
                          position: "absolute",
                          left: "-1.85rem",
                          top: "2px",
                          width: "20px",
                          height: "20px",
                          borderRadius: "50%",
                          background: isFirst 
                            ? "linear-gradient(135deg, #7c3aed 0%, #5a31f4 100%)" 
                            : isLast 
                              ? "linear-gradient(135deg, #10b981 0%, #059669 100%)" 
                              : "#ffffff",
                          border: isFirst || isLast ? "2.5px solid #ffffff" : "2.5px solid #7c3aed",
                          boxShadow: isFirst || isLast 
                            ? "0 4px 10px rgba(90, 49, 244, 0.4), inset 0 1px 3px rgba(255, 255, 255, 0.8)" 
                            : "0 2px 6px rgba(15, 23, 42, 0.15)",
                        }}
                      />
                      <div style={{ fontWeight: 800, fontSize: "0.98rem", color: "#111827" }}>
                        {stop}
                      </div>
                      <div style={{ fontSize: "0.82rem", color: "#6b7280", marginTop: "2px" }}>
                        {isFirst ? "Host Departure Hub" : isLast ? "Drop-off Hub / Return Point" : "Verified Stay Q RV Pit-Stop & Resort Deck"}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Feature 2: Stay Q RV Recreational Points (The Resort Infrastructure) */}
        <div style={{ marginBottom: "4.5rem" }}>
          <div className="section-head section-head--center" style={{ maxWidth: "800px", margin: "0 auto 3rem auto" }}>
            <Reveal>
              <span 
                style={{ 
                  background: "linear-gradient(135deg, #ffffff 0%, #f0fdf4 100%)",
                  color: "#10b981", 
                  fontWeight: 800,
                  fontSize: "0.85rem",
                  padding: "0.5rem 1.25rem",
                  borderRadius: "9999px",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  border: "1px solid rgba(255, 255, 255, 0.95)",
                  boxShadow: "0 8px 20px rgba(16, 185, 129, 0.15), inset 0 2px 4px rgba(255, 255, 255, 0.98), inset 0 -2px 4px rgba(16, 185, 129, 0.08)",
                }}
              >
                <Building2 size={15} />
                National Hospitality Network
              </span>
            </Reveal>
            <Reveal delay={0.06}>
              <h3 className="h2" style={{ fontSize: "clamp(1.85rem, 3.2vw, 2.5rem)", marginTop: "0.65rem", fontWeight: 900 }}>
                Stay Q RV Recreational Points <span className="grad-text">(RV Pit-Stops)</span>
              </h3>
            </Reveal>
            <Reveal delay={0.12}>
              <p className="lead" style={{ fontSize: "1.05rem", color: "#4b5563" }}>
                You never travel alone. Partner hotels and luxury resorts along interstate corridors are verified as 
                official Stay Q RV Pit-Stops, offering campervans essential utilities, gourmet dining, and security.
              </p>
            </Reveal>
          </div>

          {/* 3D Clay Feature Cards */}
          <div 
            style={{ 
              display: "grid", 
              gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))", 
              gap: "1.5rem",
              marginBottom: "2.5rem" 
            }}
          >
            {PIT_STOP_FEATURES.map((feat) => {
              const IconComp = feat.icon;
              return (
                <div 
                  key={feat.title}
                  style={{
                    background: "linear-gradient(145deg, #ffffff 0%, #faf8fe 100%)",
                    borderRadius: "26px",
                    padding: "2rem 1.6rem",
                    border: "1.5px solid rgba(255, 255, 255, 0.95)",
                    boxShadow: 
                      "0 16px 36px rgba(15, 23, 42, 0.08), 0 4px 12px rgba(15, 23, 42, 0.03), inset 0 3px 6px rgba(255, 255, 255, 0.98), inset 0 -2px 4px rgba(90, 49, 244, 0.04)",
                    transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  <div 
                    style={{ 
                      width: "52px", 
                      height: "52px", 
                      borderRadius: "18px", 
                      background: `linear-gradient(135deg, ${feat.color}25 0%, ${feat.color}10 100%)`, 
                      display: "flex", 
                      alignItems: "center", 
                      justifyContent: "center",
                      marginBottom: "1.35rem",
                      boxShadow: `0 6px 16px ${feat.color}25, inset 0 2px 4px rgba(255, 255, 255, 0.8), inset 0 -2px 4px ${feat.color}30`,
                    }}
                  >
                    <IconComp size={25} color={feat.color} />
                  </div>
                  <h4 style={{ fontSize: "1.1rem", fontWeight: 800, color: "#111827", marginBottom: "0.5rem", lineHeight: 1.3 }}>
                    {feat.title}
                  </h4>
                  <p style={{ fontSize: "0.88rem", color: "#6b7280", lineHeight: 1.55 }}>
                    {feat.desc}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Resort Network Partner Card (Deep Clay Slab) */}
          <div 
            style={{
              background: "linear-gradient(145deg, #1e1248 0%, #2f1d69 100%)",
              borderRadius: "32px",
              padding: "clamp(1.75rem, 3vw, 2.5rem)",
              color: "#ffffff",
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "1.75rem",
              border: "1px solid rgba(255, 255, 255, 0.18)",
              boxShadow: 
                "0 28px 64px -10px rgba(31, 20, 66, 0.55), inset 0 2px 5px rgba(255, 255, 255, 0.25), inset 0 -4px 8px rgba(0, 0, 0, 0.4)",
            }}
          >
            <div style={{ maxWidth: "640px" }}>
              <span 
                style={{ 
                  background: "linear-gradient(135deg, rgba(255, 255, 255, 0.2) 0%, rgba(255, 255, 255, 0.08) 100%)", 
                  padding: "0.35rem 0.9rem", 
                  borderRadius: "9999px", 
                  fontSize: "0.75rem", 
                  fontWeight: 800,
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                  color: "#d8b4fe",
                  display: "inline-block",
                  marginBottom: "0.85rem",
                  boxShadow: "inset 0 1px 2px rgba(255, 255, 255, 0.4)",
                }}
              >
                For Hoteliers &amp; Resort Operators
              </span>
              <h4 style={{ fontSize: "clamp(1.4rem, 2.5vw, 1.75rem)", fontWeight: 900, marginBottom: "0.5rem" }}>
                Own a Hotel or Resort along a Travel Corridor?
              </h4>
              <p style={{ color: "#d1d5db", fontSize: "0.98rem", lineHeight: 1.55 }}>
                Register your property as a certified Stay Q RV Recreational Point. Monetize idle parking grounds, 
                attract high-spending overland tourists, and sell restaurant dining and amenities.
              </p>
            </div>

            {/* Clay Emerald Button */}
            <button
              onClick={handlePartnerWithUs}
              style={{
                background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                color: "#ffffff",
                fontWeight: 800,
                fontSize: "0.95rem",
                padding: "0.95rem 1.85rem",
                borderRadius: "9999px",
                border: "none",
                display: "inline-flex",
                alignItems: "center",
                gap: "0.6rem",
                cursor: "pointer",
                boxShadow: 
                  "0 12px 28px rgba(16, 185, 129, 0.45), 0 3px 8px rgba(15, 23, 42, 0.15), inset 0 3px 6px rgba(255, 255, 255, 0.65), inset 0 -3px 6px rgba(0, 0, 0, 0.25)",
                transition: "all 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
              }}
            >
              <PhoneCall size={18} />
              Register Resort as RV Pit-Stop
            </button>
          </div>
        </div>

        {/* Feature 3: Transparent Daily Kilometer Packages (3D Clay Cards) */}
        <div 
          style={{
            background: "linear-gradient(145deg, #ffffff 0%, #f9f8ff 100%)",
            borderRadius: "32px",
            border: "1.5px solid rgba(255, 255, 255, 0.95)",
            padding: "clamp(1.75rem, 3.5vw, 2.75rem)",
            marginBottom: "4rem",
            boxShadow: 
              "0 24px 50px -10px rgba(90, 49, 244, 0.1), 0 6px 18px rgba(15, 23, 42, 0.04), inset 0 3px 6px rgba(255, 255, 255, 0.98), inset 0 -2px 6px rgba(90, 49, 244, 0.04)",
          }}
        >
          <div style={{ textAlign: "center", maxWidth: "700px", margin: "0 auto 2.75rem auto" }}>
            <span 
              style={{ 
                fontSize: "0.8rem", 
                fontWeight: 800, 
                textTransform: "uppercase", 
                color: "#5a31f4", 
                letterSpacing: "0.08em",
                background: "rgba(90, 49, 244, 0.08)",
                padding: "0.3rem 0.8rem",
                borderRadius: "9999px",
                display: "inline-block",
                boxShadow: "inset 0 1px 3px rgba(255, 255, 255, 0.9)",
              }}
            >
              Predictable Pricing
            </span>
            <h3 style={{ fontSize: "clamp(1.6rem, 2.75vw, 2rem)", fontWeight: 900, marginTop: "0.5rem", color: "#111827" }}>
              Per-Day Kilometer Allowance Packages
            </h3>
            <p style={{ color: "#4b5563", fontSize: "0.95rem", marginTop: "0.5rem" }}>
              Every RV listing displays explicit daily kilometer quotas. Choose the package that suits your travel itinerary with transparent overage terms.
            </p>
          </div>

          <div 
            style={{ 
              display: "grid", 
              gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", 
              gap: "1.35rem" 
            }}
          >
            {KM_PACKAGES.map((pkg) => {
              const isSelected = activeKm === pkg.km;
              return (
                <div
                  key={pkg.km}
                  onClick={() => setActiveKm(pkg.km)}
                  style={{
                    borderRadius: "26px",
                    padding: "2rem 1.6rem",
                    cursor: "pointer",
                    transition: "all 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
                    border: isSelected ? "2px solid #5a31f4" : "1.5px solid rgba(255, 255, 255, 0.95)",
                    background: isSelected 
                      ? "linear-gradient(145deg, #fbfaff 0%, #f1eaff 100%)" 
                      : "linear-gradient(145deg, #ffffff 0%, #f9f8fe 100%)",
                    boxShadow: isSelected 
                      ? "0 20px 44px rgba(90, 49, 244, 0.22), 0 6px 16px rgba(90, 49, 244, 0.1), inset 0 3px 6px rgba(255, 255, 255, 0.98), inset 0 -2px 5px rgba(90, 49, 244, 0.1)" 
                      : "0 12px 30px rgba(15, 23, 42, 0.06), 0 3px 10px rgba(15, 23, 42, 0.03), inset 0 3px 6px rgba(255, 255, 255, 0.98), inset 0 -2px 4px rgba(90, 49, 244, 0.04)",
                    position: "relative",
                    transform: isSelected ? "translateY(-4px)" : "none",
                  }}
                >
                  {pkg.recommended && (
                    <span 
                      style={{
                        position: "absolute",
                        top: "-12px",
                        right: "18px",
                        background: "linear-gradient(135deg, #7c3aed 0%, #5a31f4 100%)",
                        color: "#fff",
                        fontSize: "0.72rem",
                        fontWeight: 800,
                        padding: "0.25rem 0.75rem",
                        borderRadius: "9999px",
                        boxShadow: "0 6px 14px rgba(90, 49, 244, 0.35), inset 0 1px 3px rgba(255, 255, 255, 0.6)",
                      }}
                    >
                      POPULAR
                    </span>
                  )}

                  <div style={{ fontSize: "0.85rem", fontWeight: 800, color: isSelected ? "#5a31f4" : "#6b7280", textTransform: "uppercase" }}>
                    {pkg.tier}
                  </div>
                  <div style={{ fontSize: "1.65rem", fontWeight: 900, color: "#111827", margin: "0.5rem 0" }}>
                    {pkg.km}
                  </div>
                  <div style={{ fontSize: "0.88rem", color: "#4b5563", minHeight: "44px", lineHeight: 1.45 }}>
                    {pkg.tagline}
                  </div>

                  <div style={{ margin: "1.25rem 0", borderTop: "1px dashed rgba(90, 49, 244, 0.15)", paddingTop: "0.85rem" }}>
                    <div style={{ fontSize: "0.75rem", color: "#9ca3af", fontWeight: 700 }}>Overage Surcharge:</div>
                    <div style={{ fontSize: "0.95rem", fontWeight: 800, color: "#111827", marginTop: "2px" }}>{pkg.extra}</div>
                  </div>

                  <p style={{ fontSize: "0.82rem", color: "#6b7280", margin: 0 }}>
                    {pkg.idealFor}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Action Banner (Inflated 3D Purple Clay Feature) */}
        <div 
          style={{
            background: "linear-gradient(145deg, #632df5 0%, #4a21d4 100%)",
            borderRadius: "36px",
            padding: "clamp(2rem, 4vw, 3.5rem) clamp(1.5rem, 3vw, 2.5rem)",
            color: "#ffffff",
            textAlign: "center",
            border: "1.5px solid rgba(255, 255, 255, 0.25)",
            boxShadow: 
              "0 28px 64px rgba(90, 49, 244, 0.38), 0 10px 24px rgba(15, 23, 42, 0.15), inset 0 3px 6px rgba(255, 255, 255, 0.5), inset 0 -4px 8px rgba(0, 0, 0, 0.3)",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div style={{ maxWidth: "680px", margin: "0 auto", position: "relative", zIndex: 1 }}>
            <h3 style={{ fontSize: "clamp(1.85rem, 3.8vw, 2.75rem)", fontWeight: 900, marginBottom: "0.85rem", lineHeight: 1.2 }}>
              Ready to Hit the Highway?
            </h3>
            <p style={{ color: "rgba(255,255,255,0.92)", fontSize: "1.1rem", marginBottom: "2.25rem", lineHeight: 1.55 }}>
              Explore luxury motorhomes, 4x4 overland campervans, and caravan stays. Verified hosts, 
              secure recreational pit-stops, and 24x7 highway roadside assistance.
            </p>

            <div style={{ display: "flex", justifyContent: "center", gap: "1.25rem", flexWrap: "wrap" }}>
              {/* White Glossy 3D Clay Button */}
              <a
                href="#/stays"
                onClick={handleExploreRvs}
                style={{
                  background: "#ffffff",
                  color: "#5a31f4",
                  fontWeight: 900,
                  fontSize: "1.05rem",
                  padding: "1rem 2.25rem",
                  borderRadius: "9999px",
                  border: "1px solid rgba(255, 255, 255, 0.95)",
                  boxShadow: 
                    "0 14px 32px rgba(0, 0, 0, 0.22), 0 4px 10px rgba(15, 23, 42, 0.08), inset 0 3px 6px rgba(255, 255, 255, 1), inset 0 -2px 5px rgba(90, 49, 244, 0.18)",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.6rem",
                  transition: "all 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
                  textDecoration: "none",
                  cursor: "pointer",
                }}
              >
                <Car size={20} />
                Explore Campervans &amp; RV Stays
                <ArrowRight size={17} />
              </a>

              {/* Translucent Frosted Glass/Clay Button */}
              <button
                onClick={handlePartnerWithUs}
                style={{
                  background: "linear-gradient(135deg, rgba(255, 255, 255, 0.22) 0%, rgba(255, 255, 255, 0.1) 100%)",
                  color: "#ffffff",
                  border: "1px solid rgba(255, 255, 255, 0.35)",
                  backdropFilter: "blur(14px)",
                  fontWeight: 800,
                  fontSize: "1.05rem",
                  padding: "1rem 2rem",
                  borderRadius: "9999px",
                  boxShadow: 
                    "0 12px 28px rgba(0, 0, 0, 0.18), inset 0 2px 4px rgba(255, 255, 255, 0.5), inset 0 -2px 4px rgba(0, 0, 0, 0.2)",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.6rem",
                  cursor: "pointer",
                  transition: "all 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
                }}
              >
                <Building2 size={19} />
                Register Resort as an RV Pit-Stop
              </button>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
