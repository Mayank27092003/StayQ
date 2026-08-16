"use client";

import React, { useEffect, useState, useMemo } from 'react';
import axios from 'axios';
import Link from 'next/link';

import Toast from '@/components/Toast';

export default function PeoplePage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("All Users");
  const [page, setPage] = useState(1);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [toast, setToast] = useState<{message: string, type: 'success'|'error'|'info'} | null>(null);
  const limit = 5;

  useEffect(() => {
    setLoading(true);
    axios.get('/api/v1/admin/users')
      .then(res => setData(res.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const handleInvite = () => setIsInviteModalOpen(true);
  const handleManage = (id: string) => setToast({message: `Managing user ${id}`, type: 'info'});
  
  const submitInvite = (e: React.FormEvent) => {
    e.preventDefault();
    setIsInviteModalOpen(false);
    setToast({message: "Invitation sent successfully!", type: 'success'});
  };

  const filteredData = useMemo(() => {
    if (!data?.data) return [];
    if (filter === "Hosts") return data.data.filter((u: any) => u.role === "Host" || u.isHost);
    if (filter === "Suspended") return data.data.filter((u: any) => u.status === "Suspended");
    return data.data;
  }, [data?.data, filter]);

  const totalItems = filteredData.length;
  const totalPages = Math.ceil(totalItems / limit) || 1;
  const paginatedData = filteredData.slice((page - 1) * limit, page * limit);

  return (
    <>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      
      {/* Invite Modal */}
      {isInviteModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm transition-opacity">
          <div className="bg-surface rounded-3xl p-xl shadow-2xl w-[400px] max-w-[90vw] animate-in zoom-in-95 duration-200">
            <h3 className="font-headline-md text-headline-md text-on-surface mb-xs">Invite User</h3>
            <p className="font-body-md text-body-md text-on-surface-variant mb-lg">Send an email invitation to join Stay Q.</p>
            <form onSubmit={submitInvite} className="flex flex-col gap-md">
              <input type="email" required placeholder="Email Address" className="w-full px-md py-sm rounded-xl border border-outline-variant bg-surface-container-lowest focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" />
              <select className="w-full px-md py-sm rounded-xl border border-outline-variant bg-surface-container-lowest">
                <option>Guest</option>
                <option>Host</option>
                <option>Admin</option>
              </select>
              <div className="flex justify-end gap-sm mt-md">
                <button type="button" onClick={() => setIsInviteModalOpen(false)} className="px-lg py-sm rounded-full font-label-md text-label-md text-on-surface-variant hover:bg-surface-container transition-colors">Cancel</button>
                <button type="submit" className="px-lg py-sm rounded-full bg-primary text-on-primary font-label-md text-label-md hover:bg-primary-container hover:text-on-primary-container shadow-sm transition-colors">Send Invite</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* data points can be wired below using data?.field etc. */}
      <main className="flex-1 flex flex-col min-w-0 relative">
{/* Content Area */}
<div className="flex-1 p-gutter overflow-y-auto max-w-[1440px] mx-auto w-full">
<div className="flex justify-between items-end mb-xl">
<div>
<h2 className="font-display-lg text-display-lg text-on-surface mb-xs">User Management</h2>
<p className="font-body-lg text-body-lg text-on-surface-variant">Oversee guest accounts, verify identities, and manage platform access.</p>
</div>
<div className="flex gap-sm">
<button onClick={() => setIsFilterOpen(true)} className="px-md py-sm border border-outline-variant rounded-lg font-label-md text-label-md flex items-center gap-xs hover:bg-surface-container-low transition-colors">
<span className="material-symbols-outlined text-sm">filter_list</span>
                        Filters
                    </button>
<button onClick={handleInvite} className="px-md py-sm bg-primary text-on-primary rounded-lg font-label-md text-label-md flex items-center gap-xs hover:bg-primary/90 transition-colors shadow-sm">
<span className="material-symbols-outlined text-sm">person_add</span>
                        Invite User
                    </button>
</div>
</div>
{/* KPI Cards */}
<div className="grid grid-cols-1 md:grid-cols-4 gap-md mb-xl">
<div className="bg-surface-container-lowest p-md rounded-xl border border-outline-variant shadow-sm flex flex-col justify-between">
<p className="font-label-md text-label-md text-on-surface-variant">Total Users</p>
<div className="flex items-end gap-sm mt-sm">
{loading ? <div className="h-8 w-20 bg-outline-variant/30 animate-pulse rounded"></div> : <>
<span className="font-headline-lg text-headline-lg">{data?.summary?.totalUsers ?? "-"}</span>
</>}
</div>
</div>
<div className="bg-surface-container-lowest p-md rounded-xl border border-outline-variant shadow-sm flex flex-col justify-between">
<p className="font-label-md text-label-md text-on-surface-variant">Active Guests (30d)</p>
<div className="flex items-end gap-sm mt-sm">
{loading ? <div className="h-8 w-20 bg-outline-variant/30 animate-pulse rounded"></div> : <>
<span className="font-headline-lg text-headline-lg">{data?.summary?.activeGuests ?? "-"}</span>
</>}
</div>
</div>
<div className="bg-surface-container-lowest p-md rounded-xl border border-outline-variant shadow-sm flex flex-col justify-between">
<p className="font-label-md text-label-md text-on-surface-variant">Pending Verification</p>
<div className="flex items-end gap-sm mt-sm">
{loading ? <div className="h-8 w-20 bg-outline-variant/30 animate-pulse rounded"></div> : <>
<span className="font-headline-lg text-headline-lg">{data?.summary?.pending ?? "-"}</span>
</>}
</div>
</div>
<div className="bg-surface-container-lowest p-md rounded-xl border border-outline-variant shadow-sm flex flex-col justify-between">
<p className="font-label-md text-label-md text-on-surface-variant">Suspended Accounts</p>
<div className="flex items-end gap-sm mt-sm">
{loading ? <div className="h-8 w-20 bg-outline-variant/30 animate-pulse rounded"></div> : <>
<span className="font-headline-lg text-headline-lg text-error">{data?.summary?.suspended ?? "-"}</span>
</>}
</div>
</div>
</div>
{/* Data Table */}
<div className="bg-surface-container-lowest rounded-xl border border-outline-variant shadow-[0px_4px_20px_rgba(0,0,0,0.03)] overflow-hidden">
<div className="p-md border-b border-outline-variant flex justify-between items-center bg-surface-container-low/50">
<div className="flex gap-sm">
<button onClick={() => {setFilter("All Users"); setPage(1);}} className={`font-label-md text-label-md pb-1 px-1 transition-colors ${filter === "All Users" ? "text-primary border-b-2 border-primary" : "text-on-surface-variant hover:text-primary"}`}>All Users</button>
<button onClick={() => {setFilter("Hosts"); setPage(1);}} className={`font-label-md text-label-md pb-1 px-1 transition-colors ${filter === "Hosts" ? "text-primary border-b-2 border-primary" : "text-on-surface-variant hover:text-primary"}`}>Hosts</button>
<button onClick={() => {setFilter("Suspended"); setPage(1);}} className={`font-label-md text-label-md pb-1 px-1 transition-colors ${filter === "Suspended" ? "text-primary border-b-2 border-primary" : "text-on-surface-variant hover:text-primary"}`}>Suspended</button>
</div>
<div className="flex gap-xs">
<select className="bg-transparent border-none text-on-surface-variant font-label-md text-label-md py-1 pr-8 focus:ring-0 cursor-pointer">
<option>Sort by: Last Active</option>
<option>Sort by: Name (A-Z)</option>
<option>Sort by: Total Bookings</option>
</select>
</div>
</div>
<div className="overflow-x-auto">
<table className="w-full text-left border-collapse whitespace-nowrap">
<thead>
<tr className="border-b border-outline-variant bg-surface-container-lowest text-on-surface-variant font-label-md text-label-md">
<th className="py-3 px-md font-semibold">User Details</th>
<th className="py-3 px-md font-semibold">Status</th>
<th className="py-3 px-md font-semibold">Verification</th>
<th className="py-3 px-md font-semibold text-right">Total Bookings</th>
<th className="py-3 px-md font-semibold">Last Active</th>
<th className="py-3 px-md font-semibold text-right">Action</th>
</tr>
</thead>
<tbody className="font-body-md text-body-md">
{loading ? (
  [...Array(5)].map((_, i) => (
    <tr key={i} className="border-b border-surface-container-low h-[56px]">
      <td className="py-2 px-md">
        <div className="flex items-center gap-sm">
          <div className="w-10 h-10 rounded-full bg-outline-variant/30 animate-pulse shrink-0"></div>
          <div>
            <div className="h-4 w-24 bg-outline-variant/30 animate-pulse rounded mb-1"></div>
            <div className="h-3 w-32 bg-outline-variant/30 animate-pulse rounded"></div>
          </div>
        </div>
      </td>
      <td className="py-2 px-md"><div className="h-5 w-16 bg-outline-variant/30 animate-pulse rounded-full"></div></td>
      <td className="py-2 px-md"><div className="h-4 w-24 bg-outline-variant/30 animate-pulse rounded"></div></td>
      <td className="py-2 px-md"><div className="h-4 w-8 bg-outline-variant/30 animate-pulse rounded ml-auto"></div></td>
      <td className="py-2 px-md"><div className="h-4 w-20 bg-outline-variant/30 animate-pulse rounded"></div></td>
      <td className="py-2 px-md"><div className="h-4 w-12 bg-outline-variant/30 animate-pulse rounded ml-auto"></div></td>
    </tr>
  ))
) : paginatedData.length === 0 ? (
  <tr>
    <td colSpan={6} className="text-center p-8 text-on-surface-variant">No data available</td>
  </tr>
) : (
  paginatedData.map((user: any) => (
    <tr key={user.id || Math.random()} className={`border-b border-surface-container-low hover:bg-surface-container-low/50 transition-colors h-[56px] group ${user.status === "Suspended" ? "bg-error-container/20" : ""}`}>
      <td className="py-2 px-md">
        <div className="flex items-center gap-sm">
          {user.avatar ? (
            <img className="w-10 h-10 rounded-full object-cover shrink-0" src={user.avatar} />
          ) : (
            <div className="w-10 h-10 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center font-bold text-sm shrink-0">
              {(user.name || "U").substring(0, 2).toUpperCase()}
            </div>
          )}
          <div>
            <p className="font-medium text-on-surface">{user.name ?? "-"}</p>
            <p className="text-on-surface-variant text-xs">{user.email ?? "-"}</p>
          </div>
        </div>
      </td>
      <td className="py-2 px-md">
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${user.status === "Suspended" ? "bg-error-container text-on-error-container border border-error-container" : "bg-[#e6f4ea] text-[#137333] border border-[#ceead6]"}`}>
          {user.status ?? "-"}
        </span>
      </td>
      <td className="py-2 px-md">
        <div className={`flex items-center gap-1 ${user.status === "Suspended" ? "text-error" : "text-on-surface-variant"}`}>
          <span className={`material-symbols-outlined text-sm ${user.status === "Suspended" ? "" : "text-secondary"}`}>{user.status === "Suspended" ? "gavel" : "verified_user"}</span>
          <span className="text-xs">{user.verification ?? "-"}</span>
        </div>
      </td>
      <td className="py-2 px-md text-right font-data-mono text-data-mono">{user.totalBookings ?? "-"}</td>
      <td className="py-2 px-md text-on-surface-variant text-sm">{user.lastActive ?? "-"}</td>
      <td className="py-2 px-md text-right">
        <button onClick={() => handleManage(user.id)} className="text-primary hover:text-primary-container font-label-md text-label-md transition-colors opacity-0 group-hover:opacity-100">Manage</button>
      </td>
    </tr>
  ))
)}
</tbody>
</table>
</div>
<div className="p-md border-t border-outline-variant flex justify-between items-center bg-surface-container-lowest">
<p className="font-body-md text-body-md text-on-surface-variant">Showing {Math.min((page - 1) * limit + 1, totalItems)}-{Math.min(page * limit, totalItems)} of {totalItems} users</p>
<div className="flex gap-xs">
<button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="w-8 h-8 rounded border border-outline-variant flex items-center justify-center text-on-surface hover:bg-surface-container-low transition-colors disabled:opacity-50">
<span className="material-symbols-outlined text-sm">chevron_left</span>
</button>
<button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="w-8 h-8 rounded border border-outline-variant flex items-center justify-center text-on-surface hover:bg-surface-container-low transition-colors disabled:opacity-50">
<span className="material-symbols-outlined text-sm">chevron_right</span>
</button>
</div>
</div>
</div>
</div>
      {/* Side Drawer Filter */}
      <div className={`fixed inset-y-0 right-0 w-80 z-50 bg-surface shadow-2xl transition-transform transform ${isFilterOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="p-4 border-b border-outline-variant flex justify-between items-center">
          <h2 className="font-headline-sm font-semibold text-on-surface">Advanced Filters</h2>
          <button onClick={() => setIsFilterOpen(false)} className="material-symbols-outlined text-on-surface-variant hover:text-on-surface">close</button>
        </div>
        <div className="p-4 flex flex-col gap-4">
          <div>
            <label className="block text-sm mb-1 text-on-surface">Role</label>
            <div className="flex flex-col gap-2">
              <label className="flex items-center gap-2"><input type="checkbox" className="rounded text-primary focus:ring-primary" /> Guest</label>
              <label className="flex items-center gap-2"><input type="checkbox" className="rounded text-primary focus:ring-primary" /> Host</label>
              <label className="flex items-center gap-2"><input type="checkbox" className="rounded text-primary focus:ring-primary" /> Admin</label>
            </div>
          </div>
          <div>
            <label className="block text-sm mb-1 text-on-surface">Verification Status</label>
            <select className="w-full p-2 border border-outline-variant rounded bg-surface text-on-surface">
              <option>All</option>
              <option>Verified</option>
              <option>Pending</option>
              <option>Unverified</option>
            </select>
          </div>
        </div>
      </div>
</main>
    </>
  );
}
