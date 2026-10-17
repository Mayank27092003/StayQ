"use client";

import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import EntityDetail360Drawer from "@/components/EntityDetail360Drawer";

interface CustomerInfo {
  userId: string;
  name: string;
  phone: string;
  email: string;
  role: string;
  photoUrl?: string | null;
}

interface PremiumDetails {
  plan?: string;
  targetPropertyTitle?: string;
  targetPropertyId?: string;
  thumbnailUrl?: string | null;
  startDate?: string;
  expiresAt?: string;
  daysRemaining?: number;
  isExpired?: boolean;
}

interface PaymentDetails {
  razorpayPaymentId?: string;
  razorpaySignature?: string;
  method?: string;
}

interface TransactionItem {
  id: string;
  orderId: string;
  type: string;
  typeLabel: string;
  category: "HOST_PRO" | "BOOST" | "BOOKING" | "PAYMENT";
  amount: number;
  currency: string;
  status: "PAID" | "PENDING" | "FAILED" | "EXPIRED";
  customer: CustomerInfo;
  premiumDetails?: PremiumDetails;
  paymentDetails?: PaymentDetails;
  notes?: any;
  createdAt: string;
}

interface TransactionStats {
  totalRevenue: number;
  paidOrders: number;
  hostProActiveCount: number;
  propertyBoostActiveCount: number;
  hostProRevenue: number;
  boostRevenue: number;
  bookingsRevenue: number;
}

export default function TransactionsPage() {
  const [items, setItems] = useState<TransactionItem[]>([]);
  const [stats, setStats] = useState<TransactionStats>({
    totalRevenue: 0,
    paidOrders: 0,
    hostProActiveCount: 0,
    propertyBoostActiveCount: 0,
    hostProRevenue: 0,
    boostRevenue: 0,
    bookingsRevenue: 0,
  });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<"ALL" | "HOST_PRO" | "BOOST" | "BOOKING">("ALL");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  
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

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const [txRes, statsRes] = await Promise.all([
        axios.get("/api/v1/admin/transactions", {
          ...getAdminConfig(),
          params: {
            search: searchQuery.trim() || undefined,
            type: selectedCategory !== "ALL" ? selectedCategory : undefined,
            status: selectedStatus !== "ALL" ? selectedStatus : undefined,
            limit: 100,
          },
        }),
        axios.get("/api/v1/admin/transactions/stats", getAdminConfig()),
      ]);

      if (txRes.data?.items) {
        setItems(txRes.data.items);
      }
      if (statsRes.data) {
        setStats(statsRes.data);
      }
    } catch (err) {
      console.error("Failed to load transactions:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchTransactions();
    }, 250);
    return () => clearTimeout(timer);
  }, [searchQuery, selectedCategory, selectedStatus]);

  const handleOpen360 = (userId: string) => {
    if (!userId) return;
    setSelectedEntityId(userId);
    setDrawerOpen(true);
  };

  const handleExportCSV = () => {
    if (!items.length) return;
    const headers = [
      "Order ID",
      "Type",
      "Customer Name",
      "Customer Phone",
      "Customer Email",
      "Amount (INR)",
      "Status",
      "Start Date",
      "Expiry Date",
      "Days Remaining",
      "Payment ID",
      "Created At",
    ];

    const rows = items.map((it) => [
      `"${it.orderId}"`,
      `"${it.typeLabel}"`,
      `"${it.customer?.name || "N/A"}"`,
      `"${it.customer?.phone || "N/A"}"`,
      `"${it.customer?.email || "N/A"}"`,
      it.amount,
      `"${it.status}"`,
      `"${it.premiumDetails?.startDate ? new Date(it.premiumDetails.startDate).toLocaleDateString("en-IN") : "N/A"}"`,
      `"${it.premiumDetails?.expiresAt ? new Date(it.premiumDetails.expiresAt).toLocaleDateString("en-IN") : "N/A"}"`,
      it.premiumDetails?.daysRemaining !== undefined ? it.premiumDetails.daysRemaining : "N/A",
      `"${it.paymentDetails?.razorpayPaymentId || "N/A"}"`,
      `"${new Date(it.createdAt).toLocaleString("en-IN")}"`,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `stayq_transactions_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#5A31F4] text-[28px]">receipt_long</span>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Transactions &amp; Subscriptions Ledger</h1>
          </div>
          <p className="text-sm text-slate-500 mt-1 font-medium">
            Audit verified host pro memberships, property boosts, stay bookings, and countdown to expiration dates.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchTransactions}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 transition-all shadow-xs"
          >
            <span className={`material-symbols-outlined text-[16px] ${loading ? "animate-spin" : ""}`}>refresh</span>
            <span>Refresh</span>
          </button>
          <button
            onClick={handleExportCSV}
            disabled={!items.length}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-[#5A31F4] hover:bg-[#4a24db] transition-all shadow-md shadow-purple-500/20 disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-[16px]">file_download</span>
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Bento Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Revenue */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Gross Platform Revenue</span>
            <span className="p-2 rounded-xl bg-purple-50 text-[#5A31F4] material-symbols-outlined text-[20px]">
              account_balance
            </span>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900">
              ₹{stats.totalRevenue.toLocaleString("en-IN")}
            </div>
            <div className="text-[11px] font-semibold text-emerald-600 mt-1 flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]">check_circle</span>
              <span>{stats.paidOrders} Successful Orders</span>
            </div>
          </div>
        </div>

        {/* Host Pro MRR */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Host Pro Subscriptions</span>
            <span className="p-2 rounded-xl bg-indigo-50 text-indigo-600 material-symbols-outlined text-[20px]">
              workspace_premium
            </span>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900">
              ₹{stats.hostProRevenue.toLocaleString("en-IN")}
            </div>
            <div className="text-[11px] font-semibold text-indigo-600 mt-1 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-indigo-500" />
              <span>{stats.hostProActiveCount} Active Host Pro Members</span>
            </div>
          </div>
        </div>

        {/* Property Boosts */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Property Boosts</span>
            <span className="p-2 rounded-xl bg-amber-50 text-amber-600 material-symbols-outlined text-[20px]">
              rocket_launch
            </span>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900">
              ₹{stats.boostRevenue.toLocaleString("en-IN")}
            </div>
            <div className="text-[11px] font-semibold text-amber-600 mt-1 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              <span>{stats.propertyBoostActiveCount} Active Boost Campaigns</span>
            </div>
          </div>
        </div>

        {/* Bookings Revenue */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Stay Bookings</span>
            <span className="p-2 rounded-xl bg-emerald-50 text-emerald-600 material-symbols-outlined text-[20px]">
              hotel
            </span>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900">
              ₹{stats.bookingsRevenue.toLocaleString("en-IN")}
            </div>
            <div className="text-[11px] font-semibold text-slate-500 mt-1">
              Escrow &amp; Commission Ledger
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Category Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          {[
            { id: "ALL", label: "All Transactions" },
            { id: "HOST_PRO", label: "Host Pro Memberships" },
            { id: "BOOST", label: "Property Boosts" },
            { id: "BOOKING", label: "Stay Bookings" },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                selectedCategory === cat.id
                  ? "bg-[#5A31F4] text-white shadow-xs"
                  : "bg-slate-50 text-slate-600 hover:bg-slate-100"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Search Input & Status Filter */}
        <div className="flex items-center gap-2.5 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <span className="material-symbols-outlined absolute left-2.5 top-2 text-slate-400 text-[18px]">
              search
            </span>
            <input
              type="text"
              placeholder="Search phone, email, order ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#5A31F4]/10 focus:border-[#5A31F4]/50"
            />
          </div>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-slate-50 border border-slate-200 text-slate-700 focus:outline-none"
          >
            <option value="ALL">All Status</option>
            <option value="PAID">PAID</option>
            <option value="PENDING">PENDING</option>
            <option value="EXPIRED">EXPIRED</option>
          </select>
        </div>
      </div>

      {/* Main Transactions Table */}
      <div className="rounded-2xl bg-white border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/75 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-4 py-3.5">Order / Gateway ID</th>
                <th className="px-4 py-3.5">Item &amp; Category</th>
                <th className="px-4 py-3.5">Customer (Click for 360)</th>
                <th className="px-4 py-3.5">Amount &amp; Method</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-4 py-3.5">
                  <div className="flex items-center gap-1 text-[#5A31F4]">
                    <span className="material-symbols-outlined text-[14px]">event_repeat</span>
                    <span>Start &amp; Expiry Countdown</span>
                  </div>
                </th>
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
                      <span>Loading transactions &amp; premium memberships...</span>
                    </div>
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400">
                    <div className="flex flex-col items-center gap-1.5">
                      <span className="material-symbols-outlined text-[36px] text-slate-300">
                        receipt_long
                      </span>
                      <p className="font-semibold text-slate-600">No transactions found</p>
                      <p className="text-[11px] text-slate-400">Try adjusting your search query or filters.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                items.map((it) => {
                  const hasExpiry = Boolean(it.premiumDetails?.expiresAt);
                  const isExpired = it.premiumDetails?.isExpired;
                  const daysRemaining = it.premiumDetails?.daysRemaining;

                  return (
                    <tr key={it.id} className="hover:bg-slate-50/60 transition-colors">
                      {/* Order ID */}
                      <td className="px-4 py-3.5 font-mono text-slate-800">
                        <div className="font-bold text-[11px] flex items-center gap-1">
                          <span className="material-symbols-outlined text-[14px] text-slate-400">receipt</span>
                          <span>{it.orderId}</span>
                        </div>
                        <div className="text-[10px] text-slate-400 font-sans mt-0.5">
                          {new Date(it.createdAt).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                      </td>

                      {/* Item & Category */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2.5">
                          {it.premiumDetails?.thumbnailUrl && (
                            <img
                              src={it.premiumDetails.thumbnailUrl}
                              alt={it.typeLabel}
                              className="w-9 h-9 rounded-xl object-cover border border-slate-200 shadow-xs shrink-0"
                              onError={(e) => {
                                (e.target as HTMLElement).style.display = "none";
                              }}
                            />
                          )}
                          <div>
                            <div className="font-bold text-slate-900">{it.typeLabel}</div>
                            {it.premiumDetails?.targetPropertyTitle && (
                              <div className="text-[11px] text-slate-500 truncate max-w-[180px]">
                                {it.premiumDetails.targetPropertyTitle}
                              </div>
                            )}
                            <span
                              className={`inline-block mt-0.5 px-2 py-0.2 rounded-full text-[9px] font-extrabold uppercase ${
                                it.category === "HOST_PRO"
                                  ? "bg-purple-100 text-[#5A31F4]"
                                  : it.category === "BOOST"
                                  ? "bg-amber-100 text-amber-800"
                                  : "bg-blue-100 text-blue-800"
                              }`}
                            >
                              {it.category}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Customer */}
                      <td className="px-4 py-3.5">
                        {it.customer?.userId ? (
                          <button
                            onClick={() => handleOpen360(it.customer.userId)}
                            className="text-left group cursor-pointer flex items-center gap-2.5"
                          >
                            {it.customer.photoUrl ? (
                              <img
                                src={it.customer.photoUrl}
                                alt={it.customer.name}
                                className="w-8 h-8 rounded-full object-cover border border-purple-200 shadow-xs shrink-0"
                                onError={(e) => {
                                  (e.target as HTMLElement).style.display = "none";
                                }}
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-purple-100 text-[#5A31F4] font-bold text-xs flex items-center justify-center shrink-0 border border-purple-200">
                                {(it.customer.name || "C").slice(0, 2).toUpperCase()}
                              </div>
                            )}
                            <div>
                              <div className="font-bold text-slate-900 group-hover:text-[#5A31F4] flex items-center gap-1 transition-colors">
                                <span>{it.customer.name || "Customer"}</span>
                                <span className="material-symbols-outlined text-[12px] opacity-0 group-hover:opacity-100 transition-opacity">
                                  open_in_new
                                </span>
                              </div>
                              <div className="text-[11px] font-mono text-slate-500">
                                {it.customer.phone || "No phone"}
                              </div>
                              <div className="text-[10px] text-slate-400 truncate max-w-[160px]">
                                {it.customer.email || "No email"}
                              </div>
                            </div>
                          </button>
                        ) : (
                          <span className="text-slate-400 italic">Anonymous</span>
                        )}
                      </td>

                      {/* Amount & Method */}
                      <td className="px-4 py-3.5">
                        <div className="font-extrabold text-slate-900 text-sm">
                          ₹{it.amount.toLocaleString("en-IN")}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1">
                          <span className="material-symbols-outlined text-[12px]">credit_card</span>
                          <span>{it.paymentDetails?.method || "Razorpay Online"}</span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3.5">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                            it.status === "PAID"
                              ? "bg-emerald-100 text-emerald-800"
                              : it.status === "EXPIRED"
                              ? "bg-red-100 text-red-700"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              it.status === "PAID"
                                ? "bg-emerald-500"
                                : it.status === "EXPIRED"
                                ? "bg-red-500"
                                : "bg-amber-500"
                            }`}
                          />
                          <span>{it.status}</span>
                        </span>
                      </td>

                      {/* Start Date, Expiry Date & Countdown */}
                      <td className="px-4 py-3.5">
                        {hasExpiry ? (
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5 text-[11px] text-slate-700">
                              <span className="text-slate-400">Expires:</span>
                              <span className="font-bold">
                                {new Date(it.premiumDetails!.expiresAt!).toLocaleDateString("en-IN", {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                })}
                              </span>
                            </div>

                            {/* Expiry Badge */}
                            <div>
                              {isExpired ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-extrabold">
                                  <span className="material-symbols-outlined text-[11px]">history_toggle_off</span>
                                  <span>Expired</span>
                                </span>
                              ) : daysRemaining !== undefined && daysRemaining <= 5 ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-extrabold animate-pulse">
                                  <span className="material-symbols-outlined text-[11px]">alarm</span>
                                  <span>{daysRemaining} day{daysRemaining === 1 ? "" : "s"} left</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-extrabold">
                                  <span className="material-symbols-outlined text-[11px]">check_circle</span>
                                  <span>{daysRemaining} days left</span>
                                </span>
                              )}
                            </div>

                            {it.premiumDetails?.startDate && (
                              <div className="text-[10px] text-slate-400">
                                Started: {new Date(it.premiumDetails.startDate).toLocaleDateString("en-IN")}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="text-slate-400 text-[11px]">N/A (Standard Order)</div>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3.5 text-right">
                        {it.customer?.userId && (
                          <button
                            onClick={() => handleOpen360(it.customer.userId)}
                            className="px-2.5 py-1 rounded-lg text-xs font-bold text-[#5A31F4] bg-[#5A31F4]/8 hover:bg-[#5A31F4]/15 transition-colors cursor-pointer"
                          >
                            Inspect 360
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 360 Drawer */}
      <EntityDetail360Drawer
        entityId={selectedEntityId}
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      />
    </div>
  );
}
