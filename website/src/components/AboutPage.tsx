"use client";

import React, { useState } from "react";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import {
  Sparkles,
  ShieldCheck,
  Compass,
  ArrowRight,
  ArrowUpRight,
  CheckCircle2,
  Home,
  Key,
  Truck,
  Tent,
  Users,
  MapPin,
  Zap,
  Star,
  Globe,
  Award,
  Heart,
  ChevronRight,
} from "lucide-react";
import { navigateTo } from "../utils/navigation";

// Animation Variants
const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 35 },
  visible: (custom: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, delay: custom * 0.12, ease: "easeOut" as const },
  }),
};

const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.14, delayChildren: 0.1 },
  },
};

const pulseGlow: Variants = {
  animate: {
    scale: [1, 1.08, 1],
    opacity: [0.35, 0.6, 0.35],
    transition: { duration: 7, repeat: Infinity, ease: "easeInOut" as const },
  },
};

const VERTICALS = [
  {
    id: "homestays",
    badge: "Curated Luxury",
    icon: Home,
    title: "Homestays & Villas",
    tagline: "Private Pool Estates & Mountain Glass Cabins",
    color: "#5A31F4",
    bgGradient: "linear-gradient(135deg, rgba(90, 49, 244, 0.08) 0%, rgba(139, 92, 246, 0.03) 100%)",
    image: "/images/indian_villa_wide_8k.jpg",
    features: [
      "100% verified on-ground host inspection",
      "Private pool villas, heritage havelis & pine forest cabins",
      "Direct host booking with zero hidden convenience fees",
    ],
    ctaText: "Explore Villas",
    route: "/stays",
  },
  {
    id: "zero-broker",
    badge: "0% Brokerage",
    icon: Key,
    title: "11-Month Home Rentals",
    tagline: "Direct Owner Connect & Digital Agreements",
    color: "#10B981",
    bgGradient: "linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(52, 211, 153, 0.03) 100%)",
    image: "/images/real_hero.jpg",
    features: [
      "Zero brokerage fees for tenants forever",
      "Direct chat & video tours with verified owners",
      "Legally vetted 11-month digital rental lease contracts",
    ],
    ctaText: "Explore Zero Broker",
    route: "/zero-broker",
  },
  {
    id: "rvs",
    badge: "Overlanding India",
    icon: Truck,
    title: "4x4 Caravans & RVs",
    tagline: "Self-Drive Overland Expeditions Across the Himalayas",
    color: "#F59E0B",
    bgGradient: "linear-gradient(135deg, rgba(245, 158, 11, 0.08) 0%, rgba(251, 191, 36, 0.03) 100%)",
    image: "/images/campervan_wide_8k.jpg",
    features: [
      "Expedition-grade 4x4 campervans with pop-up tents & kitchenettes",
      "Verified routes across Ladakh, Spiti, Himachal & Kerala",
      "Complete 24/7 off-grid roadside assistance & camp gear",
    ],
    ctaText: "Explore Caravans",
    route: "/rvs",
  },
  {
    id: "camps",
    badge: "Alpine Glamping",
    icon: Tent,
    title: "Camps & Geodesic Domes",
    tagline: "High-Altitude Stargazing & Riverside Campsites",
    color: "#06B6D4",
    bgGradient: "linear-gradient(135deg, rgba(6, 182, 212, 0.08) 0%, rgba(34, 211, 238, 0.03) 100%)",
    image: "/images/kedarnath_camp_wide_8k.jpg",
    features: [
      "Heated all-weather panoramic glass domes at 11,500 ft",
      "Verified campsites with clean sanitation, campfires & safety",
      "Stargazing gear, sunrise yoga & guided valley treks",
    ],
    ctaText: "Explore Camps",
    route: "/camping",
  },
];

const METRICS = [
  { val: "1,420+", lbl: "Verified Stays Across India", sub: "Handpicked & Inspected" },
  { val: "0%", lbl: "Brokerage on Long-Term Homes", sub: "Zero Middlemen Forever" },
  { val: "28+", lbl: "States & Himalayan Routes", sub: "From Ladakh to Kerala" },
  { val: "4.98 ★", lbl: "Verified Guest Rating", sub: "Based on 1,400+ Stays" },
];

const TIMELINE = [
  {
    year: "The Problem",
    title: "The Broken Indian Rental & Stays Market",
    desc: "Inflated broker commissions, misleading photos, chaotic fragmented campervan operators, and lack of verified experiential stays.",
    icon: Zap,
    color: "#EF4444",
  },
  {
    year: "The Innovation",
    title: "Stay Q by Quatalyst Technologies",
    desc: "A singular, unified hospitality ecosystem connecting direct owners, 4x4 RVs, alpine domes, and long-term rentals with 0% brokerage.",
    icon: Sparkles,
    color: "#5A31F4",
  },
  {
    year: "The Experience",
    title: "3D Digital Immersion & Qube AI",
    desc: "Every villa and caravan comes with high-resolution 3D walkthroughs and intelligent route planning, ensuring zero surprises.",
    icon: Compass,
    color: "#10B981",
  },
];

export function AboutPage() {
  const [activeTab, setActiveTab] = useState<string>("homestays");
  const selectedVertical = VERTICALS.find((v) => v.id === activeTab) || VERTICALS[0];

  return (
    <div className="about-animated-root" style={{ background: "#0B0F19", color: "#F8FAFC", overflow: "hidden" }}>
      {/* ================= HERO SECTION WITH ANIMATED AURORA ================= */}
      <section className="about-hero rel" style={{ minHeight: "82vh", display: "flex", alignItems: "center", padding: "8rem 1.5rem 4rem" }}>
        {/* Animated Background Glow Orbs */}
        <motion.div
          variants={pulseGlow}
          animate="animate"
          style={{
            position: "absolute",
            top: "10%",
            left: "15%",
            width: "500px",
            height: "500px",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(90, 49, 244, 0.35) 0%, rgba(90, 49, 244, 0) 70%)",
            filter: "blur(60px)",
            pointerEvents: "none",
            zIndex: 1,
          }}
        />
        <motion.div
          variants={pulseGlow}
          animate="animate"
          style={{
            position: "absolute",
            bottom: "10%",
            right: "10%",
            width: "550px",
            height: "550px",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(16, 185, 129, 0.25) 0%, rgba(16, 185, 129, 0) 70%)",
            filter: "blur(80px)",
            pointerEvents: "none",
            zIndex: 1,
          }}
        />

        <div className="shell rel" style={{ zIndex: 2, maxWidth: "1140px", margin: "0 auto", textAlign: "center" }}>
          {/* Top Pill */}
          <motion.div
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", padding: "0.45rem 1.1rem", borderRadius: "9999px", background: "rgba(255, 255, 255, 0.08)", border: "1px solid rgba(255, 255, 255, 0.2)", backdropFilter: "blur(14px)", marginBottom: "1.75rem" }}
          >
            <Sparkles size={15} color="#A78BFA" />
            <span style={{ fontSize: "0.78rem", fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase", color: "#E2E8F0" }}>
              Quatalyst Private Limited Presents
            </span>
          </motion.div>

          {/* Main Display Heading */}
          <motion.h1
            variants={fadeInUp}
            initial="hidden"
            animate="visible"
            custom={1}
            style={{
              fontSize: "clamp(2.5rem, 5.8vw, 4.8rem)",
              fontWeight: 900,
              lineHeight: 1.08,
              letterSpacing: "-0.035em",
              marginBottom: "1.5rem",
              background: "linear-gradient(135deg, #FFFFFF 0%, #E2E8F0 50%, #94A3B8 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            More Than A Place To Stay. <br />
            <span
              style={{
                background: "linear-gradient(135deg, #A78BFA 0%, #C084FC 45%, #38BDF8 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              It’s Where Uncharted India Begins.
            </span>
          </motion.h1>

          <motion.p
            variants={fadeInUp}
            initial="hidden"
            animate="visible"
            custom={2}
            style={{
              fontSize: "clamp(1rem, 2vw, 1.25rem)",
              color: "#94A3B8",
              maxWidth: "760px",
              margin: "0 auto 2.5rem",
              lineHeight: 1.65,
            }}
          >
            Stay Q was engineered by <strong>Quatalyst Private Limited</strong> to reinvent Indian travel and long-stay living: combining 0% brokerage residences, private pool heritage villas, 4x4 expedition campervans, and heated alpine glamping in one seamless ecosystem.
          </motion.p>

          {/* Action CTAs */}
          <motion.div
            variants={fadeInUp}
            initial="hidden"
            animate="visible"
            custom={3}
            style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "1rem", flexWrap: "wrap" }}
          >
            <button
              type="button"
              onClick={(e) => navigateTo("/stays", e)}
              className="btn btn--primary"
              style={{
                padding: "0.85rem 2rem",
                borderRadius: "9999px",
                fontSize: "0.92rem",
                fontWeight: 800,
                boxShadow: "0 10px 30px rgba(90, 49, 244, 0.45)",
                display: "inline-flex",
                alignItems: "center",
                gap: "0.5rem",
              }}
            >
              <span>Explore Stays &amp; Caravans</span>
              <ArrowRight size={17} />
            </button>
            <button
              type="button"
              onClick={(e) => navigateTo("/host-invite", e)}
              className="btn btn--ghost"
              style={{
                padding: "0.85rem 1.8rem",
                borderRadius: "9999px",
                fontSize: "0.92rem",
                fontWeight: 750,
                background: "rgba(255, 255, 255, 0.06)",
                border: "1px solid rgba(255, 255, 255, 0.2)",
                color: "#FFFFFF",
              }}
            >
              <span>Become a Partner Host</span>
            </button>
          </motion.div>
        </div>
      </section>

      {/* ================= ANIMATED METRICS COUNTERS ================= */}
      <section style={{ borderTop: "1px solid rgba(255, 255, 255, 0.08)", borderBottom: "1px solid rgba(255, 255, 255, 0.08)", background: "rgba(15, 23, 42, 0.5)", padding: "3rem 1.5rem" }}>
        <div className="shell" style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-10%" }}
            style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "2rem", textAlign: "center" }}
          >
            {METRICS.map((m, idx) => (
              <motion.div
                key={m.lbl}
                variants={fadeInUp}
                custom={idx}
                style={{
                  padding: "1.5rem 1rem",
                  borderRadius: "20px",
                  background: "rgba(255, 255, 255, 0.03)",
                  border: "1px solid rgba(255, 255, 255, 0.08)",
                  boxShadow: "0 8px 24px rgba(0, 0, 0, 0.2)",
                }}
              >
                <div style={{ fontSize: "2.5rem", fontWeight: 900, color: "#FFFFFF", letterSpacing: "-0.02em", marginBottom: "0.35rem" }}>
                  <span style={{ background: "linear-gradient(135deg, #A78BFA 0%, #38BDF8 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                    {m.val}
                  </span>
                </div>
                <div style={{ fontSize: "0.95rem", fontWeight: 800, color: "#F1F5F9", marginBottom: "0.25rem" }}>{m.lbl}</div>
                <div style={{ fontSize: "0.78rem", color: "#94A3B8" }}>{m.sub}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ================= INTERACTIVE 4-VERTICAL SHOWCASE ================= */}
      <section style={{ padding: "6rem 1.5rem 5rem", position: "relative" }}>
        <div className="shell" style={{ maxWidth: "1180px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", maxWidth: "680px", margin: "0 auto 3.5rem" }}>
            <motion.span
              variants={fadeInUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              style={{ fontSize: "0.8rem", fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase", color: "#A78BFA", display: "inline-block", marginBottom: "0.5rem" }}
            >
              The Stay Q Ecosystem
            </motion.span>
            <motion.h2
              variants={fadeInUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              custom={1}
              style={{ fontSize: "clamp(2rem, 3.8vw, 2.85rem)", fontWeight: 900, color: "#FFFFFF", letterSpacing: "-0.03em" }}
            >
              4 Ways We Power Modern Indian Travel
            </motion.h2>
          </div>

          {/* Interactive Tabs */}
          <div style={{ display: "flex", justifyContent: "center", gap: "0.75rem", flexWrap: "wrap", marginBottom: "3rem" }}>
            {VERTICALS.map((v) => {
              const Icon = v.icon;
              const isActive = activeTab === v.id;
              return (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => setActiveTab(v.id)}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    padding: "0.65rem 1.35rem",
                    borderRadius: "9999px",
                    background: isActive ? "linear-gradient(135deg, #6D28D9 0%, #5A31F4 100%)" : "rgba(255, 255, 255, 0.05)",
                    color: isActive ? "#FFFFFF" : "#CBD5E1",
                    border: isActive ? "1px solid rgba(255, 255, 255, 0.4)" : "1px solid rgba(255, 255, 255, 0.12)",
                    fontSize: "0.86rem",
                    fontWeight: 750,
                    cursor: "pointer",
                    boxShadow: isActive ? "0 8px 24px rgba(90, 49, 244, 0.45)" : "none",
                    transition: "all 0.25s ease",
                  }}
                >
                  <Icon size={16} style={{ color: isActive ? "#FFFFFF" : v.color }} />
                  <span>{v.title}</span>
                </button>
              );
            })}
          </div>

          {/* Animated Active Card Showcase */}
          <AnimatePresence mode="wait">
            <motion.div
              key={selectedVertical.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
              style={{
                background: "rgba(30, 41, 59, 0.5)",
                border: "1px solid rgba(255, 255, 255, 0.12)",
                backdropFilter: "blur(20px)",
                borderRadius: "32px",
                overflow: "hidden",
                boxShadow: "0 24px 60px rgba(0, 0, 0, 0.4)",
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
                alignItems: "center",
              }}
            >
              {/* Left Details */}
              <div style={{ padding: "clamp(2rem, 4vw, 3.5rem)" }}>
                <div style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", padding: "0.35rem 0.85rem", borderRadius: "9999px", background: "rgba(255, 255, 255, 0.08)", color: selectedVertical.color, fontSize: "0.74rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "1.25rem" }}>
                  <Sparkles size={12} />
                  <span>{selectedVertical.badge}</span>
                </div>
                <h3 style={{ fontSize: "clamp(1.75rem, 3vw, 2.3rem)", fontWeight: 900, color: "#FFFFFF", marginBottom: "0.6rem", letterSpacing: "-0.02em" }}>
                  {selectedVertical.title}
                </h3>
                <p style={{ fontSize: "1.05rem", color: "#94A3B8", lineHeight: 1.6, marginBottom: "1.75rem" }}>
                  {selectedVertical.tagline}
                </p>

                <ul style={{ display: "flex", flexDirection: "column", gap: "0.85rem", marginBottom: "2.25rem" }}>
                  {selectedVertical.features.map((feat) => (
                    <li key={feat} style={{ display: "flex", alignItems: "flex-start", gap: "0.65rem", fontSize: "0.92rem", color: "#E2E8F0" }}>
                      <CheckCircle2 size={18} style={{ color: selectedVertical.color, flexShrink: 0, marginTop: "2px" }} />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>

                <button
                  type="button"
                  onClick={(e) => navigateTo(selectedVertical.route, e)}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    padding: "0.85rem 1.8rem",
                    borderRadius: "9999px",
                    background: "linear-gradient(135deg, #7C3AED 0%, #5A31F4 100%)",
                    color: "#FFFFFF",
                    fontSize: "0.9rem",
                    fontWeight: 800,
                    border: "none",
                    cursor: "pointer",
                    boxShadow: "0 8px 24px rgba(90, 49, 244, 0.4)",
                  }}
                >
                  <span>{selectedVertical.ctaText}</span>
                  <ArrowRight size={16} />
                </button>
              </div>

              {/* Right Image Showcase */}
              <div style={{ position: "relative", height: "100%", minHeight: "360px", overflow: "hidden" }}>
                <img
                  src={selectedVertical.image}
                  alt={selectedVertical.title}
                  style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center" }}
                />
                <div style={{ position: "absolute", inset: 0, background: "linear-gradient(90deg, rgba(30, 41, 59, 0.8) 0%, transparent 60%)" }} />
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </section>

      {/* ================= THE JOURNEY TIMELINE ================= */}
      <section style={{ padding: "4rem 1.5rem 6rem", background: "rgba(15, 23, 42, 0.6)", borderTop: "1px solid rgba(255, 255, 255, 0.08)" }}>
        <div className="shell" style={{ maxWidth: "960px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", maxWidth: "600px", margin: "0 auto 3.5rem" }}>
            <span style={{ fontSize: "0.8rem", fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase", color: "#A78BFA" }}>
              Our Story &amp; Origin
            </span>
            <h2 style={{ fontSize: "clamp(1.9rem, 3.2vw, 2.5rem)", fontWeight: 900, color: "#FFFFFF", marginTop: "0.4rem" }}>
              How Stay Q Was Born
            </h2>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "2rem", position: "relative" }}>
            {TIMELINE.map((item, idx) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={item.year}
                  variants={fadeInUp}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  custom={idx}
                  style={{
                    display: "flex",
                    gap: "1.5rem",
                    alignItems: "flex-start",
                    background: "rgba(255, 255, 255, 0.03)",
                    border: "1px solid rgba(255, 255, 255, 0.08)",
                    borderRadius: "24px",
                    padding: "1.75rem 2rem",
                    boxShadow: "0 8px 24px rgba(0, 0, 0, 0.25)",
                  }}
                >
                  <div
                    style={{
                      width: "48px",
                      height: "48px",
                      borderRadius: "16px",
                      background: `rgba(255, 255, 255, 0.06)`,
                      border: `1px solid ${item.color}`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: item.color,
                      flexShrink: 0,
                    }}
                  >
                    <Icon size={22} />
                  </div>
                  <div>
                    <span style={{ fontSize: "0.75rem", fontWeight: 850, letterSpacing: "0.08em", color: item.color, textTransform: "uppercase" }}>
                      {item.year}
                    </span>
                    <h4 style={{ fontSize: "1.25rem", fontWeight: 850, color: "#FFFFFF", margin: "0.3rem 0 0.5rem" }}>
                      {item.title}
                    </h4>
                    <p style={{ fontSize: "0.92rem", color: "#94A3B8", lineHeight: 1.65, margin: 0 }}>
                      {item.desc}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ================= FINAL CORPORATE & TRUST BANNER ================= */}
      <section style={{ padding: "0 1.5rem 6rem" }}>
        <div className="shell" style={{ maxWidth: "1080px", margin: "0 auto" }}>
          <motion.div
            variants={fadeInUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            style={{
              background: "linear-gradient(135deg, #1E1B4B 0%, #0F172A 60%, #1E1B4B 100%)",
              border: "1px solid rgba(139, 92, 246, 0.3)",
              borderRadius: "32px",
              padding: "clamp(2.5rem, 5vw, 4rem) 2rem",
              textAlign: "center",
              boxShadow: "0 24px 60px rgba(0, 0, 0, 0.4)",
              position: "relative",
              overflow: "hidden",
            }}
          >
            <div style={{ position: "relative", zIndex: 2 }}>
              <span style={{ fontSize: "0.8rem", fontWeight: 850, letterSpacing: "0.14em", textTransform: "uppercase", color: "#C084FC" }}>
                Stay • Rent • Explore • Adventure
              </span>
              <h2 style={{ fontSize: "clamp(2rem, 4vw, 3rem)", fontWeight: 900, color: "#FFFFFF", margin: "0.75rem 0 1rem", letterSpacing: "-0.03em" }}>
                Ready to Experience India Differently?
              </h2>
              <p style={{ fontSize: "1.05rem", color: "#CBD5E1", maxWidth: "620px", margin: "0 auto 2.25rem", lineHeight: 1.65 }}>
                Join thousands of verified travelers and homeowners on Stay Q. Zero brokerage, verified hosts, and 3D virtual tour expeditions.
              </p>

              <div style={{ display: "inline-flex", gap: "1rem", flexWrap: "wrap", justifyContent: "center" }}>
                <button
                  type="button"
                  onClick={(e) => navigateTo("/stays", e)}
                  style={{
                    padding: "0.85rem 2.2rem",
                    borderRadius: "9999px",
                    background: "linear-gradient(135deg, #7C3AED 0%, #5A31F4 100%)",
                    color: "#FFFFFF",
                    fontSize: "0.92rem",
                    fontWeight: 800,
                    border: "none",
                    cursor: "pointer",
                    boxShadow: "0 8px 24px rgba(90, 49, 244, 0.45)",
                  }}
                >
                  Start Exploring Stays
                </button>
                <button
                  type="button"
                  onClick={(e) => navigateTo("/", e)}
                  style={{
                    padding: "0.85rem 1.8rem",
                    borderRadius: "9999px",
                    background: "rgba(255, 255, 255, 0.08)",
                    border: "1px solid rgba(255, 255, 255, 0.25)",
                    color: "#FFFFFF",
                    fontSize: "0.92rem",
                    fontWeight: 750,
                    cursor: "pointer",
                  }}
                >
                  Back to Home
                </button>
              </div>

              {/* Official Communication Desks */}
              <div
                style={{
                  marginTop: "2.5rem",
                  paddingTop: "1.75rem",
                  borderTop: "1px solid rgba(255, 255, 255, 0.12)",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: "1.5rem",
                  fontSize: "0.82rem",
                  color: "#94A3B8",
                }}
              >
                <span>
                  👋 Partnerships: <a href="mailto:hello@stayq.space" style={{ color: "#FBBF24", fontWeight: 700, textDecoration: "none" }}>hello@stayq.space</a>
                </span>
                <span>
                  🛎️ Customer Support: <a href="mailto:support@stayq.space" style={{ color: "#A78BFA", fontWeight: 700, textDecoration: "none" }}>support@stayq.space</a>
                </span>
                <span>
                  💬 WhatsApp Support: <a href="https://wa.me/919225270718?text=Hi%20Stay%20Q%20Support" target="_blank" rel="noopener noreferrer" style={{ color: "#22C55E", fontWeight: 700, textDecoration: "none" }}>+91 9225270718</a>
                </span>
                <span>
                  ⚖️ Grievances: <a href="mailto:grievance@stayq.space" style={{ color: "#34D399", fontWeight: 700, textDecoration: "none" }}>grievance@stayq.space</a>
                </span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
