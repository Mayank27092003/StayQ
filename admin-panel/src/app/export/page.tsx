"use client";
import React, { useEffect, useState } from "react";
import axios from "axios";

interface DbStats {
  counts: {
    users: number;
    properties: number;
    bookings: number;
    payments: number;
    payouts: number;
    reviews: number;
    supportTickets: number;
    broadcasts: number;
    staff: number;
    coupons: number;
  };
  totalRecords: number;
  timestamp: string;
}

const TABLE_SCHEMAS = [
  {
    id: "users",
    name: "Users & Accounts",
    icon: "group",
    desc: "Complete guest and host profiles, Firebase UIDs, KYC verification flags, contact details & loyalty points.",
    fields: "id, firebaseUid, email, phoneNumber, firstName, lastName, roles, isHost, isIdentityVerified, loyaltyPoints",
    color: "from-blue-500/10 to-indigo-500/10 text-blue-600 border-blue-200",
  },
  {
    id: "properties",
    name: "Properties & Inventory",
    icon: "apartment",
    desc: "All villas, apartments, campsites, RVs, pricing, geocodes, amenities, legal ownership docs, and photos.",
    fields: "id, hostId, title, type, category, city, lat, lng, pricePerNight, propertyCode, status, images",
    color: "from-purple-500/10 to-pink-500/10 text-purple-600 border-purple-200",
  },
  {
    id: "bookings",
    name: "Bookings & Reservations",
    icon: "calendar_month",
    desc: "Reservation records, check-in/out dates, guest counts, pricing breakdowns, instant-book flags & statuses.",
    fields: "id, propertyId, guestId, checkIn, checkOut, totalAmount, commissionAmount, status, payments",
    color: "from-emerald-500/10 to-teal-500/10 text-emerald-600 border-emerald-200",
  },
  {
    id: "payments",
    name: "Payments & Transactions",
    icon: "credit_card",
    desc: "Cashfree PG payment orders, transaction references, captured amounts, signatures, and timestamps.",
    fields: "id, bookingId, amount, currency, status, gateway, gatewayOrderId, gatewayPaymentId, createdAt",
    color: "from-amber-500/10 to-yellow-500/10 text-amber-600 border-amber-200",
  },
  {
    id: "payouts",
    name: "Host Payouts & Transfers",
    icon: "account_balance",
    desc: "Direct host bank settlements, penny drop verification results, UTR numbers, and disbursement batches.",
    fields: "id, hostId, bookingId, netAmount, commissionDeducted, status, utrNumber, processedAt",
    color: "from-cyan-500/10 to-sky-500/10 text-cyan-600 border-cyan-200",
  },
  {
    id: "reviews",
    name: "Reviews & Ratings",
    icon: "star",
    desc: "Guest stay reviews, cleanliness / accuracy ratings, host feedback, and moderation flags.",
    fields: "id, propertyId, authorId, rating, cleanlinessRating, comment, isApproved, createdAt",
    color: "from-rose-500/10 to-orange-500/10 text-rose-600 border-rose-200",
  },
  {
    id: "staff",
    name: "Staff & RBAC Accounts",
    icon: "shield_person",
    desc: "Internal staff members, departments, encrypted PBKDF2 credentials, and granular module permissions.",
    fields: "id, staffId, fullName, email, department, role, status, allowedModules, phoneNumber",
    color: "from-violet-500/10 to-purple-500/10 text-violet-600 border-violet-200",
  },
  {
    id: "broadcasts",
    name: "Broadcasts & Push Logs",
    icon: "campaign",
    desc: "Multi-channel announcement records, target audience segments, FCM delivery stats, and error logs.",
    fields: "id, adminId, title, body, targetAudience, status, deliveredCount, failedCount, sentAt",
    color: "from-fuchsia-500/10 to-pink-500/10 text-fuchsia-600 border-fuchsia-200",
  },
];

export default function UniversalDataExportPage() {
  const [stats, setStats] = useState<DbStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const [exportingAll, setExportingAll] = useState(false);
  const [exportingTable, setExportingTable] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);

  const fetchStats = async () => {
    try {
      setLoadingStats(true);
      const res = await axios.get("/api/v1/admin/export/stats");
      if (res.data?.counts) {
        setStats(res.data);
      }
    } catch (err) {
      console.warn("Failed to load export stats:", err);
    } finally {
      setLoadingStats(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleExportAllJson = async () => {
    try {
      setExportingAll(true);
      const res = await axios.get("/api/v1/admin/export/all");
      const data = res.data;

      // Trigger instant browser download as formatted JSON file
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      link.href = url;
      link.download = `stayq_master_database_migration_${timestamp}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setToast({
        message: "Master Database Migration Bundle downloaded successfully!",
        type: "success",
      });
    } catch (err: any) {
      console.error(err);
      setToast({ message: "Failed to generate master export bundle.", type: "error" });
    } finally {
      setExportingAll(false);
    }
  };

  const handleExportTableJson = async (tableId: string) => {
    try {
      setExportingTable(`${tableId}_json`);
      const res = await axios.get(`/api/v1/admin/export/table/${tableId}`);
      const data = res.data;

      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `stayq_${tableId}_table_export_${Date.now()}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setToast({ message: `${tableId.toUpperCase()} exported in JSON format!`, type: "success" });
    } catch (err) {
      setToast({ message: `Failed to export ${tableId}.`, type: "error" });
    } finally {
      setExportingTable(null);
    }
  };

  const handleExportTableCsv = (tableId: string) => {
    window.open(`/api/v1/admin/export/table/${tableId}/csv`, "_blank");
    setToast({ message: `Downloading ${tableId.toUpperCase()} CSV...`, type: "info" });
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-20">
      {/* Toast */}
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

      {/* Top Header */}
      <div className="bg-white border-b border-slate-200 px-8 py-6 sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-primary tracking-wider uppercase mb-1">
              <span className="material-symbols-outlined text-sm">database</span>
              Stay Q Core Data Management
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
              Universal Data Migration &amp; 1-Click Export
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                PostgreSQL 16 Synced
              </span>
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Export 100% of your production database into standardized JSON &amp; CSV formats for instant portability, cloud migration, and disaster recovery.
            </p>
          </div>

          {/* Master 1-Click Action */}
          <button
            onClick={handleExportAllJson}
            disabled={exportingAll}
            className="flex items-center gap-2.5 px-6 py-3.5 bg-gradient-to-r from-primary to-indigo-600 text-white font-black text-xs uppercase tracking-wider rounded-2xl hover:opacity-95 shadow-xl shadow-primary/30 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-lg">
              {exportingAll ? "progress_activity" : "cloud_download"}
            </span>
            {exportingAll ? "Generating Master Bundle..." : "Export Complete Database (1-Click)"}
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-8 mt-8 space-y-8">
        {/* Quick Stats Banner */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {[
            { label: "Total Users", val: stats?.counts?.users ?? "—", icon: "group", color: "text-blue-600" },
            { label: "Properties", val: stats?.counts?.properties ?? "—", icon: "apartment", color: "text-purple-600" },
            { label: "Bookings", val: stats?.counts?.bookings ?? "—", icon: "calendar_month", color: "text-emerald-600" },
            { label: "Payments", val: stats?.counts?.payments ?? "—", icon: "credit_card", color: "text-amber-600" },
            { label: "Payouts", val: stats?.counts?.payouts ?? "—", icon: "account_balance", color: "text-cyan-600" },
            { label: "Total Records", val: stats?.totalRecords ?? "—", icon: "dns", color: "text-slate-900" },
          ].map((s, idx) => (
            <div key={idx} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
              <span className={`material-symbols-outlined text-2xl ${s.color}`}>{s.icon}</span>
              <div>
                <div className="text-[10px] uppercase font-bold text-slate-400">{s.label}</div>
                <div className={`text-base font-black ${s.color}`}>{s.val}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Master Migration Feature Card */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-950 to-indigo-950 text-white rounded-3xl p-8 border border-slate-800 shadow-xl relative overflow-hidden">
          <div className="relative z-10 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/20 text-primary-200 border border-primary/40 text-xs font-bold uppercase tracking-wider mb-4">
              <span className="material-symbols-outlined text-sm">swap_horiz</span>
              Zero-Lock-in Architecture
            </div>
            <h2 className="text-xl font-black tracking-tight text-white mb-2">
              Full Platform Migration Bundle (.JSON)
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed mb-6">
              Includes complete relational datasets: user identities, host listings, room inventory, geocodes, booking states, Cashfree transaction logs, payout schedules, reviews, and audit trails. Formatted with schema definition headers so any database engineer can run a 1-step migration script into PostgreSQL, MySQL, Supabase, or AWS RDS.
            </p>
            <div className="flex flex-wrap items-center gap-4">
              <button
                onClick={handleExportAllJson}
                disabled={exportingAll}
                className="flex items-center gap-2 px-6 py-3 bg-white text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl hover:bg-slate-100 shadow-lg active:scale-95 transition-all cursor-pointer disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-base">download</span>
                {exportingAll ? "Downloading..." : "Download Full JSON Bundle"}
              </button>
              <div className="text-xs text-slate-400 font-mono">
                Schema: <span className="text-emerald-400">STAYQ_UNIVERSAL_MIGRATION_V1</span>
              </div>
            </div>
          </div>
        </div>

        {/* Table-by-Table Granular Export Grid */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">table_chart</span>
              Selective Table Exports (CSV &amp; JSON)
            </h3>
            <span className="text-xs text-slate-400 font-medium">Download individual tables for accounting, analytics, or CRM imports</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {TABLE_SCHEMAS.map((tbl) => {
              const count = stats?.counts ? (stats.counts as any)[tbl.id] ?? 0 : "—";
              return (
                <div
                  key={tbl.id}
                  className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className={`w-10 h-10 rounded-xl border flex items-center justify-center ${tbl.color}`}>
                        <span className="material-symbols-outlined text-xl">{tbl.icon}</span>
                      </div>
                      <span className="text-xs font-mono font-bold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-full">
                        {count} records
                      </span>
                    </div>

                    <h4 className="text-sm font-black text-slate-900 mb-1">{tbl.name}</h4>
                    <p className="text-[11px] text-slate-500 leading-relaxed line-clamp-3 mb-4">{tbl.desc}</p>
                  </div>

                  <div className="pt-4 border-t border-slate-100 flex items-center gap-2">
                    <button
                      onClick={() => handleExportTableCsv(tbl.id)}
                      className="flex-1 py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                      title="Download as CSV"
                    >
                      <span className="material-symbols-outlined text-sm">csv</span>
                      CSV
                    </button>
                    <button
                      onClick={() => handleExportTableJson(tbl.id)}
                      disabled={exportingTable === `${tbl.id}_json`}
                      className="flex-1 py-2 px-3 bg-primary/10 hover:bg-primary/20 text-primary font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                      title="Download as JSON"
                    >
                      <span className="material-symbols-outlined text-sm">code</span>
                      {exportingTable === `${tbl.id}_json` ? "..." : "JSON"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Database Migration & CLI Restoration Guide */}
        <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm">
          <h3 className="text-base font-black text-slate-900 mb-2 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">terminal</span>
            Fast Database Migration &amp; Restoration Guide
          </h3>
          <p className="text-xs text-slate-500 mb-6">
            If you are moving Stay Q to a new VPS, AWS RDS instance, or dedicated server, use these standard commands:
          </p>

          <div className="space-y-4 text-xs font-mono">
            <div className="p-4 rounded-2xl bg-slate-900 text-slate-200 border border-slate-800">
              <div className="text-[10px] text-slate-400 uppercase font-sans font-bold mb-2">
                1. Native PostgreSQL Direct Database Dump (CLI)
              </div>
              <code>pg_dump -U postgres -h &lt;DB_HOST&gt; -d stayq_production -F c -b -v -f stayq_backup.dump</code>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900 text-slate-200 border border-slate-800">
              <div className="text-[10px] text-slate-400 uppercase font-sans font-bold mb-2">
                2. Restore on New Target Server
              </div>
              <code>pg_restore -U postgres -h &lt;NEW_DB_HOST&gt; -d stayq_production -v stayq_backup.dump</code>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900 text-slate-200 border border-slate-800">
              <div className="text-[10px] text-slate-400 uppercase font-sans font-bold mb-2">
                3. Prisma Schema Migration Sync
              </div>
              <code>npx prisma db push &amp;&amp; npx prisma generate</code>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
