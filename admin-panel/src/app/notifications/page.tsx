"use client";
import React, { useEffect, useState } from 'react';
import axios from 'axios';

import Toast from '@/components/Toast';

export default function NotificationsCenter() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [audience, setAudience] = useState('All Active Users (Hosts & Guests)');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [toast, setToast] = useState<{message: string, type: 'success'|'error'|'info'} | null>(null);

  const handleDispatch = async () => {
    try {
      await axios.post('/api/v1/admin/broadcasts', { audience, title, message });
      setToast({message: 'Broadcast dispatched successfully!', type: 'success'});
    } catch (error) {
      console.error(error);
      setToast({message: 'Failed to dispatch broadcast.', type: 'error'});
    }
  };

  const handleSaveDraft = () => {
    setToast({message: 'Draft saved successfully!', type: 'success'});
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get('/api/v1/admin/broadcasts');
        setData(response.data);
      } catch (error) {
        console.error("Error fetching broadcast data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="flex-1 p-gutter max-w-[1440px] mx-auto w-full flex flex-col space-y-gutter relative">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-md">
        <div>
          <h2 className="font-display-lg text-display-lg text-on-surface">Broadcast Operations</h2>
          <p className="font-body-lg text-body-lg text-on-surface-variant mt-xs">Manage global communications across Push, SMS, and Email channels.</p>
        </div>
      </div>
      {/* Bento Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter">
        {/* Create Notification Panel (7 columns) */}
        <div className="lg:col-span-7 glass-card rounded-xl p-xl flex flex-col">
          <div className="flex items-center mb-lg">
            <span className="material-symbols-outlined text-primary text-2xl mr-sm">campaign</span>
            <h3 className="font-headline-md text-headline-md text-on-surface">Create New Broadcast</h3>
          </div>
          <form className="flex flex-col flex-1 space-y-lg">
            {/* Channel Selection */}
            <div className="space-y-sm">
              <label className="font-label-md text-label-md text-on-surface-variant uppercase">Delivery Channels</label>
              <div className="flex flex-wrap gap-sm">
                <label className="flex items-center px-md py-sm border border-primary rounded-lg bg-primary-container/5 cursor-pointer hover:bg-primary-container/10 transition-colors">
                  <input defaultChecked className="text-primary focus:ring-primary mr-sm rounded" type="checkbox" />
                  <span className="material-symbols-outlined text-primary mr-xs text-sm">notifications_active</span>
                  <span className="font-label-md text-label-md text-primary">Push Notification</span>
                </label>
                <label className="flex items-center px-md py-sm border border-outline-variant rounded-lg bg-surface-container-lowest cursor-pointer hover:bg-surface-container transition-colors">
                  <input className="text-primary focus:ring-primary mr-sm rounded" type="checkbox" />
                  <span className="material-symbols-outlined text-on-surface-variant mr-xs text-sm">sms</span>
                  <span className="font-label-md text-label-md text-on-surface">SMS Message</span>
                </label>
                <label className="flex items-center px-md py-sm border border-outline-variant rounded-lg bg-surface-container-lowest cursor-pointer hover:bg-surface-container transition-colors">
                  <input className="text-primary focus:ring-primary mr-sm rounded" type="checkbox" />
                  <span className="material-symbols-outlined text-on-surface-variant mr-xs text-sm">mail</span>
                  <span className="font-label-md text-label-md text-on-surface">Email Newsletter</span>
                </label>
              </div>
            </div>
            {/* Audience Segment */}
            <div className="space-y-sm">
              <label className="font-label-md text-label-md text-on-surface-variant uppercase">Target Audience</label>
              <div className="input-glow border border-outline-variant rounded-lg bg-surface-container-lowest flex items-center px-md py-sm">
                <span className="material-symbols-outlined text-outline mr-sm">group_add</span>
                <select className="w-full bg-transparent border-none focus:ring-0 text-body-md font-body-md text-on-surface p-0 cursor-pointer" value={audience} onChange={e => setAudience(e.target.value)}>
                  <option>All Active Users (Hosts & Guests)</option>
                  <option>Premium Hosts Only</option>
                  <option>Users in North America</option>
                  <option>Custom Segment (Requires CSV)</option>
                </select>
              </div>
            </div>
            {/* Content Input */}
            <div className="space-y-sm flex-1">
              <label className="font-label-md text-label-md text-on-surface-variant uppercase">Message Content</label>
              <div className="input-glow border border-outline-variant rounded-lg bg-surface-container-lowest flex flex-col p-md h-full min-h-[160px]">
                <input className="w-full bg-transparent border-b border-outline-variant focus:border-primary focus:ring-0 text-headline-md font-headline-md text-on-surface placeholder-outline-variant pb-sm mb-sm p-0" placeholder="Message Title" type="text" value={title} onChange={e => setTitle(e.target.value)} />
                <textarea className="w-full bg-transparent border-none focus:ring-0 text-body-md font-body-md text-on-surface placeholder-outline-variant p-0 resize-none flex-1" placeholder="Type your message here... keep it concise for Push/SMS." value={message} onChange={e => setMessage(e.target.value)}></textarea>
                <div className="flex justify-between items-center mt-sm text-outline font-data-mono text-data-mono">
                  <span>Variables: {'{user_name}'}, {'{property_name}'}</span>
                  <span>{message.length} / 140 chars</span>
                </div>
              </div>
            </div>
            {/* Actions */}
            <div className="flex justify-end gap-md pt-md border-t border-outline-variant">
              <button className="px-xl py-sm rounded-lg font-label-md text-label-md text-on-surface border border-outline-variant hover:bg-surface-container transition-colors" type="button" onClick={handleSaveDraft}>
                Save Draft
              </button>
              <button className="px-xl py-sm rounded-lg font-label-md text-label-md bg-primary text-on-primary hover:bg-primary-container hover:text-on-primary-container transition-colors shadow-sm flex items-center" type="button" onClick={handleDispatch}>
                <span className="material-symbols-outlined mr-xs text-sm">send</span>
                Dispatch Now
              </button>
            </div>
          </form>
        </div>
        {/* Right Column: Stats & Log (5 columns) */}
        <div className="lg:col-span-5 flex flex-col gap-gutter">
          {/* KPI Widget */}
          <div className="glass-card rounded-xl p-lg relative overflow-hidden">
            <div className="relative z-10">
              <h4 className="font-label-md text-label-md text-on-surface-variant uppercase mb-sm">Today's Delivery Rate</h4>
              <div className="flex items-end gap-md">
                <span className="font-display-lg text-display-lg text-on-surface">{data?.summary?.deliveryRate ?? "98.4%"}</span>
                <span className="flex items-center text-secondary font-label-md text-label-md bg-secondary-container/30 px-xs py-base rounded mb-sm">
                  <span className="material-symbols-outlined text-sm mr-base">trending_up</span>
                  {data?.summary?.deliveryTrend ?? "+1.2%"}
                </span>
              </div>
              <p className="font-body-md text-body-md text-outline mt-xs">Across {data?.summary?.dispatchedCount ?? "142k"} dispatched messages</p>
            </div>
            {/* Abstract decorative graphic for KPI background */}
            <div className="absolute -bottom-4 -right-4 w-32 h-32 bg-secondary-container/20 rounded-full blur-2xl"></div>
            <div className="absolute -top-4 -right-12 w-24 h-24 bg-primary-container/10 rounded-full blur-xl"></div>
          </div>
          {/* Recent Broadcasts Log */}
          <div className="glass-card rounded-xl p-lg flex-1 flex flex-col">
            <div className="flex justify-between items-center mb-md border-b border-outline-variant pb-sm">
              <h3 className="font-headline-md text-headline-md text-on-surface">Recent Broadcasts</h3>
              <button className="text-primary hover:text-primary-container transition-colors" onClick={() => setIsFilterOpen(true)}>
                <span className="material-symbols-outlined">filter_list</span>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto space-y-sm pr-xs">
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="p-md rounded-lg border border-outline-variant bg-surface-container-lowest animate-pulse h-[100px]"></div>
                ))
              ) : (data?.logs || data?.data || []).length > 0 ? (
                (data?.logs || data?.data || []).map((log: any, i: number) => (
                  <div key={i} className={`p-md rounded-lg border ${log.status === 'Failed' ? 'border-error/30 bg-error-container/10 hover:bg-error-container/20' : 'border-outline-variant bg-surface-container-lowest hover:bg-surface-container'} transition-colors cursor-default`}>
                    <div className="flex justify-between items-start mb-xs">
                      <span className={`font-label-md text-label-md font-bold ${log.status === 'Failed' ? 'text-error' : 'text-on-surface'}`}>{log.title}</span>
                      <span className="font-data-mono text-data-mono text-outline text-xs">{log.time || log.date}</span>
                    </div>
                    <p className="font-body-md text-body-md text-on-surface-variant truncate mb-sm">{log.message || log.description}</p>
                    <div className="flex justify-between items-center">
                      <div className="flex gap-xs">
                        <span className="px-2 py-1 rounded bg-surface-container-high text-on-surface-variant font-label-md text-[10px] uppercase flex items-center"><span className="material-symbols-outlined text-[12px] mr-base">{log.channel === 'Email' ? 'mail' : log.channel === 'Push' ? 'notifications_active' : 'sms'}</span> {log.channel || 'System'}</span>
                        <span className={`px-2 py-1 rounded font-label-md text-[10px] uppercase ${log.status === 'Failed' ? 'bg-error/10 text-error' : 'bg-secondary-container/30 text-secondary'}`}>{log.status || 'Sent'}</span>
                      </div>
                      <span className={`font-data-mono text-data-mono text-sm ${log.status === 'Failed' ? 'text-error' : 'text-on-surface'}`}>{log.deliveredCount ? `${log.deliveredCount} delivered` : (log.status === 'Failed' ? 'Gateway Timeout' : '-')}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center p-md text-on-surface-variant">No recent broadcasts found.</div>
              )}
            </div>
            <div className="mt-sm pt-sm border-t border-outline-variant text-center">
              <button className="font-label-md text-label-md text-primary hover:underline" onClick={() => setToast({message: 'View Full Logs clicked', type: 'info'})}>View Full Logs</button>
            </div>
          </div>
        </div>
      </div>
      {/* Side Drawer Filter */}
      <div className={`fixed inset-y-0 right-0 w-80 z-50 bg-surface shadow-2xl transition-transform transform ${isFilterOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="p-4 border-b border-outline-variant flex justify-between items-center">
          <h2 className="font-headline-sm font-semibold text-on-surface">Filter Broadcasts</h2>
          <button onClick={() => setIsFilterOpen(false)} className="material-symbols-outlined text-on-surface-variant hover:text-on-surface">close</button>
        </div>
        <div className="p-4 flex flex-col gap-4">
          <div>
            <label className="block text-sm mb-1 text-on-surface">Channel</label>
            <div className="flex flex-col gap-2">
              <label className="flex items-center gap-2"><input type="checkbox" className="rounded text-primary focus:ring-primary" /> Push Notification</label>
              <label className="flex items-center gap-2"><input type="checkbox" className="rounded text-primary focus:ring-primary" /> SMS</label>
              <label className="flex items-center gap-2"><input type="checkbox" className="rounded text-primary focus:ring-primary" /> Email</label>
            </div>
          </div>
          <div>
            <label className="block text-sm mb-1 text-on-surface">Status</label>
            <select className="w-full p-2 border border-outline-variant rounded bg-surface text-on-surface">
              <option>All Statuses</option>
              <option>Sent</option>
              <option>Failed</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}
