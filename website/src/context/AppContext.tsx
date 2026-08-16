import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Stay, Experience, Booking, SearchFilters, UserProfile } from '../types';
import { fetchStays, getStoredBookings, getStoredWishlist, saveStoredWishlist, syncProfileWithBackend } from '../services/api';
import { auth, onAuthStateChanged, signOut } from '../services/firebase';

interface AppContextType {
  // Stays & Filters
  stays: Stay[];
  isLoadingStays: boolean;
  filters: SearchFilters;
  updateFilters: (newFilters: Partial<SearchFilters>) => void;
  resetFilters: () => void;
  refreshStays: () => Promise<void>;

  // Modals & Active Selections
  selectedStay: Stay | null;
  setSelectedStay: (stay: Stay | null) => void;
  selectedExperience: Experience | null;
  setSelectedExperience: (exp: Experience | null) => void;
  
  // Checkout & Confirmation
  checkoutItem: {
    stay?: Stay;
    experience?: Experience;
    slotId?: string;
    checkIn?: string;
    checkOut?: string;
    guests?: number;
    adults?: number;
    children?: number;
    infants?: number;
    pets?: number;
  } | null;
  setCheckoutItem: (item: {
    stay?: Stay;
    experience?: Experience;
    slotId?: string;
    checkIn?: string;
    checkOut?: string;
    guests?: number;
    adults?: number;
    children?: number;
    infants?: number;
    pets?: number;
  } | null) => void;
  activeConfirmation: Booking | null;
  setActiveConfirmation: (booking: Booking | null) => void;

  // Wishlist
  wishlistIds: string[];
  toggleWishlist: (id: string) => void;
  isWishlisted: (id: string) => boolean;

  // Bookings / Trips
  bookings: Booking[];
  addBooking: (booking: Booking) => void;
  cancelBooking: (bookingId: string) => void;

  // Qube AI Assistant Drawer
  isQubeOpen: boolean;
  setIsQubeOpen: (open: boolean) => void;

  // Real Auth & Profile
  user: UserProfile | null;
  setUser: (user: UserProfile | null) => void;
  logoutUser: () => Promise<void>;
  isAuthModalOpen: boolean;
  setIsAuthModalOpen: (open: boolean) => void;

  // Host on app modal
  isHostAppModalOpen: boolean;
  setIsHostAppModalOpen: (open: boolean) => void;

  // 24/7 Support & Ticket Modal
  isSupportOpen: boolean;
  setIsSupportOpen: (open: boolean) => void;
}

const DEFAULT_FILTERS: SearchFilters = {
  destination: '',
  checkIn: '',
  checkOut: '',
  guests: 1,
  category: 'ALL',
  priceMin: 0,
  priceMax: 50000,
  amenities: [],
  zeroBrokerOnly: false,
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [stays, setStays] = useState<Stay[]>([]);
  const [isLoadingStays, setIsLoadingStays] = useState<boolean>(true);
  const [filters, setFilters] = useState<SearchFilters>(DEFAULT_FILTERS);

  const [selectedStay, setSelectedStay] = useState<Stay | null>(null);
  const [selectedExperience, setSelectedExperience] = useState<Experience | null>(null);
  const [checkoutItem, setCheckoutItem] = useState<{
    stay?: Stay;
    experience?: Experience;
    slotId?: string;
    checkIn?: string;
    checkOut?: string;
    guests?: number;
    adults?: number;
    children?: number;
    infants?: number;
    pets?: number;
  } | null>(null);
  const [activeConfirmation, setActiveConfirmation] = useState<Booking | null>(null);

  const [wishlistIds, setWishlistIds] = useState<string[]>(getStoredWishlist);
  const [bookings, setBookings] = useState<Booking[]>(getStoredBookings);

  const [isQubeOpen, setIsQubeOpen] = useState<boolean>(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [isHostAppModalOpen, setIsHostAppModalOpen] = useState<boolean>(false);
  const [isSupportOpen, setIsSupportOpen] = useState<boolean>(false);

  const [user, setUser] = useState<UserProfile | null>(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('stayq_user_profile');
        return stored ? JSON.parse(stored) : null;
      } catch {
        return null;
      }
    }
    return null;
  });

  // Listen to real Firebase Auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        try {
          const profile = await syncProfileWithBackend({
            uid: fbUser.uid,
            displayName: fbUser.displayName,
            email: fbUser.email,
            phoneNumber: fbUser.phoneNumber,
            photoURL: fbUser.photoURL,
          });
          setUser(profile);
          localStorage.setItem('stayq_user_profile', JSON.stringify(profile));
        } catch {
          // Fallback user
        }
      }
    });

    return () => unsubscribe();
  }, []);

  const refreshStays = async () => {
    setIsLoadingStays(true);
    try {
      const data = await fetchStays(filters);
      setStays(data);
    } finally {
      setIsLoadingStays(false);
    }
  };

  useEffect(() => {
    refreshStays();
  }, [filters]);

  const updateFilters = (newFilters: Partial<SearchFilters>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  };

  const resetFilters = () => {
    setFilters(DEFAULT_FILTERS);
  };

  const toggleWishlist = (id: string) => {
    if (!user) {
      setIsAuthModalOpen(true);
      return;
    }
    setWishlistIds((prev) => {
      const next = prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id];
      saveStoredWishlist(next);
      return next;
    });
  };

  const isWishlisted = (id: string) => wishlistIds.includes(id);

  const addBooking = (booking: Booking) => {
    setBookings((prev) => [booking, ...prev]);
  };

  const cancelBooking = (bookingId: string) => {
    setBookings((prev) => {
      const updated = prev.map((b) => (b.id === bookingId ? { ...b, status: 'CANCELLED' as const } : b));
      localStorage.setItem('stayq_user_bookings', JSON.stringify(updated));
      return updated;
    });
  };

  const handleSetUser = (u: UserProfile | null) => {
    setUser(u);
    if (u) {
      localStorage.setItem('stayq_user_profile', JSON.stringify(u));
    } else {
      localStorage.removeItem('stayq_user_profile');
    }
  };

  const logoutUser = async () => {
    try {
      await signOut(auth);
    } catch {
      // Sign out local
    }
    handleSetUser(null);
  };

  return (
    <AppContext.Provider
      value={{
        stays,
        isLoadingStays,
        filters,
        updateFilters,
        resetFilters,
        refreshStays,
        selectedStay,
        setSelectedStay,
        selectedExperience,
        setSelectedExperience,
        checkoutItem,
        setCheckoutItem,
        activeConfirmation,
        setActiveConfirmation,
        wishlistIds,
        toggleWishlist,
        isWishlisted,
        bookings,
        addBooking,
        cancelBooking,
        isQubeOpen,
        setIsQubeOpen,
        user,
        setUser: handleSetUser,
        logoutUser,
        isAuthModalOpen,
        setIsAuthModalOpen,
        isHostAppModalOpen,
        setIsHostAppModalOpen,
        isSupportOpen,
        setIsSupportOpen,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
