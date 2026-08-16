"use client";

import { useEffect, useState } from "react";
import axios from "axios";

export default function HostManagement() {
  const [summary, setSummary] = useState<any>(null);
  const [hosts, setHosts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showLowPerformers, setShowLowPerformers] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState('asc');
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  useEffect(() => {
    // Fetch Host Summary
    axios.get("/api/v1/admin/test-hosts/summary")
      .then(res => setSummary(res.data))
      .catch(err => console.error(err));

    // Fetch Hosts List
    axios.get("/api/v1/admin/test-hosts")
      .then(res => {
        setHosts(res.data?.data || []);
        setIsLoading(false);
      })
      .catch(err => {
        console.error(err);
        setIsLoading(false);
      });
  }, []);

  const handleSendNotice = async (hostId: string) => {
    try {
      await axios.patch(`/api/v1/admin/hosts/${hostId}/notice`);
      alert("Notice sent successfully!");
    } catch (err) {
      console.error(err);
      alert("Failed to send notice.");
    }
  };

  let displayedHosts = showLowPerformers 
    ? hosts.filter(h => (h.responseRate != null && h.responseRate < 80) || (h.rating != null && h.rating < 3.5))
    : hosts;
  
  if (searchQuery) {
    displayedHosts = displayedHosts.filter(h => h.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) || h.email?.toLowerCase().includes(searchQuery.toLowerCase()));
  }
  
  displayedHosts = [...displayedHosts].sort((a, b) => sortOrder === 'desc' ? (b.ytdRevenue || 0) - (a.ytdRevenue || 0) : (a.ytdRevenue || 0) - (b.ytdRevenue || 0));

  const handleVerify = async (hostId: string) => {
    try {
      await axios.patch(`/api/v1/admin/hosts/${hostId}/status`, { status: 'VERIFIED' });
      setHosts(hosts.map(h => h.id === hostId ? { ...h, hostStatus: 'VERIFIED' } : h));
      alert('Host verified successfully!');
    } catch(e) {
      alert('Failed to verify host.');
    }
  };

  return (
    <>
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-md mb-lg">
        <div>
          <h2 className="font-display-lg text-display-lg text-on-background">Hosts</h2>
          <p className="font-body-md text-body-md text-on-surface-variant mt-1">Manage property owners, verification status, and performance metrics.</p>
        </div>
        <button className="bg-primary text-on-primary hover:bg-primary-container hover:text-on-primary-container px-lg py-2 rounded-full font-label-md text-label-md flex items-center gap-2 transition-all shadow-sm active:scale-98" onClick={() => {
          const pending = hosts.find(h => h.hostStatus !== 'VERIFIED');
          if (pending) handleVerify(pending.id);
          else alert('No pending hosts found.');
        }}>
          <span className="material-symbols-outlined text-sm">verified_user</span>
          Verify Host
        </button>
      </div>

      {/* KPI Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-md mb-lg">
        <div className="bg-surface-container-lowest rounded-xl p-md border border-outline-variant shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-sm">
            <span className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">Total Hosts</span>
            <span className="material-symbols-outlined text-outline">group</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-display-lg text-display-lg text-on-surface">{summary?.totalHosts ?? "-"}</span>
          </div>
        </div>
        <div className="bg-surface-container-lowest rounded-xl p-md border border-outline-variant shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-sm">
            <span className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">Pending Verification</span>
            <span className="material-symbols-outlined text-tertiary">pending_actions</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-display-lg text-display-lg text-on-surface">{summary?.byStatus?.PENDING_REVIEW ?? "0"}</span>
            <span className="font-label-md text-label-md text-on-surface-variant">requires action</span>
          </div>
        </div>
        <div className="bg-surface-container-lowest rounded-xl p-md border border-outline-variant shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-sm">
            <span className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">Total Superhosts</span>
            <span className="material-symbols-outlined text-outline">star</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-display-lg text-display-lg text-on-surface">{summary?.superhosts ?? "-"}</span>
          </div>
        </div>
      </div>

      {/* Data Table Section */}
      <div className="bg-surface-container-lowest rounded-xl border border-outline-variant shadow-sm overflow-hidden flex flex-col">
        {/* Table Toolbar */}
        <div className="p-md border-b border-outline-variant flex flex-col sm:flex-row justify-between items-center gap-sm bg-surface">
          <div className="relative w-full sm:w-64">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-sm">search</span>
            <input className="w-full bg-background border border-outline-variant rounded-md pl-9 pr-3 py-1.5 font-body-md text-body-md focus:border-primary focus:ring-1 focus:ring-primary outline-none" placeholder="Filter hosts..." type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <button 
              onClick={() => setShowLowPerformers(!showLowPerformers)}
              className={`px-sm py-1.5 border rounded-md font-label-md text-label-md flex items-center gap-1 transition-colors ${showLowPerformers ? 'bg-primary text-on-primary border-primary' : 'border-outline-variant text-on-surface hover:bg-surface-container'}`}
            >
              <span className="material-symbols-outlined text-sm">warning</span> Low Performers
            </button>
            <button className="px-sm py-1.5 border border-outline-variant rounded-md font-label-md text-label-md text-on-surface flex items-center gap-1 hover:bg-surface-container transition-colors" onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}>
              <span className="material-symbols-outlined text-sm">sort</span> Sort
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="border-b border-outline-variant bg-surface-container-low text-on-surface-variant font-label-md text-label-md uppercase tracking-wider">
                <th className="px-md py-sm font-medium">Host</th>
                <th className="px-md py-sm font-medium">Status</th>
                <th className="px-md py-sm font-medium text-right">Listings</th>
                <th className="px-md py-sm font-medium text-right">Revenue (YTD)</th>
                <th className="px-md py-sm font-medium">Rating</th>
                <th className="px-md py-sm font-medium text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="font-body-md text-body-md text-on-surface divide-y divide-outline-variant/50 bg-surface-container-lowest">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={`skel-${i}`} className="h-[56px] animate-pulse">
                    <td className="px-md py-2"><div className="h-8 bg-surface-variant rounded w-3/4"></div></td>
                    <td className="px-md py-2"><div className="h-5 bg-surface-variant rounded-full w-16"></div></td>
                    <td className="px-md py-2 text-right"><div className="h-4 bg-surface-variant rounded w-8 ml-auto"></div></td>
                    <td className="px-md py-2 text-right"><div className="h-4 bg-surface-variant rounded w-16 ml-auto"></div></td>
                    <td className="px-md py-2"><div className="h-4 bg-surface-variant rounded w-12"></div></td>
                    <td className="px-md py-2"></td>
                  </tr>
                ))
              ) : displayedHosts.length > 0 ? (
                displayedHosts.map((host: any, i: number) => (
                  <tr key={i} className="hover:bg-surface-container-low transition-colors group h-[56px]">
                    <td className="px-md py-2">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-surface-variant flex items-center justify-center font-bold text-on-surface-variant text-xs uppercase">
                          {host.displayName?.[0] || host.payoutAccountName?.[0] || host.email?.[0] || "?"}
                        </div>
                        <div>
                          <div className="font-headline-md text-headline-md !text-[14px] !leading-snug">{host.displayName || host.payoutAccountName || "Unknown"}</div>
                          <div className="text-on-surface-variant text-[12px]">{host.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-md py-2">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${host.hostStatus === 'VERIFIED' ? 'bg-secondary-container text-on-secondary-container' : 'bg-primary-fixed text-on-primary-fixed-variant'}`}>
                        {host.hostStatus || 'Pending'}
                      </span>
                    </td>
                    <td className="px-md py-2 text-right font-data-mono text-data-mono">{host._count?.properties || 0}</td>
                    <td className="px-md py-2 text-right font-data-mono text-data-mono">${host.ytdRevenue || "0"}</td>
                    <td className="px-md py-2">
                      <div className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm text-[#F59E0B]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                        <span className="font-medium">{host.rating?.toFixed(1) || "N/A"}</span>
                      </div>
                    </td>
                    <td className="px-md py-2 text-center">
                      <div className="flex items-center justify-center gap-2">
                        {showLowPerformers && (
                          <button 
                            onClick={() => handleSendNotice(host.id)}
                            className="bg-primary/10 text-primary hover:bg-primary hover:text-on-primary px-2 py-1 rounded text-[11px] font-bold tracking-wider transition-colors"
                          >
                            SEND NOTICE
                          </button>
                        )}
                        <div className="relative">
                          <button onClick={() => setOpenMenuId(openMenuId === host.id ? null : host.id)} className="text-on-surface-variant hover:text-primary transition-colors p-1 rounded hover:bg-surface-container">
                            <span className="material-symbols-outlined text-sm">more_vert</span>
                          </button>
                          {openMenuId === host.id && (
                            <div className="absolute right-0 top-full mt-1 w-32 bg-surface rounded-md shadow-lg border border-outline-variant z-10 py-1">
                              <button onClick={() => setOpenMenuId(null)} className="w-full text-left px-3 py-1.5 text-sm text-on-surface hover:bg-surface-container">View Profile</button>
                              <button onClick={() => setOpenMenuId(null)} className="w-full text-left px-3 py-1.5 text-sm text-on-surface hover:bg-surface-container">Edit</button>
                              <button onClick={() => setOpenMenuId(null)} className="w-full text-left px-3 py-1.5 text-sm text-error hover:bg-error/10">Suspend</button>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-md py-lg text-center text-on-surface-variant">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <span className="material-symbols-outlined text-4xl text-outline-variant">inbox</span>
                      <p>No hosts found.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {/* Pagination */}
        <div className="p-sm border-t border-outline-variant bg-surface flex justify-between items-center text-on-surface-variant font-label-md text-label-md">
          <span>Showing 1 to {Math.max(displayedHosts.length, 1)} of {summary?.total ?? displayedHosts.length ?? "-"} entries</span>
          <div className="flex gap-1">
            <button className="p-1 rounded hover:bg-surface-container disabled:opacity-50" onClick={() => alert('Previous page')}><span className="material-symbols-outlined text-sm">chevron_left</span></button>
            <button className="p-1 rounded hover:bg-surface-container" onClick={() => alert('Next page')}><span className="material-symbols-outlined text-sm">chevron_right</span></button>
          </div>
        </div>
      </div>
    </>
  );
}
