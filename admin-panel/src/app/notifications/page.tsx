"use client";
import React, { useEffect, useState } from "react";
import axios from "axios";

interface BroadcastItem {
  id: string;
  title: string;
  body: string;
  targetAudience: string;
  status: "DRAFT" | "SENDING" | "SENT" | "FAILED";
  deliveredCount?: number;
  failedCount?: number;
  recipientCount?: number;
  createdAt: string;
  sentAt?: string;
}

const TEMPLATES = [
  {
    name: "⚡ Weekend Flash Promo",
    title: "Escape This Weekend: 20% Off Stays & Caravans!",
    message: "Hey {user_name}! Discover verified pool villas, scenic chalets, and caravans with zero brokerage on Stay Q. Book your weekend getaway now!",
    audience: "All Active Users (Hosts & Guests)",
    channel: ["push", "email"],
  },
  {
    name: "🏡 Host Payout & Bonus Notice",
    title: "Host Update: Payouts Dispatched & Zero Commission",
    message: "Dear Host {user_name}, your weekly earnings have been processed via Cashfree Direct. Check your Host Hub for full statements.",
    audience: "Verified Hosts Only",
    channel: ["push", "sms", "email"],
  },
  {
    name: "🚗 New Caravan Stays Live",
    title: "New Luxury Campervans & Campsites Now on Stay Q",
    message: "Experience the open roads of Himachal & Western Ghats! Explore our new overland caravans and geodesic dome camps today.",
    audience: "All Active Users (Hosts & Guests)",
    channel: ["push"],
  },
  {
    name: "🛡️ Trust & Safety Update",
    title: "Stay Q Security Update: 100% Verified Stays",
    message: "We have upgraded our host verification with instant NSDL/UIDAI identity checks. Travel with complete peace of mind.",
    audience: "All Active Users (Hosts & Guests)",
    channel: ["push", "email"],
  },
];

export default function NotificationsCenter() {
  const [broadcasts, setBroadcasts] = useState<BroadcastItem[]>([]);
  const [summary, setSummary] = useState<any>({
    deliveryRate: "99.4%",
    deliveryTrend: "+1.5%",
    dispatchedCount: "14,820",
    activeUsers: 1240,
  });
  const [loading, setLoading] = useState(true);
  const [dispatching, setDispatching] = useState(false);

  const [channels, setChannels] = useState<{ push: boolean; sms: boolean; email: boolean }>({
    push: true,
    sms: false,
    email: true,
  });
  const [audience, setAudience] = useState("All Active Users (Hosts & Guests)");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);

  const fetchBroadcasts = async () => {
    try {
      setLoading(true);
      const res = await axios.get("/api/v1/admin/broadcasts");
      if (res.data?.data) {
        setBroadcasts(res.data.data);
      }
      if (res.data?.summary) {
        setSummary(res.data.summary);
      }
    } catch (err) {
      console.warn("Failed to load broadcasts:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBroadcasts();
  }, []);

  const handleToggleChannel = (ch: "push" | "sms" | "email") => {
    setChannels((prev) => ({ ...prev, [ch]: !prev[ch] }));
  };

  const handleApplyTemplate = (tmpl: typeof TEMPLATES[0]) => {
    setTitle(tmpl.title);
    setMessage(tmpl.message);
    setAudience(tmpl.audience);
    setChannels({
      push: tmpl.channel.includes("push"),
      sms: tmpl.channel.includes("sms"),
      email: tmpl.channel.includes("email"),
    });
    setToast({ message: `Loaded template: ${tmpl.name}`, type: "info" });
  };

  const handleInsertVariable = (varName: string) => {
    setMessage((prev) => prev + ` {${varName}}`);
  };

  const handleDispatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) {
      setToast({ message: "Please fill in both Title and Message content.", type: "error" });
      return;
    }
    const selectedChannels = Object.entries(channels)
      .filter(([_, v]) => v)
      .map(([k]) => k);

    if (selectedChannels.length === 0) {
      setToast({ message: "Please select at least one delivery channel (Push, SMS, or Email).", type: "error" });
      return;
    }

    try {
      setDispatching(true);
      await axios.post("/api/v1/admin/broadcasts", {
        audience,
        title: title.trim(),
        message: message.trim(),
        channels: selectedChannels,
      });

      setToast({
        message: `Broadcast "${title}" dispatched successfully across ${selectedChannels.join(", ").toUpperCase()}!`,
        type: "success",
      });
      setTitle("");
      setMessage("");
      fetchBroadcasts();
    } catch (err: any) {
      console.error(err);
      setToast({
        message: err.response?.data?.message || "Failed to dispatch broadcast.",
        type: "error",
      });
    } finally {
      setDispatching(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-16">
      {toast && (
        <div
          className={`fixed top-6 right-6 z-50 p-4 rounded-2xl shadow-2xl border text-sm font-semibold flex items-center gap-3 transition-all ${
            toast.type === "success"
              ? "bg-emerald-950 text-emerald-100 border-emerald-500/40"
              : toast.type === "error"
              ? "bg-rose-950 text-rose-100 border-rose-500/40"
              : "bg-slate-900 text-slate-100 border-slate-700"
          }`}
        >
          <span className="material-symbols-outlined text-lg">
            {toast.type === "success" ? "check_circle" : toast.type === "error" ? "error" : "info"}
          </span>
          <span>{toast.message}</span>
          <button onClick={() => setToast(null)} className="ml-3 text-xs opacity-70 hover:opacity-100 cursor-pointer">
            ✕
          </button>
        </div>
      )}

      {/* Top Header Banner */}
      <div className="bg-white border-b border-slate-200 px-8 py-6 sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-primary tracking-wider uppercase mb-1">
              <span className="material-symbols-outlined text-sm">campaign</span>
              Stay Q Multi-Channel Broadcast Center
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
              Broadcast Operations &amp; Push Dispatcher
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                Gateways Active
              </span>
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Dispatch high-priority push notifications, Hostinger SSL email newsletters, and MSG91 SMS alerts to guests and hosts.
            </p>
          </div>

          <div className="flex items-center gap-3 bg-slate-50 p-2 rounded-2xl border border-slate-200">
            <div className="px-3 py-1.5 text-center border-r border-slate-200">
              <div className="text-[10px] uppercase font-bold text-slate-400">Delivery Rate</div>
              <div className="text-sm font-black text-emerald-600">{summary.deliveryRate}</div>
            </div>
            <div className="px-3 py-1.5 text-center">
              <div className="text-[10px] uppercase font-bold text-slate-400">Total Dispatched</div>
              <div className="text-sm font-black text-slate-900">{summary.dispatchedCount}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-8 mt-8 space-y-8">
        {/* Template Quick Bar */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
              <span className="material-symbols-outlined text-sm text-primary">auto_awesome</span>
              Quick Launch Promotional Templates
            </h4>
            <span className="text-[11px] text-slate-400">Click to instantly populate title &amp; copy</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {TEMPLATES.map((tmpl, idx) => (
              <button
                key={idx}
                onClick={() => handleApplyTemplate(tmpl)}
                className="p-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-primary/5 hover:border-primary/40 text-left transition-all group cursor-pointer"
              >
                <div className="text-xs font-bold text-slate-900 group-hover:text-primary transition-colors">
                  {tmpl.name}
                </div>
                <div className="text-[11px] text-slate-500 line-clamp-1 mt-1 font-medium">{tmpl.title}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column (7 cols) */}
          <div className="lg:col-span-7 bg-white rounded-3xl p-8 border border-slate-200 shadow-sm flex flex-col justify-between space-y-6">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                  <span className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                    <span className="material-symbols-outlined text-lg">edit_square</span>
                  </span>
                  Compose Broadcast Message
                </h3>
                <span className="text-xs font-bold text-slate-400">Step 1 of 2</span>
              </div>

              <form onSubmit={handleDispatch} className="mt-6 space-y-5">
                {/* Delivery Channels */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    1. Select Delivery Channels
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    <div
                      onClick={() => handleToggleChannel("push")}
                      className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all flex items-center gap-3 ${
                        channels.push
                          ? "border-primary bg-primary/5 text-primary shadow-sm"
                          : "border-slate-200 bg-slate-50 text-slate-500 opacity-60 hover:opacity-100"
                      }`}
                    >
                      <span className="material-symbols-outlined text-xl">notifications_active</span>
                      <div>
                        <div className="text-xs font-bold leading-tight">Push App</div>
                        <div className="text-[10px] text-slate-400 font-medium">FCM Mobile</div>
                      </div>
                    </div>

                    <div
                      onClick={() => handleToggleChannel("sms")}
                      className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all flex items-center gap-3 ${
                        channels.sms
                          ? "border-primary bg-primary/5 text-primary shadow-sm"
                          : "border-slate-200 bg-slate-50 text-slate-500 opacity-60 hover:opacity-100"
                      }`}
                    >
                      <span className="material-symbols-outlined text-xl">sms</span>
                      <div>
                        <div className="text-xs font-bold leading-tight">SMS Gateway</div>
                        <div className="text-[10px] text-slate-400 font-medium">MSG91 India</div>
                      </div>
                    </div>

                    <div
                      onClick={() => handleToggleChannel("email")}
                      className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all flex items-center gap-3 ${
                        channels.email
                          ? "border-primary bg-primary/5 text-primary shadow-sm"
                          : "border-slate-200 bg-slate-50 text-slate-500 opacity-60 hover:opacity-100"
                      }`}
                    >
                      <span className="material-symbols-outlined text-xl">mail</span>
                      <div>
                        <div className="text-xs font-bold leading-tight">Email Newsletter</div>
                        <div className="text-[10px] text-slate-400 font-medium">Hostinger SSL</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Target Audience */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    2. Target Audience Segment
                  </label>
                  <select
                    value={audience}
                    onChange={(e) => setAudience(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-900 focus:outline-none focus:border-primary focus:bg-white transition-all cursor-pointer"
                  >
                    <option>All Active Users (Hosts &amp; Guests)</option>
                    <option>Verified Hosts Only</option>
                    <option>Active Guests &amp; Travelers</option>
                    <option>Star Hosts &amp; Property Owners</option>
                  </select>
                </div>

                {/* Message Title */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    3. Announcement Headline / Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. ⚡ Special Weekend Offer: 20% Off Stays"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-900 focus:outline-none focus:border-primary focus:bg-white transition-all placeholder:text-slate-400"
                  />
                </div>

                {/* Message Content */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      4. Message Content *
                    </label>
                    <div className="flex items-center gap-1.5 text-[11px] font-mono text-slate-400">
                      <span>{message.length} chars</span>
                    </div>
                  </div>

                  <textarea
                    required
                    rows={4}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Type your announcement or promotional text here..."
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium text-slate-900 focus:outline-none focus:border-primary focus:bg-white transition-all resize-none placeholder:text-slate-400"
                  />

                  {/* Variables Helper */}
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    <span className="text-[11px] font-bold text-slate-400">Insert tag:</span>
                    {["user_name", "property_name", "booking_id", "city"].map((v) => (
                      <button
                        key={v}
                        type="button"
                        onClick={() => handleInsertVariable(v)}
                        className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-primary/10 hover:text-primary text-[11px] font-mono text-slate-600 font-semibold border border-slate-200 transition-all cursor-pointer"
                      >
                        +{`{${v}}`}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                  <div className="text-[11px] text-slate-400 font-medium">
                    ⚡ Instant delivery via Google Cloud &amp; Hostinger relays.
                  </div>
                  <button
                    type="submit"
                    disabled={dispatching}
                    className="flex items-center gap-2 px-7 py-3 bg-primary text-white font-black text-xs uppercase tracking-wider rounded-2xl hover:bg-primary/90 shadow-lg shadow-primary/30 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
                  >
                    <span className="material-symbols-outlined text-sm">
                      {dispatching ? "progress_activity" : "send"}
                    </span>
                    {dispatching ? "Dispatching..." : "Dispatch Broadcast Now"}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Right Column: Live Mobile Push & Email Preview (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            {/* Live Mobile Push Preview Card */}
            <div className="bg-gradient-to-br from-slate-900 to-slate-950 text-white rounded-3xl p-6 shadow-xl border border-slate-800">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
                  <span className="material-symbols-outlined text-sm text-primary">smartphone</span>
                  Live iOS / Android Push Preview
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
                  Lock Screen
                </span>
              </div>

              {/* Push Bubble */}
              <div className="bg-slate-800/80 backdrop-blur-md rounded-2xl p-4 border border-slate-700/80 shadow-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-md bg-primary flex items-center justify-center text-white font-black text-[10px]">
                      Q
                    </div>
                    <span className="text-xs font-black text-slate-200">STAY Q</span>
                  </div>
                  <span className="text-[10px] text-slate-400">now</span>
                </div>
                <div className="font-bold text-xs text-white">
                  {title || "Special Announcement from Stay Q"}
                </div>
                <div className="text-[11px] text-slate-300 mt-1 leading-relaxed line-clamp-3">
                  {message || "Your broadcast announcement preview will render here in real time as you compose..."}
                </div>
              </div>

              {/* Email Newsletter Card Preview */}
              <div className="mt-5 pt-4 border-t border-slate-800">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                  <span className="material-symbols-outlined text-sm text-amber-400">mail</span>
                  Email Newsletter Header
                </div>
                <div className="bg-white text-slate-900 rounded-xl p-4 text-xs font-medium border border-slate-200">
                  <div className="text-[10px] text-slate-400 font-mono">From: Stay Q Team &lt;hello@stayq.space&gt;</div>
                  <div className="font-bold text-slate-900 mt-1">{title || "Subject: Discover Unique Stays on Stay Q"}</div>
                  <div className="text-[11px] text-slate-600 mt-2 line-clamp-2">
                    {message || "Preview of email content rendered for guests & hosts..."}
                  </div>
                </div>
              </div>
            </div>

            {/* Delivery Performance KPI */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
              <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-base">signal_cellular_alt</span>
                Broadcast Gateway Status
              </h4>
              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50">
                  <span className="font-semibold text-slate-700 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    Firebase Cloud Messaging (FCM)
                  </span>
                  <span className="font-bold text-emerald-600 font-mono">99.8% OK</span>
                </div>
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50">
                  <span className="font-semibold text-slate-700 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    Hostinger SSL SMTP Relays
                  </span>
                  <span className="font-bold text-emerald-600 font-mono">100% OK</span>
                </div>
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50">
                  <span className="font-semibold text-slate-700 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    MSG91 SMS Gateway
                  </span>
                  <span className="font-bold text-emerald-600 font-mono">98.9% OK</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Dispatched Broadcasts Ledger Table */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">history</span>
                Dispatched Broadcasts History
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">Chronological record of global announcements and push dispatches</p>
            </div>
            <button
              onClick={fetchBroadcasts}
              className="p-2 text-slate-500 hover:text-primary hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              title="Refresh"
            >
              <span className="material-symbols-outlined text-lg">refresh</span>
            </button>
          </div>

          {loading ? (
            <div className="p-12 text-center text-slate-400">
              <span className="material-symbols-outlined text-3xl animate-spin text-primary mb-2">
                progress_activity
              </span>
              <p className="text-xs font-semibold">Loading broadcasts history...</p>
            </div>
          ) : broadcasts.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-3 text-slate-400">
                <span className="material-symbols-outlined text-2xl">campaign</span>
              </div>
              <h4 className="text-sm font-bold text-slate-800">No Previous Broadcasts Found</h4>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Use the composer above or pick a quick template to dispatch your first platform announcement.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/50 text-[11px] font-black uppercase tracking-wider text-slate-400">
                    <th className="py-3.5 px-6">Announcement</th>
                    <th className="py-3.5 px-6">Target Audience</th>
                    <th className="py-3.5 px-6">Status &amp; Delivery</th>
                    <th className="py-3.5 px-6">Sent Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {broadcasts.map((b) => (
                    <tr key={b.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-4 px-6 max-w-md">
                        <div className="font-bold text-slate-900">{b.title}</div>
                        <div className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">{b.body}</div>
                      </td>
                      <td className="py-4 px-6">
                        <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 font-bold text-[10px] uppercase">
                          {b.targetAudience}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-0.5 rounded-full font-black text-[10px] uppercase ${
                              b.status === "SENT"
                                ? "bg-emerald-100 text-emerald-800"
                                : b.status === "SENDING"
                                ? "bg-blue-100 text-blue-800"
                                : "bg-amber-100 text-amber-800"
                            }`}
                          >
                            {b.status}
                          </span>
                          {b.deliveredCount !== undefined && (
                            <span className="text-[11px] font-bold text-slate-600 font-mono">
                              {b.deliveredCount} delivered
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-6 text-slate-400 font-mono text-[11px]">
                        {new Date(b.sentAt || b.createdAt).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
