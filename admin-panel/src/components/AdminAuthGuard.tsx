"use client";

import React, { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAdminAuth } from "@/context/AdminAuthContext";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";

export default function AdminAuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, adminUser, hasModuleAccess } = useAdminAuth();
  const pathname = usePathname();
  const router = useRouter();

  const isLoginPage = pathname === "/login" || pathname === "/login/" || pathname?.startsWith("/login");

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated && !isLoginPage) {
        // Block unauthenticated visitors and redirect immediately to /login/
        router.replace("/login/");
      } else if (isAuthenticated && isLoginPage) {
        // If already logged in and on /login, redirect to main dashboard
        router.replace("/");
      }
    }
  }, [isAuthenticated, isLoading, isLoginPage, router]);

  // If loading session from disk, show clean enterprise shield screen
  if (isLoading) {
    return (
      <div className="min-h-screen w-full bg-[#0f172a] flex flex-col items-center justify-center p-4">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center shadow-2xl shadow-purple-500/30 animate-pulse mb-4">
          <span className="material-symbols-outlined text-white text-3xl">admin_panel_settings</span>
        </div>
        <h2 className="text-white font-bold text-lg tracking-wide">Stay Q Command Center</h2>
        <p className="text-slate-400 text-xs mt-1 font-medium">Verifying security clearances...</p>
      </div>
    );
  }

  // If on login page, render full screen login UI without Sidebar or Header
  if (isLoginPage) {
    return <>{children}</>;
  }

  // If not authenticated, do not render dashboard content while redirecting
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen w-full bg-[#0f172a] flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 rounded-xl bg-red-500/20 text-red-400 flex items-center justify-center mb-3">
          <span className="material-symbols-outlined text-2xl">lock</span>
        </div>
        <h3 className="text-white font-semibold text-base">Authentication Required</h3>
        <p className="text-slate-400 text-xs mt-1">Redirecting to secure login portal...</p>
      </div>
    );
  }

  // Route-level RBAC Check
  const isMaster = adminUser?.role === "MASTER_ADMIN";
  let hasRouteAccess = true;
  let requiredModuleName = "";

  if (!isMaster && pathname) {
    if (pathname.startsWith("/access")) {
      hasRouteAccess = false;
      requiredModuleName = "Staff & Access Control (Master Admin Only)";
    } else if (
      pathname.startsWith("/properties") ||
      pathname.startsWith("/rvs") ||
      pathname.startsWith("/camping") ||
      pathname.startsWith("/rentals")
    ) {
      hasRouteAccess = hasModuleAccess("properties") || hasModuleAccess("experiences");
      requiredModuleName = "Properties & Inventory";
    } else if (pathname.startsWith("/experiences")) {
      hasRouteAccess = hasModuleAccess("experiences");
      requiredModuleName = "Experiences & Outdoor";
    } else if (pathname.startsWith("/bookings")) {
      hasRouteAccess = hasModuleAccess("bookings");
      requiredModuleName = "Bookings & Reservations";
    } else if (
      pathname.startsWith("/hosts") ||
      pathname.startsWith("/host-applications") ||
      pathname.startsWith("/leads")
    ) {
      hasRouteAccess = hasModuleAccess("hosts");
      requiredModuleName = "Hosts Directory & Applications";
    } else if (pathname.startsWith("/revenue") || pathname.startsWith("/subscriptions")) {
      hasRouteAccess = hasModuleAccess("revenue");
      requiredModuleName = "Revenue & Subscriptions";
    } else if (pathname.startsWith("/taxes")) {
      hasRouteAccess = hasModuleAccess("taxes") || hasModuleAccess("revenue");
      requiredModuleName = "TDS & Tax Compliance";
    } else if (pathname.startsWith("/support") || pathname.startsWith("/conversations")) {
      hasRouteAccess = hasModuleAccess("support");
      requiredModuleName = "Support Desk & Chat Monitor";
    } else if (pathname.startsWith("/reviews")) {
      hasRouteAccess = hasModuleAccess("reviews");
      requiredModuleName = "Reviews & Moderation";
    } else if (pathname.startsWith("/analytics")) {
      hasRouteAccess = hasModuleAccess("analytics") || hasModuleAccess("revenue");
      requiredModuleName = "Analytics & Platform Insights";
    } else if (pathname.startsWith("/export") || pathname.startsWith("/reports")) {
      hasRouteAccess = hasModuleAccess("export") || hasModuleAccess("revenue") || hasModuleAccess("analytics");
      requiredModuleName = "Data Export & Reports";
    }
  }

  // If staff attempts direct URL access to restricted module
  if (!hasRouteAccess) {
    return (
      <div className="flex min-h-screen w-full bg-[#f8fafc]">
        <Sidebar />
        <main className="flex-1 flex flex-col min-w-0 bg-[#f8fafc]">
          <Header />
          <div className="flex-1 p-gutter max-w-4xl mx-auto w-full flex items-center justify-center">
            <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-xl max-w-lg w-full text-center">
              <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-600 flex items-center justify-center mx-auto mb-4">
                <span className="material-symbols-outlined text-3xl">security</span>
              </div>
              <span className="px-3 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-xs font-bold uppercase tracking-wider">
                Clearance Level Restricted
              </span>
              <h2 className="text-xl font-bold text-slate-900 mt-3">Access Denied to Module</h2>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                Your staff profile (<span className="font-semibold text-slate-700">{adminUser?.staffId}</span> -{" "}
                <span className="font-semibold text-slate-700">{adminUser?.department}</span>) does not have active
                clearance for <span className="font-bold text-[#5A31F4]">{requiredModuleName}</span>.
              </p>

              <div className="mt-5 p-4 rounded-2xl bg-slate-50 border border-slate-100 text-left">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Your Permitted Modules</p>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {adminUser?.allowedModules && adminUser.allowedModules.length > 0 ? (
                    adminUser.allowedModules.map((m) => (
                      <span
                        key={m}
                        className="px-2.5 py-1 rounded-lg bg-purple-50 text-[#5A31F4] border border-purple-200 text-xs font-semibold"
                      >
                        {m}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-slate-400">Dashboard Only</span>
                  )}
                </div>
              </div>

              <div className="mt-6 flex gap-3 justify-center">
                <button
                  onClick={() => router.push("/")}
                  className="px-5 py-2.5 rounded-xl bg-[#5A31F4] hover:bg-[#4823d9] text-white font-semibold text-xs shadow-md shadow-purple-500/20 transition-all cursor-pointer"
                >
                  Return to Dashboard
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Authenticated user on admin dashboard with clearance
  return (
    <div className="flex min-h-screen w-full bg-[#f8fafc]">
      <Sidebar />
      <main className="flex-1 flex flex-col min-w-0 bg-[#f8fafc]">
        <Header />
        <div className="flex-1 p-gutter max-w-[1440px] mx-auto w-full space-y-xl overflow-y-auto">
          {children}
        </div>
      </main>
    </div>
  );
}

