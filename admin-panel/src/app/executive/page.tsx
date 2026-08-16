"use client";

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Link from 'next/link';

export default function ExecutivePage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get('/api/v1/admin/analytics/overview')
      .then(res => setData(res.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <main className="flex-1 flex flex-col min-w-0 bg-background">
        {/* Dashboard Content */}
        <div className="flex-1 p-gutter max-w-[1440px] mx-auto w-full space-y-xl overflow-y-auto">
          {/* Hero Header */}
          <section className="flex flex-col md:flex-row md:items-end justify-between gap-md">
            <div>
              <h2 className="font-display-lg text-display-lg text-on-surface">Overview</h2>
              <p className="font-body-lg text-body-lg text-on-surface-variant mt-xs">Here is what's happening across your properties today.</p>
            </div>
            <div className="flex items-center gap-sm">
              <div className="flex items-center bg-surface-container-lowest px-sm py-xs rounded-lg border border-outline-variant shadow-sm">
                <span className="material-symbols-outlined text-on-surface-variant mr-xs text-[18px]">calendar_today</span>
                <span className="font-data-mono text-data-mono text-on-surface">Oct 24 - Oct 30</span>
              </div>
            </div>
          </section>

          {/* Metrics Grid */}
          <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-md">
            {/* Total Revenue */}
            <div className="bg-surface-container-lowest rounded-xl p-lg border border-outline-variant/30 shadow-[0px_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0px_6px_24px_rgba(0,0,0,0.06)] hover:-translate-y-[1px] transition-all relative overflow-hidden group">
              <div className="absolute -right-6 -top-6 w-24 h-24 bg-primary-container/20 rounded-full blur-2xl group-hover:bg-primary-container/30 transition-colors"></div>
              <div className="flex justify-between items-start mb-sm">
                <span className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">Total Revenue</span>
                <span className="material-symbols-outlined text-primary bg-primary-container/30 p-1.5 rounded-lg">payments</span>
              </div>
              <div className="font-headline-lg text-headline-lg text-on-surface">
                {loading ? <div className="h-8 bg-surface-container-high rounded w-24 animate-pulse"></div> : (data?.totalRevenue ? `$${data.totalRevenue.toLocaleString()}` : "-")}
              </div>
              <div className="mt-xs flex items-center gap-1 font-label-md text-label-md">
                <span className="material-symbols-outlined text-secondary text-[16px]">trending_up</span>
                <span className="text-secondary">+12.5%</span>
                <span className="text-outline">vs last month</span>
              </div>
            </div>

            {/* Active Bookings */}
            <div className="bg-surface-container-lowest rounded-xl p-lg border border-outline-variant/30 shadow-[0px_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0px_6px_24px_rgba(0,0,0,0.06)] hover:-translate-y-[1px] transition-all relative overflow-hidden group">
              <div className="absolute -right-6 -top-6 w-24 h-24 bg-secondary-container/20 rounded-full blur-2xl group-hover:bg-secondary-container/30 transition-colors"></div>
              <div className="flex justify-between items-start mb-sm">
                <span className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">Active Bookings</span>
                <span className="material-symbols-outlined text-secondary bg-secondary-container/30 p-1.5 rounded-lg">key</span>
              </div>
              <div className="font-headline-lg text-headline-lg text-on-surface">
                {loading ? <div className="h-8 bg-surface-container-high rounded w-24 animate-pulse"></div> : (data?.activeBookings?.toLocaleString() ?? "-")}
              </div>
              <div className="mt-xs flex items-center gap-1 font-label-md text-label-md">
                <span className="material-symbols-outlined text-secondary text-[16px]">trending_up</span>
                <span className="text-secondary">+5.2%</span>
                <span className="text-outline">vs last month</span>
              </div>
            </div>

            {/* New Properties */}
            <div className="bg-surface-container-lowest rounded-xl p-lg border border-outline-variant/30 shadow-[0px_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0px_6px_24px_rgba(0,0,0,0.06)] hover:-translate-y-[1px] transition-all relative overflow-hidden group">
              <div className="absolute -right-6 -top-6 w-24 h-24 bg-tertiary-container/10 rounded-full blur-2xl group-hover:bg-tertiary-container/20 transition-colors"></div>
              <div className="flex justify-between items-start mb-sm">
                <span className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">New Properties</span>
                <span className="material-symbols-outlined text-tertiary bg-tertiary-container/20 p-1.5 rounded-lg">add_home</span>
              </div>
              <div className="font-headline-lg text-headline-lg text-on-surface">
                {loading ? <div className="h-8 bg-surface-container-high rounded w-24 animate-pulse"></div> : (data?.newProperties?.toLocaleString() ?? "-")}
              </div>
              <div className="mt-xs flex items-center gap-1 font-label-md text-label-md">
                <span className="material-symbols-outlined text-error text-[16px]">trending_down</span>
                <span className="text-error">-2.1%</span>
                <span className="text-outline">vs last month</span>
              </div>
            </div>

            {/* System Health */}
            <div className="bg-surface-container-lowest rounded-xl p-lg border border-outline-variant/30 shadow-[0px_4px_20px_rgba(0,0,0,0.03)] flex flex-col justify-between">
              <div className="flex justify-between items-start mb-sm">
                <span className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">System Health</span>
                <span className="relative flex h-3 w-3 mt-1">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-secondary opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-secondary"></span>
                </span>
              </div>
              <div>
                {loading ? (
                  <div className="h-8 bg-surface-container-high rounded w-24 animate-pulse mb-1"></div>
                ) : (
                  <div className="font-headline-lg text-headline-lg text-on-surface">{data?.systemHealth ?? "-"}</div>
                )}
                <div className="mt-xs font-label-md text-label-md text-outline">All services operational</div>
              </div>
            </div>
          </section>

          {/* Main Workspace Grid */}
          <section className="grid grid-cols-1 xl:grid-cols-12 gap-lg">
            {/* Platform Activity Chart */}
            <div className="xl:col-span-7 bg-surface-container-lowest rounded-xl border border-outline-variant/30 shadow-[0px_4px_20px_rgba(0,0,0,0.03)] flex flex-col">
              <div className="p-lg border-b border-surface-container-low flex justify-between items-center">
                <h3 className="font-headline-md text-headline-md text-on-surface">Platform Activity</h3>
              </div>
              <div className="p-lg flex-1 min-h-[300px] flex flex-col justify-end relative">
                {/* Abstract Chart Representation using standard divs */}
                <div className="absolute inset-0 p-lg flex items-end gap-2 pb-12 pt-8">
                  {loading ? (
                    <div className="w-full flex items-center justify-center text-outline h-full">
                       <div className="animate-pulse w-full h-full bg-surface-container-high rounded-t-sm"></div>
                    </div>
                  ) : data?.chartData?.length ? (
                    data.chartData.map((val: any, idx: number) => (
                      <div key={idx} className="w-full bg-primary/60 rounded-t-sm hover:bg-primary/80 transition-colors relative group" style={{ height: `${val}%` }}></div>
                    ))
                  ) : (
                    <div className="w-full flex items-center justify-center text-outline h-full">No chart data</div>
                  )}
                </div>
                {/* Axis lines */}
                <div className="absolute bottom-10 left-lg right-lg h-px bg-outline-variant/30"></div>
                <div className="absolute bottom-24 left-lg right-lg h-px bg-outline-variant/30 border-dashed border-b"></div>
                <div className="absolute top-10 left-lg right-lg h-px bg-outline-variant/30 border-dashed border-b"></div>
                {/* X Axis Labels */}
                <div className="flex justify-between w-full mt-auto pt-2 text-outline font-label-md text-label-md z-10">
                  <span className="">Mon</span><span className="">Tue</span><span className="">Wed</span><span className="">Thu</span><span className="">Fri</span><span className="">Sat</span><span className="">Sun</span>
                </div>
              </div>
            </div>

            {/* Recent Bookings Table */}
            <div className="xl:col-span-5 bg-surface-container-lowest rounded-xl border border-outline-variant/30 shadow-[0px_4px_20px_rgba(0,0,0,0.03)] flex flex-col">
              <div className="p-lg border-b border-surface-container-low flex justify-between items-center">
                <h3 className="font-headline-md text-headline-md text-on-surface">Recent Activity</h3>
                <Link href="/bookings" className="font-label-md text-label-md text-primary hover:underline">View All</Link>
              </div>
              <div className="flex-1 overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-surface-container-low/50">
                      <th className="py-sm px-md font-label-md text-label-md text-on-surface-variant font-medium border-b border-outline-variant/30">Status</th>
                      <th className="py-sm px-md font-label-md text-label-md text-on-surface-variant font-medium border-b border-outline-variant/30">Property / Guest</th>
                      <th className="py-sm px-md font-label-md text-label-md text-on-surface-variant font-medium border-b border-outline-variant/30 text-right">Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      Array.from({ length: 3 }).map((_, i) => (
                        <tr key={i} className="border-b border-surface-container-low h-[56px] animate-pulse">
                           <td className="py-xs px-md"><div className="h-6 bg-surface-container-high rounded w-24"></div></td>
                           <td className="py-xs px-md"><div className="h-6 bg-surface-container-high rounded w-32"></div></td>
                           <td className="py-xs px-md"><div className="h-6 bg-surface-container-high rounded w-16 ml-auto"></div></td>
                        </tr>
                      ))
                    ) : !data?.recentActivity?.length ? (
                      <tr>
                        <td colSpan={3} className="text-center py-md text-on-surface-variant font-label-md">No data available</td>
                      </tr>
                    ) : (
                      data.recentActivity.map((activity: any, idx: number) => (
                        <tr key={idx} className="border-b border-surface-container-low hover:bg-surface-container-lowest transition-colors h-[56px] group">
                          <td className="py-xs px-md align-middle">
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-secondary-container/20 text-on-secondary-container font-label-md text-label-md">
                              <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span> {activity.status || "Confirmed"}
                            </span>
                          </td>
                          <td className="py-xs px-md align-middle">
                            <div className="font-body-md text-body-md text-on-surface font-medium">{activity.property || "-"}</div>
                            <div className="font-label-md text-label-md text-outline">{activity.guest || "-"}</div>
                          </td>
                          <td className="py-xs px-md align-middle text-right font-data-mono text-data-mono text-on-surface group-hover:text-primary transition-colors">{activity.value || "-"}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        </div>
      </main>
    </>
  );
}
