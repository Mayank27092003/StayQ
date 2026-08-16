"use client";
import React, { useEffect, useState } from 'react';
import axios from 'axios';

import Toast from '@/components/Toast';

export default function ContentModerationPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [toast, setToast] = useState<{message: string, type: 'success'|'error'|'info'} | null>(null);

  useEffect(() => {
    axios.get('/api/v1/admin/moderation')
      .then(res => setData(res.data))
      .catch(err => {
        console.error("Error fetching moderation queue:", err);
        // Fallback for demo just in case route varies
        axios.get('/api/admin/moderation/reviews').then(r => setData(r.data)).catch(() => {});
      })
      .finally(() => setLoading(false));
  }, []);

  const queue = data?.queue || data?.data || data?.items || [];
  const activeItem = queue[activeIndex] || null;

  const handleApprove = () => {
    if(!activeItem) return;
    axios.post('/api/v1/admin/moderation/' + (activeItem.id || activeItem._id || activeItem.modId) + '/approve').then(() => {
        setToast({message: "Approved!", type: 'success'});
        setActiveIndex(i => Math.min(queue.length - 1, i + 1));
    }).catch(err => setToast({message: "Error approving: " + err.message, type: 'error'}));
  };

  const handleReject = () => {
    if(!activeItem) return;
    axios.post('/api/v1/admin/moderation/' + (activeItem.id || activeItem._id || activeItem.modId) + '/reject').then(() => {
        setToast({message: "Rejected!", type: 'success'});
        setActiveIndex(i => Math.min(queue.length - 1, i + 1));
    }).catch(err => setToast({message: "Error rejecting: " + err.message, type: 'error'}));
  };

  return (
    <main className="flex-1 p-gutter overflow-x-hidden w-full relative">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <div className="max-w-[1440px] mx-auto h-full flex flex-col lg:flex-row gap-gutter">
        {/* Left Column: The Queue (List) */}
        <div className="w-full lg:w-[320px] shrink-0 flex flex-col gap-md">
          <div className="flex items-center justify-between">
            <h3 className="font-headline-md text-headline-md font-semibold text-on-surface">Review Queue</h3>
            <button onClick={() => setIsFilterOpen(true)} className="text-primary hover:bg-surface-container p-1 rounded-full transition-colors">
              <span className="material-symbols-outlined text-[20px]">filter_list</span>
            </button>
          </div>
          {/* Queue List */}
          <div className="flex-1 overflow-y-auto space-y-sm pr-xs">
            {loading ? (
                Array.from({length: 4}).map((_, i) => (
                    <div key={i} className="animate-pulse bg-surface-container-lowest border border-outline-variant p-md rounded-xl h-24 mb-2"></div>
                ))
            ) : queue.length === 0 ? (
                <div className="p-4 text-center text-on-surface-variant">No items in queue.</div>
            ) : (
                queue.map((item: any, idx: number) => (
                  <div key={idx} onClick={() => setActiveIndex(idx)} className={`bg-surface-container-lowest p-md cursor-pointer transition-all ${idx === activeIndex ? 'border-l-4 border-primary rounded-r-xl shadow-sm' : 'border border-outline-variant rounded-xl hover:border-primary/50'}`}>
                    <div className="flex justify-between items-start mb-xs">
                      <span className="bg-surface-container-high text-on-surface-variant px-2 py-0.5 rounded font-label-md text-[10px] tracking-wider uppercase">{item.type ?? "-"}</span>
                      <span className="font-data-mono text-data-mono text-outline text-[12px]">{item.time ?? "-"}</span>
                    </div>
                    <h4 className="font-body-md text-body-md font-semibold text-on-surface line-clamp-1">{item.title ?? "-"}</h4>
                    <p className="font-body-md text-[13px] text-on-surface-variant mt-1 line-clamp-1">Host ID: {item.hostId ?? "-"}</p>
                  </div>
                ))
            )}
          </div>
        </div>

        {/* Right Column: Comparison Canvas */}
        <div className="flex-1 bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant flex flex-col overflow-hidden">
          {loading ? (
            <div className="p-lg flex-1 flex items-center justify-center animate-pulse"><div className="w-full max-w-lg h-64 bg-surface-variant rounded-xl"></div></div>
          ) : !activeItem ? (
            <div className="p-lg flex-1 flex items-center justify-center text-on-surface-variant">Select an item from the queue</div>
          ) : (
            <>
              {/* Moderation Header */}
              <div className="p-lg border-b border-outline-variant bg-surface-container-low/50 flex flex-wrap justify-between items-start gap-md">
                <div>
                  <h2 className="font-headline-lg text-headline-lg font-bold text-on-surface">{activeItem.title ?? "-"}</h2>
                  <p className="font-body-md text-body-md text-on-surface-variant mt-xs">{activeItem.description ?? "Host is requesting to update content."}</p>
                  <div className="flex items-center gap-sm mt-md">
                    <span className="bg-surface-container text-on-surface-variant px-2 py-1 rounded font-data-mono text-[12px]">Property ID: {activeItem.propertyId ?? "-"}</span>
                    <span className="bg-surface-container text-on-surface-variant px-2 py-1 rounded font-data-mono text-[12px]">Trust Score: {activeItem.trustScore ?? "-"}</span>
                  </div>
                </div>
                <div className="mt-md">
                  <button onClick={() => setToast({message: "Flagging Host " + activeItem.hostId, type: 'info'})} className="flex items-center gap-xs px-md py-sm border border-outline-variant rounded-lg text-error hover:bg-error/5 transition-colors">
                    <span className="material-symbols-outlined text-sm">flag</span>
                    <span className="font-label-md text-label-md">Flag Host</span>
                  </button>
                </div>
              </div>
              {/* Comparison Area */}
              <div className="flex-1 overflow-y-auto p-lg space-y-xl">
                <div>
                  <h3 className="font-headline-md text-headline-md font-semibold text-on-surface mb-md flex items-center gap-xs">
                    <span className="material-symbols-outlined text-outline">image</span>
                    Primary Photo
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
                    <div className="space-y-xs">
                      <div className="flex justify-between items-center">
                        <span className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">Current</span>
                      </div>
                      <div className="aspect-video rounded-lg overflow-hidden border border-outline-variant relative group">
                        {activeItem.currentImage ? <img src={activeItem.currentImage} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-surface-variant flex items-center justify-center text-on-surface-variant">No Image</div>}
                      </div>
                    </div>
                    <div className="space-y-xs">
                      <div className="flex justify-between items-center">
                        <span className="font-label-md text-label-md text-primary font-bold uppercase tracking-wider flex items-center gap-xs">
                          <span className="w-2 h-2 rounded-full bg-secondary"></span>
                          Proposed
                        </span>
                      </div>
                      <div className="aspect-video rounded-lg overflow-hidden border-2 border-secondary relative group">
                        {activeItem.proposedImage ? <img src={activeItem.proposedImage} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-surface-variant flex items-center justify-center text-on-surface-variant">No Image</div>}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              {/* Action Footer */}
              <div className="p-md border-t border-outline-variant bg-surface-container flex justify-end gap-md">
                <button onClick={() => setActiveIndex(i => Math.min(queue.length - 1, i + 1))} className="px-xl py-sm rounded-lg font-label-md text-label-md border border-outline text-on-surface hover:bg-surface-container-high transition-colors">
                  Skip for Now
                </button>
                <button onClick={handleReject} className="px-xl py-sm rounded-lg font-label-md text-label-md bg-error text-on-error hover:bg-error/90 transition-colors shadow-sm flex items-center gap-xs">
                  <span className="material-symbols-outlined text-[18px]">close</span>
                  Reject
                </button>
                <button onClick={handleApprove} className="px-xl py-sm rounded-lg font-label-md text-label-md bg-primary text-on-primary hover:bg-primary-container hover:text-on-primary-container transition-colors shadow-sm flex items-center gap-xs">
                  <span className="material-symbols-outlined text-[18px]">check</span>
                  Approve Update
                </button>
              </div>
            </>
          )}
        </div>
      </div>
      {/* Side Drawer Filter */}
      <div className={`fixed inset-y-0 right-0 w-80 z-50 bg-surface shadow-2xl transition-transform transform ${isFilterOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="p-4 border-b border-outline-variant flex justify-between items-center">
          <h2 className="font-headline-sm font-semibold text-on-surface">Filters</h2>
          <button onClick={() => setIsFilterOpen(false)} className="material-symbols-outlined text-on-surface-variant hover:text-on-surface">close</button>
        </div>
        <div className="p-4 flex flex-col gap-4">
          <div>
            <label className="block text-sm mb-1 text-on-surface">Type</label>
            <select className="w-full p-2 border border-outline-variant rounded bg-surface text-on-surface">
              <option>All Types</option>
              <option>Photo Update</option>
              <option>Text Update</option>
            </select>
          </div>
          <div>
            <label className="block text-sm mb-1 text-on-surface">Priority</label>
            <select className="w-full p-2 border border-outline-variant rounded bg-surface text-on-surface">
              <option>All</option>
              <option>High</option>
              <option>Medium</option>
              <option>Low</option>
            </select>
          </div>
        </div>
      </div>
    </main>
  );
}
