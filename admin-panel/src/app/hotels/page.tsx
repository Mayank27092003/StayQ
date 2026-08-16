"use client";

import { useEffect, useState } from "react";
import axios from "axios";

export interface HotelProperty {
  id: string;
  title: string;
  subtitle?: string;
  description?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  pincode?: string;
  lat?: number;
  lng?: number;
  basePrice?: number;
  weekendPrice?: number;
  cleaningFee?: number;
  securityDeposit?: number;
  gstRate?: number;
  status: string;
  type?: string;
  category?: { name: string };
  maxGuests?: number;
  bedrooms?: number;
  beds?: number;
  bathrooms?: number;
  sqft?: number;
  amenities?: string[];
  imageUrls?: string[];
  videoUrl?: string;
  virtualTourUrl?: string;
  instantBook?: boolean;
  checkInTime?: string;
  checkOutTime?: string;
  starRating?: number;
  yearEstablished?: number;
  cancellationPolicy?: string;
  houseRules?: string;
  hostName?: string;
  hostPhone?: string;
  hostEmail?: string;
  badges?: string[];
  metaTitle?: string;
  metaDescription?: string;
}

const AMENITY_CATEGORIES = {
  "Comfort & Climate": ["Air Conditioning", "Central Heating", "Ceiling Fan", "Blackout Curtains", "Soundproofing", "Premium Linens"],
  "Luxury & Wellness": ["Infinity Pool", "Private Jacuzzi", "Full Service Spa", "Sauna & Steam", "Fitness Center / Gym", "Yoga Pavilion"],
  "Dining & Refreshment": ["Fine Dining Restaurant", "24/7 Room Service", "Complimentary Breakfast", "Cocktail Bar & Lounge", "In-Room Minibar", "Espresso Machine"],
  "Connectivity & Work": ["High-Speed Fiber WiFi (200+ Mbps)", "Dedicated Workspace", "Conference / Meeting Room", "International Plug Sockets", "Smart TV with Netflix"],
  "Convenience & Logistics": ["Airport Chauffeur Shuttle", "Free Valet Parking", "EV Charging Station", "Elevator Access", "Luggage Storage", "24-Hour Front Desk"],
  "Safety & Hygiene": ["24/7 Security & CCTV", "Electronic Safe in Room", "Fire Extinguisher & Smoke Alarm", "First Aid Kit", "Doctor On Call"]
};

const CANCELLATION_POLICIES = [
  { id: "flexible", label: "Flexible", desc: "Full refund 24 hours prior to check-in" },
  { id: "moderate", label: "Moderate", desc: "Full refund 5 days prior to check-in" },
  { id: "strict", label: "Strict", desc: "50% refund up to 7 days before arrival" },
  { id: "non_refundable", label: "Non-Refundable", desc: "Special discounted rate with zero refund" }
];

export default function HotelsManagementPage() {
  const [hotels, setHotels] = useState<HotelProperty[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"general" | "location" | "pricing" | "specs" | "amenities" | "media" | "policies">("general");
  const [editingHotel, setEditingHotel] = useState<HotelProperty | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Form State
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [description, setDescription] = useState("");
  const [city, setCity] = useState("Goa");
  const [stateName, setStateName] = useState("Goa");
  const [country, setCountry] = useState("India");
  const [address, setAddress] = useState("");
  const [pincode, setPincode] = useState("403515");
  const [lat, setLat] = useState(15.5186);
  const [lng, setLng] = useState(73.7667);
  const [basePrice, setBasePrice] = useState(8500);
  const [weekendPrice, setWeekendPrice] = useState(10500);
  const [cleaningFee, setCleaningFee] = useState(1200);
  const [securityDeposit, setSecurityDeposit] = useState(5000);
  const [gstRate, setGstRate] = useState(12);
  const [maxGuests, setMaxGuests] = useState(2);
  const [bedrooms, setBedrooms] = useState(1);
  const [beds, setBeds] = useState(1);
  const [bathrooms, setBathrooms] = useState(1);
  const [sqft, setSqft] = useState(650);
  const [starRating, setStarRating] = useState(5);
  const [status, setStatus] = useState("ACTIVE");
  const [instantBook, setInstantBook] = useState(true);
  const [checkInTime, setCheckInTime] = useState("14:00");
  const [checkOutTime, setCheckOutTime] = useState("11:00");
  const [cancellationPolicy, setCancellationPolicy] = useState("moderate");
  const [houseRules, setHouseRules] = useState("No loud music after 10 PM. Government ID required at check-in.");
  const [hostName, setHostName] = useState("Stay Q Concierge & Hospitality");
  const [hostPhone, setHostPhone] = useState("+91 98765 43210");
  const [hostEmail, setHostEmail] = useState("concierge@stayq.space");
  const [images, setImages] = useState<string[]>([""]);
  const [videoUrl, setVideoUrl] = useState("");
  const [virtualTourUrl, setVirtualTourUrl] = useState("");
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([
    "Infinity Pool", "Fine Dining Restaurant", "High-Speed Fiber WiFi (200+ Mbps)", "Air Conditioning", "Complimentary Breakfast", "24/7 Security & CCTV"
  ]);

  const fetchHotels = async () => {
    try {
      setLoading(true);
      const res = await axios.get("/api/v1/properties");
      if (Array.isArray(res.data)) {
        const hotelList = res.data.filter(
          (p: any) =>
            p.type === "HOTEL" ||
            p.category?.name === "HOTEL" ||
            p.category === "HOTEL" ||
            p.title?.toLowerCase().includes("hotel") ||
            p.title?.toLowerCase().includes("resort") ||
            p.title?.toLowerCase().includes("palace")
        );
        setHotels(hotelList.length > 0 ? hotelList : res.data);
      }
    } catch {
      // Fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHotels();
  }, []);

  const openCreateModal = () => {
    setIsCreatingNew(true);
    setEditingHotel(null);
    setActiveTab("general");
    setTitle("");
    setSubtitle("Boutique Heritage Suites with Coastal Panorama");
    setDescription("");
    setCity("Candolim, Goa");
    setStateName("Goa");
    setCountry("India");
    setAddress("Fort Aguada Coastal Boulevard, Candolim");
    setPincode("403515");
    setLat(15.5186);
    setLng(73.7667);
    setBasePrice(8500);
    setWeekendPrice(10500);
    setCleaningFee(1200);
    setSecurityDeposit(5000);
    setGstRate(12);
    setMaxGuests(2);
    setBedrooms(1);
    setBeds(1);
    setBathrooms(1);
    setSqft(650);
    setStarRating(5);
    setStatus("ACTIVE");
    setInstantBook(true);
    setCheckInTime("14:00");
    setCheckOutTime("11:00");
    setCancellationPolicy("moderate");
    setHouseRules("Valid Government ID required for all guests at check-in. Non-smoking suites.");
    setHostName("Stay Q Luxury Hospitality Partner");
    setHostPhone("+91 98765 43210");
    setHostEmail("hospitality@stayq.space");
    setImages([
      "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=1200&q=80"
    ]);
    setVideoUrl("https://assets.mixkit.co/videos/preview/mixkit-luxury-resort-swimming-pool-42526-large.mp4");
    setVirtualTourUrl("");
    setSelectedAmenities([
      "Infinity Pool", "Fine Dining Restaurant", "High-Speed Fiber WiFi (200+ Mbps)", "Air Conditioning", "Complimentary Breakfast", "24/7 Security & CCTV"
    ]);
    setSaveSuccess(false);
    setIsModalOpen(true);
  };

  const openEditModal = (hotel: HotelProperty) => {
    setIsCreatingNew(false);
    setEditingHotel(hotel);
    setActiveTab("general");
    setTitle(hotel.title || "");
    setSubtitle(hotel.subtitle || "Luxury Hospitality & Suites");
    setDescription(hotel.description || "");
    setCity(hotel.city || "Goa");
    setStateName(hotel.state || "Goa");
    setCountry(hotel.country || "India");
    setAddress(hotel.address || "");
    setPincode(hotel.pincode || "403515");
    setLat(hotel.lat || 15.5186);
    setLng(hotel.lng || 73.7667);
    setBasePrice(Number(hotel.basePrice) || 8500);
    setWeekendPrice(Number(hotel.weekendPrice) || Number(hotel.basePrice) * 1.2 || 10500);
    setCleaningFee(Number(hotel.cleaningFee) || 1200);
    setSecurityDeposit(Number(hotel.securityDeposit) || 5000);
    setGstRate(hotel.gstRate || 12);
    setMaxGuests(hotel.maxGuests || 2);
    setBedrooms(hotel.bedrooms || 1);
    setBeds(hotel.beds || 1);
    setBathrooms(hotel.bathrooms || 1);
    setSqft(hotel.sqft || 650);
    setStarRating(hotel.starRating || 5);
    setStatus(hotel.status || "ACTIVE");
    setInstantBook(hotel.instantBook ?? true);
    setCheckInTime(hotel.checkInTime || "14:00");
    setCheckOutTime(hotel.checkOutTime || "11:00");
    setCancellationPolicy(hotel.cancellationPolicy || "moderate");
    setHouseRules(hotel.houseRules || "Valid Govt ID required.");
    setHostName(hotel.hostName || "Stay Q Concierge");
    setHostPhone(hotel.hostPhone || "+91 98765 43210");
    setHostEmail(hotel.hostEmail || "concierge@stayq.space");
    setImages(hotel.imageUrls && hotel.imageUrls.length > 0 ? hotel.imageUrls : ["https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80"]);
    setVideoUrl(hotel.videoUrl || "");
    setVirtualTourUrl(hotel.virtualTourUrl || "");
    setSelectedAmenities(hotel.amenities && hotel.amenities.length > 0 ? hotel.amenities : ["Infinity Pool", "High-Speed Fiber WiFi (200+ Mbps)"]);
    setSaveSuccess(false);
    setIsModalOpen(true);
  };

  const toggleAmenity = (amenity: string) => {
    if (selectedAmenities.includes(amenity)) {
      setSelectedAmenities(selectedAmenities.filter((a) => a !== amenity));
    } else {
      setSelectedAmenities([...selectedAmenities, amenity]);
    }
  };

  const addImageField = () => setImages([...images, ""]);
  const updateImageField = (idx: number, val: string) => {
    const next = [...images];
    next[idx] = val;
    setImages(next);
  };
  const removeImageField = (idx: number) => {
    if (images.length === 1) {
      setImages([""]);
    } else {
      setImages(images.filter((_, i) => i !== idx));
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const validImages = images.filter((img) => img.trim().length > 0);

    const payload = {
      title,
      subtitle,
      description,
      type: "HOTEL",
      category: "HOTEL",
      city,
      state: stateName,
      country,
      address,
      pincode,
      lat: Number(lat),
      lng: Number(lng),
      basePrice: Number(basePrice),
      pricePerNight: Number(basePrice),
      weekendPrice: Number(weekendPrice),
      cleaningFee: Number(cleaningFee),
      securityDeposit: Number(securityDeposit),
      gstRate: Number(gstRate),
      maxGuests: Number(maxGuests),
      bedrooms: Number(bedrooms),
      beds: Number(beds),
      bathrooms: Number(bathrooms),
      sqft: Number(sqft),
      starRating: Number(starRating),
      instantBook,
      checkInTime,
      checkOutTime,
      cancellationPolicy,
      houseRules,
      hostName,
      hostPhone,
      hostEmail,
      amenities: selectedAmenities,
      images: validImages.length > 0 ? validImages : ["https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80"],
      videoUrls: videoUrl ? [videoUrl] : [],
      status,
    };

    const axiosConfig = {
      headers: { "x-admin-key": "stayq-admin-secret-2026" },
    };

    try {
      if (isCreatingNew) {
        await axios.post("/api/v1/properties", payload, axiosConfig);
      } else if (editingHotel) {
        await axios.patch(`/api/v1/properties/${editingHotel.id}`, payload, axiosConfig);
      }
      setSaveSuccess(true);
      await fetchHotels();
      setTimeout(() => {
        setIsModalOpen(false);
      }, 700);
    } catch (err) {
      console.warn("Hotel save note:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to remove "${name}"?`)) return;
    try {
      await axios.delete(`/api/v1/properties/${id}`, {
        headers: { "x-admin-key": "stayq-admin-secret-2026" },
      });
      await fetchHotels();
    } catch (err) {
      console.warn("Delete note:", err);
    }
  };

  const filtered = hotels.filter(
    (h) =>
      h.title?.toLowerCase().includes(search.toLowerCase()) ||
      h.city?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem", paddingBottom: "4rem" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem", background: "#ffffff", padding: "1.75rem", borderRadius: "20px", border: "1px solid #e2e8f0", boxShadow: "0 2px 6px rgba(0,0,0,0.03)" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "#9D00FF", fontWeight: 900, fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.35rem" }}>
            <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>hotel_class</span>
            <span>Hospitality &amp; Luxury Resorts Suite</span>
          </div>
          <h1 style={{ fontSize: "1.75rem", fontWeight: 900, color: "#0f172a", margin: "0 0 0.35rem", letterSpacing: "-0.02em" }}>Hotels &amp; Resorts Command Suite</h1>
          <p style={{ fontSize: "0.92rem", color: "#64748b", margin: 0, maxWidth: "700px" }}>
            Complete enterprise management for 5-star heritage hotels, suites, dynamic room rates, tax schedules, amenities, and concierge operations.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          style={{ display: "flex", alignItems: "center", gap: "0.6rem", padding: "0.85rem 1.75rem", background: "linear-gradient(135deg, #9D00FF 0%, #7900cc 100%)", color: "#ffffff", fontWeight: 800, fontSize: "0.95rem", borderRadius: "16px", border: "none", cursor: "pointer", boxShadow: "0 4px 16px rgba(157,0,255,0.35)", transition: "all 0.2s ease" }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: "22px" }}>add_circle</span>
          <span>Add Hotel / Resort</span>
        </button>
      </div>

      {/* Search & KPI Summary */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: "1rem", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", background: "#ffffff", padding: "0.9rem 1.25rem", borderRadius: "16px", border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
          <span className="material-symbols-outlined" style={{ color: "#94a3b8", fontSize: "22px" }}>search</span>
          <input
            type="text"
            placeholder="Search hotels by resort title, destination city, star rating, coastal region..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ flex: 1, border: "none", outline: "none", fontSize: "0.95rem", color: "#0f172a", background: "transparent" }}
          />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <div style={{ background: "#ffffff", padding: "0.75rem 1.25rem", borderRadius: "16px", border: "1px solid #e2e8f0", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span style={{ fontSize: "0.82rem", color: "#64748b", fontWeight: 700 }}>Total Hotels:</span>
            <strong style={{ fontSize: "1rem", color: "#0f172a", fontWeight: 900 }}>{hotels.length}</strong>
          </div>
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div style={{ padding: "4rem", textAlign: "center", color: "#64748b", background: "#ffffff", borderRadius: "20px", border: "1px solid #e2e8f0" }}>Loading hotels database...</div>
      ) : filtered.length === 0 ? (
        <div style={{ padding: "4rem", textAlign: "center", background: "#ffffff", borderRadius: "20px", border: "1px solid #e2e8f0" }}>
          <p style={{ color: "#64748b", fontWeight: 700, margin: 0, fontSize: "1.1rem" }}>No hotels found. Click &ldquo;Add Hotel / Resort&rdquo; to launch one!</p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(350px, 1fr))", gap: "1.5rem" }}>
          {filtered.map((hotel) => (
            <div
              key={hotel.id}
              style={{ background: "#ffffff", borderRadius: "24px", border: "1px solid #e2e8f0", overflow: "hidden", boxShadow: "0 2px 10px rgba(0,0,0,0.03)", display: "flex", flexDirection: "column" }}
            >
              <div style={{ position: "relative", height: "220px", background: "#f1f5f9" }}>
                <img
                  src={hotel.imageUrls?.[0] || "/images/villa_1.jpg"}
                  alt={hotel.title}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
                <div style={{ position: "absolute", top: "12px", right: "12px", display: "flex", alignItems: "center", gap: "4px", background: "rgba(15, 23, 42, 0.88)", backdropFilter: "blur(8px)", color: "#ffffff", padding: "0.35rem 0.85rem", borderRadius: "999px", fontSize: "0.78rem", fontWeight: 800 }}>
                  <span className="material-symbols-outlined" style={{ color: "#fbbf24", fontSize: "16px" }}>star</span>
                  <span>{hotel.starRating || 5} Star Luxury</span>
                </div>
                <div style={{ position: "absolute", bottom: "12px", left: "12px", background: hotel.status === "ACTIVE" ? "rgba(5, 150, 105, 0.95)" : "rgba(239, 68, 68, 0.95)", backdropFilter: "blur(6px)", color: "#ffffff", padding: "0.25rem 0.75rem", borderRadius: "8px", fontSize: "0.72rem", fontWeight: 800 }}>
                  {hotel.status || "ACTIVE"}
                </div>
              </div>

              <div style={{ padding: "1.5rem", flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between", gap: "1.25rem" }}>
                <div>
                  <h3 style={{ fontSize: "1.15rem", fontWeight: 900, color: "#0f172a", margin: "0 0 0.35rem", lineHeight: 1.3 }}>{hotel.title}</h3>
                  <p style={{ fontSize: "0.85rem", color: "#64748b", display: "flex", alignItems: "center", gap: "0.3rem", margin: 0 }}>
                    <span className="material-symbols-outlined" style={{ fontSize: "16px", color: "#9D00FF" }}>location_on</span>
                    <span>{hotel.city || "Goa, India"}</span>
                  </p>
                </div>

                <div style={{ background: "#f8fafc", padding: "0.85rem 1rem", borderRadius: "14px", border: "1px solid #f1f5f9", fontSize: "0.82rem", color: "#475569", display: "flex", flexDirection: "column", gap: "0.45rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span>Room Capacity:</span>
                    <strong style={{ color: "#0f172a" }}>{hotel.bedrooms || 1} Rooms · {hotel.maxGuests || 2} Guests</strong>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span>Instant Booking:</span>
                    <span style={{ color: hotel.instantBook !== false ? "#059669" : "#64748b", fontWeight: 800 }}>
                      {hotel.instantBook !== false ? "⚡ Instant Confirmed" : "Manual Review"}
                    </span>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: "0.85rem", borderTop: "1px solid #f1f5f9" }}>
                  <div>
                    <span style={{ fontSize: "0.72rem", color: "#94a3b8", display: "block", textTransform: "uppercase", fontWeight: 700 }}>Starting Nightly Tariff</span>
                    <strong style={{ color: "#9D00FF", fontWeight: 900, fontSize: "1.25rem" }}>
                      ₹{Number(hotel.basePrice || 8500).toLocaleString("en-IN")}
                      <span style={{ fontSize: "0.78rem", color: "#64748b", fontWeight: 600 }}>/night</span>
                    </strong>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <button
                      type="button"
                      onClick={() => openEditModal(hotel)}
                      style={{ padding: "0.6rem 1rem", borderRadius: "12px", border: "1px solid #e2e8f0", background: "#f8fafc", color: "#9D00FF", fontWeight: 800, fontSize: "0.85rem", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.35rem" }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>edit</span>
                      <span>Edit</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(hotel.id, hotel.title)}
                      style={{ padding: "0.6rem", borderRadius: "12px", border: "none", background: "rgba(239, 68, 68, 0.1)", color: "#ef4444", cursor: "pointer" }}
                      title="Delete Hotel"
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>delete</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ULTRA-EXPANDED MULTI-TAB LUXURY MODAL */}
      {isModalOpen && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, width: "100vw", height: "100vh", background: "rgba(15, 23, 42, 0.82)", backdropFilter: "blur(10px)", zIndex: 99999, display: "flex", alignItems: "center", justifyContent: "center", padding: "1.5rem" }}>
          <div style={{ background: "#ffffff", borderRadius: "32px", maxWidth: "1080px", width: "95vw", maxHeight: "94vh", overflowY: "auto", padding: "2.5rem", boxShadow: "0 30px 60px -15px rgba(0,0,0,0.5)", border: "1px solid rgba(226, 232, 240, 0.8)", position: "relative" }}>
            
            {/* Modal Header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem", paddingBottom: "1.25rem", borderBottom: "1px solid #e2e8f0" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                <div style={{ width: "52px", height: "52px", borderRadius: "18px", background: "linear-gradient(135deg, #9D00FF 0%, #7900cc 100%)", display: "flex", alignItems: "center", justifyContent: "center", color: "#ffffff", boxShadow: "0 6px 18px rgba(157,0,255,0.35)" }}>
                  <span className="material-symbols-outlined" style={{ fontSize: "30px" }}>hotel</span>
                </div>
                <div>
                  <h2 style={{ fontSize: "1.5rem", fontWeight: 900, color: "#0f172a", margin: 0, letterSpacing: "-0.01em" }}>
                    {isCreatingNew ? "Add New Luxury Hotel / Resort" : `Edit Hotel — "${title || 'Untitled'}"`}
                  </h2>
                  <p style={{ fontSize: "0.85rem", color: "#64748b", margin: "0.2rem 0 0", fontWeight: 600 }}>
                    {editingHotel ? `Listing ID: ${editingHotel.id}` : "Configure 360° hospitality specs, dynamic tariffs, room keys, and amenities"} · Live Database Sync
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                style={{ background: "#f1f5f9", border: "none", borderRadius: "50%", width: "42px", height: "42px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#64748b" }}
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* TAB NAVIGATION BAR */}
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", overflowX: "auto", paddingBottom: "0.75rem", marginBottom: "1.5rem", borderBottom: "2px solid #f1f5f9" }}>
              {[
                { id: "general", label: "General & Branding", icon: "badge" },
                { id: "location", label: "Location & Coordinates", icon: "pin_drop" },
                { id: "pricing", label: "Pricing & Tariffs", icon: "payments" },
                { id: "specs", label: "Suites & Capacities", icon: "bed" },
                { id: "amenities", label: "Amenities & Services", icon: "room_service" },
                { id: "media", label: "Gallery & Videos", icon: "photo_library" },
                { id: "policies", label: "Policies & House Rules", icon: "gavel" }
              ].map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id as any)}
                    style={{ display: "flex", alignItems: "center", gap: "0.45rem", padding: "0.65rem 1.1rem", borderRadius: "14px", border: "none", background: isActive ? "#9D00FF" : "#f8fafc", color: isActive ? "#ffffff" : "#64748b", fontWeight: 800, fontSize: "0.85rem", cursor: "pointer", whiteSpace: "nowrap", transition: "all 0.15s ease", boxShadow: isActive ? "0 4px 12px rgba(157,0,255,0.25)" : "none" }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>{tab.icon}</span>
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {saveSuccess && (
              <div style={{ padding: "0.9rem 1.25rem", borderRadius: "14px", background: "#ecfdf5", color: "#059669", fontWeight: 800, fontSize: "0.92rem", marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "0.6rem", border: "1px solid #a7f3d0" }}>
                <span className="material-symbols-outlined">check_circle</span>
                <span>Hotel details saved successfully to live database!</span>
              </div>
            )}

            <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
              
              {/* TAB 1: GENERAL & BRANDING */}
              {activeTab === "general" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "1.25rem" }}>
                    <div>
                      <label style={{ fontSize: "0.78rem", fontWeight: 800, color: "#334155", textTransform: "uppercase", display: "block", marginBottom: "0.4rem" }}>Hotel Title *</label>
                      <input
                        type="text"
                        required
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="e.g. Royal Heritage Palace &amp; Coastal Spa"
                        style={{ width: "100%", padding: "0.85rem 1.1rem", fontSize: "0.95rem", borderRadius: "14px", border: "1px solid #cbd5e1", outline: "none", fontWeight: 800, background: "#ffffff" }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: "0.78rem", fontWeight: 800, color: "#334155", textTransform: "uppercase", display: "block", marginBottom: "0.4rem" }}>Star Rating Classification</label>
                      <select
                        value={starRating}
                        onChange={(e) => setStarRating(Number(e.target.value))}
                        style={{ width: "100%", padding: "0.85rem 1.1rem", fontSize: "0.95rem", borderRadius: "14px", border: "1px solid #cbd5e1", outline: "none", fontWeight: 800, background: "#ffffff" }}
                      >
                        <option value={5}>⭐⭐⭐⭐⭐ (5 Star Luxury Resort)</option>
                        <option value={4}>⭐⭐⭐⭐ (4 Star Premium Hotel)</option>
                        <option value={3}>⭐⭐⭐ (3 Star Boutique Heritage)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize: "0.78rem", fontWeight: 800, color: "#334155", textTransform: "uppercase", display: "block", marginBottom: "0.4rem" }}>Marketing Subtitle / Tagline</label>
                    <input
                      type="text"
                      value={subtitle}
                      onChange={(e) => setSubtitle(e.target.value)}
                      placeholder="e.g. 5-Star Oceanfront Heritage Sanctuary with Infinity Lagoon"
                      style={{ width: "100%", padding: "0.85rem 1.1rem", fontSize: "0.92rem", borderRadius: "14px", border: "1px solid #cbd5e1", outline: "none", background: "#ffffff" }}
                    />
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1.25rem" }}>
                    <div>
                      <label style={{ fontSize: "0.78rem", fontWeight: 800, color: "#334155", textTransform: "uppercase", display: "block", marginBottom: "0.4rem" }}>Listing Status</label>
                      <select
                        value={status}
                        onChange={(e) => setStatus(e.target.value)}
                        style={{ width: "100%", padding: "0.85rem 1.1rem", fontSize: "0.92rem", borderRadius: "14px", border: "1px solid #cbd5e1", outline: "none", fontWeight: 800, background: "#ffffff" }}
                      >
                        <option value="ACTIVE">ACTIVE (Published &amp; Live)</option>
                        <option value="PENDING_REVIEW">PENDING REVIEW</option>
                        <option value="PAUSED">PAUSED</option>
                        <option value="DRAFT">DRAFT</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ fontSize: "0.78rem", fontWeight: 800, color: "#334155", textTransform: "uppercase", display: "block", marginBottom: "0.4rem" }}>Host / General Manager</label>
                      <input
                        type="text"
                        value={hostName}
                        onChange={(e) => setHostName(e.target.value)}
                        placeholder="e.g. Rajesh Singhania (GM)"
                        style={{ width: "100%", padding: "0.85rem 1.1rem", fontSize: "0.92rem", borderRadius: "14px", border: "1px solid #cbd5e1", outline: "none", background: "#ffffff" }}
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: "0.78rem", fontWeight: 800, color: "#334155", textTransform: "uppercase", display: "block", marginBottom: "0.4rem" }}>Concierge Direct Line</label>
                      <input
                        type="text"
                        value={hostPhone}
                        onChange={(e) => setHostPhone(e.target.value)}
                        placeholder="+91 98765 43210"
                        style={{ width: "100%", padding: "0.85rem 1.1rem", fontSize: "0.92rem", borderRadius: "14px", border: "1px solid #cbd5e1", outline: "none", background: "#ffffff" }}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize: "0.78rem", fontWeight: 800, color: "#334155", textTransform: "uppercase", display: "block", marginBottom: "0.4rem" }}>Detailed Hotel &amp; Architecture Story</label>
                    <textarea
                      rows={4}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Describe architectural style, infinity pool views, dining experiences, airport transfer services, and room decor..."
                      style={{ width: "100%", padding: "1rem", fontSize: "0.92rem", borderRadius: "14px", border: "1px solid #cbd5e1", outline: "none", background: "#ffffff" }}
                    />
                  </div>
                </div>
              )}

              {/* TAB 2: LOCATION & GPS */}
              {activeTab === "location" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1.25rem" }}>
                    <div>
                      <label style={{ fontSize: "0.78rem", fontWeight: 800, color: "#334155", textTransform: "uppercase", display: "block", marginBottom: "0.4rem" }}>City / Destination *</label>
                      <input
                        type="text"
                        required
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        placeholder="e.g. Candolim, Goa"
                        style={{ width: "100%", padding: "0.85rem 1.1rem", fontSize: "0.92rem", borderRadius: "14px", border: "1px solid #cbd5e1", outline: "none", background: "#ffffff" }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: "0.78rem", fontWeight: 800, color: "#334155", textTransform: "uppercase", display: "block", marginBottom: "0.4rem" }}>State / Province *</label>
                      <input
                        type="text"
                        required
                        value={stateName}
                        onChange={(e) => setStateName(e.target.value)}
                        placeholder="e.g. Goa"
                        style={{ width: "100%", padding: "0.85rem 1.1rem", fontSize: "0.92rem", borderRadius: "14px", border: "1px solid #cbd5e1", outline: "none", background: "#ffffff" }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: "0.78rem", fontWeight: 800, color: "#334155", textTransform: "uppercase", display: "block", marginBottom: "0.4rem" }}>Pincode / Zip</label>
                      <input
                        type="text"
                        value={pincode}
                        onChange={(e) => setPincode(e.target.value)}
                        placeholder="403515"
                        style={{ width: "100%", padding: "0.85rem 1.1rem", fontSize: "0.92rem", borderRadius: "14px", border: "1px solid #cbd5e1", outline: "none", background: "#ffffff" }}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize: "0.78rem", fontWeight: 800, color: "#334155", textTransform: "uppercase", display: "block", marginBottom: "0.4rem" }}>Full Resort Street Address</label>
                    <input
                      type="text"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="e.g. Aguada Siolim Road, Near Candolim Beach, North Goa"
                      style={{ width: "100%", padding: "0.85rem 1.1rem", fontSize: "0.92rem", borderRadius: "14px", border: "1px solid #cbd5e1", outline: "none", background: "#ffffff" }}
                    />
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem" }}>
                    <div>
                      <label style={{ fontSize: "0.78rem", fontWeight: 800, color: "#334155", textTransform: "uppercase", display: "block", marginBottom: "0.4rem" }}>GPS Latitude</label>
                      <input
                        type="number"
                        step="any"
                        value={lat}
                        onChange={(e) => setLat(Number(e.target.value))}
                        style={{ width: "100%", padding: "0.85rem 1.1rem", fontSize: "0.92rem", borderRadius: "14px", border: "1px solid #cbd5e1", outline: "none", background: "#ffffff" }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: "0.78rem", fontWeight: 800, color: "#334155", textTransform: "uppercase", display: "block", marginBottom: "0.4rem" }}>GPS Longitude</label>
                      <input
                        type="number"
                        step="any"
                        value={lng}
                        onChange={(e) => setLng(Number(e.target.value))}
                        style={{ width: "100%", padding: "0.85rem 1.1rem", fontSize: "0.92rem", borderRadius: "14px", border: "1px solid #cbd5e1", outline: "none", background: "#ffffff" }}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: PRICING & TARIFFS */}
              {activeTab === "pricing" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1.25rem" }}>
                    <div>
                      <label style={{ fontSize: "0.78rem", fontWeight: 800, color: "#334155", textTransform: "uppercase", display: "block", marginBottom: "0.4rem" }}>Weekday Base Tariff (₹) *</label>
                      <input
                        type="number"
                        required
                        min={500}
                        value={basePrice}
                        onChange={(e) => setBasePrice(Number(e.target.value))}
                        style={{ width: "100%", padding: "0.85rem 1.1rem", fontSize: "1.05rem", borderRadius: "14px", border: "1px solid #cbd5e1", outline: "none", fontWeight: 900, color: "#9D00FF", background: "#ffffff" }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: "0.78rem", fontWeight: 800, color: "#334155", textTransform: "uppercase", display: "block", marginBottom: "0.4rem" }}>Weekend Tariff (Fri-Sun) (₹)</label>
                      <input
                        type="number"
                        min={500}
                        value={weekendPrice}
                        onChange={(e) => setWeekendPrice(Number(e.target.value))}
                        style={{ width: "100%", padding: "0.85rem 1.1rem", fontSize: "1.05rem", borderRadius: "14px", border: "1px solid #cbd5e1", outline: "none", fontWeight: 900, color: "#9D00FF", background: "#ffffff" }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: "0.78rem", fontWeight: 800, color: "#334155", textTransform: "uppercase", display: "block", marginBottom: "0.4rem" }}>GST Tax Tier (%)</label>
                      <select
                        value={gstRate}
                        onChange={(e) => setGstRate(Number(e.target.value))}
                        style={{ width: "100%", padding: "0.85rem 1.1rem", fontSize: "0.95rem", borderRadius: "14px", border: "1px solid #cbd5e1", outline: "none", fontWeight: 800, background: "#ffffff" }}
                      >
                        <option value={12}>12% GST (Tariffs under ₹7,500)</option>
                        <option value={18}>18% GST (Luxury tariffs ₹7,500+)</option>
                        <option value={0}>0% (Tax Exempt)</option>
                      </select>
                    </div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem" }}>
                    <div>
                      <label style={{ fontSize: "0.78rem", fontWeight: 800, color: "#334155", textTransform: "uppercase", display: "block", marginBottom: "0.4rem" }}>Room Service &amp; Cleaning Fee (₹)</label>
                      <input
                        type="number"
                        value={cleaningFee}
                        onChange={(e) => setCleaningFee(Number(e.target.value))}
                        style={{ width: "100%", padding: "0.85rem 1.1rem", fontSize: "0.95rem", borderRadius: "14px", border: "1px solid #cbd5e1", outline: "none", background: "#ffffff" }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: "0.78rem", fontWeight: 800, color: "#334155", textTransform: "uppercase", display: "block", marginBottom: "0.4rem" }}>Pre-Auth Security Deposit (₹)</label>
                      <input
                        type="number"
                        value={securityDeposit}
                        onChange={(e) => setSecurityDeposit(Number(e.target.value))}
                        style={{ width: "100%", padding: "0.85rem 1.1rem", fontSize: "0.95rem", borderRadius: "14px", border: "1px solid #cbd5e1", outline: "none", background: "#ffffff" }}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: SUITES & CAPACITIES */}
              {activeTab === "specs" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr 1fr", gap: "1rem" }}>
                    <div>
                      <label style={{ fontSize: "0.78rem", fontWeight: 800, color: "#334155", textTransform: "uppercase", display: "block", marginBottom: "0.4rem" }}>Max Guests</label>
                      <input
                        type="number"
                        min={1}
                        value={maxGuests}
                        onChange={(e) => setMaxGuests(Number(e.target.value))}
                        style={{ width: "100%", padding: "0.85rem 1.1rem", fontSize: "0.95rem", borderRadius: "14px", border: "1px solid #cbd5e1", outline: "none", background: "#ffffff" }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: "0.78rem", fontWeight: 800, color: "#334155", textTransform: "uppercase", display: "block", marginBottom: "0.4rem" }}>Bedrooms</label>
                      <input
                        type="number"
                        min={1}
                        value={bedrooms}
                        onChange={(e) => setBedrooms(Number(e.target.value))}
                        style={{ width: "100%", padding: "0.85rem 1.1rem", fontSize: "0.95rem", borderRadius: "14px", border: "1px solid #cbd5e1", outline: "none", background: "#ffffff" }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: "0.78rem", fontWeight: 800, color: "#334155", textTransform: "uppercase", display: "block", marginBottom: "0.4rem" }}>Beds Count</label>
                      <input
                        type="number"
                        min={1}
                        value={beds}
                        onChange={(e) => setBeds(Number(e.target.value))}
                        style={{ width: "100%", padding: "0.85rem 1.1rem", fontSize: "0.95rem", borderRadius: "14px", border: "1px solid #cbd5e1", outline: "none", background: "#ffffff" }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: "0.78rem", fontWeight: 800, color: "#334155", textTransform: "uppercase", display: "block", marginBottom: "0.4rem" }}>Bathrooms</label>
                      <input
                        type="number"
                        min={1}
                        value={bathrooms}
                        onChange={(e) => setBathrooms(Number(e.target.value))}
                        style={{ width: "100%", padding: "0.85rem 1.1rem", fontSize: "0.95rem", borderRadius: "14px", border: "1px solid #cbd5e1", outline: "none", background: "#ffffff" }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: "0.78rem", fontWeight: 800, color: "#334155", textTransform: "uppercase", display: "block", marginBottom: "0.4rem" }}>Floor Area (Sq Ft)</label>
                      <input
                        type="number"
                        value={sqft}
                        onChange={(e) => setSqft(Number(e.target.value))}
                        style={{ width: "100%", padding: "0.85rem 1.1rem", fontSize: "0.95rem", borderRadius: "14px", border: "1px solid #cbd5e1", outline: "none", background: "#ffffff" }}
                      />
                    </div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1.25rem" }}>
                    <div>
                      <label style={{ fontSize: "0.78rem", fontWeight: 800, color: "#334155", textTransform: "uppercase", display: "block", marginBottom: "0.4rem" }}>Check-In Time</label>
                      <input
                        type="text"
                        value={checkInTime}
                        onChange={(e) => setCheckInTime(e.target.value)}
                        placeholder="14:00"
                        style={{ width: "100%", padding: "0.85rem 1.1rem", fontSize: "0.92rem", borderRadius: "14px", border: "1px solid #cbd5e1", outline: "none", background: "#ffffff" }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: "0.78rem", fontWeight: 800, color: "#334155", textTransform: "uppercase", display: "block", marginBottom: "0.4rem" }}>Check-Out Time</label>
                      <input
                        type="text"
                        value={checkOutTime}
                        onChange={(e) => setCheckOutTime(e.target.value)}
                        placeholder="11:00"
                        style={{ width: "100%", padding: "0.85rem 1.1rem", fontSize: "0.92rem", borderRadius: "14px", border: "1px solid #cbd5e1", outline: "none", background: "#ffffff" }}
                      />
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", paddingTop: "1.75rem" }}>
                      <input
                        type="checkbox"
                        id="instantCheck"
                        checked={instantBook}
                        onChange={(e) => setInstantBook(e.target.checked)}
                        style={{ width: "20px", height: "20px", accentColor: "#9D00FF" }}
                      />
                      <label htmlFor="instantCheck" style={{ fontSize: "0.88rem", color: "#0f172a", fontWeight: 800, cursor: "pointer" }}>
                        ⚡ Instant Booking Enabled
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 5: AMENITIES & SERVICES */}
              {activeTab === "amenities" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                  {Object.entries(AMENITY_CATEGORIES).map(([catTitle, items]) => (
                    <div key={catTitle} style={{ background: "#f8fafc", padding: "1.25rem", borderRadius: "18px", border: "1px solid #e2e8f0" }}>
                      <h4 style={{ fontSize: "0.88rem", fontWeight: 900, color: "#0f172a", margin: "0 0 0.85rem", textTransform: "uppercase", letterSpacing: "0.04em" }}>{catTitle}</h4>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "0.6rem" }}>
                        {items.map((amenity) => {
                          const isSelected = selectedAmenities.includes(amenity);
                          return (
                            <button
                              key={amenity}
                              type="button"
                              onClick={() => toggleAmenity(amenity)}
                              style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.65rem 0.85rem", borderRadius: "12px", border: isSelected ? "2px solid #9D00FF" : "1px solid #e2e8f0", background: isSelected ? "rgba(157, 0, 255, 0.08)" : "#ffffff", color: isSelected ? "#9D00FF" : "#475569", fontWeight: 700, fontSize: "0.82rem", cursor: "pointer", textAlign: "left" }}
                            >
                              <span className="material-symbols-outlined" style={{ fontSize: "16px", color: isSelected ? "#9D00FF" : "#94a3b8" }}>
                                {isSelected ? "check_box" : "check_box_outline_blank"}
                              </span>
                              <span>{amenity}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* TAB 6: GALLERY & VIDEOS */}
              {activeTab === "media" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <h3 style={{ fontSize: "1rem", fontWeight: 900, color: "#0f172a", margin: 0 }}>High-Resolution Photo Gallery</h3>
                    <button
                      type="button"
                      onClick={addImageField}
                      style={{ padding: "0.5rem 1rem", borderRadius: "10px", border: "1px solid #9D00FF", background: "#ffffff", color: "#9D00FF", fontWeight: 800, fontSize: "0.85rem", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.3rem" }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>add_photo_alternate</span>
                      <span>Add Image URL</span>
                    </button>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                    {images.map((img, idx) => (
                      <div key={idx} style={{ display: "flex", alignItems: "center", gap: "0.75rem", background: "#f8fafc", padding: "0.75rem 1rem", borderRadius: "14px", border: "1px solid #e2e8f0" }}>
                        <span style={{ fontSize: "0.85rem", fontWeight: 900, color: "#9D00FF", width: "28px" }}>#{idx + 1}</span>
                        {img && (
                          <img
                            src={img}
                            alt=""
                            style={{ width: "48px", height: "48px", borderRadius: "8px", objectFit: "cover" }}
                            onError={(e: any) => { e.target.style.display = 'none'; }}
                          />
                        )}
                        <input
                          type="text"
                          value={img}
                          onChange={(e) => updateImageField(idx, e.target.value)}
                          placeholder="https://images.unsplash.com/..."
                          style={{ flex: 1, padding: "0.65rem 0.85rem", fontSize: "0.88rem", borderRadius: "10px", border: "1px solid #cbd5e1", outline: "none", background: "#ffffff" }}
                        />
                        <button
                          type="button"
                          onClick={() => removeImageField(idx)}
                          style={{ padding: "0.5rem", borderRadius: "10px", border: "none", background: "rgba(239, 68, 68, 0.1)", color: "#ef4444", cursor: "pointer" }}
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>delete</span>
                        </button>
                      </div>
                    ))}
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem", marginTop: "0.5rem" }}>
                    <div>
                      <label style={{ fontSize: "0.78rem", fontWeight: 800, color: "#334155", textTransform: "uppercase", display: "block", marginBottom: "0.4rem" }}>Video Walkthrough / Drone Reel URL</label>
                      <input
                        type="text"
                        value={videoUrl}
                        onChange={(e) => setVideoUrl(e.target.value)}
                        placeholder="https://..."
                        style={{ width: "100%", padding: "0.85rem 1.1rem", fontSize: "0.92rem", borderRadius: "14px", border: "1px solid #cbd5e1", outline: "none", background: "#ffffff" }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: "0.78rem", fontWeight: 800, color: "#334155", textTransform: "uppercase", display: "block", marginBottom: "0.4rem" }}>360° Matterport / VR Tour Link</label>
                      <input
                        type="text"
                        value={virtualTourUrl}
                        onChange={(e) => setVirtualTourUrl(e.target.value)}
                        placeholder="https://my.matterport.com/show/?m=..."
                        style={{ width: "100%", padding: "0.85rem 1.1rem", fontSize: "0.92rem", borderRadius: "14px", border: "1px solid #cbd5e1", outline: "none", background: "#ffffff" }}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 7: POLICIES & HOUSE RULES */}
              {activeTab === "policies" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                  <div>
                    <label style={{ fontSize: "0.78rem", fontWeight: 800, color: "#334155", textTransform: "uppercase", display: "block", marginBottom: "0.75rem" }}>Cancellation Policy Tier</label>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem" }}>
                      {CANCELLATION_POLICIES.map((p) => {
                        const isSelected = cancellationPolicy === p.id;
                        return (
                          <div
                            key={p.id}
                            onClick={() => setCancellationPolicy(p.id)}
                            style={{ padding: "1.1rem", borderRadius: "16px", border: isSelected ? "2px solid #9D00FF" : "1px solid #e2e8f0", background: isSelected ? "rgba(157, 0, 255, 0.05)" : "#f8fafc", cursor: "pointer" }}
                          >
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.4rem" }}>
                              <strong style={{ color: isSelected ? "#9D00FF" : "#0f172a", fontSize: "0.95rem" }}>{p.label}</strong>
                              {isSelected && <span className="material-symbols-outlined" style={{ color: "#9D00FF", fontSize: "18px" }}>check_circle</span>}
                            </div>
                            <p style={{ fontSize: "0.78rem", color: "#64748b", margin: 0 }}>{p.desc}</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize: "0.78rem", fontWeight: 800, color: "#334155", textTransform: "uppercase", display: "block", marginBottom: "0.4rem" }}>Resort Rules &amp; Guest Conduct Guidelines</label>
                    <textarea
                      rows={4}
                      value={houseRules}
                      onChange={(e) => setHouseRules(e.target.value)}
                      placeholder="e.g. Swimming pool timing: 7 AM to 8 PM. Valid government photo ID mandatory for all guests."
                      style={{ width: "100%", padding: "1rem", fontSize: "0.92rem", borderRadius: "14px", border: "1px solid #cbd5e1", outline: "none", background: "#ffffff" }}
                    />
                  </div>
                </div>
              )}

              {/* MODAL BOTTOM BAR */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: "1.25rem", borderTop: "1px solid #e2e8f0" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <span style={{ fontSize: "0.82rem", color: "#64748b" }}>Live Nightly Tariff:</span>
                  <strong style={{ color: "#9D00FF", fontWeight: 900, fontSize: "1.1rem" }}>
                    ₹{Number(basePrice || 0).toLocaleString("en-IN")}
                  </strong>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    style={{ padding: "0.75rem 1.5rem", borderRadius: "14px", border: "1px solid #cbd5e1", background: "#f8fafc", color: "#475569", fontWeight: 800, fontSize: "0.92rem", cursor: "pointer" }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    style={{ padding: "0.75rem 2.25rem", borderRadius: "14px", background: "linear-gradient(135deg, #9D00FF 0%, #7900cc 100%)", color: "#ffffff", fontWeight: 900, fontSize: "0.98rem", border: "none", cursor: "pointer", boxShadow: "0 4px 16px rgba(157,0,255,0.35)", opacity: saving ? 0.6 : 1 }}
                  >
                    {saving ? "Saving to Database..." : isCreatingNew ? "Publish Hotel Listing" : "Save Hotel Configuration"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
