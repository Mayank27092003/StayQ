"use client";

import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import EntityDetail360Drawer from "@/components/EntityDetail360Drawer";

interface RegisteredUser {
  id: string;
  displayName: string;
  email: string;
  phone: string;
  photoUrl?: string | null;
  location: string;
  gender?: string;
  dob?: string | null;
  roles: string[];
  referralCode: string;
  createdAt: string;
  platform: "android" | "ios" | "web" | string;
  emailVerified: boolean;
  phoneVerified: boolean;
  isHostVerified: boolean;
  kycStatus: "VERIFIED" | "PENDING" | "NOT_SUBMITTED";
  govIdType?: string;
  loyaltyPoints: number;
  loyaltyTier: string;
  totalBookings: number;
  totalListings: number;
}

export default function RegisteredUsersPage() {
  const [users, setUsers] = useState<RegisteredUser[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [platformFilter, setPlatformFilter] = useState<string>("ALL");
  const [roleFilter, setRoleFilter] = useState<string>("ALL");
  const [kycFilter, setKycFilter] = useState<string>("ALL");
  const [sortField, setSortField] = useState<"createdAt" | "displayName" | "loyaltyPoints">("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [copiedId, setCopiedId] = useState<string | null>(null);
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

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const config = getAdminConfig();
      const res = await axios.get("/api/v1/admin/users/registered", config);
      const data = Array.isArray(res.data) ? res.data : (res.data?.data || []);
      setUsers(data);
    } catch (err) {
      console.error("Failed to fetch registered users:", err);
      setUsers([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const copyToClipboard = (text: string, id: string) => {
    if (typeof navigator !== "undefined") {
      navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        u.displayName?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q) ||
        u.phone?.toLowerCase().includes(q) ||
        u.location?.toLowerCase().includes(q) ||
        u.referralCode?.toLowerCase().includes(q);

      const matchesPlatform =
        platformFilter === "ALL" ||
        (platformFilter === "ANDROID" && u.platform?.includes("android")) ||
        (platformFilter === "IOS" && u.platform?.includes("ios")) ||
        (platformFilter === "WEB" && u.platform?.includes("web"));

      const matchesRole =
        roleFilter === "ALL" ||
        (roleFilter === "HOST" && u.roles.includes("HOST")) ||
        (roleFilter === "GUEST" && !u.roles.includes("HOST"));

      const matchesKyc =
        kycFilter === "ALL" ||
        (kycFilter === "VERIFIED" && u.kycStatus === "VERIFIED") ||
        (kycFilter === "PENDING" && u.kycStatus === "PENDING") ||
        (kycFilter === "NOT_SUBMITTED" && u.kycStatus === "NOT_SUBMITTED");

      return matchesSearch && matchesPlatform && matchesRole && matchesKyc;
    }).sort((a, b) => {
      if (sortField === "createdAt") {
        const timeA = new Date(a.createdAt).getTime();
        const timeB = new Date(b.createdAt).getTime();
        return sortOrder === "desc" ? timeB - timeA : timeA - timeB;
      }
      if (sortField === "loyaltyPoints") {
        return sortOrder === "desc"
          ? b.loyaltyPoints - a.loyaltyPoints
          : a.loyaltyPoints - b.loyaltyPoints;
      }
      const nameA = a.displayName.toLowerCase();
      const nameB = b.displayName.toLowerCase();
      return sortOrder === "desc" ? nameB.localeCompare(nameA) : nameA.localeCompare(nameB);
    });
  }, [users, searchQuery, platformFilter, roleFilter, kycFilter, sortField, sortOrder]);

  const stats = useMemo(() => {
    const total = users.length;
    const androidCount = users.filter((u) => u.platform?.includes("android")).length;
    const iosCount = users.filter((u) => u.platform?.includes("ios")).length;
    const webCount = users.filter((u) => u.platform?.includes("web")).length;
    const kycVerifiedCount = users.filter((u) => u.kycStatus === "VERIFIED").length;
    const hostsCount = users.filter((u) => u.roles.includes("HOST")).length;
    return { total, androidCount, iosCount, webCount, kycVerifiedCount, hostsCount };
  }, [users]);

  const formatDate = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return isoString;
    }
  };

  const getPlatformBadge = (platform: string) => {
    const p = platform?.toLowerCase() || "";
    if (p.includes("android")) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <span className="material-symbols-outlined text-[13px]">android</span>
          Android App
        </span>
      );
    }
    if (p.includes("ios") || p.includes("iphone") || p.includes("ipad")) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100 text-slate-800 border border-slate-300">
          <span className="material-symbols-outlined text-[13px]">phone_iphone</span>
          iOS App
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
        <span className="material-symbols-outlined text-[13px]">language</span>
        Web / Mobile
      </span>
    );
  };

  const getKycBadge = (status: string) => {
    if (status === "VERIFIED") {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <span className="material-symbols-outlined text-[12px]">verified</span>
          UIDAI Aadhaar Verified
        </span>
      );
    }
    if (status === "PENDING") {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
          <span className="material-symbols-outlined text-[12px]">schedule</span>
          KYC Pending
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-50 text-slate-500 border border-slate-200">
        <span className="material-symbols-outlined text-[12px]">shield</span>
        Unverified
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Registered Users</h1>
            <span className="px-2 py-0.5 text-[11px] font-bold rounded-full bg-purple-100 text-[#5A31F4]">
              Real-Time Registry
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Complete telemetry for every user onboarding on StayQ: app platform (Android/iOS), geo-location, UIDAI KYC, and referral codes.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchUsers}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 shadow-sm transition-all active:scale-98"
          >
            <span className={`material-symbols-outlined text-[16px] ${isLoading ? "animate-spin" : ""}`}>
              sync
            </span>
            Refresh List
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">
            <span>Total Signups</span>
            <span className="material-symbols-outlined text-slate-400">group</span>
          </div>
          <div className="text-2xl font-black text-slate-900">{stats.total}</div>
          <div className="text-[11px] text-slate-500 mt-1">Successful homepage arrivals</div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">
            <span>Mobile App Users</span>
            <span className="material-symbols-outlined text-emerald-600">phone_android</span>
          </div>
          <div className="text-2xl font-black text-emerald-600">
            {stats.androidCount + stats.iosCount}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Android ({stats.androidCount}) &bull; iOS ({stats.iosCount})
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">
            <span>UIDAI KYC Verified</span>
            <span className="material-symbols-outlined text-blue-600">verified_user</span>
          </div>
          <div className="text-2xl font-black text-blue-600">{stats.kycVerifiedCount}</div>
          <div className="text-[11px] text-slate-500 mt-1">Ready for 100% instant booking</div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">
            <span>Host Partners</span>
            <span className="material-symbols-outlined text-purple-600">holiday_village</span>
          </div>
          <div className="text-2xl font-black text-[#5A31F4]">{stats.hostsCount}</div>
          <div className="text-[11px] text-slate-500 mt-1">Active listing hosts on platform</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative w-full md:w-96">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
              search
            </span>
            <input
              type="text"
              placeholder="Search by name, phone, email, referral code or city..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#5A31F4]/20 focus:border-[#5A31F4] transition-all"
            />
          </div>

          {/* Quick Filters */}
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            {/* Platform pills */}
            <div className="inline-flex rounded-xl bg-slate-100 p-0.5 text-xs font-semibold">
              {["ALL", "ANDROID", "IOS", "WEB"].map((p) => (
                <button
                  key={p}
                  onClick={() => setPlatformFilter(p)}
                  className={`px-2.5 py-1 rounded-lg transition-all ${
                    platformFilter === p
                      ? "bg-white text-slate-900 shadow-sm font-bold"
                      : "text-slate-500 hover:text-slate-900"
                  }`}
                >
                  {p === "ALL" ? "All Devices" : p === "ANDROID" ? "Android" : p === "IOS" ? "iOS" : "Web"}
                </button>
              ))}
            </div>

            {/* KYC Filter */}
            <select
              value={kycFilter}
              onChange={(e) => setKycFilter(e.target.value)}
              className="px-3 py-1.5 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl text-slate-700 outline-none"
            >
              <option value="ALL">All KYC Status</option>
              <option value="VERIFIED">UIDAI Verified Only</option>
              <option value="PENDING">Pending KYC Only</option>
              <option value="NOT_SUBMITTED">Unverified Only</option>
            </select>

            {/* Role Filter */}
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-3 py-1.5 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl text-slate-700 outline-none"
            >
              <option value="ALL">All Roles</option>
              <option value="GUEST">Guests Only</option>
              <option value="HOST">Hosts Only</option>
            </select>
          </div>
        </div>

        {/* Results summary & sorting */}
        <div className="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-100">
          <div>
            Showing <strong className="text-slate-900">{filteredUsers.length}</strong> of {users.length} registered users
          </div>
          <div className="flex items-center gap-2">
            <span>Sort by:</span>
            <button
              onClick={() => {
                if (sortField === "createdAt") setSortOrder(sortOrder === "desc" ? "asc" : "desc");
                else { setSortField("createdAt"); setSortOrder("desc"); }
              }}
              className={`font-semibold ${sortField === "createdAt" ? "text-[#5A31F4]" : "text-slate-600"}`}
            >
              Date {sortField === "createdAt" && (sortOrder === "desc" ? "↓" : "↑")}
            </button>
            &bull;
            <button
              onClick={() => {
                if (sortField === "loyaltyPoints") setSortOrder(sortOrder === "desc" ? "asc" : "desc");
                else { setSortField("loyaltyPoints"); setSortOrder("desc"); }
              }}
              className={`font-semibold ${sortField === "loyaltyPoints" ? "text-[#5A31F4]" : "text-slate-600"}`}
            >
              Points {sortField === "loyaltyPoints" && (sortOrder === "desc" ? "↓" : "↑")}
            </button>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-500 text-[11px] font-bold uppercase tracking-wider">
                <th className="py-3 px-4">User &amp; Contact</th>
                <th className="py-3 px-4">App Platform</th>
                <th className="py-3 px-4">Location</th>
                <th className="py-3 px-4">Trust &amp; Aadhaar</th>
                <th className="py-3 px-4">Referral Code</th>
                <th className="py-3 px-4">Loyalty</th>
                <th className="py-3 px-4">Joined On</th>
                <th className="py-3 px-4 text-right">360 Audit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-800">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <span className="material-symbols-outlined animate-spin text-2xl text-[#5A31F4]">
                        progress_activity
                      </span>
                      <span>Loading user registrations...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-1">
                      <span className="material-symbols-outlined text-3xl text-slate-300">
                        person_search
                      </span>
                      <p className="font-semibold text-slate-700">No registered users matched</p>
                      <p className="text-[11px]">Try adjusting your search query or filters.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const initials = u.displayName
                    ? u.displayName
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase()
                        .slice(0, 2)
                    : "SQ";

                  return (
                    <tr key={u.id} className="hover:bg-slate-50/60 transition-colors">
                      {/* User & Contact */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          {u.photoUrl ? (
                            <img
                              src={u.photoUrl}
                              alt={u.displayName}
                              className="w-9 h-9 rounded-full object-cover border border-purple-200 shadow-xs shrink-0"
                              onError={(e) => {
                                (e.target as HTMLElement).style.display = "none";
                              }}
                            />
                          ) : (
                            <div className="w-9 h-9 rounded-full bg-purple-100 text-[#5A31F4] font-bold text-xs flex items-center justify-center shrink-0 border border-purple-200">
                              {initials}
                            </div>
                          )}
                          <div>
                            <div className="font-bold text-slate-900 flex items-center gap-1.5">
                              <span>{u.displayName}</span>
                              {u.roles.includes("HOST") && (
                                <span className="px-1.5 py-0.2 rounded-full text-[9px] font-extrabold uppercase bg-purple-50 text-[#5A31F4] border border-purple-200">
                                  Host
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                              <span>{u.phone}</span>
                              {u.email && u.email !== "—" && (
                                <>
                                  &bull;
                                  <span className="text-slate-400 truncate max-w-[150px]">{u.email}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* App Platform */}
                      <td className="py-3 px-4">
                        {getPlatformBadge(u.platform)}
                      </td>

                      {/* Location */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1 text-slate-700 font-medium">
                          <span className="material-symbols-outlined text-[14px] text-slate-400">
                            location_on
                          </span>
                          <span>{u.location}</span>
                        </div>
                      </td>

                      {/* Trust & Aadhaar KYC */}
                      <td className="py-3 px-4">
                        {getKycBadge(u.kycStatus)}
                      </td>

                      {/* Referral Code */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded-lg border border-slate-200 text-[11px]">
                            {u.referralCode}
                          </span>
                          <button
                            onClick={() => copyToClipboard(u.referralCode, u.id)}
                            className="text-slate-400 hover:text-slate-700 transition-colors"
                            title="Copy referral code"
                          >
                            <span className="material-symbols-outlined text-[14px]">
                              {copiedId === u.id ? "check" : "content_copy"}
                            </span>
                          </button>
                        </div>
                      </td>

                      {/* Loyalty & Points */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">
                          {u.loyaltyPoints} <span className="font-normal text-slate-400 text-[10px]">pts</span>
                        </div>
                        <div className="text-[10px] font-semibold text-purple-700 uppercase tracking-wider">
                          {u.loyaltyTier}
                        </div>
                      </td>

                      {/* Registered At */}
                      <td className="py-3 px-4 text-slate-500 text-[11px]">
                        {formatDate(u.createdAt)}
                      </td>

                      {/* 360 Audit */}
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => {
                            setSelectedEntityId(u.id);
                            setDrawerOpen(true);
                          }}
                          className="px-2.5 py-1 rounded-lg text-xs font-bold text-[#5A31F4] bg-[#5A31F4]/8 hover:bg-[#5A31F4]/15 transition-colors cursor-pointer"
                        >
                          Inspect 360
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 360 Detail Drawer */}
      <EntityDetail360Drawer
        entityId={selectedEntityId}
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      />
    </div>
  );
}
