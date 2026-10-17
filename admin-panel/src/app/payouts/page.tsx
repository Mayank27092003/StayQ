"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import EntityDetail360Drawer from "@/components/EntityDetail360Drawer";

interface BankDetails {
  accountNumber?: string;
  ifsc?: string;
  accountHolderName?: string;
  bankName?: string;
  isVerified?: boolean;
}

interface PayoutHost {
  id: string;
  name: string;
  phone: string;
  email: string;
  bankDetails?: BankDetails;
}

interface PayoutItem {
  id: string;
  bookingId: string;
  confirmationCode: string;
  propertyTitle: string;
  host: PayoutHost;
  grossAmount: number;
  platformFee: number;
  hostPayoutAmount: number;
  gstAmount: number;
  tdsAmount: number;
  checkInDate: string;
  escrowReleaseDate: string;
  isEligibleForRelease: boolean;
  status: "SCHEDULED" | "ELIGIBLE" | "PAID" | "ON_HOLD";
  payoutReference?: string;
  holdReason?: string;
  createdAt: string;
}

interface PayoutStats {
  totalEscrowHolding: number;
  eligibleForPayout: number;
  paidOut: number;
  onHold: number;
}

export default function PayoutsPage() {
  const [items, setItems] = useState<PayoutItem[]>([]);
  const [stats, setStats] = useState<PayoutStats>({
    totalEscrowHolding: 0,
    eligibleForPayout: 0,
    paidOut: 0,
    onHold: 0,
  });
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Action Modals
  const [actionLoading, setActionLoading] = useState(false);
  const [releaseModalItem, setReleaseModalItem] = useState<PayoutItem | null>(null);
  const [payoutUtr, setPayoutUtr] = useState("");
  const [holdModalItem, setHoldModalItem] = useState<PayoutItem | null>(null);
  const [holdReason, setHoldReason] = useState("");

  // 360 Drawer
  const [selectedEntityId, setSelectedEntityId] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const getAdminConfig = () => {
    const token = typeof window !== "undefined" ? localStorage.getItem("stayq_admin_token") : null;
    return {
      headers: {
        "x-admin-key": "stayq-admin-secret-2026",
        Authorization: `Bearer ${token || "stayq-admin-secret-2026"}`,
      },
    };
  };

  const fetchPayouts = async () => {
    setLoading(true);
    try {
      const res = await axios.get("/api/v1/admin/payouts", {
        ...getAdminConfig(),
        params: {
          status: statusFilter !== "ALL" ? statusFilter : undefined,
          limit: 100,
        },
      });

      if (res.data?.items) {
        setItems(res.data.items);
      }
      if (res.data?.stats) {
        setStats(res.data.stats);
      }
    } catch (err) {
      console.error("Failed to load payouts:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayouts();
  }, [statusFilter]);

  const handleReleaseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!releaseModalItem) return;
    setActionLoading(true);
    try {
      await axios.post(
        `/api/v1/admin/payouts/${releaseModalItem.bookingId}/release`,
        { reference: payoutUtr.trim() || `UTR-${Date.now()}` },
        getAdminConfig()
      );
      setReleaseModalItem(null);
      setPayoutUtr("");
      fetchPayouts();
    } catch (err: any) {
      alert("Failed to release payout: " + (err.response?.data?.message || err.message));
    } finally {
      setActionLoading(false);
    }
  };

  const handleHoldSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!holdModalItem) return;
    setActionLoading(true);
    try {
      await axios.post(
        `/api/v1/admin/payouts/${holdModalItem.bookingId}/hold`,
        { reason: holdReason.trim() || "Manual admin audit hold" },
        getAdminConfig()
      );
      setHoldModalItem(null);
      setHoldReason("");
      fetchPayouts();
    } catch (err: any) {
      alert("Failed to put on hold: " + (err.response?.data?.message || err.message));
    } finally {
      setActionLoading(false);
    }
  };

  const filteredItems = items.filter((it) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      it.confirmationCode?.toLowerCase().includes(q) ||
      it.host?.name?.toLowerCase().includes(q) ||
      it.host?.phone?.includes(q) ||
      it.propertyTitle?.toLowerCase().includes(q) ||
      it.host?.bankDetails?.ifsc?.toLowerCase().includes(q)
    );
  });

  const handleExportCSV = () => {
    if (!filteredItems.length) return;
    const headers = [
      "Confirmation Code",
      "Property Title",
      "Host Name",
      "Host Phone",
      "Bank Account",
      "IFSC",
      "Gross Amount (INR)",
      "Platform Fee 10%",
      "TDS 1%",
      "GST 18%",
      "Host Net Payout 90%",
      "Check-in Date",
      "Escrow Release Date",
      "Status",
    ];

    const rows = filteredItems.map((it) => [
      `"${it.confirmationCode}"`,
      `"${it.propertyTitle}"`,
      `"${it.host?.name || "N/A"}"`,
      `"${it.host?.phone || "N/A"}"`,
      `"${it.host?.bankDetails?.accountNumber || "N/A"}"`,
      `"${it.host?.bankDetails?.ifsc || "N/A"}"`,
      it.grossAmount,
      it.platformFee,
      it.tdsAmount,
      it.gstAmount,
      it.hostPayoutAmount,
      `"${new Date(it.checkInDate).toLocaleDateString("en-IN")}"`,
      `"${new Date(it.escrowReleaseDate).toLocaleDateString("en-IN")}"`,
      `"${it.status}"`,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `stayq_escrow_payouts_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#5A31F4] text-[28px]">account_balance_wallet</span>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">24h Post-Check-In Escrow Manager</h1>
          </div>
          <p className="text-sm text-slate-500 mt-1 font-medium">
            Automated host payouts released 24 hours post-guest check-in with 90/10 split, TDS &amp; GST compliance.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchPayouts}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 transition-all shadow-xs"
          >
            <span className={`material-symbols-outlined text-[16px] ${loading ? "animate-spin" : ""}`}>refresh</span>
            <span>Refresh</span>
          </button>
          <button
            onClick={handleExportCSV}
            disabled={!filteredItems.length}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-[#5A31F4] hover:bg-[#4a24db] transition-all shadow-md shadow-purple-500/20 disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-[16px]">file_download</span>
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Escrow Holding</span>
            <span className="p-2 rounded-xl bg-purple-50 text-[#5A31F4] material-symbols-outlined text-[20px]">
              lock_clock
            </span>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900">
              ₹{stats.totalEscrowHolding.toLocaleString("en-IN")}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Pending check-in + 24h clearance</p>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Eligible for Release</span>
            <span className="p-2 rounded-xl bg-emerald-50 text-emerald-600 material-symbols-outlined text-[20px]">
              check_circle
            </span>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-emerald-600">
              ₹{stats.eligibleForPayout.toLocaleString("en-IN")}
            </div>
            <p className="text-[11px] text-emerald-700 font-semibold mt-1">Passed 24h check-in window</p>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Dispute Holds</span>
            <span className="p-2 rounded-xl bg-rose-50 text-rose-600 material-symbols-outlined text-[20px]">
              pan_tool
            </span>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-rose-600">
              ₹{stats.onHold.toLocaleString("en-IN")}
            </div>
            <p className="text-[11px] text-rose-700 font-semibold mt-1">Under investigation</p>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Paid Out to Hosts</span>
            <span className="p-2 rounded-xl bg-slate-50 text-slate-600 material-symbols-outlined text-[20px]">
              verified
            </span>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900">
              ₹{stats.paidOut.toLocaleString("en-IN")}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Transferred via NEFT/IMPS</p>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          {[
            { id: "ALL", label: "All Payouts" },
            { id: "ELIGIBLE", label: "Ready to Release" },
            { id: "SCHEDULED", label: "Scheduled (In Escrow)" },
            { id: "ON_HOLD", label: "On Hold" },
            { id: "PAID", label: "Paid Out" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                statusFilter === tab.id
                  ? "bg-[#5A31F4] text-white shadow-xs"
                  : "bg-slate-50 text-slate-600 hover:bg-slate-100"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative flex-1 md:w-72 w-full">
          <span className="material-symbols-outlined absolute left-2.5 top-2 text-slate-400 text-[18px]">
            search
          </span>
          <input
            type="text"
            placeholder="Search host, booking code, IFSC..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#5A31F4]/10 focus:border-[#5A31F4]/50"
          />
        </div>
      </div>

      {/* Payouts Table */}
      <div className="rounded-2xl bg-white border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/75 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-4 py-3.5">Booking &amp; Property</th>
                <th className="px-4 py-3.5">Host &amp; Bank Details</th>
                <th className="px-4 py-3.5">Gross (₹)</th>
                <th className="px-4 py-3.5">Split (Fee / Net)</th>
                <th className="px-4 py-3.5">24h Escrow Release Date</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-4 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400">
                    <div className="flex flex-col items-center gap-2">
                      <span className="material-symbols-outlined animate-spin text-[24px] text-[#5A31F4]">
                        progress_activity
                      </span>
                      <span>Loading escrow ledger...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400">
                    <div className="flex flex-col items-center gap-1.5">
                      <span className="material-symbols-outlined text-[36px] text-slate-300">
                        account_balance_wallet
                      </span>
                      <p className="font-semibold text-slate-600">No payout records found</p>
                      <p className="text-[11px] text-slate-400">Try switching your status filter.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredItems.map((it) => (
                  <tr key={it.id} className="hover:bg-slate-50/60 transition-colors">
                    {/* Booking & Property */}
                    <td className="px-4 py-3.5">
                      <div className="font-bold text-slate-900 flex items-center gap-1">
                        <span className="material-symbols-outlined text-[15px] text-[#5A31F4]">confirmation_number</span>
                        <span>{it.confirmationCode}</span>
                      </div>
                      <div className="text-[11px] text-slate-600 truncate max-w-[200px] mt-0.5">
                        {it.propertyTitle}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        Check-in: {new Date(it.checkInDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                      </div>
                    </td>

                    {/* Host & Bank Details */}
                    <td className="px-4 py-3.5">
                      <button
                        onClick={() => {
                          if (it.host?.id) {
                            setSelectedEntityId(it.host.id);
                            setDrawerOpen(true);
                          }
                        }}
                        className="text-left group cursor-pointer"
                      >
                        <div className="font-bold text-slate-900 group-hover:text-[#5A31F4] flex items-center gap-1">
                          <span>{it.host?.name || "Host"}</span>
                          <span className="material-symbols-outlined text-[12px] opacity-0 group-hover:opacity-100">open_in_new</span>
                        </div>
                        <div className="text-[11px] font-mono text-slate-500">
                          {it.host?.phone || "No phone"}
                        </div>
                      </button>

                      <div className="mt-1 flex items-center gap-1 text-[10px] text-slate-500 bg-slate-50 px-2 py-0.5 rounded border border-slate-100 w-fit">
                        <span className="material-symbols-outlined text-[12px] text-emerald-600">account_balance</span>
                        <span className="font-mono">{it.host?.bankDetails?.accountNumber || "No Bank"}</span>
                        <span>({it.host?.bankDetails?.ifsc || "N/A"})</span>
                      </div>
                    </td>

                    {/* Gross */}
                    <td className="px-4 py-3.5">
                      <div className="font-bold text-slate-900 text-sm">
                        ₹{it.grossAmount.toLocaleString("en-IN")}
                      </div>
                      <div className="text-[10px] text-slate-400">Total Guest Paid</div>
                    </td>

                    {/* Split */}
                    <td className="px-4 py-3.5">
                      <div className="font-black text-emerald-700 text-sm">
                        ₹{it.hostPayoutAmount.toLocaleString("en-IN")}
                        <span className="text-[10px] font-medium text-slate-400 ml-1">(90% Net)</span>
                      </div>
                      <div className="text-[10px] text-purple-700 font-semibold mt-0.5">
                        ₹{it.platformFee.toLocaleString("en-IN")} (10% Fee)
                      </div>
                      <div className="text-[9px] text-slate-400">
                        TDS ₹{it.tdsAmount} | GST ₹{it.gstAmount}
                      </div>
                    </td>

                    {/* Escrow Release Date */}
                    <td className="px-4 py-3.5">
                      <div className="text-[11px] font-semibold text-slate-800">
                        {new Date(it.escrowReleaseDate).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        {it.isEligibleForRelease ? (
                          <span className="text-emerald-600 font-bold flex items-center gap-0.5">
                            <span className="material-symbols-outlined text-[12px]">schedule</span>
                            <span>24h passed - Ready</span>
                          </span>
                        ) : (
                          <span className="text-slate-500">24h pending</span>
                        )}
                      </div>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3.5">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          it.status === "PAID"
                            ? "bg-purple-100 text-[#5A31F4]"
                            : it.status === "ELIGIBLE"
                            ? "bg-emerald-100 text-emerald-800"
                            : it.status === "ON_HOLD"
                            ? "bg-rose-100 text-rose-800"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            it.status === "PAID"
                              ? "bg-[#5A31F4]"
                              : it.status === "ELIGIBLE"
                              ? "bg-emerald-500"
                              : it.status === "ON_HOLD"
                              ? "bg-rose-500"
                              : "bg-amber-500"
                          }`}
                        />
                        <span>{it.status}</span>
                      </span>
                      {it.holdReason && (
                        <div className="text-[9px] text-rose-600 italic mt-0.5 max-w-[140px] truncate" title={it.holdReason}>
                          Reason: {it.holdReason}
                        </div>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {it.status !== "PAID" && (
                          <button
                            onClick={() => {
                              setReleaseModalItem(it);
                              setPayoutUtr(`UTR${Date.now().toString().slice(-8)}`);
                            }}
                            className="px-2.5 py-1 rounded-lg text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors shadow-xs cursor-pointer"
                          >
                            Release
                          </button>
                        )}
                        {it.status !== "ON_HOLD" && it.status !== "PAID" && (
                          <button
                            onClick={() => {
                              setHoldModalItem(it);
                              setHoldReason("");
                            }}
                            className="px-2 py-1 rounded-lg text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors cursor-pointer"
                          >
                            Hold
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Release Payout Modal */}
      {releaseModalItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-md w-full p-6 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <span className="material-symbols-outlined text-[24px]">payments</span>
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">Confirm Host Escrow Release</h3>
                <p className="text-xs text-slate-500">Booking #{releaseModalItem.confirmationCode}</p>
              </div>
            </div>

            <div className="mt-4 p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Host:</span>
                <span className="font-bold text-slate-900">{releaseModalItem.host?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Bank Account:</span>
                <span className="font-mono font-bold text-slate-900">{releaseModalItem.host?.bankDetails?.accountNumber || "N/A"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">IFSC:</span>
                <span className="font-mono font-bold text-slate-900">{releaseModalItem.host?.bankDetails?.ifsc || "N/A"}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-slate-200">
                <span className="font-bold text-slate-700">Net Host Transfer:</span>
                <span className="font-black text-emerald-700 text-sm">₹{releaseModalItem.hostPayoutAmount.toLocaleString("en-IN")}</span>
              </div>
            </div>

            <form onSubmit={handleReleaseSubmit} className="mt-4 space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Bank UTR / Transaction Reference
                </label>
                <input
                  type="text"
                  required
                  value={payoutUtr}
                  onChange={(e) => setPayoutUtr(e.target.value)}
                  placeholder="e.g. UTR49281729381"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 font-mono focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setReleaseModalItem(null)}
                  className="px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md shadow-emerald-600/20 disabled:opacity-50 flex items-center gap-1.5"
                >
                  {actionLoading && <span className="material-symbols-outlined text-[14px] animate-spin">progress_activity</span>}
                  <span>Execute Release</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Hold Modal */}
      {holdModalItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-md w-full p-6 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center">
                <span className="material-symbols-outlined text-[24px]">pan_tool</span>
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">Place Escrow Payout on Hold</h3>
                <p className="text-xs text-slate-500">Booking #{holdModalItem.confirmationCode}</p>
              </div>
            </div>

            <form onSubmit={handleHoldSubmit} className="mt-4 space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Reason for Dispute / Audit Hold
                </label>
                <textarea
                  required
                  rows={3}
                  value={holdReason}
                  onChange={(e) => setHoldReason(e.target.value)}
                  placeholder="e.g. Guest reported major cleanliness violation / unauthorized host cancellation..."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setHoldModalItem(null)}
                  className="px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-md shadow-rose-600/20 disabled:opacity-50 flex items-center gap-1.5"
                >
                  {actionLoading && <span className="material-symbols-outlined text-[14px] animate-spin">progress_activity</span>}
                  <span>Place on Hold</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 360 Drawer */}
      <EntityDetail360Drawer
        entityId={selectedEntityId}
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      />
    </div>
  );
}
