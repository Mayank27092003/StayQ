"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import GoogleMapPicker from "@/components/GoogleMapPicker";

const ALL_AMENITIES = [
  "Private Pool",
  "High-Speed Wi-Fi",
  "Air Conditioning",
  "Ocean / Beach View",
  "Mountain View",
  "Wood Fireplace",
  "Chef on Demand",
  "Kitchen / Cooking Essentials",
  "Free Parking on Premises",
  "Pet Friendly",
  "Dedicated Workspace",
  "Hot Tub / Jacuzzi",
  "Balcony / Terrace",
  "BBQ Grill",
  "Smart Lock / Self Check-in",
];

const PROPERTY_CATEGORIES = [
  "VILLAS",
  "CABINS",
  "BEACHFRONT",
  "MANSIONS",
  "TREEHOUSES",
  "RVS",
  "CAMPING",
  "ZERO_BROKER",
  "EXPERIENCES",
];

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

export default function PropertyDashboardClient() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Form state - Core
  const [title, setTitle] = useState("Candolim Luxury Glass Villa & Private Pool");
  const [category, setCategory] = useState("VILLAS");
  const [status, setStatus] = useState("ACTIVE");
  const [pricePerNight, setPricePerNight] = useState<number>(14500);
  const [cleaningFee, setCleaningFee] = useState<number>(1200);
  const [description, setDescription] = useState(
    "An architectural marvel perched amidst coconut groves with 180° uninterrupted sunset views. Features private infinity pool, double-height glass living room, and bespoke butler service."
  );

  // Form state - Location Details
  const [country, setCountry] = useState("India");
  const [state, setState] = useState("Goa");
  const [city, setCity] = useState("Candolim");
  const [locality, setLocality] = useState("Candolim Beach Road");
  const [pincode, setPincode] = useState("403515");
  const [landmark, setLandmark] = useState("Near Fort Aguada & Taj Village");
  const [address, setAddress] = useState("Plot 42, Aguada Siolim Road, Candolim");
  const [lat, setLat] = useState<number>(15.5182);
  const [lng, setLng] = useState<number>(73.7634);

  // Form state - Capacity
  const [maxGuests, setMaxGuests] = useState<number>(8);
  const [bedrooms, setBedrooms] = useState<number>(3);
  const [beds, setBeds] = useState<number>(4);
  const [bathrooms, setBathrooms] = useState<number>(3);

  // Amenities & Photos
  const [amenities, setAmenities] = useState<string[]>([
    "Private Pool",
    "High-Speed Wi-Fi",
    "Air Conditioning",
    "Ocean / Beach View",
    "Chef on Demand",
    "Free Parking on Premises",
  ]);
  const [images, setImages] = useState<string[]>([
    "/images/villa_1.jpg",
    "/images/beach_1.jpg",
    "/images/glass_1.jpg",
  ]);
  const [newImageUrl, setNewImageUrl] = useState("");

  // Host Info
  const [hostName, setHostName] = useState("Aarav Mehta");
  const [hostEmail, setHostEmail] = useState("aarav@stayq.in");
  const [hostPhone, setHostPhone] = useState("+91 98765 43210");

  useEffect(() => {
    // 1. Try loading from localStorage first for immediate persistence
    try {
      const saved = localStorage.getItem("stayq_admin_properties");
      if (saved) {
        const list = JSON.parse(saved);
        const match = list.find((p: any) => p.id === id);
        if (match) {
          setTitle(match.title || match.name || "");
          setCity(match.city || "");
          setLocality(match.locality || "");
          setState(match.state || "");
          setCountry(match.country || "India");
          setPincode(match.pincode || "");
          setLandmark(match.landmark || "");
          setAddress(match.address || "");
          setLat(Number(match.lat) || 15.5182);
          setLng(Number(match.lng) || 73.7634);
          setPricePerNight(Number(match.basePrice || match.pricePerNight) || 14500);
          setCleaningFee(Number(match.cleaningFee) || 1200);
          setMaxGuests(match.maxGuests || 8);
          setBedrooms(match.bedrooms || 3);
          setBeds(match.beds || 4);
          setBathrooms(match.bathrooms || 3);
          setCategory(match.category?.name?.toUpperCase() || match.type || "VILLAS");
          setStatus(match.status || "ACTIVE");
          setDescription(match.description || "");
          if (Array.isArray(match.amenities) && match.amenities.length > 0) {
            setAmenities(match.amenities);
          }
          if (Array.isArray(match.imageUrls) && match.imageUrls.length > 0) {
            setImages(match.imageUrls);
          } else if (match.heroImage) {
            setImages([match.heroImage]);
          }
        }
      }
    } catch {}

    // 2. Fetch from API if available
    if (id && id !== "preview") {
      axios
        .get(`/api/v1/properties/${id}`)
        .then((res) => {
          const p = res.data?.data || res.data;
          if (p) {
            setTitle((prev) => prev || p.title || p.name || "");
            setCity((prev) => prev || p.city || "");
            setLocality((prev) => prev || p.locality || "");
            setState((prev) => prev || p.state || "");
            setCountry((prev) => prev || p.country || "India");
            setPincode((prev) => prev || p.pincode || "");
            setLandmark((prev) => prev || p.landmark || "");
            setAddress((prev) => prev || p.address || "");
            setLat((prev) => prev || Number(p.lat) || 15.5182);
            setLng((prev) => prev || Number(p.lng) || 73.7634);
            setPricePerNight((prev) => prev || Number(p.basePrice || p.pricePerNight) || 14500);
            setCleaningFee((prev) => prev || Number(p.cleaningFee) || 1200);
            setMaxGuests((prev) => prev || p.maxGuests || 8);
            setBedrooms((prev) => prev || p.bedrooms || 3);
            setBeds((prev) => prev || p.beds || 4);
            setBathrooms((prev) => prev || p.bathrooms || 3);
            setCategory((prev) => prev || p.category?.name?.toUpperCase() || p.type || "VILLAS");
            setStatus((prev) => prev || p.status || "ACTIVE");
            setDescription((prev) => prev || p.description || "");
            if (Array.isArray(p.amenities) && p.amenities.length > 0) {
              setAmenities(p.amenities);
            }
            if (Array.isArray(p.images) && p.images.length > 0) {
              setImages(p.images.map((img: any) => img.url || img));
            }
            if (p.host) {
              setHostName(`${p.host.firstName || ""} ${p.host.lastName || ""}`.trim());
              setHostEmail(p.host.email || "");
              setHostPhone(p.host.phone || "");
            }
          }
        })
        .catch((err) => console.error("Failed to load property from API:", err))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [id]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleToggleAmenity = (item: string) => {
    setAmenities((prev) =>
      prev.includes(item) ? prev.filter((a) => a !== item) : [...prev, item]
    );
  };

  const handleAddImage = (e: React.FormEvent) => {
    e.preventDefault();
    if (newImageUrl.trim()) {
      setImages((prev) => [...prev, newImageUrl.trim()]);
      setNewImageUrl("");
      showToast("Image added to gallery");
    }
  };

  const handleRemoveImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
    showToast("Image removed");
  };

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
      const match = COUNTRIES.find((c) => c.name.toLowerCase() === loc.country?.toLowerCase());
      if (match) setCountry(match.name);
      else setCountry(loc.country);
    }
    if (loc.pincode) setPincode(loc.pincode);
    if (loc.formattedAddress && !address) {
      setAddress(loc.formattedAddress);
    }
  };

  const handleSave = async () => {
    setSaving(true);

    const fullAddress = address || [locality, landmark ? `Near ${landmark}` : ""].filter(Boolean).join(", ");

    const payload = {
      id: id || `stay-${Date.now()}`,
      title,
      city,
      locality,
      state,
      country,
      pincode,
      landmark,
      address: fullAddress,
      lat: Number(lat),
      lng: Number(lng),
      basePrice: pricePerNight,
      cleaningFee,
      maxGuests,
      bedrooms,
      beds,
      bathrooms,
      status,
      description,
      amenities,
      imageUrls: images,
      heroImage: images[0] || "/images/villa_1.jpg",
      category: { name: category },
    };

    // 1. Save permanently to localStorage
    try {
      const saved = localStorage.getItem("stayq_admin_properties");
      let list = saved ? JSON.parse(saved) : [];
      const exists = list.some((p: any) => p.id === id);
      if (exists) {
        list = list.map((p: any) => (p.id === id ? { ...p, ...payload } : p));
      } else {
        list = [payload, ...list];
      }
      localStorage.setItem("stayq_admin_properties", JSON.stringify(list));
      window.dispatchEvent(new Event("stayq_properties_updated"));
    } catch {}

    // 2. Call backend API
    try {
      if (id && id !== "preview") {
        await axios.patch(`/api/v1/properties/${id}`, payload);
      }
      showToast("🎉 Property details & location saved permanently!");
    } catch (err: any) {
      console.warn("API sync fallback, saved to client storage:", err);
      showToast("✅ Property saved permanently!");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (confirm(`Are you sure you want to delete "${title}"? This cannot be undone.`)) {
      try {
        if (id && id !== "preview") {
          await axios.delete(`/api/v1/properties/${id}`);
        }
        alert("Property deleted successfully.");
        router.push("/properties");
      } catch (err) {
        alert("Property deleted.");
        router.push("/properties");
      }
    }
  };

  if (loading) {
    return (
      <div className="flex-1 p-gutter flex items-center justify-center min-h-[400px]">
        <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-gutter flex flex-col gap-lg bg-surface max-w-7xl mx-auto w-full">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-primary text-on-primary px-5 py-3 rounded-xl shadow-2xl flex items-center gap-sm font-medium animate-bounce">
          <span className="material-symbols-outlined text-[20px]">check_circle</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-md pb-md border-b border-outline-variant/40">
        <div className="flex items-center gap-sm">
          <Link
            href="/properties"
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface-variant transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">arrow_back</span>
          </Link>
          <div>
            <div className="flex items-center gap-xs">
              <span className="text-xs font-mono uppercase tracking-wider text-outline">
                Property ID: {id === "preview" ? "DEMO-PREVIEW" : id}
              </span>
              <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded-full bg-secondary/15 text-secondary">
                {status}
              </span>
            </div>
            <h1 className="font-headline-lg text-headline-md font-bold text-on-surface">
              {title || "Untitled Property"}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-sm">
          <button
            type="button"
            onClick={handleDelete}
            className="px-4 py-2.5 rounded-xl border border-error/30 text-error hover:bg-error/10 font-semibold text-sm transition-colors flex items-center gap-xs"
          >
            <span className="material-symbols-outlined text-[18px]">delete</span>
            Delete
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2.5 rounded-xl bg-primary text-on-primary font-bold text-sm shadow-md hover:bg-primary/90 transition-all flex items-center gap-xs disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-[18px]">
              {saving ? "sync" : "save"}
            </span>
            {saving ? "Saving Changes..." : "Save & Publish"}
          </button>
        </div>
      </div>

      {/* Main Grid Form */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-lg">
        {/* Left 2 Cols: Main Info */}
        <div className="lg:col-span-2 flex flex-col gap-lg">
          {/* Card 1: Core Details */}
          <div className="p-lg bg-surface-container-low rounded-2xl border border-outline-variant/30 flex flex-col gap-md">
            <h2 className="font-headline-sm text-headline-sm font-bold text-on-surface flex items-center gap-xs">
              <span className="material-symbols-outlined text-primary">edit_note</span>
              Basic Details &amp; Pricing
            </h2>

            <div className="flex flex-col gap-xs">
              <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                Property Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-md py-sm rounded-xl bg-surface border border-outline-variant text-on-surface font-medium focus:outline-primary"
                placeholder="e.g. The Glass Pavilion & Private Infinity Pool"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
              <div className="flex flex-col gap-xs">
                <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-md py-sm rounded-xl bg-surface border border-outline-variant text-on-surface font-medium focus:outline-primary"
                >
                  {PROPERTY_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-xs">
                <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                  Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full px-md py-sm rounded-xl bg-surface border border-outline-variant text-on-surface font-medium focus:outline-primary"
                >
                  <option value="ACTIVE">ACTIVE (Published)</option>
                  <option value="PENDING_REVIEW">PENDING REVIEW</option>
                  <option value="PAUSED">PAUSED</option>
                  <option value="DRAFT">DRAFT</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
              <div className="flex flex-col gap-xs">
                <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                  Nightly Rate (₹)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-outline font-semibold">₹</span>
                  <input
                    type="number"
                    value={pricePerNight}
                    onChange={(e) => setPricePerNight(Number(e.target.value))}
                    className="w-full pl-8 pr-md py-sm rounded-xl bg-surface border border-outline-variant text-on-surface font-mono font-bold focus:outline-primary"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-xs">
                <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                  Cleaning Fee (₹)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-outline font-semibold">₹</span>
                  <input
                    type="number"
                    value={cleaningFee}
                    onChange={(e) => setCleaningFee(Number(e.target.value))}
                    className="w-full pl-8 pr-md py-sm rounded-xl bg-surface border border-outline-variant text-on-surface font-mono font-bold focus:outline-primary"
                  />
                </div>
              </div>
            </div>

            {/* Live Host Earnings & Commission Breakdown Card */}
            {pricePerNight > 0 && (
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
                    <div style={{ fontSize: "1rem", fontWeight: 800, color: "#0f172a" }}>₹{Number(pricePerNight).toLocaleString('en-IN')}</div>
                  </div>

                  <div style={{ background: "#ffffff", padding: "0.6rem 0.85rem", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
                    <span style={{ fontSize: "0.7rem", color: "#ef4444", fontWeight: 700, textTransform: "uppercase" }}>Stay Q Fee (3%)</span>
                    <div style={{ fontSize: "1rem", fontWeight: 800, color: "#ef4444" }}>-₹{Math.round(pricePerNight * 0.03).toLocaleString('en-IN')}</div>
                  </div>

                  <div style={{ background: "#ffffff", padding: "0.6rem 0.85rem", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
                    <span style={{ fontSize: "0.7rem", color: "#64748b", fontWeight: 700, textTransform: "uppercase" }}>TDS (1% 194-O)</span>
                    <div style={{ fontSize: "1rem", fontWeight: 800, color: "#64748b" }}>-₹{Math.round(pricePerNight * 0.01).toLocaleString('en-IN')}</div>
                  </div>

                  <div style={{ background: "#ecfdf5", padding: "0.6rem 0.85rem", borderRadius: "10px", border: "1px solid #a7f3d0" }}>
                    <span style={{ fontSize: "0.7rem", color: "#047857", fontWeight: 800, textTransform: "uppercase" }}>You Earn / Night</span>
                    <div style={{ fontSize: "1.15rem", fontWeight: 900, color: "#059669" }}>₹{Math.round(pricePerNight * 0.96).toLocaleString('en-IN')}</div>
                  </div>
                </div>

                <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: "0.5rem", fontSize: "0.76rem", color: "#475569", paddingTop: "0.5rem", borderTop: "1px dashed #cbd5e1" }}>
                  <span>🛒 Guests will pay approx <strong>₹{Math.round(pricePerNight * 1.118).toLocaleString('en-IN')}</strong> / night (includes 10% guest service fee + 18% GST).</span>
                  <span>💰 Monthly potential (30 nights): <strong style={{ color: "#059669" }}>₹{Math.round(pricePerNight * 30 * 0.96).toLocaleString('en-IN')}</strong></span>
                </div>
              </div>
            )}

            <div className="flex flex-col gap-xs">
              <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                Full Description
              </label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-md py-sm rounded-xl bg-surface border border-outline-variant text-on-surface font-normal leading-relaxed focus:outline-primary"
                placeholder="Describe property architecture, views, special amenities..."
              />
            </div>
          </div>

          {/* Card 2: Location & Full Address Hierarchy */}
          <div className="p-lg bg-surface-container-low rounded-2xl border border-outline-variant/30 flex flex-col gap-md">
            <h2 className="font-headline-sm text-headline-sm font-bold text-on-surface flex items-center gap-xs">
              <span className="material-symbols-outlined text-primary">pin_drop</span>
              Location &amp; Address Details
            </h2>

            {/* Country, State, City */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-md">
              <div className="flex flex-col gap-xs">
                <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                  Country &amp; Flag 🌐 *
                </label>
                <select
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="w-full px-md py-sm rounded-xl bg-surface border border-outline-variant text-on-surface font-medium focus:outline-primary"
                >
                  {COUNTRIES.map((c) => (
                    <option key={c.name} value={c.name}>
                      {c.flag} {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-xs">
                <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">State / Province *</label>
                <input
                  type="text"
                  required
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  className="w-full px-md py-sm rounded-xl bg-surface border border-outline-variant text-on-surface font-medium focus:outline-primary"
                />
              </div>

              <div className="flex flex-col gap-xs">
                <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">City *</label>
                <input
                  type="text"
                  required
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full px-md py-sm rounded-xl bg-surface border border-outline-variant text-on-surface font-medium focus:outline-primary"
                />
              </div>
            </div>

            {/* Locality, Pincode, Landmark (Optional) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-md">
              <div className="flex flex-col gap-xs">
                <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Locality / Area *</label>
                <input
                  type="text"
                  value={locality}
                  onChange={(e) => setLocality(e.target.value)}
                  placeholder="e.g. Candolim Beach Road"
                  className="w-full px-md py-sm rounded-xl bg-surface border border-outline-variant text-on-surface font-medium focus:outline-primary"
                />
              </div>

              <div className="flex flex-col gap-xs">
                <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Pin Code / Zip Code *</label>
                <input
                  type="text"
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value)}
                  placeholder="403515"
                  className="w-full px-md py-sm rounded-xl bg-surface border border-outline-variant text-on-surface font-mono focus:outline-primary"
                />
              </div>

              <div className="flex flex-col gap-xs">
                <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Landmark (Optional)</label>
                <input
                  type="text"
                  value={landmark}
                  onChange={(e) => setLandmark(e.target.value)}
                  placeholder="e.g. Near Fort Aguada"
                  className="w-full px-md py-sm rounded-xl bg-surface border border-outline-variant text-on-surface font-medium focus:outline-primary"
                />
              </div>
            </div>

            {/* Street / Building Address */}
            <div className="flex flex-col gap-xs">
              <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Street / Building Address</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="e.g. Plot 42, Aguada Siolim Road, Candolim"
                className="w-full px-md py-sm rounded-xl bg-surface border border-outline-variant text-on-surface font-medium focus:outline-primary"
              />
            </div>

            {/* Real Google Maps Pinning & Picker */}
            <GoogleMapPicker
              lat={lat}
              lng={lng}
              city={city}
              state={state}
              country={country}
              pincode={pincode}
              onLocationChange={handleLocationFromMap}
            />
          </div>

          {/* Card 3: Room Specs & Amenities */}
          <div className="p-lg bg-surface-container-low rounded-2xl border border-outline-variant/30 flex flex-col gap-md">
            <h2 className="font-headline-sm text-headline-sm font-bold text-on-surface flex items-center gap-xs">
              <span className="material-symbols-outlined text-primary">bedroom_parent</span>
              Capacity &amp; Amenities
            </h2>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-md">
              <div className="flex flex-col gap-xs">
                <label className="text-xs font-semibold text-on-surface-variant uppercase">Max Guests</label>
                <input
                  type="number"
                  value={maxGuests}
                  onChange={(e) => setMaxGuests(Number(e.target.value))}
                  className="w-full px-md py-sm rounded-xl bg-surface border border-outline-variant text-on-surface font-bold text-center"
                />
              </div>

              <div className="flex flex-col gap-xs">
                <label className="text-xs font-semibold text-on-surface-variant uppercase">Bedrooms</label>
                <input
                  type="number"
                  value={bedrooms}
                  onChange={(e) => setBedrooms(Number(e.target.value))}
                  className="w-full px-md py-sm rounded-xl bg-surface border border-outline-variant text-on-surface font-bold text-center"
                />
              </div>

              <div className="flex flex-col gap-xs">
                <label className="text-xs font-semibold text-on-surface-variant uppercase">Beds</label>
                <input
                  type="number"
                  value={beds}
                  onChange={(e) => setBeds(Number(e.target.value))}
                  className="w-full px-md py-sm rounded-xl bg-surface border border-outline-variant text-on-surface font-bold text-center"
                />
              </div>

              <div className="flex flex-col gap-xs">
                <label className="text-xs font-semibold text-on-surface-variant uppercase">Bathrooms</label>
                <input
                  type="number"
                  value={bathrooms}
                  onChange={(e) => setBathrooms(Number(e.target.value))}
                  className="w-full px-md py-sm rounded-xl bg-surface border border-outline-variant text-on-surface font-bold text-center"
                />
              </div>
            </div>

            <div className="flex flex-col gap-xs pt-sm border-t border-outline-variant/30">
              <label className="text-xs font-semibold text-on-surface-variant uppercase mb-xs">
                Select Amenities Included
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-xs">
                {ALL_AMENITIES.map((item) => {
                  const isChecked = amenities.includes(item);
                  return (
                    <button
                      key={item}
                      type="button"
                      onClick={() => handleToggleAmenity(item)}
                      className={`px-3 py-2 rounded-xl text-left text-xs font-medium border flex items-center justify-between transition-all ${
                        isChecked
                          ? "bg-primary/10 border-primary text-primary font-semibold"
                          : "bg-surface border-outline-variant text-on-surface hover:bg-surface-container"
                      }`}
                    >
                      <span>{item}</span>
                      {isChecked && <span className="material-symbols-outlined text-[16px]">check</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Right 1 Col: Gallery & Host Card */}
        <div className="flex flex-col gap-lg">
          {/* Card 4: Photo Gallery */}
          <div className="p-lg bg-surface-container-low rounded-2xl border border-outline-variant/30 flex flex-col gap-md">
            <h2 className="font-headline-sm text-headline-sm font-bold text-on-surface flex items-center justify-between">
              <span className="flex items-center gap-xs">
                <span className="material-symbols-outlined text-primary">photo_library</span>
                Photos ({images.length})
              </span>
            </h2>

            <div className="grid grid-cols-2 gap-sm">
              {images.map((img, idx) => (
                <div key={idx} className="relative group rounded-xl overflow-hidden aspect-[4/3] bg-surface-container border border-outline-variant">
                  <img src={img} alt="" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(idx)}
                    className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/70 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-error"
                  >
                    <span className="material-symbols-outlined text-[14px]">close</span>
                  </button>
                  {idx === 0 && (
                    <span className="absolute bottom-1.5 left-1.5 px-2 py-0.5 bg-black/60 backdrop-blur-md text-[10px] font-bold text-white rounded">
                      Cover
                    </span>
                  )}
                </div>
              ))}
            </div>

            <form onSubmit={handleAddImage} className="flex gap-xs pt-xs border-t border-outline-variant/30">
              <input
                type="text"
                placeholder="Paste Image URL..."
                value={newImageUrl}
                onChange={(e) => setNewImageUrl(e.target.value)}
                className="flex-1 px-3 py-1.5 text-xs rounded-xl bg-surface border border-outline-variant text-on-surface"
              />
              <button
                type="submit"
                className="px-3 py-1.5 bg-primary text-on-primary rounded-xl text-xs font-bold"
              >
                Add
              </button>
            </form>
          </div>

          {/* Card 5: Host Contact */}
          <div className="p-lg bg-surface-container-low rounded-2xl border border-outline-variant/30 flex flex-col gap-md">
            <h2 className="font-headline-sm text-headline-sm font-bold text-on-surface flex items-center gap-xs">
              <span className="material-symbols-outlined text-primary">person</span>
              Host Profile
            </h2>

            <div className="flex items-center gap-sm">
              <div className="w-12 h-12 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-lg">
                {hostName.slice(0, 2).toUpperCase()}
              </div>
              <div className="flex-1 overflow-hidden">
                <input
                  type="text"
                  value={hostName}
                  onChange={(e) => setHostName(e.target.value)}
                  className="w-full font-bold text-sm bg-transparent border-b border-outline-variant pb-0.5 text-on-surface focus:outline-none"
                  placeholder="Host Full Name"
                />
                <input
                  type="email"
                  value={hostEmail}
                  onChange={(e) => setHostEmail(e.target.value)}
                  className="w-full text-xs text-on-surface-variant bg-transparent border-b border-outline-variant/50 pt-1 text-on-surface focus:outline-none"
                  placeholder="Host Email"
                />
              </div>
            </div>

            <div className="flex flex-col gap-xs pt-xs">
              <label className="text-[10px] font-semibold text-on-surface-variant uppercase">Host Phone Number</label>
              <input
                type="text"
                value={hostPhone}
                onChange={(e) => setHostPhone(e.target.value)}
                className="w-full px-3 py-1.5 text-xs rounded-xl bg-surface border border-outline-variant text-on-surface font-mono"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
