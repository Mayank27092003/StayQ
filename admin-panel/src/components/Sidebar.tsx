"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

export default function Sidebar() {
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  const getLinkClasses = (href: string) => {
    const active = isActive(href);
    return `flex items-center gap-sm px-md py-sm rounded-xl transition-all duration-200 ${
      active
        ? "text-primary font-bold bg-primary/10 shadow-[0_2px_8px_rgba(157,0,255,0.08)]"
        : "text-on-surface-variant hover:text-primary hover:bg-surface-container-high hover:translate-x-0.5"
    }`;
  };

  return (
    <>
      <aside className="w-[280px] h-screen sticky top-0 left-0 bg-surface-container-lowest/70 backdrop-blur-2xl border-r border-outline-variant/30 flex flex-col py-lg space-y-md z-50">
        {/* Brand Header */}
        <div className="px-lg pb-md flex items-center gap-sm">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shrink-0 shadow-sm">
            <span className="material-symbols-outlined text-on-primary" style={{ fontVariationSettings: "'FILL' 1" }}>hotel_class</span>
          </div>
          <div>
            <h1 className="font-headline-md text-headline-md font-bold text-primary">Stay Q Admin</h1>
            <p className="font-label-md text-label-md text-on-surface-variant">Enterprise Control</p>
          </div>
        </div>

        {/* Scrollable Navigation Container */}
        <nav className="flex-1 overflow-y-auto px-sm flex flex-col gap-lg">
          {/* Inventory Categories (Separated per type) */}
          <div className="space-y-xs">
            <p className="px-md font-label-md text-label-md text-primary font-bold uppercase tracking-wider">Inventory Categories</p>
            <Link className={getLinkClasses("/properties")} href="/properties">
              <span className="material-symbols-outlined" style={{ fontVariationSettings: isActive("/properties") ? "'FILL' 1" : "normal" }}>villa</span>
              <span>Villas &amp; Stays</span>
            </Link>
            <Link className={getLinkClasses("/hotels")} href="/hotels">
              <span className="material-symbols-outlined" style={{ fontVariationSettings: isActive("/hotels") ? "'FILL' 1" : "normal" }}>hotel</span>
              <span>Hotels &amp; Resorts</span>
            </Link>
            <Link className={getLinkClasses("/rvs")} href="/rvs">
              <span className="material-symbols-outlined" style={{ fontVariationSettings: isActive("/rvs") ? "'FILL' 1" : "normal" }}>rv_hookup</span>
              <span>RVs &amp; Campervans</span>
            </Link>
            <Link className={getLinkClasses("/camping")} href="/camping">
              <span className="material-symbols-outlined" style={{ fontVariationSettings: isActive("/camping") ? "'FILL' 1" : "normal" }}>camping</span>
              <span>Camps &amp; Glamping</span>
            </Link>
            <Link className={getLinkClasses("/experiences")} href="/experiences">
              <span className="material-symbols-outlined" style={{ fontVariationSettings: isActive("/experiences") ? "'FILL' 1" : "normal" }}>explore</span>
              <span>Curated Experiences</span>
            </Link>
            <Link className={getLinkClasses("/rentals")} href="/rentals">
              <span className="material-symbols-outlined" style={{ fontVariationSettings: isActive("/rentals") ? "'FILL' 1" : "normal" }}>key</span>
              <span>Zero-Broker Rentals</span>
            </Link>
          </div>

          {/* Operations */}
          <div className="space-y-xs">
            <p className="px-md font-label-md text-label-md text-outline uppercase tracking-wider">Operations</p>
            <Link className={getLinkClasses("/")} href="/">
              <span className="material-symbols-outlined" style={{ fontVariationSettings: isActive("/") ? "'FILL' 1" : "normal" }}>dashboard</span>
              <span>Dashboard</span>
            </Link>
            <Link className={getLinkClasses("/leads")} href="/leads">
              <span className="material-symbols-outlined" style={{ fontVariationSettings: isActive("/leads") ? "'FILL' 1" : "normal" }}>group_add</span>
              <span className="flex-1">Host Leads</span>
              <span className="px-1.5 py-0.5 text-[10px] font-bold uppercase rounded bg-primary/20 text-primary">New</span>
            </Link>
            <Link className={getLinkClasses("/bookings")} href="/bookings">
              <span className="material-symbols-outlined" style={{ fontVariationSettings: isActive("/bookings") ? "'FILL' 1" : "normal" }}>calendar_month</span>
              <span>Bookings</span>
            </Link>
            <Link className={getLinkClasses("/people")} href="/people">
              <span className="material-symbols-outlined" style={{ fontVariationSettings: isActive("/people") ? "'FILL' 1" : "normal" }}>group</span>
              <span>People</span>
            </Link>
            <Link className={getLinkClasses("/hosts")} href="/hosts">
              <span className="material-symbols-outlined" style={{ fontVariationSettings: isActive("/hosts") ? "'FILL' 1" : "normal" }}>home_work</span>
              <span>Hosts</span>
            </Link>
            <Link className={getLinkClasses("/host-applications")} href="/host-applications">
              <span className="material-symbols-outlined" style={{ fontVariationSettings: isActive("/host-applications") ? "'FILL' 1" : "normal" }}>assignment_ind</span>
              <span>Host Applications</span>
            </Link>
          </div>

          {/* Growth */}
          <div className="space-y-xs">
            <p className="px-md font-label-md text-label-md text-outline uppercase tracking-wider">Growth</p>
            <Link className={getLinkClasses("/promotions")} href="/promotions">
              <span className="material-symbols-outlined" style={{ fontVariationSettings: isActive("/promotions") ? "'FILL' 1" : "normal" }}>campaign</span>
              <span>Promotions</span>
            </Link>
            <Link className={getLinkClasses("/featured-content")} href="/featured-content">
              <span className="material-symbols-outlined" style={{ fontVariationSettings: isActive("/featured-content") ? "'FILL' 1" : "normal" }}>star</span>
              <span>Featured Content</span>
            </Link>
            <Link className={getLinkClasses("/catalog")} href="/catalog">
              <span className="material-symbols-outlined" style={{ fontVariationSettings: isActive("/catalog") ? "'FILL' 1" : "normal" }}>inventory_2</span>
              <span>Catalog</span>
            </Link>
          </div>

          {/* Experience */}
          <div className="space-y-xs">
            <p className="px-md font-label-md text-label-md text-outline uppercase tracking-wider">Experience</p>
            <Link className={getLinkClasses("/reviews")} href="/reviews">
              <span className="material-symbols-outlined" style={{ fontVariationSettings: isActive("/reviews") ? "'FILL' 1" : "normal" }}>reviews</span>
              <span>Reviews</span>
            </Link>
            <Link className={getLinkClasses("/moderation")} href="/moderation">
              <span className="material-symbols-outlined" style={{ fontVariationSettings: isActive("/moderation") ? "'FILL' 1" : "normal" }}>gavel</span>
              <span>Moderation</span>
            </Link>
            <Link className={getLinkClasses("/support")} href="/support">
              <span className="material-symbols-outlined" style={{ fontVariationSettings: isActive("/support") ? "'FILL' 1" : "normal" }}>help</span>
              <span>Support</span>
            </Link>
            <Link className={getLinkClasses("/notifications")} href="/notifications">
              <span className="material-symbols-outlined" style={{ fontVariationSettings: isActive("/notifications") ? "'FILL' 1" : "normal" }}>notifications</span>
              <span>Notifications</span>
            </Link>
          </div>

          {/* Insights */}
          <div className="space-y-xs">
            <p className="px-md font-label-md text-label-md text-outline uppercase tracking-wider">Insights</p>
            <Link className={getLinkClasses("/analytics")} href="/analytics">
              <span className="material-symbols-outlined" style={{ fontVariationSettings: isActive("/analytics") ? "'FILL' 1" : "normal" }}>analytics</span>
              <span>Analytics</span>
            </Link>
            <Link className={getLinkClasses("/reports")} href="/reports">
              <span className="material-symbols-outlined" style={{ fontVariationSettings: isActive("/reports") ? "'FILL' 1" : "normal" }}>description</span>
              <span>Reports</span>
            </Link>
          </div>

          {/* Financials */}
          <div className="space-y-xs">
            <p className="px-md font-label-md text-label-md text-outline uppercase tracking-wider">Financials</p>
            <Link className={getLinkClasses("/revenue")} href="/revenue">
              <span className="material-symbols-outlined" style={{ fontVariationSettings: isActive("/revenue") ? "'FILL' 1" : "normal" }}>percent</span>
              <span className="flex-1">Commission &amp; Revenue</span>
              <span className="px-1.5 py-0.5 text-[9px] font-bold uppercase rounded bg-primary/20 text-primary">Live</span>
            </Link>
            <Link className={getLinkClasses("/taxes")} href="/taxes">
              <span className="material-symbols-outlined" style={{ fontVariationSettings: isActive("/taxes") ? "'FILL' 1" : "normal" }}>account_balance</span>
              <span>Tax &amp; TDS (194-O)</span>
            </Link>
          </div>

          {/* Security & Access Management */}
          <div className="space-y-xs">
            <p className="px-md font-label-md text-label-md text-outline uppercase tracking-wider">Security &amp; RBAC</p>
            <Link className={getLinkClasses("/access")} href="/access">
              <span className="material-symbols-outlined" style={{ fontVariationSettings: isActive("/access") ? "'FILL' 1" : "normal" }}>shield_person</span>
              <span className="flex-1">Staff &amp; Access</span>
              <span className="px-1.5 py-0.5 text-[9px] font-bold uppercase rounded bg-primary/20 text-primary">Master</span>
            </Link>
          </div>
        </nav>

        {/* User / Logout */}
        <div className="px-md pt-sm border-t border-outline-variant/30 flex items-center justify-between">
          <div className="flex items-center gap-sm">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center font-bold text-primary text-xs">
              AD
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-semibold text-on-surface truncate">Admin Team</p>
              <p className="text-xs text-on-surface-variant truncate">grievance@stayq.space</p>
            </div>
          </div>
          <button
            onClick={() => setIsReportModalOpen(true)}
            className="p-1.5 rounded-lg text-on-surface-variant hover:text-error hover:bg-error/10 transition-colors"
            title="Download System Report"
          >
            <span className="material-symbols-outlined text-[20px]">download</span>
          </button>
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
