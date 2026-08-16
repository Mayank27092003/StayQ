"use client";

import { useEffect, useState } from "react";
import axios from "axios";

export interface RentalProperty {
  id: string;
  title: string;
  subtitle?: string;
  description?: string;
  city?: string;
  state?: string;
  locality?: string;
  address?: string;
  pincode?: string;
  lat?: number;
  lng?: number;
  monthlyRent?: number;
  securityDeposit?: number;
  maintenanceFee?: number;
  leaseDurationMonths?: number;
  lockInPeriodMonths?: number;
  status: string;
  type?: string;
  category?: { name: string };
  bedrooms?: number;
  bathrooms?: number;
  balconies?: number;
  sqft?: number;
  furnishing?: string;
  facing?: string;
  floorNumber?: number;
  totalFloors?: number;
  isZeroBroker?: boolean;
  availableFrom?: string;
  ownerName?: string;
  ownerPhone?: string;
  ownerEmail?: string;
  amenities?: string[];
  imageUrls?: string[];
  videoUrl?: string;
}

const RENTAL_AMENITIES_CATEGORIES = {
  "Home Appliances & Furnishings": ["Samsung Double-Door Refrigerator", "Front-Load Washing Machine", "55-Inch 4K Smart TV", "3-Seater Sofa & Coffee Table", "King Size Beds with Ortho Mattresses", "Modular Kitchen with Chimney"],
  "Society & Clubhouse": ["Swimming Pool & Kids Splash Pool", "Fully Equipped Gym & Yoga Room", "Clubhouse & Community Hall", "Children Play Area & Parks", "Badminton & Tennis Court", "Jogging & Walking Track"],
  "Utilities & Infrastructure": ["100% DG Power Backup", "24/7 High-Flow Water Supply", "Piped Gas Connection (IGL/Adani)", "High-Speed Fiber Internet Ready", "Reserved Covered Car Parking", "Visitor Parking Bay"],
  "Security & Access": ["24/7 Gated Security Guard", "Biometric / RFID Lobby Entry", "CCTV Surveillance across Campus", "Video Door Phone in Flat", "Intercom Facility to Security", "Fire Safety & Sprinkler System"]
};

export default function ZeroBrokerRentalsPage() {
  const [rentals, setRentals] = useState<RentalProperty[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"general" | "lease" | "pricing" | "specs" | "amenities" | "media" | "owner">("general");
  const [editingRental, setEditingRental] = useState<RentalProperty | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Form State
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [description, setDescription] = useState("");
  const [city, setCity] = useState("Bengaluru, Karnataka");
  const [locality, setLocality] = useState("Indiranagar 100ft Road");
  const [address, setAddress] = useState("Prestige Heights, 4th Cross, Indiranagar");
  const [pincode, setPincode] = useState("560038");
  const [lat, setLat] = useState(12.9784);
  const [lng, setLng] = useState(77.6408);
  const [monthlyRent, setMonthlyRent] = useState(45000);
  const [securityDeposit, setSecurityDeposit] = useState(90000);
  const [maintenanceFee, setMaintenanceFee] = useState(3500);
  const [leaseMonths, setLeaseMonths] = useState(11);
  const [lockInMonths, setLockInMonths] = useState(6);
  const [bedrooms, setBedrooms] = useState(2);
  const [bathrooms, setBathrooms] = useState(2);
  const [balconies, setBalconies] = useState(2);
  const [sqft, setSqft] = useState(1350);
  const [furnishing, setFurnishing] = useState("Fully Furnished");
  const [facing, setFacing] = useState("East Facing");
  const [floorNumber, setFloorNumber] = useState(5);
  const [totalFloors, setTotalFloors] = useState(14);
  const [ownerName, setOwnerName] = useState("Dr. Vikram Sharma");
  const [ownerPhone, setOwnerPhone] = useState("+91 99000 11223");
  const [ownerEmail, setOwnerEmail] = useState("vikram.sharma@example.com");
  const [status, setStatus] = useState("ACTIVE");
  const [images, setImages] = useState<string[]>([""]);
  const [videoUrl, setVideoUrl] = useState("");
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([
    "Samsung Double-Door Refrigerator", "Front-Load Washing Machine", "Modular Kitchen with Chimney", "100% DG Power Backup", "Swimming Pool & Kids Splash Pool", "Reserved Covered Car Parking"
  ]);

  const fetchRentals = async () => {
    try {
      setLoading(true);
      const res = await axios.get("/api/v1/properties");
      if (Array.isArray(res.data)) {
        const rentalList = res.data.filter(
          (p: any) =>
            p.isZeroBroker ||
            p.longTermAvailable ||
            p.category?.name === "LONG_TERM" ||
            p.category === "LONG_TERM" ||
            p.title?.toLowerCase().includes("bhk") ||
            p.title?.toLowerCase().includes("rental") ||
            p.title?.toLowerCase().includes("lease")
        );
        setRentals(rentalList);
      }
    } catch {
      // Fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRentals();
  }, []);

  const openCreateModal = () => {
    setIsCreatingNew(true);
    setEditingRental(null);
    setActiveTab("general");
    setTitle("");
    setSubtitle("Luxury 2BHK High-Rise Residence with Modular Interiors");
    setDescription("");
    setCity("Bengaluru, Karnataka");
    setLocality("Indiranagar 100ft Road");
    setAddress("Prestige Heights, 4th Cross, Indiranagar");
    setPincode("560038");
    setLat(12.9784);
    setLng(77.6408);
    setMonthlyRent(45000);
    setSecurityDeposit(90000);
    setMaintenanceFee(3500);
    setLeaseMonths(11);
    setLockInMonths(6);
    setBedrooms(2);
    setBathrooms(2);
    setBalconies(2);
    setSqft(1350);
    setFurnishing("Fully Furnished");
    setFacing("East Facing");
    setFloorNumber(5);
    setTotalFloors(14);
    setOwnerName("Dr. Vikram Sharma");
    setOwnerPhone("+91 99000 11223");
    setOwnerEmail("vikram.sharma@example.com");
    setStatus("ACTIVE");
    setImages([
      "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80"
    ]);
    setVideoUrl("");
    setSelectedAmenities([
      "Samsung Double-Door Refrigerator", "Front-Load Washing Machine", "Modular Kitchen with Chimney", "100% DG Power Backup", "Swimming Pool & Kids Splash Pool", "Reserved Covered Car Parking"
    ]);
    setSaveSuccess(false);
    setIsModalOpen(true);
  };

  const openEditModal = (rental: RentalProperty) => {
    setIsCreatingNew(false);
    setEditingRental(rental);
    setActiveTab("general");
    setTitle(rental.title || "");
    setSubtitle(rental.subtitle || "Zero-Brokerage Direct Owner Residence");
    setDescription(rental.description || "");
    setCity(rental.city || "Bengaluru");
    setLocality(rental.locality || "Indiranagar");
    setAddress(rental.address || "");
    setPincode(rental.pincode || "560038");
    setMonthlyRent(Number(rental.monthlyRent) || 45000);
    setSecurityDeposit(Number(rental.securityDeposit) || 90000);
    setMaintenanceFee(rental.maintenanceFee || 3500);
    setLeaseMonths(rental.leaseDurationMonths || 11);
    setLockInMonths(rental.lockInPeriodMonths || 6);
    setBedrooms(rental.bedrooms || 2);
    setBathrooms(rental.bathrooms || 2);
    setBalconies(rental.balconies || 2);
    setSqft(rental.sqft || 1350);
    setFurnishing(rental.furnishing || "Fully Furnished");
    setOwnerName(rental.ownerName || "Direct Owner");
    setOwnerPhone(rental.ownerPhone || "+91 99000 11223");
    setStatus(rental.status || "ACTIVE");
    setImages(rental.imageUrls && rental.imageUrls.length > 0 ? rental.imageUrls : ["https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&q=80"]);
    setVideoUrl(rental.videoUrl || "");
    setSelectedAmenities(rental.amenities && rental.amenities.length > 0 ? rental.amenities : ["Samsung Double-Door Refrigerator", "Modular Kitchen with Chimney"]);
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
      description: `${description} | Furnishing: ${furnishing}, Area: ${sqft} sq.ft., Facing: ${facing}, Floor: ${floorNumber}/${totalFloors}, Lease: ${leaseMonths}M, Lock-in: ${lockInMonths}M, 0% Brokerage Direct Contract`,
      type: "HOTEL",
      category: "LONG_TERM",
      city,
      address,
      basePrice: Math.round(Number(monthlyRent) / 30),
      pricePerNight: Math.round(Number(monthlyRent) / 30),
      monthlyRent: Number(monthlyRent),
      securityDeposit: Number(securityDeposit),
      maintenanceFee: Number(maintenanceFee),
      leaseDurationMonths: Number(leaseMonths),
      lockInPeriodMonths: Number(lockInMonths),
      isZeroBroker: true,
      longTermAvailable: true,
      maxGuests: Number(bedrooms) * 2,
      bedrooms: Number(bedrooms),
      beds: Number(bedrooms),
      bathrooms: Number(bathrooms),
      sqft: Number(sqft),
      furnishing,
      ownerName,
      ownerPhone,
      ownerEmail,
      amenities: selectedAmenities,
      images: validImages.length > 0 ? validImages : ["https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&q=80"],
      videoUrls: videoUrl ? [videoUrl] : [],
      status,
    };

    const axiosConfig = {
      headers: { "x-admin-key": "stayq-admin-secret-2026" },
    };

    try {
      if (isCreatingNew) {
        await axios.post("/api/v1/properties", payload, axiosConfig);
      } else if (editingRental) {
        await axios.patch(`/api/v1/properties/${editingRental.id}`, payload, axiosConfig);
      }
      setSaveSuccess(true);
      await fetchRentals();
      setTimeout(() => {
        setIsModalOpen(false);
      }, 700);
    } catch (err) {
      console.warn("Rental save note:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to remove rental residence "${name}"?`)) return;
    try {
      await axios.delete(`/api/v1/properties/${id}`, {
        headers: { "x-admin-key": "stayq-admin-secret-2026" },
      });
      await fetchRentals();
    } catch (err) {
      console.warn("Delete note:", err);
    }
  };

  const filtered = rentals.filter(
    (r) =>
      r.title?.toLowerCase().includes(search.toLowerCase()) ||
      r.city?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem", paddingBottom: "4rem" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem", background: "#ffffff", padding: "1.75rem", borderRadius: "20px", border: "1px solid #e2e8f0", boxShadow: "0 2px 6px rgba(0,0,0,0.03)" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "#059669", fontWeight: 900, fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.35rem" }}>
            <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>key</span>
            <span>Zero-Broker Long Term Living (11-Month Leases)</span>
          </div>
          <h1 style={{ fontSize: "1.75rem", fontWeight: 900, color: "#0f172a", margin: "0 0 0.35rem", letterSpacing: "-0.02em" }}>Zero-Broker Rentals Command</h1>
          <p style={{ fontSize: "0.92rem", color: "#64748b", margin: 0, maxWidth: "700px" }}>
            Manage 11-month lease apartments, digital tenancy agreements, direct owner verifications, society dues, and security deposits.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          style={{ display: "flex", alignItems: "center", gap: "0.6rem", padding: "0.85rem 1.75rem", background: "linear-gradient(135deg, #059669 0%, #047857 100%)", color: "#ffffff", fontWeight: 800, fontSize: "0.95rem", borderRadius: "16px", border: "none", cursor: "pointer", boxShadow: "0 4px 16px rgba(5,150,105,0.35)", transition: "all 0.2s ease" }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: "22px" }}>add_circle</span>
          <span>Add Rental Residence</span>
        </button>
      </div>

      {/* Search & KPI */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: "1rem", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", background: "#ffffff", padding: "0.9rem 1.25rem", borderRadius: "16px", border: "1px solid #e2e8f0" }}>
          <span className="material-symbols-outlined" style={{ color: "#94a3b8", fontSize: "22px" }}>search</span>
          <input
            type="text"
            placeholder="Search residences by building name, BHK type, locality, city..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ flex: 1, border: "none", outline: "none", fontSize: "0.95rem", color: "#0f172a", background: "transparent" }}
          />
        </div>
        <div style={{ background: "#ffffff", padding: "0.75rem 1.25rem", borderRadius: "16px", border: "1px solid #e2e8f0", display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <span style={{ fontSize: "0.82rem", color: "#64748b", fontWeight: 700 }}>Total Residences:</span>
          <strong style={{ fontSize: "1rem", color: "#0f172a", fontWeight: 900 }}>{rentals.length} Units</strong>
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div style={{ padding: "4rem", textAlign: "center", color: "#64748b", background: "#ffffff", borderRadius: "20px", border: "1px solid #e2e8f0" }}>Loading long-term rental inventory...</div>
      ) : filtered.length === 0 ? (
        <div style={{ padding: "4rem", textAlign: "center", background: "#ffffff", borderRadius: "20px", border: "1px solid #e2e8f0" }}>
          <p style={{ color: "#64748b", fontWeight: 700, margin: 0, fontSize: "1.1rem" }}>No rental residences found. Click &ldquo;Add Rental Residence&rdquo; to list one!</p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(350px, 1fr))", gap: "1.5rem" }}>
          {filtered.map((rental) => (
            <div
              key={rental.id}
              style={{ background: "#ffffff", borderRadius: "24px", border: "1px solid #e2e8f0", overflow: "hidden", boxShadow: "0 2px 10px rgba(0,0,0,0.03)", display: "flex", flexDirection: "column" }}
            >
              <div style={{ position: "relative", height: "220px", background: "#f1f5f9" }}>
                <img
                  src={rental.imageUrls?.[0] || "/images/villa_2.jpg"}
                  alt={rental.title}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
                <div style={{ position: "absolute", top: "12px", left: "12px", background: "#059669", color: "#ffffff", padding: "0.35rem 0.85rem", borderRadius: "999px", fontSize: "0.78rem", fontWeight: 800, display: "flex", alignItems: "center", gap: "4px" }}>
                  <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>verified</span>
                  <span>0% Brokerage Verified</span>
                </div>
                <div style={{ position: "absolute", top: "12px", right: "12px", background: "rgba(15, 23, 42, 0.88)", backdropFilter: "blur(8px)", color: "#ffffff", padding: "0.35rem 0.85rem", borderRadius: "999px", fontSize: "0.78rem", fontWeight: 800 }}>
                  <span>{rental.leaseDurationMonths || 11}M Lease</span>
                </div>
              </div>

              <div style={{ padding: "1.5rem", flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between", gap: "1.25rem" }}>
                <div>
                  <h3 style={{ fontSize: "1.15rem", fontWeight: 900, color: "#0f172a", margin: "0 0 0.35rem", lineHeight: 1.3 }}>{rental.title}</h3>
                  <p style={{ fontSize: "0.85rem", color: "#64748b", display: "flex", alignItems: "center", gap: "0.3rem", margin: 0 }}>
                    <span className="material-symbols-outlined" style={{ fontSize: "16px", color: "#059669" }}>location_on</span>
                    <span>{rental.city || "Bengaluru, India"}</span>
                  </p>
                </div>

                <div style={{ background: "#f8fafc", padding: "0.85rem 1rem", borderRadius: "14px", border: "1px solid #f1f5f9", fontSize: "0.82rem", color: "#475569", display: "flex", flexDirection: "column", gap: "0.45rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span>Security Deposit:</span>
                    <strong style={{ color: "#0f172a" }}>₹{Number(rental.securityDeposit || 90000).toLocaleString("en-IN")}</strong>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span>Tenancy Contract:</span>
                    <span style={{ color: "#059669", fontWeight: 800 }}>Direct Owner · 11 Months</span>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: "0.85rem", borderTop: "1px solid #f1f5f9" }}>
                  <div>
                    <span style={{ fontSize: "0.72rem", color: "#94a3b8", display: "block", textTransform: "uppercase", fontWeight: 700 }}>Monthly Rent</span>
                    <strong style={{ color: "#9D00FF", fontWeight: 900, fontSize: "1.25rem" }}>
                      ₹{Number(rental.monthlyRent || 45000).toLocaleString("en-IN")}
                      <span style={{ fontSize: "0.78rem", color: "#64748b", fontWeight: 600 }}>/mo</span>
                    </strong>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <button
                      type="button"
                      onClick={() => openEditModal(rental)}
                      style={{ padding: "0.6rem 1rem", borderRadius: "12px", border: "1px solid #e2e8f0", background: "#f8fafc", color: "#9D00FF", fontWeight: 800, fontSize: "0.85rem", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.35rem" }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>edit</span>
                      <span>Edit</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(rental.id, rental.title)}
                      style={{ padding: "0.6rem", borderRadius: "12px", border: "none", background: "rgba(239, 68, 68, 0.1)", color: "#ef4444", cursor: "pointer" }}
                      title="Delete Rental"
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

      {/* ULTRA-EXPANDED MULTI-TAB RENTAL MODAL */}
      {isModalOpen && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, width: "100vw", height: "100vh", background: "rgba(15, 23, 42, 0.82)", backdropFilter: "blur(10px)", zIndex: 99999, display: "flex", alignItems: "center", justifyContent: "center", padding: "1.5rem" }}>
          <div style={{ background: "#ffffff", borderRadius: "32px", maxWidth: "1080px", width: "95vw", maxHeight: "94vh", overflowY: "auto", padding: "2.5rem", boxShadow: "0 30px 60px -15px rgba(0,0,0,0.5)", border: "1px solid rgba(226, 232, 240, 0.8)", position: "relative" }}>
            
            {/* Modal Header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem", paddingBottom: "1.25rem", borderBottom: "1px solid #e2e8f0" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                <div style={{ width: "52px", height: "52px", borderRadius: "18px", background: "linear-gradient(135deg, #059669 0%, #047857 100%)", display: "flex", alignItems: "center", justifyContent: "center", color: "#ffffff", boxShadow: "0 6px 18px rgba(5,150,105,0.35)" }}>
                  <span className="material-symbols-outlined" style={{ fontSize: "30px" }}>key</span>
                </div>
                <div>
                  <h2 style={{ fontSize: "1.5rem", fontWeight: 900, color: "#0f172a", margin: 0, letterSpacing: "-0.01em" }}>
                    {isCreatingNew ? "Add Zero-Broker Rental Residence" : `Edit Residence — "${title || 'Untitled'}"`}
                  </h2>
                  <p style={{ fontSize: "0.85rem", color: "#64748b", margin: "0.2rem 0 0", fontWeight: 600 }}>
                    {editingRental ? `Residence ID: ${editingRental.id}` : "Configure 11-month lease, furnishing inventory, maintenance, and direct owner contract"} · Live Database Sync
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
                { id: "general", label: "Property & BHK", icon: "badge" },
                { id: "lease", label: "Lease & Lock-in Terms", icon: "assignment" },
                { id: "pricing", label: "Monthly Rent & Deposit", icon: "payments" },
                { id: "specs", label: "Furnishing & Sq. Ft.", icon: "chair" },
                { id: "amenities", label: "Appliances & Society", icon: "apartment" },
                { id: "media", label: "Apartment Photos", icon: "photo_library" },
                { id: "owner", label: "Direct Owner Profile", icon: "person" }
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
                <span>Rental residence saved successfully to live database!</span>
              </div>
            )}

            <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
              
              {/* TAB 1: GENERAL */}
              {activeTab === "general" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "1.25rem" }}>
                    <div>
                      <label style={{ fontSize: "0.78rem", fontWeight: 800, color: "#334155", textTransform: "uppercase", display: "block", marginBottom: "0.4rem" }}>Residence Title *</label>
                      <input
                        type="text"
                        required
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="e.g. Prestige Heights 3BHK Penthouse with Terrace Garden"
                        style={{ width: "100%", padding: "0.85rem 1.1rem", fontSize: "0.95rem", borderRadius: "14px", border: "1px solid #cbd5e1", outline: "none", fontWeight: 800, background: "#ffffff" }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: "0.78rem", fontWeight: 800, color: "#334155", textTransform: "uppercase", display: "block", marginBottom: "0.4rem" }}>Furnishing State</label>
                      <select
                        value={furnishing}
                        onChange={(e) => setFurnishing(e.target.value)}
                        style={{ width: "100%", padding: "0.85rem 1.1rem", fontSize: "0.95rem", borderRadius: "14px", border: "1px solid #cbd5e1", outline: "none", fontWeight: 800, background: "#ffffff" }}
                      >
                        <option value="Fully Furnished">Fully Furnished</option>
                        <option value="Semi-Furnished">Semi-Furnished</option>
                        <option value="Unfurnished">Unfurnished</option>
                      </select>
                    </div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1.25rem" }}>
                    <div>
                      <label style={{ fontSize: "0.78rem", fontWeight: 800, color: "#334155", textTransform: "uppercase", display: "block", marginBottom: "0.4rem" }}>City *</label>
                      <input
                        type="text"
                        required
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        placeholder="e.g. Bengaluru"
                        style={{ width: "100%", padding: "0.85rem 1.1rem", fontSize: "0.92rem", borderRadius: "14px", border: "1px solid #cbd5e1", outline: "none", background: "#ffffff" }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: "0.78rem", fontWeight: 800, color: "#334155", textTransform: "uppercase", display: "block", marginBottom: "0.4rem" }}>Locality / Micro-Market *</label>
                      <input
                        type="text"
                        required
                        value={locality}
                        onChange={(e) => setLocality(e.target.value)}
                        placeholder="e.g. Indiranagar 100ft Road"
                        style={{ width: "100%", padding: "0.85rem 1.1rem", fontSize: "0.92rem", borderRadius: "14px", border: "1px solid #cbd5e1", outline: "none", background: "#ffffff" }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: "0.78rem", fontWeight: 800, color: "#334155", textTransform: "uppercase", display: "block", marginBottom: "0.4rem" }}>Listing Status</label>
                      <select
                        value={status}
                        onChange={(e) => setStatus(e.target.value)}
                        style={{ width: "100%", padding: "0.85rem 1.1rem", fontSize: "0.95rem", borderRadius: "14px", border: "1px solid #cbd5e1", outline: "none", fontWeight: 800, background: "#ffffff" }}
                      >
                        <option value="ACTIVE">ACTIVE (Available for Lease)</option>
                        <option value="OCCUPIED">OCCUPIED / LEASED</option>
                        <option value="PAUSED">PAUSED</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize: "0.78rem", fontWeight: 800, color: "#334155", textTransform: "uppercase", display: "block", marginBottom: "0.4rem" }}>Apartment Description &amp; Highlights</label>
                    <textarea
                      rows={4}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Describe interior woodwork, cross-ventilation, balcony views, distance to metro, and society amenities..."
                      style={{ width: "100%", padding: "1rem", fontSize: "0.92rem", borderRadius: "14px", border: "1px solid #cbd5e1", outline: "none", background: "#ffffff" }}
                    />
                  </div>
                </div>
              )}

              {/* TAB 2: LEASE TERMS */}
              {activeTab === "lease" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1.25rem" }}>
                    <div>
                      <label style={{ fontSize: "0.78rem", fontWeight: 800, color: "#334155", textTransform: "uppercase", display: "block", marginBottom: "0.4rem" }}>Lease Duration (Months)</label>
                      <input
                        type="number"
                        value={leaseMonths}
                        onChange={(e) => setLeaseMonths(Number(e.target.value))}
                        style={{ width: "100%", padding: "0.85rem 1.1rem", fontSize: "0.95rem", borderRadius: "14px", border: "1px solid #cbd5e1", outline: "none", background: "#ffffff" }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: "0.78rem", fontWeight: 800, color: "#334155", textTransform: "uppercase", display: "block", marginBottom: "0.4rem" }}>Lock-In Period (Months)</label>
                      <input
                        type="number"
                        value={lockInMonths}
                        onChange={(e) => setLockInMonths(Number(e.target.value))}
                        style={{ width: "100%", padding: "0.85rem 1.1rem", fontSize: "0.95rem", borderRadius: "14px", border: "1px solid #cbd5e1", outline: "none", background: "#ffffff" }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: "0.78rem", fontWeight: 800, color: "#334155", textTransform: "uppercase", display: "block", marginBottom: "0.4rem" }}>Brokerage Rate</label>
                      <div style={{ padding: "0.85rem 1.1rem", borderRadius: "14px", background: "#ecfdf5", border: "1px solid #a7f3d0", color: "#059669", fontWeight: 900, fontSize: "0.95rem" }}>
                        🎉 0% Brokerage Guaranteed
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: PRICING */}
              {activeTab === "pricing" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1.25rem" }}>
                    <div>
                      <label style={{ fontSize: "0.78rem", fontWeight: 800, color: "#334155", textTransform: "uppercase", display: "block", marginBottom: "0.4rem" }}>Monthly Rent (₹) *</label>
                      <input
                        type="number"
                        required
                        min={5000}
                        value={monthlyRent}
                        onChange={(e) => setMonthlyRent(Number(e.target.value))}
                        style={{ width: "100%", padding: "0.85rem 1.1rem", fontSize: "1.05rem", borderRadius: "14px", border: "1px solid #cbd5e1", outline: "none", fontWeight: 900, color: "#9D00FF", background: "#ffffff" }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: "0.78rem", fontWeight: 800, color: "#334155", textTransform: "uppercase", display: "block", marginBottom: "0.4rem" }}>Security Deposit (₹)</label>
                      <input
                        type="number"
                        value={securityDeposit}
                        onChange={(e) => setSecurityDeposit(Number(e.target.value))}
                        style={{ width: "100%", padding: "0.85rem 1.1rem", fontSize: "1.05rem", borderRadius: "14px", border: "1px solid #cbd5e1", outline: "none", fontWeight: 900, color: "#0f172a", background: "#ffffff" }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: "0.78rem", fontWeight: 800, color: "#334155", textTransform: "uppercase", display: "block", marginBottom: "0.4rem" }}>Society Maintenance / Month (₹)</label>
                      <input
                        type="number"
                        value={maintenanceFee}
                        onChange={(e) => setMaintenanceFee(Number(e.target.value))}
                        style={{ width: "100%", padding: "0.85rem 1.1rem", fontSize: "0.95rem", borderRadius: "14px", border: "1px solid #cbd5e1", outline: "none", background: "#ffffff" }}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: SPECS */}
              {activeTab === "specs" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr 1fr", gap: "1rem" }}>
                    <div>
                      <label style={{ fontSize: "0.78rem", fontWeight: 800, color: "#334155", textTransform: "uppercase", display: "block", marginBottom: "0.4rem" }}>Bedrooms</label>
                      <input
                        type="number"
                        min={1}
                        max={6}
                        value={bedrooms}
                        onChange={(e) => setBedrooms(Number(e.target.value))}
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
                      <label style={{ fontSize: "0.78rem", fontWeight: 800, color: "#334155", textTransform: "uppercase", display: "block", marginBottom: "0.4rem" }}>Balconies</label>
                      <input
                        type="number"
                        value={balconies}
                        onChange={(e) => setBalconies(Number(e.target.value))}
                        style={{ width: "100%", padding: "0.85rem 1.1rem", fontSize: "0.95rem", borderRadius: "14px", border: "1px solid #cbd5e1", outline: "none", background: "#ffffff" }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: "0.78rem", fontWeight: 800, color: "#334155", textTransform: "uppercase", display: "block", marginBottom: "0.4rem" }}>Super Built-Up Area</label>
                      <input
                        type="number"
                        value={sqft}
                        onChange={(e) => setSqft(Number(e.target.value))}
                        style={{ width: "100%", padding: "0.85rem 1.1rem", fontSize: "0.95rem", borderRadius: "14px", border: "1px solid #cbd5e1", outline: "none", background: "#ffffff" }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: "0.78rem", fontWeight: 800, color: "#334155", textTransform: "uppercase", display: "block", marginBottom: "0.4rem" }}>Direction Facing</label>
                      <select
                        value={facing}
                        onChange={(e) => setFacing(e.target.value)}
                        style={{ width: "100%", padding: "0.85rem 1.1rem", fontSize: "0.95rem", borderRadius: "14px", border: "1px solid #cbd5e1", outline: "none", background: "#ffffff" }}
                      >
                        <option value="East Facing">East Facing</option>
                        <option value="North Facing">North Facing</option>
                        <option value="North-East Facing">North-East Facing</option>
                        <option value="West Facing">West Facing</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 5: AMENITIES */}
              {activeTab === "amenities" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                  {Object.entries(RENTAL_AMENITIES_CATEGORIES).map(([catTitle, items]) => (
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
                    <h3 style={{ fontSize: "1rem", fontWeight: 900, color: "#0f172a", margin: 0 }}>Apartment Photo Gallery</h3>
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

              {/* TAB 7: OWNER PROFILE */}
              {activeTab === "owner" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1.25rem" }}>
                    <div>
                      <label style={{ fontSize: "0.78rem", fontWeight: 800, color: "#334155", textTransform: "uppercase", display: "block", marginBottom: "0.4rem" }}>Direct Owner Name</label>
                      <input
                        type="text"
                        value={ownerName}
                        onChange={(e) => setOwnerName(e.target.value)}
                        placeholder="e.g. Dr. Vikram Sharma"
                        style={{ width: "100%", padding: "0.85rem 1.1rem", fontSize: "0.92rem", borderRadius: "14px", border: "1px solid #cbd5e1", outline: "none", background: "#ffffff" }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: "0.78rem", fontWeight: 800, color: "#334155", textTransform: "uppercase", display: "block", marginBottom: "0.4rem" }}>Owner Contact Number</label>
                      <input
                        type="text"
                        value={ownerPhone}
                        onChange={(e) => setOwnerPhone(e.target.value)}
                        placeholder="+91 99000 11223"
                        style={{ width: "100%", padding: "0.85rem 1.1rem", fontSize: "0.92rem", borderRadius: "14px", border: "1px solid #cbd5e1", outline: "none", background: "#ffffff" }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: "0.78rem", fontWeight: 800, color: "#334155", textTransform: "uppercase", display: "block", marginBottom: "0.4rem" }}>Owner Email</label>
                      <input
                        type="text"
                        value={ownerEmail}
                        onChange={(e) => setOwnerEmail(e.target.value)}
                        placeholder="vikram.sharma@example.com"
                        style={{ width: "100%", padding: "0.85rem 1.1rem", fontSize: "0.92rem", borderRadius: "14px", border: "1px solid #cbd5e1", outline: "none", background: "#ffffff" }}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* MODAL BOTTOM BAR */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: "1.25rem", borderTop: "1px solid #e2e8f0" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <span style={{ fontSize: "0.82rem", color: "#64748b" }}>Live Monthly Rent:</span>
                  <strong style={{ color: "#9D00FF", fontWeight: 900, fontSize: "1.1rem" }}>
                    ₹{Number(monthlyRent || 0).toLocaleString("en-IN")}/month
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
                    {saving ? "Saving Residence..." : isCreatingNew ? "Publish Rental Residence" : "Save Residence Details"}
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
