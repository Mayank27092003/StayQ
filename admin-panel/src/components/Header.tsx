"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useAdminAuth } from "@/context/AdminAuthContext";

interface AdminProfile {
  name: string;
  email: string;
  role: string;
  phone: string;
}

const DEFAULT_ADMIN_PROFILE: AdminProfile = {
  name: "Shayan Mandal",
  email: "shayan@stayq.space",
  role: "Super Administrator",
  phone: "+91 98765 43210",
};

export default function Header() {
  const { adminUser, logout } = useAdminAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isSupportOpen, setIsSupportOpen] = useState(false);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);

  // Persistent Admin Profile State
  const [adminProfile, setAdminProfile] = useState<AdminProfile>(DEFAULT_ADMIN_PROFILE);
  const [tempName, setTempName] = useState(DEFAULT_ADMIN_PROFILE.name);
  const [tempEmail, setTempEmail] = useState(DEFAULT_ADMIN_PROFILE.email);
  const [tempRole, setTempRole] = useState(DEFAULT_ADMIN_PROFILE.role);
  const [tempPhone, setTempPhone] = useState(DEFAULT_ADMIN_PROFILE.phone);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Load from localStorage on mount & auto-migrate old names
  useEffect(() => {
    try {
      const stored = localStorage.getItem("stayq_admin_profile");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.name && parsed.name !== "Mohit Shukla") {
          setAdminProfile(parsed);
          setTempName(parsed.name);
          setTempEmail(parsed.email || DEFAULT_ADMIN_PROFILE.email);
          setTempRole(parsed.role || DEFAULT_ADMIN_PROFILE.role);
          setTempPhone(parsed.phone || DEFAULT_ADMIN_PROFILE.phone);
          return;
        }
      }
      // Set default Shayan Mandal
      localStorage.setItem("stayq_admin_profile", JSON.stringify(DEFAULT_ADMIN_PROFILE));
      setAdminProfile(DEFAULT_ADMIN_PROFILE);
      setTempName(DEFAULT_ADMIN_PROFILE.name);
      setTempEmail(DEFAULT_ADMIN_PROFILE.email);
      setTempRole(DEFAULT_ADMIN_PROFILE.role);
      setTempPhone(DEFAULT_ADMIN_PROFILE.phone);
    } catch {
      // Fallback to default
    }
  }, []);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: AdminProfile = {
      name: tempName.trim() || DEFAULT_ADMIN_PROFILE.name,
      email: tempEmail.trim() || DEFAULT_ADMIN_PROFILE.email,
      role: tempRole.trim() || DEFAULT_ADMIN_PROFILE.role,
      phone: tempPhone.trim() || DEFAULT_ADMIN_PROFILE.phone,
    };

    setAdminProfile(updated);
    try {
      localStorage.setItem("stayq_admin_profile", JSON.stringify(updated));
      window.dispatchEvent(new Event("stayq_admin_profile_updated"));
    } catch {
      // Ignore storage errors
    }

    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
      setIsEditProfileOpen(false);
      setIsProfileOpen(false);
    }, 900);
  };

  return (
    <>
      <header className="h-14 w-full sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex justify-between items-center px-6">
        {/* Search Bar */}
        <div className="flex-1 max-w-md">
          <div className="relative flex items-center w-full h-9 rounded-xl bg-slate-50 border border-slate-200/80 focus-within:bg-white focus-within:border-[#5A31F4]/50 focus-within:ring-2 focus-within:ring-[#5A31F4]/10 transition-all">
            <span className="material-symbols-outlined absolute left-2.5 text-slate-400 text-[18px]">search</span>
            <input 
              className="w-full h-full bg-transparent border-none focus:outline-none pl-9 pr-3 text-xs text-slate-900 placeholder:text-slate-400 font-medium" 
              placeholder="Search listings, bookings, hosts, tickets..." 
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        
        {/* Trailing Actions */}
        <div className="flex items-center gap-3">
          {/* Live System Status */}
          <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200/60 text-[11px] font-bold text-emerald-700">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>Platform Live</span>
          </div>

          <Link href="/notifications" className="text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg p-2 transition-colors relative" title="Notifications">
            <span className="material-symbols-outlined text-[19px]">notifications</span>
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500 border-2 border-white"></span>
          </Link>

          <button onClick={() => setIsSupportOpen(true)} className="text-xs font-bold text-[#5A31F4] bg-[#5A31F4]/8 hover:bg-[#5A31F4]/15 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[16px]">headset_mic</span>
            <span>Support</span>
          </button>
          
          <div className="relative">
            <button 
              onClick={() => setIsProfileOpen(!isProfileOpen)} 
              className="flex items-center gap-2 pl-2.5 pr-1.5 py-1 rounded-xl border border-slate-200/80 bg-white hover:bg-slate-50 shadow-sm transition-all"
            >
              <span className="text-xs font-bold text-slate-800 max-w-[120px] truncate">
                {adminUser?.fullName || adminProfile.name}
              </span>
              <div className="w-6 h-6 rounded-lg bg-[#5A31F4] text-white flex items-center justify-center text-[10px] font-extrabold">
                {(adminUser?.fullName || adminProfile.name).slice(0, 2).toUpperCase()}
              </div>
            </button>

            {isProfileOpen && (
              <div className="absolute right-0 mt-2 w-60 bg-white rounded-2xl shadow-2xl border border-slate-200/90 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="px-4 py-2.5 border-b border-slate-100">
                  <strong className="block text-sm font-bold text-slate-900 truncate">{adminUser?.fullName || adminProfile.name}</strong>
                  <span className="inline-block mt-0.5 px-2 py-0.5 rounded-full bg-purple-50 text-[#5A31F4] text-[10px] font-extrabold uppercase">
                    {adminUser?.role === 'MASTER_ADMIN' ? 'Super Administrator' : (adminUser?.role || adminProfile.role)}
                  </span>
                  <span className="block text-xs text-slate-400 mt-1 truncate">{adminUser?.email || adminProfile.email}</span>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setTempName(adminUser?.fullName || adminProfile.name);
                    setTempEmail(adminUser?.email || adminProfile.email);
                    setTempRole(adminProfile.role);
                    setTempPhone(adminProfile.phone);
                    setIsEditProfileOpen(true);
                    setIsProfileOpen(false);
                  }}
                  className="w-full text-left px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-[17px] text-[#5A31F4]">edit</span>
                  Edit Admin Profile
                </button>

                <Link href="/access" className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-2">
                  <span className="material-symbols-outlined text-[17px] text-slate-400">admin_panel_settings</span>
                  Access &amp; Roles
                </Link>

                <Link href="/revenue" className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-2">
                  <span className="material-symbols-outlined text-[17px] text-slate-400">payments</span>
                  Revenue &amp; Payouts
                </Link>

                <div className="my-1 border-t border-slate-100" />

                <button 
                  onClick={() => logout()} 
                  className="w-full text-left px-4 py-2 text-xs text-red-600 font-bold hover:bg-red-50 transition-colors flex items-center gap-2 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[17px]">logout</span>
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Edit Admin Profile Modal (Permanent LocalStorage Persistence) */}
      {isEditProfileOpen && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(15, 23, 42, 0.75)',
            backdropFilter: 'blur(6px)',
            zIndex: 99999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
          }}
          onClick={() => setIsEditProfileOpen(false)}
        >
          <div 
            style={{
              width: '100%',
              maxWidth: '480px',
              minWidth: '320px',
              backgroundColor: '#FFFFFF',
              borderRadius: '1.25rem',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
              border: '1px solid rgba(226, 232, 240, 0.8)',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-primary text-on-primary px-6 py-4 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined">manage_accounts</span>
                <h3 className="font-bold text-lg">Edit Administrator Profile</h3>
              </div>
              <button 
                onClick={() => setIsEditProfileOpen(false)} 
                className="text-on-primary hover:opacity-80 transition-opacity"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="p-6 space-y-4">
              {saveSuccess && (
                <div className="p-3 rounded-xl bg-success/15 border border-success text-success text-sm font-bold flex items-center gap-2">
                  <span className="material-symbols-outlined text-base">check_circle</span>
                  Saved permanently! Name updated across admin panel.
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-on-surface uppercase tracking-wider mb-1">
                  Admin Full Name
                </label>
                <input
                  type="text"
                  required
                  value={tempName}
                  onChange={(e) => setTempName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-surface-container border border-outline-variant text-on-surface font-bold focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                  placeholder="e.g. Shayan Mandal"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-on-surface uppercase tracking-wider mb-1">
                  Designation / Role Title
                </label>
                <input
                  type="text"
                  required
                  value={tempRole}
                  onChange={(e) => setTempRole(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-surface-container border border-outline-variant text-on-surface font-medium focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                  placeholder="e.g. Super Administrator"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-on-surface uppercase tracking-wider mb-1">
                  Official Email
                </label>
                <input
                  type="email"
                  required
                  value={tempEmail}
                  onChange={(e) => setTempEmail(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-surface-container border border-outline-variant text-on-surface font-medium focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                  placeholder="shayan@stayq.space"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-on-surface uppercase tracking-wider mb-1">
                  Phone Number
                </label>
                <input
                  type="text"
                  value={tempPhone}
                  onChange={(e) => setTempPhone(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-surface-container border border-outline-variant text-on-surface font-medium focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                  placeholder="+91 98765 43210"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-outline-variant/40">
                <button
                  type="button"
                  onClick={() => setIsEditProfileOpen(false)}
                  className="px-4 py-2 rounded-xl text-on-surface-variant font-bold hover:bg-surface-container transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-xl bg-primary text-on-primary font-bold shadow-md hover:bg-primary/90 transition-all flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-sm">save</span>
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Support Chat Widget */}
      {isSupportOpen && (
        <div className="fixed bottom-6 right-6 w-80 bg-surface rounded-2xl shadow-2xl border border-outline-variant z-50 overflow-hidden flex flex-col">
          <div className="bg-primary text-on-primary p-4 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined">support_agent</span>
              <h3 className="font-bold">Live Chat Support</h3>
            </div>
            <button onClick={() => setIsSupportOpen(false)} className="text-on-primary hover:opacity-80 transition-opacity">
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
          <div className="h-64 p-4 bg-surface-container-lowest overflow-y-auto flex flex-col">
            <p className="text-center text-on-surface-variant text-sm mt-auto mb-2">A support agent will be with you shortly...</p>
          </div>
          <div className="p-3 border-t border-outline-variant bg-surface flex gap-2">
            <input type="text" placeholder="Type a message..." className="flex-1 bg-surface-container-low border border-outline-variant rounded-full px-4 py-2 text-sm outline-none focus:border-primary transition-colors" />
            <button className="bg-primary text-on-primary rounded-full w-9 h-9 flex items-center justify-center shrink-0 hover:bg-primary/90 transition-colors">
              <span className="material-symbols-outlined text-sm">send</span>
            </button>
          </div>
        </div>
      )}
    </>
  );
}
