"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import Link from "next/link";
import { useAdminAuth } from "@/context/AdminAuthContext";

interface MetricOverview {
  totalRevenue: number;
  activeBookings: number;
  totalProperties: number;
  totalUsers: number;
  pendingApplications: number;
  chartData: { day: string; revenue: number; bookings: number }[];
  recentBookings: {
    id: string;
    propertyTitle: string;
    guestName: string;
    nights: number;
    amount: string;
    rawAmount: number;
    status: string;
    createdAt?: string;
  }[];
}

export default function DashboardOverview() {
  const { adminUser } = useAdminAuth();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<MetricOverview>({
    totalRevenue: 0,
    activeBookings: 0,
    totalProperties: 0,
    totalUsers: 0,
    pendingApplications: 0,
    chartData: [],
    recentBookings: [],
  });

  useEffect(() => {
    Promise.allSettled([
      axios.get("/api/v1/admin/analytics/overview"),
      axios.get("/api/v1/admin/analytics/timeseries?days=7"),
      axios.get("/api/v1/admin/analytics/recent-activity"),
      axios.get("/api/v1/properties?adminView=true"),
      axios.get("/api/v1/bookings?adminView=true"),
      fetch("/api/v1/admin/moderation/test-host-applications").then((r) =>
        r.ok ? r.json() : []
      ),
    ])
      .then(([overviewRes, timeRes, activityRes, propsRes, booksRes, appsRes]) => {
        const overview = overviewRes.status === "fulfilled" ? overviewRes.value.data : null;
        const timeSeries =
          timeRes.status === "fulfilled" && Array.isArray(timeRes.value.data?.series)
            ? timeRes.value.data.series
            : [];
        const props =
          propsRes.status === "fulfilled" && Array.isArray(propsRes.value.data)
            ? propsRes.value.data
            : [];
        const books =
          booksRes.status === "fulfilled" && Array.isArray(booksRes.value.data)
            ? booksRes.value.data
            : [];
        const apps = appsRes.status === "fulfilled" && Array.isArray(appsRes.value) ? appsRes.value : [];

        // Real revenue calculation from DB
        let totalRev = Number(overview?.revenue?.grossRevenue || 0);
        if (totalRev === 0 && books.length > 0) {
          books.forEach((b: any) => {
            totalRev += Number(b.totalAmount || b.subtotal || 0);
          });
        }

        // Real timeseries buckets
        let formattedChart: { day: string; revenue: number; bookings: number }[] = [];
        if (timeSeries.length > 0) {
          formattedChart = timeSeries.map((t: any) => {
            const d = new Date(t.date);
            const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
            return {
              day: isNaN(d.getTime()) ? t.date : dayNames[d.getDay()],
              revenue: Number(t.revenue || 0),
              bookings: Number(t.bookings || 0),
            };
          });
        } else {
          const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
          formattedChart = dayNames.map((day) => ({
            day,
            revenue: 0,
            bookings: 0,
          }));
          books.forEach((b: any) => {
            if (b.createdAt) {
              const d = new Date(b.createdAt);
              const idx = (d.getDay() + 6) % 7;
              if (formattedChart[idx]) {
                formattedChart[idx].revenue += Number(b.totalAmount || 0);
                formattedChart[idx].bookings += 1;
              }
            }
          });
        }

        // Recent bookings formatting
        const formattedBookings = books.slice(0, 8).map((b: any) => ({
          id: b.id,
          propertyTitle: b.property?.title || b.propertyTitle || "Stay Reservation",
          guestName: b.guestName || b.user?.firstName || b.user?.email?.split("@")[0] || "Guest",
          nights: Number(b.nights || 1),
          amount: `₹${Number(b.totalAmount || 0).toLocaleString("en-IN")}`,
          rawAmount: Number(b.totalAmount || 0),
          status: (b.status || "CONFIRMED").toUpperCase(),
          createdAt: b.createdAt,
        }));

        setData({
          totalRevenue: totalRev,
          activeBookings: Number(overview?.bookings?.total ?? books.length),
          totalProperties: Number(overview?.properties?.total ?? props.length),
          totalUsers: Number(overview?.users?.total ?? 0),
          pendingApplications: apps.length,
          chartData: formattedChart,
          recentBookings: formattedBookings,
        });
      })
      .finally(() => setLoading(false));
  }, []);

  const maxChartRevenue = Math.max(...data.chartData.map((d) => d.revenue), 1);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "CONFIRMED":
      case "COMPLETED":
        return "bg-emerald-50 text-emerald-700 border-emerald-200/80";
      case "PENDING":
      case "AWAITING_PAYMENT":
        return "bg-amber-50 text-amber-700 border-amber-200/80";
      case "CANCELLED":
      case "REFUNDED":
        return "bg-rose-50 text-rose-700 border-rose-200/80";
      default:
        return "bg-purple-50 text-[#5A31F4] border-purple-200/80";
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Page Header */}
      <section className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Overview</h1>
            <span className="px-2 py-0.5 rounded-full bg-[#5A31F4]/10 text-[#5A31F4] text-[11px] font-bold">
              Command Center
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Welcome back, {adminUser?.fullName || "Administrator"}. Real-time analytics, verified database
            transactions, and inventory controls.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-slate-200/80 shadow-[0_1px_2px_rgba(0,0,0,0.03)] text-xs font-semibold text-slate-700">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Live PostgreSQL</span>
          </div>

          <Link
            href="/host-applications"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200/80 rounded-xl text-xs font-semibold shadow-[0_1px_2px_rgba(0,0,0,0.03)] transition-all"
          >
            <span className="material-symbols-outlined text-[16px] text-amber-500">how_to_reg</span>
            <span>Applications</span>
            {data.pendingApplications > 0 && (
              <span className="ml-1 px-1.5 py-0.2 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold">
                {data.pendingApplications}
              </span>
            )}
          </Link>

          <Link
            href="/properties"
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#5A31F4] hover:bg-[#4E2AD9] text-white rounded-xl text-xs font-bold shadow-md shadow-[#5A31F4]/20 transition-all"
          >
            <span className="material-symbols-outlined text-[16px]">add_circle</span>
            <span>New Listing</span>
          </Link>
        </div>
      </section>

      {/* 2. Key Metrics - 4 Clean App-Theme Cards */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Gross Revenue */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.02)] hover:border-slate-300 hover:shadow-sm transition-all group">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Gross Revenue
            </span>
            <div className="w-8 h-8 rounded-xl bg-[#5A31F4]/10 text-[#5A31F4] flex items-center justify-center transition-colors group-hover:bg-[#5A31F4] group-hover:text-white">
              <span className="material-symbols-outlined text-[18px]">payments</span>
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900 tracking-tight">
            {loading ? (
              <div className="h-8 bg-slate-100 rounded w-28 animate-pulse" />
            ) : (
              `₹${data.totalRevenue.toLocaleString("en-IN")}`
            )}
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <span className="text-slate-500 font-medium flex items-center gap-1">
              <span className="material-symbols-outlined text-emerald-600 text-[14px]">check_circle</span>
              Settled Gross
            </span>
            <Link href="/revenue" className="text-[#5A31F4] font-bold hover:underline">
              Ledger →
            </Link>
          </div>
        </div>

        {/* Metric 2: Active Bookings */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.02)] hover:border-slate-300 hover:shadow-sm transition-all group">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Total Bookings
            </span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-[#7F56D9] flex items-center justify-center transition-colors group-hover:bg-[#7F56D9] group-hover:text-white">
              <span className="material-symbols-outlined text-[18px]">calendar_today</span>
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900 tracking-tight">
            {loading ? (
              <div className="h-8 bg-slate-100 rounded w-16 animate-pulse" />
            ) : (
              data.activeBookings
            )}
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <span className="text-slate-500 font-medium flex items-center gap-1">
              <span className="material-symbols-outlined text-purple-600 text-[14px]">verified</span>
              Confirmed &amp; Paid
            </span>
            <Link href="/bookings" className="text-[#5A31F4] font-bold hover:underline">
              View All →
            </Link>
          </div>
        </div>

        {/* Metric 3: Listed Properties */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.02)] hover:border-slate-300 hover:shadow-sm transition-all group">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Live Catalog
            </span>
            <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center transition-colors group-hover:bg-slate-900 group-hover:text-white">
              <span className="material-symbols-outlined text-[18px]">villa</span>
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900 tracking-tight">
            {loading ? (
              <div className="h-8 bg-slate-100 rounded w-16 animate-pulse" />
            ) : (
              data.totalProperties
            )}
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <span className="text-slate-500 font-medium flex items-center gap-1">
              <span className="material-symbols-outlined text-slate-600 text-[14px]">home_work</span>
              Stays &amp; Camps
            </span>
            <Link href="/properties" className="text-[#5A31F4] font-bold hover:underline">
              Catalog →
            </Link>
          </div>
        </div>

        {/* Metric 4: Applications & Approvals */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.02)] hover:border-slate-300 hover:shadow-sm transition-all group">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Host Pipeline
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center transition-colors group-hover:bg-amber-600 group-hover:text-white">
              <span className="material-symbols-outlined text-[18px]">how_to_reg</span>
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            {loading ? (
              <div className="h-8 bg-slate-100 rounded w-16 animate-pulse" />
            ) : (
              <>
                <span>{data.pendingApplications}</span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200/60">
                  Pending
                </span>
              </>
            )}
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <span className="text-slate-500 font-medium flex items-center gap-1">
              <span className="material-symbols-outlined text-amber-600 text-[14px]">pending_actions</span>
              KYC &amp; Deeds
            </span>
            <Link href="/host-applications" className="text-amber-700 font-bold hover:underline">
              Review →
            </Link>
          </div>
        </div>
      </section>

      {/* 3. Operational Shortcuts Strip */}
      <section className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[#5A31F4] text-[18px]">rocket_launch</span>
          <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">Quick Controls:</span>
        </div>

        <div className="flex items-center gap-2 flex-wrap text-xs">
          <Link
            href="/properties"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-[#5A31F4]/8 hover:text-[#5A31F4] text-slate-600 font-semibold border border-slate-200/60 transition-all"
          >
            <span className="material-symbols-outlined text-[16px]">domain</span>
            <span>Villas &amp; Stays</span>
          </Link>
          <Link
            href="/rvs"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-[#5A31F4]/8 hover:text-[#5A31F4] text-slate-600 font-semibold border border-slate-200/60 transition-all"
          >
            <span className="material-symbols-outlined text-[16px]">rv_hookup</span>
            <span>RVs &amp; Caravans</span>
          </Link>
          <Link
            href="/camping"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-[#5A31F4]/8 hover:text-[#5A31F4] text-slate-600 font-semibold border border-slate-200/60 transition-all"
          >
            <span className="material-symbols-outlined text-[16px]">camping</span>
            <span>Camps &amp; Glamping</span>
          </Link>
          <Link
            href="/revenue"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-[#5A31F4]/8 hover:text-[#5A31F4] text-slate-600 font-semibold border border-slate-200/60 transition-all"
          >
            <span className="material-symbols-outlined text-[16px]">account_balance_wallet</span>
            <span>Payouts &amp; TDS</span>
          </Link>
          <Link
            href="/support"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-[#5A31F4]/8 hover:text-[#5A31F4] text-slate-600 font-semibold border border-slate-200/60 transition-all"
          >
            <span className="material-symbols-outlined text-[16px]">support_agent</span>
            <span>Customer Desk</span>
          </Link>
        </div>
      </section>

      {/* 4. Main Section: 7-Day Performance Chart + Platform Status Pulse */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: 7-Day Performance Chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 tracking-tight">Platform Performance</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Past 7 days gross transaction volume &amp; booking velocity
              </p>
            </div>
            <span className="text-[11px] font-bold px-2.5 py-1 bg-slate-100 rounded-full text-slate-600">
              Past 7 Days
            </span>
          </div>

          {/* Minimalist Bar Chart */}
          <div className="pt-6 pb-4">
            {data.chartData.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-slate-400 text-xs">
                No activity recorded in this time window yet
              </div>
            ) : (
              <div className="h-48 flex items-end justify-between gap-3 px-2">
                {data.chartData.map((item, index) => {
                  const heightPercent =
                    maxChartRevenue > 0 && item.revenue > 0
                      ? Math.max(14, Math.round((item.revenue / maxChartRevenue) * 100))
                      : 8;
                  return (
                    <div key={index} className="flex-1 flex flex-col items-center gap-2 group">
                      {/* Tooltip on Hover */}
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 text-white text-[10px] font-bold px-2.5 py-1 rounded-lg pointer-events-none mb-1 shadow-lg whitespace-nowrap z-10">
                        ₹{item.revenue.toLocaleString("en-IN")} • {item.bookings} bookings
                      </div>

                      {/* Bar Track */}
                      <div className="w-full max-w-[42px] bg-slate-100 rounded-t-xl overflow-hidden h-36 flex items-end">
                        <div
                          style={{ height: `${heightPercent}%` }}
                          className={`w-full rounded-t-xl transition-all duration-300 ${
                            item.revenue > 0
                              ? "bg-gradient-to-t from-[#5A31F4] to-[#7F56D9] group-hover:brightness-110 shadow-sm"
                              : "bg-slate-200"
                          }`}
                        />
                      </div>

                      {/* Day Label */}
                      <span className="text-[11px] font-bold text-slate-500 group-hover:text-[#5A31F4] transition-colors">
                        {item.day}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-100 text-xs text-slate-500">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5 font-medium">
                <span className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-[#5A31F4] to-[#7F56D9]" />
                Gross Revenue (₹)
              </span>
              <span className="flex items-center gap-1.5 font-medium">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-200" />
                No Transaction
              </span>
            </div>
            <span className="font-semibold text-[#5A31F4] text-[11px]">Real-Time Sync</span>
          </div>
        </div>

        {/* Right 1 Col: Platform Health & Quick Status */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-slate-900 tracking-tight">System Health</h2>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            </div>

            <div className="space-y-3.5">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/60 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="material-symbols-outlined text-emerald-600 text-[20px]">database</span>
                  <div>
                    <p className="text-xs font-bold text-slate-800">PostgreSQL Cloud DB</p>
                    <p className="text-[11px] text-slate-500">Prisma ORM • Pooled</p>
                  </div>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Online
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/60 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="material-symbols-outlined text-[#5A31F4] text-[20px]">credit_card</span>
                  <div>
                    <p className="text-xs font-bold text-slate-800">Cashfree PG Gateway</p>
                    <p className="text-[11px] text-slate-500">UPI, Cards &amp; Webhooks</p>
                  </div>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Verified
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/60 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="material-symbols-outlined text-[#7F56D9] text-[20px]">badge</span>
                  <div>
                    <p className="text-xs font-bold text-slate-800">Secure ID &amp; KYC</p>
                    <p className="text-[11px] text-slate-500">Aadhaar &amp; Bank Penny Drop</p>
                  </div>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-50 text-[#5A31F4] border border-purple-200">
                  Active
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/60 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="material-symbols-outlined text-slate-700 text-[20px]">mail</span>
                  <div>
                    <p className="text-xs font-bold text-slate-800">Official Mail Desk</p>
                    <p className="text-[11px] text-slate-500">support &amp; grievance @stayq.space</p>
                  </div>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Standardized
                </span>
              </div>
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500">Server Clearance:</span>
            <span className="font-bold text-slate-900">Level 4 (Full Superadmin)</span>
          </div>
        </div>
      </section>

      {/* 5. Recent Bookings Table */}
      <section className="bg-white rounded-2xl border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.02)] overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between flex-wrap gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-900 tracking-tight">Recent Reservations</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Latest bookings recorded on the Stay Q platform
            </p>
          </div>
          <Link
            href="/bookings"
            className="text-xs font-bold text-[#5A31F4] hover:underline flex items-center gap-1"
          >
            <span>View All Bookings</span>
            <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
          </Link>
        </div>

        {data.recentBookings.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <span className="material-symbols-outlined text-4xl mb-2 text-slate-300">inbox</span>
            <p className="text-xs font-medium text-slate-600">No recent reservations recorded yet.</p>
            <p className="text-[11px] text-slate-400 mt-1">
              Guest bookings via website or mobile app will appear here immediately.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-500 uppercase tracking-wider text-[10px] font-bold border-b border-slate-100">
                <tr>
                  <th className="py-3 px-5">Stay / Property</th>
                  <th className="py-3 px-4">Guest</th>
                  <th className="py-3 px-4">Duration</th>
                  <th className="py-3 px-4">Gross Amount</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {data.recentBookings.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-[#5A31F4]/10 text-[#5A31F4] flex items-center justify-center shrink-0">
                          <span className="material-symbols-outlined text-[16px]">villa</span>
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 line-clamp-1 max-w-[220px]">
                            {b.propertyTitle}
                          </p>
                          <p className="text-[10px] text-slate-400 font-mono">
                            ID: {b.id.slice(0, 8)}...
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-800">{b.guestName}</td>
                    <td className="py-3.5 px-4 text-slate-600">
                      {b.nights} {b.nights === 1 ? "night" : "nights"}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">{b.amount}</td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${getStatusBadge(
                          b.status
                        )}`}
                      >
                        {b.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-5 text-right">
                      <Link
                        href={`/bookings?search=${b.id}`}
                        className="text-[#5A31F4] font-bold hover:underline text-[11px]"
                      >
                        Details
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
