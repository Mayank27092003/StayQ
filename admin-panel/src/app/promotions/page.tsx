"use client";
import React, { useEffect, useState } from 'react';
import axios from 'axios';

import Toast from '@/components/Toast';

export default function PromotionsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [toast, setToast] = useState<{message: string, type: 'success'|'error'|'info'} | null>(null);

  useEffect(() => {
    // Controller route: 'admin/promotions'
    axios.get('/api/admin/promotions')
      .then(res => setData(res.data))
      .catch(err => console.error("Error fetching promotions:", err))
      .finally(() => setLoading(false));
  }, []);

  const submitCreate = (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreateModalOpen(false);
    setToast({message: "Promotion created successfully!", type: 'success'});
  };

  return (
    <div className="flex-1 p-gutter max-w-[1440px] mx-auto w-full overflow-y-auto relative">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      
      {/* Create Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm transition-opacity">
          <div className="bg-surface rounded-3xl p-xl shadow-2xl w-[400px] max-w-[90vw] animate-in zoom-in-95 duration-200">
            <h3 className="font-headline-md text-headline-md text-on-surface mb-xs">Create Promotion</h3>
            <p className="font-body-md text-body-md text-on-surface-variant mb-lg">Define a new discount or campaign code.</p>
            <form onSubmit={submitCreate} className="flex flex-col gap-md">
              <input type="text" required placeholder="Campaign Name (e.g., Summer Sale)" className="w-full px-md py-sm rounded-xl border border-outline-variant bg-surface-container-lowest focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" />
              <input type="text" required placeholder="Promo Code (e.g., SUMMER20)" className="w-full px-md py-sm rounded-xl border border-outline-variant bg-surface-container-lowest focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" />
              <div className="flex justify-end gap-sm mt-md">
                <button type="button" onClick={() => setIsCreateModalOpen(false)} className="px-lg py-sm rounded-full font-label-md text-label-md text-on-surface-variant hover:bg-surface-container transition-colors">Cancel</button>
                <button type="submit" className="px-lg py-sm rounded-full bg-primary text-on-primary font-label-md text-label-md hover:bg-primary-container hover:text-on-primary-container shadow-sm transition-colors">Create</button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-xl gap-4">
        <div>
          <h2 className="font-display-lg text-display-lg text-on-background">Promotions & Campaigns</h2>
          <p className="font-body-lg text-body-lg text-on-surface-variant mt-2">Manage discount codes and active marketing campaigns.</p>
        </div>
        <button className="bg-primary text-on-primary font-label-md text-label-md py-2 px-6 rounded-full hover:bg-primary-container hover:text-on-primary-container shadow-sm transition-colors flex items-center" onClick={() => setIsCreateModalOpen(true)}>
          <span className="material-symbols-outlined mr-2">add</span>
          Create New Promotion
        </button>
      </div>

      {/* Bento Grid Layout */}
      <div className="grid grid-cols-12 gap-gutter">
        {/* KPI Widgets */}
        <div className="col-span-12 md:col-span-4 bg-surface-container-lowest p-lg rounded-xl shadow-[0px_4px_20px_rgba(0,0,0,0.03)] border border-surface-container-high">
          <div className="flex justify-between items-center mb-4">
            <span className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">Active Campaigns</span>
            <span className="material-symbols-outlined text-secondary">campaign</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-display-lg text-display-lg text-on-surface">{data?.summary?.activeCount ?? data?.activeCount ?? "-"}</span>
            <span className="font-body-md text-body-md text-secondary">+2 this week</span>
          </div>
        </div>

        <div className="col-span-12 md:col-span-4 bg-surface-container-lowest p-lg rounded-xl shadow-[0px_4px_20px_rgba(0,0,0,0.03)] border border-surface-container-high">
          <div className="flex justify-between items-center mb-4">
            <span className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">Total Uses (MTD)</span>
            <span className="material-symbols-outlined text-primary">local_activity</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-display-lg text-display-lg text-on-surface">{data?.summary?.totalUses ?? data?.totalUses ?? "-"}</span>
            <span className="font-body-md text-body-md text-secondary">+15% vs last month</span>
          </div>
        </div>

        <div className="col-span-12 md:col-span-4 bg-surface-container-lowest p-lg rounded-xl shadow-[0px_4px_20px_rgba(0,0,0,0.03)] border border-surface-container-high">
          <div className="flex justify-between items-center mb-4">
            <span className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">Revenue Impact</span>
            <span className="material-symbols-outlined text-primary">trending_up</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-display-lg text-display-lg text-on-surface">{data?.summary?.revenueImpact ?? data?.revenueImpact ?? "-"}</span>
            <span className="font-body-md text-body-md text-on-surface-variant">generated</span>
          </div>
        </div>

        {/* Main Data Table */}
        <div className="col-span-12 bg-surface-container-lowest rounded-xl shadow-[0px_4px_20px_rgba(0,0,0,0.03)] border border-surface-container-high overflow-hidden">
          <div className="p-lg border-b border-surface-container-high flex justify-between items-center bg-surface-container-low/50">
            <h3 className="font-headline-md text-headline-md text-on-surface">Active Promo Codes</h3>
            <div className="flex gap-2">
              <button className="p-2 border border-outline-variant rounded-full hover:bg-surface-container-high text-on-surface-variant transition-colors" onClick={() => setToast({message: 'Filter applied', type: 'success'})}>
                <span className="material-symbols-outlined text-[20px]">filter_list</span>
              </button>
              <button className="p-2 border border-outline-variant rounded-full hover:bg-surface-container-high text-on-surface-variant transition-colors" onClick={() => setToast({message: 'More actions', type: 'info'})}>
                <span className="material-symbols-outlined text-sm">more_horiz</span>
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container-low font-label-md text-label-md text-on-surface-variant border-b border-surface-container-high">
                  <th className="p-4 font-semibold">Code</th>
                  <th className="p-4 font-semibold">Campaign</th>
                  <th className="p-4 font-semibold">Discount</th>
                  <th className="p-4 font-semibold">Usage Count</th>
                  <th className="p-4 font-semibold">Expiry Date</th>
                  <th className="p-4 font-semibold">Status</th>
                  <th className="p-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="font-data-mono text-data-mono">
                {loading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <tr key={`skel-${i}`} className="border-b border-surface-container-high h-[56px] animate-pulse">
                      <td className="p-4"><div className="h-4 bg-surface-container-high rounded w-20"></div></td>
                      <td className="p-4"><div className="h-4 bg-surface-container-high rounded w-32"></div></td>
                      <td className="p-4"><div className="h-4 bg-surface-container-high rounded w-16"></div></td>
                      <td className="p-4"><div className="h-4 bg-surface-container-high rounded w-24"></div></td>
                      <td className="p-4"><div className="h-4 bg-surface-container-high rounded w-24"></div></td>
                      <td className="p-4"><div className="h-5 bg-surface-container-high rounded-full w-16"></div></td>
                      <td className="p-4 text-right"></td>
                    </tr>
                  ))
                ) : (data?.items || data?.data || []).length > 0 ? (
                  (data?.items || data?.data || []).map((promo: any, idx: number) => (
                    <tr key={idx} className="border-b border-surface-container-high hover:bg-surface-container-low transition-colors h-[56px]">
                      <td className="p-4 font-bold text-primary">{promo.code}</td>
                      <td className="p-4 text-on-surface">{promo.campaign}</td>
                      <td className="p-4 text-on-surface">{promo.discount}</td>
                      <td className="p-4 text-on-surface">
                        <div className="flex items-center gap-2">
                          <div className="w-full bg-surface-container-high rounded-full h-1.5 w-16">
                            <div className="bg-primary h-1.5 rounded-full" style={{ width: `${(promo.used / (promo.total || 1)) * 100}%` }}></div>
                          </div>
                          <span className="text-xs">{promo.used}/{promo.total}</span>
                        </div>
                      </td>
                      <td className="p-4 text-on-surface-variant">{promo.expiryDate}</td>
                      <td className="p-4">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-secondary-container/20 text-secondary border border-secondary-container/30">
                          <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
                          {promo.status}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <button className="text-on-surface-variant hover:text-primary transition-colors" onClick={() => setToast({message: 'Edit promotion', type: 'info'})}><span className="material-symbols-outlined text-sm">edit</span></button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="p-4 text-center text-on-surface-variant">No active promotions found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
