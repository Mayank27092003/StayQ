"use client";

import React, { useEffect, useState } from 'react';
import axios from 'axios';

export default function HealthPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get('/api/v1/admin/health')
      .then(res => setData(res.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <main className="flex-1 flex flex-col min-h-screen">
        {/* Canvas */}
        <div className="p-margin max-w-[1440px] mx-auto w-full flex-1">
          {/* Global Status Bar */}
          <div className="bg-secondary-container text-on-secondary-container rounded-xl p-md flex items-center justify-between mb-xl shadow-[0px_4px_20px_rgba(0,0,0,0.03)] border border-secondary-fixed-dim/30 mt-lg">
            <div className="flex items-center gap-sm">
              <span className="relative flex h-4 w-4">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-secondary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-4 w-4 bg-secondary"></span>
              </span>
              <h2 className="font-headline-md text-headline-md text-secondary">
                {loading ? "Checking Status..." : "All Systems Operational"}
              </h2>
            </div>
            <div className="font-data-mono text-data-mono text-on-secondary-container/80 text-sm">
              Last updated: {loading ? "-" : "Just now"}
            </div>
          </div>
          
          {/* Dashboard Grid */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-gutter">
            {/* KPI Widgets (Span 3 each on lg, 6 on md) */}
            <div className="col-span-1 md:col-span-6 lg:col-span-3 bg-surface-container-lowest rounded-xl p-lg shadow-[0px_4px_20px_rgba(0,0,0,0.03)] border border-outline-variant/50 relative overflow-hidden group hover:-translate-y-px hover:shadow-[0px_6px_24px_rgba(0,0,0,0.06)] transition-all">
              <div className="flex justify-between items-start mb-md">
                <span className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">Server Uptime</span>
                <span className="material-symbols-outlined text-secondary text-[20px]">cloud_done</span>
              </div>
              <div className="font-display-lg text-display-lg text-on-surface">
                {loading ? <div className="h-10 bg-surface-container-high rounded w-24 animate-pulse"></div> : (data?.uptime ?? "-")}
              </div>
              <div className="mt-xs font-body-md text-body-md text-secondary flex items-center gap-xs text-sm">
                <span className="material-symbols-outlined text-[16px]">arrow_upward</span>
                0.01% vs last month
              </div>
            </div>
            <div className="col-span-1 md:col-span-6 lg:col-span-3 bg-surface-container-lowest rounded-xl p-lg shadow-[0px_4px_20px_rgba(0,0,0,0.03)] border border-outline-variant/50 relative overflow-hidden group hover:-translate-y-px hover:shadow-[0px_6px_24px_rgba(0,0,0,0.06)] transition-all">
              <div className="flex justify-between items-start mb-md">
                <span className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">Avg Latency</span>
                <span className="material-symbols-outlined text-on-surface-variant text-[20px]">speed</span>
              </div>
              <div className="font-display-lg text-display-lg text-on-surface">
                {loading ? <div className="h-10 bg-surface-container-high rounded w-24 animate-pulse"></div> : (data?.latency ?? "-")}
              </div>
              <div className="mt-xs font-body-md text-body-md text-on-surface-variant flex items-center gap-xs text-sm">
                <span className="material-symbols-outlined text-[16px]">remove</span>
                Stable
              </div>
            </div>
            <div className="col-span-1 md:col-span-6 lg:col-span-3 bg-surface-container-lowest rounded-xl p-lg shadow-[0px_4px_20px_rgba(0,0,0,0.03)] border border-outline-variant/50 relative overflow-hidden group hover:-translate-y-px hover:shadow-[0px_6px_24px_rgba(0,0,0,0.06)] transition-all">
              <div className="flex justify-between items-start mb-md">
                <span className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">Active Requests</span>
                <span className="material-symbols-outlined text-primary text-[20px]">swap_vert</span>
              </div>
              <div className="font-display-lg text-display-lg text-on-surface">
                {loading ? <div className="h-10 bg-surface-container-high rounded w-24 animate-pulse"></div> : (data?.requests?.toLocaleString() ?? "-")}
              </div>
              <div className="mt-xs font-body-md text-body-md text-error flex items-center gap-xs text-sm">
                <span className="material-symbols-outlined text-[16px]">arrow_upward</span>
                12% spike
              </div>
            </div>
            <div className="col-span-1 md:col-span-6 lg:col-span-3 bg-error-container text-on-error-container rounded-xl p-lg shadow-[0px_4px_20px_rgba(0,0,0,0.03)] border border-error/20 relative overflow-hidden group hover:-translate-y-px hover:shadow-[0px_6px_24px_rgba(0,0,0,0.06)] transition-all">
              <div className="flex justify-between items-start mb-md">
                <span className="font-label-md text-label-md uppercase tracking-wider">Error Rate</span>
                <span className="material-symbols-outlined text-[20px]">warning</span>
              </div>
              <div className="font-display-lg text-display-lg">
                {loading ? <div className="h-10 bg-error/20 rounded w-24 animate-pulse"></div> : (data?.errors ?? "-")}
              </div>
              <div className="mt-xs font-body-md text-body-md flex items-center gap-xs text-sm">
                <span className="material-symbols-outlined text-[16px]">error</span>
                Minor anomaly detected
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
