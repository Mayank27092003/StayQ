"use client";

import Link from "next/link";
import { useState, useEffect } from "react";

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
      <header className="h-16 w-full sticky top-0 z-40 bg-surface/80 backdrop-blur-xl border-b border-outline-variant/30 shadow-[0_4px_30px_rgba(0,0,0,0.02)] flex justify-between items-center px-gutter mx-auto max-w-[1440px]">
        {/* Search */}
        <div className="flex-1 max-w-md">
          <div className="relative flex items-center w-full h-10 rounded-full bg-surface-container-high/40 border border-transparent focus-within:bg-surface-container-lowest focus-within:border-outline-variant/50 focus-within:shadow-[0_4px_12px_rgba(0,0,0,0.04)] transition-all">
            <span className="material-symbols-outlined absolute left-3 text-on-surface-variant/70 text-[20px]">search</span>
            <input 
              className="w-full h-full bg-transparent border-none focus:ring-0 pl-10 pr-4 font-body-md text-body-md text-on-surface placeholder:text-on-surface-variant" 
              placeholder="Search Stay Q..." 
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        
        {/* Trailing Actions */}
        <div className="flex items-center gap-md">
          <Link href="/notifications" className="text-on-surface-variant hover:bg-surface-container rounded-full p-2 transition-colors relative">
            <span className="material-symbols-outlined">notifications</span>
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-error border border-surface"></span>
          </Link>
          <button onClick={() => window.open('https://docs.stayq.com', '_blank')} className="text-on-surface-variant hover:bg-surface-container rounded-full p-2 transition-colors">
            <span className="material-symbols-outlined">help_outline</span>
          </button>
          <div className="w-px h-6 bg-outline-variant mx-xs"></div>
          <button onClick={() => setIsSupportOpen(true)} className="font-label-md text-label-md text-on-surface hover:text-primary transition-colors">
            Support
          </button>
          
          <div className="relative">
            <button 
              onClick={() => setIsProfileOpen(!isProfileOpen)} 
              className="flex items-center gap-xs pl-sm pr-xs py-1.5 rounded-full border border-outline-variant/40 bg-surface-container-lowest shadow-[0_2px_8px_rgba(0,0,0,0.03)] hover:bg-surface-container transition-all ml-sm"
            >
              <span className="font-label-md text-label-md font-bold text-on-surface ml-xs mr-xs max-w-[130px] truncate">
                {adminProfile.name}
              </span>
              <span className="material-symbols-outlined text-[28px] text-primary">account_circle</span>
            </button>

            {isProfileOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-surface rounded-2xl shadow-xl border border-outline-variant py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="px-4 py-2.5 border-b border-outline-variant/40">
                  <strong className="block text-sm font-bold text-on-surface">{adminProfile.name}</strong>
                  <span className="block text-xs text-primary font-medium">{adminProfile.role}</span>
                  <span className="block text-xs text-on-surface-variant truncate">{adminProfile.email}</span>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setTempName(adminProfile.name);
                    setTempEmail(adminProfile.email);
                    setTempRole(adminProfile.role);
                    setTempPhone(adminProfile.phone);
                    setIsEditProfileOpen(true);
                    setIsProfileOpen(false);
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-on-surface hover:bg-surface-container transition-colors flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-[18px] text-primary">edit</span>
                  Edit Admin Profile
                </button>

                <Link href="/access" className="px-4 py-2 text-sm text-on-surface hover:bg-surface-container transition-colors flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px] text-on-surface-variant">admin_panel_settings</span>
                  Access &amp; Roles
                </Link>

                <Link href="/revenue" className="px-4 py-2 text-sm text-on-surface hover:bg-surface-container transition-colors flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px] text-on-surface-variant">receipt_long</span>
                  Billing &amp; Payouts
                </Link>

                <div className="my-1 border-t border-outline-variant/40" />

                <button 
                  onClick={() => window.location.href = '/api/v1/auth/logout'} 
                  className="w-full text-left px-4 py-2 text-sm text-secondary font-bold hover:bg-surface-container transition-colors flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-[18px]">logout</span>
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
