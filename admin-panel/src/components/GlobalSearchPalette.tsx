"use client";

import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import EntityDetail360Drawer from "./EntityDetail360Drawer";

interface GlobalSearchPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function GlobalSearchPalette({ isOpen, onClose }: GlobalSearchPaletteProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any>({
    users: [],
    hosts: [],
    transactions: [],
    properties: [],
    bookings: [],
    totalHits: 0,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [selectedEntityId, setSelectedEntityId] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const getAdminConfig = () => {
    const token = typeof window !== "undefined" ? localStorage.getItem("stayq_admin_token") : null;
    return {
      headers: {
        "x-admin-key": "stayq-admin-secret-2026",
        Authorization: `Bearer ${token || "stayq-admin-secret-2026"}`,
      },
    };
  };

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery("");
      setResults({ users: [], hosts: [], transactions: [], properties: [], bookings: [], totalHits: 0 });
    }
  }, [isOpen]);

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setResults({ users: [], hosts: [], transactions: [], properties: [], bookings: [], totalHits: 0 });
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const res = await axios.get(`/api/v1/admin/search?q=${encodeURIComponent(trimmed)}`, getAdminConfig());
        if (res.data) {
          setResults(res.data);
        }
      } catch (err) {
        console.error("Global search error:", err);
      } finally {
        setIsLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  // Keyboard shortcut listener: Ctrl+K / Cmd+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        if (isOpen) onClose();
      } else if (e.key === "Escape" && isOpen && !drawerOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, drawerOpen]);

  const open360 = (id: string) => {
    setSelectedEntityId(id);
    setDrawerOpen(true);
  };

  if (!isOpen && !drawerOpen) return null;

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-start justify-center pt-16 sm:pt-24 px-4">
          <div 
            className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[80vh] animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top Search Field */}
            <div className="p-4 border-b border-slate-200 flex items-center gap-3 bg-slate-50/50">
              <span className="material-symbols-outlined text-slate-400 text-2xl">search</span>
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Type mobile (+91), email, host code (ST-HOST-...), or order ID..."
                className="w-full bg-transparent border-none text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none"
              />
              {isLoading && (
                <span className="material-symbols-outlined animate-spin text-slate-400 text-xl">
                  progress_activity
                </span>
              )}
              {query && (
                <button
                  onClick={() => setQuery("")}
                  className="text-xs font-bold text-slate-400 hover:text-slate-700 px-2 py-1 rounded-lg"
                >
                  Clear
                </button>
              )}
              <kbd className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-bold text-slate-400 bg-slate-200/60 rounded-md border border-slate-300/60">
                ESC
              </kbd>
            </div>

            {/* Quick helper tip */}
            {!query && (
              <div className="p-8 text-center text-slate-400 text-xs space-y-2">
                <span className="material-symbols-outlined text-4xl text-slate-300">manage_search</span>
                <p className="font-semibold text-slate-700">Instant Search &amp; 360 Inspection</p>
                <p className="text-[11px] max-w-sm mx-auto">
                  Type any 10-digit mobile number, email address, Host ID, or Cashfree order ID to instantly retrieve full details.
                </p>
              </div>
            )}

            {/* Results Area */}
            {query.length >= 2 && (
              <div className="overflow-y-auto p-4 space-y-4 divide-y divide-slate-100 flex-1">
                {results.totalHits === 0 && !isLoading && (
                  <div className="py-12 text-center text-slate-400 text-xs">
                    <p className="font-semibold text-slate-700">No results found for "{query}"</p>
                    <p className="text-[11px] mt-1">Check the phone number or email spelling.</p>
                  </div>
                )}

                {/* Hosts Category */}
                {results.hosts?.length > 0 && (
                  <div className="pt-2">
                    <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                      <span>Hosts ({results.hosts.length})</span>
                    </div>
                    <div className="space-y-1">
                      {results.hosts.map((h: any) => (
                        <div
                          key={h.id}
                          onClick={() => open360(h.id)}
                          className="p-3 rounded-2xl hover:bg-purple-50/70 border border-transparent hover:border-purple-200 cursor-pointer flex items-center justify-between transition-all"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-xl bg-purple-100 text-[#5A31F4] flex items-center justify-center font-bold text-xs">
                              {h.title.slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <strong className="text-xs text-slate-900 block flex items-center gap-1.5">
                                <span>{h.title}</span>
                                {h.meta?.hostCode && (
                                  <span className="text-[10px] font-mono text-[#5A31F4] font-bold">
                                    [{h.meta.hostCode}]
                                  </span>
                                )}
                                {h.meta?.isHostPro && (
                                  <span className="px-1.5 py-0.2 rounded-full text-[9px] font-extrabold uppercase bg-amber-50 text-amber-700 border border-amber-200">
                                    Host Pro
                                  </span>
                                )}
                              </strong>
                              <span className="text-[11px] text-slate-500">{h.subtitle}</span>
                            </div>
                          </div>
                          <span className="material-symbols-outlined text-slate-400 text-sm">chevron_right</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Users / Guests Category */}
                {results.users?.length > 0 && (
                  <div className="pt-2">
                    <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                      <span>Guests / Users ({results.users.length})</span>
                    </div>
                    <div className="space-y-1">
                      {results.users.map((u: any) => (
                        <div
                          key={u.id}
                          onClick={() => open360(u.id)}
                          className="p-3 rounded-2xl hover:bg-slate-50 border border-transparent hover:border-slate-200 cursor-pointer flex items-center justify-between transition-all"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs">
                              {u.title.slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <strong className="text-xs text-slate-900 block">{u.title}</strong>
                              <span className="text-[11px] text-slate-500">{u.subtitle}</span>
                            </div>
                          </div>
                          <span className="material-symbols-outlined text-slate-400 text-sm">chevron_right</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Transactions & Orders */}
                {results.transactions?.length > 0 && (
                  <div className="pt-2">
                    <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                      <span>Transactions &amp; Orders ({results.transactions.length})</span>
                    </div>
                    <div className="space-y-1">
                      {results.transactions.map((t: any) => (
                        <div
                          key={t.id}
                          onClick={() => t.meta?.ownerId && open360(t.meta.ownerId)}
                          className="p-3 rounded-2xl hover:bg-slate-50 border border-transparent hover:border-slate-200 cursor-pointer flex items-center justify-between transition-all"
                        >
                          <div>
                            <strong className="text-xs text-slate-900 block">{t.title}</strong>
                            <span className="text-[11px] text-slate-500">{t.subtitle}</span>
                          </div>
                          <span className="material-symbols-outlined text-slate-400 text-sm">chevron_right</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Properties */}
                {results.properties?.length > 0 && (
                  <div className="pt-2">
                    <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                      <span>Listings ({results.properties.length})</span>
                    </div>
                    <div className="space-y-1">
                      {results.properties.map((p: any) => (
                        <div
                          key={p.id}
                          className="p-3 rounded-2xl bg-slate-50/50 text-xs flex items-center justify-between"
                        >
                          <div>
                            <strong className="text-slate-900 block">{p.title}</strong>
                            <span className="text-slate-500 text-[11px]">{p.subtitle}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 360 Inspection Drawer */}
      <EntityDetail360Drawer
        isOpen={drawerOpen}
        entityId={selectedEntityId}
        onClose={() => setDrawerOpen(false)}
      />
    </>
  );
}
