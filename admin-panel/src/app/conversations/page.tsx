"use client";

import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";

interface Participant {
  id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  avatarUrl?: string;
}

interface MessageItem {
  id: string;
  text: string;
  imageUrl?: string;
  senderId: string;
  createdAt: string;
  sender?: Participant & { role?: string };
}

interface ConversationItem {
  id: string;
  guest: Participant;
  host: Participant;
  property?: {
    id: string;
    title: string;
    city?: string;
    heroImage?: string;
    basePrice?: number;
  };
  booking?: {
    id: string;
    status: string;
    checkIn: string;
    checkOut: string;
    totalAmount: number;
  };
  lastMessage?: {
    id: string;
    text: string;
    senderId: string;
    createdAt: string;
  };
  messageCount: number;
  createdAt: string;
  updatedAt: string;
  messages?: MessageItem[];
}

export default function GuestHostConversationsPage() {
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedConv, setSelectedConv] = useState<ConversationItem | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [activeTab, setActiveTab] = useState<"ALL" | "WITH_BOOKINGS" | "ACTIVE">("ALL");

  const fetchConversations = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axios.get("/api/v1/admin/conversations", {
        params: { search: search.trim() || undefined, limit: 50 },
      });
      if (res.data && Array.isArray(res.data.items)) {
        setConversations(res.data.items);
        if (res.data.items.length > 0 && !selectedConv) {
          fetchConversationDetails(res.data.items[0].id);
        }
      }
    } catch (err) {
      console.warn("Could not fetch conversations, using fallback/empty state:", err);
    } finally {
      setLoading(false);
    }
  }, [search]);

  const fetchConversationDetails = async (convId: string) => {
    try {
      setLoadingDetails(true);
      const res = await axios.get(`/api/v1/admin/conversations/${convId}`);
      if (res.data) {
        setSelectedConv(res.data);
      }
    } catch (err) {
      console.error("Error loading conversation transcript:", err);
    } finally {
      setLoadingDetails(false);
    }
  };

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  const filteredConversations = conversations.filter((c) => {
    if (activeTab === "WITH_BOOKINGS" && !c.booking) return false;
    if (activeTab === "ACTIVE" && c.messageCount === 0) return false;
    if (!search.trim()) return true;
    const q = search.toLowerCase().trim();
    const guestName = `${c.guest?.firstName || ""} ${c.guest?.lastName || ""}`.toLowerCase();
    const hostName = `${c.host?.firstName || ""} ${c.host?.lastName || ""}`.toLowerCase();
    const propTitle = (c.property?.title || "").toLowerCase();
    const lastMsg = (c.lastMessage?.text || "").toLowerCase();
    return guestName.includes(q) || hostName.includes(q) || propTitle.includes(q) || lastMsg.includes(q);
  });

  const formatParticipantName = (p?: Participant) => {
    if (!p) return "User";
    const name = `${p.firstName || ""} ${p.lastName || ""}`.trim();
    return name || p.email || "Verified Guest";
  };

  return (
    <div style={{ width: "100%", maxWidth: "1600px", margin: "0 auto", padding: "1.5rem", height: "calc(100vh - 80px)", display: "flex", flexDirection: "column" }}>
      {/* Top Header */}
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: "1rem", marginBottom: "1.25rem", paddingBottom: "1.25rem", borderBottom: "1px solid #e2e8f0" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "#9D00FF", fontWeight: 700, fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.25rem" }}>
            <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>forum</span>
            Trust & Safety Audit Console
          </div>
          <h1 style={{ fontSize: "1.75rem", fontWeight: 800, color: "#0f172a", margin: 0 }}>
            Guest &amp; Host Conversations
          </h1>
          <p style={{ fontSize: "0.9rem", color: "#64748b", margin: "0.25rem 0 0 0" }}>
            Audit all real-time in-app chats between guests and hosts, verify check-in agreements, and maintain platform security.
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <button
            type="button"
            onClick={fetchConversations}
            style={{ display: "flex", alignItems: "center", gap: "0.4rem", padding: "0.6rem 1.1rem", borderRadius: "12px", border: "1px solid #cbd5e1", background: "#ffffff", color: "#334155", fontWeight: 700, fontSize: "0.85rem", cursor: "pointer" }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>refresh</span>
            Refresh Chats
          </button>
        </div>
      </div>

      {/* Main 2-Column Split: Conversations List & Live Transcript */}
      <div style={{ display: "grid", gridTemplateColumns: "380px 1fr", gap: "1.25rem", flex: 1, minHeight: 0 }}>
        {/* Left Column: Threads List */}
        <div style={{ background: "#ffffff", borderRadius: "20px", border: "1px solid #e2e8f0", display: "flex", flexDirection: "column", overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
          {/* Search Bar & Filters */}
          <div style={{ padding: "1rem", borderBottom: "1px solid #f1f5f9" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", background: "#f8fafc", padding: "0.55rem 0.85rem", borderRadius: "10px", border: "1px solid #e2e8f0", marginBottom: "0.75rem" }}>
              <span className="material-symbols-outlined" style={{ fontSize: "18px", color: "#94a3b8" }}>search</span>
              <input
                type="text"
                placeholder="Search guest, host, property..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ border: "none", outline: "none", background: "transparent", fontSize: "0.85rem", width: "100%" }}
              />
            </div>

            <div style={{ display: "flex", gap: "0.4rem" }}>
              {[
                { id: "ALL", label: "All Chats" },
                { id: "WITH_BOOKINGS", label: "Bookings Only" },
                { id: "ACTIVE", label: "With Messages" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id as any)}
                  style={{
                    flex: 1,
                    padding: "0.4rem 0.6rem",
                    borderRadius: "8px",
                    border: "none",
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    cursor: "pointer",
                    background: activeTab === tab.id ? "#9D00FF" : "#f1f5f9",
                    color: activeTab === tab.id ? "#ffffff" : "#475569",
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* List Content */}
          <div style={{ flex: 1, overflowY: "auto", padding: "0.5rem" }}>
            {loading ? (
              <div style={{ padding: "2rem", textAlign: "center", color: "#64748b", fontSize: "0.88rem" }}>
                Loading conversation threads...
              </div>
            ) : filteredConversations.length === 0 ? (
              <div style={{ padding: "2.5rem 1rem", textAlign: "center", color: "#94a3b8" }}>
                <span className="material-symbols-outlined" style={{ fontSize: "36px", color: "#cbd5e1", display: "block", marginBottom: "0.5rem" }}>chat</span>
                No conversations found.
              </div>
            ) : (
              filteredConversations.map((c) => {
                const isSelected = selectedConv?.id === c.id;
                const guestName = formatParticipantName(c.guest);
                const hostName = formatParticipantName(c.host);
                return (
                  <div
                    key={c.id}
                    onClick={() => fetchConversationDetails(c.id)}
                    style={{
                      padding: "0.85rem 1rem",
                      borderRadius: "14px",
                      cursor: "pointer",
                      marginBottom: "0.4rem",
                      background: isSelected ? "#f3e8ff" : "#ffffff",
                      border: isSelected ? "1.5px solid #9D00FF" : "1px solid #f1f5f9",
                      transition: "all 0.15s ease",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.3rem" }}>
                      <div style={{ fontWeight: 800, fontSize: "0.88rem", color: "#0f172a" }}>
                        {guestName}
                      </div>
                      <span style={{ fontSize: "0.72rem", color: "#94a3b8", fontWeight: 600 }}>
                        {c.updatedAt ? new Date(c.updatedAt).toLocaleDateString([], { month: "short", day: "numeric" }) : ""}
                      </span>
                    </div>

                    <div style={{ fontSize: "0.78rem", color: "#64748b", display: "flex", alignItems: "center", gap: "0.3rem", marginBottom: "0.35rem" }}>
                      <span className="material-symbols-outlined" style={{ fontSize: "14px", color: "#9D00FF" }}>arrow_forward</span>
                      Host: <strong>{hostName}</strong>
                    </div>

                    {c.property && (
                      <div style={{ fontSize: "0.75rem", color: "#0284c7", fontWeight: 600, display: "flex", alignItems: "center", gap: "0.3rem", marginBottom: "0.35rem" }}>
                        <span className="material-symbols-outlined" style={{ fontSize: "13px" }}>apartment</span>
                        {c.property.title}
                      </div>
                    )}

                    <div style={{ fontSize: "0.78rem", color: "#475569", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {c.lastMessage ? c.lastMessage.text : "No messages exchanged yet."}
                    </div>

                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "0.4rem", paddingTop: "0.4rem", borderTop: "1px dashed #e2e8f0" }}>
                      <span style={{ fontSize: "0.7rem", color: "#94a3b8" }}>
                        {c.messageCount} {c.messageCount === 1 ? "message" : "messages"}
                      </span>
                      {c.booking && (
                        <span style={{ fontSize: "0.68rem", fontWeight: 700, padding: "0.15rem 0.5rem", borderRadius: "6px", background: "#ecfdf5", color: "#059669" }}>
                          Booking: {c.booking.status}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Live Chat Transcript Panel */}
        <div style={{ background: "#ffffff", borderRadius: "20px", border: "1px solid #e2e8f0", display: "flex", flexDirection: "column", overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
          {selectedConv ? (
            <>
              {/* Conversation Top Header */}
              <div style={{ padding: "1.1rem 1.5rem", borderBottom: "1px solid #e2e8f0", background: "#f8fafc", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                  <div style={{ width: "44px", height: "44px", borderRadius: "50%", background: "#9D00FF", color: "#ffffff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: "1.1rem" }}>
                    {selectedConv.guest?.firstName?.[0] || "G"}
                  </div>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <h3 style={{ fontSize: "1.1rem", fontWeight: 800, color: "#0f172a", margin: 0 }}>
                        {formatParticipantName(selectedConv.guest)} (Guest)
                      </h3>
                      <span style={{ fontSize: "0.75rem", color: "#94a3b8" }}>⇄</span>
                      <strong style={{ fontSize: "0.95rem", color: "#9D00FF" }}>
                        {formatParticipantName(selectedConv.host)} (Host)
                      </strong>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginTop: "0.2rem", fontSize: "0.8rem", color: "#64748b" }}>
                      {selectedConv.guest?.phone && (
                        <span>📞 Guest: <strong>{selectedConv.guest.phone}</strong></span>
                      )}
                      {selectedConv.host?.phone && (
                        <span>📞 Host: <strong>{selectedConv.host.phone}</strong></span>
                      )}
                      {selectedConv.property && (
                        <span>🏠 Stay: <strong>{selectedConv.property.title} ({selectedConv.property.city || "India"})</strong></span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Direct Outreach Shortcuts */}
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  {selectedConv.guest?.phone && (
                    <a
                      href={`https://wa.me/${selectedConv.guest.phone.replace(/[^0-9]/g, "")}?text=${encodeURIComponent("Hello, this is Stay Q Operations regarding your chat with the host.")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="WhatsApp Guest"
                      style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem", padding: "0.45rem 0.85rem", borderRadius: "10px", background: "rgba(16, 185, 129, 0.1)", color: "#059669", textDecoration: "none", fontWeight: 700, fontSize: "0.78rem" }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>chat</span>
                      WhatsApp Guest
                    </a>
                  )}
                  {selectedConv.host?.phone && (
                    <a
                      href={`https://wa.me/${selectedConv.host.phone.replace(/[^0-9]/g, "")}?text=${encodeURIComponent("Hello, this is Stay Q Operations regarding your guest inquiry.")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="WhatsApp Host"
                      style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem", padding: "0.45rem 0.85rem", borderRadius: "10px", background: "rgba(157, 0, 255, 0.1)", color: "#9D00FF", textDecoration: "none", fontWeight: 700, fontSize: "0.78rem" }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>chat</span>
                      WhatsApp Host
                    </a>
                  )}
                </div>
              </div>

              {/* Booking Context Banner (if linked) */}
              {selectedConv.booking && (
                <div style={{ background: "#f0fdf4", borderBottom: "1px solid #bbf7d0", padding: "0.6rem 1.5rem", display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "0.82rem", color: "#166534" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>event_available</span>
                    <strong>Linked Reservation:</strong>
                    <span>Check-in: {new Date(selectedConv.booking.checkIn).toLocaleDateString()}</span>
                    <span>• Check-out: {new Date(selectedConv.booking.checkOut).toLocaleDateString()}</span>
                    <span>• Status: <strong>{selectedConv.booking.status}</strong></span>
                  </div>
                  <div>
                    <strong>₹{(selectedConv.booking.totalAmount || 0).toLocaleString()}</strong>
                  </div>
                </div>
              )}

              {/* Chat Messages Stream */}
              <div style={{ flex: 1, overflowY: "auto", padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1rem", background: "#f8fafc" }}>
                {loadingDetails ? (
                  <div style={{ padding: "3rem", textAlign: "center", color: "#64748b" }}>
                    Loading message transcript...
                  </div>
                ) : !selectedConv.messages || selectedConv.messages.length === 0 ? (
                  <div style={{ padding: "3rem", textAlign: "center", color: "#94a3b8" }}>
                    <span className="material-symbols-outlined" style={{ fontSize: "40px", color: "#cbd5e1", display: "block", marginBottom: "0.5rem" }}>forum</span>
                    No messages exchanged in this conversation yet.
                  </div>
                ) : (
                  selectedConv.messages.map((msg) => {
                    const isGuest = msg.senderId === selectedConv.guest?.id;
                    const senderName = isGuest ? formatParticipantName(selectedConv.guest) : formatParticipantName(selectedConv.host);

                    return (
                      <div
                        key={msg.id}
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: isGuest ? "flex-start" : "flex-end",
                          maxWidth: "75%",
                          alignSelf: isGuest ? "flex-start" : "flex-end",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginBottom: "0.25rem" }}>
                          <span style={{ fontSize: "0.72rem", fontWeight: 700, color: isGuest ? "#0284c7" : "#9D00FF" }}>
                            {senderName} ({isGuest ? "Guest" : "Host"})
                          </span>
                          <span style={{ fontSize: "0.68rem", color: "#94a3b8" }}>
                            {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </div>

                        <div
                          style={{
                            padding: "0.85rem 1.15rem",
                            borderRadius: isGuest ? "4px 18px 18px 18px" : "18px 4px 18px 18px",
                            background: isGuest ? "#ffffff" : "#9D00FF",
                            color: isGuest ? "#0f172a" : "#ffffff",
                            fontSize: "0.88rem",
                            lineHeight: 1.5,
                            boxShadow: "0 2px 5px rgba(0,0,0,0.06)",
                            border: isGuest ? "1px solid #e2e8f0" : "none",
                            wordBreak: "break-word",
                          }}
                        >
                          {msg.text}
                          {msg.imageUrl && (
                            <div style={{ marginTop: "0.5rem" }}>
                              <img src={msg.imageUrl} alt="Attachment" style={{ maxWidth: "260px", maxHeight: "200px", borderRadius: "10px", objectFit: "cover" }} />
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Bottom Audit Notice */}
              <div style={{ padding: "0.75rem 1.5rem", background: "#f1f5f9", borderTop: "1px solid #e2e8f0", fontSize: "0.74rem", color: "#64748b", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span>🔒 End-to-end conversation audit stored in PostgreSQL database for compliance &amp; mediation.</span>
                <span>Conversation ID: <code style={{ fontFamily: "monospace", color: "#9D00FF" }}>{selectedConv.id}</code></span>
              </div>
            </>
          ) : (
            <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "#94a3b8", padding: "2rem" }}>
              <span className="material-symbols-outlined" style={{ fontSize: "48px", color: "#cbd5e1", marginBottom: "0.75rem" }}>chat</span>
              <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#475569", margin: "0 0 0.25rem 0" }}>Select a Conversation</h3>
              <p style={{ fontSize: "0.85rem", margin: 0 }}>Click on any conversation thread on the left to read the full guest-host chat transcript.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
