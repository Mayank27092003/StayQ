"use client";
import React, { useEffect, useState } from 'react';
import axios from 'axios';

export default function FeaturedContentPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Controller route: 'admin/featured/placements'
    axios.get('/api/admin/featured/placements')
      .then(res => setData(res.data))
      .catch(err => console.error("Error fetching featured content:", err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="flex-1 overflow-y-auto p-gutter lg:p-margin bg-background">
      <div className="max-w-[1440px] mx-auto w-full">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-md mb-xl">
          <div className="flex-1 min-w-0">
            <h1 className="font-display-lg text-display-lg text-on-surface mb-xs">Featured Content Curation</h1>
            <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl">Manage homepage modules, adjust ordering, and toggle visibility for the main app feed.</p>
          </div>
          <div className="flex gap-sm shrink-0">
            <button className="bg-surface-container-low border border-outline-variant/30 text-on-surface font-label-md text-label-md py-sm px-lg rounded-full hover:bg-surface-container-high transition-colors flex items-center gap-xs" onClick={() => alert('Changes reverted')}>
              <span className="material-symbols-outlined text-sm" data-icon="history">history</span>
              Revert
            </button>
            <button className="bg-primary text-on-primary font-label-md text-label-md py-sm px-lg rounded-full hover:bg-primary-container hover:text-on-primary-container transition-colors shadow-[0_4px_14px_rgba(157,0,255,0.25)] flex items-center gap-xs" onClick={() => axios.post('/api/v1/admin/featured/publish').then(() => alert('Changes published!')).catch(() => alert('Failed to publish.'))}>
              <span className="material-symbols-outlined text-sm" data-icon="save">save</span>
              Publish Changes
            </button>
          </div>
        </div>

        {/* Content Grid (Bento Style) */}
        <div className="grid grid-cols-12 gap-gutter">
          {/* Left Column: Draggable List */}
          <div className="col-span-12 lg:col-span-8 flex flex-col gap-md">
            
            {loading ? (
              Array.from({ length: 3 }).map((_, idx) => (
                <div key={`skel-${idx}`} className="bg-surface rounded-xl border border-outline-variant p-md flex items-center gap-md animate-pulse">
                  <div className="h-20 w-32 rounded-lg bg-surface-container-high"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-5 bg-surface-container-high rounded w-1/3"></div>
                    <div className="h-4 bg-surface-container-high rounded w-1/2"></div>
                  </div>
                </div>
              ))
            ) : (data?.placements || []).length > 0 ? (
              (data?.placements || []).map((item: any, idx: number) => (
                <div key={idx} className="bg-surface rounded-xl border border-outline-variant shadow-sm hover:shadow-md transition-shadow group cursor-grab active:cursor-grabbing flex items-center p-md gap-md">
                  <div className="text-outline-variant hover:text-on-surface-variant cursor-grab active:cursor-grabbing p-xs">
                    <span className="material-symbols-outlined" data-icon="drag_indicator">drag_indicator</span>
                  </div>
                  <div className="h-20 w-32 rounded-lg bg-surface-container-low overflow-hidden shrink-0 border border-outline-variant/50 relative">
                    <img alt="Preview" className="w-full h-full object-cover" src={item.image || "https://lh3.googleusercontent.com/aida-public/AB6AXuCUzBWc-5MN8OGPCDrb0XuULzvHUdyqFCFnDsSYdM3ukGeB8Y45-4Y9zrTzT1JpIgDGwQD3c6qQIm_1amwXrmE7adnqE3KXBzgrH2c6qNWGQCr57k929H7xpnvGPqoxaONKNfrrOiIcss1WEeTTeclWtDG_6gjzJ0hrVW3NK1cAv1jrUG6ixUMZ5Ek35YiwAnXg_Ok2OqHunISMDwCvTNKFtngbqhN6C9bD2rjgWTonrz-OcRldqJLD"} />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent flex items-end p-2">
                      <span className="text-white text-[10px] font-bold uppercase tracking-wider">{item.type || "Hero Banner"}</span>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-xs mb-1">
                      <h3 className="font-headline-md text-headline-md text-on-surface truncate">{item.title}</h3>
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-primary/10 text-primary">Carousel</span>
                    </div>
                    <p className="font-body-md text-body-md text-on-surface-variant truncate">{item.description}</p>
                    <div className="font-data-mono text-data-mono text-outline text-xs mt-1">{item.itemsCount ?? 0} Items &bull; Updated 2h ago</div>
                  </div>
                  <div className="flex items-center gap-md pl-md border-l border-outline-variant">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" checked={item.active} readOnly />
                      <div className="w-11 h-6 bg-surface-container-highest peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-outline-variant after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                    <button className="text-outline hover:text-on-surface-variant p-2 rounded-full hover:bg-surface-container-low transition-colors" onClick={() => alert('Edit clicked')}>
                      <span className="material-symbols-outlined" data-icon="edit">edit</span>
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center p-md text-on-surface-variant bg-surface rounded-xl border border-outline-variant">No content modules found.</div>
            )}

            <button className="border-2 border-dashed border-outline-variant/60 rounded-xl p-md flex items-center justify-center gap-sm text-outline hover:text-primary hover:border-primary hover:bg-primary-container/5 transition-all duration-200" onClick={() => alert('Add module')}>
              <span className="material-symbols-outlined" data-icon="add_circle">add_circle</span>
              <span className="font-label-md text-label-md uppercase tracking-wider">Add Content Module</span>
            </button>
          </div>

          {/* Right Column: Settings / Info */}
          <div className="col-span-12 lg:col-span-4 flex flex-col gap-gutter">
            <div className="bg-surface rounded-xl border border-outline-variant shadow-sm p-lg">
              <h3 className="font-headline-md text-headline-md text-on-surface mb-md flex items-center gap-sm">
                <span className="material-symbols-outlined text-primary" data-icon="public">public</span>
                App Visibility Status
              </h3>
              <div className="flex items-center justify-between p-sm bg-surface-container-low rounded-lg border border-outline-variant/50">
                <div>
                  <span className="font-label-md text-label-md text-on-surface block">Live Homepage</span>
                  <span className="font-body-md text-body-md text-on-surface-variant text-xs">Currently active for all users</span>
                </div>
                <span className="flex h-3 w-3 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-secondary opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-secondary"></span>
                </span>
              </div>
            </div>

            <div className="bg-surface rounded-xl border border-outline-variant shadow-sm p-lg">
              <h3 className="font-headline-md text-headline-md text-on-surface mb-md flex items-center gap-sm">
                <span className="material-symbols-outlined text-primary" data-icon="insights">insights</span>
                Module Performance
              </h3>
              <div className="space-y-md">
                {loading ? (
                  <div className="animate-pulse h-12 bg-surface-container-high rounded w-full"></div>
                ) : (data?.placements || []).slice(0, 3).map((item: any, i: number) => (
                  <div key={i} className="flex flex-col">
                    <div className="flex justify-between items-end mb-1">
                      <span className="font-label-md text-label-md text-on-surface-variant">{item.title}</span>
                      <span className="font-data-mono text-data-mono text-on-surface">{item.ctr ?? "-"}% CTR</span>
                    </div>
                    <div className="w-full bg-surface-container-high rounded-full h-1.5">
                      <div className="bg-primary h-1.5 rounded-full" style={{ width: `${item.ctr || 0}%` }}></div>
                    </div>
                  </div>
                ))}
                {!loading && !(data?.placements?.length) && <div className="text-on-surface-variant text-sm text-center">No performance data available.</div>}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
