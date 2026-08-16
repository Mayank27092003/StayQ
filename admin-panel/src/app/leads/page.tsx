"use client";

import React, { useState, useEffect } from "react";
import axios from "axios";

export interface HostLead {
  id: string;
  hostName: string;
  propertyName: string;
  city: string;
  state?: string;
  country?: string;
  instagramHandle: string;
  phone: string;
  email?: string;
  channel: "INSTAGRAM" | "WHATSAPP" | "DIRECT_CALL" | "AIRBNB" | "GOOGLE_MAPS" | "WEBSITE_FORM" | "OFFLINE_EVENT";
  status: "NEW" | "INVITED" | "CONTACTED" | "FORM_SUBMITTED" | "NEGOTIATING" | "ONBOARDED" | "REJECTED";
  expectedPrice?: number;
  notes?: string;
  createdAt?: string;
}

const COUNTRY_DIAL_CODES = [
  { code: "IN", name: "India", flag: "🇮🇳", dial: "+91" },
  { code: "AE", name: "UAE", flag: "🇦🇪", dial: "+971" },
  { code: "US", name: "USA", flag: "🇺🇸", dial: "+1" },
  { code: "GB", name: "UK", flag: "🇬🇧", dial: "+44" },
  { code: "TH", name: "Thailand", flag: "🇹🇭", dial: "+66" },
  { code: "ID", name: "Bali (ID)", flag: "🇮🇩", dial: "+62" },
  { code: "SG", name: "Singapore", flag: "🇸🇬", dial: "+65" },
  { code: "MV", name: "Maldives", flag: "🇲🇻", dial: "+960" },
  { code: "LK", name: "Sri Lanka", flag: "🇱🇰", dial: "+94" },
  { code: "MY", name: "Malaysia", flag: "🇲🇾", dial: "+60" },
];

export default function HostLeadsPage() {
  const [leads, setLeads] = useState<HostLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [selectedLeadForShare, setSelectedLeadForShare] = useState<HostLead | null>(null);
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);
  const [convertedNotice, setConvertedNotice] = useState<string | null>(null);

  // New Lead Form State
  const [newHostName, setNewHostName] = useState("");
  const [newPropertyName, setNewPropertyName] = useState("");
  const [newCity, setNewCity] = useState("Goa");
  const [newCountry, setNewCountry] = useState("India");
  const [newInstagram, setNewInstagram] = useState("");
  const [countryDial, setCountryDial] = useState("+91");
  const [rawPhone, setRawPhone] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newChannel, setNewChannel] = useState<HostLead["channel"]>("INSTAGRAM");
  const [newStatus, setNewStatus] = useState<HostLead["status"]>("INVITED");
  const [newPrice, setNewPrice] = useState<number>(12000);
  const [newNotes, setNewNotes] = useState("");

  const publicInviteUrl = "https://stayq.space/#/host-invite";

  const fetchLeads = async () => {
    try {
      setLoading(true);
      let localLeads: HostLead[] = [];
      try {
        const stored = localStorage.getItem("stayq_admin_host_leads");
        if (stored) {
          const parsed = JSON.parse(stored);
          // Filter out any old mock demo leads
          localLeads = Array.isArray(parsed) ? parsed.filter((l: any) => !l.id?.startsWith("lead-init-")) : [];
        }
      } catch {}

      const res = await axios.get("/api/v1/host-leads");
      if (Array.isArray(res.data) && res.data.length > 0) {
        const merged = res.data.map((l: any) => {
          const local = localLeads.find((ll) => ll.id === l.id);
          return local ? { ...l, ...local } : l;
        });
        const localOnly = localLeads.filter((ll) => !res.data.some((l: any) => l.id === ll.id));
        const finalLeads = [...localOnly, ...merged];
        setLeads(finalLeads);
        try {
          localStorage.setItem("stayq_admin_host_leads", JSON.stringify(finalLeads));
        } catch {}
      } else {
        setLeads(localLeads);
        try {
          localStorage.setItem("stayq_admin_host_leads", JSON.stringify(localLeads));
        } catch {}
      }
    } catch {
      try {
        const stored = localStorage.getItem("stayq_admin_host_leads");
        if (stored) {
          const parsed = JSON.parse(stored);
          const clean = Array.isArray(parsed) ? parsed.filter((l: any) => !l.id?.startsWith("lead-init-")) : [];
          setLeads(clean);
        } else {
          setLeads([]);
        }
      } catch {
        setLeads([]);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  const handleCreateLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHostName.trim() || !newPropertyName.trim()) return;

    setSaving(true);
    const fullPhone = rawPhone.trim() ? `${countryDial} ${rawPhone.trim()}` : "";
    const cleanInsta = newInstagram.trim() ? (newInstagram.startsWith("@") ? newInstagram.trim() : `@${newInstagram.trim()}`) : "";

    const newLead: HostLead = {
      id: `lead-${Date.now()}`,
      hostName: newHostName.trim(),
      propertyName: newPropertyName.trim(),
      city: newCity.trim() || "Goa",
      country: newCountry,
      instagramHandle: cleanInsta,
      phone: fullPhone,
      email: newEmail.trim() || undefined,
      channel: newChannel,
      status: newStatus,
      expectedPrice: Number(newPrice),
      notes: newNotes.trim(),
      createdAt: new Date().toISOString(),
    };

    const nextLeads = [newLead, ...leads];
    setLeads(nextLeads);

    try {
      localStorage.setItem("stayq_admin_host_leads", JSON.stringify(nextLeads));
      window.dispatchEvent(new Event("stayq_host_leads_updated"));
    } catch {}

    try {
      await axios.post("/api/v1/host-leads", newLead);
    } catch {
      // Handled in client storage
    } finally {
      setSaving(false);
      setIsAddModalOpen(false);
      // Reset form
      setNewHostName("");
      setNewPropertyName("");
      setNewCity("Goa");
      setNewInstagram("");
      setRawPhone("");
      setNewEmail("");
      setNewNotes("");
    }
  };

  const handleUpdateStatus = async (leadId: string, updatedStatus: HostLead["status"]) => {
    const updated = leads.map((l) => (l.id === leadId ? { ...l, status: updatedStatus } : l));
    setLeads(updated);

    try {
      localStorage.setItem("stayq_admin_host_leads", JSON.stringify(updated));
    } catch {}

    try {
      await axios.patch(`/api/v1/host-leads/${leadId}/status`, { status: updatedStatus });
    } catch {}
  };

  const handleConvertToProperty = (lead: HostLead) => {
    try {
      const stored = localStorage.getItem("stayq_admin_properties");
      const currentProps = stored ? JSON.parse(stored) : [];

      const newProperty = {
        id: `stay-${lead.id}`,
        title: lead.propertyName,
        description: lead.notes || `Exclusive property hosted by ${lead.hostName}.`,
        city: lead.city || "Goa",
        state: lead.city || "Goa",
        country: lead.country || "India",
        basePrice: lead.expectedPrice || 10000,
        cleaningFee: 1000,
        status: "ACTIVE",
        category: { name: "Villas" },
        maxGuests: 6,
        bedrooms: 3,
        beds: 3,
        bathrooms: 3,
        amenities: ["High-Speed Wi-Fi", "Private Pool", "Air Conditioning", "Free Parking"],
        imageUrls: ["/images/villa_1.jpg"],
        heroImage: "/images/villa_1.jpg",
        host: {
          firstName: lead.hostName.split(" ")[0] || "Verified",
          lastName: lead.hostName.split(" ").slice(1).join(" ") || "Host",
          email: lead.email || "host@stayq.space",
          phone: lead.phone || "+91 99999 99999",
        },
      };

      const nextProps = [newProperty, ...currentProps];
      localStorage.setItem("stayq_admin_properties", JSON.stringify(nextProps));
      window.dispatchEvent(new Event("stayq_properties_updated"));

      handleUpdateStatus(lead.id, "ONBOARDED");
      setConvertedNotice(`🎉 "${lead.propertyName}" converted & added to live Properties Catalog!`);
      setTimeout(() => setConvertedNotice(null), 4000);
    } catch {
      alert("Converted successfully!");
    }
  };

  const getEmailSubject = (lead?: HostLead | null) => {
    const prop = lead?.propertyName ? ` for ${lead.propertyName}` : "";
    return `Partnership Invitation from Stay Q${prop} (0% Commission)`;
  };

  const getEmailBody = (lead?: HostLead | null) => {
    const host = lead?.hostName || "Host";
    const prop = lead?.propertyName ? ` "${lead.propertyName}"` : " your boutique property";
    return `Hi ${host},\n\nWe came across${prop} and are truly impressed by the architecture and guest experience.\n\nWe would love to feature your listing on Stay Q — India's premier luxury villa & curated stay collection.\n\nWhy Partner with Stay Q:\n• 0% Host Commission (Keep 100% of your earnings)\n• ₹10,00,000 Verified Damage Protection\n• Direct Guest-to-Host Verification & Instant Payouts\n• Automated Calendar Sync (Airbnb, VRBO, Direct)\n\nYou can onboard your property directly in 2 minutes here:\n${publicInviteUrl}\n\nFeel free to reply directly to this email or reach out on WhatsApp at +91 98765 43210.\n\nWarm regards,\nShayan Mandal\nSuper Administrator, Stay Q\nhttps://stayq.space`;
  };

  const getWhatsAppPitch = (lead?: HostLead | null) => {
    const host = lead?.hostName || "Host";
    const prop = lead?.propertyName ? ` for *${lead.propertyName}*` : "";
    return `Hi ${host}! ✨ We love your property${prop} and would love to partner with you on Stay Q (India's premier luxury stay collection).\n\nKey Host Benefits:\n✅ 0% Host Commission\n✅ ₹10,00,000 Damage Protection\n✅ Automated Direct Bank Payouts\n\nSubmit your property in 1 minute here:\n${publicInviteUrl}\n\nLooking forward to partnering! 🚀`;
  };

  const getInstagramPitch = (lead?: HostLead | null) => {
    const prop = lead?.propertyName ? ` "${lead.propertyName}"` : " your property";
    return `Hey! Loved${prop} ✨ We are onboarding exclusive handpicked stays on Stay Q with 0% brokerage fee and ₹10,00,000 damage protection. You can submit details directly in 1 minute here: ${publicInviteUrl}`;
  };

  const filteredLeads = leads.filter((l) => {
    if (filterStatus !== "ALL" && l.status !== filterStatus) return false;
    if (searchQuery.trim() !== "") {
      const q = searchQuery.toLowerCase().trim();
      return (
        l.hostName?.toLowerCase().includes(q) ||
        l.propertyName?.toLowerCase().includes(q) ||
        l.city?.toLowerCase().includes(q) ||
        l.email?.toLowerCase().includes(q) ||
        l.instagramHandle?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div style={{ width: "100%", maxWidth: "1400px", margin: "0 auto", padding: "1.5rem" }}>
      {/* Header Bar */}
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: "1rem", marginBottom: "1.5rem", paddingBottom: "1.5rem", borderBottom: "1px solid #e2e8f0" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "#9D00FF", fontWeight: 700, fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.25rem" }}>
            <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>group_add</span>
            Growth &amp; Host Acquisition CRM
          </div>
          <h1 style={{ fontSize: "1.75rem", fontWeight: 800, color: "#0f172a", margin: 0 }}>
            Host Leads &amp; Outreach Pipeline
          </h1>
          <p style={{ fontSize: "0.9rem", color: "#64748b", margin: "0.25rem 0 0 0" }}>
            Invite villa owners via Email, WhatsApp &amp; Instagram, track onboarding submissions, and convert directly to live listings.
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
          <button
            type="button"
            onClick={() => {
              setSelectedLeadForShare(null);
              setIsShareModalOpen(true);
            }}
            style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.6rem 1.2rem", borderRadius: "12px", border: "1px solid #9D00FF", color: "#9D00FF", background: "#fbf5ff", fontWeight: 700, fontSize: "0.85rem", cursor: "pointer" }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>share</span>
            Share Public Invite Kit
          </button>

          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.6rem 1.25rem", borderRadius: "12px", background: "#9D00FF", color: "#ffffff", fontWeight: 700, fontSize: "0.85rem", border: "none", cursor: "pointer", boxShadow: "0 4px 12px rgba(157, 0, 255, 0.25)" }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>person_add</span>
            Add Host Lead
          </button>
        </div>
      </div>

      {convertedNotice && (
        <div style={{ background: "#ecfdf5", border: "1px solid #a7f3d0", color: "#065f46", padding: "1rem", borderRadius: "14px", fontWeight: 700, fontSize: "0.9rem", marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <span className="material-symbols-outlined">check_circle</span>
          {convertedNotice}
        </div>
      )}

      {/* KPI Metrics */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
        <div style={{ background: "#ffffff", padding: "1.25rem", borderRadius: "16px", border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
          <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>Total Leads</span>
          <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "#0f172a", marginTop: "0.25rem" }}>{leads.length}</div>
          <span style={{ fontSize: "0.75rem", color: "#9D00FF", fontWeight: 600 }}>Active Pipeline</span>
        </div>

        <div style={{ background: "#ffffff", padding: "1.25rem", borderRadius: "16px", border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
          <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>Forms Submitted</span>
          <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "#0284c7", marginTop: "0.25rem" }}>
            {leads.filter((l) => l.status === "FORM_SUBMITTED").length}
          </div>
          <span style={{ fontSize: "0.75rem", color: "#64748b" }}>Ready for Review</span>
        </div>

        <div style={{ background: "#ffffff", padding: "1.25rem", borderRadius: "16px", border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
          <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>Onboarded &amp; Live</span>
          <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "#059669", marginTop: "0.25rem" }}>
            {leads.filter((l) => l.status === "ONBOARDED").length}
          </div>
          <span style={{ fontSize: "0.75rem", color: "#059669", fontWeight: 600 }}>0% Commission Stays</span>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: "1rem", marginBottom: "1.25rem", background: "#ffffff", padding: "0.85rem 1.25rem", borderRadius: "16px", border: "1px solid #e2e8f0" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flex: 1, minWidth: "260px" }}>
          <span className="material-symbols-outlined" style={{ color: "#64748b" }}>search</span>
          <input
            type="text"
            placeholder="Search host, property, city, email, or @instagram..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ width: "100%", border: "none", outline: "none", fontSize: "0.88rem", background: "transparent" }}
          />
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", overflowX: "auto" }}>
          {["ALL", "NEW", "INVITED", "CONTACTED", "FORM_SUBMITTED", "ONBOARDED"].map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setFilterStatus(st)}
              style={{
                padding: "0.45rem 0.85rem",
                borderRadius: "10px",
                fontSize: "0.78rem",
                fontWeight: 700,
                border: "none",
                cursor: "pointer",
                background: filterStatus === st ? "#9D00FF" : "#f1f5f9",
                color: filterStatus === st ? "#ffffff" : "#475569",
                transition: "all 0.15s ease",
              }}
            >
              {st.replace("_", " ")}
            </button>
          ))}
        </div>
      </div>

      {/* Leads Table */}
      <div style={{ background: "#ffffff", borderRadius: "20px", border: "1px solid #e2e8f0", overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
        {loading ? (
          <div style={{ padding: "3rem", textAlign: "center", color: "#64748b" }}>Loading outreach leads...</div>
        ) : filteredLeads.length === 0 ? (
          <div style={{ padding: "3rem", textAlign: "center", color: "#64748b" }}>
            <span className="material-symbols-outlined" style={{ fontSize: "40px", color: "#cbd5e1", display: "block", marginBottom: "0.5rem" }}>group_add</span>
            No leads found. Click <strong>Add Host Lead</strong> to expand your inventory!
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.88rem" }}>
              <thead>
                <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0", color: "#475569", fontWeight: 700, fontSize: "0.75rem", textTransform: "uppercase" }}>
                  <th style={{ padding: "1rem 1.25rem" }}>Host &amp; Property</th>
                  <th style={{ padding: "1rem" }}>Contact Details</th>
                  <th style={{ padding: "1rem" }}>Channel</th>
                  <th style={{ padding: "1rem" }}>Nightly Rate</th>
                  <th style={{ padding: "1rem" }}>Pipeline Stage</th>
                  <th style={{ padding: "1rem 1.25rem", textAlign: "right" }}>Direct Outreach &amp; Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredLeads.map((l) => {
                  const emailLink = l.email ? `mailto:${l.email}?subject=${encodeURIComponent(getEmailSubject(l))}&body=${encodeURIComponent(getEmailBody(l))}` : null;
                  const waNumber = l.phone?.replace(/[^0-9]/g, "");
                  const waLink = waNumber ? `https://wa.me/${waNumber}?text=${encodeURIComponent(getWhatsAppPitch(l))}` : null;
                  const instaLink = l.instagramHandle ? `https://instagram.com/${l.instagramHandle.replace("@", "")}` : null;

                  return (
                    <tr key={l.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                      <td style={{ padding: "1rem 1.25rem" }}>
                        <div style={{ fontWeight: 800, color: "#0f172a" }}>{l.propertyName}</div>
                        <div style={{ fontSize: "0.8rem", color: "#64748b", marginTop: "0.15rem" }}>
                          Host: <strong style={{ color: "#334155" }}>{l.hostName}</strong> · {l.city}, {l.country || "India"}
                        </div>
                      </td>

                      <td style={{ padding: "1rem" }}>
                        {l.email ? (
                          <div style={{ display: "flex", alignItems: "center", gap: "0.3rem", fontSize: "0.8rem", color: "#0284c7" }}>
                            <span className="material-symbols-outlined" style={{ fontSize: "15px" }}>mail</span>
                            <a href={emailLink || "#"} style={{ color: "inherit", textDecoration: "none" }}>{l.email}</a>
                          </div>
                        ) : (
                          <span style={{ fontSize: "0.75rem", color: "#94a3b8" }}>No email specified</span>
                        )}
                        {l.phone && (
                          <div style={{ display: "flex", alignItems: "center", gap: "0.3rem", fontSize: "0.8rem", color: "#475569", marginTop: "0.2rem" }}>
                            <span className="material-symbols-outlined" style={{ fontSize: "15px" }}>call</span>
                            <span>{l.phone}</span>
                          </div>
                        )}
                        {l.instagramHandle && (
                          <div style={{ display: "flex", alignItems: "center", gap: "0.3rem", fontSize: "0.78rem", color: "#db2777", marginTop: "0.2rem" }}>
                            <span>📸</span>
                            <a href={instaLink || "#"} target="_blank" rel="noopener noreferrer" style={{ color: "inherit", textDecoration: "none", fontWeight: 700 }}>
                              {l.instagramHandle}
                            </a>
                          </div>
                        )}
                      </td>

                      <td style={{ padding: "1rem" }}>
                        <span style={{ padding: "0.25rem 0.6rem", borderRadius: "8px", background: "#f1f5f9", fontWeight: 700, fontSize: "0.75rem", color: "#475569" }}>
                          {l.channel}
                        </span>
                      </td>

                      <td style={{ padding: "1rem", fontWeight: 800, color: "#0f172a" }}>
                        ₹{(l.expectedPrice || 0).toLocaleString()}
                        <span style={{ fontSize: "0.75rem", fontWeight: 500, color: "#64748b" }}> /night</span>
                      </td>

                      <td style={{ padding: "1rem" }}>
                        <select
                          value={l.status}
                          onChange={(e) => handleUpdateStatus(l.id, e.target.value as any)}
                          style={{
                            padding: "0.35rem 0.65rem",
                            borderRadius: "8px",
                            fontSize: "0.78rem",
                            fontWeight: 800,
                            border: "1px solid #cbd5e1",
                            background: l.status === "ONBOARDED" ? "#ecfdf5" : l.status === "FORM_SUBMITTED" ? "#e0f2fe" : "#ffffff",
                            color: l.status === "ONBOARDED" ? "#059669" : l.status === "FORM_SUBMITTED" ? "#0284c7" : "#0f172a",
                            cursor: "pointer",
                            outline: "none",
                          }}
                        >
                          <option value="NEW">NEW</option>
                          <option value="INVITED">INVITED</option>
                          <option value="CONTACTED">CONTACTED</option>
                          <option value="FORM_SUBMITTED">FORM SUBMITTED</option>
                          <option value="NEGOTIATING">NEGOTIATING</option>
                          <option value="ONBOARDED">ONBOARDED (Live)</option>
                          <option value="REJECTED">REJECTED</option>
                        </select>
                      </td>

                      <td style={{ padding: "1rem 1.25rem", textAlign: "right" }}>
                        <div style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem" }}>
                          {emailLink && (
                            <a
                              href={emailLink}
                              title="Send Email Pitch"
                              style={{ padding: "0.4rem", borderRadius: "8px", background: "rgba(2, 132, 199, 0.1)", color: "#0284c7", display: "inline-flex", alignItems: "center", textDecoration: "none" }}
                            >
                              <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>mail</span>
                            </a>
                          )}

                          {waLink && (
                            <a
                              href={waLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              title="WhatsApp Message"
                              style={{ padding: "0.4rem", borderRadius: "8px", background: "rgba(16, 185, 129, 0.1)", color: "#059669", display: "inline-flex", alignItems: "center", textDecoration: "none" }}
                            >
                              <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>chat</span>
                            </a>
                          )}

                          <button
                            type="button"
                            onClick={() => {
                              setSelectedLeadForShare(l);
                              setIsShareModalOpen(true);
                            }}
                            title="Outreach Kit & DM Text"
                            style={{ padding: "0.4rem", borderRadius: "8px", background: "rgba(157, 0, 255, 0.1)", color: "#9D00FF", border: "none", cursor: "pointer", display: "inline-flex", alignItems: "center" }}
                          >
                            <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>send</span>
                          </button>

                          {l.status !== "ONBOARDED" && (
                            <button
                              type="button"
                              onClick={() => handleConvertToProperty(l)}
                              style={{ padding: "0.35rem 0.65rem", borderRadius: "8px", background: "#9D00FF", color: "#ffffff", border: "none", cursor: "pointer", fontWeight: 700, fontSize: "0.75rem", display: "inline-flex", alignItems: "center", gap: "0.2rem" }}
                            >
                              <span className="material-symbols-outlined" style={{ fontSize: "15px" }}>bolt</span>
                              Convert
                            </button>
                          )}
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

      {/* Outreach & Invite Kit Modal */}
      {isShareModalOpen && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, width: "100vw", height: "100vh", background: "rgba(15, 23, 42, 0.75)", backdropFilter: "blur(6px)", zIndex: 99999, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
          <div style={{ background: "#ffffff", borderRadius: "24px", maxWidth: "620px", width: "95vw", padding: "2rem", maxHeight: "90vh", overflowY: "auto", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.35)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem", paddingBottom: "0.75rem", borderBottom: "1px solid #e2e8f0" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <span className="material-symbols-outlined" style={{ color: "#9D00FF", fontSize: "26px" }}>share</span>
                <div>
                  <h3 style={{ fontSize: "1.2rem", fontWeight: 800, margin: 0, color: "#0f172a" }}>
                    Host Outreach Kit
                  </h3>
                  <span style={{ fontSize: "0.75rem", color: "#64748b" }}>
                    {selectedLeadForShare ? `Targeting: ${selectedLeadForShare.hostName} (${selectedLeadForShare.propertyName})` : "General Host Acquisition Link"}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsShareModalOpen(false)}
                style={{ background: "#f1f5f9", border: "none", borderRadius: "50%", width: "32px", height: "32px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#64748b" }}
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              {/* Public Link */}
              <div>
                <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "#475569", textTransform: "uppercase", display: "block", marginBottom: "0.35rem" }}>
                  Public Host Onboarding Form URL
                </label>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <input
                    type="text"
                    readOnly
                    value={publicInviteUrl}
                    style={{ flex: 1, padding: "0.6rem 0.85rem", fontSize: "0.85rem", borderRadius: "10px", border: "1px solid #cbd5e1", background: "#f8fafc", fontFamily: "monospace" }}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(publicInviteUrl);
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2000);
                    }}
                    style={{ padding: "0.6rem 1.2rem", borderRadius: "10px", background: copied ? "#10b981" : "#9D00FF", color: "#ffffff", fontWeight: 700, fontSize: "0.85rem", border: "none", cursor: "pointer" }}
                  >
                    {copied ? "Copied!" : "Copy URL"}
                  </button>
                </div>
              </div>

              {/* Email Pitch */}
              <div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.35rem" }}>
                  <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "#475569", textTransform: "uppercase" }}>
                    📧 Official Email Pitch (With 0% Commission Guarantee)
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(getEmailBody(selectedLeadForShare));
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2000);
                    }}
                    style={{ fontSize: "0.75rem", fontWeight: 700, color: "#9D00FF", background: "none", border: "none", cursor: "pointer" }}
                  >
                    Copy Email Text
                  </button>
                </div>
                <textarea
                  readOnly
                  rows={5}
                  value={getEmailBody(selectedLeadForShare)}
                  style={{ width: "100%", padding: "0.6rem", fontSize: "0.8rem", borderRadius: "10px", border: "1px solid #cbd5e1", background: "#f8fafc", color: "#334155" }}
                />
              </div>

              {/* WhatsApp Pitch */}
              <div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.35rem" }}>
                  <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "#475569", textTransform: "uppercase" }}>
                    💬 WhatsApp Outreach Message
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(getWhatsAppPitch(selectedLeadForShare));
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2000);
                    }}
                    style={{ fontSize: "0.75rem", fontWeight: 700, color: "#059669", background: "none", border: "none", cursor: "pointer" }}
                  >
                    Copy WhatsApp Text
                  </button>
                </div>
                <textarea
                  readOnly
                  rows={4}
                  value={getWhatsAppPitch(selectedLeadForShare)}
                  style={{ width: "100%", padding: "0.6rem", fontSize: "0.8rem", borderRadius: "10px", border: "1px solid #cbd5e1", background: "#f8fafc", color: "#334155" }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Lead Modal */}
      {isAddModalOpen && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, width: "100vw", height: "100vh", background: "rgba(15, 23, 42, 0.75)", backdropFilter: "blur(6px)", zIndex: 99999, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
          <div style={{ background: "#ffffff", borderRadius: "24px", maxWidth: "620px", width: "95vw", padding: "2rem", maxHeight: "90vh", overflowY: "auto", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.35)", border: "1px solid rgba(226, 232, 240, 0.8)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem", paddingBottom: "0.75rem", borderBottom: "1px solid #e2e8f0" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <span className="material-symbols-outlined" style={{ color: "#9D00FF", fontSize: "26px" }}>person_add</span>
                <h3 style={{ fontSize: "1.2rem", fontWeight: 800, margin: 0, color: "#0f172a" }}>
                  Add Host Outreach Lead
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                style={{ background: "#f1f5f9", border: "none", borderRadius: "50%", width: "32px", height: "32px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#64748b" }}
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleCreateLead} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div>
                  <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "#475569", textTransform: "uppercase", display: "block", marginBottom: "0.25rem" }}>Host Name *</label>
                  <input
                    type="text"
                    required
                    value={newHostName}
                    onChange={(e) => setNewHostName(e.target.value)}
                    placeholder="e.g. Vikram Malhotra"
                    style={{ width: "100%", padding: "0.6rem 0.85rem", fontSize: "0.88rem", borderRadius: "10px", border: "1px solid #cbd5e1", outline: "none", fontWeight: 700 }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "#475569", textTransform: "uppercase", display: "block", marginBottom: "0.25rem" }}>Property / Villa Name *</label>
                  <input
                    type="text"
                    required
                    value={newPropertyName}
                    onChange={(e) => setNewPropertyName(e.target.value)}
                    placeholder="e.g. Glass Pavilion Villa Candolim"
                    style={{ width: "100%", padding: "0.6rem 0.85rem", fontSize: "0.88rem", borderRadius: "10px", border: "1px solid #cbd5e1", outline: "none", fontWeight: 700 }}
                  />
                </div>
              </div>

              {/* Email & Phone */}
              <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: "1rem" }}>
                <div>
                  <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "#475569", textTransform: "uppercase", display: "block", marginBottom: "0.25rem" }}>
                    Host Official Email 📧 *
                  </label>
                  <input
                    type="email"
                    required
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="e.g. vikram@luxuryvillas.com"
                    style={{ width: "100%", padding: "0.6rem 0.85rem", fontSize: "0.88rem", borderRadius: "10px", border: "1px solid #cbd5e1", outline: "none" }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "#475569", textTransform: "uppercase", display: "block", marginBottom: "0.25rem" }}>
                    Phone / WhatsApp 💬
                  </label>
                  <div style={{ display: "flex", gap: "0.35rem" }}>
                    <select
                      value={countryDial}
                      onChange={(e) => setCountryDial(e.target.value)}
                      style={{ padding: "0.6rem 0.4rem", borderRadius: "10px", border: "1px solid #cbd5e1", background: "#f8fafc", fontSize: "0.85rem", fontWeight: 700 }}
                    >
                      {COUNTRY_DIAL_CODES.map((c) => (
                        <option key={c.code} value={c.dial}>{c.flag} {c.dial}</option>
                      ))}
                    </select>
                    <input
                      type="tel"
                      value={rawPhone}
                      onChange={(e) => setRawPhone(e.target.value)}
                      placeholder="98765 43210"
                      style={{ flex: 1, padding: "0.6rem 0.75rem", fontSize: "0.88rem", borderRadius: "10px", border: "1px solid #cbd5e1", outline: "none", fontFamily: "monospace" }}
                    />
                  </div>
                </div>
              </div>

              {/* City, Instagram & Nightly Price */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem" }}>
                <div>
                  <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "#475569", textTransform: "uppercase", display: "block", marginBottom: "0.25rem" }}>City / Location *</label>
                  <input
                    type="text"
                    required
                    value={newCity}
                    onChange={(e) => setNewCity(e.target.value)}
                    placeholder="e.g. Goa, Manali"
                    style={{ width: "100%", padding: "0.6rem 0.85rem", fontSize: "0.88rem", borderRadius: "10px", border: "1px solid #cbd5e1", outline: "none" }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "#475569", textTransform: "uppercase", display: "block", marginBottom: "0.25rem" }}>Instagram Handle</label>
                  <input
                    type="text"
                    value={newInstagram}
                    onChange={(e) => setNewInstagram(e.target.value)}
                    placeholder="@villa_stayq"
                    style={{ width: "100%", padding: "0.6rem 0.85rem", fontSize: "0.88rem", borderRadius: "10px", border: "1px solid #cbd5e1", outline: "none" }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "#475569", textTransform: "uppercase", display: "block", marginBottom: "0.25rem" }}>Expected Rate (₹)</label>
                  <input
                    type="number"
                    value={newPrice}
                    onChange={(e) => setNewPrice(Number(e.target.value))}
                    style={{ width: "100%", padding: "0.6rem 0.85rem", fontSize: "0.88rem", borderRadius: "10px", border: "1px solid #cbd5e1", outline: "none", fontFamily: "monospace", fontWeight: 700 }}
                  />
                </div>
              </div>

              {/* Outreach Channel & Initial Status */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div>
                  <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "#475569", textTransform: "uppercase", display: "block", marginBottom: "0.25rem" }}>Acquisition Channel</label>
                  <select
                    value={newChannel}
                    onChange={(e) => setNewChannel(e.target.value as any)}
                    style={{ width: "100%", padding: "0.6rem 0.85rem", fontSize: "0.88rem", borderRadius: "10px", border: "1px solid #cbd5e1", outline: "none", fontWeight: 700 }}
                  >
                    <option value="INSTAGRAM">📸 Instagram DM / Reel</option>
                    <option value="WHATSAPP">💬 WhatsApp Outreach</option>
                    <option value="DIRECT_CALL">📞 Direct Phone Call</option>
                    <option value="AIRBNB">🏠 Airbnb Host Reachout</option>
                    <option value="GOOGLE_MAPS">🗺️ Google Maps / Web</option>
                    <option value="WEBSITE_FORM">🌐 Website Inbound Form</option>
                    <option value="OFFLINE_EVENT">🤝 In-Person / Field</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "#475569", textTransform: "uppercase", display: "block", marginBottom: "0.25rem" }}>Pipeline Stage</label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value as any)}
                    style={{ width: "100%", padding: "0.6rem 0.85rem", fontSize: "0.88rem", borderRadius: "10px", border: "1px solid #cbd5e1", outline: "none", fontWeight: 700 }}
                  >
                    <option value="NEW">NEW (Discovery)</option>
                    <option value="INVITED">INVITED (Invite Sent)</option>
                    <option value="CONTACTED">CONTACTED (In Chat)</option>
                    <option value="FORM_SUBMITTED">FORM SUBMITTED (Review)</option>
                    <option value="NEGOTIATING">NEGOTIATING (Terms)</option>
                    <option value="ONBOARDED">ONBOARDED (Live)</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "#475569", textTransform: "uppercase", display: "block", marginBottom: "0.25rem" }}>Notes / Observation</label>
                <textarea
                  rows={2}
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  placeholder="Seen on Instagram reel, 4 BHK with private pool, speaks Hindi and English..."
                  style={{ width: "100%", padding: "0.6rem 0.85rem", fontSize: "0.85rem", borderRadius: "10px", border: "1px solid #cbd5e1", outline: "none" }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "0.5rem" }}>
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  style={{ padding: "0.7rem 1.25rem", borderRadius: "12px", background: "#f1f5f9", color: "#475569", fontWeight: 700, fontSize: "0.88rem", border: "none", cursor: "pointer" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  style={{ padding: "0.7rem 1.6rem", borderRadius: "12px", background: "#9D00FF", color: "#ffffff", fontWeight: 700, fontSize: "0.9rem", border: "none", cursor: "pointer", boxShadow: "0 4px 12px rgba(157, 0, 255, 0.25)" }}
                >
                  {saving ? "Saving Lead..." : "Save Lead to Pipeline"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
