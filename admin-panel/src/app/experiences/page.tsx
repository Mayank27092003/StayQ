"use client";

import { useEffect, useState } from "react";
import axios from "axios";

export interface ExperienceUnit {
  id: string;
  title: string;
  subtitle?: string;
  description?: string;
  city?: string;
  state?: string;
  address?: string;
  lat?: number;
  lng?: number;
  basePrice?: number;
  weekendPrice?: number;
  status: string;
  type?: string;
  category?: { name: string };
  expCategory?: string;
  duration?: string;
  maxGuests?: number;
  minAge?: number;
  fitnessLevel?: string;
  inclusions?: string[];
  exclusions?: string[];
  equipmentProvided?: string[];
  whatToBring?: string[];
  meetingPoint?: string;
  amenities?: string[];
  beds?: number;
  hostName?: string;
  hostPhone?: string;
  hostBio?: string;
  imageUrls?: string[];
  videoUrl?: string;
  cancellationPolicy?: string;
}

const EXP_AMENITIES_CATEGORIES = {
  "Gear & Safety": ["Certified Lead Instructor", "Life Jackets & Bouyancy Aids", "Professional Safety Helmets", "Emergency First Aid & CPR Kit", "Dry Bags for Phones/Wallets", "GoPro 4K Action Camera Footage"],
  "Refreshments & Comfort": ["Hydration & Energy Drinks", "Traditional Local Snacks / Meal", "Fresh Coconut Water", "Bottled Spring Water", "Sunscreen & Bug Spray", "Outdoor Restroom Access"],
  "Tours & Transport": ["Private Hotel Pickup & Drop", "AC Transport to Trailhead", "Wildlife Sanctuary Entry Permits", "Local Village Interaction", "Souvenir Travel Badge", "Digital Photo Album via Drive"]
};

export default function ExperiencesManagementPage() {
  const [experiences, setExperiences] = useState<ExperienceUnit[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"general" | "schedule" | "pricing" | "gear" | "amenities" | "media" | "guidelines">("general");
  const [editingExp, setEditingExp] = useState<ExperienceUnit | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Form State
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [description, setDescription] = useState("");
  const [city, setCity] = useState("Goa");
  const [meetingPoint, setMeetingPoint] = useState("Sal Backwaters Jetty, Mobor Beach");
  const [expCategory, setExpCategory] = useState("Water Sports & Kayaking");
  const [duration, setDuration] = useState("3 Hours");
  const [fitnessLevel, setFitnessLevel] = useState("Moderate");
  const [minAge, setMinAge] = useState(10);
  const [maxGuests, setMaxGuests] = useState(8);
  const [basePrice, setBasePrice] = useState(2200);
  const [weekendPrice, setWeekendPrice] = useState(2600);
  const [inclusionsText, setInclusionsText] = useState("Kayaks, paddles, life jackets, GoPro photos, fresh coconuts");
  const [whatToBringText, setWhatToBringText] = useState("Swimwear, extra t-shirt, waterproof sandals, sunglasses with strap");
  const [hostName, setHostName] = useState("Captain Rohan D'Souza");
  const [hostBio, setHostBio] = useState("Certified ISA Ocean Kayaker & River Guide with 12+ years experience.");
  const [hostPhone, setHostPhone] = useState("+91 98221 12345");
  const [status, setStatus] = useState("ACTIVE");
  const [images, setImages] = useState<string[]>([""]);
  const [videoUrl, setVideoUrl] = useState("");
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([
    "Certified Lead Instructor", "Life Jackets & Bouyancy Aids", "GoPro 4K Action Camera Footage", "Fresh Coconut Water"
  ]);

  const fetchExperiences = async () => {
    try {
      setLoading(true);
      const res = await axios.get("/api/v1/properties");
      if (Array.isArray(res.data)) {
        const expList = res.data.filter(
          (p: any) =>
            p.category?.name === "EXPERIENCE" ||
            p.category === "EXPERIENCE" ||
            p.type === "EXPERIENCE" ||
            p.title?.toLowerCase().includes("trek") ||
            p.title?.toLowerCase().includes("kayak") ||
            p.title?.toLowerCase().includes("walk") ||
            p.title?.toLowerCase().includes("tour") ||
            p.title?.toLowerCase().includes("experience")
        );
        setExperiences(expList);
      }
    } catch {
      // Fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExperiences();
  }, []);

  const openCreateModal = () => {
    setIsCreatingNew(true);
    setEditingExp(null);
    setActiveTab("general");
    setTitle("");
    setSubtitle("Guided Mangrove Kayaking & Bioluminescence Starlight Trail");
    setDescription("");
    setCity("Goa");
    setMeetingPoint("Sal Backwaters Jetty, Mobor Beach, South Goa");
    setExpCategory("Water Sports & Kayaking");
    setDuration("3 Hours");
    setFitnessLevel("Moderate");
    setMinAge(10);
    setMaxGuests(8);
    setBasePrice(2200);
    setWeekendPrice(2600);
    setInclusionsText("Kayaks, paddles, life jackets, GoPro photos, fresh coconuts");
    setWhatToBringText("Swimwear, extra t-shirt, waterproof sandals, sunglasses with strap");
    setHostName("Captain Rohan D'Souza");
    setHostBio("Certified ISA Ocean Kayaker & River Guide with 12+ years experience.");
    setHostPhone("+91 98221 12345");
    setStatus("ACTIVE");
    setImages([
      "https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80"
    ]);
    setVideoUrl("");
    setSelectedAmenities([
      "Certified Lead Instructor", "Life Jackets & Bouyancy Aids", "GoPro 4K Action Camera Footage", "Fresh Coconut Water"
    ]);
    setSaveSuccess(false);
    setIsModalOpen(true);
  };

  const openEditModal = (exp: ExperienceUnit) => {
    setIsCreatingNew(false);
    setEditingExp(exp);
    setActiveTab("general");
    setTitle(exp.title || "");
    setSubtitle(exp.subtitle || "Curated Adventure & Tour");
    setDescription(exp.description || "");
    setCity(exp.city || "Goa");
    setMeetingPoint(exp.meetingPoint || exp.address || "Meeting Point Hub");
    setExpCategory(exp.expCategory || "Water Sports & Kayaking");
    setDuration(exp.duration || "3 Hours");
    setFitnessLevel(exp.fitnessLevel || "Moderate");
    setMinAge(exp.minAge || 10);
    setMaxGuests(exp.maxGuests || 8);
    setBasePrice(Number(exp.basePrice) || 2200);
    setWeekendPrice(Number(exp.weekendPrice) || 2600);
    setHostName(exp.hostName || "Activity Guide");
    setHostPhone(exp.hostPhone || "+91 98221 12345");
    setStatus(exp.status || "ACTIVE");
    setImages(exp.imageUrls && exp.imageUrls.length > 0 ? exp.imageUrls : ["https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=1200&q=80"]);
    setVideoUrl(exp.videoUrl || "");
    setSelectedAmenities(exp.amenities && exp.amenities.length > 0 ? exp.amenities : ["Certified Lead Instructor", "Life Jackets & Bouyancy Aids"]);
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
      description: `${description} | Category: ${expCategory}, Duration: ${duration}, Fitness: ${fitnessLevel}, Min Age: ${minAge}, Inclusions: ${inclusionsText}, Meeting Point: ${meetingPoint}`,
      type: "HOTEL",
      category: "EXPERIENCE",
      city,
      address: meetingPoint,
      basePrice: Number(basePrice),
      pricePerNight: Number(basePrice),
      weekendPrice: Number(weekendPrice),
      maxGuests: Number(maxGuests),
      bedrooms: 1,
      beds: 1,
      bathrooms: 1,
      amenities: selectedAmenities,
      images: validImages.length > 0 ? validImages : ["https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=1200&q=80"],
      videoUrls: videoUrl ? [videoUrl] : [],
      status,
    };

    const axiosConfig = {
      headers: { "x-admin-key": "stayq-admin-secret-2026" },
    };

    try {
      if (isCreatingNew) {
        await axios.post("/api/v1/properties", payload, axiosConfig);
      } else if (editingExp) {
        await axios.patch(`/api/v1/properties/${editingExp.id}`, payload, axiosConfig);
      }
      setSaveSuccess(true);
      await fetchExperiences();
      setTimeout(() => {
        setIsModalOpen(false);
      }, 700);
    } catch (err) {
      console.warn("Experience save note:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to remove experience "${name}"?`)) return;
    try {
      await axios.delete(`/api/v1/properties/${id}`, {
        headers: { "x-admin-key": "stayq-admin-secret-2026" },
      });
      await fetchExperiences();
    } catch (err) {
      console.warn("Delete note:", err);
    }
  };

  const filtered = experiences.filter(
    (e) =>
      e.title?.toLowerCase().includes(search.toLowerCase()) ||
      e.city?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem", paddingBottom: "4rem" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem", background: "#ffffff", padding: "1.75rem", borderRadius: "20px", border: "1px solid #e2e8f0", boxShadow: "0 2px 6px rgba(0,0,0,0.03)" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "#0284c7", fontWeight: 900, fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.35rem" }}>
            <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>explore</span>
            <span>Adventures &amp; Local Activities Hub</span>
          </div>
          <h1 style={{ fontSize: "1.75rem", fontWeight: 900, color: "#0f172a", margin: "0 0 0.35rem", letterSpacing: "-0.02em" }}>Curated Experiences Hub</h1>
          <p style={{ fontSize: "0.92rem", color: "#64748b", margin: 0, maxWidth: "700px" }}>
            Manage guided kayak trails, mountain summit treks, culinary walks, batch slot times, gear inclusions, and instructor certifications.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          style={{ display: "flex", alignItems: "center", gap: "0.6rem", padding: "0.85rem 1.75rem", background: "linear-gradient(135deg, #0284c7 0%, #0369a1 100%)", color: "#ffffff", fontWeight: 800, fontSize: "0.95rem", borderRadius: "16px", border: "none", cursor: "pointer", boxShadow: "0 4px 16px rgba(2,132,199,0.35)", transition: "all 0.2s ease" }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: "22px" }}>add_circle</span>
          <span>Add Experience</span>
        </button>
      </div>

      {/* Search & KPI */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: "1rem", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", background: "#ffffff", padding: "0.9rem 1.25rem", borderRadius: "16px", border: "1px solid #e2e8f0" }}>
          <span className="material-symbols-outlined" style={{ color: "#94a3b8", fontSize: "22px" }}>search</span>
          <input
            type="text"
            placeholder="Search experiences by title, outdoor activity, guide name, coastal destination..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ flex: 1, border: "none", outline: "none", fontSize: "0.95rem", color: "#0f172a", background: "transparent" }}
          />
        </div>
        <div style={{ background: "#ffffff", padding: "0.75rem 1.25rem", borderRadius: "16px", border: "1px solid #e2e8f0", display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <span style={{ fontSize: "0.82rem", color: "#64748b", fontWeight: 700 }}>Total Activities:</span>
          <strong style={{ fontSize: "1rem", color: "#0f172a", fontWeight: 900 }}>{experiences.length}</strong>
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div style={{ padding: "4rem", textAlign: "center", color: "#64748b", background: "#ffffff", borderRadius: "20px", border: "1px solid #e2e8f0" }}>Loading experiences...</div>
      ) : filtered.length === 0 ? (
        <div style={{ padding: "4rem", textAlign: "center", background: "#ffffff", borderRadius: "20px", border: "1px solid #e2e8f0" }}>
          <p style={{ color: "#64748b", fontWeight: 700, margin: 0, fontSize: "1.1rem" }}>No experiences found. Click &ldquo;Add Experience&rdquo; to launch a new activity!</p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(350px, 1fr))", gap: "1.5rem" }}>
          {filtered.map((exp) => (
            <div
              key={exp.id}
              style={{ background: "#ffffff", borderRadius: "24px", border: "1px solid #e2e8f0", overflow: "hidden", boxShadow: "0 2px 10px rgba(0,0,0,0.03)", display: "flex", flexDirection: "column" }}
            >
              <div style={{ position: "relative", height: "220px", background: "#f1f5f9" }}>
                <img
                  src={exp.imageUrls?.[0] || "/images/exp_1.jpg"}
                  alt={exp.title}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
                <div style={{ position: "absolute", top: "12px", right: "12px", background: "rgba(2, 132, 199, 0.95)", backdropFilter: "blur(8px)", color: "#ffffff", padding: "0.35rem 0.85rem", borderRadius: "999px", fontSize: "0.78rem", fontWeight: 800, display: "flex", alignItems: "center", gap: "4px" }}>
                  <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>schedule</span>
                  <span>{exp.duration || "3 Hours"}</span>
                </div>
                <div style={{ position: "absolute", bottom: "12px", left: "12px", background: "rgba(15, 23, 42, 0.85)", backdropFilter: "blur(6px)", color: "#ffffff", padding: "0.25rem 0.75rem", borderRadius: "8px", fontSize: "0.72rem", fontWeight: 800 }}>
                  {exp.city || "Goa"}
                </div>
              </div>

              <div style={{ padding: "1.5rem", flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between", gap: "1.25rem" }}>
                <div>
                  <h3 style={{ fontSize: "1.15rem", fontWeight: 900, color: "#0f172a", margin: "0 0 0.35rem", lineHeight: 1.3 }}>{exp.title}</h3>
                  <p style={{ fontSize: "0.85rem", color: "#64748b", display: "flex", alignItems: "center", gap: "0.3rem", margin: 0 }}>
                    <span className="material-symbols-outlined" style={{ fontSize: "16px", color: "#0284c7" }}>location_on</span>
                    <span>{exp.city || "Goa, India"}</span>
                  </p>
                </div>

                <div style={{ background: "#f8fafc", padding: "0.85rem 1rem", borderRadius: "14px", border: "1px solid #f1f5f9", fontSize: "0.82rem", color: "#475569", display: "flex", flexDirection: "column", gap: "0.45rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span>Batch Capacity:</span>
                    <strong style={{ color: "#0f172a" }}>Max {exp.maxGuests || 8} Explorers</strong>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span>Inclusions:</span>
                    <span style={{ color: "#0284c7", fontWeight: 800 }}>Gear · Instructor · GoPro 4K</span>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: "0.85rem", borderTop: "1px solid #f1f5f9" }}>
                  <div>
                    <span style={{ fontSize: "0.72rem", color: "#94a3b8", display: "block", textTransform: "uppercase", fontWeight: 700 }}>Price / Person</span>
                    <strong style={{ color: "#0284c7", fontWeight: 900, fontSize: "1.25rem" }}>
                      ₹{Number(exp.basePrice || 2200).toLocaleString("en-IN")}
                      <span style={{ fontSize: "0.78rem", color: "#64748b", fontWeight: 600 }}>/person</span>
                    </strong>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <button
                      type="button"
                      onClick={() => openEditModal(exp)}
                      style={{ padding: "0.6rem 1rem", borderRadius: "12px", border: "1px solid #e2e8f0", background: "#f8fafc", color: "#0284c7", fontWeight: 800, fontSize: "0.85rem", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.35rem" }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>edit</span>
                      <span>Edit</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(exp.id, exp.title)}
                      style={{ padding: "0.6rem", borderRadius: "12px", border: "none", background: "rgba(239, 68, 68, 0.1)", color: "#ef4444", cursor: "pointer" }}
                      title="Delete Experience"
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

      {/* ULTRA-EXPANDED MULTI-TAB EXPERIENCE MODAL */}
      {isModalOpen && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, width: "100vw", height: "100vh", background: "rgba(15, 23, 42, 0.82)", backdropFilter: "blur(10px)", zIndex: 99999, display: "flex", alignItems: "center", justifyContent: "center", padding: "1.5rem" }}>
          <div style={{ background: "#ffffff", borderRadius: "32px", maxWidth: "1080px", width: "95vw", maxHeight: "94vh", overflowY: "auto", padding: "2.5rem", boxShadow: "0 30px 60px -15px rgba(0,0,0,0.5)", border: "1px solid rgba(226, 232, 240, 0.8)", position: "relative" }}>
            
            {/* Modal Header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem", paddingBottom: "1.25rem", borderBottom: "1px solid #e2e8f0" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                <div style={{ width: "52px", height: "52px", borderRadius: "18px", background: "linear-gradient(135deg, #0284c7 0%, #0369a1 100%)", display: "flex", alignItems: "center", justifyContent: "center", color: "#ffffff", boxShadow: "0 6px 18px rgba(2,132,199,0.35)" }}>
                  <span className="material-symbols-outlined" style={{ fontSize: "30px" }}>explore</span>
                </div>
                <div>
                  <h2 style={{ fontSize: "1.5rem", fontWeight: 900, color: "#0f172a", margin: 0, letterSpacing: "-0.01em" }}>
                    {isCreatingNew ? "Add Curated Adventure / Experience" : `Edit Activity — "${title || 'Untitled'}"`}
                  </h2>
                  <p style={{ fontSize: "0.85rem", color: "#64748b", margin: "0.2rem 0 0", fontWeight: 600 }}>
                    {editingExp ? `Activity ID: ${editingExp.id}` : "Configure activity itinerary, equipment, meeting point, and certified guides"} · Live Sync
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
                { id: "general", label: "Activity & Category", icon: "badge" },
                { id: "schedule", label: "Duration & Meeting Point", icon: "schedule" },
                { id: "pricing", label: "Pricing & Group Slots", icon: "payments" },
                { id: "gear", label: "Gear & What To Bring", icon: "sports_kabaddi" },
                { id: "amenities", label: "Inclusions & Safety", icon: "verified" },
                { id: "media", label: "Activity Photos", icon: "photo_library" },
                { id: "guidelines", label: "Host Guide Bio", icon: "person" }
              ].map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id as any)}
                    style={{ display: "flex", alignItems: "center", gap: "0.45rem", padding: "0.65rem 1.1rem", borderRadius: "14px", border: "none", background: isActive ? "#0284c7" : "#f8fafc", color: isActive ? "#ffffff" : "#64748b", fontWeight: 800, fontSize: "0.85rem", cursor: "pointer", whiteSpace: "nowrap", transition: "all 0.15s ease", boxShadow: isActive ? "0 4px 12px rgba(2,132,199,0.25)" : "none" }}
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
                <span>Experience saved successfully to live database!</span>
              </div>
            )}

            <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
              
              {/* TAB 1: GENERAL */}
              {activeTab === "general" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "1.25rem" }}>
                    <div>
                      <label style={{ fontSize: "0.78rem", fontWeight: 800, color: "#334155", textTransform: "uppercase", display: "block", marginBottom: "0.4rem" }}>Experience Title *</label>
                      <input
                        type="text"
                        required
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="e.g. Sunset Mangrove Kayaking &amp; Bioluminescence Trail"
                        style={{ width: "100%", padding: "0.85rem 1.1rem", fontSize: "0.95rem", borderRadius: "14px", border: "1px solid #cbd5e1", outline: "none", fontWeight: 800, background: "#ffffff" }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: "0.78rem", fontWeight: 800, color: "#334155", textTransform: "uppercase", display: "block", marginBottom: "0.4rem" }}>Activity Category</label>
                      <select
                        value={expCategory}
                        onChange={(e) => setExpCategory(e.target.value)}
                        style={{ width: "100%", padding: "0.85rem 1.1rem", fontSize: "0.95rem", borderRadius: "14px", border: "1px solid #cbd5e1", outline: "none", fontWeight: 800, background: "#ffffff" }}
                      >
                        <option value="Water Sports & Kayaking">Water Sports &amp; Kayaking</option>
                        <option value="Hiking & Alpine Treks">Hiking &amp; Alpine Treks</option>
                        <option value="Culinary Trail & Cooking">Culinary Trail &amp; Local Feast</option>
                        <option value="Heritage Architecture Walk">Heritage Architecture Walk</option>
                        <option value="Wildlife Safari & Birding">Wildlife Safari &amp; Birding</option>
                        <option value="Yoga & Wellness Retreat">Yoga &amp; Wellness Retreat</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize: "0.78rem", fontWeight: 800, color: "#334155", textTransform: "uppercase", display: "block", marginBottom: "0.4rem" }}>Tagline</label>
                    <input
                      type="text"
                      value={subtitle}
                      onChange={(e) => setSubtitle(e.target.value)}
                      placeholder="e.g. Glide through calm backwaters under starry skies with certified ocean guides"
                      style={{ width: "100%", padding: "0.85rem 1.1rem", fontSize: "0.92rem", borderRadius: "14px", border: "1px solid #cbd5e1", outline: "none", background: "#ffffff" }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: "0.78rem", fontWeight: 800, color: "#334155", textTransform: "uppercase", display: "block", marginBottom: "0.4rem" }}>Detailed Activity Itinerary &amp; Overview</label>
                    <textarea
                      rows={4}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Detail the experience step-by-step: safety briefing, route highlights, mangrove tunnels, rest breaks, and GoPro photo spots..."
                      style={{ width: "100%", padding: "1rem", fontSize: "0.92rem", borderRadius: "14px", border: "1px solid #cbd5e1", outline: "none", background: "#ffffff" }}
                    />
                  </div>
                </div>
              )}

              {/* TAB 2: SCHEDULE */}
              {activeTab === "schedule" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1.25rem" }}>
                    <div>
                      <label style={{ fontSize: "0.78rem", fontWeight: 800, color: "#334155", textTransform: "uppercase", display: "block", marginBottom: "0.4rem" }}>City / Location *</label>
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
                      <label style={{ fontSize: "0.78rem", fontWeight: 800, color: "#334155", textTransform: "uppercase", display: "block", marginBottom: "0.4rem" }}>Duration</label>
                      <select
                        value={duration}
                        onChange={(e) => setDuration(e.target.value)}
                        style={{ width: "100%", padding: "0.85rem 1.1rem", fontSize: "0.92rem", borderRadius: "14px", border: "1px solid #cbd5e1", outline: "none", background: "#ffffff" }}
                      >
                        <option value="2 Hours">2 Hours</option>
                        <option value="3 Hours">3 Hours</option>
                        <option value="Half Day (4-5 Hours)">Half Day (4-5 Hours)</option>
                        <option value="Full Day (8 Hours)">Full Day (8 Hours)</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ fontSize: "0.78rem", fontWeight: 800, color: "#334155", textTransform: "uppercase", display: "block", marginBottom: "0.4rem" }}>Fitness Level</label>
                      <select
                        value={fitnessLevel}
                        onChange={(e) => setFitnessLevel(e.target.value)}
                        style={{ width: "100%", padding: "0.85rem 1.1rem", fontSize: "0.92rem", borderRadius: "14px", border: "1px solid #cbd5e1", outline: "none", background: "#ffffff" }}
                      >
                        <option value="Easy">Easy (All Ages)</option>
                        <option value="Moderate">Moderate (Basic Swimming / Stride)</option>
                        <option value="Advanced">Advanced (High Stamina Required)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize: "0.78rem", fontWeight: 800, color: "#334155", textTransform: "uppercase", display: "block", marginBottom: "0.4rem" }}>Exact Meeting Point &amp; Landmarking</label>
                    <input
                      type="text"
                      value={meetingPoint}
                      onChange={(e) => setMeetingPoint(e.target.value)}
                      placeholder="e.g. Sal Backwaters Jetty, Near The Leela Resort, Mobor Beach"
                      style={{ width: "100%", padding: "0.85rem 1.1rem", fontSize: "0.92rem", borderRadius: "14px", border: "1px solid #cbd5e1", outline: "none", background: "#ffffff" }}
                    />
                  </div>
                </div>
              )}

              {/* TAB 3: PRICING */}
              {activeTab === "pricing" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "1.25rem" }}>
                    <div>
                      <label style={{ fontSize: "0.78rem", fontWeight: 800, color: "#334155", textTransform: "uppercase", display: "block", marginBottom: "0.4rem" }}>Price / Person (₹) *</label>
                      <input
                        type="number"
                        required
                        min={200}
                        value={basePrice}
                        onChange={(e) => setBasePrice(Number(e.target.value))}
                        style={{ width: "100%", padding: "0.85rem 1.1rem", fontSize: "1.05rem", borderRadius: "14px", border: "1px solid #cbd5e1", outline: "none", fontWeight: 900, color: "#0284c7", background: "#ffffff" }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: "0.78rem", fontWeight: 800, color: "#334155", textTransform: "uppercase", display: "block", marginBottom: "0.4rem" }}>Weekend Price (₹)</label>
                      <input
                        type="number"
                        min={200}
                        value={weekendPrice}
                        onChange={(e) => setWeekendPrice(Number(e.target.value))}
                        style={{ width: "100%", padding: "0.85rem 1.1rem", fontSize: "1.05rem", borderRadius: "14px", border: "1px solid #cbd5e1", outline: "none", fontWeight: 900, color: "#0284c7", background: "#ffffff" }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: "0.78rem", fontWeight: 800, color: "#334155", textTransform: "uppercase", display: "block", marginBottom: "0.4rem" }}>Max Group Size</label>
                      <input
                        type="number"
                        min={1}
                        value={maxGuests}
                        onChange={(e) => setMaxGuests(Number(e.target.value))}
                        style={{ width: "100%", padding: "0.85rem 1.1rem", fontSize: "0.95rem", borderRadius: "14px", border: "1px solid #cbd5e1", outline: "none", background: "#ffffff" }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: "0.78rem", fontWeight: 800, color: "#334155", textTransform: "uppercase", display: "block", marginBottom: "0.4rem" }}>Minimum Age (Years)</label>
                      <input
                        type="number"
                        min={5}
                        value={minAge}
                        onChange={(e) => setMinAge(Number(e.target.value))}
                        style={{ width: "100%", padding: "0.85rem 1.1rem", fontSize: "0.95rem", borderRadius: "14px", border: "1px solid #cbd5e1", outline: "none", background: "#ffffff" }}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: GEAR & PACKING */}
              {activeTab === "gear" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                  <div>
                    <label style={{ fontSize: "0.78rem", fontWeight: 800, color: "#334155", textTransform: "uppercase", display: "block", marginBottom: "0.4rem" }}>Inclusions &amp; Provided Equipment</label>
                    <textarea
                      rows={3}
                      value={inclusionsText}
                      onChange={(e) => setInclusionsText(e.target.value)}
                      placeholder="e.g. High-performance kayaks, bouyancy vests, water bottles, certified guide, GoPro footage"
                      style={{ width: "100%", padding: "1rem", fontSize: "0.92rem", borderRadius: "14px", border: "1px solid #cbd5e1", outline: "none", background: "#ffffff" }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: "0.78rem", fontWeight: 800, color: "#334155", textTransform: "uppercase", display: "block", marginBottom: "0.4rem" }}>What Guests Should Bring</label>
                    <textarea
                      rows={3}
                      value={whatToBringText}
                      onChange={(e) => setWhatToBringText(e.target.value)}
                      placeholder="e.g. Quick-dry clothing, water sandals, waterproof phone pouch, sunglasses strap"
                      style={{ width: "100%", padding: "1rem", fontSize: "0.92rem", borderRadius: "14px", border: "1px solid #cbd5e1", outline: "none", background: "#ffffff" }}
                    />
                  </div>
                </div>
              )}

              {/* TAB 5: AMENITIES */}
              {activeTab === "amenities" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                  {Object.entries(EXP_AMENITIES_CATEGORIES).map(([catTitle, items]) => (
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
                              style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.65rem 0.85rem", borderRadius: "12px", border: isSelected ? "2px solid #0284c7" : "1px solid #e2e8f0", background: isSelected ? "rgba(2, 132, 199, 0.08)" : "#ffffff", color: isSelected ? "#0284c7" : "#475569", fontWeight: 700, fontSize: "0.82rem", cursor: "pointer", textAlign: "left" }}
                            >
                              <span className="material-symbols-outlined" style={{ fontSize: "16px", color: isSelected ? "#0284c7" : "#94a3b8" }}>
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
                    <h3 style={{ fontSize: "1rem", fontWeight: 900, color: "#0f172a", margin: 0 }}>Activity Photo Gallery</h3>
                    <button
                      type="button"
                      onClick={addImageField}
                      style={{ padding: "0.5rem 1rem", borderRadius: "10px", border: "1px solid #0284c7", background: "#ffffff", color: "#0284c7", fontWeight: 800, fontSize: "0.85rem", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.3rem" }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>add_photo_alternate</span>
                      <span>Add Image URL</span>
                    </button>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                    {images.map((img, idx) => (
                      <div key={idx} style={{ display: "flex", alignItems: "center", gap: "0.75rem", background: "#f8fafc", padding: "0.75rem 1rem", borderRadius: "14px", border: "1px solid #e2e8f0" }}>
                        <span style={{ fontSize: "0.85rem", fontWeight: 900, color: "#0284c7", width: "28px" }}>#{idx + 1}</span>
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

              {/* TAB 7: GUIDE BIO */}
              {activeTab === "guidelines" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem" }}>
                    <div>
                      <label style={{ fontSize: "0.78rem", fontWeight: 800, color: "#334155", textTransform: "uppercase", display: "block", marginBottom: "0.4rem" }}>Lead Guide / Host Name</label>
                      <input
                        type="text"
                        value={hostName}
                        onChange={(e) => setHostName(e.target.value)}
                        placeholder="e.g. Captain Rohan D'Souza"
                        style={{ width: "100%", padding: "0.85rem 1.1rem", fontSize: "0.92rem", borderRadius: "14px", border: "1px solid #cbd5e1", outline: "none", background: "#ffffff" }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: "0.78rem", fontWeight: 800, color: "#334155", textTransform: "uppercase", display: "block", marginBottom: "0.4rem" }}>Guide Phone Number</label>
                      <input
                        type="text"
                        value={hostPhone}
                        onChange={(e) => setHostPhone(e.target.value)}
                        placeholder="+91 98221 12345"
                        style={{ width: "100%", padding: "0.85rem 1.1rem", fontSize: "0.92rem", borderRadius: "14px", border: "1px solid #cbd5e1", outline: "none", background: "#ffffff" }}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize: "0.78rem", fontWeight: 800, color: "#334155", textTransform: "uppercase", display: "block", marginBottom: "0.4rem" }}>Instructor Bio &amp; Certifications</label>
                    <textarea
                      rows={3}
                      value={hostBio}
                      onChange={(e) => setHostBio(e.target.value)}
                      placeholder="Describe guide certifications, emergency training, years of local navigation experience..."
                      style={{ width: "100%", padding: "1rem", fontSize: "0.92rem", borderRadius: "14px", border: "1px solid #cbd5e1", outline: "none", background: "#ffffff" }}
                    />
                  </div>
                </div>
              )}

              {/* MODAL BOTTOM BAR */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: "1.25rem", borderTop: "1px solid #e2e8f0" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <span style={{ fontSize: "0.82rem", color: "#64748b" }}>Live Tariff / Person:</span>
                  <strong style={{ color: "#0284c7", fontWeight: 900, fontSize: "1.1rem" }}>
                    ₹{Number(basePrice || 0).toLocaleString("en-IN")}/person
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
                    style={{ padding: "0.75rem 2.25rem", borderRadius: "14px", background: "linear-gradient(135deg, #0284c7 0%, #0369a1 100%)", color: "#ffffff", fontWeight: 900, fontSize: "0.95rem", border: "none", cursor: "pointer", boxShadow: "0 4px 16px rgba(2,132,199,0.35)", opacity: saving ? 0.6 : 1 }}
                  >
                    {saving ? "Saving Experience..." : isCreatingNew ? "Publish Experience" : "Save Experience Details"}
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
