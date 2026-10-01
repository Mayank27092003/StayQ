"use client";

import { navigateTo } from '../utils/navigation';
import { useEffect, useState, useCallback } from "react";
import { Sparkles, ArrowUpRight, Menu, X, User, Heart, Calendar, LogOut, Award } from "lucide-react";
import { useApp } from "../context/AppContext";

function isDarkHeroRoute(): boolean {
  if (typeof window === "undefined") return true;
  const path = (window.location.pathname || "/").split("?")[0].replace(/\/+$/, "") || "/";
  const hash = (window.location.hash || "").replace(/^#/, "");

  // If on /about: About page has a dark obsidian aurora hero (#0B0F19)
  if (path === "/about") return true;

  // If on Home page:
  if (path === "/" || path === "") {
    // If hash points to a light-background section below the hero, navbar must be solid!
    const lightSectionHashes = [
      "stays-catalog",
      "zero-broker",
      "adventure",
      "testimonials",
      "download",
      "features",
      "host",
    ];
    if (lightSectionHashes.includes(hash)) {
      return false; // Force solid white frosted navbar!
    }
    return true; // Home hero is dark
  }

  // ALL other pages (/contact, /stays, /zero-broker, /terms, /privacy, /refund, etc.) have light backgrounds!
  return false;
}

export function Nav() {
  const {
    wishlistIds,
    bookings,
    user,
    logoutUser,
    setIsAuthModalOpen,
    setIsHostAppModalOpen,
    setIsQubeOpen,
    setIsSupportOpen,
    setIsRewardsModalOpen,
  } = useApp();

  const [solid, setSolid] = useState(false);
  const [open, setOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const updateNavState = useCallback(() => {
    const isDark = isDarkHeroRoute();
    if (!isDark) {
      // Pages/sections with light backgrounds: ALWAYS solid frosted white
      setSolid(true);
    } else {
      // Dark hero page (home top or about top): transparent when scrollY <= 20, solid when scrollY > 20
      setSolid(window.scrollY > 20);
    }
  }, []);

  useEffect(() => {
    updateNavState();
    window.addEventListener("scroll", updateNavState, { passive: true });
    window.addEventListener("popstate", updateNavState);
    window.addEventListener("hashchange", updateNavState);
    return () => {
      window.removeEventListener("scroll", updateNavState);
      window.removeEventListener("popstate", updateNavState);
      window.removeEventListener("hashchange", updateNavState);
    };
  }, [updateNavState]);

  const navigateToSection = (e: React.MouseEvent, sectionId: string) => {
    e.preventDefault();
    setOpen(false);
    setSolid(true); // Preemptively set to solid so there is never a flash of white text!
    navigateTo(`#${sectionId}`, e);
  };

  const handlePageNavigation = (e: React.MouseEvent, path: string) => {
    e.preventDefault();
    setOpen(false);
    if (path !== "/about" && path !== "/") {
      setSolid(true);
    }
    navigateTo(path, e);
  };

  return (
    <header className={`nav ${solid ? "nav--solid" : "nav--transparent"}`} data-nav-solid={solid ? "true" : "false"}>
      <div className="shell">
        <div className="nav__inner">
          {/* Top Left: Logo & Brand (Matching Reference) */}
          <a
            className="nav__brand"
            href="/"
            onClick={(e) => {
              e.preventDefault();
              navigateTo("/", e);
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            aria-label="Stay Q Home"
          >
            <img
              src="/images/logo_icon.png"
              alt="Stay Q Logo"
              className="nav__brand-logo"
            />
            <div className="nav__brand-title-wrap">
              <span className="nav__brand-title">Stay Q</span>
            </div>
          </a>

          {/* Center Navigation Links (Matching HOTELS · ABOUT US · CONTACT in Reference) */}
          <nav className="nav__links" aria-label="Main Navigation">
            <a
              className="nav__link"
              href="#stays-catalog"
              onClick={(e) => navigateToSection(e, "stays-catalog")}
            >
              HOTELS &amp; STAYS
            </a>
            <a
              className="nav__link"
              href="#adventure"
              onClick={(e) => navigateToSection(e, "adventure")}
            >
              CARAVANS &amp; RVS
            </a>
            <a
              className="nav__link"
              href="#zero-broker"
              onClick={(e) => navigateToSection(e, "zero-broker")}
            >
              ZERO BROKER
            </a>
            <a
              className="nav__link"
              href="/about"
              onClick={(e) => handlePageNavigation(e, "/about")}
            >
              ABOUT US
            </a>
            <a
              className="nav__link"
              href="/contact"
              onClick={(e) => handlePageNavigation(e, "/contact")}
            >
              CONTACT
            </a>
          </nav>

          {/* Right Header Action: Sexy 3D Claymorphic Buttons */}
          <div className="nav__cta">
            <button
              type="button"
              className="nav__contact-btn"
              onClick={() => setIsSupportOpen(true)}
              aria-label="Get in touch"
            >
              <Sparkles size={14} className="nav__btn-icon" />
              <span>GET IN TOUCH</span>
            </button>

            {user ? (
              <div className="relative">
                <button
                  type="button"
                  className="nav__user-avatar-btn"
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  aria-label="User profile menu"
                >
                  <img
                    src={user.avatarUrl || "/images/avatar_rohan.jpg"}
                    alt={user.name || "User"}
                    className="nav__avatar-img"
                  />
                </button>

                {showUserMenu && (
                  <>
                    <div
                      className="nav__user-backdrop"
                      onClick={() => setShowUserMenu(false)}
                    />
                    <div className="nav__user-popover">
                      <div className="nav__popover-header">
                        <strong>{user.name || user.email || "Guest Traveler"}</strong>
                        <span>{user.email || user.phone || "+91 Verified User"}</span>
                      </div>
                      <div className="nav__popover-divider" />
                      <a href="/trips" className="nav__popover-item" onClick={() => setShowUserMenu(false)}>
                        <Calendar size={15} /> My Bookings &amp; Caravans
                      </a>
                      <a href="/wishlist" className="nav__popover-item" onClick={() => setShowUserMenu(false)}>
                        <Heart size={15} /> Saved Wishlist
                      </a>
                      <button type="button" className="nav__popover-item" onClick={() => { setShowUserMenu(false); setIsRewardsModalOpen(true); }}>
                        <Award size={15} /> StayQ Rewards
                      </button>
                      <div className="nav__popover-divider" />
                      <button
                        type="button"
                        className="nav__popover-item nav__popover-item--danger"
                        onClick={async () => {
                          setShowUserMenu(false);
                          await logoutUser();
                        }}
                      >
                        <LogOut size={15} /> Sign Out
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <button
                type="button"
                className="nav__signin-btn"
                onClick={() => setIsAuthModalOpen(true)}
                aria-label="Sign In"
              >
                <User size={15} className="nav__btn-icon" />
                <span>SIGN IN</span>
              </button>
            )}
          </div>

          {/* Clean Luxury Mobile Header Actions */}
          <div className="nav__mobile-actions">
            {user ? (
              <button
                type="button"
                className="nav__mobile-avatar-btn"
                onClick={() => setShowUserMenu(!showUserMenu)}
                aria-label="Account"
              >
                <img
                  src={user.avatarUrl || "/images/avatar_rohan.jpg"}
                  alt={user.name || "User"}
                  className="nav__avatar-img"
                />
              </button>
            ) : (
              <button
                type="button"
                className="nav__mobile-signin-btn"
                onClick={() => setIsAuthModalOpen(true)}
                aria-label="Sign In"
              >
                <User size={14} />
                <span>LOGIN</span>
              </button>
            )}

            <button
              type="button"
              className="nav__burger"
              onClick={() => setOpen(!open)}
              aria-label="Toggle navigation menu"
              aria-expanded={open}
            >
              {open ? <X size={19} /> : <Menu size={19} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {open && (
        <div className="nav__drawer">
          <div className="nav__drawer-inner">
            <a
              className="nav__drawer-link"
              href="#stays-catalog"
              onClick={(e) => navigateToSection(e, "stays-catalog")}
            >
              HOTELS &amp; STAYS
            </a>
            <a
              className="nav__drawer-link"
              href="#adventure"
              onClick={(e) => navigateToSection(e, "adventure")}
            >
              CARAVANS &amp; RVS
            </a>
            <a
              className="nav__drawer-link"
              href="#zero-broker"
              onClick={(e) => navigateToSection(e, "zero-broker")}
            >
              ZERO BROKER
            </a>
            <a
              className="nav__drawer-link"
              href="/about"
              onClick={(e) => handlePageNavigation(e, "/about")}
            >
              ABOUT US
            </a>
            <a
              className="nav__drawer-link"
              href="/contact"
              onClick={(e) => handlePageNavigation(e, "/contact")}
            >
              CONTACT &amp; GET IN TOUCH
            </a>
            <div className="pt-3">
              <button
                type="button"
                className="btn btn--primary w-full"
                onClick={() => {
                  setOpen(false);
                  setIsAuthModalOpen(true);
                }}
              >
                Sign In / Join StayQ
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
