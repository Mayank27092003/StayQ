import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "@/styles/tokens.css";
import "@/styles/base.css";
import "@/styles/sections.css";
import { AppProvider } from "@/context/AppContext";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { SearchModal } from "@/components/SearchModal";
import { StayDetailModal } from "@/components/StayDetailModal";
import { CheckoutModal } from "@/components/CheckoutModal";
import { BookingConfirmationModal } from "@/components/BookingConfirmationModal";
import { AuthModal } from "@/components/AuthModal";
import { HostAppModal } from "@/components/HostAppModal";
import { SupportModal } from "@/components/SupportModal";
import { RewardsModal } from "@/components/RewardsModal";
import { QubeDrawer } from "@/components/QubeDrawer";

const font = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://stayq.space"),
  title: {
    default: "StayQ (Stay Q) — India's Luxury Homestays, Villas, 4x4 RV Caravans & Zero-Broker Rentals",
    template: "%s | StayQ",
  },
  description:
    "Discover Stay Q — India's premier booking companion for luxury private pool villas, mountain cabins, off-grid 4x4 RV campervans, glamping sites & verified 11-month zero-brokerage rental homes. Book with direct host pricing & plan with Qube AI.",
  keywords: [
    "Stay Q",
    "StayQ",
    "stayq.space",
    "homestays in India",
    "luxury villas in Goa",
    "villas with private pool",
    "caravan rental India",
    "RV rental India",
    "campervan rental Bangalore",
    "glamping in Ladakh",
    "zero broker rentals Bangalore",
    "direct owner home rental",
    "homestays in Manali",
    "villas in Lonavala",
    "Qube AI trip planner",
    "book homestay online",
  ],
  authors: [{ name: "Stay Q Technologies Private Limited", url: "https://stayq.space" }],
  creator: "Stay Q",
  publisher: "Stay Q Technologies Private Limited",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: "https://stayq.space",
    siteName: "Stay Q",
    title: "Stay Q | Luxury Homestays, Villas, RV Caravans & Zero-Broker Rentals",
    description:
      "Book authentic luxury villas, mountain glass cabins, 4x4 campervans, and zero-broker direct homes across India. Instant booking & direct host pricing.",
    images: [
      {
        url: "/images/real_hero.jpg",
        width: 1200,
        height: 630,
        alt: "Stay Q - Luxury Homestays, Villas and RV Caravans in India",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Stay Q | Luxury Homestays, Villas, RV Caravans & Zero-Broker Rentals",
    description:
      "Discover exceptional homestays, private pool villas, RV campervans, and zero-broker rentals across India. Plan with Qube AI.",
    images: ["/images/real_hero.jpg"],
    creator: "@StayQOfficial",
  },
  alternates: {
    canonical: "https://stayq.space/",
  },
  icons: {
    icon: "/images/logo_icon.png",
    shortcut: "/favicon.ico",
    apple: "/images/logo_icon.png",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": "https://stayq.space/#organization",
      "name": "Stay Q",
      "alternateName": ["StayQ", "StayQ Technologies", "StayQ India", "stayq.space"],
      "url": "https://stayq.space",
      "logo": "https://stayq.space/images/logo_icon.png",
      "image": "https://stayq.space/images/campervan_wide_8k.jpg",
      "sameAs": [
        "https://www.instagram.com/stayqofficial",
        "https://twitter.com/StayQOfficial",
        "https://www.linkedin.com/company/stayq",
        "https://play.google.com/store/apps/details?id=com.stayq.app"
      ],
      "contactPoint": {
        "@type": "ContactPoint",
        "telephone": "+91-9765413179",
        "contactType": "customer support",
        "areaServed": "IN",
        "availableLanguage": ["English", "Hindi"]
      },
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": "4.98",
        "reviewCount": "1420",
        "bestRating": "5",
        "worstRating": "1"
      }
    },
    {
      "@type": "WebSite",
      "@id": "https://stayq.space/#website",
      "url": "https://stayq.space",
      "name": "Stay Q | Luxury Homestays, Villas, 4x4 RVs & Zero-Broker Rentals",
      "alternateName": ["StayQ", "StayQ India", "stayq.space"],
      "publisher": { "@id": "https://stayq.space/#organization" },
      "potentialAction": {
        "@type": "SearchAction",
        "target": "https://stayq.space/#stays-catalog?search={search_term_string}",
        "query-input": "required name=search_term_string"
      }
    },
    {
      "@type": "TravelAgency",
      "@id": "https://stayq.space/#travelagency",
      "name": "Stay Q Luxury Expeditions & Stays",
      "description": "India's premier booking platform for 4x4 luxury campervans, heated Himalayan glamping domes, private pool heritage villas, and verified zero-brokerage 11-month rental homes.",
      "url": "https://stayq.space",
      "priceRange": "₹1,800 - ₹35,000",
      "currenciesAccepted": "INR",
      "paymentAccepted": "UPI, Credit Card, Debit Card, Net Banking",
      "areaServed": {
        "@type": "Country",
        "name": "India"
      },
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": "4.98",
        "reviewCount": "1420",
        "bestRating": "5",
        "worstRating": "1"
      }
    },
    {
      "@type": "FAQPage",
      "@id": "https://stayq.space/#faq",
      "mainEntity": [
        {
          "@type": "Question",
          "name": "What is Stay Q and how does it offer 0% brokerage on homes?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Stay Q directly connects property owners and verified guests without middlemen or broker fees. You get 100% verified legal 11-month digital rental agreements with zero commission."
          }
        },
        {
          "@type": "Question",
          "name": "Can I rent a luxury 4x4 RV campervan for Ladakh and Himachal in India?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Yes! Stay Q provides fully-equipped 4x4 off-grid expedition campervans with pop-up tents, kitchenettes, heated sleeping quarters, solar power, and verified mountain route itineraries across Ladakh, Spiti, and Himachal."
          }
        },
        {
          "@type": "Question",
          "name": "Are private pool villas in Goa and Udaipur verified on Stay Q?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Every private villa, heritage haveli, and alpine cottage on Stay Q undergoes strict 100% on-ground verification, star host inspection, and 3D walkthrough scanning."
          }
        },
        {
          "@type": "Question",
          "name": "What payment methods are supported on Stay Q?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Stay Q supports instant zero-fee UPI (GPay, PhonePe, Paytm), all major credit and debit cards, Net Banking, and instant refundable security deposits."
          }
        }
      ]
    },
    {
      "@type": "ItemList",
      "@id": "https://stayq.space/#featured-stays",
      "name": "Featured Verified Stays & Expeditions on Stay Q",
      "itemListElement": [
        {
          "@type": "ListItem",
          "position": 1,
          "item": {
            "@type": "LodgingBusiness",
            "name": "Ladakh 4x4 Expedition Luxury RV",
            "image": "https://stayq.space/images/campervan_wide_8k.jpg",
            "description": "Self-drive luxury 4x4 off-grid expedition campervan in Leh Ladakh with 3D routes and campfire gear.",
            "priceRange": "₹8,500/night",
            "aggregateRating": {
              "@type": "AggregateRating",
              "ratingValue": "4.99",
              "reviewCount": "210"
            }
          }
        },
        {
          "@type": "ListItem",
          "position": 2,
          "item": {
            "@type": "LodgingBusiness",
            "name": "Garhwal Alpine Glamping Geodesic Domes",
            "image": "https://stayq.space/images/kedarnath_camp_wide_8k.jpg",
            "description": "Heated panoramic glass glamping dome at 11,500 ft amidst Garhwal Himalayas with private deck.",
            "priceRange": "₹4,800/night",
            "aggregateRating": {
              "@type": "AggregateRating",
              "ratingValue": "4.97",
              "reviewCount": "184"
            }
          }
        },
        {
          "@type": "ListItem",
          "position": 3,
          "item": {
            "@type": "LodgingBusiness",
            "name": "Udaipur Royal Heritage Haveli Villa",
            "image": "https://stayq.space/images/indian_villa_wide_8k.jpg",
            "description": "Opulent lakeside Rajasthani luxury villa with private illuminated lotus pool, jharokhas, and Lake Pichola views.",
            "priceRange": "₹14,500/night",
            "aggregateRating": {
              "@type": "AggregateRating",
              "ratingValue": "4.98",
              "reviewCount": "340"
            }
          }
        }
      ]
    }
  ]
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={font.className}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        {/* Google Analytics 4 */}
        <script async src="https://www.googletagmanager.com/gtag/js?id=G-H72ZDT9SHH" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-H72ZDT9SHH');
            `,
          }}
        />
      </head>
      <body>
        <AppProvider>
          <Nav />
          <main>{children}</main>
          <Footer />

          {/* Global Modals & Drawers */}
          <SearchModal />
          <StayDetailModal />
          <CheckoutModal />
          <BookingConfirmationModal />
          <AuthModal />
          <HostAppModal />
          <SupportModal />
          <RewardsModal />
          <QubeDrawer />
        </AppProvider>
      </body>
    </html>
  );
}
