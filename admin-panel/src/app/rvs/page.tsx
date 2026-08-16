"use client";

import { useEffect, useState } from "react";
import axios from "axios";

export interface RVUnit {
  id: string;
  title: string;
  subtitle?: string;
  description?: string;
  city?: string;
  state?: string;
  country?: string;
  address?: string;
  lat?: number;
  lng?: number;
  basePrice?: number;
  weekendPrice?: number;
  securityDeposit?: number;
  cleaningFee?: number;
  status: string;
  type?: string;
  category?: { name: string };
  vehicleType?: string;
  berths?: number;
  beds?: number;
  transmission?: string;
  fuelType?: string;
  mileageLimitKm?: number;
  extraKmRate?: number;
  waterTankLitres?: number;
  solarWattage?: number;
  batteryCapacityAh?: number;
  amenities?: string[];
  imageUrls?: string[];
  videoUrl?: string;
  pickupLocation?: string;
  deliveryAvailable?: boolean;
  handoverChecklist?: string[];
  hostName?: string;
  hostPhone?: string;
  cancellationPolicy?: string;
  houseRules?: string;
}

const RV_AMENITIES_CATEGORIES = {
  "Living & Sleeping": ["Double Island Bed", "Pop-Top Roof Berth", "Convertible Dinette Bed", "High-Density Foam Mattress", "Privacy Blackout Curtains", "LED Ambient Cabin Lighting"],
  "Off-Grid Power & Solar": ["400W Monocrystalline Solar Panels", "200Ah Lithium LiFePO4 Battery", "2000W Pure Sine Wave Inverter", "Shore Power Hookup (230V)", "Multiple USB-C Fast Chargers", "Silent Inverter Generator"],
  "Kitchen & Food Prep": ["Dometic 12V Compressor Fridge/Freezer", "2-Burner Gas Cooktop", "Stainless Steel Sink with Faucet", "Complete Cookware & Cutlery Set", "Outdoor Pull-Out Slide Kitchen", "Portable Charcoal BBQ Grill"],
  "Bathroom & Water": ["100L Fresh Water Tank", "60L Grey Water Tank", "Hot Water Shower (Gas Geyser)", "Dometic Cassette Toilet", "Outdoor Hot Shower", "12V Water Pump with Filter"],
  "Overlanding & 4x4 Gear": ["4x4 Low-Range Transfer Case", "All-Terrain KO2 Tires", "ARB Retractable 270° Awning", "MaxTrax Recovery Sand Boards", "Electric Winch 12,000 lbs", "Camp Chairs & Foldable Table"],
  "Navigation & Connectivity": ["Starlink Satellite RV WiFi", "Apple CarPlay & Android Auto", "360° Reverse Camera & Sensors", "GPS Off-Road Topo Maps", "Dashcam Front & Rear", "Emergency SOS Beacon"]
};

export default function RVFleetManagementPage() {
  const [rvs, setRvs] = useState<RVUnit[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"general" | "powertrain" | "pricing" | "offgrid" | "amenities" | "media" | "handover">("general");
  const [editingRV, setEditingRV] = useState<RVUnit | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Form State
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [description, setDescription] = useState("");
  const [city, setCity] = useState("Goa");
  const [pickupLocation, setPickupLocation] = useState("Goa International Airport & Panaji Central Hub");
  const [vehicleType, setVehicleType] = useState("4x4 Overlanding");
  const [transmission, setTransmission] = useState("Manual");
  const [fuelType, setFuelType] = useState("Turbo Diesel");
  const [berths, setBerths] = useState(4);
  const [basePrice, setBasePrice] = useState(9500);
  const [weekendPrice, setWeekendPrice] = useState(11500);
  const [securityDeposit, setSecurityDeposit] = useState(15000);
  const [cleaningFee, setCleaningFee] = useState(1500);
  const [mileageLimitKm, setMileageLimitKm] = useState(250);
  const [extraKmRate, setExtraKmRate] = useState(18);
  const [waterTankLitres, setWaterTankLitres] = useState(100);
  const [solarWattage, setSolarWattage] = useState(400);
  const [batteryCapacityAh, setBatteryCapacityAh] = useState(200);
  const [status, setStatus] = useState("ACTIVE");
  const [hostName, setHostName] = useState("Overland India Vanlife Co.");
  const [hostPhone, setHostPhone] = useState("+91 98765 00000");
  const [images, setImages] = useState<string[]>([""]);
  const [videoUrl, setVideoUrl] = useState("");
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([
    "Double Island Bed", "400W Monocrystalline Solar Panels", "Dometic 12V Compressor Fridge/Freezer", "ARB Retractable 270° Awning", "Starlink Satellite RV WiFi", "4x4 Low-Range Transfer Case"
  ]);

  const fetchRVs = async () => {
    try {
      setLoading(true);
      const res = await axios.get("/api/v1/properties");
      if (Array.isArray(res.data)) {
        const rvList = res.data.filter(
          (p: any) =>
            p.category?.name === "RV" ||
            p.category === "RV" ||
            p.type === "RV" ||
            p.title?.toLowerCase().includes("rv") ||
            p.title?.toLowerCase().includes("campervan") ||
            p.title?.toLowerCase().includes("motorhome")
        );
        setRvs(rvList);
      }
    } catch {
      // Fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRVs();
  }, []);

  const openCreateModal = () => {
    setIsCreatingNew(true);
    setEditingRV(null);
    setActiveTab("general");
    setTitle("");
    setSubtitle("4x4 Custom Overland Rig with Solar & Kitchenette");
    setDescription("");
    setCity("Goa");
    setPickupLocation("Goa International Airport & Panaji Fleet Hub");
    setVehicleType("4x4 Overlanding");
    setTransmission("Manual");
    setFuelType("Turbo Diesel");
    setBerths(4);
    setBasePrice(9500);
    setWeekendPrice(11500);
    setSecurityDeposit(15000);
    setCleaningFee(1500);
    setMileageLimitKm(250);
    setExtraKmRate(18);
    setWaterTankLitres(100);
    setSolarWattage(400);
    setBatteryCapacityAh(200);
    setStatus("ACTIVE");
    setHostName("Overland India Fleet");
    setHostPhone("+91 98765 00000");
    setImages([
      "https://images.unsplash.com/photo-1523987355523-c7b5b0dd90a7?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1513311068348-19c8fbdc0bb6?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1516939884455-1445c8652f83?auto=format&fit=crop&w=1200&q=80"
    ]);
    setVideoUrl("");
    setSelectedAmenities([
      "Double Island Bed", "400W Monocrystalline Solar Panels", "Dometic 12V Compressor Fridge/Freezer", "ARB Retractable 270° Awning", "Starlink Satellite RV WiFi", "4x4 Low-Range Transfer Case"
    ]);
    setSaveSuccess(false);
    setIsModalOpen(true);
  };

  const openEditModal = (rv: RVUnit) => {
    setIsCreatingNew(false);
    setEditingRV(rv);
    setActiveTab("general");
    setTitle(rv.title || "");
    setSubtitle(rv.subtitle || "Overland Rig & Campervan");
    setDescription(rv.description || "");
    setCity(rv.city || "Goa");
    setPickupLocation(rv.pickupLocation || rv.address || "Goa Fleet Hub");
    setVehicleType(rv.vehicleType || "4x4 Overlanding");
    setTransmission(rv.transmission || "Manual");
    setFuelType(rv.fuelType || "Turbo Diesel");
    setBerths(rv.beds || 4);
    setBasePrice(Number(rv.basePrice) || 9500);
    setWeekendPrice(Number(rv.weekendPrice) || 11500);
    setSecurityDeposit(Number(rv.securityDeposit) || 15000);
    setCleaningFee(Number(rv.cleaningFee) || 1500);
    setMileageLimitKm(rv.mileageLimitKm || 250);
    setExtraKmRate(rv.extraKmRate || 18);
    setWaterTankLitres(rv.waterTankLitres || 100);
    setSolarWattage(rv.solarWattage || 400);
    setBatteryCapacityAh(rv.batteryCapacityAh || 200);
    setStatus(rv.status || "ACTIVE");
    setImages(rv.imageUrls && rv.imageUrls.length > 0 ? rv.imageUrls : ["https://images.unsplash.com/photo-1523987355523-c7b5b0dd90a7?auto=format&fit=crop&w=1200&q=80"]);
    setVideoUrl(rv.videoUrl || "");
    setSelectedAmenities(rv.amenities && rv.amenities.length > 0 ? rv.amenities : ["Double Island Bed", "400W Monocrystalline Solar Panels"]);
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
      description: `${description} | Vehicle: ${vehicleType}, Berths: ${berths}, Transmission: ${transmission}, Fuel: ${fuelType}, Mileage: ${mileageLimitKm}km/day, Solar: ${solarWattage}W, Water: ${waterTankLitres}L, Handover: ${pickupLocation}`,
      type: "HOTEL",
      category: "RV",
      city,
      address: pickupLocation,
      basePrice: Number(basePrice),
      pricePerNight: Number(basePrice),
      weekendPrice: Number(weekendPrice),
      securityDeposit: Number(securityDeposit),
      cleaningFee: Number(cleaningFee),
      maxGuests: Number(berths),
      bedrooms: 1,
      beds: Number(berths),
      bathrooms: 1,
      vehicleType,
      amenities: selectedAmenities,
      images: validImages.length > 0 ? validImages : ["https://images.unsplash.com/photo-1523987355523-c7b5b0dd90a7?auto=format&fit=crop&w=1200&q=80"],
      videoUrls: videoUrl ? [videoUrl] : [],
      status,
    };

    const axiosConfig = {
      headers: { "x-admin-key": "stayq-admin-secret-2026" },
    };

    try {
      if (isCreatingNew) {
        await axios.post("/api/v1/properties", payload, axiosConfig);
      } else if (editingRV) {
        await axios.patch(`/api/v1/properties/${editingRV.id}`, payload, axiosConfig);
      }
      setSaveSuccess(true);
      await fetchRVs();
      setTimeout(() => {
        setIsModalOpen(false);
      }, 700);
    } catch (err) {
      console.warn("RV save note:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to remove RV "${name}"?`)) return;
    try {
      await axios.delete(`/api/v1/properties/${id}`, {
        headers: { "x-admin-key": "stayq-admin-secret-2026" },
      });
      await fetchRVs();
    } catch (err) {
      console.warn("Delete note:", err);
    }
  };

  const filtered = rvs.filter(
    (rv) =>
      rv.title?.toLowerCase().includes(search.toLowerCase()) ||
      rv.city?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem", paddingBottom: "4rem" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem", background: "#ffffff", padding: "1.75rem", borderRadius: "20px", border: "1px solid #e2e8f0", boxShadow: "0 2px 6px rgba(0,0,0,0.03)" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "#f59e0b", fontWeight: 900, fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.35rem" }}>
            <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>rv_hookup</span>
            <span>Overland Rigs &amp; Vanlife Fleet Command</span>
          </div>
          <h1 style={{ fontSize: "1.75rem", fontWeight: 900, color: "#0f172a", margin: "0 0 0.35rem", letterSpacing: "-0.02em" }}>RVs &amp; Campervans Fleet Command</h1>
          <p style={{ fontSize: "0.92rem", color: "#64748b", margin: 0, maxWidth: "700px" }}>
            Fleet operations for 4x4 expedition campervans, off-grid lithium power, sleeping berths, daily mileage, and 360° digital handover logs.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          style={{ display: "flex", alignItems: "center", gap: "0.6rem", padding: "0.85rem 1.75rem", background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)", color: "#ffffff", fontWeight: 800, fontSize: "0.95rem", borderRadius: "16px", border: "none", cursor: "pointer", boxShadow: "0 4px 16px rgba(245,158,11,0.35)", transition: "all 0.2s ease" }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: "22px" }}>add_circle</span>
          <span>Add RV / Campervan</span>
        </button>
      </div>

      {/* Search & Fleet KPI */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: "1rem", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", background: "#ffffff", padding: "0.9rem 1.25rem", borderRadius: "16px", border: "1px solid #e2e8f0" }}>
          <span className="material-symbols-outlined" style={{ color: "#94a3b8", fontSize: "22px" }}>search</span>
          <input
            type="text"
            placeholder="Search fleet by model, 4x4 overland rig, pickup city, berth count..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ flex: 1, border: "none", outline: "none", fontSize: "0.95rem", color: "#0f172a", background: "transparent" }}
          />
        </div>
        <div style={{ background: "#ffffff", padding: "0.75rem 1.25rem", borderRadius: "16px", border: "1px solid #e2e8f0", display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <span style={{ fontSize: "0.82rem", color: "#64748b", fontWeight: 700 }}>Fleet Size:</span>
          <strong style={{ fontSize: "1rem", color: "#0f172a", fontWeight: 900 }}>{rvs.length} Vehicles</strong>
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div style={{ padding: "4rem", textAlign: "center", color: "#64748b", background: "#ffffff", borderRadius: "20px", border: "1px solid #e2e8f0" }}>Loading fleet database...</div>
      ) : filtered.length === 0 ? (
        <div style={{ padding: "4rem", textAlign: "center", background: "#ffffff", borderRadius: "20px", border: "1px solid #e2e8f0" }}>
          <p style={{ color: "#64748b", fontWeight: 700, margin: 0, fontSize: "1.1rem" }}>No RVs in database. Click &ldquo;Add RV / Campervan&rdquo; to add a vehicle!</p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(350px, 1fr))", gap: "1.5rem" }}>
          {filtered.map((rv) => (
            <div
              key={rv.id}
              style={{ background: "#ffffff", borderRadius: "24px", border: "1px solid #e2e8f0", overflow: "hidden", boxShadow: "0 2px 10px rgba(0,0,0,0.03)", display: "flex", flexDirection: "column" }}
            >
              <div style={{ position: "relative", height: "220px", background: "#f1f5f9" }}>
                <img
                  src={rv.imageUrls?.[0] || "/images/rv_1.jpg"}
                  alt={rv.title}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
                <div style={{ position: "absolute", top: "12px", left: "12px", background: "#059669", color: "#ffffff", padding: "0.35rem 0.85rem", borderRadius: "999px", fontSize: "0.78rem", fontWeight: 800, display: "flex", alignItems: "center", gap: "4px" }}>
                  <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>verified</span>
                  <span>Fleet Verified</span>
                </div>
                <div style={{ position: "absolute", top: "12px", right: "12px", background: "rgba(15, 23, 42, 0.88)", backdropFilter: "blur(8px)", color: "#ffffff", padding: "0.35rem 0.85rem", borderRadius: "999px", fontSize: "0.78rem", fontWeight: 800 }}>
                  <span>{rv.beds || 4} Berths</span>
                </div>
              </div>

              <div style={{ padding: "1.5rem", flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between", gap: "1.25rem" }}>
                <div>
                  <h3 style={{ fontSize: "1.15rem", fontWeight: 900, color: "#0f172a", margin: "0 0 0.35rem", lineHeight: 1.3 }}>{rv.title}</h3>
                  <p style={{ fontSize: "0.85rem", color: "#64748b", display: "flex", alignItems: "center", gap: "0.3rem", margin: 0 }}>
                    <span className="material-symbols-outlined" style={{ fontSize: "16px", color: "#f59e0b" }}>location_on</span>
                    <span>{rv.city || "Goa, India"}</span>
                  </p>
                </div>

                <div style={{ background: "#f8fafc", padding: "0.85rem 1rem", borderRadius: "14px", border: "1px solid #f1f5f9", fontSize: "0.82rem", color: "#475569", display: "flex", flexDirection: "column", gap: "0.45rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span>Refundable Deposit:</span>
                    <strong style={{ color: "#0f172a" }}>₹{Number(rv.securityDeposit || 15000).toLocaleString("en-IN")}</strong>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span>Inspection:</span>
                    <span style={{ color: "#9D00FF", fontWeight: 800 }}>Digital 360° Handover</span>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: "0.85rem", borderTop: "1px solid #f1f5f9" }}>
                  <div>
                    <span style={{ fontSize: "0.72rem", color: "#94a3b8", display: "block", textTransform: "uppercase", fontWeight: 700 }}>Daily Rental Rate</span>
                    <strong style={{ color: "#f59e0b", fontWeight: 900, fontSize: "1.25rem" }}>
                      ₹{Number(rv.basePrice || 9500).toLocaleString("en-IN")}
                      <span style={{ fontSize: "0.78rem", color: "#64748b", fontWeight: 600 }}>/day</span>
                    </strong>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <button
                      type="button"
                      onClick={() => openEditModal(rv)}
                      style={{ padding: "0.6rem 1rem", borderRadius: "12px", border: "1px solid #e2e8f0", background: "#f8fafc", color: "#f59e0b", fontWeight: 800, fontSize: "0.85rem", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.35rem" }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>edit</span>
                      <span>Edit</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(rv.id, rv.title)}
                      style={{ padding: "0.6rem", borderRadius: "12px", border: "none", background: "rgba(239, 68, 68, 0.1)", color: "#ef4444", cursor: "pointer" }}
                      title="Delete RV"
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

      {/* ULTRA-EXPANDED MULTI-TAB FLEET MODAL */}
      {isModalOpen && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, width: "100vw", height: "100vh", background: "rgba(15, 23, 42, 0.82)", backdropFilter: "blur(10px)", zIndex: 99999, display: "flex", alignItems: "center", justifyContent: "center", padding: "1.5rem" }}>
          <div style={{ background: "#ffffff", borderRadius: "32px", maxWidth: "1080px", width: "95vw", maxHeight: "94vh", overflowY: "auto", padding: "2.5rem", boxShadow: "0 30px 60px -15px rgba(0,0,0,0.5)", border: "1px solid rgba(226, 232, 240, 0.8)", position: "relative" }}>
            
            {/* Modal Header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem", paddingBottom: "1.25rem", borderBottom: "1px solid #e2e8f0" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                <div style={{ width: "52px", height: "52px", borderRadius: "18px", background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)", display: "flex", alignItems: "center", justifyContent: "center", color: "#ffffff", boxShadow: "0 6px 18px rgba(245,158,11,0.35)" }}>
                  <span className="material-symbols-outlined" style={{ fontSize: "30px" }}>rv_hookup</span>
                </div>
                <div>
                  <h2 style={{ fontSize: "1.5rem", fontWeight: 900, color: "#0f172a", margin: 0, letterSpacing: "-0.01em" }}>
                    {isCreatingNew ? "Add RV / Expedition Campervan" : `Edit Vehicle — "${title || 'Untitled'}"`}
                  </h2>
                  <p style={{ fontSize: "0.85rem", color: "#64748b", margin: "0.2rem 0 0", fontWeight: 600 }}>
                    {editingRV ? `Fleet ID: ${editingRV.id}` : "Configure 4x4 overland mechanics, lithium solar off-grid specs, and handover terms"} · Live Fleet Sync
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
                { id: "general", label: "Vehicle & Class", icon: "badge" },
                { id: "powertrain", label: "Powertrain & 4x4 Specs", icon: "directions_car" },
                { id: "pricing", label: "Daily Rate & Deposit", icon: "payments" },
                { id: "offgrid", label: "Solar & Water Off-Grid", icon: "solar_power" },
                { id: "amenities", label: "Onboard Amenities", icon: "kitchen" },
                { id: "media", label: "Vehicle Photo Gallery", icon: "photo_library" },
                { id: "handover", label: "360° Handover & Rules", icon: "verified" }
              ].map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id as any)}
                    style={{ display: "flex", alignItems: "center", gap: "0.45rem", padding: "0.65rem 1.1rem", borderRadius: "14px", border: "none", background: isActive ? "#f59e0b" : "#f8fafc", color: isActive ? "#ffffff" : "#64748b", fontWeight: 800, fontSize: "0.85rem", cursor: "pointer", whiteSpace: "nowrap", transition: "all 0.15s ease", boxShadow: isActive ? "0 4px 12px rgba(245,158,11,0.25)" : "none" }}
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
                <span>RV details saved successfully to live fleet database!</span>
              </div>
            )}

            <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
              
              {/* TAB 1: GENERAL */}
              {activeTab === "general" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "1.25rem" }}>
                    <div>
                      <label style={{ fontSize: "0.78rem", fontWeight: 800, color: "#334155", textTransform: "uppercase", display: "block", marginBottom: "0.4rem" }}>Vehicle Model / Listing Name *</label>
                      <input
                        type="text"
                        required
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="e.g. Overland Nomad 4x4 Expedition Campervan (4 Berth)"
                        style={{ width: "100%", padding: "0.85rem 1.1rem", fontSize: "0.95rem", borderRadius: "14px", border: "1px solid #cbd5e1", outline: "none", fontWeight: 800, background: "#ffffff" }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: "0.78rem", fontWeight: 800, color: "#334155", textTransform: "uppercase", display: "block", marginBottom: "0.4rem" }}>Vehicle Category</label>
                      <select
                        value={vehicleType}
                        onChange={(e) => setVehicleType(e.target.value)}
                        style={{ width: "100%", padding: "0.85rem 1.1rem", fontSize: "0.95rem", borderRadius: "14px", border: "1px solid #cbd5e1", outline: "none", fontWeight: 800, background: "#ffffff" }}
                      >
                        <option value="4x4 Overlanding">4x4 Overland Expedition Rig</option>
                        <option value="Campervan">High-Roof Campervan</option>
                        <option value="Motorhome">Luxury Integrated Motorhome</option>
                        <option value="Travel Trailer">Travel Trailer / Caravan</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize: "0.78rem", fontWeight: 800, color: "#334155", textTransform: "uppercase", display: "block", marginBottom: "0.4rem" }}>Vehicle Tagline</label>
                    <input
                      type="text"
                      value={subtitle}
                      onChange={(e) => setSubtitle(e.target.value)}
                      placeholder="e.g. Self-Sufficient Off-Grid Expedition Rig with Starlink Satellite Internet"
                      style={{ width: "100%", padding: "0.85rem 1.1rem", fontSize: "0.92rem", borderRadius: "14px", border: "1px solid #cbd5e1", outline: "none", background: "#ffffff" }}
                    />
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1.25rem" }}>
                    <div>
                      <label style={{ fontSize: "0.78rem", fontWeight: 800, color: "#334155", textTransform: "uppercase", display: "block", marginBottom: "0.4rem" }}>Base Hub / City *</label>
                      <input
                        type="text"
                        required
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        placeholder="e.g. Goa"
                        style={{ width: "100%", padding: "0.85rem 1.1rem", fontSize: "0.92rem", borderRadius: "14px", border: "1px solid #cbd5e1", outline: "none", background: "#ffffff" }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: "0.78rem", fontWeight: 800, color: "#334155", textTransform: "uppercase", display: "block", marginBottom: "0.4rem" }}>Pickup &amp; Handover Depot</label>
                      <input
                        type="text"
                        value={pickupLocation}
                        onChange={(e) => setPickupLocation(e.target.value)}
                        placeholder="e.g. Goa Airport &amp; Panaji Depot"
                        style={{ width: "100%", padding: "0.85rem 1.1rem", fontSize: "0.92rem", borderRadius: "14px", border: "1px solid #cbd5e1", outline: "none", background: "#ffffff" }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: "0.78rem", fontWeight: 800, color: "#334155", textTransform: "uppercase", display: "block", marginBottom: "0.4rem" }}>Fleet Status</label>
                      <select
                        value={status}
                        onChange={(e) => setStatus(e.target.value)}
                        style={{ width: "100%", padding: "0.85rem 1.1rem", fontSize: "0.95rem", borderRadius: "14px", border: "1px solid #cbd5e1", outline: "none", fontWeight: 800, background: "#ffffff" }}
                      >
                        <option value="ACTIVE">ACTIVE (Ready for Booking)</option>
                        <option value="IN_SERVICE">IN FLEET SERVICE</option>
                        <option value="PAUSED">PAUSED</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize: "0.78rem", fontWeight: 800, color: "#334155", textTransform: "uppercase", display: "block", marginBottom: "0.4rem" }}>Vehicle Story &amp; Overland Capabilities</label>
                    <textarea
                      rows={4}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Describe off-grid lithium batteries, 4x4 low-range capabilities, rooftop awning, pull-out kitchen, and beach camping clearance..."
                      style={{ width: "100%", padding: "1rem", fontSize: "0.92rem", borderRadius: "14px", border: "1px solid #cbd5e1", outline: "none", background: "#ffffff" }}
                    />
                  </div>
                </div>
              )}

              {/* TAB 2: POWERTRAIN */}
              {activeTab === "powertrain" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "1.25rem" }}>
                    <div>
                      <label style={{ fontSize: "0.78rem", fontWeight: 800, color: "#334155", textTransform: "uppercase", display: "block", marginBottom: "0.4rem" }}>Transmission</label>
                      <select
                        value={transmission}
                        onChange={(e) => setTransmission(e.target.value)}
                        style={{ width: "100%", padding: "0.85rem 1.1rem", fontSize: "0.92rem", borderRadius: "14px", border: "1px solid #cbd5e1", outline: "none", background: "#ffffff" }}
                      >
                        <option value="Manual">Manual (6-Speed 4x4)</option>
                        <option value="Automatic">Automatic Transmission</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ fontSize: "0.78rem", fontWeight: 800, color: "#334155", textTransform: "uppercase", display: "block", marginBottom: "0.4rem" }}>Fuel Type</label>
                      <select
                        value={fuelType}
                        onChange={(e) => setFuelType(e.target.value)}
                        style={{ width: "100%", padding: "0.85rem 1.1rem", fontSize: "0.92rem", borderRadius: "14px", border: "1px solid #cbd5e1", outline: "none", background: "#ffffff" }}
                      >
                        <option value="Turbo Diesel">Turbo Diesel (BS6)</option>
                        <option value="Petrol">Petrol</option>
                        <option value="Electric">Electric / Hybrid</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ fontSize: "0.78rem", fontWeight: 800, color: "#334155", textTransform: "uppercase", display: "block", marginBottom: "0.4rem" }}>Daily Free Km</label>
                      <input
                        type="number"
                        value={mileageLimitKm}
                        onChange={(e) => setMileageLimitKm(Number(e.target.value))}
                        style={{ width: "100%", padding: "0.85rem 1.1rem", fontSize: "0.92rem", borderRadius: "14px", border: "1px solid #cbd5e1", outline: "none", background: "#ffffff" }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: "0.78rem", fontWeight: 800, color: "#334155", textTransform: "uppercase", display: "block", marginBottom: "0.4rem" }}>Extra Km Charge (₹/km)</label>
                      <input
                        type="number"
                        value={extraKmRate}
                        onChange={(e) => setExtraKmRate(Number(e.target.value))}
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
                      <label style={{ fontSize: "0.78rem", fontWeight: 800, color: "#334155", textTransform: "uppercase", display: "block", marginBottom: "0.4rem" }}>Daily Rate (₹) *</label>
                      <input
                        type="number"
                        required
                        min={2000}
                        value={basePrice}
                        onChange={(e) => setBasePrice(Number(e.target.value))}
                        style={{ width: "100%", padding: "0.85rem 1.1rem", fontSize: "1.05rem", borderRadius: "14px", border: "1px solid #cbd5e1", outline: "none", fontWeight: 900, color: "#f59e0b", background: "#ffffff" }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: "0.78rem", fontWeight: 800, color: "#334155", textTransform: "uppercase", display: "block", marginBottom: "0.4rem" }}>Weekend Daily Rate (₹)</label>
                      <input
                        type="number"
                        min={2000}
                        value={weekendPrice}
                        onChange={(e) => setWeekendPrice(Number(e.target.value))}
                        style={{ width: "100%", padding: "0.85rem 1.1rem", fontSize: "1.05rem", borderRadius: "14px", border: "1px solid #cbd5e1", outline: "none", fontWeight: 900, color: "#f59e0b", background: "#ffffff" }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: "0.78rem", fontWeight: 800, color: "#334155", textTransform: "uppercase", display: "block", marginBottom: "0.4rem" }}>Refundable Security Deposit (₹)</label>
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

              {/* TAB 4: OFF-GRID SPECS */}
              {activeTab === "offgrid" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "1.25rem" }}>
                    <div>
                      <label style={{ fontSize: "0.78rem", fontWeight: 800, color: "#334155", textTransform: "uppercase", display: "block", marginBottom: "0.4rem" }}>Sleeping Berths</label>
                      <input
                        type="number"
                        min={1}
                        max={8}
                        value={berths}
                        onChange={(e) => setBerths(Number(e.target.value))}
                        style={{ width: "100%", padding: "0.85rem 1.1rem", fontSize: "0.92rem", borderRadius: "14px", border: "1px solid #cbd5e1", outline: "none", background: "#ffffff" }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: "0.78rem", fontWeight: 800, color: "#334155", textTransform: "uppercase", display: "block", marginBottom: "0.4rem" }}>Solar Panels (Watts)</label>
                      <input
                        type="number"
                        value={solarWattage}
                        onChange={(e) => setSolarWattage(Number(e.target.value))}
                        style={{ width: "100%", padding: "0.85rem 1.1rem", fontSize: "0.92rem", borderRadius: "14px", border: "1px solid #cbd5e1", outline: "none", background: "#ffffff" }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: "0.78rem", fontWeight: 800, color: "#334155", textTransform: "uppercase", display: "block", marginBottom: "0.4rem" }}>Lithium Battery (Ah)</label>
                      <input
                        type="number"
                        value={batteryCapacityAh}
                        onChange={(e) => setBatteryCapacityAh(Number(e.target.value))}
                        style={{ width: "100%", padding: "0.85rem 1.1rem", fontSize: "0.92rem", borderRadius: "14px", border: "1px solid #cbd5e1", outline: "none", background: "#ffffff" }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: "0.78rem", fontWeight: 800, color: "#334155", textTransform: "uppercase", display: "block", marginBottom: "0.4rem" }}>Fresh Water Tank (Litres)</label>
                      <input
                        type="number"
                        value={waterTankLitres}
                        onChange={(e) => setWaterTankLitres(Number(e.target.value))}
                        style={{ width: "100%", padding: "0.85rem 1.1rem", fontSize: "0.92rem", borderRadius: "14px", border: "1px solid #cbd5e1", outline: "none", background: "#ffffff" }}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 5: AMENITIES */}
              {activeTab === "amenities" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                  {Object.entries(RV_AMENITIES_CATEGORIES).map(([catTitle, items]) => (
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
                              style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.65rem 0.85rem", borderRadius: "12px", border: isSelected ? "2px solid #f59e0b" : "1px solid #e2e8f0", background: isSelected ? "rgba(245, 158, 11, 0.08)" : "#ffffff", color: isSelected ? "#d97706" : "#475569", fontWeight: 700, fontSize: "0.82rem", cursor: "pointer", textAlign: "left" }}
                            >
                              <span className="material-symbols-outlined" style={{ fontSize: "16px", color: isSelected ? "#f59e0b" : "#94a3b8" }}>
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
                    <h3 style={{ fontSize: "1rem", fontWeight: 900, color: "#0f172a", margin: 0 }}>RV High-Resolution Photo Gallery</h3>
                    <button
                      type="button"
                      onClick={addImageField}
                      style={{ padding: "0.5rem 1rem", borderRadius: "10px", border: "1px solid #f59e0b", background: "#ffffff", color: "#d97706", fontWeight: 800, fontSize: "0.85rem", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.3rem" }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>add_photo_alternate</span>
                      <span>Add Image URL</span>
                    </button>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                    {images.map((img, idx) => (
                      <div key={idx} style={{ display: "flex", alignItems: "center", gap: "0.75rem", background: "#f8fafc", padding: "0.75rem 1rem", borderRadius: "14px", border: "1px solid #e2e8f0" }}>
                        <span style={{ fontSize: "0.85rem", fontWeight: 900, color: "#f59e0b", width: "28px" }}>#{idx + 1}</span>
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

              {/* TAB 7: HANDOVER */}
              {activeTab === "handover" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                  <div style={{ background: "#f8fafc", padding: "1.5rem", borderRadius: "18px", border: "1px solid #e2e8f0" }}>
                    <h4 style={{ fontSize: "0.95rem", fontWeight: 900, color: "#0f172a", margin: "0 0 0.5rem" }}>Digital 360° Inspection Protocol</h4>
                    <p style={{ fontSize: "0.82rem", color: "#64748b", margin: 0 }}>
                      Before key handover, the host and guest conduct a mandatory 360° photo and video walkaround via the Stay Q Host App to log fuel levels, odometer reading, tyre condition, and kitchen appliances.
                    </p>
                  </div>
                </div>
              )}

              {/* MODAL BOTTOM BAR */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: "1.25rem", borderTop: "1px solid #e2e8f0" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <span style={{ fontSize: "0.82rem", color: "#64748b" }}>Live Daily Rate:</span>
                  <strong style={{ color: "#f59e0b", fontWeight: 900, fontSize: "1.1rem" }}>
                    ₹{Number(basePrice || 0).toLocaleString("en-IN")}/day
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
                    style={{ padding: "0.75rem 2.25rem", borderRadius: "14px", background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)", color: "#ffffff", fontWeight: 900, fontSize: "0.95rem", border: "none", cursor: "pointer", boxShadow: "0 4px 16px rgba(245,158,11,0.35)", opacity: saving ? 0.6 : 1 }}
                  >
                    {saving ? "Saving to Fleet..." : isCreatingNew ? "Add Vehicle to Fleet" : "Save Vehicle Details"}
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
