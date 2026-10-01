"use client";

import React, { useEffect, useState } from "react";
import { Hero } from "@/components/Hero";
import { TypeStrip } from "@/components/TypeStrip";
import { StaysCatalog } from "@/components/StaysCatalog";
import { RvOverlandNetwork } from "@/components/RvOverlandNetwork";
import { ZeroBroker } from "@/components/ZeroBroker";
import { Qube } from "@/components/Qube";
import { ExperiencesCatalog } from "@/components/ExperiencesCatalog";
import { Adventure } from "@/components/Adventure";
import { Features } from "@/components/Features";
import { Host } from "@/components/Host";
import { Testimonials } from "@/components/Testimonials";
import { Download } from "@/components/Download";
import { AboutPage } from "@/components/AboutPage";
import { ContactPage } from "@/components/ContactPage";
import { TermsOfService } from "@/components/TermsOfService";
import { PrivacyPolicy } from "@/components/PrivacyPolicy";
import { RefundPolicy } from "@/components/RefundPolicy";
import { HostProtectionPolicy } from "@/components/HostProtectionPolicy";
import { GuestSafetyPolicy } from "@/components/GuestSafetyPolicy";
import { DisruptivePolicy } from "@/components/DisruptivePolicy";
import { ZeroBrokerPolicy } from "@/components/ZeroBrokerPolicy";
import { LegalContact } from "@/components/LegalContact";
import { WishlistPage } from "@/components/WishlistPage";
import { TripsPage } from "@/components/TripsPage";
import { HostInvitePage } from "@/components/HostInvitePage";
import { GuestRulesPage } from "@/components/GuestRulesPage";
import { AdventureExplorePage } from "@/components/AdventureExplorePage";

function getNormalizedRoute(): string {
  if (typeof window === "undefined") return "/";
  if (window.location.hash && window.location.hash.startsWith("#/")) {
    const fromHash = window.location.hash.slice(1).split("?")[0].replace(/\/+$/, "");
    return fromHash || "/";
  }
  const fromPath = (window.location.pathname || "/").split("?")[0].replace(/\/+$/, "");
  return fromPath || "/";
}

export default function HomePage() {
  const [currentRoute, setCurrentRoute] = useState<string>("/");

  useEffect(() => {
    const handleRouteChange = () => {
      const route = getNormalizedRoute();
      setCurrentRoute(route);
      window.scrollTo({ top: 0, behavior: "smooth" });
    };

    // Initial check on mount
    handleRouteChange();

    window.addEventListener("popstate", handleRouteChange);
    window.addEventListener("hashchange", handleRouteChange);

    return () => {
      window.removeEventListener("popstate", handleRouteChange);
      window.removeEventListener("hashchange", handleRouteChange);
    };
  }, []);

  const isAboutPage = currentRoute === "/about" || currentRoute === "#/about";
  const isContactPage = currentRoute === "/contact" || currentRoute === "#/contact";
  const isTermsPage = currentRoute === "/terms" || currentRoute === "#/terms";
  const isPrivacyPage = currentRoute === "/privacy" || currentRoute === "#/privacy";
  const isRefundPage = currentRoute === "/policy/refunds" || currentRoute === "/refund" || currentRoute === "#/refund";
  const isHostProtectionPage = currentRoute === "/policy/host-protection" || currentRoute === "/host-protection" || currentRoute === "#/host-protection";
  const isGuestSafetyPage = currentRoute === "/policy/guest-safety" || currentRoute === "/guest-safety" || currentRoute === "#/guest-safety";
  const isDisruptivePage = currentRoute === "/policy/disruptive-events" || currentRoute === "/disruptive" || currentRoute === "#/disruptive";
  const isZeroBrokerPolicyPage = currentRoute === "/policy/zero-brokerage" || currentRoute === "/zero-broker-policy" || currentRoute === "#/zero-broker-policy";
  const isLegalContactPage = currentRoute === "/legal-contact" || currentRoute === "#/legal-contact";
  const isWishlistPage = currentRoute === "/wishlist" || currentRoute === "#/wishlist";
  const isTripsPage = currentRoute === "/trips" || currentRoute === "#/trips";
  const isHostInvitePage = currentRoute === "/host-invite" || currentRoute === "/invite" || currentRoute === "/partner" || currentRoute === "#/host-invite";
  const isGuestRulesPage = currentRoute === "/guest-rules" || currentRoute === "#/guest-rules";
  const isStaysPage = currentRoute === "/stays" || currentRoute === "#/stays";
  const isZeroBrokerPage = currentRoute === "/zero-broker" || currentRoute === "#/zero-broker";
  const isAdventurePage = currentRoute === "/adventure" || currentRoute === "/rvs" || currentRoute === "/camping" || currentRoute === "#/adventure" || currentRoute === "#/rvs" || currentRoute === "#/camping";
  const isExperiencesPage = currentRoute === "/experiences" || currentRoute === "#/experiences";

  if (isAboutPage) return <AboutPage />;
  if (isContactPage) return <ContactPage />;
  if (isTermsPage) return <TermsOfService />;
  if (isPrivacyPage) return <PrivacyPolicy />;
  if (isRefundPage) return <RefundPolicy />;
  if (isHostProtectionPage) return <HostProtectionPolicy />;
  if (isGuestSafetyPage) return <GuestSafetyPolicy />;
  if (isDisruptivePage) return <DisruptivePolicy />;
  if (isZeroBrokerPolicyPage) return <ZeroBrokerPolicy />;
  if (isLegalContactPage) return <LegalContact />;
  if (isWishlistPage) return <WishlistPage />;
  if (isTripsPage) return <TripsPage />;
  if (isHostInvitePage) return <HostInvitePage />;
  if (isGuestRulesPage) return <GuestRulesPage />;

  if (isAdventurePage) {
    return (
      <div style={{ paddingTop: "5.5rem" }}>
        <AdventureExplorePage />
      </div>
    );
  }

  if (isStaysPage) {
    return (
      <div style={{ paddingTop: "5.5rem" }}>
        <StaysCatalog />
      </div>
    );
  }

  if (isZeroBrokerPage) {
    return (
      <div style={{ paddingTop: "5.5rem" }}>
        <ZeroBroker />
      </div>
    );
  }

  if (isExperiencesPage) {
    return (
      <div style={{ paddingTop: "5.5rem" }}>
        <ExperiencesCatalog />
      </div>
    );
  }

  return (
    <>
      <Hero />
      <TypeStrip />
      <RvOverlandNetwork />
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
  );
}
