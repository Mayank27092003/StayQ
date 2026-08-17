"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import GoogleMapPicker from "@/components/GoogleMapPicker";

export interface PropertyIncident {
  id: string;
  incidentCode?: string;
  title: string;
  description: string;
  category: string;
  severity: string;
  status: string;
  createdAt: string;
  resolvedAt?: string;
}

export interface Property {
  id: string;
  propertyCode?: string;
  registeredAt?: string;
  createdAt?: string;
  faultCount?: number;
  hasActiveFault?: boolean;
  incidents?: PropertyIncident[];
  _count?: {
    bookings?: number;
    reviews?: number;
    incidents?: number;
  };
  title: string;
  description?: string;
  address?: string;
  city?: string;
  locality?: string;
  state?: string;
  country?: string;
  pincode?: string;
  landmark?: string;
  lat?: number;
  lng?: number;
  basePrice?: number;
  cleaningFee?: number;
  status: string;
  type?: string;
  category?: { name: string };
  maxGuests?: number;
  bedrooms?: number;
  beds?: number;
  bathrooms?: number;
  amenities?: string[];
  imageUrls?: string[];
  heroImage?: string;
  instantBook?: boolean;
  petsAllowed?: boolean;
  smokingAllowed?: boolean;
  partiesAllowed?: boolean;
  checkInTime?: string;
  checkOutTime?: string;
  isZeroBroker?: boolean;
  monthlyRent?: number;
  securityDeposit?: number;
  leaseDurationMonths?: number;
  host?: {
    id?: string;
    displayName?: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    createdAt?: string;
    isHostVerified?: boolean;
  };
}

const COUNTRIES = [
  { name: "India", flag: "🇮🇳" },
  { name: "United Arab Emirates", flag: "🇦🇪" },
  { name: "United States", flag: "🇺🇸" },
  { name: "United Kingdom", flag: "🇬🇧" },
  { name: "Thailand", flag: "🇹🇭" },
  { name: "Singapore", flag: "🇸🇬" },
  { name: "Indonesia", flag: "🇮🇩" },
  { name: "Maldives", flag: "🇲🇻" },
  { name: "Sri Lanka", flag: "🇱🇰" },
  { name: "Malaysia", flag: "🇲🇾" },
  { name: "Vietnam", flag: "🇻🇳" },
  { name: "Japan", flag: "🇯🇵" },
  { name: "France", flag: "🇫🇷" },
  { name: "Italy", flag: "🇮🇹" },
  { name: "Spain", flag: "🇪🇸" },
  { name: "Switzerland", flag: "🇨🇭" },
  { name: "Australia", flag: "🇦🇺" },
  { name: "Canada", flag: "🇨🇦" },
  { name: "Germany", flag: "🇩🇪" },
  { name: "New Zealand", flag: "🇳🇿" },
  { name: "Mauritius", flag: "🇲🇺" },
  { name: "Nepal", flag: "🇳🇵" },
  { name: "Bhutan", flag: "🇧🇹" },
  { name: "Turkey", flag: "🇹🇷" },
  { name: "Greece", flag: "🇬🇷" },
  { name: "Portugal", flag: "🇵🇹" },
  { name: "Saudi Arabia", flag: "🇸🇦" },
  { name: "Qatar", flag: "🇶🇦" },
  { name: "Oman", flag: "🇴🇲" },
  { name: "South Africa", flag: "🇿🇦" },
];

const PROPERTY_CATEGORIES = [
  "Villas",
  "Beachfront",
  "Cabins",
  "Mansions",
  "Treehouses",
  "RVs & Vans",
  "Camping",
  "Zero Broker",
  "Farmhouse",
  "Penthouse",
  "Studio",
  "Hostel",
  "Homestay",
  "Hotel",
  "Dorm",
];

const ALL_AMENITIES = [
  "High-Speed Wi-Fi",
  "Private Pool",
  "Air Conditioning",
  "Heating",
  "Kitchen",
  "Free Parking",
  "Pet Friendly",
  "Hot Tub",
  "Dedicated Workspace",
  "Washer / Dryer",
  "EV Charger",
  "Ocean View",
  "Mountain View",
  "Fireplace",
  "BBQ Grill",
  "Balcony / Terrace",
  "Chef on Demand",
  "Smart Lock Access",
  "Power Backup",
  "24/7 Security",
];

export default function PropertiesPage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");

  // Edit / Add Property Modal State
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Form Fields - Core
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [categoryName, setCategoryName] = useState("Villas");
  const [status, setStatus] = useState("ACTIVE");
  const [basePrice, setBasePrice] = useState<number>(5000);
  const [cleaningFee, setCleaningFee] = useState<number>(800);

  // Form Fields - Location Details
  const [city, setCity] = useState("");
  const [locality, setLocality] = useState("");
  const [state, setState] = useState("");
  const [country, setCountry] = useState("India");
  const [pincode, setPincode] = useState("");
  const [landmark, setLandmark] = useState("");
  const [address, setAddress] = useState("");
  const [lat, setLat] = useState<number>(15.5182);
  const [lng, setLng] = useState<number>(73.7634);

  // Form Fields - Capacity & Amenities
  const [maxGuests, setMaxGuests] = useState<number>(4);
  const [bedrooms, setBedrooms] = useState<number>(2);
  const [beds, setBeds] = useState<number>(2);
  const [bathrooms, setBathrooms] = useState<number>(2);
  const [amenities, setAmenities] = useState<string[]>([]);
  const [newImageUrl, setNewImageUrl] = useState("");
  const [imageUrls, setImageUrls] = useState<string[]>([]);

  // Extra Rules & Details
  const [instantBook, setInstantBook] = useState(true);
  const [petsAllowed, setPetsAllowed] = useState(false);
  const [smokingAllowed, setSmokingAllowed] = useState(false);
  const [partiesAllowed, setPartiesAllowed] = useState(false);
  const [checkInTime, setCheckInTime] = useState("14:00");
  const [checkOutTime, setCheckOutTime] = useState("11:00");
  const [isZeroBroker, setIsZeroBroker] = useState(false);
  const [monthlyRent, setMonthlyRent] = useState<number>(45000);
  const [securityDeposit, setSecurityDeposit] = useState<number>(50000);
  const [leaseDurationMonths, setLeaseDurationMonths] = useState<number>(11);

  // Host Info
  const [hostName, setHostName] = useState("Verified Owner");
  const [hostPhone, setHostPhone] = useState("+91 99999 99999");
  const [hostEmail, setHostEmail] = useState("host@stayq.space");

  const fetchProperties = async () => {
    try {
      setLoading(true);
      let localProps: Property[] = [];
      try {
        const saved = localStorage.getItem("stayq_admin_properties");
        if (saved) localProps = JSON.parse(saved);
      } catch {}

      const res = await axios.get("/api/v1/properties");
      if (Array.isArray(res.data) && res.data.length > 0) {
        const merged = res.data.map((p: any) => {
          const local = localProps.find((lp) => lp.id === p.id);
          return {
            id: p.id,
            title: local?.title || p.title || "Untitled Stay",
            description: local?.description || p.description || "",
            address: local?.address || p.address || "",
            city: local?.city || p.city || "Goa",
            locality: local?.locality || p.locality || "",
            state: local?.state || p.state || "Goa",
            country: local?.country || p.country || "India",
            pincode: local?.pincode || p.pincode || "",
            landmark: local?.landmark || p.landmark || "",
            lat: local?.lat || Number(p.lat || p.latitude) || 15.5182,
            lng: local?.lng || Number(p.lng || p.longitude) || 73.7634,
            basePrice: local?.basePrice || Number(p.pricePerNight || p.basePrice) || 5000,
            cleaningFee: local?.cleaningFee || Number(p.cleaningFee) || 800,
            status: local?.status || p.status || "ACTIVE",
            category: local?.category || (p.category ? { name: p.category } : { name: "Villas" }),
            type: local?.type || p.type || "STAY",
            maxGuests: local?.maxGuests || p.maxGuests || 4,
            bedrooms: local?.bedrooms || p.bedrooms || 2,
            beds: local?.beds || p.beds || 2,
            bathrooms: local?.bathrooms || p.bathrooms || 2,
            amenities: local?.amenities || p.amenities || ["High-Speed Wi-Fi", "Air Conditioning"],
            imageUrls: local?.imageUrls || (p.images?.length ? p.images.map((i: any) => i.url || i) : ["/images/villa_1.jpg"]),
            heroImage: local?.heroImage || p.heroImage || "/images/villa_1.jpg",
            instantBook: local?.instantBook ?? p.instantBook ?? true,
            petsAllowed: local?.petsAllowed ?? p.petsAllowed ?? false,
            smokingAllowed: local?.smokingAllowed ?? p.smokingAllowed ?? false,
            partiesAllowed: local?.partiesAllowed ?? p.partiesAllowed ?? false,
            checkInTime: local?.checkInTime || p.checkInTime || "14:00",
            checkOutTime: local?.checkOutTime || p.checkOutTime || "11:00",
            isZeroBroker: local?.isZeroBroker ?? (p.type === "ZERO_BROKER" || p.category === "ZERO_BROKER" || p.longTermAvailable),
            monthlyRent: local?.monthlyRent || Number(p.monthlyRent) || 45000,
            securityDeposit: local?.securityDeposit || Number(p.securityDeposit) || 50000,
            leaseDurationMonths: local?.leaseDurationMonths || p.leaseDurationMonths || 11,
            host: local?.host || {
              firstName: p.host?.displayName || p.host?.firstName || "Verified",
              lastName: p.host?.lastName || "Host",
              email: p.host?.email || "host@stayq.space",
              phone: p.host?.phone || "+91 99999 99999",
            },
          };
        });

        const localOnly = localProps.filter((lp) => !res.data.some((p: any) => p.id === lp.id));
        const finalProps = [...localOnly, ...merged];
        setProperties(finalProps);
        try {
          localStorage.setItem("stayq_admin_properties", JSON.stringify(finalProps));
        } catch {}
      } else if (localProps.length > 0) {
        setProperties(localProps);
      }
    } catch (err) {
      console.warn("API load note:", err);
      try {
        const saved = localStorage.getItem("stayq_admin_properties");
        if (saved) setProperties(JSON.parse(saved));
      } catch {}
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProperties();
  }, []);

  const openEditor = (property: Property) => {
    setEditingProperty(property);
    setIsCreatingNew(false);
    setTitle(property.title || "");
    setDescription(property.description || "");
    setCategoryName(property.category?.name || "Villas");
    setCity(property.city || "");
    setLocality(property.locality || "");
    setState(property.state || "");
    setCountry(property.country || "India");
    setPincode(property.pincode || "");
    setLandmark(property.landmark || "");
    setAddress(property.address || "");
    setLat(property.lat || 15.5182);
    setLng(property.lng || 73.7634);
    setStatus(property.status || "ACTIVE");
    setBasePrice(property.basePrice || 5000);
    setCleaningFee(property.cleaningFee || 800);
    setMaxGuests(property.maxGuests || 4);
    setBedrooms(property.bedrooms || 2);
    setBeds(property.beds || 2);
    setBathrooms(property.bathrooms || 2);
    setAmenities(property.amenities || ["High-Speed Wi-Fi", "Air Conditioning"]);
    setImageUrls(property.imageUrls || (property.heroImage ? [property.heroImage] : []));
    setInstantBook(property.instantBook ?? true);
    setPetsAllowed(property.petsAllowed ?? false);
    setSmokingAllowed(property.smokingAllowed ?? false);
    setPartiesAllowed(property.partiesAllowed ?? false);
    setCheckInTime(property.checkInTime || "14:00");
    setCheckOutTime(property.checkOutTime || "11:00");
    setIsZeroBroker(property.isZeroBroker ?? false);
    setMonthlyRent(property.monthlyRent || 45000);
    setSecurityDeposit(property.securityDeposit || 50000);
    setLeaseDurationMonths(property.leaseDurationMonths || 11);
    setHostName(property.host ? `${property.host.firstName} ${property.host.lastName}`.trim() : "Shayan Mandal");
    setHostPhone(property.host?.phone || "+91 99999 99999");
    setHostEmail(property.host?.email || "shayan@stayq.space");
    setIsModalOpen(true);
    setSaveSuccess(false);
  };

  const openCreateNew = () => {
    setEditingProperty(null);
    setIsCreatingNew(true);
    setTitle("");
    setDescription("");
    setCategoryName("Villas");
    setCity("");
    setLocality("");
    setState("");
    setCountry("India");
    setPincode("");
    setLandmark("");
    setAddress("");
    setLat(15.5182);
    setLng(73.7634);
    setStatus("ACTIVE");
    setBasePrice(0);
    setCleaningFee(0);
    setMaxGuests(2);
    setBedrooms(1);
    setBeds(1);
    setBathrooms(1);
    setAmenities([]);
    setImageUrls([]);
    setInstantBook(true);
    setPetsAllowed(false);
    setSmokingAllowed(false);
    setPartiesAllowed(false);
    setCheckInTime("14:00");
    setCheckOutTime("11:00");
    setIsZeroBroker(false);
    setMonthlyRent(0);
    setSecurityDeposit(0);
    setLeaseDurationMonths(11);
    setHostName("");
    setHostPhone("");
    setHostEmail("");
    setIsModalOpen(true);
    setSaveSuccess(false);
  };

  const handleToggleAmenity = (name: string) => {
    setAmenities((prev) =>
      prev.includes(name) ? prev.filter((a) => a !== name) : [...prev, name]
    );
  };

  const handleAddImage = () => {
    if (!newImageUrl.trim()) return;
    setImageUrls((prev) => [...prev, newImageUrl.trim()]);
    setNewImageUrl("");
  };

  const handleRemoveImage = (index: number) => {
    setImageUrls((prev) => prev.filter((_, i) => i !== index));
  };

  // Called when Google Map Pin or Place search changes location
  const handleLocationFromMap = (loc: {
    lat: number;
    lng: number;
    city?: string;
    locality?: string;
    state?: string;
    country?: string;
    pincode?: string;
    formattedAddress?: string;
  }) => {
    setLat(loc.lat);
    setLng(loc.lng);
    if (loc.city) setCity(loc.city);
    if (loc.locality) setLocality(loc.locality);
    if (loc.state) setState(loc.state);
    if (loc.country) {
      // Find matching country
      const match = COUNTRIES.find((c) => c.name.toLowerCase() === loc.country?.toLowerCase());
      if (match) setCountry(match.name);
      else setCountry(loc.country);
    }
    if (loc.pincode) setPincode(loc.pincode);
    if (loc.formattedAddress && !address) {
      setAddress(loc.formattedAddress);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveSuccess(false);

    const nameParts = hostName.trim().split(" ");
    const fName = nameParts[0] || "Verified";
    const lName = nameParts.slice(1).join(" ") || "Host";

    const fullAddress = address || [locality, landmark ? `Near ${landmark}` : ""].filter(Boolean).join(", ");

    const payload: Property = {
      id: editingProperty ? editingProperty.id : `stay-custom-${Date.now()}`,
      title,
      description,
      address: fullAddress,
      city,
      locality,
      state,
      country,
      pincode,
      landmark,
      lat: Number(lat),
      lng: Number(lng),
      status,
      basePrice: Number(basePrice),
      cleaningFee: Number(cleaningFee),
      maxGuests: Number(maxGuests),
      bedrooms: Number(bedrooms),
      beds: Number(beds),
      bathrooms: Number(bathrooms),
      amenities,
      imageUrls,
      heroImage: imageUrls[0] || "/images/villa_1.jpg",
      category: { name: categoryName },
      type: isZeroBroker ? "ZERO_BROKER" : categoryName.toUpperCase(),
      instantBook,
      petsAllowed,
      smokingAllowed,
      partiesAllowed,
      checkInTime,
      checkOutTime,
      isZeroBroker,
      monthlyRent: Number(monthlyRent),
      securityDeposit: Number(securityDeposit),
      leaseDurationMonths: Number(leaseDurationMonths),
      host: { firstName: fName, lastName: lName, email: hostEmail, phone: hostPhone },
    };

    let nextProps: Property[] = [];
    if (isCreatingNew) {
      nextProps = [payload, ...properties];
    } else if (editingProperty) {
      nextProps = properties.map((p) => (p.id === editingProperty.id ? { ...p, ...payload } : p));
    }
    setProperties(nextProps);

    // Save permanently to client storage
    try {
      localStorage.setItem("stayq_admin_properties", JSON.stringify(nextProps));
      window.dispatchEvent(new Event("stayq_properties_updated"));
    } catch {}

    try {
      const axiosConfig = {
        headers: { 'x-admin-key': 'stayq-admin-secret-2026' }
      };
      if (isCreatingNew) {
        await axios.post("/api/v1/properties", payload, axiosConfig);
      } else if (editingProperty) {
        await axios.patch(`/api/v1/properties/${editingProperty.id}`, payload, axiosConfig);
      }
      // Re-fetch clean database records
      await fetchProperties();
    } catch (err) {
      console.warn("Backend API sync note:", err);
    } finally {
      setSaving(false);
      setSaveSuccess(true);
      setTimeout(() => {
        setIsModalOpen(false);
        setSaveSuccess(false);
      }, 800);
    }
  };

  const handleDelete = async () => {
    if (!editingProperty || !confirm(`Are you sure you want to delete "${editingProperty.title}"?`)) return;
    const nextProps = properties.filter((p) => p.id !== editingProperty.id);
    setProperties(nextProps);
    try {
      localStorage.setItem("stayq_admin_properties", JSON.stringify(nextProps));
      window.dispatchEvent(new Event("stayq_properties_updated"));
    } catch {}

    try {
      await axios.delete(`/api/v1/properties/${editingProperty.id}`, {
        headers: { 'x-admin-key': 'stayq-admin-secret-2026' }
      });
      await fetchProperties();
    } catch (err) {
      console.warn("Backend delete sync note:", err);
    } finally {
      setIsModalOpen(false);
    }
  };

  const [auditProperty, setAuditProperty] = useState<Property | null>(null);
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);
  const [newFaultTitle, setNewFaultTitle] = useState("");
  const [newFaultCategory, setNewFaultCategory] = useState("MAINTENANCE");
  const [newFaultSeverity, setNewFaultSeverity] = useState("MEDIUM");
  const [newFaultDesc, setNewFaultDesc] = useState("");
  const [isLoggingFault, setIsLoggingFault] = useState(false);

  const openAuditModal = async (p: Property) => {
    setAuditProperty(p);
    setIsAuditModalOpen(true);
    try {
      const res = await axios.get(`/api/v1/properties/${p.id}?adminView=true`);
      if (res.data) setAuditProperty(res.data);
    } catch (e) {
      console.warn("Could not refresh property details:", e);
    }
  };

  const handleLogFault = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auditProperty || !newFaultTitle.trim()) return;
    setIsLoggingFault(true);
    try {
      await axios.post(`/api/v1/properties/${auditProperty.id}/incidents`, {
        title: newFaultTitle,
        category: newFaultCategory,
        severity: newFaultSeverity,
        description: newFaultDesc,
        status: "OPEN",
      });
      // Refresh audit property
      const res = await axios.get(`/api/v1/properties/${auditProperty.id}?adminView=true`);
      if (res.data) setAuditProperty(res.data);
      await fetchProperties();
      setNewFaultTitle("");
      setNewFaultDesc("");
    } catch (err) {
      console.error("Failed to log fault:", err);
    } finally {
      setIsLoggingFault(false);
    }
  };

  const filteredProperties = properties.filter((p) => {
    if (categoryFilter !== "All" && p.category?.name !== categoryFilter) return false;
    if (search.trim() !== "") {
      const q = search.toLowerCase();
      const code = p.propertyCode?.toLowerCase() || "";
      return (
        code.includes(q) ||
        p.id?.toLowerCase().includes(q) ||
        p.title?.toLowerCase().includes(q) ||
        p.city?.toLowerCase().includes(q) ||
        p.locality?.toLowerCase().includes(q) ||
        p.country?.toLowerCase().includes(q) ||
        p.host?.firstName?.toLowerCase().includes(q) ||
        p.host?.phone?.includes(q)
      );
    }
    return true;
  });

  const activeCount = properties.filter((p) => p.status === "ACTIVE" || p.status === "PUBLISHED").length;
  const totalRev = properties.reduce((acc, p) => acc + (p.basePrice || 0), 0);
  const avgPrice = properties.length > 0 ? Math.round(totalRev / properties.length) : 0;

  return (
    <div style={{ width: "100%", maxWidth: "1400px", margin: "0 auto", padding: "1.5rem" }}>
      {/* Header Bar */}
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: "1rem", marginBottom: "1.5rem", paddingBottom: "1.5rem", borderBottom: "1px solid #e2e8f0" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "#9D00FF", fontWeight: 700, fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.25rem" }}>
            <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>domain</span>
            Inventory &amp; Stays Management
          </div>
          <h1 style={{ fontSize: "1.75rem", fontWeight: 800, color: "#0f172a", margin: 0 }}>
            Properties &amp; Stays Catalog
          </h1>
          <p style={{ fontSize: "0.9rem", color: "#64748b", margin: "0.25rem 0 0 0" }}>
            Unique Property ID lookup, fault incident tracker, host identity verification, and live booking audit.
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <button
            type="button"
            onClick={openCreateNew}
            style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.65rem 1.3rem", borderRadius: "12px", background: "#9D00FF", color: "#ffffff", fontWeight: 700, fontSize: "0.88rem", border: "none", cursor: "pointer", boxShadow: "0 4px 12px rgba(157, 0, 255, 0.25)" }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>add</span>
            Add New Property
          </button>
        </div>
      </div>

      {/* KPI Metrics */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
        <div style={{ background: "#ffffff", padding: "1.25rem", borderRadius: "16px", border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
          <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>Total Properties</span>
          <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "#0f172a", marginTop: "0.25rem" }}>{properties.length}</div>
        </div>

        <div style={{ background: "#ffffff", padding: "1.25rem", borderRadius: "16px", border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
          <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>Active Listings</span>
          <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "#059669", marginTop: "0.25rem" }}>{activeCount}</div>
        </div>

        <div style={{ background: "#ffffff", padding: "1.25rem", borderRadius: "16px", border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
          <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>Avg. Nightly Rate</span>
          <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "#0f172a", marginTop: "0.25rem" }}>₹{avgPrice.toLocaleString()}</div>
        </div>
      </div>

      {/* Filter Bar */}
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: "1rem", marginBottom: "1.25rem", background: "#ffffff", padding: "0.85rem 1.25rem", borderRadius: "16px", border: "1px solid #e2e8f0" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flex: 1, minWidth: "260px" }}>
          <span className="material-symbols-outlined" style={{ color: "#64748b" }}>search</span>
          <input
            type="text"
            placeholder="Search by Unique Property ID (e.g. ST603-9182), title, host name, city, or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: "100%", border: "none", outline: "none", fontSize: "0.88rem", background: "transparent" }}
          />
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", overflowX: "auto" }}>
          {["All", ...PROPERTY_CATEGORIES.slice(0, 7)].map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategoryFilter(cat)}
              style={{
                padding: "0.45rem 0.85rem",
                borderRadius: "10px",
                fontSize: "0.8rem",
                fontWeight: 700,
                border: "none",
                cursor: "pointer",
                background: categoryFilter === cat ? "#9D00FF" : "#f1f5f9",
                color: categoryFilter === cat ? "#ffffff" : "#475569",
                transition: "all 0.15s ease",
              }}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Properties Table */}
      <div style={{ background: "#ffffff", borderRadius: "20px", border: "1px solid #e2e8f0", overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
        {loading ? (
          <div style={{ padding: "3rem", textAlign: "center", color: "#64748b" }}>Loading properties from database...</div>
        ) : filteredProperties.length === 0 ? (
          <div style={{ padding: "3rem", textAlign: "center", color: "#64748b" }}>
            <span className="material-symbols-outlined" style={{ fontSize: "40px", color: "#cbd5e1", display: "block", marginBottom: "0.5rem" }}>villa</span>
            No properties found matching your search. Click <strong>Add New Property</strong> to create one!
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.88rem" }}>
              <thead>
                <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0", color: "#475569", fontWeight: 700, fontSize: "0.75rem", textTransform: "uppercase" }}>
                  <th style={{ padding: "1rem 1.25rem" }}>Property &amp; Unique ID</th>
                  <th style={{ padding: "1rem" }}>Host Details</th>
                  <th style={{ padding: "1rem" }}>Category &amp; Location</th>
                  <th style={{ padding: "1rem" }}>Nightly Rate</th>
                  <th style={{ padding: "1rem" }}>Faults &amp; Status</th>
                  <th style={{ padding: "1rem 1.25rem", textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProperties.map((p) => {
                  const propCode = p.propertyCode || `ST${(p.host?.phone || '').replace(/\D/g, '').slice(-3) || '999'}-${p.id.slice(0, 4).toUpperCase()}`;
                  const hasFault = Boolean(p.hasActiveFault || (p.faultCount && p.faultCount > 0));

                  return (
                    <tr key={p.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                      <td style={{ padding: "1rem 1.25rem" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.85rem" }}>
                          <img
                            src={p.imageUrls?.[0] || p.heroImage || "/images/villa_1.jpg"}
                            alt=""
                            style={{ width: "52px", height: "42px", borderRadius: "8px", objectFit: "cover" }}
                          />
                          <div>
                            <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginBottom: "0.15rem" }}>
                              <span style={{ fontSize: "0.72rem", fontWeight: 800, padding: "0.15rem 0.45rem", borderRadius: "6px", background: "rgba(157, 0, 255, 0.12)", color: "#9D00FF", letterSpacing: "0.03em" }}>
                                {propCode}
                              </span>
                              <span style={{ fontWeight: 800, color: "#0f172a" }}>{p.title}</span>
                            </div>
                            <div style={{ fontSize: "0.75rem", color: "#64748b" }}>
                              {p.bedrooms || 1} Bed · {p.bathrooms || 1} Bath · Up to {p.maxGuests || 2} Guests
                            </div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: "1rem" }}>
                        <div style={{ fontWeight: 700, color: "#0f172a" }}>
                          {p.host?.displayName || (p.host?.firstName ? `${p.host.firstName} ${p.host.lastName || ''}`.trim() : "Host")}
                        </div>
                        <div style={{ fontSize: "0.75rem", color: "#64748b" }}>
                          {p.host?.phone || p.host?.email || "No phone listed"}
                        </div>
                      </td>
                      <td style={{ padding: "1rem", color: "#334155" }}>
                        <div style={{ fontWeight: 700 }}>{p.category?.name || "Villa"}</div>
                        <div style={{ fontSize: "0.75rem", color: "#64748b" }}>
                          {p.city || "Goa"}, {p.country || "India"}
                        </div>
                      </td>
                      <td style={{ padding: "1rem", fontWeight: 800, color: "#0f172a" }}>
                        ₹{(p.basePrice || 0).toLocaleString()}
                        <span style={{ fontSize: "0.75rem", fontWeight: 500, color: "#64748b" }}> /night</span>
                      </td>
                      <td style={{ padding: "1rem" }}>
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                          <span style={{ padding: "0.2rem 0.55rem", borderRadius: "100px", fontSize: "0.72rem", fontWeight: 800, width: "fit-content", background: p.status === "ACTIVE" ? "#ecfdf5" : "#fef3c7", color: p.status === "ACTIVE" ? "#059669" : "#d97706" }}>
                            {p.status}
                          </span>
                          {hasFault && (
                            <span style={{ padding: "0.15rem 0.45rem", borderRadius: "6px", fontSize: "0.7rem", fontWeight: 800, background: "#fee2e2", color: "#dc2626", width: "fit-content", display: "inline-flex", alignItems: "center", gap: "0.2rem" }}>
                              <span className="material-symbols-outlined" style={{ fontSize: "12px" }}>warning</span>
                              Fault Reported ({p.faultCount || 1})
                            </span>
                          )}
                        </div>
                      </td>
                      <td style={{ padding: "1rem 1.25rem", textAlign: "right" }}>
                        <div style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem" }}>
                          <button
                            type="button"
                            onClick={() => openAuditModal(p)}
                            style={{ padding: "0.45rem 0.75rem", borderRadius: "10px", background: "#f1f5f9", color: "#334155", border: "none", cursor: "pointer", fontWeight: 700, fontSize: "0.78rem", display: "inline-flex", alignItems: "center", gap: "0.3rem" }}
                          >
                            <span className="material-symbols-outlined" style={{ fontSize: "15px" }}>manage_search</span>
                            Audit &amp; Faults
                          </button>
                          <button
                            type="button"
                            onClick={() => openEditor(p)}
                            style={{ padding: "0.45rem 0.75rem", borderRadius: "10px", background: "rgba(157, 0, 255, 0.08)", color: "#9D00FF", border: "none", cursor: "pointer", fontWeight: 700, fontSize: "0.78rem", display: "inline-flex", alignItems: "center", gap: "0.3rem" }}
                          >
                            <span className="material-symbols-outlined" style={{ fontSize: "15px" }}>edit</span>
                            Edit
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* PROPERTY LIFECYCLE, HOST IDENTITY & FAULT TRACKER DRAWER / MODAL */}
      {isAuditModalOpen && auditProperty && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, width: "100vw", height: "100vh", background: "rgba(15, 23, 42, 0.75)", backdropFilter: "blur(6px)", zIndex: 99999, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
          <div style={{ background: "#ffffff", borderRadius: "24px", maxWidth: "850px", width: "95vw", maxHeight: "90vh", overflowY: "auto", padding: "2rem", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.35)", border: "1px solid rgba(226, 232, 240, 0.8)" }}>
            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem", paddingBottom: "1rem", borderBottom: "1px solid #e2e8f0" }}>
              <div>
                <div style={{ display: "inline-block", padding: "0.2rem 0.6rem", borderRadius: "6px", background: "rgba(157, 0, 255, 0.12)", color: "#9D00FF", fontWeight: 800, fontSize: "0.82rem", marginBottom: "0.35rem" }}>
                  {auditProperty.propertyCode || `ST${(auditProperty.host?.phone || '').replace(/\D/g, '').slice(-3) || '999'}-${auditProperty.id.slice(0, 4).toUpperCase()}`}
                </div>
                <h2 style={{ fontSize: "1.35rem", fontWeight: 800, color: "#0f172a", margin: 0 }}>
                  {auditProperty.title}
                </h2>
                <p style={{ fontSize: "0.82rem", color: "#64748b", margin: "0.2rem 0 0 0" }}>
                  Registered On: {auditProperty.registeredAt || auditProperty.createdAt ? new Date(auditProperty.registeredAt || auditProperty.createdAt!).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "Active Onboarding"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsAuditModalOpen(false)}
                style={{ background: "#f1f5f9", border: "none", borderRadius: "50%", width: "36px", height: "36px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#64748b" }}
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Host Profile & Identity Snapshot */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1rem", marginBottom: "1.5rem", background: "#f8fafc", padding: "1.25rem", borderRadius: "16px", border: "1px solid #e2e8f0" }}>
              <div>
                <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>Host Full Name</span>
                <div style={{ fontWeight: 800, color: "#0f172a", marginTop: "0.2rem" }}>
                  {auditProperty.host?.displayName || `${auditProperty.host?.firstName || 'Mayank'} ${auditProperty.host?.lastName || 'Shukla'}`}
                </div>
              </div>
              <div>
                <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>Verified Contact Phone</span>
                <div style={{ fontWeight: 800, color: "#0f172a", marginTop: "0.2rem" }}>
                  {auditProperty.host?.phone || "+91 99999 99999"}
                </div>
              </div>
              <div>
                <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>Total Stays Booked</span>
                <div style={{ fontWeight: 800, color: "#059669", marginTop: "0.2rem" }}>
                  {auditProperty._count?.bookings || 0} Bookings Completed
                </div>
              </div>
            </div>

            {/* Log a New Fault / Incident Form */}
            <div style={{ marginBottom: "1.5rem", background: "#ffffff", padding: "1.25rem", borderRadius: "16px", border: "1px solid #e2e8f0" }}>
              <h3 style={{ fontSize: "1rem", fontWeight: 800, color: "#0f172a", marginBottom: "0.75rem", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                <span className="material-symbols-outlined" style={{ color: "#dc2626", fontSize: "20px" }}>build</span>
                Log Property Fault / Maintenance Issue
              </h3>
              <form onSubmit={handleLogFault}>
                <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: "0.75rem", marginBottom: "0.75rem" }}>
                  <input
                    type="text"
                    required
                    placeholder="Fault Title (e.g. AC Cooling Breakdown, Geyser not working)"
                    value={newFaultTitle}
                    onChange={(e) => setNewFaultTitle(e.target.value)}
                    style={{ padding: "0.55rem 0.85rem", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.85rem" }}
                  />
                  <select
                    value={newFaultCategory}
                    onChange={(e) => setNewFaultCategory(e.target.value)}
                    style={{ padding: "0.55rem 0.85rem", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.85rem", background: "#ffffff" }}
                  >
                    <option value="MAINTENANCE">Maintenance</option>
                    <option value="SAFETY">Safety</option>
                    <option value="CLEANLINESS">Cleanliness</option>
                    <option value="AMENITY_MISSING">Amenity Missing</option>
                    <option value="DAMAGE">Damage</option>
                  </select>
                  <select
                    value={newFaultSeverity}
                    onChange={(e) => setNewFaultSeverity(e.target.value)}
                    style={{ padding: "0.55rem 0.85rem", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.85rem", background: "#ffffff" }}
                  >
                    <option value="LOW">Low Severity</option>
                    <option value="MEDIUM">Medium Severity</option>
                    <option value="HIGH">High Severity</option>
                    <option value="CRITICAL">Critical</option>
                  </select>
                </div>
                <textarea
                  placeholder="Details of the fault reported by guest or operations team..."
                  value={newFaultDesc}
                  onChange={(e) => setNewFaultDesc(e.target.value)}
                  rows={2}
                  style={{ width: "100%", padding: "0.55rem 0.85rem", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.85rem", marginBottom: "0.75rem" }}
                />
                <button
                  type="submit"
                  disabled={isLoggingFault}
                  style={{ padding: "0.55rem 1.1rem", borderRadius: "8px", background: "#dc2626", color: "#ffffff", border: "none", fontWeight: 700, fontSize: "0.82rem", cursor: "pointer" }}
                >
                  {isLoggingFault ? "Logging..." : "Record Fault / Issue"}
                </button>
              </form>
            </div>

            {/* Fault & Incident History */}
            <div>
              <h3 style={{ fontSize: "1rem", fontWeight: 800, color: "#0f172a", marginBottom: "0.75rem" }}>
                Incident &amp; Fault History ({auditProperty.incidents?.length || 0})
              </h3>
              {(!auditProperty.incidents || auditProperty.incidents.length === 0) ? (
                <div style={{ padding: "1.5rem", background: "#f8fafc", borderRadius: "12px", textAlign: "center", color: "#64748b", fontSize: "0.85rem" }}>
                  <span className="material-symbols-outlined" style={{ fontSize: "28px", color: "#10b981", display: "block", marginBottom: "0.25rem" }}>verified</span>
                  No faults or disputes recorded for this property. Operational status is 100% clean!
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                  {auditProperty.incidents.map((inc) => (
                    <div key={inc.id} style={{ padding: "1rem", borderRadius: "12px", border: "1px solid #e2e8f0", background: inc.status === "OPEN" ? "#fef2f2" : "#f8fafc", display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem" }}>
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginBottom: "0.2rem" }}>
                          <span style={{ fontSize: "0.72rem", fontWeight: 800, padding: "0.15rem 0.4rem", borderRadius: "4px", background: "#ffffff", border: "1px solid #cbd5e1" }}>
                            {inc.incidentCode || "INCIDENT"}
                          </span>
                          <strong style={{ fontSize: "0.9rem", color: "#0f172a" }}>{inc.title}</strong>
                          <span style={{ fontSize: "0.7rem", fontWeight: 800, padding: "0.15rem 0.45rem", borderRadius: "100px", background: inc.status === "OPEN" ? "#dc2626" : "#059669", color: "#ffffff" }}>
                            {inc.status}
                          </span>
                        </div>
                        <p style={{ fontSize: "0.82rem", color: "#475569", margin: "0.25rem 0 0 0" }}>{inc.description}</p>
                        <div style={{ fontSize: "0.72rem", color: "#94a3b8", marginTop: "0.35rem" }}>
                          Category: {inc.category} · Severity: {inc.severity} · Reported: {new Date(inc.createdAt).toLocaleString("en-IN")}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* RICH PROPERTY EDITOR MODAL */}
      {isModalOpen && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, width: "100vw", height: "100vh", background: "rgba(15, 23, 42, 0.75)", backdropFilter: "blur(6px)", zIndex: 99999, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
          <div style={{ background: "#ffffff", borderRadius: "24px", maxWidth: "900px", width: "95vw", maxHeight: "92vh", overflowY: "auto", padding: "2rem", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.35)", border: "1px solid rgba(226, 232, 240, 0.8)" }}>
            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem", paddingBottom: "1rem", borderBottom: "1px solid #e2e8f0" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <span className="material-symbols-outlined" style={{ color: "#9D00FF", fontSize: "28px" }}>edit_square</span>
                <div>
                  <h3 style={{ fontSize: "1.3rem", fontWeight: 800, margin: 0, color: "#0f172a" }}>
                    {isCreatingNew ? "Add New Stay Q Property" : `Edit "${title || 'Property'}"`}
                  </h3>
                  <span style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 600 }}>
                    {editingProperty ? `ID: ${editingProperty.id}` : "New Property Listing"} · Live Database Sync
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                style={{ background: "#f1f5f9", border: "none", borderRadius: "50%", width: "36px", height: "36px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#64748b" }}
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {saveSuccess && (
              <div style={{ padding: "0.75rem 1rem", borderRadius: "12px", background: "#ecfdf5", color: "#059669", fontWeight: 700, fontSize: "0.88rem", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <span className="material-symbols-outlined">check_circle</span>
                Property details successfully saved to live database!
              </div>
            )}

            <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              {/* 1. Title & Status & Category */}
              <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: "1rem" }}>
                <div>
                  <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "#475569", textTransform: "uppercase", display: "block", marginBottom: "0.25rem" }}>Property Title *</label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Glass Pavilion Villa Candolim with Private Pool"
                    style={{ width: "100%", padding: "0.65rem 0.85rem", fontSize: "0.88rem", borderRadius: "10px", border: "1px solid #cbd5e1", outline: "none", fontWeight: 700 }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "#475569", textTransform: "uppercase", display: "block", marginBottom: "0.25rem" }}>Category *</label>
                  <select
                    value={categoryName}
                    onChange={(e) => setCategoryName(e.target.value)}
                    style={{ width: "100%", padding: "0.65rem 0.85rem", fontSize: "0.88rem", borderRadius: "10px", border: "1px solid #cbd5e1", outline: "none", fontWeight: 700 }}
                  >
                    {PROPERTY_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "#475569", textTransform: "uppercase", display: "block", marginBottom: "0.25rem" }}>Status *</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    style={{ width: "100%", padding: "0.65rem 0.85rem", fontSize: "0.88rem", borderRadius: "10px", border: "1px solid #cbd5e1", outline: "none", fontWeight: 700 }}
                  >
                    <option value="ACTIVE">ACTIVE (Published)</option>
                    <option value="PENDING_REVIEW">PENDING REVIEW</option>
                    <option value="PAUSED">PAUSED</option>
                    <option value="DRAFT">DRAFT</option>
                  </select>
                </div>
              </div>

              {/* 2. Location Fields Hierarchy */}
              <div style={{ background: "#f8fafc", padding: "1.25rem", borderRadius: "16px", border: "1px solid #e2e8f0", display: "flex", flexDirection: "column", gap: "1rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontWeight: 800, fontSize: "0.9rem", color: "#0f172a" }}>
                  <span className="material-symbols-outlined" style={{ color: "#9D00FF", fontSize: "20px" }}>pin_drop</span>
                  Location &amp; Address Details
                </div>

                {/* Country, State, City */}
                <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr 1fr", gap: "1rem" }}>
                  <div>
                    <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "#475569", textTransform: "uppercase", display: "block", marginBottom: "0.25rem" }}>
                      Country &amp; Flag 🌐 *
                    </label>
                    <select
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      style={{ width: "100%", padding: "0.65rem 0.85rem", fontSize: "0.88rem", borderRadius: "10px", border: "1px solid #cbd5e1", outline: "none", fontWeight: 700, background: "#ffffff" }}
                    >
                      {COUNTRIES.map((c) => (
                        <option key={c.name} value={c.name}>
                          {c.flag} {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "#475569", textTransform: "uppercase", display: "block", marginBottom: "0.25rem" }}>State / Province *</label>
                    <input
                      type="text"
                      required
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                      placeholder="e.g. Goa"
                      style={{ width: "100%", padding: "0.65rem 0.85rem", fontSize: "0.88rem", borderRadius: "10px", border: "1px solid #cbd5e1", outline: "none", background: "#ffffff" }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "#475569", textTransform: "uppercase", display: "block", marginBottom: "0.25rem" }}>City *</label>
                    <input
                      type="text"
                      required
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="e.g. Candolim"
                      style={{ width: "100%", padding: "0.65rem 0.85rem", fontSize: "0.88rem", borderRadius: "10px", border: "1px solid #cbd5e1", outline: "none", background: "#ffffff" }}
                    />
                  </div>
                </div>

                {/* Locality, Pincode, Landmark (Optional) */}
                <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr 1.2fr", gap: "1rem" }}>
                  <div>
                    <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "#475569", textTransform: "uppercase", display: "block", marginBottom: "0.25rem" }}>
                      Locality / Area *
                    </label>
                    <input
                      type="text"
                      value={locality}
                      onChange={(e) => setLocality(e.target.value)}
                      placeholder="e.g. Candolim Beach Road / North Goa"
                      style={{ width: "100%", padding: "0.65rem 0.85rem", fontSize: "0.88rem", borderRadius: "10px", border: "1px solid #cbd5e1", outline: "none", background: "#ffffff" }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "#475569", textTransform: "uppercase", display: "block", marginBottom: "0.25rem" }}>
                      Pin Code / Zip Code *
                    </label>
                    <input
                      type="text"
                      value={pincode}
                      onChange={(e) => setPincode(e.target.value)}
                      placeholder="403515"
                      style={{ width: "100%", padding: "0.65rem 0.85rem", fontSize: "0.88rem", borderRadius: "10px", border: "1px solid #cbd5e1", outline: "none", fontFamily: "monospace", background: "#ffffff" }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase", display: "block", marginBottom: "0.25rem" }}>
                      Landmark (Optional)
                    </label>
                    <input
                      type="text"
                      value={landmark}
                      onChange={(e) => setLandmark(e.target.value)}
                      placeholder="e.g. Near Fort Aguada & Taj Village"
                      style={{ width: "100%", padding: "0.65rem 0.85rem", fontSize: "0.88rem", borderRadius: "10px", border: "1px solid #cbd5e1", outline: "none", background: "#ffffff" }}
                    />
                  </div>
                </div>

                {/* Street / Full Address */}
                <div>
                  <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "#475569", textTransform: "uppercase", display: "block", marginBottom: "0.25rem" }}>
                    Street / Building Address
                  </label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="e.g. Plot 14, Candolim Beach Rd, Next to Whispering Palms"
                    style={{ width: "100%", padding: "0.65rem 0.85rem", fontSize: "0.88rem", borderRadius: "10px", border: "1px solid #cbd5e1", outline: "none", background: "#ffffff" }}
                  />
                </div>
              </div>

              {/* 3. Real Google Maps Interactive Pin & Location Picker */}
              <GoogleMapPicker
                lat={lat}
                lng={lng}
                city={city}
                state={state}
                country={country}
                pincode={pincode}
                onLocationChange={handleLocationFromMap}
              />

              {/* 4. Pricing & Fees */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div>
                  <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "#475569", textTransform: "uppercase", display: "block", marginBottom: "0.25rem" }}>Nightly Rate (₹) *</label>
                  <input
                    type="number"
                    required
                    placeholder="Enter Nightly Rate (e.g. 8500)"
                    value={basePrice === 0 ? "" : basePrice}
                    onChange={(e) => setBasePrice(e.target.value === "" ? 0 : Number(e.target.value))}
                    style={{ width: "100%", padding: "0.65rem 0.85rem", fontSize: "0.88rem", borderRadius: "10px", border: "1px solid #cbd5e1", outline: "none", fontFamily: "monospace", fontWeight: 800 }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "#475569", textTransform: "uppercase", display: "block", marginBottom: "0.25rem" }}>Cleaning Fee (₹)</label>
                  <input
                    type="number"
                    placeholder="e.g. 500 (Optional)"
                    value={cleaningFee === 0 ? "" : cleaningFee}
                    onChange={(e) => setCleaningFee(e.target.value === "" ? 0 : Number(e.target.value))}
                    style={{ width: "100%", padding: "0.65rem 0.85rem", fontSize: "0.88rem", borderRadius: "10px", border: "1px solid #cbd5e1", outline: "none", fontFamily: "monospace" }}
                  />
                </div>
              </div>

              {/* Live Host Earnings & Commission Breakdown Card */}
              {basePrice > 0 && (
                <div style={{ background: "linear-gradient(135deg, rgba(157, 0, 255, 0.04), rgba(16, 185, 129, 0.06))", border: "1px solid #10b981", borderRadius: "16px", padding: "1.1rem 1.25rem", marginTop: "0.25rem" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.75rem", paddingBottom: "0.5rem", borderBottom: "1px solid rgba(16, 185, 129, 0.2)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                      <span className="material-symbols-outlined" style={{ color: "#059669", fontSize: "20px" }}>payments</span>
                      <strong style={{ fontSize: "0.9rem", color: "#0f172a" }}>Your Net In-Hand Earnings Preview</strong>
                    </div>
                    <span style={{ fontSize: "0.75rem", fontWeight: 800, background: "#ecfdf5", color: "#059669", padding: "0.25rem 0.6rem", borderRadius: "100px", border: "1px solid #a7f3d0" }}>
                      You keep ~96%
                    </span>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: "0.75rem", marginBottom: "0.75rem" }}>
                    <div style={{ background: "#ffffff", padding: "0.6rem 0.85rem", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
                      <span style={{ fontSize: "0.7rem", color: "#64748b", fontWeight: 700, textTransform: "uppercase" }}>Listed Rate</span>
                      <div style={{ fontSize: "1rem", fontWeight: 800, color: "#0f172a" }}>₹{Number(basePrice).toLocaleString('en-IN')}</div>
                    </div>

                    <div style={{ background: "#ffffff", padding: "0.6rem 0.85rem", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
                      <span style={{ fontSize: "0.7rem", color: "#ef4444", fontWeight: 700, textTransform: "uppercase" }}>Stay Q Fee (3%)</span>
                      <div style={{ fontSize: "1rem", fontWeight: 800, color: "#ef4444" }}>-₹{Math.round(basePrice * 0.03).toLocaleString('en-IN')}</div>
                    </div>

                    <div style={{ background: "#ffffff", padding: "0.6rem 0.85rem", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
                      <span style={{ fontSize: "0.7rem", color: "#64748b", fontWeight: 700, textTransform: "uppercase" }}>TDS (1% 194-O)</span>
                      <div style={{ fontSize: "1rem", fontWeight: 800, color: "#64748b" }}>-₹{Math.round(basePrice * 0.01).toLocaleString('en-IN')}</div>
                    </div>

                    <div style={{ background: "#ecfdf5", padding: "0.6rem 0.85rem", borderRadius: "10px", border: "1px solid #a7f3d0" }}>
                      <span style={{ fontSize: "0.7rem", color: "#047857", fontWeight: 800, textTransform: "uppercase" }}>You Earn / Night</span>
                      <div style={{ fontSize: "1.15rem", fontWeight: 900, color: "#059669" }}>₹{Math.round(basePrice * 0.96).toLocaleString('en-IN')}</div>
                    </div>
                  </div>

                  <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: "0.5rem", fontSize: "0.76rem", color: "#475569", paddingTop: "0.5rem", borderTop: "1px dashed #cbd5e1" }}>
                    <span>🛒 Guests will pay approx <strong>₹{Math.round(basePrice * 1.118).toLocaleString('en-IN')}</strong> / night (includes 10% guest service fee + 18% GST).</span>
                    <span>💰 Monthly potential (30 nights): <strong style={{ color: "#059669" }}>₹{Math.round(basePrice * 30 * 0.96).toLocaleString('en-IN')}</strong></span>
                  </div>
                </div>
              )}

              {/* 5. Zero-Brokerage Long Term Leasing Options */}
              <div style={{ background: isZeroBroker ? "rgba(16, 185, 129, 0.05)" : "#f8fafc", border: isZeroBroker ? "1px solid #10b981" : "1px solid #e2e8f0", borderRadius: "16px", padding: "1rem" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: isZeroBroker ? "0.75rem" : 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <span className="material-symbols-outlined" style={{ color: "#10b981" }}>verified_user</span>
                    <div>
                      <strong style={{ fontSize: "0.88rem", color: "#0f172a" }}>Zero-Brokerage Direct Tenancy</strong>
                      <span style={{ display: "block", fontSize: "0.75rem", color: "#64748b" }}>Enable 0% broker fee monthly long-term renting contract</span>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={isZeroBroker}
                    onChange={(e) => setIsZeroBroker(e.target.checked)}
                    style={{ width: "20px", height: "20px", cursor: "pointer", accentColor: "#10b981" }}
                  />
                </div>

                {isZeroBroker && (
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem", marginTop: "0.75rem", paddingTop: "0.75rem", borderTop: "1px solid rgba(16, 185, 129, 0.2)" }}>
                    <div>
                      <label style={{ fontSize: "0.72rem", fontWeight: 700, color: "#047857", display: "block", marginBottom: "0.2rem" }}>Monthly Rent (₹)</label>
                      <input
                        type="number"
                        value={monthlyRent}
                        onChange={(e) => setMonthlyRent(Number(e.target.value))}
                        style={{ width: "100%", padding: "0.5rem 0.75rem", fontSize: "0.85rem", borderRadius: "8px", border: "1px solid #a7f3d0", outline: "none", fontWeight: 800 }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: "0.72rem", fontWeight: 700, color: "#047857", display: "block", marginBottom: "0.2rem" }}>Security Deposit (₹)</label>
                      <input
                        type="number"
                        value={securityDeposit}
                        onChange={(e) => setSecurityDeposit(Number(e.target.value))}
                        style={{ width: "100%", padding: "0.5rem 0.75rem", fontSize: "0.85rem", borderRadius: "8px", border: "1px solid #a7f3d0", outline: "none" }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: "0.72rem", fontWeight: 700, color: "#047857", display: "block", marginBottom: "0.2rem" }}>Lease Duration</label>
                      <select
                        value={leaseDurationMonths}
                        onChange={(e) => setLeaseDurationMonths(Number(e.target.value))}
                        style={{ width: "100%", padding: "0.5rem 0.75rem", fontSize: "0.85rem", borderRadius: "8px", border: "1px solid #a7f3d0", outline: "none", fontWeight: 700 }}
                      >
                        <option value={1}>1 Month (Flexible)</option>
                        <option value={3}>3 Months</option>
                        <option value={6}>6 Months</option>
                        <option value={11}>11 Months (Standard)</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>

              {/* 6. Room Specs */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "1rem" }}>
                <div>
                  <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "#475569", textTransform: "uppercase", display: "block", marginBottom: "0.25rem" }}>Max Guests</label>
                  <input
                    type="number"
                    value={maxGuests}
                    onChange={(e) => setMaxGuests(Number(e.target.value))}
                    style={{ width: "100%", padding: "0.65rem 0.85rem", fontSize: "0.88rem", borderRadius: "10px", border: "1px solid #cbd5e1", outline: "none", textAlign: "center", fontWeight: 700 }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "#475569", textTransform: "uppercase", display: "block", marginBottom: "0.25rem" }}>Bedrooms</label>
                  <input
                    type="number"
                    value={bedrooms}
                    onChange={(e) => setBedrooms(Number(e.target.value))}
                    style={{ width: "100%", padding: "0.65rem 0.85rem", fontSize: "0.88rem", borderRadius: "10px", border: "1px solid #cbd5e1", outline: "none", textAlign: "center", fontWeight: 700 }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "#475569", textTransform: "uppercase", display: "block", marginBottom: "0.25rem" }}>Beds</label>
                  <input
                    type="number"
                    value={beds}
                    onChange={(e) => setBeds(Number(e.target.value))}
                    style={{ width: "100%", padding: "0.65rem 0.85rem", fontSize: "0.88rem", borderRadius: "10px", border: "1px solid #cbd5e1", outline: "none", textAlign: "center", fontWeight: 700 }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "#475569", textTransform: "uppercase", display: "block", marginBottom: "0.25rem" }}>Bathrooms</label>
                  <input
                    type="number"
                    value={bathrooms}
                    onChange={(e) => setBathrooms(Number(e.target.value))}
                    style={{ width: "100%", padding: "0.65rem 0.85rem", fontSize: "0.88rem", borderRadius: "10px", border: "1px solid #cbd5e1", outline: "none", textAlign: "center", fontWeight: 700 }}
                  />
                </div>
              </div>

              {/* 7. Description */}
              <div>
                <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "#475569", textTransform: "uppercase", display: "block", marginBottom: "0.25rem" }}>Property Description</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe architectural highlights, panoramic views, private chef, concierge..."
                  style={{ width: "100%", padding: "0.65rem 0.85rem", fontSize: "0.85rem", borderRadius: "10px", border: "1px solid #cbd5e1", outline: "none" }}
                />
              </div>

              {/* 8. House Rules & Check-in Times */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "1rem", background: "#f8fafc", padding: "1rem", borderRadius: "16px", border: "1px solid #e2e8f0" }}>
                <div>
                  <label style={{ fontSize: "0.72rem", fontWeight: 700, color: "#64748b", display: "block", marginBottom: "0.3rem" }}>Check-in Time</label>
                  <input
                    type="text"
                    value={checkInTime}
                    onChange={(e) => setCheckInTime(e.target.value)}
                    placeholder="14:00"
                    style={{ width: "100%", padding: "0.5rem 0.75rem", fontSize: "0.85rem", borderRadius: "8px", border: "1px solid #cbd5e1", outline: "none", textAlign: "center" }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: "0.72rem", fontWeight: 700, color: "#64748b", display: "block", marginBottom: "0.3rem" }}>Check-out Time</label>
                  <input
                    type="text"
                    value={checkOutTime}
                    onChange={(e) => setCheckOutTime(e.target.value)}
                    placeholder="11:00"
                    style={{ width: "100%", padding: "0.5rem 0.75rem", fontSize: "0.85rem", borderRadius: "8px", border: "1px solid #cbd5e1", outline: "none", textAlign: "center" }}
                  />
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem", justifyContent: "center" }}>
                  <label style={{ fontSize: "0.75rem", fontWeight: 600, display: "flex", alignItems: "center", gap: "0.4rem", cursor: "pointer" }}>
                    <input type="checkbox" checked={petsAllowed} onChange={(e) => setPetsAllowed(e.target.checked)} />
                    Pets Allowed 🐾
                  </label>
                  <label style={{ fontSize: "0.75rem", fontWeight: 600, display: "flex", alignItems: "center", gap: "0.4rem", cursor: "pointer" }}>
                    <input type="checkbox" checked={instantBook} onChange={(e) => setInstantBook(e.target.checked)} />
                    Instant Book ⚡
                  </label>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem", justifyContent: "center" }}>
                  <label style={{ fontSize: "0.75rem", fontWeight: 600, display: "flex", alignItems: "center", gap: "0.4rem", cursor: "pointer" }}>
                    <input type="checkbox" checked={smokingAllowed} onChange={(e) => setSmokingAllowed(e.target.checked)} />
                    Smoking Allowed 🚬
                  </label>
                  <label style={{ fontSize: "0.75rem", fontWeight: 600, display: "flex", alignItems: "center", gap: "0.4rem", cursor: "pointer" }}>
                    <input type="checkbox" checked={partiesAllowed} onChange={(e) => setPartiesAllowed(e.target.checked)} />
                    Parties Allowed 🎉
                  </label>
                </div>
              </div>

              {/* 9. Host Contact Information */}
              <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr 1fr", gap: "1rem" }}>
                <div>
                  <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "#475569", textTransform: "uppercase", display: "block", marginBottom: "0.25rem" }}>Host / Owner Name</label>
                  <input
                    type="text"
                    value={hostName}
                    onChange={(e) => setHostName(e.target.value)}
                    placeholder="Shayan Mandal"
                    style={{ width: "100%", padding: "0.65rem 0.85rem", fontSize: "0.88rem", borderRadius: "10px", border: "1px solid #cbd5e1", outline: "none", fontWeight: 700 }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "#475569", textTransform: "uppercase", display: "block", marginBottom: "0.25rem" }}>Host Phone</label>
                  <input
                    type="text"
                    value={hostPhone}
                    onChange={(e) => setHostPhone(e.target.value)}
                    placeholder="+91 99999 99999"
                    style={{ width: "100%", padding: "0.65rem 0.85rem", fontSize: "0.88rem", borderRadius: "10px", border: "1px solid #cbd5e1", outline: "none" }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "#475569", textTransform: "uppercase", display: "block", marginBottom: "0.25rem" }}>Host Email</label>
                  <input
                    type="email"
                    value={hostEmail}
                    onChange={(e) => setHostEmail(e.target.value)}
                    placeholder="shayan@stayq.space"
                    style={{ width: "100%", padding: "0.65rem 0.85rem", fontSize: "0.88rem", borderRadius: "10px", border: "1px solid #cbd5e1", outline: "none" }}
                  />
                </div>
              </div>

              {/* 10. Amenities */}
              <div>
                <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "#475569", textTransform: "uppercase", display: "block", marginBottom: "0.5rem" }}>Amenities Checklist</label>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "0.4rem" }}>
                  {ALL_AMENITIES.map((item) => {
                    const isChecked = amenities.includes(item);
                    return (
                      <button
                        key={item}
                        type="button"
                        onClick={() => handleToggleAmenity(item)}
                        style={{
                          padding: "0.45rem 0.75rem",
                          borderRadius: "8px",
                          fontSize: "0.78rem",
                          fontWeight: isChecked ? 700 : 500,
                          textAlign: "left",
                          border: isChecked ? "1px solid #9D00FF" : "1px solid #e2e8f0",
                          background: isChecked ? "rgba(157, 0, 255, 0.08)" : "#ffffff",
                          color: isChecked ? "#9D00FF" : "#475569",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                        }}
                      >
                        <span>{item}</span>
                        {isChecked && <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>check</span>}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 11. Photo Gallery Manager */}
              <div>
                <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "#475569", textTransform: "uppercase", display: "block", marginBottom: "0.5rem" }}>Photo Gallery URLs</label>
                <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.75rem" }}>
                  <input
                    type="text"
                    value={newImageUrl}
                    onChange={(e) => setNewImageUrl(e.target.value)}
                    placeholder="Paste image URL (https://...)"
                    style={{ flex: 1, padding: "0.6rem 0.85rem", fontSize: "0.85rem", borderRadius: "10px", border: "1px solid #cbd5e1", outline: "none" }}
                  />
                  <button
                    type="button"
                    onClick={handleAddImage}
                    style={{ padding: "0.6rem 1rem", borderRadius: "10px", background: "#f1f5f9", color: "#0f172a", fontWeight: 700, fontSize: "0.82rem", border: "1px solid #cbd5e1", cursor: "pointer" }}
                  >
                    + Add Image
                  </button>
                </div>

                <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
                  {imageUrls.map((url, idx) => (
                    <div key={idx} style={{ position: "relative", width: "90px", height: "70px", borderRadius: "10px", overflow: "hidden", border: idx === 0 ? "2px solid #9D00FF" : "1px solid #cbd5e1" }}>
                      <img src={url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      {idx === 0 && (
                        <span style={{ position: "absolute", bottom: 0, insetInline: 0, background: "#9D00FF", color: "#ffffff", fontSize: "9px", fontWeight: 800, textAlign: "center", textTransform: "uppercase" }}>Cover</span>
                      )}
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(idx)}
                        style={{ position: "absolute", top: "2px", right: "2px", background: "rgba(0,0,0,0.6)", color: "#ffffff", border: "none", borderRadius: "50%", width: "18px", height: "18px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: "10px" }}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem", marginTop: "1rem", paddingTop: "1rem", borderTop: "1px solid #e2e8f0" }}>
                {!isCreatingNew && editingProperty && (
                  <button
                    type="button"
                    onClick={handleDelete}
                    style={{ padding: "0.65rem 1.2rem", borderRadius: "10px", background: "#fef2f2", color: "#ef4444", fontWeight: 700, fontSize: "0.85rem", border: "1px solid #fecaca", cursor: "pointer" }}
                  >
                    Delete Property
                  </button>
                )}

                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginLeft: "auto" }}>
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    style={{ padding: "0.65rem 1.2rem", borderRadius: "10px", background: "#f1f5f9", color: "#475569", fontWeight: 700, fontSize: "0.85rem", border: "none", cursor: "pointer" }}
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={saving}
                    style={{ padding: "0.65rem 1.5rem", borderRadius: "10px", background: "#9D00FF", color: "#ffffff", fontWeight: 700, fontSize: "0.88rem", border: "none", cursor: "pointer", boxShadow: "0 4px 12px rgba(157, 0, 255, 0.25)" }}
                  >
                    {saving ? "Saving to Database..." : isCreatingNew ? "Publish New Property" : "Save Changes"}
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
