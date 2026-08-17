import { Stay, Experience, Booking, BookingQuote, SearchFilters, UserProfile } from '../types';
import { auth } from './firebase';

const API_BASE_URL = typeof window !== 'undefined' && window.location.hostname === 'localhost'
  ? 'http://localhost:3000/api/v1'
  : (typeof window !== 'undefined' && window.location.hostname.endsWith('stayq.in')
      ? 'https://api.stayq.in/api/v1'
      : 'https://stayq-api-608570851336.asia-south1.run.app/api/v1');

async function getAuthHeaders(): Promise<Record<string, string>> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };
  try {
    const currentUser = auth.currentUser;
    if (currentUser) {
      const token = await currentUser.getIdToken();
      headers['Authorization'] = `Bearer ${token}`;
    }
  } catch {
    // Proceed without token if unavailable
  }
  return headers;
}

export async function syncProfileWithBackend(firebaseUser: { uid: string; displayName?: string | null; email?: string | null; phoneNumber?: string | null; photoURL?: string | null }): Promise<UserProfile> {
  const idToken = await auth.currentUser?.getIdToken();
  const payload = {
    firstName: firebaseUser.displayName?.split(' ')[0] || 'Stay Q',
    lastName: firebaseUser.displayName?.split(' ').slice(1).join(' ') || 'Traveler',
    email: firebaseUser.email || `${firebaseUser.uid}@stayq.space`,
    phone: firebaseUser.phoneNumber || undefined,
    avatarUrl: firebaseUser.photoURL || '/images/avatar_alex.jpg',
  };

  try {
    const res = await fetch(`${API_BASE_URL}/auth/sync-profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${idToken}`,
      },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      const data = await res.json();
      return {
        id: data.id || firebaseUser.uid,
        name: `${data.firstName || ''} ${data.lastName || ''}`.trim() || firebaseUser.displayName || 'Traveler',
        email: data.email || firebaseUser.email || '',
        phone: data.phone || firebaseUser.phoneNumber || undefined,
        avatarUrl: data.avatarUrl || firebaseUser.photoURL || '/images/avatar_alex.jpg',
      };
    }
  } catch {
    // Return formatted user profile
  }

  return {
    id: firebaseUser.uid,
    name: firebaseUser.displayName || 'Stay Q Traveler',
    email: firebaseUser.email || '',
    phone: firebaseUser.phoneNumber || undefined,
    avatarUrl: firebaseUser.photoURL || '/images/avatar_alex.jpg',
  };
}

export const CURATED_STAYS: Stay[] = [
  {
    id: 'stay-1',
    title: 'The Glass Pavilion & Private Infinity Pool',
    location: 'Candolim, North Goa',
    city: 'Goa',
    state: 'Goa',
    pricePerNight: 14500,
    rating: 4.96,
    reviewCount: 128,
    imageUrls: ['/images/villa_1.jpg', '/images/beach_1.jpg', '/images/glass_1.jpg'],
    category: 'Villas',
    propertyType: 'STAY',
    hostName: 'Aarav Mehta',
    hostAvatar: '/images/avatar_alex.jpg',
    isGuestFavorite: true,
    isSuperhost: true,
    isFeatured: true,
    amenities: ['Private Pool', 'High-Speed Wi-Fi', 'Chef on Demand', 'Air Conditioning', 'Free Parking', 'Kitchen', 'Ocean View'],
    tags: ['Luxury', 'Pool', 'Near Beach'],
    description: 'An architectural marvel perched amidst coconut groves with 180° uninterrupted sunset views. Features private infinity pool, double-height glass living room, and bespoke butler service.',
    lat: 15.518,
    lng: 73.763,
    maxGuests: 8,
    bedrooms: 3,
    beds: 4,
    baths: 3,
  },
  {
    id: 'stay-2',
    title: 'Pine & Cedar Scandinavian A-Frame Cabin',
    location: 'Old Manali, Himachal Pradesh',
    city: 'Manali',
    state: 'Himachal Pradesh',
    pricePerNight: 6200,
    rating: 4.92,
    reviewCount: 94,
    imageUrls: ['/images/cabin_1.jpg', '/images/nordic_1.jpg', '/images/glass_1.jpg'],
    category: 'Cabins',
    propertyType: 'STAY',
    hostName: 'Devika Sharma',
    hostAvatar: '/images/avatar_elena.jpg',
    isGuestFavorite: true,
    isSuperhost: true,
    amenities: ['Fireplace', 'Heated Bedding', 'Mountain View', 'Wi-Fi 100Mbps', 'Bonfire Pit', 'Kitchenette', 'Pet Friendly'],
    tags: ['Mountains', 'Cozy', 'Snow View'],
    description: 'Immerse in nature surrounded by ancient deodar forests. Handcrafted timber cabin with floor-to-ceiling glass, wood-burning stove, and sunrise coffee balcony.',
    lat: 32.259,
    lng: 77.174,
    maxGuests: 4,
    bedrooms: 2,
    beds: 2,
    baths: 2,
  },
  {
    id: 'stay-3',
    title: 'Azure Horizon Beachfront Villa with Private Deck',
    location: 'Palolem Beach, South Goa',
    city: 'Goa',
    state: 'Goa',
    pricePerNight: 11800,
    rating: 4.88,
    reviewCount: 160,
    imageUrls: ['/images/beach_1.jpg', '/images/villa_1.jpg', '/images/suite_1.jpg'],
    category: 'Beachfront',
    propertyType: 'STAY',
    hostName: 'Rohan Fernandes',
    hostAvatar: '/images/avatar_rohan.jpg',
    isSuperhost: true,
    amenities: ['Direct Beach Access', 'Sunset Deck', 'Hammocks', 'Wi-Fi', 'Air Conditioning', 'Breakfast Included'],
    tags: ['Beachfront', 'Romantic', 'Secluded'],
    description: 'Step directly from your private sun deck onto soft golden sand. Fall asleep to the rhythmic ocean waves and enjoy bespoke tropical cocktails at dusk.',
    lat: 15.010,
    lng: 74.023,
    maxGuests: 6,
    bedrooms: 2,
    beds: 3,
    baths: 2,
  },
  {
    id: 'stay-4',
    title: 'The Bohemian Cloud Treehouse & Canopy Spa',
    location: 'Wayanad Rainforest, Kerala',
    city: 'Wayanad',
    state: 'Kerala',
    pricePerNight: 8500,
    rating: 4.95,
    reviewCount: 76,
    imageUrls: ['/images/glass_1.jpg', '/images/cabin_1.jpg', '/images/nordic_1.jpg'],
    category: 'Treehouses',
    propertyType: 'STAY',
    hostName: 'Ananya Nair',
    hostAvatar: '/images/avatar_sophia.jpg',
    isGuestFavorite: true,
    isFeatured: true,
    amenities: ['Canopy Jacuzzi', 'Organic Breakfast', 'Guided Plantation Walk', 'Bird Watching Kit', 'Wi-Fi', 'Balcony'],
    tags: ['Rainforest', 'Treehouse', 'Eco Stay'],
    description: 'Suspended 45 feet above ground level in pristine cardamom hills. Crafted from bamboo and treated pine with wrap-around balcony overlooking morning mist.',
    lat: 11.685,
    lng: 76.132,
    maxGuests: 2,
    bedrooms: 1,
    beds: 1,
    baths: 1,
  },
  {
    id: 'stay-5',
    title: 'The Nomad Cruiser — Luxury 4x4 Campervan',
    location: 'Leh & Ladakh Circuit, Ladakh',
    city: 'Leh',
    state: 'Ladakh',
    pricePerNight: 7900,
    rating: 4.97,
    reviewCount: 52,
    imageUrls: ['/images/nordic_1.jpg', '/images/cabin_1.jpg', '/images/glass_1.jpg'],
    category: 'RVs',
    propertyType: 'RV',
    hostName: 'Tashi Dorje',
    hostAvatar: '/images/avatar_jean.jpg',
    isSuperhost: true,
    amenities: ['Solar Power', 'Kitchen', 'Hot water', 'Workspace', 'Power backup', 'Heating', 'GPS Tracker'],
    tags: ['RV', 'Offgrid', 'Adventure', '4x4 AWD'],
    description: 'Fully equipped overland exploration vehicle. Sleep beneath the Milky Way at Pangong Tso or Nubra Valley with full autonomy and heated sleeping quarters.',
    lat: 34.1526,
    lng: 77.5771,
    maxGuests: 3,
    bedrooms: 1,
    beds: 2,
    baths: 1,
  },
  {
    id: 'stay-6',
    title: 'Starry Ridge Alpine Glamping Dome',
    location: 'Kanatal, Uttarakhand',
    city: 'Mussoorie',
    state: 'Uttarakhand',
    pricePerNight: 4800,
    rating: 4.89,
    reviewCount: 115,
    imageUrls: ['/images/cabin_1.jpg', '/images/glass_1.jpg', '/images/villa_1.jpg'],
    category: 'Camping',
    propertyType: 'CAMPING_SITE',
    hostName: 'Vikram Rawat',
    hostAvatar: '/images/avatar_alex.jpg',
    isGuestFavorite: true,
    amenities: ['Heating', 'Hot water', 'Parking', 'Garden', 'Balcony', 'Security', 'Stargazing Telescope'],
    tags: ['Glamping', 'Stargazing', 'Bonfire', 'Mountain View'],
    description: 'Panoramic geodesic dome facing the snow-capped Garhwal Himalayas. Includes stargazing telescope, gourmet barbecue dinner, and morning mountain yoga session.',
    lat: 30.4159,
    lng: 78.3418,
    maxGuests: 3,
    bedrooms: 1,
    beds: 2,
    baths: 1,
  },
  {
    id: 'stay-7',
    title: 'Nordic Minimalist Loft — Zero Brokerage',
    location: 'Indiranagar 100ft Road, Bengaluru',
    city: 'Bengaluru',
    state: 'Karnataka',
    pricePerNight: 3200,
    rating: 4.91,
    reviewCount: 68,
    imageUrls: ['/images/suite_1.jpg', '/images/glass_1.jpg', '/images/villa_1.jpg'],
    category: 'Zero Broker',
    propertyType: 'ZERO_BROKER',
    isZeroBroker: true,
    depositAmount: 50000,
    leaseTerm: '1 - 11 Months Flexible',
    hostName: 'Sanjay Krishnan',
    hostAvatar: '/images/avatar_rohan.jpg',
    isFeatured: true,
    amenities: ['Zero Brokerage Fee', 'Furnished by West Elm', 'Gigabit Fiber', 'Smart Lock Access', 'Gym in Building', 'Work Desk'],
    tags: ['Zero Broker', 'Workation', 'City Center'],
    description: 'Direct owner listing with absolutely zero middleman fee. Fully furnished loft apartment with dedicated standing desk, high speed internet, and verified lease contract.',
    lat: 12.971,
    lng: 77.641,
    maxGuests: 2,
    bedrooms: 1,
    beds: 1,
    baths: 1,
  },
  {
    id: 'stay-8',
    title: 'Heritage Haveli Suite with Lake Pichola View',
    location: 'Old City, Udaipur',
    city: 'Udaipur',
    state: 'Rajasthan',
    pricePerNight: 9500,
    rating: 4.98,
    reviewCount: 142,
    imageUrls: ['/images/suite_1.jpg', '/images/villa_1.jpg', '/images/beach_1.jpg'],
    category: 'Mansions',
    propertyType: 'STAY',
    hostName: 'Maharana Singh',
    hostAvatar: '/images/avatar_jean.jpg',
    isGuestFavorite: true,
    isSuperhost: true,
    amenities: ['Lake View Jharokha', 'Rooftop Dining', 'Royal Heritage Interiors', 'Courtyard Pool', 'Wi-Fi', 'Spa Services'],
    tags: ['Heritage', 'Royal', 'Lake View'],
    description: 'Restored 200-year-old royal residence featuring hand-painted frescoes, marble arches, and jharokha balconies overlooking Lake Pichola.',
    lat: 24.585,
    lng: 73.712,
    maxGuests: 4,
    bedrooms: 1,
    beds: 2,
    baths: 1,
  }
];

export const CURATED_EXPERIENCES: Experience[] = [
  {
    id: 'exp-1',
    title: 'Sunrise Ridge Trek & Cloud Inversion Valley',
    category: 'Adventure',
    location: 'Triund Peak, Dharamshala',
    city: 'Dharamshala',
    pricePerPerson: 1600,
    rating: 4.96,
    reviewCount: 88,
    imageUrls: ['/images/exp_trekking.jpg', '/images/exp_trek.jpg', '/images/exp_nature_wildlife.jpg'],
    duration: '6 hours',
    hostName: 'Karan Negi',
    hostAvatar: '/images/avatar_alex.jpg',
    hostBio: 'Certified Alpine mountaineer with 10+ years guiding Himalayan trails.',
    description: 'Trek through rhododendron forests to the crest of Triund. Witness surreal morning cloud inversions and the dramatic snow walls of the Dhauladhar range.',
    included: ['Certified Guide', 'Trekking Poles & Crampons', 'Packed Hot Breakfast', 'Trail Permits', 'First Aid Kit'],
    whatToBring: ['Sturdy hiking shoes', 'Warm windproof jacket', 'Water bottle (1L+)', 'Sunscreen & sunglasses'],
    meetingPoint: 'Mcleodganj Main Square Taxi Stand (5:30 AM)',
    slots: [
      { id: 's1', date: 'Tomorrow', time: '05:30 AM - 11:30 AM', capacity: 12, bookedCount: 7, pricePerPerson: 1600 },
      { id: 's2', date: 'This Weekend', time: '05:30 AM - 11:30 AM', capacity: 12, bookedCount: 10, pricePerPerson: 1600 },
      { id: 's3', date: 'Next Tuesday', time: '05:30 AM - 11:30 AM', capacity: 12, bookedCount: 3, pricePerPerson: 1600 },
    ]
  },
  {
    id: 'exp-2',
    title: 'Secret Old Goa Portuguese Culinary Masterclass',
    category: 'Food & Drink',
    location: 'Fontainhas, Panaji, Goa',
    city: 'Goa',
    pricePerPerson: 2200,
    rating: 4.98,
    reviewCount: 114,
    imageUrls: ['/images/exp_local_food.jpg', '/images/exp_food.jpg', '/images/exp_cultural_walk.jpg'],
    duration: '3.5 hours',
    hostName: 'Maria D’Souza',
    hostAvatar: '/images/avatar_elena.jpg',
    hostBio: 'Third-generation Goan chef cooking in an ancestral 1890s Latin Quarter heritage home.',
    description: 'Shop fresh local spices at Mapusa market, then hand-grind recheado paste and craft authentic Goan fish curry, prawn balchão, and traditional bebinca dessert.',
    included: ['All cooking ingredients', 'Multi-course lunch with wine', 'Recipe booklet PDF', 'Goan spice gift jar'],
    whatToBring: ['Your appetite', 'Comfortable footwear for the spice walk'],
    meetingPoint: 'St. Sebastian Chapel, Fontainhas (10:00 AM)',
    slots: [
      { id: 's4', date: 'Tomorrow', time: '10:00 AM - 01:30 PM', capacity: 8, bookedCount: 5, pricePerPerson: 2200 },
      { id: 's5', date: 'This Saturday', time: '10:00 AM - 01:30 PM', capacity: 8, bookedCount: 8, pricePerPerson: 2200 },
      { id: 's6', date: 'This Sunday', time: '10:00 AM - 01:30 PM', capacity: 8, bookedCount: 4, pricePerPerson: 2200 },
    ]
  },
  {
    id: 'exp-3',
    title: 'Twilight Heritage Haveli Photography Walk',
    category: 'Art & Culture',
    location: 'Blue City, Jodhpur',
    city: 'Jodhpur',
    pricePerPerson: 1400,
    rating: 4.93,
    reviewCount: 62,
    imageUrls: ['/images/exp_cultural_walk.jpg', '/images/exp_local_life.jpg', '/images/exp_nightlife.jpg'],
    duration: '3 hours',
    hostName: 'Samir Rathore',
    hostAvatar: '/images/avatar_rohan.jpg',
    hostBio: 'National Geographic featured documentary photographer native to Jodhpur.',
    description: 'Wander secret indigo alleyways away from tourist crowds. Master golden-hour portraits, street light compositions, and access private rooftop viewpoints over Mehrangarh Fort.',
    included: ['Composition mentoring', 'Access to private heritage rooftops', 'Masala chai & local kachori', 'Lightroom presets pack'],
    whatToBring: ['Camera or Smartphone with manual mode', 'Walking shoes'],
    meetingPoint: 'Clock Tower Main Gate (4:00 PM)',
    slots: [
      { id: 's7', date: 'Tomorrow', time: '04:00 PM - 07:00 PM', capacity: 10, bookedCount: 6, pricePerPerson: 1400 },
      { id: 's8', date: 'This Friday', time: '04:00 PM - 07:00 PM', capacity: 10, bookedCount: 8, pricePerPerson: 1400 },
    ]
  },
  {
    id: 'exp-4',
    title: 'Himalayan Sound Healing & Sound Bath Meditation',
    category: 'Wellness',
    location: 'Tapovan, Rishikesh',
    city: 'Rishikesh',
    pricePerPerson: 1800,
    rating: 4.97,
    reviewCount: 95,
    imageUrls: ['/images/exp_yoga_retreat.jpg', '/images/exp_nature_wildlife.jpg', '/images/exp_workshops.jpg'],
    duration: '2 hours',
    hostName: 'Swati Anand',
    hostAvatar: '/images/avatar_sophia.jpg',
    hostBio: 'Tibetan singing bowl master certified in sound acoustic resonance therapy.',
    description: 'Immerse in deep restorative vibration using 7-metal Tibetan antique singing bowls, gongs, and ocean drums overlooking the sacred Ganges River at sunset.',
    included: ['Meditation mats & silk eye pillows', 'Warm herbal infusion tea', 'Sound frequency guide'],
    whatToBring: ['Loose, comfortable white/light clothing'],
    meetingPoint: 'Ananda Shala Studio, Tapovan (5:00 PM)',
    slots: [
      { id: 's9', date: 'Today', time: '05:00 PM - 07:00 PM', capacity: 15, bookedCount: 11, pricePerPerson: 1800 },
      { id: 's10', date: 'Tomorrow', time: '05:00 PM - 07:00 PM', capacity: 15, bookedCount: 9, pricePerPerson: 1800 },
    ]
  }
];

export async function fetchStays(filters?: Partial<SearchFilters>): Promise<Stay[]> {
  let customProps: any[] = [];
  if (typeof window !== 'undefined') {
    try {
      const saved = localStorage.getItem('stayq_admin_properties');
      if (saved) customProps = JSON.parse(saved);
    } catch {}
  }

  let dbProps: any[] = [];
  try {
    const res = await fetch(`${API_BASE_URL}/properties`, { headers: { Accept: 'application/json' } });
    if (res.ok) {
      const data = await res.json();
      dbProps = Array.isArray(data) ? data : data?.data || [];
    }
  } catch {
    // Continue with local custom properties
  }

  // Combine DB properties with admin custom properties (avoiding duplicates)
  const combinedRaw: any[] = [...customProps];
  dbProps.forEach((dbp: any) => {
    if (!combinedRaw.some((cp) => cp.id === dbp.id)) {
      combinedRaw.push(dbp);
    }
  });

  if (combinedRaw.length > 0) {
    const realStays: Stay[] = combinedRaw.map((p: any) => {
      const isZb = p.isZeroBroker || p.type === 'ZERO_BROKER' || p.category === 'ZERO_BROKER' || p.category?.name === 'Zero Broker' || p.longTermAvailable;
      const hostName = p.hostName || (p.host ? `${p.host.displayName || p.host.firstName || ''} ${p.host.lastName || ''}`.trim() : 'Shayan Mandal');
      const categoryName = p.category?.name || p.category || (isZb ? 'Zero Broker' : (p.type || 'Villas'));

      return {
        id: p.id,
        title: p.title || p.name || 'Stay Q Verified Stay',
        location: p.address ? `${p.address}, ${p.city || 'Goa'}, ${p.country || 'India'}` : `${p.city || 'Goa'}, ${p.state || 'India'}`,
        city: p.city || 'Goa',
        state: p.state || 'India',
        country: p.country || 'India',
        pincode: p.pincode || '',
        pricePerNight: Number(p.basePrice || p.pricePerNight) || (isZb ? 3200 : 5000),
        rating: Number(p.rating || p.starRating) || 4.95,
        reviewCount: Number(p.reviewCount) || 48,
        imageUrls: p.imageUrls?.length ? p.imageUrls : (p.images?.length ? p.images.map((img: any) => img.url || img) : (p.heroImage ? [p.heroImage] : ['/images/villa_1.jpg'])),
        category: categoryName,
        propertyType: isZb ? 'ZERO_BROKER' : (p.type || 'STAY'),
        isZeroBroker: isZb,
        depositAmount: Number(p.securityDeposit) || 50000,
        leaseTerm: p.leaseDurationMonths ? `${p.leaseDurationMonths} Months` : '1 - 11 Months Flexible',
        hostName: hostName || 'Shayan Mandal',
        hostAvatar: p.hostAvatar || p.host?.avatarUrl || p.host?.photoUrl || '/images/avatar_alex.jpg',
        isGuestFavorite: true,
        isSuperhost: true,
        isFeatured: true,
        amenities: p.amenities?.length ? p.amenities : ['High-Speed Wi-Fi', 'Air Conditioning', 'Free Parking', 'Kitchen'],
        tags: isZb ? ['Zero Broker', 'Verified Lease', 'Direct Owner'] : ['Verified', 'Instant Book', 'Luxury'],
        description: p.description || 'Verified direct property with modern amenities and peaceful surroundings.',
        lat: Number(p.lat || p.latitude) || 15.5182,
        lng: Number(p.lng || p.longitude) || 73.7634,
        maxGuests: Number(p.maxGuests) || 4,
        bedrooms: Number(p.bedrooms) || 2,
        beds: Number(p.beds) || 2,
        baths: Number(p.bathrooms || p.baths) || 2,
      };
    });

    return applyFilters(realStays, filters);
  }

  // Fallback to initial curated stays only if zero properties exist anywhere
  return applyFilters(CURATED_STAYS, filters);
}

export async function fetchExperiences(category?: string): Promise<Experience[]> {
  let customExp: any[] = [];
  if (typeof window !== 'undefined') {
    try {
      const saved = localStorage.getItem('stayq_admin_experiences');
      if (saved) customExp = JSON.parse(saved);
    } catch {}
  }

  let dbExp: any[] = [];
  try {
    const res = await fetch(`${API_BASE_URL}/experiences`, { headers: { Accept: 'application/json' } });
    if (res.ok) {
      const data = await res.json();
      dbExp = Array.isArray(data) ? data : data?.data || [];
    }
  } catch {
    // Continue with custom local experiences
  }

  const combined: any[] = [...customExp];
  dbExp.forEach((e: any) => {
    if (!combined.some((ce) => ce.id === e.id)) {
      combined.push(e);
    }
  });

  let expList: Experience[] = [];
  if (combined.length > 0) {
    expList = combined.map((e: any) => ({
      id: e.id,
      title: e.title || e.name || 'Local Experience',
      category: e.category || 'Adventure',
      location: e.location || `${e.city || 'Goa'}, India`,
      city: e.city || 'Goa',
      pricePerPerson: Number(e.pricePerPerson || e.price) || 1500,
      rating: Number(e.rating) || 4.95,
      reviewCount: Number(e.reviewCount) || 52,
      imageUrls: e.imageUrls?.length ? e.imageUrls : (e.images?.length ? e.images.map((img: any) => img.url || img) : ['/images/exp_trekking.jpg']),
      duration: e.duration || '3 hours',
      hostName: e.hostName || 'Shayan Mandal',
      hostAvatar: e.hostAvatar || '/images/avatar_alex.jpg',
      hostBio: e.hostBio || 'Certified local expert guide and native host.',
      description: e.description || 'Explore scenic trails and authentic local culture with experienced guides.',
      included: e.included || ['Certified Guide', 'Safety Equipment', 'Refreshments'],
      whatToBring: e.whatToBring || ['Comfortable footwear', 'Water bottle'],
      meetingPoint: e.meetingPoint || 'Central City Square',
      slots: e.slots?.length ? e.slots : [
        { id: `${e.id}-s1`, date: 'Tomorrow', time: '09:00 AM - 12:00 PM', capacity: 10, bookedCount: 3, pricePerPerson: Number(e.pricePerPerson) || 1500 },
        { id: `${e.id}-s2`, date: 'This Weekend', time: '03:00 PM - 06:00 PM', capacity: 10, bookedCount: 6, pricePerPerson: Number(e.pricePerPerson) || 1500 },
      ],
    }));
  } else {
    expList = CURATED_EXPERIENCES;
  }

  if (category && category !== 'All') {
    return expList.filter((e) => e.category.toLowerCase() === category.toLowerCase());
  }
  return expList;
}

function applyFilters(stays: Stay[], filters?: Partial<SearchFilters>): Stay[] {
  if (!filters) return stays;
  return stays.filter((stay) => {
    if (filters.destination && filters.destination.trim() !== '') {
      const q = filters.destination.toLowerCase();
      const matchesLoc = stay.location.toLowerCase().includes(q) ||
                         stay.city.toLowerCase().includes(q) ||
                         stay.state.toLowerCase().includes(q) ||
                         stay.title.toLowerCase().includes(q);
      if (!matchesLoc) return false;
    }
    if (filters.category && filters.category !== 'ALL') {
      const cat = filters.category.toUpperCase();
      if (cat === 'ZERO_BROKER' && !stay.isZeroBroker) return false;
      if (cat === 'VILLA' && !stay.category.toLowerCase().includes('villa')) return false;
      if (cat === 'MANSION' && !stay.category.toLowerCase().includes('mansion')) return false;
      if (cat === 'APARTMENT' && !stay.category.toLowerCase().includes('apartment')) return false;
      if (cat === 'STUDIO' && !stay.category.toLowerCase().includes('studio')) return false;
      if (cat === 'CABIN' && !stay.category.toLowerCase().includes('cabin')) return false;
      if (cat === 'BEACHFRONT' && !stay.category.toLowerCase().includes('beach')) return false;
      if (cat === 'TREEHOUSE' && !stay.category.toLowerCase().includes('tree')) return false;
      if (cat === 'RV' && stay.propertyType !== 'RV') return false;
      if (cat === 'CAMPING_SITE' && stay.propertyType !== 'CAMPING_SITE') return false;
    }
    const effectiveGuests = filters.guests || (Number(filters.adults || 1) + Number(filters.children || 0));
    if (effectiveGuests > 1) {
      if (stay.maxGuests < effectiveGuests) return false;
    }
    if (filters.pets && filters.pets > 0) {
      const isPetFriendly = stay.amenities.some((a) => a.toLowerCase().includes('pet')) ||
                            stay.tags.some((t) => t.toLowerCase().includes('pet'));
      if (!isPetFriendly) return false;
    }
    if (filters.amenities && filters.amenities.length > 0) {
      const hasAllAmenities = filters.amenities.every((req) =>
        stay.amenities.some((a) => a.toLowerCase().includes(req.toLowerCase()))
      );
      if (!hasAllAmenities) return false;
    }
    if (filters.priceMin && stay.pricePerNight < filters.priceMin) return false;
    if (filters.priceMax && stay.pricePerNight > filters.priceMax) return false;
    if (filters.zeroBrokerOnly && !stay.isZeroBroker) return false;
    return true;
  });
}

let cachedCommissionSettings: { guestServiceFeePercent: number; gstRatePercent: number; hostCommissionPercent: number } | null = null;

export async function fetchCommissionSettings() {
  if (cachedCommissionSettings) return cachedCommissionSettings;
  try {
    const res = await fetch(`${API_BASE_URL}/commission/settings`, { headers: { Accept: 'application/json' } });
    if (res.ok) {
      const data = await res.json();
      cachedCommissionSettings = {
        guestServiceFeePercent: Number(data.guestServiceFeePercent || 10),
        gstRatePercent: Number(data.gstRatePercent || 18),
        hostCommissionPercent: Number(data.hostCommissionPercent || 3),
      };
      if (typeof window !== 'undefined') {
        localStorage.setItem('stayq_active_commission', JSON.stringify(cachedCommissionSettings));
      }
      return cachedCommissionSettings;
    }
  } catch {
    // Fallback to local stored or standard config
  }

  if (typeof window !== 'undefined') {
    try {
      const saved = localStorage.getItem('stayq_active_commission') || localStorage.getItem('stayq_commission_settings');
      if (saved) {
        const parsed = JSON.parse(saved);
        cachedCommissionSettings = {
          guestServiceFeePercent: Number(parsed.guestServiceFeePercent || 10),
          gstRatePercent: Number(parsed.gstRatePercent || 18),
          hostCommissionPercent: Number(parsed.hostCommissionPercent || 3),
        };
        return cachedCommissionSettings;
      }
    } catch {}
  }

  cachedCommissionSettings = { guestServiceFeePercent: 10, gstRatePercent: 18, hostCommissionPercent: 3 };
  return cachedCommissionSettings;
}

// Pre-fetch settings on load
if (typeof window !== 'undefined') {
  fetchCommissionSettings();
}

export function calculateBookingQuote(pricePerNight: number, checkInDate: string, checkOutDate: string): BookingQuote {
  const start = new Date(checkInDate);
  const end = new Date(checkOutDate);
  const diffTime = end.getTime() - start.getTime();
  const rawNights = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  const nights = Math.max(1, isNaN(rawNights) || rawNights <= 0 ? 1 : rawNights);

  const baseTotal = pricePerNight * nights;
  const cleaningFee = Math.round(pricePerNight * 0.04);

  // 18% Taxes & GST (with platform service fee inclusive in tax tier)
  const serviceFee = 0;
  const gstAmount = Math.round((baseTotal + cleaningFee) * 0.18);
  const discountAmount = nights >= 3 ? Math.round(baseTotal * 0.05) : 0;
  const totalAmount = baseTotal + cleaningFee + gstAmount - discountAmount;

  return {
    nights,
    basePrice: pricePerNight,
    baseTotal,
    cleaningFee,
    serviceFee,
    gstAmount,
    discountAmount,
    totalAmount,
  };
}

export async function createBookingApi(bookingData: Omit<Booking, 'id' | 'referenceCode' | 'createdAt' | 'status'>): Promise<Booking> {
  const refCode = `SQ-${Math.floor(100000 + Math.random() * 900000)}`;
  const newBooking: Booking = {
    ...bookingData,
    id: `booking-${Date.now()}`,
    referenceCode: refCode,
    status: 'CONFIRMED',
    createdAt: new Date().toISOString(),
  };

  try {
    const headers = await getAuthHeaders();
    await fetch(`${API_BASE_URL}/bookings`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        propertyId: bookingData.itemId,
        checkIn: bookingData.checkInDate,
        checkOut: bookingData.checkOutDate,
        guests: bookingData.guestsCount,
        totalAmount: bookingData.totalPrice,
        paymentMethod: bookingData.paymentMethod,
        guestName: bookingData.guestName,
        guestEmail: bookingData.guestEmail,
        guestPhone: bookingData.guestPhone,
        referenceCode: refCode,
      }),
    });
  } catch {
    // Persist locally
  }

  const existing = getStoredBookings();
  localStorage.setItem('stayq_user_bookings', JSON.stringify([newBooking, ...existing]));
  return newBooking;
}

export interface PaymentOrderResponse {
  orderId: string;
  paymentSessionId: string;
  amount: number;
  currency: string;
  status: string;
  gateway?: string;
}

export async function createPaymentOrderApi(params: {
  amount: number;
  bookingId?: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
}): Promise<PaymentOrderResponse> {
  const fallbackOrderId = `order_sq_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  try {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_BASE_URL}/payments/create-order`, {
      method: 'POST',
      headers,
      body: JSON.stringify(params),
    });

    if (res.ok) {
      const data = await res.json();
      return {
        orderId: data.orderId || data.order_id || fallbackOrderId,
        paymentSessionId: data.paymentSessionId || data.payment_session_id || `session_${fallbackOrderId}`,
        amount: data.amount || params.amount,
        currency: data.currency || 'INR',
        status: data.status || 'PENDING',
        gateway: data.gateway || 'CASHFREE',
      };
    }
  } catch {
    // Return fallback order
  }

  return {
    orderId: fallbackOrderId,
    paymentSessionId: `session_${fallbackOrderId}`,
    amount: params.amount,
    currency: 'INR',
    status: 'PENDING',
    gateway: 'CASHFREE',
  };
}

export async function verifyPaymentApi(orderId: string): Promise<{ isPaid: boolean; status: string }> {
  try {
    const res = await fetch(`${API_BASE_URL}/payments/verify/${orderId}`, {
      headers: { Accept: 'application/json' },
    });
    if (res.ok) {
      const data = await res.json();
      return {
        isPaid: !!data.isPaid,
        status: data.status || (data.isPaid ? 'PAID' : 'PENDING'),
      };
    }
  } catch (err) {
    console.warn('[verifyPaymentApi] Verification fetch error:', err);
  }
  return { isPaid: false, status: 'PENDING' };
}

export function getStoredBookings(): Booking[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem('stayq_user_bookings');
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function getStoredWishlist(): string[] {
  if (typeof window === 'undefined') return ['stay-1', 'stay-4'];
  try {
    const raw = localStorage.getItem('stayq_user_wishlist');
    return raw ? JSON.parse(raw) : ['stay-1', 'stay-4'];
  } catch {
    return ['stay-1', 'stay-4'];
  }
}

export function saveStoredWishlist(ids: string[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem('stayq_user_wishlist', JSON.stringify(ids));
}

export async function askQubeAI(userPrompt: string): Promise<string> {
  try {
    const res = await fetch(`${API_BASE_URL}/qube/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: userPrompt }),
    });
    if (res.ok) {
      const data = await res.json();
      if (data?.reply) return data.reply;
    }
  } catch {
    // Local fallback
  }

  const prompt = userPrompt.toLowerCase();
  if (prompt.includes('goa') || prompt.includes('beach') || prompt.includes('pool')) {
    return `✨ I found 2 stunning options in Goa for you!\n\n1. **The Glass Pavilion & Private Infinity Pool** (Candolim) — ₹14,500/night with full butler service and sunset views.\n2. **Azure Horizon Beachfront Villa** (Palolem) — ₹11,800/night with direct beach access.\n\nWould you like me to reserve dates or check availability for this weekend?`;
  }
  if (prompt.includes('cabin') || prompt.includes('mountain') || prompt.includes('manali') || prompt.includes('snow')) {
    return `🏔️ For mountain lovers, I highly recommend:\n\n**Pine & Cedar Scandinavian A-Frame Cabin** in Old Manali (₹6,200/night). It comes with a cozy wood-burning fireplace, heated bedding, and private bonfire pit facing snow peaks.`;
  }
  if (prompt.includes('zero broker') || prompt.includes('rent') || prompt.includes('bangalore') || prompt.includes('long term')) {
    return `🔑 Check out the **Nordic Minimalist Loft in Indiranagar, Bengaluru** (₹3,200/night or flexible monthly). It features zero brokerage fee, 1Gbps fiber, and West Elm designer furnishings with instant verified lease contracts!`;
  }
  if (prompt.includes('experience') || prompt.includes('trek') || prompt.includes('food')) {
    return `🌿 Our top curated experiences right now:\n\n• **Sunrise Ridge Trek in Triund** (₹1,600/person)\n• **Secret Old Goa Portuguese Culinary Masterclass** (₹2,200/person)\n• **Himalayan Sound Healing in Rishikesh** (₹1,800/person)\n\nLet me know your dates and I'll secure your slot!`;
  }
  return `✨ I'm Qube, your Stay Q AI travel companion! I can find you private pool villas, mountain cabins, overland RVs, zero-broker rentals, or book curated local experiences across India. Where would you like to travel next?`;
}
