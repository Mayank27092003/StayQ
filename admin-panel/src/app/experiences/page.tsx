"use client";

import { useEffect, useState, useRef } from "react";
import axios from "axios";
import { uploadMediaFile, UploadedMediaItem } from "@/utils/firebaseStorage";

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
  pricePerNight?: number;
  weekendPrice?: number;
  status: string;
  type?: string;
  category?: { name: string } | string;
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
  heroImage?: string;
  videoUrl?: string;
  videoUrls?: string[];
  documents?: { name: string; url: string; type?: string }[];
  documentUrls?: string[];
  cancellationPolicy?: string;
}

const EXP_AMENITIES_CATEGORIES = {
  "Gear & Safety": [
    "Certified Lead Instructor",
    "Life Jackets & Buoyancy Aids",
    "Professional Safety Helmets",
    "Emergency First Aid & CPR Kit",
    "Dry Bags for Phones/Wallets",
    "GoPro 4K Action Camera Footage",
  ],
  "Refreshments & Comfort": [
    "Hydration & Energy Drinks",
    "Traditional Local Snacks / Meal",
    "Fresh Coconut Water",
    "Bottled Spring Water",
    "Sunscreen & Bug Spray",
    "Outdoor Restroom Access",
  ],
  "Tours & Transport": [
    "Private Hotel Pickup & Drop",
    "AC Transport to Trailhead",
    "Sanctuary Entry Permits",
    "Local Community Interaction",
    "Souvenir Travel Badge",
    "Digital Photo Album via Drive",
  ],
};

export default function ExperiencesManagementPage() {
  const [experiences, setExperiences] = useState<ExperienceUnit[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "general" | "schedule" | "pricing" | "gear" | "amenities" | "media" | "guidelines"
  >("general");
  const [editingExp, setEditingExp] = useState<ExperienceUnit | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Form State (Zero hardcoding)
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [description, setDescription] = useState("");
  const [city, setCity] = useState("");
  const [meetingPoint, setMeetingPoint] = useState("");
  const [expCategory, setExpCategory] = useState("Water Sports & Kayaking");
  const [duration, setDuration] = useState("2 Hours");
  const [fitnessLevel, setFitnessLevel] = useState("Easy");
  const [minAge, setMinAge] = useState<number | "">(10);
  const [maxGuests, setMaxGuests] = useState<number | "">(6);
  const [basePrice, setBasePrice] = useState<number | "">("");
  const [weekendPrice, setWeekendPrice] = useState<number | "">("");
  const [inclusionsText, setInclusionsText] = useState("");
  const [whatToBringText, setWhatToBringText] = useState("");
  const [hostName, setHostName] = useState("");
  const [hostBio, setHostBio] = useState("");
  const [hostPhone, setHostPhone] = useState("");
  const [status, setStatus] = useState("ACTIVE");

  // Media state
  const [images, setImages] = useState<string[]>([]);
  const [videoUrl, setVideoUrl] = useState("");
  const [documents, setDocuments] = useState<{ name: string; url: string; type?: string }[]>([]);
  const [manualImageUrl, setManualImageUrl] = useState("");

  // Uploading state
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isUploadingVideo, setIsUploadingVideo] = useState(false);
  const [isUploadingDoc, setIsUploadingDoc] = useState(false);
  const [uploadStatus, setUploadStatus] = useState("");

  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);

  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const videoInputRef = useRef<HTMLInputElement | null>(null);
  const docInputRef = useRef<HTMLInputElement | null>(null);

  const fetchExperiences = async () => {
    try {
      setLoading(true);
      const res = await axios.get("/api/v1/properties");
      if (Array.isArray(res.data)) {
        const expList = res.data.filter(
          (p: any) =>
            p.category?.name === "EXPERIENCE" ||
            p.category === "EXPERIENCE" ||
            p.category === "EXPERIENCES" ||
            p.type === "EXPERIENCE" ||
            p.type === "EXPERIENCES" ||
            p.isExperience === true
        );
        setExperiences(expList);
      }
    } catch {
      // fallback
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

    // Clear everything - zero hardcoding
    setTitle("");
    setSubtitle("");
    setDescription("");
    setCity("");
    setMeetingPoint("");
    setExpCategory("Water Sports & Kayaking");
    setDuration("2 Hours");
    setFitnessLevel("Easy");
    setMinAge(10);
    setMaxGuests(6);
    setBasePrice("");
    setWeekendPrice("");
    setInclusionsText("");
    setWhatToBringText("");
    setHostName("");
    setHostBio("");
    setHostPhone("");
    setStatus("ACTIVE");
    setImages([]);
    setVideoUrl("");
    setDocuments([]);
    setManualImageUrl("");
    setSelectedAmenities([]);
    setSaveSuccess(false);
    setIsModalOpen(true);
  };

  const openEditModal = (exp: ExperienceUnit) => {
    setIsCreatingNew(false);
    setEditingExp(exp);
    setActiveTab("general");
    setTitle(exp.title || "");
    setSubtitle(exp.subtitle || "");
    setDescription(exp.description || "");
    setCity(exp.city || "");
    setMeetingPoint(exp.meetingPoint || exp.address || "");
    setExpCategory(exp.expCategory || "Water Sports & Kayaking");
    setDuration(exp.duration || "2 Hours");
    setFitnessLevel(exp.fitnessLevel || "Easy");
    setMinAge(exp.minAge ?? 10);
    setMaxGuests(exp.maxGuests ?? 6);
    setBasePrice(Number(exp.basePrice || exp.pricePerNight) || "");
    setWeekendPrice(Number(exp.weekendPrice) || "");
    setHostName(exp.hostName || "");
    setHostPhone(exp.hostPhone || "");
    setHostBio(exp.hostBio || "");
    setStatus(exp.status || "ACTIVE");
    setImages(exp.imageUrls && exp.imageUrls.length > 0 ? exp.imageUrls : []);
    setVideoUrl(exp.videoUrl || (exp.videoUrls && exp.videoUrls[0]) || "");
    setDocuments(exp.documents || []);
    setInclusionsText(exp.inclusions?.join(", ") || "");
    setWhatToBringText(exp.whatToBring?.join(", ") || "");
    setSelectedAmenities(exp.amenities || []);
    setManualImageUrl("");
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

  // Image Upload Handlers
  const handleImageFilesUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploadingImage(true);
    setUploadStatus(`Uploading ${files.length} photo(s)...`);

    try {
      const uploadedUrls: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const item = await uploadMediaFile(files[i], "experiences/photos");
        uploadedUrls.push(item.url);
      }
      setImages((prev) => [...prev, ...uploadedUrls]);
      setUploadStatus(`Successfully uploaded ${files.length} photo(s)!`);
      setTimeout(() => setUploadStatus(""), 3000);
    } catch (err: any) {
      alert(`Photo upload failed: ${err.message}`);
    } finally {
      setIsUploadingImage(false);
      if (imageInputRef.current) imageInputRef.current.value = "";
    }
  };

  const handleAddManualImage = () => {
    if (!manualImageUrl.trim()) return;
    setImages((prev) => [...prev, manualImageUrl.trim()]);
    setManualImageUrl("");
  };

  const removeImage = (idx: number) => {
    setImages((prev) => prev.filter((_, i) => i !== idx));
  };

  const setCoverImage = (idx: number) => {
    if (idx === 0) return;
    setImages((prev) => {
      const target = prev[idx];
      const rest = prev.filter((_, i) => i !== idx);
      return [target, ...rest];
    });
  };

  // Video Upload Handlers
  const handleVideoFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploadingVideo(true);
    setUploadStatus("Uploading activity video...");

    try {
      const item = await uploadMediaFile(files[0], "experiences/videos");
      setVideoUrl(item.url);
      setUploadStatus("Video uploaded successfully!");
      setTimeout(() => setUploadStatus(""), 3000);
    } catch (err: any) {
      alert(`Video upload failed: ${err.message}`);
    } finally {
      setIsUploadingVideo(false);
      if (videoInputRef.current) videoInputRef.current.value = "";
    }
  };

  // Document Upload Handlers
  const handleDocFilesUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploadingDoc(true);
    setUploadStatus(`Uploading ${files.length} document(s)...`);

    try {
      const uploadedDocs: { name: string; url: string; type: string }[] = [];
      for (let i = 0; i < files.length; i++) {
        const item = await uploadMediaFile(files[i], "experiences/docs");
        uploadedDocs.push({
          name: item.name,
          url: item.url,
          type: item.type,
        });
      }
      setDocuments((prev) => [...prev, ...uploadedDocs]);
      setUploadStatus(`Successfully uploaded ${files.length} document(s)!`);
      setTimeout(() => setUploadStatus(""), 3000);
    } catch (err: any) {
      alert(`Document upload failed: ${err.message}`);
    } finally {
      setIsUploadingDoc(false);
      if (docInputRef.current) docInputRef.current.value = "";
    }
  };

  const removeDocument = (idx: number) => {
    setDocuments((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const validImages = images.filter((img) => img && img.trim().length > 0);
    const numericPrice = Number(basePrice) || 0;
    const numericWeekendPrice = Number(weekendPrice) || numericPrice;
    const numericGuests = Number(maxGuests) || 1;
    const numericMinAge = Number(minAge) || 0;

    const payload = {
      title: title.trim(),
      subtitle: subtitle.trim(),
      description: description.trim(),
      type: "EXPERIENCES",
      category: "EXPERIENCES",
      city: city.trim(),
      address: meetingPoint.trim(),
      meetingPoint: meetingPoint.trim(),
      expCategory,
      duration,
      fitnessLevel,
      minAge: numericMinAge,
      basePrice: numericPrice,
      pricePerNight: numericPrice,
      weekendPrice: numericWeekendPrice,
      maxGuests: numericGuests,
      bedrooms: 1,
      beds: 1,
      bathrooms: 1,
      amenities: selectedAmenities,
      inclusions: inclusionsText ? inclusionsText.split(",").map((s) => s.trim()).filter(Boolean) : [],
      whatToBring: whatToBringText ? whatToBringText.split(",").map((s) => s.trim()).filter(Boolean) : [],
      hostName: hostName.trim(),
      hostPhone: hostPhone.trim(),
      hostBio: hostBio.trim(),
      images: validImages,
      heroImage: validImages.length > 0 ? validImages[0] : undefined,
      videoUrls: videoUrl ? [videoUrl] : [],
      documents: documents,
      status,
      isExperience: true,
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
    } catch (err: any) {
      console.warn("Experience save note:", err);
      alert(`Failed to save experience: ${err.response?.data?.message || err.message}`);
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
    } catch (err: any) {
      console.warn("Delete note:", err);
      alert(`Delete failed: ${err.message}`);
    }
  };

  const filtered = experiences.filter(
    (e) =>
      (e.title && e.title.toLowerCase().includes(search.toLowerCase())) ||
      (e.city && e.city.toLowerCase().includes(search.toLowerCase())) ||
      (e.hostName && e.hostName.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem", paddingBottom: "4rem" }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "1rem",
          background: "#ffffff",
          padding: "1.75rem",
          borderRadius: "20px",
          border: "1px solid #e2e8f0",
          boxShadow: "0 2px 6px rgba(0,0,0,0.03)",
        }}
      >
        <div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              color: "#0284c7",
              fontWeight: 900,
              fontSize: "0.8rem",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              marginBottom: "0.35rem",
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>
              explore
            </span>
            <span>Adventures &amp; Local Activities Hub</span>
          </div>
          <h1
            style={{
              fontSize: "1.75rem",
              fontWeight: 900,
              color: "#0f172a",
              margin: "0 0 0.35rem",
              letterSpacing: "-0.02em",
            }}
          >
            Curated Experiences Hub
          </h1>
          <p style={{ fontSize: "0.92rem", color: "#64748b", margin: 0, maxWidth: "700px" }}>
            Create and manage activities, gear inclusions, certified guides, and upload high-res photos, videos, and safety documentation.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.6rem",
            padding: "0.85rem 1.75rem",
            background: "linear-gradient(135deg, #0284c7 0%, #0369a1 100%)",
            color: "#ffffff",
            fontWeight: 800,
            fontSize: "0.95rem",
            borderRadius: "16px",
            border: "none",
            cursor: "pointer",
            boxShadow: "0 4px 16px rgba(2,132,199,0.35)",
            transition: "all 0.2s ease",
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: "22px" }}>
            add_circle
          </span>
          <span>Add Experience</span>
        </button>
      </div>

      {/* Search & KPI */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: "1rem", alignItems: "center" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
            background: "#ffffff",
            padding: "0.9rem 1.25rem",
            borderRadius: "16px",
            border: "1px solid #e2e8f0",
          }}
        >
          <span className="material-symbols-outlined" style={{ color: "#94a3b8", fontSize: "22px" }}>
            search
          </span>
          <input
            type="text"
            placeholder="Search experiences by title, outdoor activity, guide name, destination..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              flex: 1,
              border: "none",
              outline: "none",
              fontSize: "0.95rem",
              color: "#0f172a",
              background: "transparent",
            }}
          />
        </div>
        <div
          style={{
            background: "#ffffff",
            padding: "0.75rem 1.25rem",
            borderRadius: "16px",
            border: "1px solid #e2e8f0",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
          }}
        >
          <span style={{ fontSize: "0.82rem", color: "#64748b", fontWeight: 700 }}>Total Activities:</span>
          <strong style={{ fontSize: "1rem", color: "#0f172a", fontWeight: 900 }}>{experiences.length}</strong>
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div
          style={{
            padding: "4rem",
            textAlign: "center",
            color: "#64748b",
            background: "#ffffff",
            borderRadius: "20px",
            border: "1px solid #e2e8f0",
          }}
        >
          Loading experiences...
        </div>
      ) : filtered.length === 0 ? (
        <div
          style={{
            padding: "4rem",
            textAlign: "center",
            background: "#ffffff",
            borderRadius: "20px",
            border: "1px solid #e2e8f0",
          }}
        >
          <p style={{ color: "#64748b", fontWeight: 700, margin: 0, fontSize: "1.1rem" }}>
            No experiences found. Click &ldquo;Add Experience&rdquo; to launch your first activity!
          </p>
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(350px, 1fr))",
            gap: "1.5rem",
          }}
        >
          {filtered.map((exp) => {
            const coverImage = exp.imageUrls?.[0] || exp.heroImage || "";
            const price = Number(exp.basePrice || exp.pricePerNight || 0);

            return (
              <div
                key={exp.id}
                style={{
                  background: "#ffffff",
                  borderRadius: "24px",
                  border: "1px solid #e2e8f0",
                  overflow: "hidden",
                  boxShadow: "0 2px 10px rgba(0,0,0,0.03)",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <div style={{ position: "relative", height: "220px", background: "#0f172a" }}>
                  {coverImage ? (
                    <img
                      src={coverImage}
                      alt={exp.title}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  ) : (
                    <div
                      style={{
                        width: "100%",
                        height: "100%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        background: "linear-gradient(135deg, #0284c7 0%, #0f172a 100%)",
                        color: "#ffffff",
                      }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: "48px", opacity: 0.8 }}>
                        explore
                      </span>
                    </div>
                  )}

                  {exp.duration && (
                    <div
                      style={{
                        position: "absolute",
                        top: "12px",
                        right: "12px",
                        background: "rgba(2, 132, 199, 0.95)",
                        backdropFilter: "blur(8px)",
                        color: "#ffffff",
                        padding: "0.35rem 0.85rem",
                        borderRadius: "999px",
                        fontSize: "0.78rem",
                        fontWeight: 800,
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                      }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>
                        schedule
                      </span>
                      <span>{exp.duration}</span>
                    </div>
                  )}

                  <div
                    style={{
                      position: "absolute",
                      bottom: "12px",
                      left: "12px",
                      background: "rgba(15, 23, 42, 0.85)",
                      backdropFilter: "blur(6px)",
                      color: "#ffffff",
                      padding: "0.25rem 0.75rem",
                      borderRadius: "8px",
                      fontSize: "0.72rem",
                      fontWeight: 800,
                    }}
                  >
                    {exp.city ? exp.city : "Location Unset"}
                  </div>
                </div>

                <div
                  style={{
                    padding: "1.5rem",
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    gap: "1.25rem",
                  }}
                >
                  <div>
                    <h3
                      style={{
                        fontSize: "1.15rem",
                        fontWeight: 900,
                        color: "#0f172a",
                        margin: "0 0 0.35rem",
                        lineHeight: 1.3,
                      }}
                    >
                      {exp.title || "Untitled Activity"}
                    </h3>
                    <p
                      style={{
                        fontSize: "0.85rem",
                        color: "#64748b",
                        display: "flex",
                        alignItems: "center",
                        gap: "0.3rem",
                        margin: 0,
                      }}
                    >
                      <span
                        className="material-symbols-outlined"
                        style={{ fontSize: "16px", color: "#0284c7" }}
                      >
                        location_on
                      </span>
                      <span>{exp.city ? `${exp.city}, India` : "Location Pending"}</span>
                    </p>
                  </div>

                  <div
                    style={{
                      background: "#f8fafc",
                      padding: "0.85rem 1rem",
                      borderRadius: "14px",
                      border: "1px solid #f1f5f9",
                      fontSize: "0.82rem",
                      color: "#475569",
                      display: "flex",
                      flexDirection: "column",
                      gap: "0.45rem",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span>Batch Capacity:</span>
                      <strong style={{ color: "#0f172a" }}>
                        {exp.maxGuests ? `Max ${exp.maxGuests} Explorers` : "Flexible Group"}
                      </strong>
                    </div>
                    {exp.hostName && (
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span>Certified Guide:</span>
                        <span style={{ color: "#0284c7", fontWeight: 800 }}>{exp.hostName}</span>
                      </div>
                    )}
                  </div>

                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      paddingTop: "0.85rem",
                      borderTop: "1px solid #f1f5f9",
                    }}
                  >
                    <div>
                      <span
                        style={{
                          fontSize: "0.72rem",
                          color: "#94a3b8",
                          display: "block",
                          textTransform: "uppercase",
                          fontWeight: 700,
                        }}
                      >
                        Price / Person
                      </span>
                      <strong style={{ color: "#0284c7", fontWeight: 900, fontSize: "1.25rem" }}>
                        ₹{price.toLocaleString("en-IN")}
                        <span style={{ fontSize: "0.78rem", color: "#64748b", fontWeight: 600 }}>
                          /person
                        </span>
                      </strong>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <button
                        type="button"
                        onClick={() => openEditModal(exp)}
                        style={{
                          padding: "0.6rem 1rem",
                          borderRadius: "12px",
                          border: "1px solid #e2e8f0",
                          background: "#f8fafc",
                          color: "#0284c7",
                          fontWeight: 800,
                          fontSize: "0.85rem",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: "0.35rem",
                        }}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>
                          edit
                        </span>
                        <span>Edit</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(exp.id, exp.title)}
                        style={{
                          padding: "0.6rem",
                          borderRadius: "12px",
                          border: "none",
                          background: "rgba(239, 68, 68, 0.1)",
                          color: "#ef4444",
                          cursor: "pointer",
                        }}
                        title="Delete Experience"
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>
                          delete
                        </span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ULTRA-EXPANDED MULTI-TAB EXPERIENCE MODAL */}
      {isModalOpen && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            width: "100vw",
            height: "100vh",
            background: "rgba(15, 23, 42, 0.82)",
            backdropFilter: "blur(10px)",
            zIndex: 99999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "1.5rem",
          }}
        >
          <div
            style={{
              background: "#ffffff",
              borderRadius: "32px",
              maxWidth: "1080px",
              width: "95vw",
              maxHeight: "94vh",
              overflowY: "auto",
              padding: "2.5rem",
              boxShadow: "0 30px 60px -15px rgba(0,0,0,0.5)",
              border: "1px solid rgba(226, 232, 240, 0.8)",
              position: "relative",
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "1.5rem",
                paddingBottom: "1.25rem",
                borderBottom: "1px solid #e2e8f0",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                <div
                  style={{
                    width: "52px",
                    height: "52px",
                    borderRadius: "18px",
                    background: "linear-gradient(135deg, #0284c7 0%, #0369a1 100%)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#ffffff",
                    boxShadow: "0 6px 18px rgba(2,132,199,0.35)",
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: "30px" }}>
                    explore
                  </span>
                </div>
                <div>
                  <h2
                    style={{
                      fontSize: "1.5rem",
                      fontWeight: 900,
                      color: "#0f172a",
                      margin: 0,
                      letterSpacing: "-0.01em",
                    }}
                  >
                    {isCreatingNew ? "Add Curated Adventure / Experience" : `Edit Activity — "${title || "Untitled"}"`}
                  </h2>
                  <p style={{ fontSize: "0.85rem", color: "#64748b", margin: "0.2rem 0 0", fontWeight: 600 }}>
                    {editingExp ? `Activity ID: ${editingExp.id}` : "Configure activity itinerary, equipment, meeting point, photos, videos & docs"} · Live Sync
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                style={{
                  background: "#f1f5f9",
                  border: "none",
                  borderRadius: "50%",
                  width: "42px",
                  height: "42px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  color: "#64748b",
                }}
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* TAB NAVIGATION BAR */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                overflowX: "auto",
                paddingBottom: "0.75rem",
                marginBottom: "1.5rem",
                borderBottom: "2px solid #f1f5f9",
              }}
            >
              {[
                { id: "general", label: "Activity & Category", icon: "badge" },
                { id: "schedule", label: "Duration & Location", icon: "schedule" },
                { id: "pricing", label: "Pricing & Group Slots", icon: "payments" },
                { id: "gear", label: "Gear & Inclusions", icon: "sports_kabaddi" },
                { id: "amenities", label: "Checklist & Amenities", icon: "verified" },
                { id: "media", label: "Media & Documents", icon: "cloud_upload" },
                { id: "guidelines", label: "Host Guide Bio", icon: "person" },
              ].map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id as any)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.45rem",
                      padding: "0.65rem 1.1rem",
                      borderRadius: "14px",
                      border: "none",
                      background: isActive ? "#0284c7" : "#f8fafc",
                      color: isActive ? "#ffffff" : "#64748b",
                      fontWeight: 800,
                      fontSize: "0.85rem",
                      cursor: "pointer",
                      whiteSpace: "nowrap",
                      transition: "all 0.15s ease",
                      boxShadow: isActive ? "0 4px 12px rgba(2,132,199,0.25)" : "none",
                    }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>
                      {tab.icon}
                    </span>
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {saveSuccess && (
              <div
                style={{
                  padding: "0.9rem 1.25rem",
                  borderRadius: "14px",
                  background: "#ecfdf5",
                  color: "#059669",
                  fontWeight: 800,
                  fontSize: "0.92rem",
                  marginBottom: "1.5rem",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.6rem",
                  border: "1px solid #a7f3d0",
                }}
              >
                <span className="material-symbols-outlined">check_circle</span>
                <span>Experience saved successfully to live database!</span>
              </div>
            )}

            {uploadStatus && (
              <div
                style={{
                  padding: "0.75rem 1.25rem",
                  borderRadius: "14px",
                  background: "#eff6ff",
                  color: "#0284c7",
                  fontWeight: 800,
                  fontSize: "0.85rem",
                  marginBottom: "1rem",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.6rem",
                  border: "1px solid #bfdbfe",
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>
                  sync
                </span>
                <span>{uploadStatus}</span>
              </div>
            )}

            <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
              {/* TAB 1: GENERAL */}
              {activeTab === "general" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "1.25rem" }}>
                    <div>
                      <label
                        style={{
                          fontSize: "0.78rem",
                          fontWeight: 800,
                          color: "#334155",
                          textTransform: "uppercase",
                          display: "block",
                          marginBottom: "0.4rem",
                        }}
                      >
                        Experience Title *
                      </label>
                      <input
                        type="text"
                        required
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="e.g. Sunset Mangrove Kayaking &amp; Bioluminescence Starlight Trail"
                        style={{
                          width: "100%",
                          padding: "0.85rem 1.1rem",
                          fontSize: "0.95rem",
                          borderRadius: "14px",
                          border: "1px solid #cbd5e1",
                          outline: "none",
                          fontWeight: 800,
                          background: "#ffffff",
                        }}
                      />
                    </div>
                    <div>
                      <label
                        style={{
                          fontSize: "0.78rem",
                          fontWeight: 800,
                          color: "#334155",
                          textTransform: "uppercase",
                          display: "block",
                          marginBottom: "0.4rem",
                        }}
                      >
                        Activity Category
                      </label>
                      <select
                        value={expCategory}
                        onChange={(e) => setExpCategory(e.target.value)}
                        style={{
                          width: "100%",
                          padding: "0.85rem 1.1rem",
                          fontSize: "0.95rem",
                          borderRadius: "14px",
                          border: "1px solid #cbd5e1",
                          outline: "none",
                          fontWeight: 800,
                          background: "#ffffff",
                        }}
                      >
                        <option value="Water Sports & Kayaking">Water Sports &amp; Kayaking</option>
                        <option value="Hiking & Alpine Treks">Hiking &amp; Alpine Treks</option>
                        <option value="Culinary Trail & Cooking">Culinary Trail &amp; Local Feast</option>
                        <option value="Heritage Architecture Walk">Heritage Architecture Walk</option>
                        <option value="Wildlife Safari & Birding">Wildlife Safari &amp; Birding</option>
                        <option value="Yoga & Wellness Retreat">Yoga &amp; Wellness Retreat</option>
                        <option value="Scuba Diving & Snorkeling">Scuba Diving &amp; Snorkeling</option>
                        <option value="Paragliding & Sky Sports">Paragliding &amp; Sky Sports</option>
                        <option value="Stargazing & Astronomy">Stargazing &amp; Dark Sky Astro</option>
                        <option value="Artisan Pottery & Crafts">Artisan Pottery &amp; Crafts</option>
                        <option value="Surfing & Ocean Sports">Surfing &amp; Ocean Sports</option>
                        <option value="Other Adventure">Other Adventure</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label
                      style={{
                        fontSize: "0.78rem",
                        fontWeight: 800,
                        color: "#334155",
                        textTransform: "uppercase",
                        display: "block",
                        marginBottom: "0.4rem",
                      }}
                    >
                      Tagline / Subtitle
                    </label>
                    <input
                      type="text"
                      value={subtitle}
                      onChange={(e) => setSubtitle(e.target.value)}
                      placeholder="e.g. Glide through calm backwaters under starry skies with certified ocean guides"
                      style={{
                        width: "100%",
                        padding: "0.85rem 1.1rem",
                        fontSize: "0.92rem",
                        borderRadius: "14px",
                        border: "1px solid #cbd5e1",
                        outline: "none",
                        background: "#ffffff",
                      }}
                    />
                  </div>

                  <div>
                    <label
                      style={{
                        fontSize: "0.78rem",
                        fontWeight: 800,
                        color: "#334155",
                        textTransform: "uppercase",
                        display: "block",
                        marginBottom: "0.4rem",
                      }}
                    >
                      Detailed Activity Itinerary &amp; Overview
                    </label>
                    <textarea
                      rows={4}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Detail the experience step-by-step: safety briefing, route highlights, rest breaks, and photo spots..."
                      style={{
                        width: "100%",
                        padding: "1rem",
                        fontSize: "0.92rem",
                        borderRadius: "14px",
                        border: "1px solid #cbd5e1",
                        outline: "none",
                        background: "#ffffff",
                      }}
                    />
                  </div>
                </div>
              )}

              {/* TAB 2: SCHEDULE & LOCATION */}
              {activeTab === "schedule" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1.25rem" }}>
                    <div>
                      <label
                        style={{
                          fontSize: "0.78rem",
                          fontWeight: 800,
                          color: "#334155",
                          textTransform: "uppercase",
                          display: "block",
                          marginBottom: "0.4rem",
                        }}
                      >
                        City / Destination *
                      </label>
                      <input
                        type="text"
                        required
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        placeholder="e.g. Goa, Manali, Rishikesh, Munnar"
                        style={{
                          width: "100%",
                          padding: "0.85rem 1.1rem",
                          fontSize: "0.92rem",
                          borderRadius: "14px",
                          border: "1px solid #cbd5e1",
                          outline: "none",
                          background: "#ffffff",
                        }}
                      />
                    </div>
                    <div>
                      <label
                        style={{
                          fontSize: "0.78rem",
                          fontWeight: 800,
                          color: "#334155",
                          textTransform: "uppercase",
                          display: "block",
                          marginBottom: "0.4rem",
                        }}
                      >
                        Duration
                      </label>
                      <select
                        value={duration}
                        onChange={(e) => setDuration(e.target.value)}
                        style={{
                          width: "100%",
                          padding: "0.85rem 1.1rem",
                          fontSize: "0.92rem",
                          borderRadius: "14px",
                          border: "1px solid #cbd5e1",
                          outline: "none",
                          background: "#ffffff",
                        }}
                      >
                        <option value="1 Hour">1 Hour</option>
                        <option value="2 Hours">2 Hours</option>
                        <option value="3 Hours">3 Hours</option>
                        <option value="Half Day (4-5 Hours)">Half Day (4-5 Hours)</option>
                        <option value="Full Day (8 Hours)">Full Day (8 Hours)</option>
                        <option value="Multi-Day">Multi-Day Expedition</option>
                      </select>
                    </div>
                    <div>
                      <label
                        style={{
                          fontSize: "0.78rem",
                          fontWeight: 800,
                          color: "#334155",
                          textTransform: "uppercase",
                          display: "block",
                          marginBottom: "0.4rem",
                        }}
                      >
                        Fitness Level
                      </label>
                      <select
                        value={fitnessLevel}
                        onChange={(e) => setFitnessLevel(e.target.value)}
                        style={{
                          width: "100%",
                          padding: "0.85rem 1.1rem",
                          fontSize: "0.92rem",
                          borderRadius: "14px",
                          border: "1px solid #cbd5e1",
                          outline: "none",
                          background: "#ffffff",
                        }}
                      >
                        <option value="Easy">Easy (All Ages &amp; Beginners)</option>
                        <option value="Moderate">Moderate (Basic Endurance)</option>
                        <option value="Advanced">Advanced (High Stamina / Technical)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label
                      style={{
                        fontSize: "0.78rem",
                        fontWeight: 800,
                        color: "#334155",
                        textTransform: "uppercase",
                        display: "block",
                        marginBottom: "0.4rem",
                      }}
                    >
                      Exact Meeting Point &amp; Landmark
                    </label>
                    <input
                      type="text"
                      value={meetingPoint}
                      onChange={(e) => setMeetingPoint(e.target.value)}
                      placeholder="e.g. Sal Backwaters Jetty, Near Mobor Beach Hub"
                      style={{
                        width: "100%",
                        padding: "0.85rem 1.1rem",
                        fontSize: "0.92rem",
                        borderRadius: "14px",
                        border: "1px solid #cbd5e1",
                        outline: "none",
                        background: "#ffffff",
                      }}
                    />
                  </div>
                </div>
              )}

              {/* TAB 3: PRICING */}
              {activeTab === "pricing" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "1.25rem" }}>
                    <div>
                      <label
                        style={{
                          fontSize: "0.78rem",
                          fontWeight: 800,
                          color: "#334155",
                          textTransform: "uppercase",
                          display: "block",
                          marginBottom: "0.4rem",
                        }}
                      >
                        Price / Person (₹) *
                      </label>
                      <input
                        type="number"
                        required
                        min={0}
                        value={basePrice}
                        onChange={(e) => setBasePrice(e.target.value === "" ? "" : Number(e.target.value))}
                        placeholder="e.g. 1800"
                        style={{
                          width: "100%",
                          padding: "0.85rem 1.1rem",
                          fontSize: "1.05rem",
                          borderRadius: "14px",
                          border: "1px solid #cbd5e1",
                          outline: "none",
                          fontWeight: 900,
                          color: "#0284c7",
                          background: "#ffffff",
                        }}
                      />
                    </div>
                    <div>
                      <label
                        style={{
                          fontSize: "0.78rem",
                          fontWeight: 800,
                          color: "#334155",
                          textTransform: "uppercase",
                          display: "block",
                          marginBottom: "0.4rem",
                        }}
                      >
                        Weekend Price (₹)
                      </label>
                      <input
                        type="number"
                        min={0}
                        value={weekendPrice}
                        onChange={(e) => setWeekendPrice(e.target.value === "" ? "" : Number(e.target.value))}
                        placeholder="e.g. 2200"
                        style={{
                          width: "100%",
                          padding: "0.85rem 1.1rem",
                          fontSize: "1.05rem",
                          borderRadius: "14px",
                          border: "1px solid #cbd5e1",
                          outline: "none",
                          fontWeight: 900,
                          color: "#0284c7",
                          background: "#ffffff",
                        }}
                      />
                    </div>
                    <div>
                      <label
                        style={{
                          fontSize: "0.78rem",
                          fontWeight: 800,
                          color: "#334155",
                          textTransform: "uppercase",
                          display: "block",
                          marginBottom: "0.4rem",
                        }}
                      >
                        Max Group Size
                      </label>
                      <input
                        type="number"
                        min={1}
                        value={maxGuests}
                        onChange={(e) => setMaxGuests(e.target.value === "" ? "" : Number(e.target.value))}
                        placeholder="e.g. 8"
                        style={{
                          width: "100%",
                          padding: "0.85rem 1.1rem",
                          fontSize: "0.95rem",
                          borderRadius: "14px",
                          border: "1px solid #cbd5e1",
                          outline: "none",
                          background: "#ffffff",
                        }}
                      />
                    </div>
                    <div>
                      <label
                        style={{
                          fontSize: "0.78rem",
                          fontWeight: 800,
                          color: "#334155",
                          textTransform: "uppercase",
                          display: "block",
                          marginBottom: "0.4rem",
                        }}
                      >
                        Minimum Age (Years)
                      </label>
                      <input
                        type="number"
                        min={0}
                        value={minAge}
                        onChange={(e) => setMinAge(e.target.value === "" ? "" : Number(e.target.value))}
                        placeholder="e.g. 10"
                        style={{
                          width: "100%",
                          padding: "0.85rem 1.1rem",
                          fontSize: "0.95rem",
                          borderRadius: "14px",
                          border: "1px solid #cbd5e1",
                          outline: "none",
                          background: "#ffffff",
                        }}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: GEAR & INCLUSIONS */}
              {activeTab === "gear" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                  <div>
                    <label
                      style={{
                        fontSize: "0.78rem",
                        fontWeight: 800,
                        color: "#334155",
                        textTransform: "uppercase",
                        display: "block",
                        marginBottom: "0.4rem",
                      }}
                    >
                      Inclusions &amp; Provided Equipment (Comma-separated)
                    </label>
                    <textarea
                      rows={3}
                      value={inclusionsText}
                      onChange={(e) => setInclusionsText(e.target.value)}
                      placeholder="e.g. High-performance kayaks, buoyancy vests, water bottles, certified guide, GoPro footage"
                      style={{
                        width: "100%",
                        padding: "1rem",
                        fontSize: "0.92rem",
                        borderRadius: "14px",
                        border: "1px solid #cbd5e1",
                        outline: "none",
                        background: "#ffffff",
                      }}
                    />
                  </div>

                  <div>
                    <label
                      style={{
                        fontSize: "0.78rem",
                        fontWeight: 800,
                        color: "#334155",
                        textTransform: "uppercase",
                        display: "block",
                        marginBottom: "0.4rem",
                      }}
                    >
                      What Guests Should Bring (Comma-separated)
                    </label>
                    <textarea
                      rows={3}
                      value={whatToBringText}
                      onChange={(e) => setWhatToBringText(e.target.value)}
                      placeholder="e.g. Quick-dry clothing, water sandals, waterproof phone pouch, sunglasses strap"
                      style={{
                        width: "100%",
                        padding: "1rem",
                        fontSize: "0.92rem",
                        borderRadius: "14px",
                        border: "1px solid #cbd5e1",
                        outline: "none",
                        background: "#ffffff",
                      }}
                    />
                  </div>
                </div>
              )}

              {/* TAB 5: CHECKLIST & AMENITIES */}
              {activeTab === "amenities" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                  {Object.entries(EXP_AMENITIES_CATEGORIES).map(([catTitle, items]) => (
                    <div
                      key={catTitle}
                      style={{
                        background: "#f8fafc",
                        padding: "1.25rem",
                        borderRadius: "18px",
                        border: "1px solid #e2e8f0",
                      }}
                    >
                      <h4
                        style={{
                          fontSize: "0.88rem",
                          fontWeight: 900,
                          color: "#0f172a",
                          margin: "0 0 0.85rem",
                          textTransform: "uppercase",
                          letterSpacing: "0.04em",
                        }}
                      >
                        {catTitle}
                      </h4>
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
                          gap: "0.6rem",
                        }}
                      >
                        {items.map((amenity) => {
                          const isSelected = selectedAmenities.includes(amenity);
                          return (
                            <button
                              key={amenity}
                              type="button"
                              onClick={() => toggleAmenity(amenity)}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "0.5rem",
                                padding: "0.65rem 0.85rem",
                                borderRadius: "12px",
                                border: isSelected ? "2px solid #0284c7" : "1px solid #e2e8f0",
                                background: isSelected ? "rgba(2, 132, 199, 0.08)" : "#ffffff",
                                color: isSelected ? "#0284c7" : "#475569",
                                fontWeight: 700,
                                fontSize: "0.82rem",
                                cursor: "pointer",
                                textAlign: "left",
                              }}
                            >
                              <span
                                className="material-symbols-outlined"
                                style={{ fontSize: "16px", color: isSelected ? "#0284c7" : "#94a3b8" }}
                              >
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

              {/* TAB 6: MEDIA & DOCUMENTS (PHOTO, VIDEO, DOCS UPLOAD SUITE) */}
              {activeTab === "media" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
                  {/* 1. PHOTO GALLERY SECTION */}
                  <div
                    style={{
                      background: "#ffffff",
                      padding: "1.5rem",
                      borderRadius: "20px",
                      border: "1px solid #e2e8f0",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        marginBottom: "1rem",
                        flexWrap: "wrap",
                        gap: "0.75rem",
                      }}
                    >
                      <div>
                        <h3 style={{ fontSize: "1.05rem", fontWeight: 900, color: "#0f172a", margin: 0 }}>
                          📸 Activity Photos &amp; Hero Gallery
                        </h3>
                        <p style={{ fontSize: "0.82rem", color: "#64748b", margin: "0.2rem 0 0" }}>
                          Upload real activity photos from camera or gallery. The first photo is your listing cover.
                        </p>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <input
                          ref={imageInputRef}
                          type="file"
                          multiple
                          accept="image/*"
                          style={{ display: "none" }}
                          onChange={handleImageFilesUpload}
                        />
                        <button
                          type="button"
                          disabled={isUploadingImage}
                          onClick={() => imageInputRef.current?.click()}
                          style={{
                            padding: "0.65rem 1.25rem",
                            borderRadius: "12px",
                            border: "none",
                            background: "#0284c7",
                            color: "#ffffff",
                            fontWeight: 800,
                            fontSize: "0.85rem",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: "0.4rem",
                            boxShadow: "0 2px 8px rgba(2,132,199,0.25)",
                          }}
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>
                            upload
                          </span>
                          <span>{isUploadingImage ? "Uploading Photos..." : "Upload Photos"}</span>
                        </button>
                      </div>
                    </div>

                    {/* Manual Image URL Input (Optional Fallback) */}
                    <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem" }}>
                      <input
                        type="text"
                        placeholder="Or paste external HTTPS image URL..."
                        value={manualImageUrl}
                        onChange={(e) => setManualImageUrl(e.target.value)}
                        style={{
                          flex: 1,
                          padding: "0.65rem 0.95rem",
                          fontSize: "0.88rem",
                          borderRadius: "12px",
                          border: "1px solid #cbd5e1",
                          outline: "none",
                          background: "#f8fafc",
                        }}
                      />
                      <button
                        type="button"
                        onClick={handleAddManualImage}
                        style={{
                          padding: "0.65rem 1.1rem",
                          borderRadius: "12px",
                          border: "1px solid #0284c7",
                          background: "#ffffff",
                          color: "#0284c7",
                          fontWeight: 800,
                          fontSize: "0.85rem",
                          cursor: "pointer",
                        }}
                      >
                        Add URL
                      </button>
                    </div>

                    {/* Uploaded Images Grid */}
                    {images.length === 0 ? (
                      <div
                        onClick={() => imageInputRef.current?.click()}
                        style={{
                          padding: "2.5rem 1rem",
                          textAlign: "center",
                          border: "2px dashed #cbd5e1",
                          borderRadius: "16px",
                          background: "#f8fafc",
                          cursor: "pointer",
                        }}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: "36px", color: "#94a3b8" }}>
                          add_photo_alternate
                        </span>
                        <p style={{ margin: "0.5rem 0 0", fontSize: "0.88rem", fontWeight: 700, color: "#64748b" }}>
                          Click here to upload photos (PNG, JPG, WebP)
                        </p>
                      </div>
                    ) : (
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
                          gap: "1rem",
                        }}
                      >
                        {images.map((img, idx) => (
                          <div
                            key={idx}
                            style={{
                              position: "relative",
                              height: "140px",
                              borderRadius: "14px",
                              overflow: "hidden",
                              border: idx === 0 ? "2.5px solid #0284c7" : "1px solid #e2e8f0",
                              boxShadow: "0 2px 6px rgba(0,0,0,0.06)",
                            }}
                          >
                            <img
                              src={img}
                              alt=""
                              style={{ width: "100%", height: "100%", objectFit: "cover" }}
                            />
                            {/* Badges & Actions */}
                            <div
                              style={{
                                position: "absolute",
                                top: "6px",
                                left: "6px",
                                background: idx === 0 ? "#0284c7" : "rgba(15, 23, 42, 0.75)",
                                color: "#ffffff",
                                padding: "2px 8px",
                                borderRadius: "6px",
                                fontSize: "0.68rem",
                                fontWeight: 800,
                              }}
                            >
                              {idx === 0 ? "Cover" : `#${idx + 1}`}
                            </div>

                            <div
                              style={{
                                position: "absolute",
                                bottom: "6px",
                                right: "6px",
                                display: "flex",
                                gap: "4px",
                              }}
                            >
                              {idx !== 0 && (
                                <button
                                  type="button"
                                  onClick={() => setCoverImage(idx)}
                                  title="Make Cover"
                                  style={{
                                    background: "rgba(2, 132, 199, 0.9)",
                                    border: "none",
                                    borderRadius: "6px",
                                    padding: "4px",
                                    cursor: "pointer",
                                    color: "#ffffff",
                                    display: "flex",
                                  }}
                                >
                                  <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>
                                    star
                                  </span>
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => removeImage(idx)}
                                title="Remove photo"
                                style={{
                                  background: "rgba(239, 68, 68, 0.9)",
                                  border: "none",
                                  borderRadius: "6px",
                                  padding: "4px",
                                  cursor: "pointer",
                                  color: "#ffffff",
                                  display: "flex",
                                }}
                              >
                                <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>
                                  delete
                                </span>
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* 2. VIDEO SECTION */}
                  <div
                    style={{
                      background: "#ffffff",
                      padding: "1.5rem",
                      borderRadius: "20px",
                      border: "1px solid #e2e8f0",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        marginBottom: "1rem",
                        flexWrap: "wrap",
                        gap: "0.75rem",
                      }}
                    >
                      <div>
                        <h3 style={{ fontSize: "1.05rem", fontWeight: 900, color: "#0f172a", margin: 0 }}>
                          🎥 Activity Teaser Video
                        </h3>
                        <p style={{ fontSize: "0.82rem", color: "#64748b", margin: "0.2rem 0 0" }}>
                          Upload an action teaser video (MP4, WebM) or paste a stream link.
                        </p>
                      </div>

                      <div>
                        <input
                          ref={videoInputRef}
                          type="file"
                          accept="video/mp4,video/webm,video/quicktime,video/*"
                          style={{ display: "none" }}
                          onChange={handleVideoFileUpload}
                        />
                        <button
                          type="button"
                          disabled={isUploadingVideo}
                          onClick={() => videoInputRef.current?.click()}
                          style={{
                            padding: "0.65rem 1.25rem",
                            borderRadius: "12px",
                            border: "none",
                            background: "#8b5cf6",
                            color: "#ffffff",
                            fontWeight: 800,
                            fontSize: "0.85rem",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: "0.4rem",
                            boxShadow: "0 2px 8px rgba(139,92,246,0.25)",
                          }}
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>
                            movie
                          </span>
                          <span>{isUploadingVideo ? "Uploading Video..." : "Upload Video File"}</span>
                        </button>
                      </div>
                    </div>

                    <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem" }}>
                      <input
                        type="text"
                        placeholder="Or enter video URL (Cloud Storage, Vimeo, YouTube)..."
                        value={videoUrl}
                        onChange={(e) => setVideoUrl(e.target.value)}
                        style={{
                          flex: 1,
                          padding: "0.65rem 0.95rem",
                          fontSize: "0.88rem",
                          borderRadius: "12px",
                          border: "1px solid #cbd5e1",
                          outline: "none",
                          background: "#f8fafc",
                        }}
                      />
                      {videoUrl && (
                        <button
                          type="button"
                          onClick={() => setVideoUrl("")}
                          style={{
                            padding: "0.65rem 1rem",
                            borderRadius: "12px",
                            border: "none",
                            background: "rgba(239, 68, 68, 0.1)",
                            color: "#ef4444",
                            fontWeight: 800,
                            fontSize: "0.85rem",
                            cursor: "pointer",
                          }}
                        >
                          Clear
                        </button>
                      )}
                    </div>

                    {videoUrl && (
                      <div
                        style={{
                          padding: "1rem",
                          background: "#f8fafc",
                          borderRadius: "14px",
                          border: "1px solid #e2e8f0",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                          <span className="material-symbols-outlined" style={{ color: "#8b5cf6", fontSize: "28px" }}>
                            play_circle
                          </span>
                          <div>
                            <strong style={{ fontSize: "0.88rem", color: "#0f172a", display: "block" }}>
                              Active Teaser Video
                            </strong>
                            <a
                              href={videoUrl}
                              target="_blank"
                              rel="noreferrer"
                              style={{ fontSize: "0.75rem", color: "#0284c7", wordBreak: "break-all" }}
                            >
                              {videoUrl}
                            </a>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 3. DOCUMENTS, PERMITS & CERTIFICATIONS SECTION */}
                  <div
                    style={{
                      background: "#ffffff",
                      padding: "1.5rem",
                      borderRadius: "20px",
                      border: "1px solid #e2e8f0",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        marginBottom: "1rem",
                        flexWrap: "wrap",
                        gap: "0.75rem",
                      }}
                    >
                      <div>
                        <h3 style={{ fontSize: "1.05rem", fontWeight: 900, color: "#0f172a", margin: 0 }}>
                          📄 Safety Documents, Permits &amp; Certifications
                        </h3>
                        <p style={{ fontSize: "0.82rem", color: "#64748b", margin: "0.2rem 0 0" }}>
                          Upload instructor certifications, forest permits, liability forms, and guidelines (PDF, DOC).
                        </p>
                      </div>

                      <div>
                        <input
                          ref={docInputRef}
                          type="file"
                          multiple
                          accept=".pdf,.doc,.docx,application/pdf"
                          style={{ display: "none" }}
                          onChange={handleDocFilesUpload}
                        />
                        <button
                          type="button"
                          disabled={isUploadingDoc}
                          onClick={() => docInputRef.current?.click()}
                          style={{
                            padding: "0.65rem 1.25rem",
                            borderRadius: "12px",
                            border: "none",
                            background: "#059669",
                            color: "#ffffff",
                            fontWeight: 800,
                            fontSize: "0.85rem",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: "0.4rem",
                            boxShadow: "0 2px 8px rgba(5,150,105,0.25)",
                          }}
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>
                            upload_file
                          </span>
                          <span>{isUploadingDoc ? "Uploading Docs..." : "Upload Documents"}</span>
                        </button>
                      </div>
                    </div>

                    {documents.length === 0 ? (
                      <div
                        onClick={() => docInputRef.current?.click()}
                        style={{
                          padding: "2rem 1rem",
                          textAlign: "center",
                          border: "2px dashed #cbd5e1",
                          borderRadius: "16px",
                          background: "#f8fafc",
                          cursor: "pointer",
                        }}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: "32px", color: "#94a3b8" }}>
                          description
                        </span>
                        <p style={{ margin: "0.4rem 0 0", fontSize: "0.85rem", fontWeight: 700, color: "#64748b" }}>
                          No documents uploaded. Click to upload certifications or safety guidelines.
                        </p>
                      </div>
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                        {documents.map((doc, idx) => (
                          <div
                            key={idx}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              background: "#f8fafc",
                              padding: "0.75rem 1rem",
                              borderRadius: "12px",
                              border: "1px solid #e2e8f0",
                            }}
                          >
                            <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                              <span
                                className="material-symbols-outlined"
                                style={{ color: "#059669", fontSize: "22px" }}
                              >
                                picture_as_pdf
                              </span>
                              <span style={{ fontSize: "0.88rem", fontWeight: 700, color: "#0f172a" }}>
                                {doc.name}
                              </span>
                            </div>

                            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                              <a
                                href={doc.url}
                                target="_blank"
                                rel="noreferrer"
                                style={{
                                  padding: "0.45rem 0.85rem",
                                  borderRadius: "8px",
                                  border: "1px solid #cbd5e1",
                                  background: "#ffffff",
                                  color: "#0284c7",
                                  fontWeight: 700,
                                  fontSize: "0.78rem",
                                  textDecoration: "none",
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "0.25rem",
                                }}
                              >
                                <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>
                                  visibility
                                </span>
                                <span>View</span>
                              </a>
                              <button
                                type="button"
                                onClick={() => removeDocument(idx)}
                                style={{
                                  padding: "0.45rem",
                                  borderRadius: "8px",
                                  border: "none",
                                  background: "rgba(239, 68, 68, 0.1)",
                                  color: "#ef4444",
                                  cursor: "pointer",
                                }}
                                title="Remove document"
                              >
                                <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>
                                  delete
                                </span>
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 7: GUIDE BIO */}
              {activeTab === "guidelines" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem" }}>
                    <div>
                      <label
                        style={{
                          fontSize: "0.78rem",
                          fontWeight: 800,
                          color: "#334155",
                          textTransform: "uppercase",
                          display: "block",
                          marginBottom: "0.4rem",
                        }}
                      >
                        Lead Guide / Host Name
                      </label>
                      <input
                        type="text"
                        value={hostName}
                        onChange={(e) => setHostName(e.target.value)}
                        placeholder="e.g. Captain Aryan Sharma"
                        style={{
                          width: "100%",
                          padding: "0.85rem 1.1rem",
                          fontSize: "0.92rem",
                          borderRadius: "14px",
                          border: "1px solid #cbd5e1",
                          outline: "none",
                          background: "#ffffff",
                        }}
                      />
                    </div>
                    <div>
                      <label
                        style={{
                          fontSize: "0.78rem",
                          fontWeight: 800,
                          color: "#334155",
                          textTransform: "uppercase",
                          display: "block",
                          marginBottom: "0.4rem",
                        }}
                      >
                        Guide Contact Phone Number
                      </label>
                      <input
                        type="text"
                        value={hostPhone}
                        onChange={(e) => setHostPhone(e.target.value)}
                        placeholder="e.g. +91 98765 43210"
                        style={{
                          width: "100%",
                          padding: "0.85rem 1.1rem",
                          fontSize: "0.92rem",
                          borderRadius: "14px",
                          border: "1px solid #cbd5e1",
                          outline: "none",
                          background: "#ffffff",
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      style={{
                        fontSize: "0.78rem",
                        fontWeight: 800,
                        color: "#334155",
                        textTransform: "uppercase",
                        display: "block",
                        marginBottom: "0.4rem",
                      }}
                    >
                      Instructor Bio &amp; Certifications
                    </label>
                    <textarea
                      rows={3}
                      value={hostBio}
                      onChange={(e) => setHostBio(e.target.value)}
                      placeholder="Describe guide certifications, wilderness emergency training, and years of local navigation experience..."
                      style={{
                        width: "100%",
                        padding: "1rem",
                        fontSize: "0.92rem",
                        borderRadius: "14px",
                        border: "1px solid #cbd5e1",
                        outline: "none",
                        background: "#ffffff",
                      }}
                    />
                  </div>
                </div>
              )}

              {/* MODAL BOTTOM BAR */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  paddingTop: "1.25rem",
                  borderTop: "1px solid #e2e8f0",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <span style={{ fontSize: "0.82rem", color: "#64748b" }}>Tariff / Person:</span>
                  <strong style={{ color: "#0284c7", fontWeight: 900, fontSize: "1.1rem" }}>
                    ₹{Number(basePrice || 0).toLocaleString("en-IN")}/person
                  </strong>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    style={{
                      padding: "0.75rem 1.5rem",
                      borderRadius: "14px",
                      border: "1px solid #cbd5e1",
                      background: "#f8fafc",
                      color: "#475569",
                      fontWeight: 800,
                      fontSize: "0.92rem",
                      cursor: "pointer",
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    style={{
                      padding: "0.75rem 2.25rem",
                      borderRadius: "14px",
                      background: "linear-gradient(135deg, #0284c7 0%, #0369a1 100%)",
                      color: "#ffffff",
                      fontWeight: 900,
                      fontSize: "0.95rem",
                      border: "none",
                      cursor: "pointer",
                      boxShadow: "0 4px 16px rgba(2,132,199,0.35)",
                      opacity: saving ? 0.6 : 1,
                    }}
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
