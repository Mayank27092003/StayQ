import React, { useState } from 'react';
import {
  Sparkles,
  Camera,
  CheckCircle2,
  Phone,
  Home,
  Send,
  Compass,
  Tent,
  Truck,
  Building,
  Check,
  ShieldCheck,
  Zap,
} from 'lucide-react';

export type HostCategoryType = 'villa' | 'rv' | 'camping' | 'long_term' | 'experience';

interface CategoryConfig {
  id: HostCategoryType;
  title: string;
  subtitle: string;
  icon: React.ComponentType<{ size?: number; className?: string; style?: React.CSSProperties }>;
  badge: string;
}

const CATEGORIES: CategoryConfig[] = [
  {
    id: 'villa',
    title: 'Villas & Stays',
    subtitle: 'Boutique Villas, Cabins & Havelis',
    icon: Home,
    badge: 'Short-Term Stays',
  },
  {
    id: 'rv',
    title: 'RVs & Campervans',
    subtitle: 'Motorhomes & 4x4 Overlanding',
    icon: Truck,
    badge: 'Vanlife & RVs',
  },
  {
    id: 'camping',
    title: 'Camping & Glamping',
    subtitle: 'Domes, Tents & Wilderness Sites',
    icon: Tent,
    badge: 'Glamping & Camps',
  },
  {
    id: 'long_term',
    title: '11-Month Long Rentals',
    subtitle: 'Zero-Broker Homes & Lofts',
    icon: Building,
    badge: 'Zero-Brokerage Lease',
  },
  {
    id: 'experience',
    title: 'Curated Experiences',
    subtitle: 'Treks, Water Sports & Walks',
    icon: Compass,
    badge: 'Local Experiences',
  },
];

// Stay Q Official 25 Amenities for Villas & Stays
const VILLA_AMENITIES = [
  'Wi-Fi',
  'Air conditioning',
  'Heating',
  'TV',
  'Kitchen',
  'Refrigerator',
  'Washing machine',
  'Microwave',
  'Parking',
  'Swimming pool',
  'Gym',
  'Balcony',
  'Garden',
  'Workspace',
  'Hot water',
  'Elevator',
  'Security',
  'CCTV in common areas',
  'Power backup',
  'Generator',
  'Washing facilities',
  'Hair dryer',
  'Iron',
  'Towels',
  'Bed linen',
];

// RV & Campervan Specific Features
const RV_AMENITIES = [
  'Solar Power System',
  'Inverter Power Backup',
  'Built-in Shower & Toilet',
  'Kitchenette with Gas Stove',
  '12V Refrigerator / Ice Box',
  'Rooftop Tent / Annex',
  'Retractable Outdoor Awning',
  'Fresh Water Tank (100L+)',
  'Air Conditioning / Cabin AC',
  'GPS Live Tracking',
  'Camping Chairs & Foldable Table',
  '4x4 / AWD Capabilities',
  'Bluetooth Sound System',
  'Bedding & Linens Included',
];

// Camping & Glamping Features
const CAMPING_AMENITIES = [
  'Bonfire Pit & Firewood',
  'Stargazing Telescope',
  'Western Washrooms & Hot Water',
  'Barbecue (BBQ) Setup',
  'On-Site Meals / Camp Cafe',
  'Electricity & Solar Lighting',
  'Guided Nature Trek',
  'River / Stream Access',
  'Pet Friendly Grounds',
  'Free Parking on Site',
  'First Aid & Safety Kit',
  '24/7 Site Caretaker',
];

// 11-Month Rental Features
const LONG_TERM_AMENITIES = [
  'Lift / Elevator',
  'Covered Car Parking',
  '100% Power Backup',
  '24/7 Gated Security & CCTV',
  'Gated Community Club & Gym',
  'High-Speed Gigabit Fiber Ready',
  'Modern Modular Kitchen',
  'Spacious Balcony / Sit-out',
  'Pet Friendly Society',
  'Piped Gas Connection',
  'Digital Tenancy Agreement Support',
  'Water Softener Plant',
];

// Experience Highlights
const EXPERIENCE_AMENITIES = [
  'Certified Expert Guide / Instructor',
  'Safety Gear & Lifejackets',
  'Snacks, Tea & Hydration',
  'Photos & Drone Footage Included',
  'All Entry Permits & Tickets',
  'First Aid Certified Team',
  'Pick-up & Drop Available',
  'Eco-Friendly / Zero Waste',
  'Small Group Experience (<= 8)',
  'Equipment & Gear Provided',
];

export const HostInvitePage: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<HostCategoryType>('villa');
  const [submitted, setSubmitted] = useState(false);
  const [refCode, setRefCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Common Contact Fields
  const [hostName, setHostName] = useState('');
  const [phone, setPhone] = useState('+91 ');
  const [email, setEmail] = useState('');
  const [instagram, setInstagram] = useState('');
  const [baseCity, setBaseCity] = useState('');
  const [state, setState] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [notes, setNotes] = useState('');

  // Category: Villas & Stays
  const [propertyName, setPropertyName] = useState('');
  const [stayType, setStayType] = useState('Luxury Villa');
  const [nightlyRate, setNightlyRate] = useState(12500);
  const [guestCapacity, setGuestCapacity] = useState(6);
  const [bedrooms, setBedrooms] = useState(3);
  const [bathrooms, setBathrooms] = useState(3);
  const [selectedVillaAmenities, setSelectedVillaAmenities] = useState<string[]>([
    'Wi-Fi',
    'Air conditioning',
    'Swimming pool',
    'Hot water',
    'Power backup',
    'Kitchen',
  ]);

  // Category: RVs & Campervans
  const [rvTitle, setRvTitle] = useState('');
  const [rvMakeModel, setRvMakeModel] = useState('');
  const [rvTransmission, setRvTransmission] = useState('Automatic');
  const [rvFuel, setRvFuel] = useState('Diesel');
  const [rvBerths, setRvBerths] = useState(4);
  const [rvDriverOption, setRvDriverOption] = useState('Self-Drive & Chauffeur Available');
  const [rvDailyRate, setRvDailyRate] = useState(9500);
  const [selectedRvAmenities, setSelectedRvAmenities] = useState<string[]>([
    'Solar Power System',
    'Inverter Power Backup',
    'Built-in Shower & Toilet',
    'Kitchenette with Gas Stove',
    'Retractable Outdoor Awning',
    'Camping Chairs & Foldable Table',
  ]);

  // Category: Camping & Glamping
  const [campsiteName, setCampsiteName] = useState('');
  const [campsiteSetting, setCampsiteSetting] = useState('Riverside & Pine Forest');
  const [campsiteAccommodation, setCampsiteAccommodation] = useState('Geodesic Glamping Dome');
  const [campsiteCapacity, setCampsiteCapacity] = useState(20);
  const [campsitePricePerNight, setCampsitePricePerNight] = useState(4500);
  const [selectedCampingAmenities, setSelectedCampingAmenities] = useState<string[]>([
    'Bonfire Pit & Firewood',
    'Stargazing Telescope',
    'Western Washrooms & Hot Water',
    'Electricity & Solar Lighting',
    'On-Site Meals / Camp Cafe',
    'Free Parking on Site',
  ]);

  // Category: 11-Month Long-Term Rentals
  const [rentalTitle, setRentalTitle] = useState('');
  const [rentalLayout, setRentalLayout] = useState('3 BHK Luxury Apartment');
  const [furnishingStatus, setFurnishingStatus] = useState('Fully Furnished');
  const [monthlyRent, setMonthlyRent] = useState(45000);
  const [securityDepositMonths, setSecurityDepositMonths] = useState(3);
  const [selectedRentalAmenities, setSelectedRentalAmenities] = useState<string[]>([
    'Lift / Elevator',
    'Covered Car Parking',
    '100% Power Backup',
    '24/7 Gated Security & CCTV',
    'High-Speed Gigabit Fiber Ready',
    'Modern Modular Kitchen',
  ]);

  // Category: Curated Experiences
  const [experienceTitle, setExperienceTitle] = useState('');
  const [experienceCategory, setExperienceCategory] = useState('Water Sports & Kayaking');
  const [experienceDuration, setExperienceDuration] = useState('3 Hours');
  const [maxGroupSize, setMaxGroupSize] = useState(8);
  const [pricePerPerson, setPricePerPerson] = useState(2200);
  const [selectedExperienceAmenities, setSelectedExperienceAmenities] = useState<string[]>([
    'Certified Expert Guide / Instructor',
    'Safety Gear & Lifejackets',
    'Snacks, Tea & Hydration',
    'Photos & Drone Footage Included',
    'All Entry Permits & Tickets',
  ]);

  // Real-Time Simulator State
  const [simNights, setSimNights] = useState(16);

  // Toggle helpers
  const toggleItem = (_list: string[], setList: React.Dispatch<React.SetStateAction<string[]>>, item: string) => {
    setList((prev) => (prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]));
  };

  // Earnings estimation calculation
  const calculateEstimatedEarnings = () => {
    switch (selectedCategory) {
      case 'villa':
        return Math.round(nightlyRate * simNights);
      case 'rv':
        return Math.round(rvDailyRate * Math.min(simNights, 22));
      case 'camping':
        return Math.round(campsitePricePerNight * simNights * 3); // assumes average 3 domes/tents
      case 'long_term':
        return Math.round(monthlyRent * 11); // Annual 11-month lease total
      case 'experience':
        return Math.round(pricePerPerson * maxGroupSize * (simNights / 2)); // ~8-10 batches monthly
      default:
        return 150000;
    }
  };

  const getEarningsLabel = () => {
    switch (selectedCategory) {
      case 'villa':
        return `Estimated Monthly Revenue (${simNights} nights occupancy)`;
      case 'rv':
        return `Estimated Monthly Revenue (${Math.min(simNights, 22)} days rented)`;
      case 'camping':
        return `Estimated Monthly Revenue (${simNights} nights across units)`;
      case 'long_term':
        return `Estimated 11-Month Lease Income (Direct Direct Owner Payout)`;
      case 'experience':
        return `Estimated Monthly Earnings (~${Math.round(simNights / 2)} experience slots)`;
      default:
        return 'Estimated Monthly Revenue';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const generatedRef = `SQ-HOST-${Math.floor(100000 + Math.random() * 900000)}`;
    setRefCode(generatedRef);

    let displayPropertyName = propertyName;
    let expectedPrice = Number(nightlyRate);
    let categoryDetails = '';

    if (selectedCategory === 'villa') {
      displayPropertyName = propertyName || 'Boutique Villa Listing';
      expectedPrice = Number(nightlyRate);
      categoryDetails = `Type: ${stayType}, Bedrooms: ${bedrooms}, Bathrooms: ${bathrooms}, Max Guests: ${guestCapacity}, Amenities: ${selectedVillaAmenities.join(', ')}`;
    } else if (selectedCategory === 'rv') {
      displayPropertyName = rvTitle || `${rvMakeModel} Campervan`;
      expectedPrice = Number(rvDailyRate);
      categoryDetails = `Make/Model: ${rvMakeModel}, Transmission: ${rvTransmission}, Fuel: ${rvFuel}, Berths: ${rvBerths}, Driver Option: ${rvDriverOption}, Features: ${selectedRvAmenities.join(', ')}`;
    } else if (selectedCategory === 'camping') {
      displayPropertyName = campsiteName || 'Glamping & Campsite';
      expectedPrice = Number(campsitePricePerNight);
      categoryDetails = `Setting: ${campsiteSetting}, Accommodation: ${campsiteAccommodation}, Total Capacity: ${campsiteCapacity} guests, Amenities: ${selectedCampingAmenities.join(', ')}`;
    } else if (selectedCategory === 'long_term') {
      displayPropertyName = rentalTitle || `${rentalLayout} Long Term Rental`;
      expectedPrice = Number(monthlyRent);
      categoryDetails = `Layout: ${rentalLayout}, Furnishing: ${furnishingStatus}, Monthly Rent: ₹${monthlyRent}, Deposit: ${securityDepositMonths} months, Amenities: ${selectedRentalAmenities.join(', ')}`;
    } else if (selectedCategory === 'experience') {
      displayPropertyName = experienceTitle || 'Curated Experience';
      expectedPrice = Number(pricePerPerson);
      categoryDetails = `Category: ${experienceCategory}, Duration: ${experienceDuration}, Max Group: ${maxGroupSize}, Price/Person: ₹${pricePerPerson}, Inclusions: ${selectedExperienceAmenities.join(', ')}`;
    }

    const newLeadPayload = {
      referenceCode: generatedRef,
      hostName,
      propertyName: displayPropertyName,
      category: selectedCategory,
      city: state ? `${baseCity}, ${state}` : baseCity,
      instagramHandle: instagram.startsWith('@') || instagram.startsWith('http') ? instagram : `@${instagram}`,
      phone,
      email,
      channel: 'WEBSITE_INVITE_FORM',
      status: 'FORM_SUBMITTED',
      expectedPrice,
      notes: `${categoryDetails}. Photo Link: ${photoUrl}. Host Notes: ${notes}`,
      createdAt: new Date().toISOString(),
    };

    // Save to real backend API & local storage backup
    const API_URL = typeof window !== 'undefined' && window.location.hostname === 'localhost'
      ? 'http://localhost:3000/api/v1/host-leads'
      : 'https://stayq-api-608570851336.asia-south1.run.app/api/v1/host-leads';

    try {
      await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newLeadPayload),
      });
    } catch {
      // Offline fallback
    }

    try {
      const existingRaw = localStorage.getItem('stayq_admin_host_leads');
      const existing = existingRaw ? JSON.parse(existingRaw) : [];
      localStorage.setItem('stayq_admin_host_leads', JSON.stringify([newLeadPayload, ...existing]));
    } catch {
      // Ignore
    }

    setIsSubmitting(false);
    setSubmitted(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (submitted) {
    const categoryInfo = CATEGORIES.find((c) => c.id === selectedCategory) || CATEGORIES[0];
    const CategoryIcon = categoryInfo.icon;

    return (
      <div className="shell" style={{ padding: '7.5rem 1.5rem 6rem', maxWidth: '760px', width: '100%' }}>
        <div
          style={{
            background: 'var(--white)',
            borderRadius: '28px',
            border: '1px solid var(--border)',
            padding: '3.5rem 2.5rem',
            textAlign: 'center',
            boxShadow: 'var(--shadow-xl)',
          }}
        >
          <div
            style={{
              width: '76px',
              height: '76px',
              borderRadius: '50%',
              background: 'rgba(18, 183, 106, 0.1)',
              color: '#12b76a',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.5rem',
            }}
          >
            <CheckCircle2 size={44} />
          </div>

          <span
            style={{
              fontSize: '0.8rem',
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: 'var(--violet)',
              background: 'rgba(90, 49, 244, 0.08)',
              padding: '0.35rem 0.9rem',
              borderRadius: '999px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
            }}
          >
            <CategoryIcon size={14} /> {categoryInfo.badge} Application Submitted
          </span>

          <h1 className="h2" style={{ marginTop: '1rem', marginBottom: '0.75rem', fontSize: '1.85rem' }}>
            Welcome to Stay Q, {hostName}!
          </h1>

          <p className="lead" style={{ fontSize: '1.05rem', color: 'var(--gray-600)', marginBottom: '2rem', lineHeight: 1.6 }}>
            We have received your onboarding application for{' '}
            <strong>
              {selectedCategory === 'villa' && (propertyName || 'Boutique Villa')}
              {selectedCategory === 'rv' && (rvTitle || `${rvMakeModel} RV`)}
              {selectedCategory === 'camping' && (campsiteName || 'Glamping Site')}
              {selectedCategory === 'long_term' && (rentalTitle || `${rentalLayout} Long Term Home`)}
              {selectedCategory === 'experience' && (experienceTitle || 'Curated Experience')}
            </strong>{' '}
            in <strong>{baseCity}{state ? `, ${state}` : ''}</strong>. Our host acquisition team is reviewing your listing details and will connect with you via WhatsApp at <strong>{phone}</strong> within 24 hours.
          </p>

          <div
            style={{
              background: 'var(--gray-50)',
              borderRadius: '20px',
              padding: '1.5rem',
              display: 'inline-flex',
              flexDirection: 'column',
              gap: '0.35rem',
              marginBottom: '2.5rem',
              border: '1px solid var(--border)',
              minWidth: '280px',
            }}
          >
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--gray-500)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Host Application Reference
            </span>
            <strong style={{ fontSize: '1.6rem', fontFamily: 'monospace', color: 'var(--ink)', letterSpacing: '0.05em' }}>
              {refCode}
            </strong>
          </div>

          <div
            style={{
              background: 'rgba(90, 49, 244, 0.04)',
              borderRadius: '18px',
              padding: '1.25rem',
              marginBottom: '2.5rem',
              textAlign: 'left',
              border: '1px solid rgba(90, 49, 244, 0.12)',
            }}
          >
            <h4 style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--violet)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <ShieldCheck size={16} /> What Happens Next?
            </h4>
            <ul style={{ fontSize: '0.85rem', color: 'var(--gray-700)', paddingLeft: '1.25rem', margin: 0, lineHeight: 1.6 }}>
              <li>Our curation team verifies your photos, amenities, and location standards.</li>
              <li>You receive your Starhost digital onboarding kit and direct payout setup guide.</li>
              <li>Your listing goes live across the Stay Q web platform and Android mobile app.</li>
            </ul>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <a
              href="#/stays"
              className="btn btn--primary btn--lg"
              onClick={() => {
                window.location.hash = '#/stays';
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            >
              Explore Live Stays &rarr;
            </a>
            <button
              type="button"
              onClick={() => {
                setSubmitted(false);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="btn btn--outline btn--lg"
            >
              Submit Another Listing
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="shell"
      style={{
        padding: '6.5rem 1.25rem 5rem',
        maxWidth: '920px',
        width: '100%',
        margin: '0 auto',
        boxSizing: 'border-box',
      }}
    >
      {/* Hero Header Section */}
      <div style={{ textAlign: 'center', marginBottom: '2.75rem', width: '100%' }}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.45rem 1.15rem',
            background: 'rgba(90, 49, 244, 0.08)',
            color: 'var(--violet)',
            borderRadius: '999px',
            fontSize: '0.85rem',
            fontWeight: 700,
            marginBottom: '1.25rem',
          }}
        >
          <Sparkles size={16} /> Exclusive Host &amp; Partner Invitation
        </div>

        <h1
          className="h1"
          style={{
            marginBottom: '1rem',
            fontSize: 'clamp(1.85rem, 4vw, 2.75rem)',
            lineHeight: 1.2,
            letterSpacing: '-0.02em',
          }}
        >
          Partner with Stay Q &amp; List Your Space or Experience
        </h1>

        <p
          className="lead"
          style={{
            maxWidth: '720px',
            width: '100%',
            margin: '0 auto',
            fontSize: '1.08rem',
            lineHeight: 1.6,
            color: 'var(--gray-600)',
          }}
        >
          Join India's handpicked boutique collection. Whether you host a luxury private villa, off-grid campervan, glamping retreat, 11-month long-term home, or guided local experience — welcome verified guests with direct automated payouts.
        </p>

        {/* Dynamic Category Selector Tabs */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
            gap: '0.75rem',
            marginTop: '2.5rem',
            width: '100%',
          }}
        >
          {CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            const Icon = cat.icon;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  textAlign: 'center',
                  padding: '1.15rem 0.85rem',
                  borderRadius: '20px',
                  border: isSelected
                    ? '2px solid var(--violet)'
                    : '1.5px solid var(--border)',
                  background: isSelected
                    ? 'linear-gradient(135deg, rgba(90, 49, 244, 0.08) 0%, rgba(90, 49, 244, 0.02) 100%)'
                    : 'var(--white)',
                  boxShadow: isSelected
                    ? '0 8px 20px rgba(90, 49, 244, 0.12)'
                    : 'var(--shadow-sm)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
              >
                <div
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '12px',
                    background: isSelected ? 'var(--violet)' : 'var(--gray-100)',
                    color: isSelected ? '#ffffff' : 'var(--gray-700)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '0.65rem',
                  }}
                >
                  <Icon size={22} />
                </div>
                <strong
                  style={{
                    fontSize: '0.9rem',
                    color: isSelected ? 'var(--violet)' : 'var(--ink)',
                    marginBottom: '0.2rem',
                  }}
                >
                  {cat.title}
                </strong>
                <span
                  style={{
                    fontSize: '0.72rem',
                    color: 'var(--gray-500)',
                    lineHeight: 1.3,
                  }}
                >
                  {cat.subtitle}
                </span>
              </button>
            );
          })}
        </div>

        {/* Real-Time Category Revenue Simulator */}
        <div
          style={{
            marginTop: '2rem',
            padding: '2rem',
            background: 'linear-gradient(135deg, #FAF5FF 0%, #EDE9FE 100%)',
            borderRadius: '24px',
            border: '1.5px solid rgba(90, 49, 244, 0.25)',
            textAlign: 'left',
            boxShadow: '0 12px 32px rgba(90, 49, 244, 0.08)',
            width: '100%',
            boxSizing: 'border-box',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '0.75rem',
              marginBottom: '1rem',
            }}
          >
            <span
              style={{
                fontSize: '0.75rem',
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: 'var(--violet)',
                background: 'rgba(90, 49, 244, 0.1)',
                padding: '0.35rem 0.85rem',
                borderRadius: '12px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
              }}
            >
              <Zap size={13} /> Host Earnings Simulator
            </span>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#12b76a', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
              <ShieldCheck size={14} /> Direct Automated Bank Payouts
            </span>
          </div>

          <div style={{ textAlign: 'center', margin: '1.25rem 0' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--gray-600)', fontWeight: 600 }}>
              {getEarningsLabel()}
            </span>
            <h2
              style={{
                fontSize: 'clamp(2.2rem, 5vw, 3rem)',
                fontWeight: 900,
                color: '#2E1065',
                margin: '0.25rem 0',
                letterSpacing: '-0.03em',
              }}
            >
              ₹{calculateEstimatedEarnings().toLocaleString('en-IN')}
            </h2>
            <p style={{ fontSize: '0.82rem', color: 'var(--gray-500)', margin: 0 }}>
              {selectedCategory === 'villa' && `at ₹${nightlyRate.toLocaleString('en-IN')} / night`}
              {selectedCategory === 'rv' && `at ₹${rvDailyRate.toLocaleString('en-IN')} / day rental`}
              {selectedCategory === 'camping' && `at ₹${campsitePricePerNight.toLocaleString('en-IN')} / dome night`}
              {selectedCategory === 'long_term' && `at ₹${monthlyRent.toLocaleString('en-IN')} / month direct tenancy`}
              {selectedCategory === 'experience' && `at ₹${pricePerPerson.toLocaleString('en-IN')} / person (group of ${maxGroupSize})`}
            </p>
          </div>

          {selectedCategory !== 'long_term' && (
            <div style={{ marginTop: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--gray-700)' }}>
                  Simulated Monthly Bookings / Occupancy
                </span>
                <span style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--violet)' }}>
                  {simNights} {selectedCategory === 'experience' ? 'slots' : 'days/nights'}
                </span>
              </div>
              <input
                type="range"
                min="4"
                max="28"
                value={simNights}
                onChange={(e) => setSimNights(Number(e.target.value))}
                style={{ width: '100%', accentColor: 'var(--violet)', cursor: 'pointer' }}
              />
            </div>
          )}
        </div>
      </div>

      {/* Main Host Invitation & Onboarding Application Form */}
      <form
        onSubmit={handleSubmit}
        style={{
          background: 'var(--white)',
          borderRadius: '28px',
          border: '1px solid var(--border)',
          padding: 'clamp(1.5rem, 4vw, 2.75rem)',
          boxShadow: 'var(--shadow-lg)',
          display: 'flex',
          flexDirection: 'column',
          gap: '2.25rem',
          width: '100%',
          boxSizing: 'border-box',
        }}
      >
        {/* Section 1: Host & Contact Details */}
        <div>
          <h3
            style={{
              fontSize: '1.2rem',
              fontWeight: 800,
              marginBottom: '1.25rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              color: 'var(--ink)',
            }}
          >
            <Phone size={20} style={{ color: 'var(--violet)' }} />
            1. Host &amp; Contact Details
          </h3>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: '1rem',
            }}
          >
            <div className="checkout-input-group">
              <label>Your Full Name *</label>
              <input
                type="text"
                required
                value={hostName}
                onChange={(e) => setHostName(e.target.value)}
                placeholder="e.g. Vikram Malhotra"
              />
            </div>

            <div className="checkout-input-group">
              <label>WhatsApp Phone Number *</label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98765 43210"
              />
            </div>

            <div className="checkout-input-group">
              <label>Email Address *</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="host@domain.com"
              />
            </div>

            <div className="checkout-input-group">
              <label>Instagram Handle / Website *</label>
              <input
                type="text"
                required
                value={instagram}
                onChange={(e) => setInstagram(e.target.value)}
                placeholder="@my_stay or URL"
              />
            </div>

            <div className="checkout-input-group">
              <label>City / Location *</label>
              <input
                type="text"
                required
                value={baseCity}
                onChange={(e) => setBaseCity(e.target.value)}
                placeholder="e.g. Goa, Manali, Bengaluru, Udaipur"
              />
            </div>

            <div className="checkout-input-group">
              <label>State / Region</label>
              <input
                type="text"
                value={state}
                onChange={(e) => setState(e.target.value)}
                placeholder="e.g. Goa, Himachal Pradesh, Karnataka"
              />
            </div>
          </div>
        </div>

        <div style={{ height: '1px', background: 'var(--border)' }} />

        {/* Section 2: Dynamic Category-Specific Specifications */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <h3
              style={{
                fontSize: '1.2rem',
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                color: 'var(--ink)',
                margin: 0,
              }}
            >
              {selectedCategory === 'villa' && <Home size={20} style={{ color: 'var(--violet)' }} />}
              {selectedCategory === 'rv' && <Truck size={20} style={{ color: 'var(--violet)' }} />}
              {selectedCategory === 'camping' && <Tent size={20} style={{ color: 'var(--violet)' }} />}
              {selectedCategory === 'long_term' && <Building size={20} style={{ color: 'var(--violet)' }} />}
              {selectedCategory === 'experience' && <Compass size={20} style={{ color: 'var(--violet)' }} />}
              2. {CATEGORIES.find((c) => c.id === selectedCategory)?.title} Specifications
            </h3>
            <span
              style={{
                fontSize: '0.75rem',
                fontWeight: 800,
                color: 'var(--violet)',
                background: 'rgba(90, 49, 244, 0.08)',
                padding: '0.25rem 0.75rem',
                borderRadius: '8px',
              }}
            >
              Category: {CATEGORIES.find((c) => c.id === selectedCategory)?.badge}
            </span>
          </div>

          {/* Category Mode 1: Villas & Stays */}
          {selectedCategory === 'villa' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                  gap: '1rem',
                }}
              >
                <div className="checkout-input-group" style={{ gridColumn: '1 / -1' }}>
                  <label>Property Name / Title *</label>
                  <input
                    type="text"
                    required
                    value={propertyName}
                    onChange={(e) => setPropertyName(e.target.value)}
                    placeholder="e.g. The Heritage Glass Villa & Private Infinity Pool"
                  />
                </div>

                <div className="checkout-input-group">
                  <label>Stay Type *</label>
                  <select value={stayType} onChange={(e) => setStayType(e.target.value)}>
                    <option value="Luxury Villa">Luxury Private Villa</option>
                    <option value="Mountain Cabin">Himalayan Mountain Cabin</option>
                    <option value="Beachfront Cottage">Beachfront Villa / Cottage</option>
                    <option value="Heritage Haveli">Heritage Mansion / Haveli</option>
                    <option value="Rainforest Treehouse">Rainforest Treehouse</option>
                    <option value="Coffee Estate Homestay">Plantation Estate Homestay</option>
                  </select>
                </div>

                <div className="checkout-input-group">
                  <label>Expected Nightly Rate (₹) *</label>
                  <input
                    type="number"
                    required
                    min={1000}
                    value={nightlyRate}
                    onChange={(e) => setNightlyRate(Number(e.target.value))}
                  />
                </div>

                <div className="checkout-input-group">
                  <label>Max Guests Capacity</label>
                  <input
                    type="number"
                    min={1}
                    value={guestCapacity}
                    onChange={(e) => setGuestCapacity(Number(e.target.value))}
                  />
                </div>

                <div className="checkout-input-group">
                  <label>Bedrooms Count</label>
                  <input
                    type="number"
                    min={1}
                    value={bedrooms}
                    onChange={(e) => setBedrooms(Number(e.target.value))}
                  />
                </div>

                <div className="checkout-input-group">
                  <label>Bathrooms Count</label>
                  <input
                    type="number"
                    min={1}
                    value={bathrooms}
                    onChange={(e) => setBathrooms(Number(e.target.value))}
                  />
                </div>
              </div>

              {/* 25 Official Stay Q Amenities */}
              <div>
                <label style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--gray-700)', display: 'block', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Select Property Amenities ({VILLA_AMENITIES.length} Official Stay Q Standards)
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '0.5rem' }}>
                  {VILLA_AMENITIES.map((item) => {
                    const isChecked = selectedVillaAmenities.includes(item);
                    return (
                      <button
                        key={item}
                        type="button"
                        onClick={() => toggleItem(selectedVillaAmenities, setSelectedVillaAmenities, item)}
                        style={{
                          padding: '0.6rem 0.85rem',
                          borderRadius: '12px',
                          border: `1.5px solid ${isChecked ? 'var(--violet)' : 'var(--border)'}`,
                          background: isChecked ? 'rgba(90, 49, 244, 0.08)' : 'var(--white)',
                          color: isChecked ? 'var(--violet)' : 'var(--ink)',
                          fontSize: '0.82rem',
                          fontWeight: isChecked ? 700 : 500,
                          textAlign: 'left',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        <span>{item}</span>
                        {isChecked && <Check size={14} style={{ color: 'var(--violet)', strokeWidth: 3 }} />}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Category Mode 2: RVs & Campervans */}
          {selectedCategory === 'rv' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                  gap: '1rem',
                }}
              >
                <div className="checkout-input-group" style={{ gridColumn: '1 / -1' }}>
                  <label>RV / Campervan Title *</label>
                  <input
                    type="text"
                    required
                    value={rvTitle}
                    onChange={(e) => setRvTitle(e.target.value)}
                    placeholder="e.g. Overland 4x4 Cruiser with Rooftop Tent & Shower"
                  />
                </div>

                <div className="checkout-input-group">
                  <label>Vehicle Make &amp; Model *</label>
                  <input
                    type="text"
                    required
                    value={rvMakeModel}
                    onChange={(e) => setRvMakeModel(e.target.value)}
                    placeholder="e.g. Force Urbania Luxe / Isuzu D-Max / Caravan"
                  />
                </div>

                <div className="checkout-input-group">
                  <label>Transmission *</label>
                  <select value={rvTransmission} onChange={(e) => setRvTransmission(e.target.value)}>
                    <option value="Automatic">Automatic Transmission</option>
                    <option value="Manual">Manual Transmission</option>
                  </select>
                </div>

                <div className="checkout-input-group">
                  <label>Fuel Type *</label>
                  <select value={rvFuel} onChange={(e) => setRvFuel(e.target.value)}>
                    <option value="Diesel">Diesel</option>
                    <option value="Petrol">Petrol</option>
                    <option value="Electric">Electric / Hybrid</option>
                  </select>
                </div>

                <div className="checkout-input-group">
                  <label>Sleeping Berths (Capacity) *</label>
                  <select value={rvBerths} onChange={(e) => setRvBerths(Number(e.target.value))}>
                    <option value={2}>2 Adults (Compact Van)</option>
                    <option value={4}>4 Persons (Family Camper)</option>
                    <option value={6}>6 Persons (Full Motorhome)</option>
                  </select>
                </div>

                <div className="checkout-input-group">
                  <label>Driver / Rental Mode *</label>
                  <select value={rvDriverOption} onChange={(e) => setRvDriverOption(e.target.value)}>
                    <option value="Self-Drive & Chauffeur Available">Both Self-Drive &amp; Chauffeur Available</option>
                    <option value="Self-Drive Only">Self-Drive Only (Verified License)</option>
                    <option value="Dedicated Chauffeur Included">Dedicated Chauffeur Included Only</option>
                  </select>
                </div>

                <div className="checkout-input-group">
                  <label>Expected Daily Rental Rate (₹/day) *</label>
                  <input
                    type="number"
                    required
                    min={2000}
                    value={rvDailyRate}
                    onChange={(e) => setRvDailyRate(Number(e.target.value))}
                  />
                </div>
              </div>

              {/* RV Amenities */}
              <div>
                <label style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--gray-700)', display: 'block', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Select RV &amp; Overlanding Features
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '0.5rem' }}>
                  {RV_AMENITIES.map((item) => {
                    const isChecked = selectedRvAmenities.includes(item);
                    return (
                      <button
                        key={item}
                        type="button"
                        onClick={() => toggleItem(selectedRvAmenities, setSelectedRvAmenities, item)}
                        style={{
                          padding: '0.6rem 0.85rem',
                          borderRadius: '12px',
                          border: `1.5px solid ${isChecked ? 'var(--violet)' : 'var(--border)'}`,
                          background: isChecked ? 'rgba(90, 49, 244, 0.08)' : 'var(--white)',
                          color: isChecked ? 'var(--violet)' : 'var(--ink)',
                          fontSize: '0.82rem',
                          fontWeight: isChecked ? 700 : 500,
                          textAlign: 'left',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        <span>{item}</span>
                        {isChecked && <Check size={14} style={{ color: 'var(--violet)', strokeWidth: 3 }} />}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Category Mode 3: Camping & Glamping */}
          {selectedCategory === 'camping' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                  gap: '1rem',
                }}
              >
                <div className="checkout-input-group" style={{ gridColumn: '1 / -1' }}>
                  <label>Campsite Name &amp; Title *</label>
                  <input
                    type="text"
                    required
                    value={campsiteName}
                    onChange={(e) => setCampsiteName(e.target.value)}
                    placeholder="e.g. Whispering Pines Glamping Domes & Stargazing Camp"
                  />
                </div>

                <div className="checkout-input-group">
                  <label>Natural Setting *</label>
                  <select value={campsiteSetting} onChange={(e) => setCampsiteSetting(e.target.value)}>
                    <option value="Riverside & Pine Forest">Riverside &amp; Pine Forest</option>
                    <option value="Mountain Peak & Valley View">Mountain Peak &amp; Valley View</option>
                    <option value="Coffee / Tea Estate">Coffee / Tea Plantation Grounds</option>
                    <option value="Desert Dunes & Oasis">Desert Dunes &amp; Oasis</option>
                    <option value="Lakeside & Beachfront">Lakeside &amp; Coastal Camp</option>
                  </select>
                </div>

                <div className="checkout-input-group">
                  <label>Accommodation Structure *</label>
                  <select value={campsiteAccommodation} onChange={(e) => setCampsiteAccommodation(e.target.value)}>
                    <option value="Geodesic Glamping Dome">Geodesic Glamping Dome</option>
                    <option value="Swiss Luxury Safari Tent">Swiss Luxury Safari Tent</option>
                    <option value="A-Frame Wooden Pod">A-Frame Wooden Pod</option>
                    <option value="BYOT & Pitched Camping">BYOT (Bring Your Own Tent) &amp; Pitched Tents</option>
                  </select>
                </div>

                <div className="checkout-input-group">
                  <label>Total Max Camper Capacity *</label>
                  <input
                    type="number"
                    required
                    min={2}
                    value={campsiteCapacity}
                    onChange={(e) => setCampsiteCapacity(Number(e.target.value))}
                  />
                </div>

                <div className="checkout-input-group">
                  <label>Price per Dome / Tent Night (₹) *</label>
                  <input
                    type="number"
                    required
                    min={500}
                    value={campsitePricePerNight}
                    onChange={(e) => setCampsitePricePerNight(Number(e.target.value))}
                  />
                </div>
              </div>

              {/* Camping Amenities */}
              <div>
                <label style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--gray-700)', display: 'block', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Select Campsite Facilities &amp; Activities
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '0.5rem' }}>
                  {CAMPING_AMENITIES.map((item) => {
                    const isChecked = selectedCampingAmenities.includes(item);
                    return (
                      <button
                        key={item}
                        type="button"
                        onClick={() => toggleItem(selectedCampingAmenities, setSelectedCampingAmenities, item)}
                        style={{
                          padding: '0.6rem 0.85rem',
                          borderRadius: '12px',
                          border: `1.5px solid ${isChecked ? 'var(--violet)' : 'var(--border)'}`,
                          background: isChecked ? 'rgba(90, 49, 244, 0.08)' : 'var(--white)',
                          color: isChecked ? 'var(--violet)' : 'var(--ink)',
                          fontSize: '0.82rem',
                          fontWeight: isChecked ? 700 : 500,
                          textAlign: 'left',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        <span>{item}</span>
                        {isChecked && <Check size={14} style={{ color: 'var(--violet)', strokeWidth: 3 }} />}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Category Mode 4: 11-Month Long-Term Rentals (Zero Brokerage) */}
          {selectedCategory === 'long_term' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                  gap: '1rem',
                }}
              >
                <div className="checkout-input-group" style={{ gridColumn: '1 / -1' }}>
                  <label>Property / Residence Title *</label>
                  <input
                    type="text"
                    required
                    value={rentalTitle}
                    onChange={(e) => setRentalTitle(e.target.value)}
                    placeholder="e.g. Prestige High Fields 3BHK Penthouse & Terrace Garden"
                  />
                </div>

                <div className="checkout-input-group">
                  <label>Unit Configuration *</label>
                  <select value={rentalLayout} onChange={(e) => setRentalLayout(e.target.value)}>
                    <option value="1 BHK Studio Apartment">1 BHK Studio Apartment</option>
                    <option value="2 BHK Modern Residence">2 BHK Modern Residence</option>
                    <option value="3 BHK Luxury Apartment">3 BHK Luxury Apartment</option>
                    <option value="4 BHK Penthouse / Duplex">4 BHK Penthouse / Duplex</option>
                    <option value="Independent Villa / Floor">Independent Villa / Gated Floor</option>
                  </select>
                </div>

                <div className="checkout-input-group">
                  <label>Furnishing Status *</label>
                  <select value={furnishingStatus} onChange={(e) => setFurnishingStatus(e.target.value)}>
                    <option value="Fully Furnished">Fully Furnished (Designer Furniture &amp; Appliances)</option>
                    <option value="Semi-Furnished">Semi-Furnished (Wardrobes, Modular Kitchen &amp; Lights)</option>
                    <option value="Unfurnished">Unfurnished</option>
                  </select>
                </div>

                <div className="checkout-input-group">
                  <label>Expected Monthly Rent (₹/month) *</label>
                  <input
                    type="number"
                    required
                    min={5000}
                    value={monthlyRent}
                    onChange={(e) => setMonthlyRent(Number(e.target.value))}
                  />
                </div>

                <div className="checkout-input-group">
                  <label>Security Deposit (Months) *</label>
                  <select
                    value={securityDepositMonths}
                    onChange={(e) => setSecurityDepositMonths(Number(e.target.value))}
                  >
                    <option value={2}>2 Months Rent Deposit</option>
                    <option value={3}>3 Months Rent Deposit</option>
                    <option value={5}>5 Months Rent Deposit</option>
                  </select>
                </div>
              </div>

              {/* Long Term Amenities */}
              <div>
                <label style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--gray-700)', display: 'block', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Select Residence &amp; Society Features
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '0.5rem' }}>
                  {LONG_TERM_AMENITIES.map((item) => {
                    const isChecked = selectedRentalAmenities.includes(item);
                    return (
                      <button
                        key={item}
                        type="button"
                        onClick={() => toggleItem(selectedRentalAmenities, setSelectedRentalAmenities, item)}
                        style={{
                          padding: '0.6rem 0.85rem',
                          borderRadius: '12px',
                          border: `1.5px solid ${isChecked ? 'var(--violet)' : 'var(--border)'}`,
                          background: isChecked ? 'rgba(90, 49, 244, 0.08)' : 'var(--white)',
                          color: isChecked ? 'var(--violet)' : 'var(--ink)',
                          fontSize: '0.82rem',
                          fontWeight: isChecked ? 700 : 500,
                          textAlign: 'left',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        <span>{item}</span>
                        {isChecked && <Check size={14} style={{ color: 'var(--violet)', strokeWidth: 3 }} />}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Category Mode 5: Curated Experiences */}
          {selectedCategory === 'experience' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                  gap: '1rem',
                }}
              >
                <div className="checkout-input-group" style={{ gridColumn: '1 / -1' }}>
                  <label>Experience Title *</label>
                  <input
                    type="text"
                    required
                    value={experienceTitle}
                    onChange={(e) => setExperienceTitle(e.target.value)}
                    placeholder="e.g. Sunset Mangrove Kayaking & Bioluminescence Night Trail"
                  />
                </div>

                <div className="checkout-input-group">
                  <label>Activity Category *</label>
                  <select value={experienceCategory} onChange={(e) => setExperienceCategory(e.target.value)}>
                    <option value="Water Sports & Kayaking">Water Sports, Kayaking &amp; Surfing</option>
                    <option value="Hiking & Alpine Treks">Hiking, Alpine Treks &amp; Camping</option>
                    <option value="Culinary Trail & Cooking">Culinary Walks &amp; Local Feast</option>
                    <option value="Heritage & Architectural Walk">Heritage, Architecture &amp; History</option>
                    <option value="Wildlife Safari & Birding">Wildlife Safari &amp; Nature Walks</option>
                    <option value="Stargazing & Astrophotography">Stargazing &amp; Astrophotography</option>
                    <option value="Yoga & Wellness Retreat">Yoga, Meditation &amp; Sound Healing</option>
                  </select>
                </div>

                <div className="checkout-input-group">
                  <label>Duration *</label>
                  <select value={experienceDuration} onChange={(e) => setExperienceDuration(e.target.value)}>
                    <option value="2 Hours">2 Hours</option>
                    <option value="3 Hours">3 Hours (Half-Day Session)</option>
                    <option value="Full Day (6-8 Hours)">Full Day (6-8 Hours)</option>
                    <option value="2 Days Weekend">2 Days Weekend Immersion</option>
                  </select>
                </div>

                <div className="checkout-input-group">
                  <label>Max Group Capacity per Slot *</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={maxGroupSize}
                    onChange={(e) => setMaxGroupSize(Number(e.target.value))}
                  />
                </div>

                <div className="checkout-input-group">
                  <label>Price per Person (₹) *</label>
                  <input
                    type="number"
                    required
                    min={200}
                    value={pricePerPerson}
                    onChange={(e) => setPricePerPerson(Number(e.target.value))}
                  />
                </div>
              </div>

              {/* Experience Inclusions */}
              <div>
                <label style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--gray-700)', display: 'block', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Select Inclusions &amp; Safety Standards
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '0.5rem' }}>
                  {EXPERIENCE_AMENITIES.map((item) => {
                    const isChecked = selectedExperienceAmenities.includes(item);
                    return (
                      <button
                        key={item}
                        type="button"
                        onClick={() => toggleItem(selectedExperienceAmenities, setSelectedExperienceAmenities, item)}
                        style={{
                          padding: '0.6rem 0.85rem',
                          borderRadius: '12px',
                          border: `1.5px solid ${isChecked ? 'var(--violet)' : 'var(--border)'}`,
                          background: isChecked ? 'rgba(90, 49, 244, 0.08)' : 'var(--white)',
                          color: isChecked ? 'var(--violet)' : 'var(--ink)',
                          fontSize: '0.82rem',
                          fontWeight: isChecked ? 700 : 500,
                          textAlign: 'left',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        <span>{item}</span>
                        {isChecked && <Check size={14} style={{ color: 'var(--violet)', strokeWidth: 3 }} />}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        <div style={{ height: '1px', background: 'var(--border)' }} />

        {/* Section 3: Photo Link & Notes */}
        <div>
          <h3
            style={{
              fontSize: '1.2rem',
              fontWeight: 800,
              marginBottom: '1.25rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              color: 'var(--ink)',
            }}
          >
            <Camera size={20} style={{ color: 'var(--violet)' }} />
            3. Photos, Portfolio &amp; Special Highlights
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="checkout-input-group">
              <label>Photo Link / Google Drive / Cloudinary / Social URL *</label>
              <input
                type="text"
                required
                value={photoUrl}
                onChange={(e) => setPhotoUrl(e.target.value)}
                placeholder="Paste link to Google Drive folder, Instagram post, or portfolio"
              />
            </div>

            <div className="checkout-input-group">
              <label>Additional Notes or Highlights</label>
              <textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Tell us about the architecture, sunset views, private chef, seasonal availability, or anything special..."
              />
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="btn btn--primary btn--block btn--lg"
            style={{
              padding: '1.15rem 1.5rem',
              fontSize: '1.05rem',
              fontWeight: 800,
              borderRadius: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.65rem',
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              opacity: isSubmitting ? 0.7 : 1,
            }}
          >
            <Send size={18} />
            <span>{isSubmitting ? 'Submitting Application...' : 'Submit Listing for Host Onboarding'}</span>
          </button>

          <p
            style={{
              fontSize: '0.78rem',
              color: 'var(--gray-500)',
              textAlign: 'center',
              marginTop: '0.85rem',
              lineHeight: 1.5,
            }}
          >
            By submitting, you agree to Stay Q's Host Community Guidelines and ID-verification standards. Our partner onboarding desk will review and contact you within 24 hours.
          </p>
        </div>
      </form>
    </div>
  );
};
