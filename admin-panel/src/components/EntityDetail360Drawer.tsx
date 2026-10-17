"use client";

import React, { useState, useEffect } from "react";
import axios from "axios";

interface EntityDetail360DrawerProps {
  entityId: string | null;
  entityType?: "USER" | "HOST";
  isOpen: boolean;
  onClose: () => void;
  onRefresh?: () => void;
}

export default function EntityDetail360Drawer({
  entityId,
  isOpen,
  onClose,
  onRefresh,
}: EntityDetail360DrawerProps) {
  const [activeTab, setActiveTab] = useState<"overview" | "subscription" | "kyc" | "bookings" | "properties" | "orders">("overview");
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // VIP Grant Pro State
  const [grantDays, setGrantDays] = useState<number>(30);
  const [grantPlan, setGrantPlan] = useState<string>("HOST_PRO_MONTHLY");
  const [isGranting, setIsGranting] = useState<boolean>(false);
  const [grantSuccess, setGrantSuccess] = useState<string | null>(null);

  // Freeze Account State
  const [isFreezing, setIsFreezing] = useState<boolean>(false);
  const [freezeReason, setFreezeReason] = useState<string>("");

  // Push Notification State
  const [showPushModal, setShowPushModal] = useState<boolean>(false);
  const [pushTitle, setPushTitle] = useState<string>("");
  const [pushBody, setPushBody] = useState<string>("");
  const [pushImageUrl, setPushImageUrl] = useState<string>("");
  const [isSendingPush, setIsSendingPush] = useState<boolean>(false);
  const [pushResult, setPushResult] = useState<string | null>(null);

  const getAdminConfig = () => {
    const token = typeof window !== "undefined" ? localStorage.getItem("stayq_admin_token") : null;
    return {
      headers: {
        "x-admin-key": "stayq-admin-secret-2026",
        Authorization: `Bearer ${token || "stayq-admin-secret-2026"}`,
      },
    };
  };

  const fetchDossier = async () => {
    if (!entityId) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await axios.get(`/api/v1/admin/users/${entityId}/360`, getAdminConfig());
      if (res.data?.success) {
        setData(res.data.user);
      } else {
        setError("Could not load full profile.");
      }
    } catch (err: any) {
      console.error("360 fetch error:", err);
      setError(err?.response?.data?.message || "Failed to load user details.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && entityId) {
      fetchDossier();
      setActiveTab("overview");
      setGrantSuccess(null);
    }
  }, [isOpen, entityId]);

  const handleGrantPro = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!entityId) return;
    setIsGranting(true);
    setGrantSuccess(null);
    try {
      const res = await axios.post(
        `/api/v1/admin/users/${entityId}/grant-pro`,
        { days: Number(grantDays), planId: grantPlan },
        getAdminConfig()
      );
      if (res.data?.success) {
        setGrantSuccess(res.data.message || `Granted ${grantDays} days of Host Pro!`);
        fetchDossier();
        if (onRefresh) onRefresh();
      }
    } catch (err: any) {
      alert(err?.response?.data?.message || "Failed to grant Host Pro.");
    } finally {
      setIsGranting(false);
    }
  };

  const handleFreezeToggle = async (freeze: boolean) => {
    if (!entityId) return;
    const promptReason = freeze ? (freezeReason.trim() || "Policy violation / high-risk activity") : "Admin reviewed";
    setIsFreezing(true);
    try {
      const res = await axios.post(
        `/api/v1/admin/users/${entityId}/freeze`,
        { freeze, reason: promptReason },
        getAdminConfig()
      );
      if (res.data?.success) {
        alert(res.data.message);
        fetchDossier();
        if (onRefresh) onRefresh();
      }
    } catch (err: any) {
      alert(err?.response?.data?.message || "Action failed.");
    } finally {
      setIsFreezing(false);
    }
  };

  const handleSendPush = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!entityId || !pushTitle.trim() || !pushBody.trim()) {
      alert("Please enter both a title and message body for the push notification.");
      return;
    }
    setIsSendingPush(true);
    setPushResult(null);
    try {
      const res = await axios.post(
        `/api/v1/admin/users/${entityId}/send-push`,
        {
          title: pushTitle.trim(),
          body: pushBody.trim(),
          imageUrl: pushImageUrl.trim() || undefined,
        },
        getAdminConfig()
      );
      if (res.data?.success) {
        setPushResult(res.data.message || "Push notification sent successfully!");
        setPushTitle("");
        setPushBody("");
        setPushImageUrl("");
        setTimeout(() => setShowPushModal(false), 2000);
      }
    } catch (err: any) {
      alert(err?.response?.data?.message || "Failed to dispatch push notification.");
    } finally {
      setIsSendingPush(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/50 backdrop-blur-xs flex justify-end transition-opacity">
      <div 
        className="w-full max-w-2xl bg-white h-full shadow-2xl flex flex-col transform transition-transform duration-300 ease-in-out border-l border-slate-200"
      >
        {/* Top Header */}
        <div className="px-6 py-4 border-b border-slate-200/80 bg-slate-50/70 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {data?.photoUrl ? (
              <img
                src={data.photoUrl}
                alt={data?.displayName || "User"}
                className="w-11 h-11 rounded-2xl object-cover border border-purple-200 shadow-xs"
                onError={(e) => {
                  (e.currentTarget as HTMLElement).style.display = "none";
                }}
              />
            ) : null}
            {!data?.photoUrl && (
              <div className="w-11 h-11 rounded-2xl bg-[#5A31F4]/10 text-[#5A31F4] flex items-center justify-center font-bold text-sm border border-[#5A31F4]/20 shadow-xs">
                {data?.displayName?.slice(0, 2).toUpperCase() || "SQ"}
              </div>
            )}
            <div>
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <span>{data?.displayName || "Profile Dossier"}</span>
                {data?.isHostPro && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-amber-50 text-amber-700 border border-amber-200">
                    Host Pro
                  </span>
                )}
                {data?.hostStatus === "SUSPENDED" && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-rose-50 text-rose-700 border border-rose-200">
                    Suspended
                  </span>
                )}
              </h3>
              <p className="text-xs text-slate-500">User ID: <span className="font-mono text-slate-700">{entityId}</span></p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowPushModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-[#5A31F4] bg-purple-50 hover:bg-purple-100 border border-purple-200 transition-all cursor-pointer shadow-xs"
              title="Send Direct Push Notification"
            >
              <span className="material-symbols-outlined text-[16px]">notifications_active</span>
              <span className="hidden sm:inline">Send Push</span>
            </button>
            <button
              onClick={fetchDossier}
              className="p-1.5 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-200/60 transition-colors"
              title="Refresh"
            >
              <span className="material-symbols-outlined text-[18px]">refresh</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-200/60 transition-colors"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 bg-white px-6 gap-6 text-xs font-bold overflow-x-auto">
          {[
            { id: "overview", label: "Overview", icon: "person" },
            { id: "subscription", label: "Host Pro & Premiums", icon: "workspace_premium" },
            { id: "kyc", label: "KYC & Bank", icon: "verified_user" },
            { id: "bookings", label: `Trips (${data?.bookings?.length || 0})`, icon: "hotel" },
            { id: "properties", label: `Listings (${data?.properties?.length || 0})`, icon: "villa" },
            { id: "orders", label: `Orders (${data?.orders?.length || 0})`, icon: "receipt_long" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-3 flex items-center gap-1.5 border-b-2 transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? "border-[#5A31F4] text-[#5A31F4]"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Drawer Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {isLoading ? (
            <div className="py-24 text-center text-slate-400">
              <span className="material-symbols-outlined animate-spin text-3xl text-[#5A31F4] mb-2">
                progress_activity
              </span>
              <p className="text-xs">Loading complete 360° user dossier...</p>
            </div>
          ) : error ? (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-xs">
              {error}
            </div>
          ) : data ? (
            <>
              {/* TAB 1: OVERVIEW */}
              {activeTab === "overview" && (
                <div className="space-y-6">
                  {/* Contact & Bio Card */}
                  <div className="bg-slate-50/80 rounded-2xl p-4 border border-slate-200/80 space-y-3">
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Contact &amp; Personal Info</h4>
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <span className="text-slate-400 block text-[11px]">Mobile Phone</span>
                        <span className="font-bold text-slate-900 select-all">{data.phone || "Not set"}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[11px]">Email Address</span>
                        <span className="font-bold text-slate-900 select-all">{data.email || "Not set"}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[11px]">Location</span>
                        <span className="font-semibold text-slate-700">{data.location || "India"}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[11px]">Member Since</span>
                        <span className="font-semibold text-slate-700">
                          {new Date(data.createdAt).toLocaleDateString("en-IN", { dateStyle: "medium" })}
                        </span>
                      </div>
                      {data.hostCode && (
                        <div>
                          <span className="text-slate-400 block text-[11px]">Host ID Code</span>
                          <span className="font-mono font-bold text-[#5A31F4]">{data.hostCode}</span>
                        </div>
                      )}
                      <div>
                        <span className="text-slate-400 block text-[11px]">Platform Role</span>
                        <span className="font-semibold text-slate-700">{data.roles.join(", ")}</span>
                      </div>
                    </div>
                  </div>

                  {/* Lifetime Spending & Activity Stats */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="p-3.5 bg-purple-50/50 rounded-2xl border border-purple-100">
                      <span className="text-[10px] font-bold text-purple-700 uppercase block">Total Spend</span>
                      <strong className="text-lg font-black text-slate-900 mt-1 block">
                        ₹{Number(data.stats?.totalSpent || 0).toLocaleString("en-IN")}
                      </strong>
                    </div>
                    <div className="p-3.5 bg-blue-50/50 rounded-2xl border border-blue-100">
                      <span className="text-[10px] font-bold text-blue-700 uppercase block">Trips Booked</span>
                      <strong className="text-lg font-black text-slate-900 mt-1 block">
                        {data.stats?.totalBookingsCount || 0}
                      </strong>
                    </div>
                    <div className="p-3.5 bg-emerald-50/50 rounded-2xl border border-emerald-100">
                      <span className="text-[10px] font-bold text-emerald-700 uppercase block">Properties</span>
                      <strong className="text-lg font-black text-slate-900 mt-1 block">
                        {data.stats?.totalListingsCount || 0}
                      </strong>
                    </div>
                  </div>

                  {/* Emergency Actions */}
                  <div className="bg-white rounded-2xl p-4 border border-rose-200/80 shadow-xs space-y-3">
                    <h4 className="text-xs font-bold text-rose-700 uppercase tracking-wider flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[16px]">security</span>
                      <span>Account Safety &amp; Restrictions</span>
                    </h4>
                    <p className="text-xs text-slate-600">
                      {data.hostStatus === "SUSPENDED"
                        ? "This account is currently SUSPENDED. All listings are paused."
                        : "Freeze this account if fraudulent activity, unpaid host dues, or safety violations occur."}
                    </p>
                    <div className="flex gap-2 pt-1">
                      {data.hostStatus === "SUSPENDED" ? (
                        <button
                          disabled={isFreezing}
                          onClick={() => handleFreezeToggle(false)}
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition-all cursor-pointer"
                        >
                          {isFreezing ? "Unfreezing..." : "Unfreeze & Restore Account"}
                        </button>
                      ) : (
                        <button
                          disabled={isFreezing}
                          onClick={() => handleFreezeToggle(true)}
                          className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs transition-all cursor-pointer"
                        >
                          {isFreezing ? "Freezing..." : "Freeze Account & Pause Listings"}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: SUBSCRIPTION & PREMIUMS WITH EXPIRY DATES */}
              {activeTab === "subscription" && (
                <div className="space-y-6">
                  {/* Current Active Plan Card */}
                  <div className="bg-gradient-to-br from-slate-900 to-indigo-950 text-white rounded-2xl p-5 shadow-lg relative overflow-hidden">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-[10px] uppercase font-bold tracking-widest text-amber-400 block">
                          StayQ Host Entitlement
                        </span>
                        <h3 className="text-lg font-black mt-1">
                          {data.isHostPro ? (data.hostProPlanId === "HOST_PRO_ANNUAL" ? "Host Pro (Annual)" : "Host Pro (Monthly)") : "Standard Host (Free)"}
                        </h3>
                      </div>
                      <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-amber-300">
                        <span className="material-symbols-outlined text-2xl">workspace_premium</span>
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-white/10 grid grid-cols-2 gap-4 text-xs">
                      <div>
                        <span className="text-white/60 block text-[11px]">Subscription Status</span>
                        <span className="font-bold text-white flex items-center gap-1.5 mt-0.5">
                          <span className={`w-2 h-2 rounded-full ${data.isHostPro ? "bg-emerald-400" : "bg-slate-400"}`} />
                          {data.isHostPro ? "ACTIVE" : "INACTIVE / EXPIRED"}
                        </span>
                      </div>
                      <div>
                        <span className="text-white/60 block text-[11px]">Validity &amp; Expiry Date</span>
                        <span className="font-bold text-amber-300 block mt-0.5">
                          {data.proExpiryFormatted}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* One-Click VIP Grant Host Pro */}
                  <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 space-y-3">
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[16px] text-amber-600">card_membership</span>
                      <span>Grant / Extend Host Pro Access (Admin VIP)</span>
                    </h4>
                    <p className="text-xs text-slate-500">
                      Manually grant promotional access to this host without payment. Automatically sets the new expiration date.
                    </p>

                    <form onSubmit={handleGrantPro} className="space-y-3 pt-2">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-[11px] font-bold text-slate-600 block mb-1">Plan Tier</label>
                          <select
                            value={grantPlan}
                            onChange={(e) => setGrantPlan(e.target.value)}
                            className="w-full text-xs font-semibold bg-white border border-slate-200 rounded-xl p-2 text-slate-800"
                          >
                            <option value="HOST_PRO_MONTHLY">Host Pro (Monthly - 30d)</option>
                            <option value="HOST_PRO_ANNUAL">Host Pro (Annual - 365d)</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-[11px] font-bold text-slate-600 block mb-1">Extension Days</label>
                          <input
                            type="number"
                            min="1"
                            max="730"
                            value={grantDays}
                            onChange={(e) => setGrantDays(Number(e.target.value))}
                            className="w-full text-xs font-semibold bg-white border border-slate-200 rounded-xl p-2 text-slate-800"
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={isGranting}
                        className="w-full py-2.5 bg-[#5A31F4] hover:bg-[#4822d6] text-white font-bold rounded-xl text-xs transition-all shadow-sm cursor-pointer"
                      >
                        {isGranting ? "Applying Host Pro Extension..." : `Apply +${grantDays} Days Host Pro`}
                      </button>

                      {grantSuccess && (
                        <div className="p-3 bg-emerald-50 text-emerald-800 rounded-xl text-xs font-semibold border border-emerald-200">
                          {grantSuccess}
                        </div>
                      )}
                    </form>
                  </div>
                </div>
              )}

              {/* TAB 3: KYC & BANK */}
              {activeTab === "kyc" && (
                <div className="space-y-4">
                  <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-3">
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Aadhaar &amp; Identity Verification</h4>
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <span className="text-slate-400 block text-[11px]">KYC Status</span>
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase mt-0.5 ${
                          data.kyc.status === "VERIFIED" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                        }`}>
                          {data.kyc.status}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[11px]">ID Document Type</span>
                        <span className="font-bold text-slate-800">{data.kyc.govIdType}</span>
                      </div>
                      {data.kyc.govIdDocUrl && (
                        <div className="col-span-2 mt-2 pt-2 border-t border-slate-200">
                          <span className="text-slate-400 block text-[11px] mb-1.5 font-bold">Uploaded Identity Proof Document</span>
                          <div className="flex items-center gap-3">
                            <a href={data.kyc.govIdDocUrl} target="_blank" rel="noreferrer" className="block relative group">
                              <img
                                src={data.kyc.govIdDocUrl}
                                alt="Govt ID Document"
                                className="w-24 h-16 rounded-xl object-cover border border-slate-300 shadow-xs group-hover:opacity-90 transition-opacity"
                                onError={(e) => {
                                  (e.currentTarget as HTMLElement).style.display = "none";
                                }}
                              />
                            </a>
                            <a
                              href={data.kyc.govIdDocUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-xs text-[#5A31F4] font-bold hover:underline flex items-center gap-1"
                            >
                              <span>View High-Res Document</span>
                              <span className="material-symbols-outlined text-[14px]">open_in_new</span>
                            </a>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-3">
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Host Payout Bank Account</h4>
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <span className="text-slate-400 block text-[11px]">Bank Name</span>
                        <span className="font-bold text-slate-800">{data.kyc.bankName}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[11px]">Beneficiary Name</span>
                        <span className="font-bold text-slate-800">{data.kyc.beneficiaryName}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[11px]">Account Number</span>
                        <span className="font-mono font-bold text-slate-800">{data.kyc.accountNumberMasked}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[11px]">IFSC Code</span>
                        <span className="font-mono font-bold text-slate-800">{data.kyc.ifsc}</span>
                      </div>
                      {data.kyc.upiId && (
                        <div className="col-span-2">
                          <span className="text-slate-400 block text-[11px]">UPI ID</span>
                          <span className="font-mono font-bold text-slate-800">{data.kyc.upiId}</span>
                        </div>
                      )}
                      {data.kyc.passbookImageUrl && (
                        <div className="col-span-2 mt-2 pt-2 border-t border-slate-200">
                          <span className="text-slate-400 block text-[11px] mb-1.5 font-bold">Uploaded Bank Passbook / Cheque Document</span>
                          <div className="flex items-center gap-3">
                            <a href={data.kyc.passbookImageUrl} target="_blank" rel="noreferrer" className="block relative group">
                              <img
                                src={data.kyc.passbookImageUrl}
                                alt="Passbook / Cheque"
                                className="w-24 h-16 rounded-xl object-cover border border-slate-300 shadow-xs group-hover:opacity-90 transition-opacity"
                                onError={(e) => {
                                  (e.currentTarget as HTMLElement).style.display = "none";
                                }}
                              />
                            </a>
                            <a
                              href={data.kyc.passbookImageUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-xs text-[#5A31F4] font-bold hover:underline flex items-center gap-1"
                            >
                              <span>View High-Res Document</span>
                              <span className="material-symbols-outlined text-[14px]">open_in_new</span>
                            </a>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: BOOKINGS / TRIPS */}
              {activeTab === "bookings" && (
                <div className="space-y-3">
                  {data.bookings?.length === 0 ? (
                    <p className="text-xs text-slate-400 text-center py-12">No guest bookings found.</p>
                  ) : (
                    data.bookings.map((b: any) => (
                      <div key={b.id} className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs flex justify-between items-center">
                        <div>
                          <strong className="text-slate-900 block">{b.propertyTitle}</strong>
                          <span className="text-slate-500 text-[11px]">
                            {new Date(b.startDate).toLocaleDateString()} - {new Date(b.endDate).toLocaleDateString()}
                          </span>
                          <span className="block text-[11px] font-mono text-[#5A31F4] mt-0.5">PIN: {b.accessPin || b.confirmationCode}</span>
                        </div>
                        <div className="text-right">
                          <strong className="block text-slate-900">₹{b.totalAmount.toLocaleString("en-IN")}</strong>
                          <span className="text-[10px] font-bold uppercase text-slate-500">{b.status}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* TAB 5: PROPERTIES (LISTINGS) */}
              {activeTab === "properties" && (
                <div className="space-y-3">
                  {data.properties?.length === 0 ? (
                    <p className="text-xs text-slate-400 text-center py-12">No listings owned by this user.</p>
                  ) : (
                    data.properties.map((p: any) => (
                      <div key={p.id} className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs flex justify-between items-center">
                        <div className="flex items-center gap-3">
                          {p.thumbnailUrl ? (
                            <img
                              src={p.thumbnailUrl}
                              alt={p.title}
                              className="w-12 h-12 rounded-xl object-cover border border-slate-200 shrink-0 shadow-xs"
                              onError={(e) => {
                                (e.currentTarget as HTMLElement).style.display = "none";
                              }}
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-xl bg-purple-50 text-[#5A31F4] flex items-center justify-center shrink-0 border border-purple-100">
                              <span className="material-symbols-outlined text-[20px]">villa</span>
                            </div>
                          )}
                          <div>
                            <strong className="text-slate-900 block">{p.title}</strong>
                            <span className="text-slate-500 text-[11px]">{p.type} • {p.city}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <strong className="block text-slate-900">₹{p.pricePerNight?.toLocaleString("en-IN")}/night</strong>
                          <span className={`text-[10px] font-extrabold uppercase ${p.status === "ACTIVE" ? "text-emerald-700" : "text-amber-700"}`}>
                            {p.status}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* TAB 6: ORDERS & PAYMENTS */}
              {activeTab === "orders" && (
                <div className="space-y-3">
                  {data.orders?.length === 0 ? (
                    <p className="text-xs text-slate-400 text-center py-12">No payment orders recorded.</p>
                  ) : (
                    data.orders.map((o: any) => (
                      <div key={o.id} className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs flex justify-between items-center">
                        <div>
                          <strong className="text-slate-900 block">{o.purpose.replace(/_/g, " ")}</strong>
                          <span className="text-slate-500 text-[11px] font-mono">Order: {o.orderId}</span>
                          {o.paidAt && (
                            <span className="block text-slate-400 text-[10px]">
                              Paid {new Date(o.paidAt).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                        <div className="text-right">
                          <strong className="block text-slate-900">₹{o.amount.toLocaleString("en-IN")}</strong>
                          <span className={`text-[10px] font-extrabold uppercase ${o.status === "PAID" ? "text-emerald-700" : "text-slate-500"}`}>
                            {o.status}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </>
          ) : null}
        </div>

        {/* Direct Push Modal Overlay */}
        {showPushModal && (
          <div className="fixed inset-0 z-60 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-purple-100 text-[#5A31F4] flex items-center justify-center">
                    <span className="material-symbols-outlined text-[18px]">notifications_active</span>
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">Direct Push Notification</h4>
                    <p className="text-[11px] text-slate-400">Sends instant real FCM push to {data?.displayName || "this user"}</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowPushModal(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-700"
                >
                  <span className="material-symbols-outlined text-[18px]">close</span>
                </button>
              </div>

              <form onSubmit={handleSendPush} className="space-y-3 text-xs">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Notification Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Booking update / Welcome bonus"
                    value={pushTitle}
                    onChange={(e) => setPushTitle(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#5A31F4]/20"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Message Body *</label>
                  <textarea
                    required
                    rows={3}
                    placeholder="e.g. Your verification is complete! Tap to explore features."
                    value={pushBody}
                    onChange={(e) => setPushBody(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#5A31F4]/20"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Image URL (Optional Rich Banner)</label>
                  <input
                    type="url"
                    placeholder="https://... image banner"
                    value={pushImageUrl}
                    onChange={(e) => setPushImageUrl(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#5A31F4]/20"
                  />
                </div>

                {pushResult && (
                  <div className="p-3 rounded-xl bg-emerald-50 text-emerald-800 font-bold border border-emerald-200">
                    {pushResult}
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowPushModal(false)}
                    className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSendingPush}
                    className="flex-1 py-2.5 rounded-xl bg-[#5A31F4] hover:bg-[#4922db] text-white font-bold shadow-md shadow-purple-500/20 disabled:opacity-50 flex items-center justify-center gap-1.5"
                  >
                    {isSendingPush ? (
                      <>
                        <span className="material-symbols-outlined text-[16px] animate-spin">progress_activity</span>
                        <span>Sending...</span>
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-[16px]">send</span>
                        <span>Send Now</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
