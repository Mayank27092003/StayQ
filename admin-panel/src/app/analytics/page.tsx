"use client";
import React, { useEffect, useState } from 'react';
import axios from 'axios';

export default function PlatformAnalytics() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('MTD');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`/api/v1/admin/analytics?period=${period}`);
        setData(response.data);
      } catch (error) {
        console.error("Error fetching analytics data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [period]);

  return (
    <div className="max-w-[1440px] mx-auto space-y-gutter pb-xl p-gutter">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="font-display-lg text-display-lg text-on-surface mb-1">Intelligence Hub</h2>
          <p className="font-body-lg text-body-lg text-on-surface-variant">Real-time performance metrics and portfolio analytics.</p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="bg-surface-container-lowest border border-outline-variant rounded-lg p-1 flex items-center shadow-ambient">
            <button onClick={() => setPeriod('MTD')} className={`px-4 py-1.5 rounded-md font-label-md text-label-md ${period === 'MTD' ? 'bg-surface-container-high text-on-surface' : 'text-on-surface-variant hover:bg-surface-container transition-colors'}`}>MTD</button>
            <button onClick={() => setPeriod('YTD')} className={`px-4 py-1.5 rounded-md font-label-md text-label-md ${period === 'YTD' ? 'bg-surface-container-high text-on-surface' : 'text-on-surface-variant hover:bg-surface-container transition-colors'}`}>YTD</button>
          </div>
          <button onClick={() => alert('Filter clicked')} className="flex items-center px-4 py-2 border border-outline-variant rounded-lg bg-surface-container-lowest font-label-md text-label-md text-on-surface hover:border-primary transition-colors shadow-ambient">
            <span className="material-symbols-outlined mr-2 text-sm">filter_list</span>
            Filter
          </button>
        </div>
      </div>
      {/* KPI Grid (Bento Style) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {loading ? (
            Array.from({length: 4}).map((_, i) => <div key={i} className="h-32 bg-surface-variant rounded-xl animate-pulse"></div>)
        ) : (
            <>
        <div className="bg-surface-container-lowest rounded-xl p-6 shadow-ambient border border-outline-variant relative overflow-hidden group hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-4 relative z-10">
            <div>
              <p className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wide">User Acquisition</p>
              <h3 className="font-headline-lg text-headline-lg text-on-surface mt-1">{data?.userAcquisition ?? '-'}</h3>
            </div>
            <span className="material-symbols-outlined text-secondary bg-secondary-container/30 p-2 rounded-lg">trending_up</span>
          </div>
        </div>
        <div className="bg-surface-container-lowest rounded-xl p-6 shadow-ambient border border-outline-variant relative overflow-hidden group hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-4 relative z-10">
            <div>
              <p className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wide">Active Listings</p>
              <h3 className="font-headline-lg text-headline-lg text-on-surface mt-1">{data?.activeListings ?? '-'}</h3>
            </div>
            <span className="material-symbols-outlined text-primary bg-primary-container/10 p-2 rounded-lg">domain</span>
          </div>
        </div>
        <div className="bg-surface-container-lowest rounded-xl p-6 shadow-ambient border border-outline-variant relative overflow-hidden group hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-4 relative z-10">
            <div>
              <p className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wide">Avg. Occupancy</p>
              <h3 className="font-headline-lg text-headline-lg text-on-surface mt-1">{data?.avgOccupancy ?? '-'}</h3>
            </div>
            <span className="material-symbols-outlined text-on-surface-variant bg-surface-container p-2 rounded-lg">key</span>
          </div>
        </div>
        <div className="bg-primary rounded-xl p-6 shadow-ambient relative overflow-hidden group hover:shadow-md transition-shadow border border-primary-container">
          <div className="relative z-10">
            <p className="font-label-md text-label-md text-primary-fixed-dim uppercase tracking-wide">Gross Revenue ({period})</p>
            <h3 className="font-headline-lg text-headline-lg text-on-primary mt-1 mb-4">{data?.grossRevenue ?? '-'}</h3>
          </div>
        </div>
            </>
        )}
      </div>
      {/* Complex Data Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Main Chart Area */}
        <div className="lg:col-span-8 bg-surface-container-lowest rounded-xl shadow-ambient border border-outline-variant p-6 flex flex-col h-[480px]">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="font-headline-md text-headline-md text-on-surface">Geographic Demand Heatmap</h3>
              <p className="font-body-md text-body-md text-on-surface-variant mt-1">Booking density and average daily rate visualization.</p>
            </div>
          </div>
          {/* Map Visual Placeholder */}
          <div className="flex-1 relative rounded-lg overflow-hidden border border-outline-variant bg-surface-container-low flex items-center justify-center">
            {loading ? <div className="animate-pulse w-full h-full bg-surface-variant"></div> : (
              data?.heatmapUrl ? (
                <div className="absolute inset-0 bg-cover bg-center opacity-60" style={{ backgroundImage: `url('${data.heatmapUrl}')` }}></div>
              ) : (
                <div className="text-on-surface-variant">Map Data Unavailable</div>
              )
            )}
          </div>
        </div>
        {/* Secondary Chart Area */}
        <div className="lg:col-span-4 bg-surface-container-lowest rounded-xl shadow-ambient border border-outline-variant p-6 flex flex-col h-[480px]">
          <div className="mb-6">
            <h3 className="font-headline-md text-headline-md text-on-surface">Category Performance</h3>
          </div>
          <div className="flex-1 flex flex-col justify-end space-y-6 relative">
            {loading ? <div className="animate-pulse w-full h-full bg-surface-variant"></div> : (
               <div className="flex justify-between items-end h-48 z-10 px-4">
                  {(data?.categoryPerformance || []).map((cat: any, i: number) => (
                    <div key={i} className="w-12 bg-primary/20 rounded-t-sm relative group flex flex-col items-center">
                      <div className="absolute bottom-0 w-full bg-primary rounded-t-sm transition-all duration-500 hover:opacity-80" style={{ height: `${cat.height || 0}%` }}></div>
                      <span className="absolute -bottom-8 text-xs">{cat.label ?? '-'}</span>
                    </div>
                  ))}
                  {!(data?.categoryPerformance?.length) && <div className="w-full text-center text-on-surface-variant self-center">No Category Data</div>}
               </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
