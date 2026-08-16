"use client";

import { useEffect, useState } from "react";
import axios from "axios";

export interface CampUnit {
  id: string;
  title: string;
  subtitle?: string;
  description?: string;
  city?: string;
  state?: string;
  country?: string;
  address?: string;
  pincode?: string;
  lat?: number;
  lng?: number;
  basePrice?: number;
  weekendPrice?: number;
  cleaningFee?: number;
  securityDeposit?: number;
  status: string;
  type?: string;
  category?: { name: string };
  campType?: string;
  terrainType?: string;
  altitudeMeters?: number;
  maxGuests?: number;
  tentsCount?: number;
  beds?: number;
  bathrooms?: number;
  amenities?: string[];
  imageUrls?: string[];
  videoUrl?: string;
  trailName?: string;
  trailDifficulty?: string;
  trailDistanceKm?: number;
  hasBonfire?: boolean;
  hasStargazingTelescope?: boolean;
  hasSolarPower?: boolean;
  checkInTime?: string;
  checkOutTime?: string;
  cancellationPolicy?: string;
  houseRules?: string;
  hostName?: string;
  hostPhone?: string;
}

const CAMP_AMENITIES_CATEGORIES = {
  "Wilderness & Shelter": ["Geodesic Glamping Dome", "Weatherproof Alpine Tent", "Insulated Sleeping Bags", "Camp Cots & Mattresses", "Outdoor Firepit & Bonfire", "Stargazing Telescope"],
  "Power & Climate": ["Solar Powered Lighting", "Portable Power Stations (AC 220V)", "Gas Tent Heater", "Emergency Backup Generator", "Rechargeable Headlamps", "Hot Water Buckets/Geyser"],
  "Camp Kitchen & Meals": ["Woodfired BBQ Grill", "Campfire Dutch Oven", "Complimentary Camp Breakfast", "Unlimited Spring Water", "Evening Barbeque Buffet", "Outdoor Dining Table"],
  "Adventure & Outdoors": ["Guided Summit Trek", "Pine Forest Nature Trail", "River Crossing / Rappelling", "Acoustic Live Music Jam", "Birdwatching Kit", "Slackline & Hammocks"],
  "Safety & Eco Standards": ["Zero-Plastic Leave No Trace", "First Aid & Snake Bite Kit", "24/7 Camp Guardian", "Satellite Walkie-Talkie", "Western Eco-Dry Toilets", "Solar Perimeter Fencing"]
};

export default function CampingManagementPage() {
  const [camps, setCamps] = useState<CampUnit[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"general" | "terrain" | "pricing" | "specs" | "amenities" | "media" | "safety">("general");
  const [editingCamp, setEditingCamp] = useState<CampUnit | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Form State
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [description, setDescription] = useState("");
  const [city, setCity] = useState("Old Manali, Himachal Pradesh");
  const [stateName, setStateName] = useState("Himachal Pradesh");
  const [address, setAddress] = useState("Pine Valley Ridge, Upper Manali");
  const [lat, setLat] = useState(32.2596);
  const [lng, setLng] = useState(77.1743);
  const [campType, setCampType] = useState("Geodesic Glamping Dome");
  const [terrainType, setTerrainType] = useState("Pine Forest & Alpine Ridge");
  const [altitudeMeters, setAltitudeMeters] = useState(2450);
  const [basePrice, setBasePrice] = useState(3500);
  const [weekendPrice, setWeekendPrice] = useState(4200);
  const [securityDeposit, setSecurityDeposit] = useState(1500);
  const [maxGuests, setMaxGuests] = useState(3);
  const [tentsCount, setTentsCount] = useState(1);
  const [beds, setBeds] = useState(3);
  const [trailName, setTrailName] = useState("Triund Alpine Ridge & Forest Crest");
  const [trailDifficulty, setTrailDifficulty] = useState("Moderate");
  const [trailDistanceKm, setTrailDistanceKm] = useState(4.5);
  const [hasBonfire, setHasBonfire] = useState(true);
  const [hasStargazingTelescope, setHasStargazingTelescope] = useState(true);
  const [hasSolarPower, setHasSolarPower] = useState(true);
  const [checkInTime, setCheckInTime] = useState("13:00");
  const [checkOutTime, setCheckOutTime] = useState("10:30");
  const [cancellationPolicy, setCancellationPolicy] = useState("moderate");
  const [houseRules, setHouseRules] = useState("Strict Leave-No-Trace. No plastic littering. Bonfire extinguished by 11:30 PM.");
  const [hostName, setHostName] = useState("Alpine Trailblazers Camp Co.");
  const [hostPhone, setHostPhone] = useState("+91 98123 45678");
  const [status, setStatus] = useState("ACTIVE");
  const [images, setImages] = useState<string[]>([""]);
  const [videoUrl, setVideoUrl] = useState("");
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([
    "Geodesic Glamping Dome", "Outdoor Firepit & Bonfire", "Stargazing Telescope", "Solar Powered Lighting", "Guided Summit Trek", "Zero-Plastic Leave No Trace"
  ]);

  const fetchCamps = async () => {
    try {
      setLoading(true);
      const res = await axios.get("/api/v1/properties");
      if (Array.isArray(res.data)) {
        const campList = res.data.filter(
          (p: any) =>
            p.category?.name === "CAMPING_SITE" ||
            p.category === "CAMPING_SITE" ||
            p.type === "CAMPING_SITE" ||
            p.title?.toLowerCase().includes("camp") ||
            p.title?.toLowerCase().includes("glamping") ||
            p.title?.toLowerCase().includes("dome") ||
            p.title?.toLowerCase().includes("tent")
        );
        setCamps(campList);
      }
    } catch {
      // Fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCamps();
  }, []);

  const openCreateModal = () => {
    setIsCreatingNew(true);
    setEditingCamp(null);
    setActiveTab("general");
    setTitle("");
    setSubtitle("Stargazing Geodesic Dome with Mountain Panorama");
    setDescription("");
    setCity("Old Manali, Himachal Pradesh");
    setStateName("Himachal Pradesh");
    setAddress("Pine Ridge Trailhead, Upper Old Manali");
    setLat(32.2596);
    setLng(77.1743);
    setCampType("Geodesic Glamping Dome");
    setTerrainType("Pine Forest & Alpine Ridge");
    setAltitudeMeters(2450);
    setBasePrice(3500);
    setWeekendPrice(4200);
    setSecurityDeposit(1500);
    setMaxGuests(3);
    setTentsCount(1);
    setBeds(3);
    setTrailName("Triund Alpine Ridge & Forest Crest");
    setTrailDifficulty("Moderate");
    setTrailDistanceKm(4.5);
    setHasBonfire(true);
    setHasStargazingTelescope(true);
    setHasSolarPower(true);
    setCheckInTime("13:00");
    setCheckOutTime("10:30");
    setCancellationPolicy("moderate");
    setHouseRules("Leave No Trace. Zero plastic littering. Bonfire lit at 7 PM.");
    setHostName("Alpine Trailblazers Expedition");
    setHostPhone("+91 98123 45678");
    setStatus("ACTIVE");
    setImages([
      "https://images.unsplash.com/photo-1510312305653-8ed496efae75?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1478131143081-80f7f84ca84d?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?auto=format&fit=crop&w=1200&q=80"
    ]);
    setVideoUrl("");
    setSelectedAmenities([
      "Geodesic Glamping Dome", "Outdoor Firepit & Bonfire", "Stargazing Telescope", "Solar Powered Lighting", "Guided Summit Trek", "Zero-Plastic Leave No Trace"
    ]);
    setSaveSuccess(false);
    setIsModalOpen(true);
  };

  const openEditModal = (camp: CampUnit) => {
    setIsCreatingNew(false);
    setEditingCamp(camp);
    setActiveTab("general");
    setTitle(camp.title || "");
    setSubtitle(camp.subtitle || "Wilderness Campsite & Stargazing Dome");
    setDescription(camp.description || "");
    setCity(camp.city || "Himachal Pradesh");
    setStateName(camp.state || "Himachal Pradesh");
    setAddress(camp.address || "");
    setLat(camp.lat || 32.2596);
    setLng(camp.lng || 77.1743);
    setCampType(camp.campType || "Geodesic Glamping Dome");
    setTerrainType(camp.terrainType || "Alpine Forest");
    setAltitudeMeters(camp.altitudeMeters || 2450);
    setBasePrice(Number(camp.basePrice) || 3500);
    setWeekendPrice(Number(camp.weekendPrice) || 4200);
    setSecurityDeposit(Number(camp.securityDeposit) || 1500);
    setMaxGuests(camp.maxGuests || 3);
    setTentsCount(camp.tentsCount || 1);
    setBeds(camp.beds || 3);
    setTrailName(camp.trailName || "Sunrise Forest Trail");
    setTrailDifficulty(camp.trailDifficulty || "Moderate");
    setTrailDistanceKm(camp.trailDistanceKm || 4.5);
    setHasBonfire(camp.hasBonfire ?? true);
    setHasStargazingTelescope(camp.hasStargazingTelescope ?? true);
    setHasSolarPower(camp.hasSolarPower ?? true);
    setCheckInTime(camp.checkInTime || "13:00");
    setCheckOutTime(camp.checkOutTime || "10:30");
    setCancellationPolicy(camp.cancellationPolicy || "moderate");
    setHouseRules(camp.houseRules || "Leave no trace.");
    setHostName(camp.hostName || "Camp Warden");
    setHostPhone(camp.hostPhone || "+91 98123 45678");
    setStatus(camp.status || "ACTIVE");
    setImages(camp.imageUrls && camp.imageUrls.length > 0 ? camp.imageUrls : ["https://images.unsplash.com/photo-1510312305653-8ed496efae75?auto=format&fit=crop&w=1200&q=80"]);
    setVideoUrl(camp.videoUrl || "");
    setSelectedAmenities(camp.amenities && camp.amenities.length > 0 ? camp.amenities : ["Geodesic Glamping Dome", "Outdoor Firepit & Bonfire"]);
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
      description: `${description} | Camp Type: ${campType}, Terrain: ${terrainType} (${altitudeMeters}m altitude), Trail: ${trailName} (${trailDifficulty}, ${trailDistanceKm}km), Bonfire: ${hasBonfire ? "Yes" : "No"}, Telescope: ${hasStargazingTelescope ? "Yes" : "No"}`,
      type: "HOTEL",
      category: "CAMPING_SITE",
      city,
      state: stateName,
      address,
      lat: Number(lat),
      lng: Number(lng),
      basePrice: Number(basePrice),
      pricePerNight: Number(basePrice),
      weekendPrice: Number(weekendPrice),
      securityDeposit: Number(securityDeposit),
      maxGuests: Number(maxGuests),
      bedrooms: 1,
      beds: Number(beds),
      bathrooms: 1,
      amenities: selectedAmenities,
      images: validImages.length > 0 ? validImages : ["https://images.unsplash.com/photo-1510312305653-8ed496efae75?auto=format&fit=crop&w=1200&q=80"],
      videoUrls: videoUrl ? [videoUrl] : [],
      status,
    };

    const axiosConfig = {
      headers: { "x-admin-key": "stayq-admin-secret-2026" },
    };

    try {
      if (isCreatingNew) {
        await axios.post("/api/v1/properties", payload, axiosConfig);
      } else if (editingCamp) {
        await axios.patch(`/api/v1/properties/${editingCamp.id}`, payload, axiosConfig);
      }
      setSaveSuccess(true);
      await fetchCamps();
      setTimeout(() => {
        setIsModalOpen(false);
      }, 700);
    } catch (err) {
      console.warn("Camp save note:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to remove campsite "${name}"?`)) return;
    try {
      await axios.delete(`/api/v1/properties/${id}`, {
        headers: { "x-admin-key": "stayq-admin-secret-2026" },
      });
      await fetchCamps();
    } catch (err) {
      console.warn("Delete note:", err);
    }
  };

  const filtered = camps.filter(
    (c) =>
      c.title?.toLowerCase().includes(search.toLowerCase()) ||
      c.city?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem", paddingBottom: "4rem" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem", background: "#ffffff", padding: "1.75rem", borderRadius: "20px", border: "1px solid #e2e8f0", boxShadow: "0 2px 6px rgba(0,0,0,0.03)" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "#059669", fontWeight: 900, fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.35rem" }}>
            <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>camping</span>
            <span>Wilderness, Stargazing &amp; Glamping Suite</span>
          </div>
          <h1 style={{ fontSize: "1.75rem", fontWeight: 900, color: "#0f172a", margin: "0 0 0.35rem", letterSpacing: "-0.02em" }}>Campsites &amp; Glamping Command</h1>
          <p style={{ fontSize: "0.92rem", color: "#64748b", margin: 0, maxWidth: "700px" }}>
            Comprehensive management for geodesic domes, alpine tents, summit trekking trails, evening bonfires, stargazing telescopes, and eco-standards.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          style={{ display: "flex", alignItems: "center", gap: "0.6rem", padding: "0.85rem 1.75rem", background: "linear-gradient(135deg, #059669 0%, #047857 100%)", color: "#ffffff", fontWeight: 800, fontSize: "0.95rem", borderRadius: "16px", border: "none", cursor: "pointer", boxShadow: "0 4px 16px rgba(5,150,105,0.35)", transition: "all 0.2s ease" }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: "22px" }}>add_circle</span>
          <span>Add Campsite / Glamping</span>
        </button>
      </div>

      {/* Search & KPI Summary */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: "1rem", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", background: "#ffffff", padding: "0.9rem 1.25rem", borderRadius: "16px", border: "1px solid #e2e8f0" }}>
          <span className="material-symbols-outlined" style={{ color: "#94a3b8", fontSize: "22px" }}>search</span>
          <input
            type="text"
            placeholder="Search campsites by name, mountain valley, trekking trail, dome type..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ flex: 1, border: "none", outline: "none", fontSize: "0.95rem", color: "#0f172a", background: "transparent" }}
          />
        </div>
        <div style={{ background: "#ffffff", padding: "0.75rem 1.25rem", borderRadius: "16px", border: "1px solid #e2e8f0", display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <span style={{ fontSize: "0.82rem", color: "#64748b", fontWeight: 700 }}>Total Campsites:</span>
          <strong style={{ fontSize: "1rem", color: "#0f172a", fontWeight: 900 }}>{camps.length}</strong>
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div style={{ padding: "4rem", textAlign: "center", color: "#64748b", background: "#ffffff", borderRadius: "20px", border: "1px solid #e2e8f0" }}>Loading campsite database...</div>
      ) : filtered.length === 0 ? (
        <div style={{ padding: "4rem", textAlign: "center", background: "#ffffff", borderRadius: "20px", border: "1px solid #e2e8f0" }}>
          <p style={{ color: "#64748b", fontWeight: 700, margin: 0, fontSize: "1.1rem" }}>No campsites found. Click &ldquo;Add Campsite / Glamping&rdquo; to list one!</p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(350px, 1fr))", gap: "1.5rem" }}>
          {filtered.map((camp) => (
            <div
              key={camp.id}
              style={{ background: "#ffffff", borderRadius: "24px", border: "1px solid #e2e8f0", overflow: "hidden", boxShadow: "0 2px 10px rgba(0,0,0,0.03)", display: "flex", flexDirection: "column" }}
            >
              <div style={{ position: "relative", height: "220px", background: "#f1f5f9" }}>
                <img
                  src={camp.imageUrls?.[0] || "/images/camp_1.jpg"}
                  alt={camp.title}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
                <div style={{ position: "absolute", top: "12px", right: "12px", background: "rgba(5, 150, 105, 0.95)", backdropFilter: "blur(8px)", color: "#ffffff", padding: "0.35rem 0.85rem", borderRadius: "999px", fontSize: "0.78rem", fontWeight: 800, display: "flex", alignItems: "center", gap: "4px" }}>
                  <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>local_fire_department</span>
                  <span>Bonfire &amp; Stargazing</span>
                </div>
                <div style={{ position: "absolute", bottom: "12px", left: "12px", background: "rgba(15, 23, 42, 0.85)", backdropFilter: "blur(6px)", color: "#ffffff", padding: "0.25rem 0.75rem", borderRadius: "8px", fontSize: "0.72rem", fontWeight: 800 }}>
                  {camp.city || "Himachal Pradesh"}
                </div>
              </div>

              <div style={{ padding: "1.5rem", flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between", gap: "1.25rem" }}>
                <div>
                  <h3 style={{ fontSize: "1.15rem", fontWeight: 900, color: "#0f172a", margin: "0 0 0.35rem", lineHeight: 1.3 }}>{camp.title}</h3>
                  <p style={{ fontSize: "0.85rem", color: "#64748b", display: "flex", alignItems: "center", gap: "0.3rem", margin: 0 }}>
                    <span className="material-symbols-outlined" style={{ fontSize: "16px", color: "#059669" }}>explore</span>
                    <span>{camp.city || "Himachal Pradesh, India"}</span>
                  </p>
                </div>

                <div style={{ background: "#f8fafc", padding: "0.85rem 1rem", borderRadius: "14px", border: "1px solid #f1f5f9", fontSize: "0.82rem", color: "#475569", display: "flex", flexDirection: "column", gap: "0.45rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span>Tent Capacity:</span>
                    <strong style={{ color: "#0f172a" }}>{camp.maxGuests || 3} Guests / Dome</strong>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span>Eco Features:</span>
                    <span style={{ color: "#059669", fontWeight: 800 }}>Solar · Zero Plastic · Leave No Trace</span>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: "0.85rem", borderTop: "1px solid #f1f5f9" }}>
                  <div>
                    <span style={{ fontSize: "0.72rem", color: "#94a3b8", display: "block", textTransform: "uppercase", fontWeight: 700 }}>Tariff / Night</span>
                    <strong style={{ color: "#059669", fontWeight: 900, fontSize: "1.25rem" }}>
                      ₹{Number(camp.basePrice || 3500).toLocaleString("en-IN")}
                      <span style={{ fontSize: "0.78rem", color: "#64748b", fontWeight: 600 }}>/night</span>
                    </strong>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <button
                      type="button"
                      onClick={() => openEditModal(camp)}
                      style={{ padding: "0.6rem 1rem", borderRadius: "12px", border: "1px solid #e2e8f0", background: "#f8fafc", color: "#059669", fontWeight: 800, fontSize: "0.85rem", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.35rem" }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>edit</span>
                      <span>Edit</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(camp.id, camp.title)}
                      style={{ padding: "0.6rem", borderRadius: "12px", border: "none", background: "rgba(239, 68, 68, 0.1)", color: "#ef4444", cursor: "pointer" }}
                      title="Delete Camp"
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

      {/* ULTRA-EXPANDED MULTI-TAB GLAMPING MODAL */}
      {isModalOpen && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, width: "100vw", height: "100vh", background: "rgba(15, 23, 42, 0.82)", backdropFilter: "blur(10px)", zIndex: 99999, display: "flex", alignItems: "center", justifyContent: "center", padding: "1.5rem" }}>
          <div style={{ background: "#ffffff", borderRadius: "32px", maxWidth: "1080px", width: "95vw", maxHeight: "94vh", overflowY: "auto", padding: "2.5rem", boxShadow: "0 30px 60px -15px rgba(0,0,0,0.5)", border: "1px solid rgba(226, 232, 240, 0.8)", position: "relative" }}>
            
            {/* Modal Header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem", paddingBottom: "1.25rem", borderBottom: "1px solid #e2e8f0" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                <div style={{ width: "52px", height: "52px", borderRadius: "18px", background: "linear-gradient(135deg, #059669 0%, #047857 100%)", display: "flex", alignItems: "center", justifyContent: "center", color: "#ffffff", boxShadow: "0 6px 18px rgba(5,150,105,0.35)" }}>
                  <span className="material-symbols-outlined" style={{ fontSize: "30px" }}>camping</span>
                </div>
                <div>
                  <h2 style={{ fontSize: "1.5rem", fontWeight: 900, color: "#0f172a", margin: 0, letterSpacing: "-0.01em" }}>
                    {isCreatingNew ? "Add Campsite or Glamping Dome" : `Edit Campsite — "${title || 'Untitled'}"`}
                  </h2>
                  <p style={{ fontSize: "0.85rem", color: "#64748b", margin: "0.2rem 0 0", fontWeight: 600 }}>
                    {editingCamp ? `Site ID: ${editingCamp.id}` : "Configure alpine domes, trekking routes, campfire schedules, and eco facilities"} · Live Database Sync
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
                { id: "general", label: "Camp & Dome Details", icon: "badge" },
                { id: "terrain", label: "Terrain & Trekking Trails", icon: "landscape" },
                { id: "pricing", label: "Nightly Tariffs & Surcharges", icon: "payments" },
                { id: "specs", label: "Dome Capacity & Campfire", icon: "local_fire_department" },
                { id: "amenities", label: "Wilderness Amenities", icon: "outdoor_grill" },
                { id: "media", label: "Photos & Drone Reel", icon: "photo_library" },
                { id: "safety", label: "Eco Rules & Leave No Trace", icon: "eco" }
              ].map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id as any)}
                    style={{ display: "flex", alignItems: "center", gap: "0.45rem", padding: "0.65rem 1.1rem", borderRadius: "14px", border: "none", background: isActive ? "#059669" : "#f8fafc", color: isActive ? "#ffffff" : "#64748b", fontWeight: 800, fontSize: "0.85rem", cursor: "pointer", whiteSpace: "nowrap", transition: "all 0.15s ease", boxShadow: isActive ? "0 4px 12px rgba(5,150,105,0.25)" : "none" }}
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
                <span>Campsite details saved successfully to live database!</span>
              </div>
            )}

            <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
              
              {/* TAB 1: GENERAL */}
              {activeTab === "general" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "1.25rem" }}>
                    <div>
                      <label style={{ fontSize: "0.78rem", fontWeight: 800, color: "#334155", textTransform: "uppercase", display: "block", marginBottom: "0.4rem" }}>Campsite Name *</label>
                      <input
                        type="text"
                        required
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="e.g. Pine Ridge Geodesic Stargazing Dome &amp; Camp"
                        style={{ width: "100%", padding: "0.85rem 1.1rem", fontSize: "0.95rem", borderRadius: "14px", border: "1px solid #cbd5e1", outline: "none", fontWeight: 800, background: "#ffffff" }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: "0.78rem", fontWeight: 800, color: "#334155", textTransform: "uppercase", display: "block", marginBottom: "0.4rem" }}>Structure / Shelter Type</label>
                      <select
                        value={campType}
                        onChange={(e) => setCampType(e.target.value)}
                        style={{ width: "100%", padding: "0.85rem 1.1rem", fontSize: "0.95rem", borderRadius: "14px", border: "1px solid #cbd5e1", outline: "none", fontWeight: 800, background: "#ffffff" }}
                      >
                        <option value="Geodesic Glamping Dome">Geodesic Glamping Dome</option>
                        <option value="Alpine Weatherproof Tent">Alpine Weatherproof Tent</option>
                        <option value="Luxury Safari Tent">Luxury Safari Tent</option>
                        <option value="Riverside Camp Pitch">Riverside Camp Pitch</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize: "0.78rem", fontWeight: 800, color: "#334155", textTransform: "uppercase", display: "block", marginBottom: "0.4rem" }}>Subtitle Tagline</label>
                    <input
                      type="text"
                      value={subtitle}
                      onChange={(e) => setSubtitle(e.target.value)}
                      placeholder="e.g. High-Altitude Stargazing Dome with 360° Himalayan Mountain Views"
                      style={{ width: "100%", padding: "0.85rem 1.1rem", fontSize: "0.92rem", borderRadius: "14px", border: "1px solid #cbd5e1", outline: "none", background: "#ffffff" }}
                    />
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1.25rem" }}>
                    <div>
                      <label style={{ fontSize: "0.78rem", fontWeight: 800, color: "#334155", textTransform: "uppercase", display: "block", marginBottom: "0.4rem" }}>Camp Host / Outfitter</label>
                      <input
                        type="text"
                        value={hostName}
                        onChange={(e) => setHostName(e.target.value)}
                        placeholder="e.g. Alpine Expeditions"
                        style={{ width: "100%", padding: "0.85rem 1.1rem", fontSize: "0.92rem", borderRadius: "14px", border: "1px solid #cbd5e1", outline: "none", background: "#ffffff" }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: "0.78rem", fontWeight: 800, color: "#334155", textTransform: "uppercase", display: "block", marginBottom: "0.4rem" }}>Emergency Phone</label>
                      <input
                        type="text"
                        value={hostPhone}
                        onChange={(e) => setHostPhone(e.target.value)}
                        placeholder="+91 98123 45678"
                        style={{ width: "100%", padding: "0.85rem 1.1rem", fontSize: "0.92rem", borderRadius: "14px", border: "1px solid #cbd5e1", outline: "none", background: "#ffffff" }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: "0.78rem", fontWeight: 800, color: "#334155", textTransform: "uppercase", display: "block", marginBottom: "0.4rem" }}>Status</label>
                      <select
                        value={status}
                        onChange={(e) => setStatus(e.target.value)}
                        style={{ width: "100%", padding: "0.85rem 1.1rem", fontSize: "0.95rem", borderRadius: "14px", border: "1px solid #cbd5e1", outline: "none", fontWeight: 800, background: "#ffffff" }}
                      >
                        <option value="ACTIVE">ACTIVE (Open for Booking)</option>
                        <option value="SEASONAL_CLOSED">SEASONALLY CLOSED (Winter/Monsoon)</option>
                        <option value="PAUSED">PAUSED</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize: "0.78rem", fontWeight: 800, color: "#334155", textTransform: "uppercase", display: "block", marginBottom: "0.4rem" }}>Camp Experience Story &amp; Setting</label>
                    <textarea
                      rows={4}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Describe the wilderness valley, sunrise views over snowy peaks, telescope stargazing, and acoustic bonfire evenings..."
                      style={{ width: "100%", padding: "1rem", fontSize: "0.92rem", borderRadius: "14px", border: "1px solid #cbd5e1", outline: "none", background: "#ffffff" }}
                    />
                  </div>
                </div>
              )}

              {/* TAB 2: TERRAIN & TRAILS */}
              {activeTab === "terrain" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1.25rem" }}>
                    <div>
                      <label style={{ fontSize: "0.78rem", fontWeight: 800, color: "#334155", textTransform: "uppercase", display: "block", marginBottom: "0.4rem" }}>Mountain Region / Valley *</label>
                      <input
                        type="text"
                        required
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        placeholder="e.g. Old Manali, Himachal"
                        style={{ width: "100%", padding: "0.85rem 1.1rem", fontSize: "0.92rem", borderRadius: "14px", border: "1px solid #cbd5e1", outline: "none", background: "#ffffff" }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: "0.78rem", fontWeight: 800, color: "#334155", textTransform: "uppercase", display: "block", marginBottom: "0.4rem" }}>Terrain Type</label>
                      <input
                        type="text"
                        value={terrainType}
                        onChange={(e) => setTerrainType(e.target.value)}
                        placeholder="e.g. Pine Forest &amp; Ridge"
                        style={{ width: "100%", padding: "0.85rem 1.1rem", fontSize: "0.92rem", borderRadius: "14px", border: "1px solid #cbd5e1", outline: "none", background: "#ffffff" }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: "0.78rem", fontWeight: 800, color: "#334155", textTransform: "uppercase", display: "block", marginBottom: "0.4rem" }}>Altitude (Meters AMSL)</label>
                      <input
                        type="number"
                        value={altitudeMeters}
                        onChange={(e) => setAltitudeMeters(Number(e.target.value))}
                        style={{ width: "100%", padding: "0.85rem 1.1rem", fontSize: "0.92rem", borderRadius: "14px", border: "1px solid #cbd5e1", outline: "none", background: "#ffffff" }}
                      />
                    </div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: "1.25rem" }}>
                    <div>
                      <label style={{ fontSize: "0.78rem", fontWeight: 800, color: "#334155", textTransform: "uppercase", display: "block", marginBottom: "0.4rem" }}>Nearby Trekking Route / Trail</label>
                      <input
                        type="text"
                        value={trailName}
                        onChange={(e) => setTrailName(e.target.value)}
                        placeholder="e.g. Triund Summit, Old Manali Forest Ridge"
                        style={{ width: "100%", padding: "0.85rem 1.1rem", fontSize: "0.92rem", borderRadius: "14px", border: "1px solid #cbd5e1", outline: "none", background: "#ffffff" }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: "0.78rem", fontWeight: 800, color: "#334155", textTransform: "uppercase", display: "block", marginBottom: "0.4rem" }}>Trail Difficulty</label>
                      <select
                        value={trailDifficulty}
                        onChange={(e) => setTrailDifficulty(e.target.value)}
                        style={{ width: "100%", padding: "0.85rem 1.1rem", fontSize: "0.92rem", borderRadius: "14px", border: "1px solid #cbd5e1", outline: "none", background: "#ffffff" }}
                      >
                        <option value="Easy">Easy (Family / Beginner)</option>
                        <option value="Moderate">Moderate (Alpine Trail)</option>
                        <option value="Challenging">Challenging (Summit Ascent)</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ fontSize: "0.78rem", fontWeight: 800, color: "#334155", textTransform: "uppercase", display: "block", marginBottom: "0.4rem" }}>Trail Distance (km)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={trailDistanceKm}
                        onChange={(e) => setTrailDistanceKm(Number(e.target.value))}
                        style={{ width: "100%", padding: "0.85rem 1.1rem", fontSize: "0.92rem", borderRadius: "14px", border: "1px solid #cbd5e1", outline: "none", background: "#ffffff" }}
                      />
                    </div>
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

              {/* TAB 3: PRICING */}
              {activeTab === "pricing" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1.25rem" }}>
                    <div>
                      <label style={{ fontSize: "0.78rem", fontWeight: 800, color: "#334155", textTransform: "uppercase", display: "block", marginBottom: "0.4rem" }}>Nightly Tariff (₹) *</label>
                      <input
                        type="number"
                        required
                        min={500}
                        value={basePrice}
                        onChange={(e) => setBasePrice(Number(e.target.value))}
                        style={{ width: "100%", padding: "0.85rem 1.1rem", fontSize: "1.05rem", borderRadius: "14px", border: "1px solid #cbd5e1", outline: "none", fontWeight: 900, color: "#059669", background: "#ffffff" }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: "0.78rem", fontWeight: 800, color: "#334155", textTransform: "uppercase", display: "block", marginBottom: "0.4rem" }}>Weekend Tariff (Fri-Sun) (₹)</label>
                      <input
                        type="number"
                        min={500}
                        value={weekendPrice}
                        onChange={(e) => setWeekendPrice(Number(e.target.value))}
                        style={{ width: "100%", padding: "0.85rem 1.1rem", fontSize: "1.05rem", borderRadius: "14px", border: "1px solid #cbd5e1", outline: "none", fontWeight: 900, color: "#059669", background: "#ffffff" }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: "0.78rem", fontWeight: 800, color: "#334155", textTransform: "uppercase", display: "block", marginBottom: "0.4rem" }}>Security Deposit (₹)</label>
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

              {/* TAB 4: SPECS & CAMPFIRE */}
              {activeTab === "specs" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1.25rem" }}>
                    <div>
                      <label style={{ fontSize: "0.78rem", fontWeight: 800, color: "#334155", textTransform: "uppercase", display: "block", marginBottom: "0.4rem" }}>Max Guests / Dome</label>
                      <input
                        type="number"
                        min={1}
                        value={maxGuests}
                        onChange={(e) => setMaxGuests(Number(e.target.value))}
                        style={{ width: "100%", padding: "0.85rem 1.1rem", fontSize: "0.95rem", borderRadius: "14px", border: "1px solid #cbd5e1", outline: "none", background: "#ffffff" }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: "0.78rem", fontWeight: 800, color: "#334155", textTransform: "uppercase", display: "block", marginBottom: "0.4rem" }}>Sleeping Cots / Mattresses</label>
                      <input
                        type="number"
                        min={1}
                        value={beds}
                        onChange={(e) => setBeds(Number(e.target.value))}
                        style={{ width: "100%", padding: "0.85rem 1.1rem", fontSize: "0.95rem", borderRadius: "14px", border: "1px solid #cbd5e1", outline: "none", background: "#ffffff" }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: "0.78rem", fontWeight: 800, color: "#334155", textTransform: "uppercase", display: "block", marginBottom: "0.4rem" }}>Tents / Domes on Site</label>
                      <input
                        type="number"
                        min={1}
                        value={tentsCount}
                        onChange={(e) => setTentsCount(Number(e.target.value))}
                        style={{ width: "100%", padding: "0.85rem 1.1rem", fontSize: "0.95rem", borderRadius: "14px", border: "1px solid #cbd5e1", outline: "none", background: "#ffffff" }}
                      />
                    </div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem", background: "#f8fafc", padding: "1.25rem", borderRadius: "16px", border: "1px solid #e2e8f0" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                      <input
                        type="checkbox"
                        id="bonfireCheck"
                        checked={hasBonfire}
                        onChange={(e) => setHasBonfire(e.target.checked)}
                        style={{ width: "20px", height: "20px", accentColor: "#059669" }}
                      />
                      <label htmlFor="bonfireCheck" style={{ fontSize: "0.85rem", color: "#0f172a", fontWeight: 800, cursor: "pointer" }}>
                        🔥 Evening Bonfire Included
                      </label>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                      <input
                        type="checkbox"
                        id="telescopeCheck"
                        checked={hasStargazingTelescope}
                        onChange={(e) => setHasStargazingTelescope(e.target.checked)}
                        style={{ width: "20px", height: "20px", accentColor: "#059669" }}
                      />
                      <label htmlFor="telescopeCheck" style={{ fontSize: "0.85rem", color: "#0f172a", fontWeight: 800, cursor: "pointer" }}>
                        🔭 Stargazing Telescope
                      </label>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                      <input
                        type="checkbox"
                        id="solarCheck"
                        checked={hasSolarPower}
                        onChange={(e) => setHasSolarPower(e.target.checked)}
                        style={{ width: "20px", height: "20px", accentColor: "#059669" }}
                      />
                      <label htmlFor="solarCheck" style={{ fontSize: "0.85rem", color: "#0f172a", fontWeight: 800, cursor: "pointer" }}>
                        ☀️ 100% Solar Eco Powered
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 5: AMENITIES */}
              {activeTab === "amenities" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                  {Object.entries(CAMP_AMENITIES_CATEGORIES).map(([catTitle, items]) => (
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
                              style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.65rem 0.85rem", borderRadius: "12px", border: isSelected ? "2px solid #059669" : "1px solid #e2e8f0", background: isSelected ? "rgba(5, 150, 105, 0.08)" : "#ffffff", color: isSelected ? "#059669" : "#475569", fontWeight: 700, fontSize: "0.82rem", cursor: "pointer", textAlign: "left" }}
                            >
                              <span className="material-symbols-outlined" style={{ fontSize: "16px", color: isSelected ? "#059669" : "#94a3b8" }}>
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

              {/* TAB 6: MEDIA */}
              {activeTab === "media" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <h3 style={{ fontSize: "1rem", fontWeight: 900, color: "#0f172a", margin: 0 }}>Campsite &amp; Stargazing Photo Gallery</h3>
                    <button
                      type="button"
                      onClick={addImageField}
                      style={{ padding: "0.5rem 1rem", borderRadius: "10px", border: "1px solid #059669", background: "#ffffff", color: "#059669", fontWeight: 800, fontSize: "0.85rem", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.3rem" }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>add_photo_alternate</span>
                      <span>Add Image URL</span>
                    </button>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                    {images.map((img, idx) => (
                      <div key={idx} style={{ display: "flex", alignItems: "center", gap: "0.75rem", background: "#f8fafc", padding: "0.75rem 1rem", borderRadius: "14px", border: "1px solid #e2e8f0" }}>
                        <span style={{ fontSize: "0.85rem", fontWeight: 900, color: "#059669", width: "28px" }}>#{idx + 1}</span>
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
                </div>
              )}

              {/* TAB 7: SAFETY & ECO RULES */}
              {activeTab === "safety" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                  <div>
                    <label style={{ fontSize: "0.78rem", fontWeight: 800, color: "#334155", textTransform: "uppercase", display: "block", marginBottom: "0.4rem" }}>Eco Principles &amp; Leave No Trace Rules</label>
                    <textarea
                      rows={4}
                      value={houseRules}
                      onChange={(e) => setHouseRules(e.target.value)}
                      placeholder="e.g. Strictly zero plastic wrappers left on trails. Campfires only in designated stone pits. Silence zone after 11:30 PM."
                      style={{ width: "100%", padding: "1rem", fontSize: "0.92rem", borderRadius: "14px", border: "1px solid #cbd5e1", outline: "none", background: "#ffffff" }}
                    />
                  </div>
                </div>
              )}

              {/* MODAL BOTTOM BAR */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: "1.25rem", borderTop: "1px solid #e2e8f0" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <span style={{ fontSize: "0.82rem", color: "#64748b" }}>Live Tariff / Night:</span>
                  <strong style={{ color: "#059669", fontWeight: 900, fontSize: "1.1rem" }}>
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
                    style={{ padding: "0.75rem 2.25rem", borderRadius: "14px", background: "linear-gradient(135deg, #059669 0%, #047857 100%)", color: "#ffffff", fontWeight: 900, fontSize: "0.95rem", border: "none", cursor: "pointer", boxShadow: "0 4px 16px rgba(5,150,105,0.35)", opacity: saving ? 0.6 : 1 }}
                  >
                    {saving ? "Saving Campsite..." : isCreatingNew ? "Publish Campsite" : "Save Campsite Details"}
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
