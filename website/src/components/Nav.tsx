import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Menu, X, Sparkles, Heart, Calendar, User, LogOut, ShieldCheck, Headphones } from 'lucide-react';
import { useApp } from '../context/AppContext';

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
  } = useApp();

  const [solid, setSolid] = useState(false);
  const [open, setOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [currentHash, setCurrentHash] = useState(typeof window !== 'undefined' ? window.location.hash || '#/' : '#/');

  useEffect(() => {
    const onScroll = () => setSolid(window.scrollY > 16);
    const onHashChange = () => setCurrentHash(window.location.hash || '#/');
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('hashchange', onHashChange);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('hashchange', onHashChange);
    };
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  const activeBookingsCount = bookings.filter((b) => b.status === 'CONFIRMED').length;

  return (
    <header className={`nav ${solid ? 'nav--solid' : ''}`}>
      <div className="shell">
        <div className="nav__inner">
          <a
            className="nav__brand"
            href="#/"
            onClick={(e) => {
              e.preventDefault();
              window.location.hash = '#/';
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            aria-label="Stay Q home"
          >
            <img className="nav__logo" src="/images/logo_sq.png" alt="" aria-hidden="true" />
            <span>Stay Q</span>
          </a>

          <nav className="nav__links" aria-label="Main">
            <a
              className={`nav__link ${currentHash === '#/' || currentHash === '#' || currentHash === '' ? 'nav__link--active' : ''}`}
              href="#/"
              onClick={(e) => {
                e.preventDefault();
                window.location.hash = '#/';
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            >
              Home
            </a>
            <a
              className={`nav__link ${currentHash === '#/stays' || currentHash === '#stays' ? 'nav__link--active' : ''}`}
              href="#/stays"
            >
              Stays
            </a>
            <a
              className={`nav__link ${currentHash === '#/zero-broker' ? 'nav__link--active' : ''}`}
              href="#/zero-broker"
            >
              Zero Broker
            </a>
            <a
              className={`nav__link ${currentHash === '#/rvs' || currentHash === '#/camping' || currentHash === '#/adventure' ? 'nav__link--active' : ''}`}
              href="#/adventure"
            >
              RVs &amp; Camping
            </a>
            <a
              className={`nav__link ${currentHash === '#/experiences' ? 'nav__link--active' : ''}`}
              href="#/experiences"
            >
              Experiences
            </a>
            <button
              type="button"
              className="nav__link nav__link--qube"
              onClick={() => setIsQubeOpen(true)}
            >
              <Sparkles size={14} className="text-gold" /> Qube AI
            </button>
          </nav>

          <div className="nav__cta">
            <button
              type="button"
              className="nav__host-btn"
              onClick={() => setIsHostAppModalOpen(true)}
            >
              Become a Host
            </button>

            {/* Wishlist Icon */}
            <a href="#/wishlist" className="nav__icon-link" aria-label="Wishlist">
              <Heart size={18} />
              {wishlistIds.length > 0 && <span className="nav__badge">{wishlistIds.length}</span>}
            </a>

            {/* My Trips Icon */}
            <a href="#/trips" className="nav__icon-link" aria-label="My Trips">
              <Calendar size={18} />
              {activeBookingsCount > 0 && (
                <span className="nav__badge nav__badge--violet">{activeBookingsCount}</span>
              )}
            </a>

            {/* User Profile / Auth */}
            {user ? (
              <div className="nav__user-wrap" onClick={() => setShowUserMenu(!showUserMenu)}>
                <img src={user.avatarUrl || '/images/avatar_alex.jpg'} alt={user.name} className="nav__user-avatar" />
                {showUserMenu && (
                  <>
                    <div className="nav__user-backdrop" onClick={(e) => { e.stopPropagation(); setShowUserMenu(false); }} />
                    <div className="nav__user-dropdown" onClick={(e) => e.stopPropagation()}>
                      <div className="nav__user-info">
                        <strong>{user.name}</strong>
                        <small>{user.email}</small>
                      </div>
                      <div className="nav__user-divider" />
                      <a href="#/trips" className="nav__user-item" onClick={() => setShowUserMenu(false)}>
                        <Calendar size={15} /> My Trips &amp; Bookings
                      </a>
                      <a href="#/wishlist" className="nav__user-item" onClick={() => setShowUserMenu(false)}>
                        <Heart size={15} /> My Wishlist
                      </a>
                      <button
                        type="button"
                        className="nav__user-item"
                        onClick={() => {
                          setShowUserMenu(false);
                          setIsSupportOpen(true);
                        }}
                      >
                        <Headphones size={15} /> 24/7 Support &amp; Tickets
                      </button>
                      <button
                        type="button"
                        className="nav__user-item"
                        onClick={() => {
                          setShowUserMenu(false);
                          setIsHostAppModalOpen(true);
                        }}
                      >
                        <ShieldCheck size={15} /> Host on Stay Q App
                      </button>
                      <div className="nav__user-divider" />
                      <button
                        type="button"
                        className="nav__user-item nav__user-item--logout"
                        onClick={() => {
                          logoutUser();
                          setShowUserMenu(false);
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
                className="btn btn--primary btn--sm"
                onClick={() => setIsAuthModalOpen(true)}
              >
                <User size={15} />
                Sign In
              </button>
            )}
          </div>

          <button
            className="nav__burger"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
          >
            {open ? <X size={19} /> : <Menu size={19} />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            className="nav__drawer"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.34, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="nav__drawer-inner">
              <a
                className="nav__drawer-link"
                href="#/"
                onClick={() => {
                  setOpen(false);
                  window.location.hash = '#/';
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              >
                Home
              </a>
              <a className="nav__drawer-link" href="#/stays" onClick={() => setOpen(false)}>
                Explore Stays
              </a>
              <a className="nav__drawer-link" href="#/zero-broker" onClick={() => setOpen(false)}>
                Zero Broker Rentals
              </a>
              <a className="nav__drawer-link" href="#/adventure" onClick={() => setOpen(false)}>
                RVs &amp; Camping
              </a>
              <a className="nav__drawer-link" href="#/experiences" onClick={() => setOpen(false)}>
                Experiences
              </a>
              <a className="nav__drawer-link" href="#/trips" onClick={() => setOpen(false)}>
                My Trips ({activeBookingsCount})
              </a>
              <a className="nav__drawer-link" href="#/wishlist" onClick={() => setOpen(false)}>
                Saved Wishlist ({wishlistIds.length})
              </a>
              <button
                type="button"
                className="nav__drawer-link"
                style={{ textAlign: 'left', color: 'var(--violet)' }}
                onClick={() => {
                  setOpen(false);
                  setIsQubeOpen(true);
                }}
              >
                ✨ Ask Qube AI
              </button>
              <button
                type="button"
                className="nav__drawer-link"
                style={{ textAlign: 'left', color: '#10b981' }}
                onClick={() => {
                  setOpen(false);
                  setIsSupportOpen(true);
                }}
              >
                🎧 24/7 Support &amp; Human Agent
              </button>
              <button
                type="button"
                className="nav__drawer-link"
                style={{ textAlign: 'left' }}
                onClick={() => {
                  setOpen(false);
                  setIsHostAppModalOpen(true);
                }}
              >
                Become a Host (App)
              </button>

              <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
                {user ? (
                  <button
                    type="button"
                    className="btn btn--ghost btn--block"
                    onClick={() => {
                      logoutUser();
                      setOpen(false);
                    }}
                  >
                    Sign Out ({user.name})
                  </button>
                ) : (
                  <button
                    type="button"
                    className="btn btn--primary btn--block"
                    onClick={() => {
                      setOpen(false);
                      setIsAuthModalOpen(true);
                    }}
                  >
                    Sign In / Sign Up
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
