import { useState, useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Nav } from './components/Nav';
import { Hero } from './components/Hero';
import { TypeStrip } from './components/TypeStrip';
import { StaysCatalog } from './components/StaysCatalog';
import { SearchBar } from './components/SearchBar';
import { ZeroBroker } from './components/ZeroBroker';
import { Qube } from './components/Qube';
import { ExperiencesCatalog } from './components/ExperiencesCatalog';
import { Adventure } from './components/Adventure';
import { Features } from './components/Features';
import { Host } from './components/Host';
import { Testimonials } from './components/Testimonials';
import { Download } from './components/Download';
import { Footer } from './components/Footer';
import { DisruptivePolicy } from './components/DisruptivePolicy';
import { AboutPage } from './components/AboutPage';
import { ContactPage } from './components/ContactPage';
import { PrivacyPolicy } from './components/PrivacyPolicy';
import { TermsOfService } from './components/TermsOfService';
import { RefundPolicy } from './components/RefundPolicy';
import { HostProtectionPolicy } from './components/HostProtectionPolicy';
import { ZeroBrokerPolicy } from './components/ZeroBrokerPolicy';
import { GuestSafetyPolicy } from './components/GuestSafetyPolicy';
import { LegalContact } from './components/LegalContact';
import { TripsPage } from './components/TripsPage';
import { WishlistPage } from './components/WishlistPage';
import { StayDetailModal } from './components/StayDetailModal';
import { CheckoutModal } from './components/CheckoutModal';
import { BookingConfirmationModal } from './components/BookingConfirmationModal';
import { QubeDrawer } from './components/QubeDrawer';
import { AuthModal } from './components/AuthModal';
import { HostAppModal } from './components/HostAppModal';
import { HostInvitePage } from './components/HostInvitePage';
import { SupportModal } from './components/SupportModal';
import { RewardsModal } from './components/RewardsModal';
import { SearchModal } from './components/SearchModal';
import { GuestRulesPage } from './components/GuestRulesPage';

import { AdventureExplorePage } from './components/AdventureExplorePage';

function normalizePath(raw: string): string {
  if (!raw) return '/';
  const noQuery = raw.split('?')[0].split('&')[0];
  const clean = noQuery.startsWith('#/') ? noQuery.slice(1) : (noQuery.startsWith('#') ? '/' : noQuery);
  return clean.replace(/\/+$/, '') || '/';
}

function AppContent() {
  const [currentPath, setCurrentPath] = useState(() => {
    if (typeof window === 'undefined') return '/';
    // Clean up legacy hash immediately
    if (window.location.hash && window.location.hash.startsWith('#/')) {
      const clean = window.location.hash.slice(1);
      window.history.replaceState(null, '', clean);
      return clean;
    }
    if (window.location.hash === '#/' || window.location.hash === '#') {
      window.history.replaceState(null, '', '/');
      return '/';
    }
    return window.location.pathname || '/';
  });

  const { updateFilters, isSupportOpen, setIsSupportOpen } = useApp();

  useEffect(() => {
    let lastPath = '';
    const handleRouteChange = () => {
      // Auto-clean any stray hash
      if (window.location.hash && window.location.hash.startsWith('#/')) {
        const clean = window.location.hash.slice(1);
        window.history.replaceState(null, '', clean);
      } else if (window.location.hash === '#/' || window.location.hash === '#') {
        window.history.replaceState(null, '', '/');
      }

      const path = window.location.pathname || '/';
      const norm = normalizePath(path);

      setCurrentPath(norm);
      document.body.style.overflowX = 'hidden';
      document.body.style.overflowY = 'auto';

      if (norm !== lastPath) {
        lastPath = norm;
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }

      // Dynamic SEO Title & Meta Management
      if (norm === '/zero-broker') {
        document.title = 'Zero-Broker 11-Month Rental Homes in India | Stay Q';
        updateFilters({ category: 'ZERO_BROKER', zeroBrokerOnly: true });
      } else if (norm === '/rvs') {
        document.title = 'Rent Luxury RVs, Campervans & Motorhomes in India | Stay Q';
        updateFilters({ category: 'RV', zeroBrokerOnly: false });
      } else if (norm === '/camping') {
        document.title = 'Camping, Glamping & Tents in India | Stay Q Camping Sites';
        updateFilters({ category: 'CAMPING_SITE', zeroBrokerOnly: false });
      } else if (norm === '/experiences') {
        document.title = 'Handpicked Local Tours & Experiences in India | Stay Q';
      } else if (norm === '/host-invite' || norm === '/invite' || norm === '/partner') {
        document.title = 'List Your Property & Earn with Zero Commission | Host on Stay Q';
      } else if (norm === '/about') {
        document.title = 'About Stay Q — India\'s Premier Homestay & Zero-Broker Platform';
      } else if (norm === '/contact') {
        document.title = 'Contact & 24/7 Concierge Support | Stay Q';
      } else if (norm === '/stays') {
        document.title = 'Explore Luxury Homestays, Villas & Cottages in India | Stay Q';
        updateFilters({ zeroBrokerOnly: false });
      } else if (norm === '/support') {
        setIsSupportOpen(true);
      } else {
        document.title = 'Stay Q | Luxury Homestays, Villas, RVs & Zero-Broker Rentals in India';
        updateFilters({ category: 'ALL', zeroBrokerOnly: false });
      }
    };

    handleRouteChange(); // Initial check

    window.addEventListener('popstate', handleRouteChange);
    window.addEventListener('hashchange', handleRouteChange);

    return () => {
      window.removeEventListener('popstate', handleRouteChange);
      window.removeEventListener('hashchange', handleRouteChange);
    };
  }, [updateFilters, setIsSupportOpen]);

  const norm = normalizePath(currentPath);

  // Route matches
  const isDisruptivePolicyPage = norm === '#/policy/disruptive-events' || norm === '/policy/disruptive-events';
  const isTermsPage = norm === '#/terms' || norm === '/terms';
  const isRefundsPage = norm === '#/policy/refunds' || norm === '/policy/refunds';
  const isHostProtectionPage = norm === '#/policy/host-protection' || norm === '/policy/host-protection';
  const isZeroBrokerPolicyPage = norm === '#/policy/zero-brokerage' || norm === '/policy/zero-brokerage';
  const isGuestSafetyPage = norm === '#/policy/guest-safety' || norm === '/policy/guest-safety';
  const isLegalContactPage = norm === '#/legal-contact' || norm === '/legal-contact';
  const isGuestRulesPage = norm === '#/guest-rules' || norm === '/guest-rules' || norm === '#/policy/guest-rules' || norm === '/policy/guest-rules';

  const isAboutPage = norm === '#/about' || norm === '/about';
  const isContactPage = norm === '#/contact' || norm === '/contact';
  const isPrivacyPage = norm === '#/privacy' || norm === '/privacy';
  const isTripsPage = norm === '#/trips' || norm === '/trips';
  const isWishlistPage = norm === '#/wishlist' || norm === '/wishlist';
  const isStaysPage = norm === '#/stays' || norm === '/stays';
  const isZeroBrokerPage = norm === '#/zero-broker' || norm === '/zero-broker';
  const isExperiencesPage = norm === '#/experiences' || norm === '/experiences';
  const isRvsPage = norm === '#/rvs' || norm === '/rvs' || norm === '#/category/rvs';
  const isCampingPage = norm === '#/camping' || norm === '/camping' || norm === '#/category/camping';
  const isAdventurePage = norm === '#/adventure' || norm === '/adventure';
  const isHostInvitePage =
    norm === '#/host-invite' ||
    norm === '/host-invite' ||
    norm === '#/invite' ||
    norm === '/invite' ||
    norm === '#/partner' ||
    norm === '/partner';

  return (
    <>
      <Nav />

      <main>
        {isGuestRulesPage ? (
          <GuestRulesPage />
        ) : isDisruptivePolicyPage ? (
          <DisruptivePolicy />
        ) : isTermsPage ? (
          <TermsOfService />
        ) : isRefundsPage ? (
          <RefundPolicy />
        ) : isHostProtectionPage ? (
          <HostProtectionPolicy />
        ) : isZeroBrokerPolicyPage ? (
          <ZeroBrokerPolicy />
        ) : isGuestSafetyPage ? (
          <GuestSafetyPolicy />
        ) : isLegalContactPage ? (
          <LegalContact />
        ) : isAboutPage ? (
          <AboutPage />
        ) : isContactPage ? (
          <ContactPage />
        ) : isPrivacyPage ? (
          <PrivacyPolicy />
        ) : isTripsPage ? (
          <TripsPage />
        ) : isWishlistPage ? (
          <WishlistPage />
        ) : isHostInvitePage ? (
          <HostInvitePage />
        ) : isRvsPage ? (
          <AdventureExplorePage initialCategory="RV" />
        ) : isCampingPage ? (
          <AdventureExplorePage initialCategory="CAMPING_SITE" />
        ) : isAdventurePage ? (
          <AdventureExplorePage initialCategory="ALL" />
        ) : isStaysPage ? (
          <div style={{ paddingTop: '5.5rem' }}>
            <div className="shell" style={{ marginBottom: '1.5rem' }}>
              <SearchBar />
            </div>
            <StaysCatalog />
          </div>
        ) : isZeroBrokerPage ? (
          <div style={{ paddingTop: '5.5rem' }}>
            <div className="shell" style={{ marginBottom: '1.5rem' }}>
              <SearchBar />
            </div>
            <StaysCatalog />
          </div>
        ) : isExperiencesPage ? (
          <div style={{ paddingTop: '5.5rem' }}>
            <ExperiencesCatalog />
          </div>
        ) : (
          /* Landing Home View */
          <>
            <Hero />
            <TypeStrip />
            <StaysCatalog />
            <ZeroBroker />
            <Qube />
            <ExperiencesCatalog />
            <Adventure />
            <Features />
            <Host />
            <Testimonials />
            <Download />
          </>
        )}
      </main>

      <Footer />

      {/* Global Modals & Drawers */}
      <StayDetailModal />
      <CheckoutModal />
      <BookingConfirmationModal />
      <QubeDrawer />
      <AuthModal />
      <HostAppModal />
      <SupportModal isOpen={isSupportOpen} onClose={() => setIsSupportOpen(false)} />
      <RewardsModal />
      <SearchModal />
    </>
  );
}

export function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

export default App;
