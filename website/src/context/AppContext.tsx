"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { Stay, Experience, Booking, SearchFilters, UserProfile, LoyaltyProfile, LoyaltyTier } from '../types';
import { fetchStays, getStoredBookings, getStoredWishlist, saveStoredWishlist, syncProfileWithBackend, fetchLoyaltyProfileApi, redeemLoyaltyPointsApi, upgradeLoyaltyTierApi } from '../services/api';
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

  // Search Modal
  isSearchModalOpen: boolean;
  setIsSearchModalOpen: (open: boolean) => void;

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

  // Stay Q Rewards & Loyalty Program
  isRewardsModalOpen: boolean;
  setIsRewardsModalOpen: (open: boolean) => void;
  loyaltyProfile: LoyaltyProfile | null;
  fetchLoyalty: () => Promise<void>;
  redeemPoints: (points: number) => Promise<boolean>;
  upgradeTier: (tier: LoyaltyTier) => Promise<boolean>;
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

  const [isSearchModalOpen, setIsSearchModalOpen] = useState<boolean>(false);
  const [isQubeOpen, setIsQubeOpen] = useState<boolean>(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [isHostAppModalOpen, setIsHostAppModalOpen] = useState<boolean>(false);
  const [isSupportOpen, setIsSupportOpen] = useState<boolean>(false);
  const [isRewardsModalOpen, setIsRewardsModalOpen] = useState<boolean>(false);
  const [loyaltyProfile, setLoyaltyProfile] = useState<LoyaltyProfile | null>(null);

  const fetchLoyalty = async () => {
    try {
      const data = await fetchLoyaltyProfileApi();
      if (data?.success && data?.profile) {
        setLoyaltyProfile(data.profile);
      }
    } catch {
      // Non-blocking
    }
  };

  const redeemPoints = async (points: number): Promise<boolean> => {
    try {
      const data = await redeemLoyaltyPointsApi(points);
      if (data?.success) {
        await fetchLoyalty();
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const upgradeTier = async (tier: LoyaltyTier): Promise<boolean> => {
    try {
      const data = await upgradeLoyaltyTierApi(tier);
      if (data?.success) {
        await fetchLoyalty();
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

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
          fetchLoyalty();
        } catch {
          // Fallback user
        }
      } else {
        setLoyaltyProfile(null);
      }
    });

    return () => unsubscribe();
  }, []);

  const refreshStays = useCallback(async () => {
    setIsLoadingStays(true);
    try {
      const data = await fetchStays(filters);
      setStays(data);
    } finally {
      setIsLoadingStays(false);
    }
  }, [filters]);

  useEffect(() => {
    refreshStays();
  }, [refreshStays]);

  const updateFilters = useCallback((newFilters: Partial<SearchFilters>) => {
    setFilters((prev) => {
      let changed = false;
      for (const [k, v] of Object.entries(newFilters)) {
        if ((prev as any)[k] !== v) {
          changed = true;
          break;
        }
      }
      return changed ? { ...prev, ...newFilters } : prev;
    });
  }, []);

  const resetFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
  }, []);

  const toggleWishlist = useCallback((id: string) => {
    if (!user) {
      setIsAuthModalOpen(true);
      return;
    }
    setWishlistIds((prev) => {
      const next = prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id];
      saveStoredWishlist(next);
      return next;
    });
  }, [user]);

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
      fetchLoyalty();
    } else {
      localStorage.removeItem('stayq_user_profile');
      setLoyaltyProfile(null);
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
        isSearchModalOpen,
        setIsSearchModalOpen,
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
        isRewardsModalOpen,
        setIsRewardsModalOpen,
        loyaltyProfile,
        fetchLoyalty,
        redeemPoints,
        upgradeTier,
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
