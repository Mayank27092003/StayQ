"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useAdminAuth } from "@/context/AdminAuthContext";

export default function Sidebar() {
  const { adminUser, logout, hasModuleAccess } = useAdminAuth();
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const pathname = usePathname();

  const isMasterAdmin = adminUser?.role === "MASTER_ADMIN";

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  const getLinkClasses = (href: string) => {
    const active = isActive(href);
    return `flex items-center gap-2.5 px-3 py-2 rounded-xl text-[13px] font-semibold transition-all duration-150 ${
      active
        ? "text-[#5A31F4] bg-[#5A31F4]/8 font-bold shadow-sm"
        : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/80"
    }`;
  };

  // Module Clearance checks
  const canSeeAnalytics = hasModuleAccess("analytics");
  const canSeeReports = hasModuleAccess("analytics") || hasModuleAccess("revenue") || hasModuleAccess("export");

  const canSeeProperties = hasModuleAccess("properties");
  const canSeeRvs = hasModuleAccess("properties") || hasModuleAccess("experiences");
  const canSeeCamping = hasModuleAccess("properties") || hasModuleAccess("experiences");
  const canSeeExperiences = hasModuleAccess("experiences");
  const canSeeRentals = hasModuleAccess("properties");
  const showInventoryGroup = canSeeProperties || canSeeRvs || canSeeCamping || canSeeExperiences || canSeeRentals;

  const canSeeBookings = hasModuleAccess("bookings");
  const canSeeHosts = hasModuleAccess("hosts");
  const canSeeApplications = hasModuleAccess("hosts");
  const canSeeLeads = hasModuleAccess("hosts");
  const canSeeSupport = hasModuleAccess("support");
  const canSeeReviews = hasModuleAccess("reviews");
  const showOperationsGroup = canSeeBookings || canSeeHosts || canSeeApplications || canSeeLeads || canSeeSupport || canSeeReviews;

  const canSeeRevenue = hasModuleAccess("revenue");
  const canSeeTaxes = hasModuleAccess("taxes") || hasModuleAccess("revenue");
  const canSeeAccess = isMasterAdmin; // Strictly Master Admin only
  const canSeeExport = hasModuleAccess("export") || hasModuleAccess("revenue");
  const showFinanceGroup = canSeeRevenue || canSeeTaxes || canSeeAccess || canSeeExport;

  return (
    <>
      <aside className="w-[260px] h-screen sticky top-0 left-0 bg-white border-r border-slate-200/80 flex flex-col py-4 z-50 select-none">
        {/* Brand Header */}
        <div className="px-5 pb-4 flex items-center gap-3 border-b border-slate-100">
          <div className="w-9 h-9 rounded-xl bg-[#5A31F4] flex items-center justify-center shrink-0 shadow-md shadow-purple-500/20">
            <span className="material-symbols-outlined text-white text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>hotel_class</span>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="text-sm font-bold text-slate-900 tracking-tight">Stay Q</h1>
              <span className={`px-1.5 py-0.2 rounded-full text-[9px] font-extrabold uppercase ${
                isMasterAdmin ? "bg-purple-100 text-[#5A31F4]" : "bg-emerald-100 text-emerald-700"
              }`}>
                {isMasterAdmin ? "Master" : "Staff"}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium">Operations Center</p>
          </div>
        </div>

        {/* Scrollable Navigation Container */}
        <nav className="flex-1 overflow-y-auto px-3 flex flex-col gap-5 py-2">
          {/* 1. Overview */}
          <div className="space-y-1">
            <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">Overview</p>
            <Link className={getLinkClasses("/")} href="/">
              <span className="material-symbols-outlined text-[19px]" style={{ fontVariationSettings: isActive("/") ? "'FILL' 1" : "normal" }}>grid_view</span>
              <span>Dashboard</span>
            </Link>
            {canSeeAnalytics && (
              <Link className={getLinkClasses("/analytics")} href="/analytics">
                <span className="material-symbols-outlined text-[19px]" style={{ fontVariationSettings: isActive("/analytics") ? "'FILL' 1" : "normal" }}>trending_up</span>
                <span>Analytics</span>
              </Link>
            )}
            {canSeeReports && (
              <Link className={getLinkClasses("/reports")} href="/reports">
                <span className="material-symbols-outlined text-[19px]" style={{ fontVariationSettings: isActive("/reports") ? "'FILL' 1" : "normal" }}>description</span>
                <span>Reports &amp; Logs</span>
              </Link>
            )}
          </div>

          {/* 2. Inventory */}
          {showInventoryGroup && (
            <div className="space-y-1">
              <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">Inventory</p>
              {canSeeProperties && (
                <Link className={getLinkClasses("/properties")} href="/properties">
                  <span className="material-symbols-outlined text-[19px]" style={{ fontVariationSettings: isActive("/properties") ? "'FILL' 1" : "normal" }}>villa</span>
                  <span>Villas &amp; Stays</span>
                </Link>
              )}
              {canSeeRvs && (
                <Link className={getLinkClasses("/rvs")} href="/rvs">
                  <span className="material-symbols-outlined text-[19px]" style={{ fontVariationSettings: isActive("/rvs") ? "'FILL' 1" : "normal" }}>rv_hookup</span>
                  <span>RVs &amp; Caravans</span>
                </Link>
              )}
              {canSeeCamping && (
                <Link className={getLinkClasses("/camping")} href="/camping">
                  <span className="material-symbols-outlined text-[19px]" style={{ fontVariationSettings: isActive("/camping") ? "'FILL' 1" : "normal" }}>camping</span>
                  <span>Camps &amp; Glamping</span>
                </Link>
              )}
              {canSeeExperiences && (
                <Link className={getLinkClasses("/experiences")} href="/experiences">
                  <span className="material-symbols-outlined text-[19px]" style={{ fontVariationSettings: isActive("/experiences") ? "'FILL' 1" : "normal" }}>explore</span>
                  <span>Experiences</span>
                </Link>
              )}
              {canSeeRentals && (
                <Link className={getLinkClasses("/rentals")} href="/rentals">
                  <span className="material-symbols-outlined text-[19px]" style={{ fontVariationSettings: isActive("/rentals") ? "'FILL' 1" : "normal" }}>key</span>
                  <span>Zero-Broker Lofts</span>
                </Link>
              )}
            </div>
          )}

          {/* 3. Operations & Hosts */}
          {showOperationsGroup && (
            <div className="space-y-1">
              <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">Operations</p>
              {canSeeBookings && (
                <Link className={getLinkClasses("/bookings")} href="/bookings">
                  <span className="material-symbols-outlined text-[19px]" style={{ fontVariationSettings: isActive("/bookings") ? "'FILL' 1" : "normal" }}>calendar_today</span>
                  <span>Bookings</span>
                </Link>
              )}
              {canSeeHosts && (
                <Link className={getLinkClasses("/hosts")} href="/hosts">
                  <span className="material-symbols-outlined text-[19px]" style={{ fontVariationSettings: isActive("/hosts") ? "'FILL' 1" : "normal" }}>home_work</span>
                  <span>Hosts Directory</span>
                </Link>
              )}
              {canSeeApplications && (
                <Link className={getLinkClasses("/host-applications")} href="/host-applications">
                  <span className="material-symbols-outlined text-[19px]" style={{ fontVariationSettings: isActive("/host-applications") ? "'FILL' 1" : "normal" }}>how_to_reg</span>
                  <span className="flex-1">Applications</span>
                  <span className="px-1.5 py-0.2 text-[9px] font-bold rounded-full bg-amber-50 text-amber-700 border border-amber-200">Review</span>
                </Link>
              )}
              {canSeeLeads && (
                <Link className={getLinkClasses("/leads")} href="/leads">
                  <span className="material-symbols-outlined text-[19px]" style={{ fontVariationSettings: isActive("/leads") ? "'FILL' 1" : "normal" }}>person_add</span>
                  <span className="flex-1">Host Leads</span>
                  <span className="px-1.5 py-0.2 text-[9px] font-bold rounded-full bg-purple-50 text-[#5A31F4] border border-purple-200">New</span>
                </Link>
              )}
              {canSeeSupport && (
                <>
                  <Link className={getLinkClasses("/support")} href="/support">
                    <span className="material-symbols-outlined text-[19px]" style={{ fontVariationSettings: isActive("/support") ? "'FILL' 1" : "normal" }}>support_agent</span>
                    <span>Support Desk</span>
                  </Link>
                  <Link className={getLinkClasses("/conversations")} href="/conversations">
                    <span className="material-symbols-outlined text-[19px]" style={{ fontVariationSettings: isActive("/conversations") ? "'FILL' 1" : "normal" }}>forum</span>
                    <span className="flex-1">Guest-Host Chats</span>
                    <span className="px-1.5 py-0.2 text-[9px] font-bold rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200">Live</span>
                  </Link>
                </>
              )}
              {canSeeReviews && (
                <Link className={getLinkClasses("/reviews")} href="/reviews">
                  <span className="material-symbols-outlined text-[19px]" style={{ fontVariationSettings: isActive("/reviews") ? "'FILL' 1" : "normal" }}>star_outline</span>
                  <span>Reviews</span>
                </Link>
              )}
            </div>
          )}

          {/* 4. Finance & Platform */}
          {showFinanceGroup && (
            <div className="space-y-1">
              <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">Finance &amp; Admin</p>
              {canSeeRevenue && (
                <Link className={getLinkClasses("/revenue")} href="/revenue">
                  <span className="material-symbols-outlined text-[19px]" style={{ fontVariationSettings: isActive("/revenue") ? "'FILL' 1" : "normal" }}>payments</span>
                  <span className="flex-1">Revenue &amp; Payouts</span>
                </Link>
              )}
              {canSeeRevenue && (
                <Link className={getLinkClasses("/subscriptions")} href="/subscriptions">
                  <span className="material-symbols-outlined text-[19px]" style={{ fontVariationSettings: isActive("/subscriptions") ? "'FILL' 1" : "normal" }}>workspace_premium</span>
                  <span className="flex-1">Host Subscriptions</span>
                  <span className="px-1.5 py-0.2 text-[9px] font-bold rounded-full bg-purple-50 text-[#5A31F4] border border-purple-200">Plans</span>
                </Link>
              )}
              {canSeeTaxes && (
                <Link className={getLinkClasses("/taxes")} href="/taxes">
                  <span className="material-symbols-outlined text-[19px]" style={{ fontVariationSettings: isActive("/taxes") ? "'FILL' 1" : "normal" }}>account_balance</span>
                  <span>TDS &amp; Compliance</span>
                </Link>
              )}
              {canSeeAccess && (
                <Link className={getLinkClasses("/access")} href="/access">
                  <span className="material-symbols-outlined text-[19px]" style={{ fontVariationSettings: isActive("/access") ? "'FILL' 1" : "normal" }}>shield</span>
                  <span className="flex-1">Staff &amp; Access</span>
                  <span className="px-1.5 py-0.2 text-[9px] font-bold rounded-full bg-purple-50 text-[#5A31F4] border border-purple-200">Master</span>
                </Link>
              )}
              {canSeeExport && (
                <Link className={getLinkClasses("/export")} href="/export">
                  <span className="material-symbols-outlined text-[19px]" style={{ fontVariationSettings: isActive("/export") ? "'FILL' 1" : "normal" }}>cloud_download</span>
                  <span>Data Export</span>
                </Link>
              )}
            </div>
          )}
        </nav>

        {/* User / Logout */}
        <div className="px-4 pt-3 border-t border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-[#5A31F4]/10 text-[#5A31F4] flex items-center justify-center font-bold text-xs shrink-0 border border-[#5A31F4]/20">
              {adminUser?.fullName ? adminUser.fullName.slice(0, 2).toUpperCase() : "AD"}
            </div>
            <div className="overflow-hidden min-w-0">
              <div className="flex items-center gap-1.5">
                <p className="text-xs font-bold text-slate-800 truncate">{adminUser?.fullName || "Admin Team"}</p>
              </div>
              <p className="text-[10px] font-medium text-slate-400 truncate">{adminUser?.staffId || "ADMIN-001"}</p>
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => setIsReportModalOpen(true)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              title="Download System Report"
            >
              <span className="material-symbols-outlined text-[18px]">download</span>
            </button>
            <button
              onClick={() => logout()}
              className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition-colors cursor-pointer"
              title="Sign Out"
            >
              <span className="material-symbols-outlined text-[18px]">logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Report Modal */}
      {isReportModalOpen && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            backgroundColor: "rgba(0, 0, 0, 0.65)",
            backdropFilter: "blur(6px)",
            zIndex: 99999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "1rem",
          }}
          onClick={() => setIsReportModalOpen(false)}
        >
          <div
            style={{
              backgroundColor: "#ffffff",
              padding: "1.75rem",
              borderRadius: "20px",
              width: "100%",
              maxWidth: "460px",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.35)",
              border: "1px solid #e2e8f0",
              display: "flex",
              flexDirection: "column",
              gap: "1rem",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <span className="material-symbols-outlined" style={{ color: "#9D00FF", fontSize: "24px" }}>
                  download
                </span>
                <h3 style={{ fontSize: "1.2rem", fontWeight: 800, color: "#0f172a", margin: 0 }}>
                  Export System Report
                </h3>
              </div>
              <button
                onClick={() => setIsReportModalOpen(false)}
                style={{
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  color: "#64748b",
                  display: "flex",
                  alignItems: "center",
                  padding: "4px",
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>close</span>
              </button>
            </div>

            <p style={{ fontSize: "0.9rem", color: "#64748b", lineHeight: 1.5, margin: 0 }}>
              Download comprehensive audit logs, verified bookings ledger, host payouts, and platform commission breakdown as a consolidated CSV / PDF data bundle.
            </p>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "0.5rem" }}>
              <button
                type="button"
                onClick={() => setIsReportModalOpen(false)}
                style={{
                  padding: "0.6rem 1.2rem",
                  borderRadius: "10px",
                  border: "1px solid #cbd5e1",
                  background: "#ffffff",
                  color: "#334155",
                  fontWeight: 600,
                  fontSize: "0.88rem",
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  alert("Report bundle exported successfully!");
                  setIsReportModalOpen(false);
                }}
                style={{
                  padding: "0.6rem 1.4rem",
                  borderRadius: "10px",
                  border: "none",
                  background: "#9D00FF",
                  color: "#ffffff",
                  fontWeight: 700,
                  fontSize: "0.88rem",
                  cursor: "pointer",
                  boxShadow: "0 4px 12px rgba(157, 0, 255, 0.3)",
                }}
              >
                Export CSV Bundle
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
