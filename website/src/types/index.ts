export type PropertyCategoryType =
  | 'ALL'
  | 'VILLA'
  | 'BEACHFRONT'
  | 'CABIN'
  | 'MANSION'
  | 'TREEHOUSE'
  | 'COUNTRYSIDE'
  | 'RV'
  | 'CAMPING_SITE'
  | 'ZERO_BROKER'
  | 'STUDIO'
  | 'APARTMENT';

export type PropertyKind = 'STAY' | 'RV' | 'CAMPING_SITE' | 'ZERO_BROKER';

export interface Stay {
  id: string;
  title: string;
  location: string;
  city: string;
  state: string;
  pricePerNight: number;
  rating: number;
  reviewCount: number;
  imageUrls: string[];
  category: string;
  propertyType: PropertyKind;
  hostName: string;
  hostAvatar: string;
  isGuestFavorite?: boolean;
  isSuperhost?: boolean;
  isNew?: boolean;
  isFeatured?: boolean;
  isZeroBroker?: boolean;
  depositAmount?: number;
  leaseTerm?: string;
  amenities: string[];
  tags: string[];
  description: string;
  lat: number;
  lng: number;
  maxGuests: number;
  bedrooms: number;
  beds: number;
  baths: number;
  blockedDates?: string[];
}

export interface ExperienceSlot {
  id: string;
  date: string;
  time: string;
  capacity: number;
  bookedCount: number;
  pricePerPerson: number;
}

export interface Experience {
  id: string;
  title: string;
  category: 'Adventure' | 'Food & Drink' | 'Art & Culture' | 'Nature' | 'Wellness' | 'Nightlife' | 'Workshops';
  location: string;
  city: string;
  pricePerPerson: number;
  rating: number;
  reviewCount: number;
  imageUrls: string[];
  duration: string;
  hostName: string;
  hostAvatar: string;
  hostBio: string;
  description: string;
  included: string[];
  whatToBring: string[];
  meetingPoint: string;
  slots: ExperienceSlot[];
}

export interface BookingQuote {
  nights: number;
  basePrice: number;
  baseTotal: number;
  cleaningFee: number;
  serviceFee: number;
  gstAmount: number;
  discountAmount: number;
  totalAmount: number;
}

export interface Booking {
  id: string;
  referenceCode: string;
  type: 'STAY' | 'EXPERIENCE';
  itemId: string;
  itemTitle: string;
  itemLocation: string;
  itemImage: string;
  checkInDate: string;
  checkOutDate: string;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  guestsCount: number;
  totalPrice: number;
  status: 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';
  paymentMethod: string;
  createdAt: string;
  slotDetails?: string;
}

export interface SearchFilters {
  destination: string;
  checkIn?: string;
  checkOut?: string;
  guests: number;
  adults?: number;
  children?: number;
  infants?: number;
  pets?: number;
  category: PropertyCategoryType;
  propertyType?: PropertyKind;
  priceMin: number;
  priceMax: number;
  amenities: string[];
  zeroBrokerOnly: boolean;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone?: string;
  avatarUrl?: string;
}
