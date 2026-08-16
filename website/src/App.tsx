import { useState, useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Nav } from './components/Nav';
import { Hero } from './components/Hero';
import { TypeStrip } from './components/TypeStrip';
import { StaysCatalog } from './components/StaysCatalog';
import { ZeroBroker } from './components/ZeroBroker';
import { Qube } from './components/Qube';
import { ExperiencesCatalog } from './components/ExperiencesCatalog';
import { Adventure } from './components/Adventure';
import { Features } from './components/Features';
import { Host } from './components/Host';
import { Testimonials } from './components/Testimonials';
import { Download } from './components/Download';
import { Footer } from './components/Footer';
import DisruptivePolicy from './components/DisruptivePolicy';
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
import { GuestRulesPage } from './components/GuestRulesPage';

import { AdventureExplorePage } from './components/AdventureExplorePage';

function AppContent() {
  const [currentPath, setCurrentPath] = useState(window.location.hash || window.location.pathname);
  const { updateFilters, isSupportOpen, setIsSupportOpen } = useApp();

  useEffect(() => {
    const handleHashChange = () => {
      const path = window.location.hash || window.location.pathname;
      setCurrentPath(path);
      window.scrollTo({ top: 0, behavior: 'smooth' });

      // Dynamic SEO Title & Meta Management
      if (path === '#/zero-broker' || path === '/zero-broker') {
        document.title = 'Zero-Broker 11-Month Rental Homes in India | Stay Q';
        updateFilters({ category: 'ZERO_BROKER', zeroBrokerOnly: true });
      } else if (path === '#/rvs' || path === '/rvs') {
        document.title = 'Rent Luxury RVs, Campervans & Motorhomes in India | Stay Q';
        updateFilters({ category: 'RV' });
      } else if (path === '#/camping' || path === '/camping') {
        document.title = 'Camping, Glamping & Tents in India | Stay Q Camping Sites';
        updateFilters({ category: 'CAMPING_SITE' });
      } else if (path === '#/experiences' || path === '/experiences') {
        document.title = 'Handpicked Local Tours & Experiences in India | Stay Q';
      } else if (path === '#/host-invite' || path === '/host-invite' || path === '#/invite' || path === '/invite') {
        document.title = 'List Your Property & Earn with Zero Commission | Host on Stay Q';
      } else if (path === '#/about' || path === '/about') {
        document.title = 'About Stay Q — India\'s Premier Homestay & Zero-Broker Platform';
      } else if (path === '#/contact' || path === '/contact') {
        document.title = 'Contact & 24/7 Concierge Support | Stay Q';
      } else if (path === '#/stays' || path === '/stays') {
        document.title = 'Explore Luxury Homestays, Villas & Cottages in India | Stay Q';
      } else if (path === '#/support' || path === '/support') {
        setIsSupportOpen(true);
      } else {
        document.title = 'Stay Q | Luxury Homestays, Villas, RVs & Zero-Broker Rentals in India';
      }
    };

    handleHashChange(); // Run on initial mount

    window.addEventListener('hashchange', handleHashChange);
    window.addEventListener('popstate', handleHashChange);

    return () => {
      window.removeEventListener('hashchange', handleHashChange);
      window.removeEventListener('popstate', handleHashChange);
    };
  }, [updateFilters, setIsSupportOpen]);

  // Route matches
  const isDisruptivePolicyPage = currentPath === '#/policy/disruptive-events' || currentPath === '/policy/disruptive-events';
  const isTermsPage = currentPath === '#/terms' || currentPath === '/terms';
  const isRefundsPage = currentPath === '#/policy/refunds' || currentPath === '/policy/refunds';
  const isHostProtectionPage = currentPath === '#/policy/host-protection' || currentPath === '/policy/host-protection';
  const isZeroBrokerPolicyPage = currentPath === '#/policy/zero-brokerage' || currentPath === '/policy/zero-brokerage';
  const isGuestSafetyPage = currentPath === '#/policy/guest-safety' || currentPath === '/policy/guest-safety';
  const isLegalContactPage = currentPath === '#/legal-contact' || currentPath === '/legal-contact';
  const isGuestRulesPage = currentPath === '#/guest-rules' || currentPath === '/guest-rules' || currentPath === '#/policy/guest-rules' || currentPath === '/policy/guest-rules';

  const isAboutPage = currentPath === '#/about' || currentPath === '/about';
  const isContactPage = currentPath === '#/contact' || currentPath === '/contact';
  const isPrivacyPage = currentPath === '#/privacy' || currentPath === '/privacy';
  const isTripsPage = currentPath === '#/trips' || currentPath === '/trips';
  const isWishlistPage = currentPath === '#/wishlist' || currentPath === '/wishlist';
  const isStaysPage = currentPath === '#/stays' || currentPath === '/stays';
  const isZeroBrokerPage = currentPath === '#/zero-broker' || currentPath === '/zero-broker';
  const isExperiencesPage = currentPath === '#/experiences' || currentPath === '/experiences';
  const isRvsPage = currentPath === '#/rvs' || currentPath === '/rvs' || currentPath === '#/category/rvs';
  const isCampingPage = currentPath === '#/camping' || currentPath === '/camping' || currentPath === '#/category/camping';
  const isAdventurePage = currentPath === '#/adventure' || currentPath === '/adventure';
  const isHostInvitePage =
    currentPath === '#/host-invite' ||
    currentPath === '/host-invite' ||
    currentPath === '#/invite' ||
    currentPath === '/invite' ||
    currentPath === '#/partner' ||
    currentPath === '/partner';

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
            <StaysCatalog />
          </div>
        ) : isZeroBrokerPage ? (
          <div style={{ paddingTop: '5.5rem' }}>
            <ZeroBroker />
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
