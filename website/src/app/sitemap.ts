import { MetadataRoute } from "next";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://stayq.space";
  const now = new Date();

  // Core High-Intent Pages
  const staticPages = [
    { url: baseUrl, priority: 1.0, changeFrequency: "daily" as const },
    { url: `${baseUrl}/stays`, priority: 0.95, changeFrequency: "daily" as const },
    { url: `${baseUrl}/adventure`, priority: 0.95, changeFrequency: "daily" as const },
    { url: `${baseUrl}/zero-broker`, priority: 0.95, changeFrequency: "daily" as const },
    { url: `${baseUrl}/rvs`, priority: 0.92, changeFrequency: "daily" as const },
    { url: `${baseUrl}/camping`, priority: 0.92, changeFrequency: "daily" as const },
    { url: `${baseUrl}/experiences`, priority: 0.88, changeFrequency: "weekly" as const },
    { url: `${baseUrl}/host-invite`, priority: 0.85, changeFrequency: "weekly" as const },
    { url: `${baseUrl}/partner`, priority: 0.85, changeFrequency: "weekly" as const },
    { url: `${baseUrl}/about`, priority: 0.75, changeFrequency: "monthly" as const },
    { url: `${baseUrl}/contact`, priority: 0.75, changeFrequency: "monthly" as const },
    { url: `${baseUrl}/guest-rules`, priority: 0.70, changeFrequency: "monthly" as const },
    { url: `${baseUrl}/legal-contact`, priority: 0.65, changeFrequency: "monthly" as const },
    { url: `${baseUrl}/policy/zero-brokerage`, priority: 0.80, changeFrequency: "monthly" as const },
    { url: `${baseUrl}/policy/host-protection`, priority: 0.75, changeFrequency: "monthly" as const },
    { url: `${baseUrl}/policy/guest-safety`, priority: 0.75, changeFrequency: "monthly" as const },
    { url: `${baseUrl}/policy/refunds`, priority: 0.70, changeFrequency: "monthly" as const },
    { url: `${baseUrl}/policy/disruptive-events`, priority: 0.65, changeFrequency: "monthly" as const },
  ];

  // Programmatic High-Value Keyword Destinations
  const programmaticLandingPages = [
    // Luxury Villas
    "stays/villas-in-goa",
    "stays/villas-in-udaipur",
    "stays/villas-in-lonavala",
    "stays/villas-in-alibaug",
    "stays/villas-in-chikmagalur",
    "stays/villas-in-coorg",
    "stays/private-pool-villas-india",

    // Homestays & Cabins
    "stays/homestays-in-manali",
    "stays/cabins-in-himachal",
    "stays/treehouses-in-wayanad",
    "stays/homestays-in-kerala",
    "stays/cottages-in-ooty",
    "stays/heritage-havelis-rajasthan",

    // 4x4 Caravans & RV Overlanding
    "stays/caravan-rental-ladakh",
    "stays/rv-rental-bangalore",
    "stays/campervan-hire-india",
    "stays/caravan-rental-spiti",
    "stays/motorhome-rental-kerala",
    "stays/4x4-expedition-campervan-india",

    // Glamping & Camps
    "stays/glamping-in-kedarnath",
    "stays/geodesic-domes-himalayas",
    "stays/camps-in-rishikesh",
    "stays/desert-camps-jaisalmer",
    "stays/camping-sites-pawna-lake",

    // Zero-Broker Long-Term Rentals
    "zero-broker/flats-for-rent-in-bangalore",
    "zero-broker/apartments-in-mumbai",
    "zero-broker/house-for-rent-in-pune",
    "zero-broker/rent-in-delhi-ncr",
    "zero-broker/flats-in-hyderabad",
    "zero-broker/apartments-in-chennai",
    "zero-broker/11-month-rental-agreement-online",
  ];

  const programmaticRoutes = programmaticLandingPages.map((route) => ({
    url: `${baseUrl}/${route}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 0.85,
  }));

  return [
    ...staticPages.map((p) => ({
      ...p,
      lastModified: now,
    })),
    ...programmaticRoutes,
  ];
}