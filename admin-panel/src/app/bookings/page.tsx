"use client";

import React, { useEffect, useState, useMemo } from 'react';
import axios from 'axios';
import Link from 'next/link';

export default function BookingsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [dateFilterOpen, setDateFilterOpen] = useState(false);
  const [hostFilterOpen, setHostFilterOpen] = useState(false);
  const [columnsViewOpen, setColumnsViewOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"list" | "timeline">("list");
  const limit = 5;

  useEffect(() => {
    setLoading(true);
    axios.get('/api/v1/admin/bookings')
      .then(res => setData(res.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const handleExport = () => {
    window.open('/api/v1/admin/bookings?format=csv', '_blank');
  };

  const filteredData = useMemo(() => {
    if (!data?.data) return [];
    if (!search) return data.data;
    return data.data.filter((item: any) => 
      JSON.stringify(item).toLowerCase().includes(search.toLowerCase())
    );
  }, [data?.data, search]);

  const totalItems = filteredData.length;
  const totalPages = Math.ceil(totalItems / limit) || 1;
  const paginatedData = filteredData.slice((page - 1) * limit, page * limit);

  return (
    <>
      {/* data points can be wired below using data?.field etc. */}
      <main className="flex-1 overflow-y-auto p-gutter bg-surface">
<div className="max-w-[1440px] mx-auto flex flex-col gap-gutter">
{/* Page Header & Actions */}
<div className="flex flex-col md:flex-row md:items-end justify-between gap-md">
<div>
<h1 className="font-display-lg text-display-lg text-on-surface">Bookings Ledger</h1>
<p className="font-body-md text-body-md text-on-surface-variant mt-1">Manage and track all reservation statuses and financials.</p>
</div>
<div className="flex flex-wrap items-center gap-sm">
{/* Date Filter */}
<div className="relative">
<div onClick={() => setDateFilterOpen(!dateFilterOpen)} className="border border-outline-variant rounded-md bg-surface-container-lowest px-3 py-2 flex items-center gap-2 hover:border-primary transition-colors cursor-pointer">
<span className="material-symbols-outlined text-outline text-sm">calendar_today</span>
<span className="font-body-md text-body-md text-on-surface">{data?.summary?.period ?? "-"}</span>
<span className="material-symbols-outlined text-outline text-sm ml-2">arrow_drop_down</span>
</div>
{dateFilterOpen && (
  <div className="absolute top-full mt-1 right-0 w-48 bg-surface-container-lowest border border-outline-variant rounded-md shadow-lg z-50 py-1">
    {["Today", "Last 7 Days", "This Month"].map(option => (
      <button key={option} onClick={() => setDateFilterOpen(false)} className="w-full text-left px-4 py-2 font-body-md text-body-md text-on-surface hover:bg-surface-container transition-colors">
        {option}
      </button>
    ))}
  </div>
)}
</div>
{/* View Toggle */}
<div className="flex bg-surface-container-low border border-outline-variant rounded-md p-0.5">
<button onClick={() => setViewMode('list')} className={`px-3 py-1.5 rounded flex items-center gap-1 ${viewMode === 'list' ? 'bg-surface-container-lowest shadow-sm text-primary' : 'text-on-surface-variant hover:text-primary'}`}>
<span className="material-symbols-outlined text-sm">list</span>
<span className="font-label-md text-label-md">List</span>
</button>
<button onClick={() => setViewMode('timeline')} className={`px-3 py-1.5 rounded flex items-center gap-1 ${viewMode === 'timeline' ? 'bg-surface-container-lowest shadow-sm text-primary' : 'text-on-surface-variant hover:text-primary'}`}>
<span className="material-symbols-outlined text-sm">view_timeline</span>
<span className="font-label-md text-label-md hidden md:inline">Timeline</span>
</button>
</div>
{/* Export Action */}
<button onClick={handleExport} className="px-4 py-2 border border-outline-variant text-on-surface font-label-md text-label-md rounded-md hover:bg-surface-container transition-colors flex items-center gap-2">
<span className="material-symbols-outlined text-sm">download</span>
                            Export
                        </button>
</div>
</div>
{/* KPI Summary Row (Bento Style) */}
<div className="grid grid-cols-1 md:grid-cols-4 gap-md">
<div className="bg-surface-container-lowest p-md rounded-xl border border-outline-variant shadow-[0px_4px_20px_rgba(0,0,0,0.03)] flex flex-col gap-2 relative overflow-hidden">
<div className="absolute right-0 bottom-0 opacity-5 pointer-events-none transform translate-x-4 translate-y-4">
<span className="material-symbols-outlined text-[100px]">event_available</span>
</div>
<span className="font-label-md text-label-md text-on-surface-variant">Total Active Bookings</span>
<div className="flex items-baseline gap-2">
{loading ? <div className="h-8 w-24 bg-outline-variant/30 animate-pulse rounded"></div> : <>
<span className="font-headline-lg text-headline-lg text-on-surface">{data?.summary?.activeBookings ?? "-"}</span>
</>}
</div>
</div>
<div className="bg-surface-container-lowest p-md rounded-xl border border-outline-variant shadow-[0px_4px_20px_rgba(0,0,0,0.03)] flex flex-col gap-2 relative overflow-hidden">
<div className="absolute right-0 bottom-0 opacity-5 pointer-events-none transform translate-x-4 translate-y-4">
<span className="material-symbols-outlined text-[100px]">attach_money</span>
</div>
<span className="font-label-md text-label-md text-on-surface-variant">Gross Booking Value</span>
<div className="flex items-baseline gap-2">
{loading ? <div className="h-8 w-24 bg-outline-variant/30 animate-pulse rounded"></div> : <>
<span className="font-headline-lg text-headline-lg text-on-surface">{data?.summary?.grossValue ?? "-"}</span>
</>}
</div>
</div>
<div className="bg-surface-container-lowest p-md rounded-xl border border-outline-variant shadow-[0px_4px_20px_rgba(0,0,0,0.03)] flex flex-col gap-2 relative overflow-hidden">
<div className="absolute right-0 bottom-0 opacity-5 pointer-events-none transform translate-x-4 translate-y-4">
<span className="material-symbols-outlined text-[100px]">account_balance_wallet</span>
</div>
<span className="font-label-md text-label-md text-on-surface-variant">Platform Commission</span>
<div className="flex items-baseline gap-2">
{loading ? <div className="h-8 w-24 bg-outline-variant/30 animate-pulse rounded"></div> : <>
<span className="font-headline-lg text-headline-lg text-on-surface">{data?.summary?.commission ?? "-"}</span>
</>}
</div>
</div>
<div className="bg-surface-container-lowest p-md rounded-xl border border-outline-variant shadow-[0px_4px_20px_rgba(0,0,0,0.03)] flex flex-col gap-2 relative overflow-hidden">
<div className="absolute right-0 bottom-0 opacity-5 pointer-events-none transform translate-x-4 translate-y-4">
<span className="material-symbols-outlined text-[100px]">event_busy</span>
</div>
<span className="font-label-md text-label-md text-on-surface-variant">Cancellation Rate</span>
<div className="flex items-baseline gap-2">
{loading ? <div className="h-8 w-24 bg-outline-variant/30 animate-pulse rounded"></div> : <>
<span className="font-headline-lg text-headline-lg text-on-surface">{data?.summary?.cancellationRate ?? "-"}</span>
</>}
</div>
</div>
</div>
{/* Main Ledger Table */}
<div className="bg-surface-container-lowest rounded-xl border border-outline-variant shadow-[0px_4px_20px_rgba(0,0,0,0.03)] overflow-hidden flex flex-col">
{/* Table Header Tools */}
<div className="p-md border-b border-outline-variant flex flex-wrap items-center justify-between gap-md bg-surface-container-low/30">
<div className="flex items-center gap-sm">
<div className="relative w-64">
<span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline-variant text-sm">search</span>
<input value={search} onChange={e => {setSearch(e.target.value); setPage(1);}} className="w-full bg-surface-container-lowest border border-outline-variant rounded-md py-1.5 pl-9 pr-3 text-body-md font-body-md focus:border-primary focus:ring-1 focus:ring-primary outline-none" placeholder="Search ID, Guest, or Host..." type="text"/>
</div>
<div className="relative">
<button onClick={() => setHostFilterOpen(!hostFilterOpen)} className="flex items-center gap-1 px-3 py-1.5 border border-outline-variant rounded-md hover:bg-surface-container transition-colors">
<span className="material-symbols-outlined text-sm text-outline-variant">filter_list</span>
<span className="font-label-md text-label-md text-on-surface-variant">Filter by Host</span>
</button>
{hostFilterOpen && (
  <div className="absolute top-full mt-1 left-0 w-48 bg-surface-container-lowest border border-outline-variant rounded-md shadow-lg z-50 p-2 flex flex-col gap-2">
    {["Host A (Alice)", "Host B (Bob)", "Host C (Charlie)"].map(host => (
      <label key={host} className="flex items-center gap-2 cursor-pointer p-1 hover:bg-surface-container rounded">
        <input type="checkbox" className="rounded border-outline-variant text-primary focus:ring-primary" />
        <span className="font-body-md text-body-md text-on-surface">{host}</span>
      </label>
    ))}
  </div>
)}
</div>
</div>
<div className="flex gap-2">
<button onClick={() => window.location.reload()} className="text-on-surface-variant p-1 rounded hover:bg-surface-container" title="Refresh">
<span className="material-symbols-outlined text-sm">refresh</span>
</button>
<div className="relative">
<button onClick={() => setColumnsViewOpen(!columnsViewOpen)} className="text-on-surface-variant p-1 rounded hover:bg-surface-container" title="Columns">
<span className="material-symbols-outlined text-sm">view_column</span>
</button>
{columnsViewOpen && (
  <div className="absolute top-full mt-1 right-0 w-40 bg-surface-container-lowest border border-outline-variant rounded-md shadow-lg z-50 p-2 flex flex-col gap-2">
    {["Guest", "Status", "Amount"].map(col => (
      <label key={col} className="flex items-center gap-2 cursor-pointer p-1 hover:bg-surface-container rounded">
        <input type="checkbox" defaultChecked className="rounded border-outline-variant text-primary focus:ring-primary" />
        <span className="font-body-md text-body-md text-on-surface">{col}</span>
      </label>
    ))}
  </div>
)}
</div>
</div>
</div>
<div className="overflow-x-auto">
{viewMode === 'list' ? (
<table className="w-full text-left border-collapse">
<thead>
<tr className="border-b border-outline-variant bg-surface-container-low/50">
<th className="p-sm font-label-md text-label-md text-on-surface-variant font-semibold pl-md">Booking ID</th>
<th className="p-sm font-label-md text-label-md text-on-surface-variant font-semibold">Guest &amp; Dates</th>
<th className="p-sm font-label-md text-label-md text-on-surface-variant font-semibold">Property &amp; Host</th>
<th className="p-sm font-label-md text-label-md text-on-surface-variant font-semibold">Status</th>
<th className="p-sm font-label-md text-label-md text-on-surface-variant font-semibold text-right">Gross Total</th>
<th className="p-sm font-label-md text-label-md text-on-surface-variant font-semibold text-right">Commission</th>
<th className="p-sm font-label-md text-label-md text-on-surface-variant font-semibold text-right pr-md">Host Payout</th>
</tr>
</thead>
<tbody className="divide-y divide-outline-variant/50">
{loading ? (
  [...Array(5)].map((_, i) => (
    <tr key={i} className="h-[56px]">
      <td className="p-sm pl-md"><div className="h-4 w-20 bg-outline-variant/30 animate-pulse rounded"></div></td>
      <td className="p-sm"><div className="h-4 w-32 bg-outline-variant/30 animate-pulse rounded"></div></td>
      <td className="p-sm"><div className="h-4 w-32 bg-outline-variant/30 animate-pulse rounded"></div></td>
      <td className="p-sm"><div className="h-4 w-16 bg-outline-variant/30 animate-pulse rounded"></div></td>
      <td className="p-sm"><div className="h-4 w-16 bg-outline-variant/30 animate-pulse rounded ml-auto"></div></td>
      <td className="p-sm"><div className="h-4 w-16 bg-outline-variant/30 animate-pulse rounded ml-auto"></div></td>
      <td className="p-sm pr-md"><div className="h-4 w-16 bg-outline-variant/30 animate-pulse rounded ml-auto"></div></td>
    </tr>
  ))
) : paginatedData.length === 0 ? (
  <tr>
    <td colSpan={7} className="text-center p-8 text-on-surface-variant">No data available</td>
  </tr>
) : (
  paginatedData.map((booking: any) => (
    <tr key={booking.id || Math.random()} className="hover:bg-surface-container-low/30 transition-colors h-[56px] group cursor-pointer">
    <td className="p-sm pl-md">
    <span className="font-data-mono text-data-mono text-primary group-hover:underline">{booking.id ?? "-"}</span>
    </td>
    <td className="p-sm">
    <div className="flex flex-col">
    <span className="font-body-md text-body-md text-on-surface font-medium">{booking.guest?.name ?? "-"}</span>
    <span className="font-label-md text-label-md text-on-surface-variant mt-0.5 text-[11px]">{booking.dates ?? "-"}</span>
    </div>
    </td>
    <td className="p-sm">
    <div className="flex flex-col">
    <span className="font-body-md text-body-md text-on-surface">{booking.property?.name ?? "-"}</span>
    <span className="font-label-md text-label-md text-on-surface-variant mt-0.5 text-[11px]">Host: {booking.host?.name ?? "-"}</span>
    </div>
    </td>
    <td className="p-sm">
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-surface-variant text-primary border border-outline-variant/30 font-label-md text-label-md text-[11px]">
    <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                                                {booking.status ?? "-"}
                                            </span>
    </td>
    <td className="p-sm text-right font-data-mono text-data-mono text-on-surface">{booking.grossTotal ?? "-"}</td>
    <td className="p-sm text-right font-data-mono text-data-mono text-on-surface-variant">{booking.commission ?? "-"}</td>
    <td className="p-sm text-right font-data-mono text-data-mono text-on-surface font-medium pr-md">{booking.hostPayout ?? "-"}</td>
    </tr>
  ))
)}
</tbody>
</table>
) : (
  <div className="p-8 flex flex-col gap-4">
    <div className="flex justify-between items-center mb-4">
      <h3 className="font-headline-sm text-headline-sm text-on-surface">Timeline View</h3>
    </div>
    {[1, 2, 3].map(i => (
      <div key={i} className="flex gap-4 items-center">
        <div className="w-16 font-label-md text-label-md text-on-surface-variant">Room {i}</div>
        <div className="flex-1 h-12 bg-surface-container rounded-lg relative overflow-hidden">
          <div className={`absolute top-2 bottom-2 bg-primary/20 border border-primary rounded px-2 py-1 flex items-center left-${i*10} w-1/3`}>
            <span className="text-primary font-label-sm text-[10px]">Booking #{8290 + i}</span>
          </div>
        </div>
      </div>
    ))}
  </div>
)}
</div>
{/* Pagination Footer */}
<div className="p-md border-t border-outline-variant flex items-center justify-between bg-surface-container-lowest">
<span className="font-body-md text-body-md text-on-surface-variant">Showing {Math.min((page - 1) * limit + 1, totalItems)}-{Math.min(page * limit, totalItems)} of {totalItems} bookings</span>
<div className="flex items-center gap-1">
<button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-1 rounded text-outline-variant hover:bg-surface-container hover:text-on-surface disabled:opacity-50">
<span className="material-symbols-outlined text-sm">chevron_left</span>
</button>
<button className="w-7 h-7 rounded bg-primary text-on-primary font-label-md text-label-md flex items-center justify-center">{page}</button>
<button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="p-1 rounded text-on-surface-variant hover:bg-surface-container hover:text-on-surface disabled:opacity-50">
<span className="material-symbols-outlined text-sm">chevron_right</span>
</button>
</div>
</div>
</div>
</div>
</main>
    </>
  );
}
