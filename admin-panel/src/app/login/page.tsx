"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAdminAuth } from "@/context/AdminAuthContext";

export default function AdminLoginPage() {
  const { login, isAuthenticated } = useAdminAuth();
  const router = useRouter();

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  // If already authenticated, redirect cleanly to home dashboard
  useEffect(() => {
    if (isAuthenticated) {
      router.replace("/");
    }
  }, [isAuthenticated, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    try {
      const res = await login(identifier, password);
      if (res.success) {
        router.replace("/");
      } else {
        setErrorMsg(res.message);
      }
    } catch {
      setErrorMsg("An error occurred during authentication. Please check credentials and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#080512] flex items-center justify-center p-4 relative overflow-hidden font-sans select-none">
      {/* Ambient Stay Q Brand Glows */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-[#5A31F4]/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-[#7F56D9]/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[520px] h-[520px] bg-[#5A31F4]/10 rounded-full blur-[140px] pointer-events-none" />

      {/* Subtle Grid Overlay */}
      <div 
        className="absolute inset-0 opacity-[0.03] pointer-events-none" 
        style={{
          backgroundImage: "linear-gradient(#ffffff 1px, transparent 1px), linear-gradient(to right, #ffffff 1px, transparent 1px)",
          backgroundSize: "48px 48px"
        }}
      />

      <div className="w-full max-w-md relative z-10">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#5A31F4] to-[#7F56D9] shadow-2xl shadow-[#5A31F4]/40 mb-4 ring-1 ring-white/20">
            <span className="material-symbols-outlined text-white text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>
              hotel_class
            </span>
          </div>
          <div className="flex items-center justify-center gap-2">
            <h1 className="text-2xl font-bold text-white tracking-tight">Stay Q</h1>
            <span className="px-2 py-0.5 rounded-full bg-[#5A31F4]/30 border border-[#5A31F4]/40 text-[#c4b5fd] text-[10px] font-extrabold uppercase tracking-wider">
              Admin
            </span>
          </div>
          <p className="text-slate-400 text-xs mt-1.5 font-medium">
            Enterprise Operations &amp; Command Center
          </p>
        </div>

        {/* Login Glass Card */}
        <div className="bg-[#120E24]/85 backdrop-blur-2xl border border-purple-500/20 rounded-3xl p-8 shadow-2xl shadow-black/70">
          <div className="flex items-center justify-between pb-4 mb-6 border-b border-white/[0.08]">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#a78bfa] text-lg">shield_lock</span>
              <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                Staff Authentication
              </span>
            </div>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" title="Gateway Online" />
          </div>

          {errorMsg && (
            <div className="mb-6 p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 flex items-start gap-3 text-red-400 text-xs font-medium animate-shake">
              <span className="material-symbols-outlined text-base mt-0.5 flex-shrink-0">error</span>
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Staff ID or Admin Email
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 text-lg">
                  badge
                </span>
                <input
                  type="text"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="e.g. admin@stayq.space or ADMIN-001"
                  className="w-full bg-[#080512]/90 border border-white/[0.1] rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-[#7F56D9] focus:ring-2 focus:ring-[#7F56D9]/25 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Password / Master Key
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 text-lg">
                  key
                </span>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter administrator password"
                  className="w-full bg-[#080512]/90 border border-white/[0.1] rounded-xl pl-10 pr-11 py-3 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-[#7F56D9] focus:ring-2 focus:ring-[#7F56D9]/25 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                >
                  <span className="material-symbols-outlined text-lg">
                    {showPassword ? "visibility_off" : "visibility"}
                  </span>
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-slate-400 hover:text-slate-300">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded bg-[#080512] border-slate-700 text-[#5A31F4] focus:ring-[#5A31F4]"
                />
                Remember workstation
              </label>
              <span className="text-slate-500 text-[11px]">256-Bit TLS Protected</span>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-[#5A31F4] to-[#7F56D9] hover:brightness-110 active:scale-[0.99] text-white font-bold text-sm shadow-xl shadow-[#5A31F4]/30 flex items-center justify-center gap-2 transition-all disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer mt-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Authorizing Session...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-lg">login</span>
                  <span>Enter Command Center</span>
                </>
              )}
            </button>
          </form>

          {/* Staff & Master Credential Helper */}
          <div className="mt-5 pt-4 border-t border-white/[0.06] text-[11px] text-slate-400 space-y-2">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px] text-purple-400">key</span>
                Quick Demo Access:
              </span>
              <button
                type="button"
                onClick={() => {
                  setIdentifier("admin@stayq.space");
                  setPassword("StayQ@2026");
                }}
                className="text-[#c4b5fd] hover:text-white font-bold underline underline-offset-2 transition-colors cursor-pointer"
              >
                Master Admin
              </button>
            </div>

            <div className="grid grid-cols-3 gap-1.5 pt-1">
              <button
                type="button"
                onClick={() => {
                  setIdentifier("SQ-EMP-1001");
                  setPassword("StayQ@Staff2026");
                }}
                className="py-1 px-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.1] text-slate-300 hover:text-white text-[10px] font-semibold truncate transition-colors cursor-pointer border border-white/[0.06]"
                title="Aarav Sharma (Bookings & Stays)"
              >
                Bookings Staff
              </button>
              <button
                type="button"
                onClick={() => {
                  setIdentifier("SQ-EMP-1002");
                  setPassword("StayQ@Staff2026");
                }}
                className="py-1 px-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.1] text-slate-300 hover:text-white text-[10px] font-semibold truncate transition-colors cursor-pointer border border-white/[0.06]"
                title="Neha Verma (Accounts & Finance)"
              >
                Accounts Staff
              </button>
              <button
                type="button"
                onClick={() => {
                  setIdentifier("SQ-EMP-1003");
                  setPassword("StayQ@Staff2026");
                }}
                className="py-1 px-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.1] text-slate-300 hover:text-white text-[10px] font-semibold truncate transition-colors cursor-pointer border border-white/[0.06]"
                title="Rohan Patel (Customer Support)"
              >
                Support Staff
              </button>
            </div>
          </div>
        </div>

        {/* Security Footer with exact requested branding */}
        <div className="mt-8 text-center text-xs text-slate-500 flex items-center justify-center gap-2 font-medium">
          <span className="material-symbols-outlined text-sm text-emerald-400">verified_user</span>
          <span>Stay Q by Quatalyst Private limited • Admin Gateway</span>
        </div>
      </div>
    </div>
  );
}

