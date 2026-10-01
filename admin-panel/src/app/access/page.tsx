"use client";
import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";

interface StaffMember {
  id: string;
  staffId: string;
  fullName: string;
  email: string;
  department: string;
  role: "MASTER_ADMIN" | "STAFF";
  status: "ACTIVE" | "SUSPENDED" | "INACTIVE";
  allowedModules: string[];
  phoneNumber?: string;
  lastLoginAt?: string;
  lastLogoutAt?: string;
  lastActiveAt?: string;
  isOnline?: boolean;
  presenceStatus?: "ONLINE" | "IDLE" | "OFFLINE";
  currentSessionIp?: string;
  createdAt: string;
}

interface StaffActivity {
  id: string;
  staffId: string;
  staffName: string;
  email: string;
  module: string;
  action: string;
  description: string;
  targetId?: string;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
}

const AVAILABLE_MODULES = [
  {
    id: "properties",
    label: "Properties & Inventory",
    desc: "Create, edit, price, and manage stays, villas, hotels, and rentals",
    icon: "villa",
    category: "Inventory",
  },
  {
    id: "bookings",
    label: "Bookings & Reservations",
    desc: "View reservation ledger, guest manifests, passes, and check-in QR",
    icon: "calendar_month",
    category: "Operations",
  },
  {
    id: "hosts",
    label: "Hosts & Applications",
    desc: "Review host verification, KYC documents, and onboarding desks",
    icon: "home_work",
    category: "Operations",
  },
  {
    id: "revenue",
    label: "Accounts & Financials",
    desc: "Live platform revenue, commission breakdown, host payouts & TDS",
    icon: "payments",
    category: "Financials",
  },
  {
    id: "support",
    label: "Customer & Host Support",
    desc: "Support tickets, live guest resolution desk, and messaging",
    icon: "support_agent",
    category: "Experience",
  },
  {
    id: "reviews",
    label: "Reviews & Moderation",
    desc: "Moderate guest ratings, reviews, and community content",
    icon: "reviews",
    category: "Experience",
  },
  {
    id: "experiences",
    label: "Experiences & RVs",
    desc: "Manage trekking tours, outdoor activities, camping & caravans",
    icon: "explore",
    category: "Inventory",
  },
  {
    id: "promotions",
    label: "Promotions & Marketing",
    desc: "Create coupon discount codes, campaign vouchers & banner slots",
    icon: "campaign",
    category: "Growth",
  },
  {
    id: "analytics",
    label: "Platform Analytics & AI",
    desc: "Deep insights, revenue charts, Qube AI query logs & user trends",
    icon: "analytics",
    category: "Insights",
  },
];

const DEPARTMENTS = [
  "Executive & Strategy",
  "Operations & Ground Ops",
  "Finance & Accounts",
  "Customer Support Desk",
  "Host Onboarding & Kyc",
  "Marketing & Growth",
  "Trust, Safety & Grievance",
];

export default function AccessManagementPage() {
  // Navigation tabs
  const [activeTab, setActiveTab] = useState<"directory" | "attendance" | "activities">("directory");

  // Staff list & loading
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterDepartment, setFilterDepartment] = useState("ALL");
  const [filterRole, setFilterRole] = useState("ALL");

  // Activities list & loading
  const [activities, setActivities] = useState<StaffActivity[]>([]);
  const [activitiesLoading, setActivitiesLoading] = useState(false);
  const [activityStaffFilter, setActivityStaffFilter] = useState("ALL");
  const [activityModuleFilter, setActivityModuleFilter] = useState("ALL");

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCredsModalOpen, setIsCredsModalOpen] = useState(false);
  const [generatedCreds, setGeneratedCreds] = useState<{
    staffId: string;
    email: string;
    plainPassword: string;
  } | null>(null);

  // Form State
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [department, setDepartment] = useState("Operations & Ground Ops");
  const [role, setRole] = useState<"MASTER_ADMIN" | "STAFF">("STAFF");
  const [allowedModules, setAllowedModules] = useState<string[]>([
    "properties",
    "bookings",
  ]);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [customStaffId, setCustomStaffId] = useState("");
  const [customPassword, setCustomPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Fetch staff directory
  const fetchStaff = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const res = await axios.get("/api/v1/admin/staff");
      if (res.data?.staff) {
        setStaffList(res.data.staff);
      }
    } catch (err: any) {
      console.warn("Failed to fetch staff from API:", err);
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  // Fetch activity logs
  const fetchActivities = useCallback(async () => {
    try {
      setActivitiesLoading(true);
      const params: any = { limit: 50 };
      if (activityStaffFilter !== "ALL") params.staffId = activityStaffFilter;
      if (activityModuleFilter !== "ALL") params.module = activityModuleFilter;

      const res = await axios.get("/api/v1/admin/staff/activities", { params });
      if (res.data?.activities) {
        setActivities(res.data.activities);
      }
    } catch (err: any) {
      console.warn("Failed to fetch activities:", err);
    } finally {
      setActivitiesLoading(false);
    }
  }, [activityStaffFilter, activityModuleFilter]);

  useEffect(() => {
    fetchStaff();
  }, [fetchStaff]);

  useEffect(() => {
    if (activeTab === "activities") {
      fetchActivities();
    }
  }, [activeTab, fetchActivities]);

  // Periodic polling for live presence when on attendance tab
  useEffect(() => {
    if (activeTab === "attendance") {
      const interval = setInterval(() => {
        fetchStaff(true);
      }, 15000);
      return () => clearInterval(interval);
    }
  }, [activeTab, fetchStaff]);

  // Module checklist helpers
  const toggleModule = (modId: string) => {
    if (allowedModules.includes(modId)) {
      setAllowedModules(allowedModules.filter((id) => id !== modId));
    } else {
      setAllowedModules([...allowedModules, modId]);
    }
  };

  const selectAllModules = () => {
    setAllowedModules(AVAILABLE_MODULES.map((m) => m.id));
  };

  const deselectAllModules = () => {
    setAllowedModules([]);
  };

  const openCreateModal = () => {
    setSelectedStaff(null);
    setFullName("");
    setEmail("");
    setDepartment("Operations & Ground Ops");
    setRole("STAFF");
    setAllowedModules(["properties", "bookings"]);
    setPhoneNumber("");
    setCustomStaffId("");
    setCustomPassword("");
    setIsCreateModalOpen(true);
  };

  const openEditModal = (staff: StaffMember) => {
    setSelectedStaff(staff);
    setFullName(staff.fullName);
    setEmail(staff.email);
    setDepartment(staff.department);
    setRole(staff.role);
    setAllowedModules(staff.allowedModules || []);
    setPhoneNumber(staff.phoneNumber || "");
    setCustomStaffId(staff.staffId);
    setCustomPassword("");
    setIsEditModalOpen(true);
  };

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !email.trim()) {
      alert("Please fill in the Staff Full Name and Official Email.");
      return;
    }
    try {
      setSubmitting(true);
      const res = await axios.post("/api/v1/admin/staff", {
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
        department,
        role,
        allowedModules: role === "MASTER_ADMIN" ? AVAILABLE_MODULES.map((m) => m.id) : allowedModules,
        phoneNumber: phoneNumber.trim() || undefined,
        customStaffId: customStaffId.trim() || undefined,
        customPassword: customPassword.trim() || undefined,
      });

      if (res.data?.credentials) {
        setGeneratedCreds(res.data.credentials);
        setIsCreateModalOpen(false);
        setIsCredsModalOpen(true);
      } else {
        setIsCreateModalOpen(false);
      }

      setStatusMessage({
        type: "success",
        text: `Staff member ${res.data?.staff?.staffId} provisioned successfully. Credentials dispatched via official Hostinger mailer.`,
      });
      fetchStaff();
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to create staff member.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStaff) return;
    try {
      setSubmitting(true);
      await axios.patch(`/api/v1/admin/staff/${selectedStaff.id}`, {
        fullName: fullName.trim(),
        department,
        role,
        allowedModules: role === "MASTER_ADMIN" ? AVAILABLE_MODULES.map((m) => m.id) : allowedModules,
        phoneNumber: phoneNumber.trim() || undefined,
        newPassword: customPassword.trim() ? customPassword.trim() : undefined,
      });

      setIsEditModalOpen(false);
      setStatusMessage({
        type: "success",
        text: `Staff profile and permissions for ${selectedStaff.staffId} updated.`,
      });
      fetchStaff();
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to update staff member.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (staff: StaffMember) => {
    const nextStatus = staff.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE";
    try {
      await axios.patch(`/api/v1/admin/staff/${staff.id}`, {
        status: nextStatus,
      });
      fetchStaff();
    } catch (err) {
      alert("Failed to toggle staff status.");
    }
  };

  const handleResetPassword = async (staff: StaffMember) => {
    if (
      !confirm(
        `Are you sure you want to reset password for ${staff.fullName} (${staff.staffId})? A new password will be generated and emailed to ${staff.email}.`,
      )
    ) {
      return;
    }
    try {
      const res = await axios.post(`/api/v1/admin/staff/${staff.id}/reset-password`);
      if (res.data?.credentials) {
        setGeneratedCreds(res.data.credentials);
        setIsCredsModalOpen(true);
      }
      setStatusMessage({
        type: "success",
        text: `New password generated and emailed to ${staff.email}.`,
      });
    } catch (err) {
      alert("Failed to reset password.");
    }
  };

  const handleDeleteStaff = async (staff: StaffMember) => {
    if (
      !confirm(
        `Permanent Action: Are you sure you want to revoke and delete ${staff.staffId} (${staff.fullName})?`,
      )
    ) {
      return;
    }
    try {
      await axios.delete(`/api/v1/admin/staff/${staff.id}`);
      setStatusMessage({
        type: "success",
        text: `Staff member ${staff.staffId} has been revoked and removed.`,
      });
      fetchStaff();
    } catch (err) {
      alert("Failed to delete staff member.");
    }
  };

  // 1-Click Master Force Logout
  const handleForceLogout = async (staff: StaffMember) => {
    if (
      !confirm(
        `Force Terminate Session: This will instantly disconnect ${staff.fullName} (${staff.staffId}) and require them to re-login. Proceed?`,
      )
    ) {
      return;
    }

    try {
      setActionLoadingId(staff.id);
      await axios.post(`/api/v1/admin/staff/${staff.id}/force-logout`);
      setStatusMessage({
        type: "success",
        text: `Active session for ${staff.staffId} (${staff.fullName}) was terminated immediately.`,
      });
      await fetchStaff(true);
      if (activeTab === "activities") {
        fetchActivities();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to force logout staff member.");
    } finally {
      setActionLoadingId(null);
    }
  };

  // Presence stats calculation
  const onlineCount = staffList.filter((s) => s.presenceStatus === "ONLINE").length;
  const idleCount = staffList.filter((s) => s.presenceStatus === "IDLE").length;
  const offlineCount = staffList.filter((s) => !s.presenceStatus || s.presenceStatus === "OFFLINE").length;

  // Filtered List for Directory
  const filteredStaff = staffList.filter((s) => {
    const matchQuery =
      s.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.staffId.toLowerCase().includes(searchQuery.toLowerCase());
    const matchDept = filterDepartment === "ALL" || s.department === filterDepartment;
    const matchRole = filterRole === "ALL" || s.role === filterRole;
    return matchQuery && matchDept && matchRole;
  });

  const formatDateTime = (dateStr?: string) => {
    if (!dateStr) return "Never";
    const d = new Date(dateStr);
    return d.toLocaleString("en-IN", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const getTimeAgo = (dateStr?: string) => {
    if (!dateStr) return "Never";
    const diffMs = Date.now() - new Date(dateStr).getTime();
    const diffSec = Math.floor(diffMs / 1000);
    if (diffSec < 60) return `${diffSec}s ago`;
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${Math.floor(diffHours / 24)}d ago`;
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-16">
      {/* Top Header */}
      <div className="bg-white border-b border-slate-200 px-8 py-6 sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-[#5A31F4] tracking-wide uppercase mb-1">
              <span className="material-symbols-outlined text-sm">shield_person</span>
              Master Admin Gateway • RBAC &amp; Staff Control
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
              Staff Management &amp; Audit Center
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#5A31F4]/10 text-[#5A31F4] font-bold">
                {staffList.length} Team Members
              </span>
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Monitor active logins, configure role permissions per module, terminate sessions, and review operational audit logs.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => fetchStaff()}
              className="p-2.5 bg-slate-100 text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-200 transition-all cursor-pointer"
              title="Refresh Data"
            >
              <span className={`material-symbols-outlined text-lg ${loading ? "animate-spin" : ""}`}>
                sync
              </span>
            </button>
            <button
              onClick={openCreateModal}
              className="flex items-center gap-2 px-5 py-2.5 bg-[#5A31F4] text-white font-bold text-sm rounded-xl hover:bg-[#4823d9] shadow-md shadow-purple-500/20 transition-all active:scale-95 cursor-pointer"
            >
              <span className="material-symbols-outlined text-lg">person_add</span>
              Add Staff Employee
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="max-w-7xl mx-auto flex items-center gap-3 mt-6 border-b border-slate-100">
          <button
            onClick={() => setActiveTab("directory")}
            className={`pb-3 text-xs font-bold transition-all flex items-center gap-2 border-b-2 cursor-pointer ${
              activeTab === "directory"
                ? "border-[#5A31F4] text-[#5A31F4]"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <span className="material-symbols-outlined text-[17px]">groups</span>
            Staff Directory &amp; Permissions
            <span className="px-1.5 py-0.2 rounded-full bg-slate-100 text-slate-600 text-[10px]">
              {staffList.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("attendance")}
            className={`pb-3 text-xs font-bold transition-all flex items-center gap-2 border-b-2 cursor-pointer ${
              activeTab === "attendance"
                ? "border-[#5A31F4] text-[#5A31F4]"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <span className="material-symbols-outlined text-[17px]">badge</span>
            Live Attendance &amp; Presence
            {onlineCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-extrabold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                {onlineCount} Online
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab("activities")}
            className={`pb-3 text-xs font-bold transition-all flex items-center gap-2 border-b-2 cursor-pointer ${
              activeTab === "activities"
                ? "border-[#5A31F4] text-[#5A31F4]"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <span className="material-symbols-outlined text-[17px]">history_toggle_off</span>
            Staff Activity Tracker (Audit Log)
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-8 mt-8 space-y-6">
        {/* Status Toast */}
        {statusMessage && (
          <div
            className={`p-4 rounded-xl text-sm font-semibold flex items-center justify-between border ${
              statusMessage.type === "success"
                ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                : "bg-red-50 text-red-800 border-red-200"
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-lg">
                {statusMessage.type === "success" ? "check_circle" : "error"}
              </span>
              {statusMessage.text}
            </div>
            <button
              onClick={() => setStatusMessage(null)}
              className="text-xs font-bold uppercase underline cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 1: STAFF DIRECTORY & MODULE CLEARANCES */}
        {/* ======================================================== */}
        {activeTab === "directory" && (
          <>
            {/* Filters & Search Row */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="relative w-full md:w-80">
                <span className="material-symbols-outlined absolute left-3 top-2.5 text-slate-400 text-lg">
                  search
                </span>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by Name, Email, or Staff ID..."
                  className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:border-[#5A31F4] focus:bg-white transition-all"
                />
              </div>

              <div className="flex items-center gap-3 w-full md:w-auto">
                <select
                  value={filterDepartment}
                  onChange={(e) => setFilterDepartment(e.target.value)}
                  className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:border-[#5A31F4]"
                >
                  <option value="ALL">All Departments</option>
                  {DEPARTMENTS.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>

                <select
                  value={filterRole}
                  onChange={(e) => setFilterRole(e.target.value)}
                  className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:border-[#5A31F4]"
                >
                  <option value="ALL">All Roles</option>
                  <option value="MASTER_ADMIN">Master Admin</option>
                  <option value="STAFF">Staff Employee</option>
                </select>
              </div>
            </div>

            {/* Staff Members Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              {loading ? (
                <div className="p-12 text-center text-slate-400">
                  <span className="material-symbols-outlined text-4xl animate-spin text-[#5A31F4] mb-2">
                    progress_activity
                  </span>
                  <p className="text-sm font-semibold">Loading Staff Directory &amp; RBAC Ledger...</p>
                </div>
              ) : filteredStaff.length === 0 ? (
                <div className="p-16 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4 text-slate-400">
                    <span className="material-symbols-outlined text-3xl">badge</span>
                  </div>
                  <h3 className="text-base font-bold text-slate-800">No Staff Members Found</h3>
                  <p className="text-xs text-slate-500 mt-2 max-w-md mx-auto leading-relaxed">
                    {searchQuery || filterDepartment !== "ALL"
                      ? "No staff matched your filter criteria."
                      : "Start by onboarding your department staff members (Bookings, Accounts, or Customer Support)."}
                  </p>
                  {!searchQuery && (
                    <button
                      onClick={openCreateModal}
                      className="mt-5 px-5 py-2.5 bg-[#5A31F4] text-white font-bold text-xs rounded-xl hover:bg-[#4823d9] shadow-md shadow-purple-500/20 transition-all cursor-pointer"
                    >
                      Create Staff Account
                    </button>
                  )}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50/50 text-[11px] font-black uppercase tracking-wider text-slate-400">
                        <th className="py-3.5 px-6">Employee Profile</th>
                        <th className="py-3.5 px-6">Department &amp; Role</th>
                        <th className="py-3.5 px-6">Assigned RBAC Modules</th>
                        <th className="py-3.5 px-6">Status</th>
                        <th className="py-3.5 px-6 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs">
                      {filteredStaff.map((staff) => {
                        const isMaster = staff.role === "MASTER_ADMIN";
                        const isSuspended = staff.status === "SUSPENDED";
                        return (
                          <tr
                            key={staff.id}
                            className={`hover:bg-slate-50/70 transition-colors ${
                              isSuspended ? "opacity-60 bg-slate-50/30" : ""
                            }`}
                          >
                            {/* Profile */}
                            <td className="py-4 px-6">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#5A31F4]/20 to-purple-100 text-[#5A31F4] font-black flex items-center justify-center text-sm border border-[#5A31F4]/20 shadow-inner">
                                  {staff.fullName.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                  <div className="font-bold text-slate-900 flex items-center gap-2">
                                    {staff.fullName}
                                    <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-bold border border-slate-200">
                                      {staff.staffId}
                                    </span>
                                  </div>
                                  <div className="text-[11px] text-slate-500 font-medium">{staff.email}</div>
                                  {staff.phoneNumber && (
                                    <div className="text-[10px] text-slate-400 font-mono">{staff.phoneNumber}</div>
                                  )}
                                </div>
                              </div>
                            </td>

                            {/* Department & Role */}
                            <td className="py-4 px-6">
                              <div className="font-semibold text-slate-800">{staff.department}</div>
                              <div className="mt-1">
                                {isMaster ? (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                                    👑 MASTER ADMIN
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-50 text-[#5A31F4] border border-purple-200">
                                    👤 STAFF EMPLOYEE
                                  </span>
                                )}
                              </div>
                            </td>

                            {/* Allowed Modules */}
                            <td className="py-4 px-6 max-w-xs">
                              {isMaster ? (
                                <span className="text-[11px] font-black text-emerald-600 flex items-center gap-1">
                                  <span className="material-symbols-outlined text-sm">all_inclusive</span>
                                  Full Unrestricted Access (All Modules)
                                </span>
                              ) : staff.allowedModules && staff.allowedModules.length > 0 ? (
                                <div className="flex flex-wrap gap-1.5">
                                  {staff.allowedModules.map((modId) => {
                                    const modInfo = AVAILABLE_MODULES.find((m) => m.id === modId);
                                    return (
                                      <span
                                        key={modId}
                                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-semibold text-[10px] border border-slate-200"
                                      >
                                        <span className="material-symbols-outlined text-[11px] text-[#5A31F4]">
                                          {modInfo?.icon || "check"}
                                        </span>
                                        {modInfo?.label.split(" ")[0] || modId}
                                      </span>
                                    );
                                  })}
                                </div>
                              ) : (
                                <span className="text-slate-400 italic text-[11px]">No modules assigned</span>
                              )}
                            </td>

                            {/* Status */}
                            <td className="py-4 px-6">
                              <button
                                onClick={() => handleToggleStatus(staff)}
                                className={`inline-flex items-center gap-1 text-[10px] font-black px-2.5 py-1 rounded-full cursor-pointer transition-all ${
                                  staff.status === "ACTIVE"
                                    ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                                    : "bg-rose-100 text-rose-800 hover:bg-rose-200"
                                }`}
                                title="Click to toggle status"
                              >
                                <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                                {staff.status}
                              </button>
                            </td>

                            {/* Actions */}
                            <td className="py-4 px-6 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => openEditModal(staff)}
                                  className="p-1.5 text-slate-500 hover:text-[#5A31F4] hover:bg-purple-50 rounded-lg transition-colors cursor-pointer"
                                  title="Edit Permissions & Details"
                                >
                                  <span className="material-symbols-outlined text-lg">edit</span>
                                </button>
                                <button
                                  onClick={() => handleResetPassword(staff)}
                                  className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                                  title="Reset Password & Email Credentials"
                                >
                                  <span className="material-symbols-outlined text-lg">lock_reset</span>
                                </button>
                                <button
                                  onClick={() => handleDeleteStaff(staff)}
                                  className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                  title="Revoke & Delete Staff"
                                >
                                  <span className="material-symbols-outlined text-lg">delete</span>
                                </button>
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
          </>
        )}

        {/* ======================================================== */}
        {/* TAB 2: LIVE ATTENDANCE & PRESENCE TRACKING */}
        {/* ======================================================== */}
        {activeTab === "attendance" && (
          <div className="space-y-6">
            {/* Real-time Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-emerald-200/80 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Online Now (Active)
                  </p>
                  <p className="text-2xl font-black text-emerald-600 mt-1">{onlineCount}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">Heartbeat &lt; 2.5 mins</p>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
                  <span className="material-symbols-outlined text-2xl">sensors</span>
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-amber-200/80 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Idle (Away)
                  </p>
                  <p className="text-2xl font-black text-amber-600 mt-1">{idleCount}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">Heartbeat 2.5 - 5 mins</p>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100">
                  <span className="material-symbols-outlined text-2xl">hourglass_empty</span>
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Offline / Logged Out
                  </p>
                  <p className="text-2xl font-black text-slate-600 mt-1">{offlineCount}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">Session terminated</p>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-500 flex items-center justify-center border border-slate-200">
                  <span className="material-symbols-outlined text-2xl">power_off</span>
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-purple-200/80 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Total Staff Roster
                  </p>
                  <p className="text-2xl font-black text-[#5A31F4] mt-1">{staffList.length}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">Provisioned team</p>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-purple-50 text-[#5A31F4] flex items-center justify-center border border-purple-100">
                  <span className="material-symbols-outlined text-2xl">supervised_user_circle</span>
                </div>
              </div>
            </div>

            {/* Live Attendance Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                  <h3 className="font-bold text-sm text-slate-900">
                    Live Workstation Presence &amp; Session Controls
                  </h3>
                </div>
                <span className="text-[11px] text-slate-400 font-medium">
                  Auto-syncing every 15 seconds
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/50 text-[11px] font-black uppercase tracking-wider text-slate-400">
                      <th className="py-3.5 px-6">Employee</th>
                      <th className="py-3.5 px-6">Presence Status</th>
                      <th className="py-3.5 px-6">Last Login Time</th>
                      <th className="py-3.5 px-6">Last Heartbeat</th>
                      <th className="py-3.5 px-6">Session IP / Gateway</th>
                      <th className="py-3.5 px-6 text-right">Session Control</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {staffList.map((staff) => {
                      const isOnline = staff.presenceStatus === "ONLINE";
                      const isIdle = staff.presenceStatus === "IDLE";
                      const isOffline = !staff.presenceStatus || staff.presenceStatus === "OFFLINE";
                      const isActing = actionLoadingId === staff.id;

                      return (
                        <tr key={staff.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-4 px-6">
                            <div className="font-bold text-slate-900 flex items-center gap-2">
                              {staff.fullName}
                              <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-bold border border-slate-200">
                                {staff.staffId}
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-500">{staff.department}</div>
                          </td>

                          <td className="py-4 px-6">
                            {isOnline && (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold text-[11px]">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                                Online Now
                              </span>
                            )}
                            {isIdle && (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 font-bold text-[11px]">
                                <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                                Idle / Inactive
                              </span>
                            )}
                            {isOffline && (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 text-slate-500 border border-slate-200 font-semibold text-[11px]">
                                <span className="w-2 h-2 rounded-full bg-slate-400"></span>
                                Offline
                              </span>
                            )}
                          </td>

                          <td className="py-4 px-6 text-slate-700 font-medium">
                            {formatDateTime(staff.lastLoginAt)}
                          </td>

                          <td className="py-4 px-6 text-slate-600 font-medium">
                            {isOffline ? (
                              <span className="text-slate-400">
                                {staff.lastLogoutAt ? `Logged out ${getTimeAgo(staff.lastLogoutAt)}` : "Inactive"}
                              </span>
                            ) : (
                              <span className="text-emerald-700 font-bold">
                                {getTimeAgo(staff.lastActiveAt)}
                              </span>
                            )}
                          </td>

                          <td className="py-4 px-6 font-mono text-[11px] text-slate-600">
                            {staff.currentSessionIp || "Direct Gateway"}
                          </td>

                          <td className="py-4 px-6 text-right">
                            {isOnline || isIdle ? (
                              <button
                                onClick={() => handleForceLogout(staff)}
                                disabled={isActing}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 font-bold text-xs hover:bg-rose-100 transition-all cursor-pointer active:scale-95 disabled:opacity-50"
                                title="Instantly terminate staff session"
                              >
                                {isActing ? (
                                  <span className="material-symbols-outlined text-sm animate-spin">
                                    progress_activity
                                  </span>
                                ) : (
                                  <span className="material-symbols-outlined text-sm">logout</span>
                                )}
                                Force Logout
                              </button>
                            ) : (
                              <span className="text-[11px] text-slate-400 font-medium">
                                No Active Session
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 3: STAFF ACTIVITY TRACKER (AUDIT LOG) */}
        {/* ======================================================== */}
        {activeTab === "activities" && (
          <div className="space-y-6">
            {/* Filter row for activities */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3 w-full md:w-auto">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Filter by Staff Member
                  </label>
                  <select
                    value={activityStaffFilter}
                    onChange={(e) => setActivityStaffFilter(e.target.value)}
                    className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:border-[#5A31F4]"
                  >
                    <option value="ALL">All Staff Members</option>
                    {staffList.map((s) => (
                      <option key={s.staffId} value={s.staffId}>
                        {s.fullName} ({s.staffId})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Filter by Module
                  </label>
                  <select
                    value={activityModuleFilter}
                    onChange={(e) => setActivityModuleFilter(e.target.value)}
                    className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:border-[#5A31F4]"
                  >
                    <option value="ALL">All Modules</option>
                    <option value="auth">Auth &amp; Login</option>
                    <option value="staff">Staff Management</option>
                    <option value="properties">Properties &amp; Inventory</option>
                    <option value="bookings">Bookings</option>
                    <option value="revenue">Revenue &amp; Accounts</option>
                    <option value="hosts">Hosts &amp; Applications</option>
                    <option value="support">Customer Support</option>
                    <option value="reviews">Reviews</option>
                  </select>
                </div>
              </div>

              <button
                onClick={() => fetchActivities()}
                className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
              >
                <span className={`material-symbols-outlined text-sm ${activitiesLoading ? "animate-spin" : ""}`}>
                  refresh
                </span>
                Refresh Activity Stream
              </button>
            </div>

            {/* Activities Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              {activitiesLoading ? (
                <div className="p-12 text-center text-slate-400">
                  <span className="material-symbols-outlined text-4xl animate-spin text-[#5A31F4] mb-2">
                    progress_activity
                  </span>
                  <p className="text-sm font-semibold">Loading Activity Audit Ledger...</p>
                </div>
              ) : activities.length === 0 ? (
                <div className="p-16 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4 text-slate-400">
                    <span className="material-symbols-outlined text-3xl">history</span>
                  </div>
                  <h3 className="text-base font-bold text-slate-800">No Activity Logs Recorded Yet</h3>
                  <p className="text-xs text-slate-500 mt-2 max-w-md mx-auto leading-relaxed">
                    Actions performed by staff members (approving applications, updating bookings, logging in/out) will automatically show here in real-time.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50/50 text-[11px] font-black uppercase tracking-wider text-slate-400">
                        <th className="py-3.5 px-6">Timestamp</th>
                        <th className="py-3.5 px-6">Staff Member</th>
                        <th className="py-3.5 px-6">Action / Event</th>
                        <th className="py-3.5 px-6">Module</th>
                        <th className="py-3.5 px-6">Description</th>
                        <th className="py-3.5 px-6">Client IP</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs">
                      {activities.map((act) => {
                        let badgeBg = "bg-purple-50 text-[#5A31F4] border-purple-200";
                        if (act.action.includes("LOGIN")) badgeBg = "bg-emerald-50 text-emerald-700 border-emerald-200";
                        if (act.action.includes("LOGOUT")) badgeBg = "bg-slate-100 text-slate-600 border-slate-200";
                        if (act.action.includes("FORCE") || act.action.includes("REVOKE") || act.action.includes("DELETE"))
                          badgeBg = "bg-rose-50 text-rose-700 border-rose-200";
                        if (act.action.includes("RESET")) badgeBg = "bg-amber-50 text-amber-700 border-amber-200";

                        return (
                          <tr key={act.id} className="hover:bg-slate-50/70 transition-colors">
                            <td className="py-4 px-6 text-slate-500 whitespace-nowrap">
                              <div className="font-semibold text-slate-800">{formatDateTime(act.createdAt)}</div>
                              <div className="text-[10px] text-slate-400">{getTimeAgo(act.createdAt)}</div>
                            </td>

                            <td className="py-4 px-6">
                              <div className="font-bold text-slate-900">{act.staffName}</div>
                              <div className="font-mono text-[10px] text-slate-500">{act.staffId}</div>
                            </td>

                            <td className="py-4 px-6">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-md font-bold text-[10px] border ${badgeBg}`}>
                                {act.action}
                              </span>
                            </td>

                            <td className="py-4 px-6 font-semibold uppercase text-[10px] text-slate-500">
                              {act.module}
                            </td>

                            <td className="py-4 px-6 text-slate-700 font-medium max-w-sm">
                              {act.description}
                            </td>

                            <td className="py-4 px-6 font-mono text-[10px] text-slate-500">
                              {act.ipAddress || "Direct"}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ======================================================== */}
      {/* CREATE / EDIT STAFF MODAL */}
      {/* ======================================================== */}
      {(isCreateModalOpen || isEditModalOpen) && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-8 shadow-2xl border border-slate-200 my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#5A31F4] text-2xl">
                    {isCreateModalOpen ? "person_add" : "manage_accounts"}
                  </span>
                  {isCreateModalOpen ? "Onboard New Staff Employee" : `Edit Permissions: ${fullName}`}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Configure role assignment, department, and granular module permissions.
                </p>
              </div>
              <button
                onClick={() => {
                  setIsCreateModalOpen(false);
                  setIsEditModalOpen(false);
                }}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 cursor-pointer"
              >
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>

            <form
              onSubmit={isCreateModalOpen ? handleCreateStaff : handleUpdateStaff}
              className="mt-6 space-y-6"
            >
              {/* Basic Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Employee Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Rahul Sharma"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:border-[#5A31F4] focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Official Email *
                  </label>
                  <input
                    type="email"
                    required
                    disabled={isEditModalOpen}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. rahul@stayq.space"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:border-[#5A31F4] focus:bg-white disabled:opacity-60"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Department</label>
                  <select
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:border-[#5A31F4]"
                  >
                    {DEPARTMENTS.map((dept) => (
                      <option key={dept} value={dept}>
                        {dept}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Contact Phone (Optional)
                  </label>
                  <input
                    type="text"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:border-[#5A31F4] focus:bg-white"
                  />
                </div>

                {isCreateModalOpen && (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Custom Staff ID (Optional)
                    </label>
                    <input
                      type="text"
                      value={customStaffId}
                      onChange={(e) => setCustomStaffId(e.target.value)}
                      placeholder="e.g. SQ-EMP-1004 (or leave blank for auto)"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-semibold text-slate-900 focus:outline-none focus:border-[#5A31F4] focus:bg-white"
                    />
                  </div>
                )}
              </div>

              {/* Role Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">Access Level &amp; Authority</label>
                <div className="grid grid-cols-2 gap-3">
                  <div
                    onClick={() => setRole("STAFF")}
                    className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all ${
                      role === "STAFF"
                        ? "border-[#5A31F4] bg-[#5A31F4]/5 shadow-sm"
                        : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[#5A31F4]">badge</span>
                      <span className="font-bold text-xs text-slate-900">Staff Employee</span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Restricted exclusively to the specific modules selected below.
                    </p>
                  </div>

                  <div
                    onClick={() => setRole("MASTER_ADMIN")}
                    className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all ${
                      role === "MASTER_ADMIN"
                        ? "border-amber-500 bg-amber-50/50 shadow-sm"
                        : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-amber-600">admin_panel_settings</span>
                      <span className="font-bold text-xs text-slate-900">Master Admin</span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Unrestricted access to every department, financial ledger, and staff manager.
                    </p>
                  </div>
                </div>
              </div>

              {/* Custom Password (Optional) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {isCreateModalOpen
                    ? "Custom Initial Password (Leave blank for auto-generated secure password)"
                    : "Change Password (Leave blank to keep existing)"}
                </label>
                <input
                  type="text"
                  value={customPassword}
                  onChange={(e) => setCustomPassword(e.target.value)}
                  placeholder={isCreateModalOpen ? "e.g. StayQ@Staff2026 (or leave blank)" : "Enter new password..."}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-900 focus:outline-none focus:border-[#5A31F4] focus:bg-white"
                />
              </div>

              {/* Module Permissions Checkbox Grid (Only for STAFF role) */}
              {role === "STAFF" && (
                <div className="space-y-3 pt-2 border-t border-slate-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                        Granular RBAC Module Permissions
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        Choose which tools and dashboards this employee is permitted to view &amp; operate.
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={selectAllModules}
                        className="text-[11px] font-bold text-[#5A31F4] hover:underline cursor-pointer"
                      >
                        Select All
                      </button>
                      <span className="text-slate-300">|</span>
                      <button
                        type="button"
                        onClick={deselectAllModules}
                        className="text-[11px] font-bold text-slate-500 hover:underline cursor-pointer"
                      >
                        Clear All
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 max-h-60 overflow-y-auto pr-1">
                    {AVAILABLE_MODULES.map((mod) => {
                      const isChecked = allowedModules.includes(mod.id);
                      return (
                        <div
                          key={mod.id}
                          onClick={() => toggleModule(mod.id)}
                          className={`p-3 rounded-xl border flex items-start gap-3 cursor-pointer transition-all ${
                            isChecked
                              ? "bg-[#5A31F4]/5 border-[#5A31F4] text-slate-900 shadow-sm"
                              : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                          }`}
                        >
                          <div className="mt-0.5">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => {}}
                              className="accent-[#5A31F4] w-4 h-4 rounded cursor-pointer"
                            />
                          </div>
                          <div>
                            <div className="font-bold text-xs flex items-center gap-1.5">
                              <span className="material-symbols-outlined text-sm text-[#5A31F4]">
                                {mod.icon}
                              </span>
                              {mod.label}
                            </div>
                            <p className="text-[10px] text-slate-500 leading-tight mt-0.5">
                              {mod.desc}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Submit Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setIsCreateModalOpen(false);
                    setIsEditModalOpen(false);
                  }}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 rounded-xl bg-[#5A31F4] text-white font-bold text-xs hover:bg-[#4823d9] shadow-md shadow-purple-500/20 transition-all cursor-pointer flex items-center gap-2"
                >
                  {submitting && (
                    <span className="material-symbols-outlined text-sm animate-spin">
                      progress_activity
                    </span>
                  )}
                  {isCreateModalOpen ? "Save & Dispatch Credentials" : "Update Permissions"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* CREDENTIALS SUCCESS MODAL */}
      {/* ======================================================== */}
      {isCredsModalOpen && generatedCreds && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-8 shadow-2xl border border-slate-200 text-center">
            <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-4">
              <span className="material-symbols-outlined text-3xl">mark_email_read</span>
            </div>
            <h3 className="text-xl font-black text-slate-900">Credentials Dispatched!</h3>
            <p className="text-xs text-slate-500 mt-1">
              The employee has been provisioned and login credentials have been sent to their official email.
            </p>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-left my-5 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Staff ID:</span>
                <span className="font-mono font-bold text-slate-900">{generatedCreds.staffId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Official Email:</span>
                <span className="font-bold text-slate-900">{generatedCreds.email}</span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-slate-200">
                <span className="text-slate-500 font-medium">Password:</span>
                <span className="font-mono font-black text-[#5A31F4] text-sm bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                  {generatedCreds.plainPassword}
                </span>
              </div>
            </div>

            <button
              onClick={() => {
                setIsCredsModalOpen(false);
                setGeneratedCreds(null);
              }}
              className="w-full py-2.5 bg-[#5A31F4] text-white font-bold text-xs rounded-xl hover:bg-[#4823d9] transition-all cursor-pointer shadow-md shadow-purple-500/20"
            >
              Done &amp; Return to Roster
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
