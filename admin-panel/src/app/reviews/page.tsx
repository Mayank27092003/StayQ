"use client";
import React, { useEffect, useState } from 'react';
import axios from 'axios';

import Toast from '@/components/Toast';

export default function ReviewsModeration() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("All");
  const [page, setPage] = useState(1);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [toast, setToast] = useState<{message: string, type: 'success'|'error'|'info'} | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get('/api/v1/admin/moderation/reviews');
        setData(response.data);
      } catch (error) {
        console.error("Error fetching reviews:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const reviews = (data?.reviews || data?.data || []).filter((r: any) => filter === "All" || (filter === "Flagged" && r.flagged));
  const ITEMS_PER_PAGE = 5;
  const totalPages = Math.ceil(reviews.length / ITEMS_PER_PAGE) || 1;
  const paginatedReviews = reviews.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const exportCSV = () => {
    if (reviews.length === 0) return;
    const headers = ["ID", "Author", "Rating", "Content", "Date"];
    const rows = reviews.map((r: any) => [
      r.id,
      `"${r.guest?.firstName} ${r.guest?.lastName}"`,
      r.rating,
      `"${(r.content || "").replace(/"/g, '""')}"`,
      new Date(r.createdAt).toLocaleDateString()
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e: any) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `stayq_reviews_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-gutter max-w-[1440px] mx-auto w-full flex-1 space-y-gutter relative">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h2 className="font-display-lg text-display-lg text-on-surface">Review Moderation</h2>
          <p className="text-on-surface-variant font-body-lg text-body-lg mt-1">Monitor guest sentiment and manage host interactions.</p>
        </div>
        <div className="flex gap-3">
          <button className="px-4 py-2 bg-surface-container-lowest border border-outline-variant text-on-surface rounded-lg font-label-md text-label-md hover:bg-surface-container transition-colors flex items-center gap-2" onClick={() => setIsFilterOpen(true)}>
            <span className="material-symbols-outlined text-sm">filter_list</span> Filter
          </button>
          <button onClick={exportCSV} className="px-4 py-2 bg-primary text-on-primary rounded-full font-label-md text-label-md hover:bg-primary-container hover:text-on-primary-container transition-colors shadow-sm">
            Export Data
          </button>
        </div>
      </div>
      {/* KPI Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Positive */}
        <div className="bg-surface-container-lowest p-6 rounded-xl ambient-shadow flex flex-col justify-between border-t-4 border-secondary">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-secondary/10 rounded-lg text-secondary">
              <span className="material-symbols-outlined">sentiment_very_satisfied</span>
            </div>
            <span className="px-2 py-1 bg-secondary/10 text-secondary rounded-full font-label-md text-label-md">{data?.sentiment?.positiveTrend ?? data?.stats?.positiveTrend ?? "-"}</span>
          </div>
          <div>
            <p className="text-on-surface-variant font-body-md text-body-md mb-1">Positive Sentiment</p>
            <p className="font-display-lg text-display-lg text-on-surface">{data?.sentiment?.positive ?? data?.stats?.positiveSentiment ?? "-"}</p>
          </div>
        </div>
        {/* Neutral */}
        <div className="bg-surface-container-lowest p-6 rounded-xl ambient-shadow flex flex-col justify-between border-t-4 border-outline">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-surface-container rounded-lg text-on-surface-variant">
              <span className="material-symbols-outlined">sentiment_neutral</span>
            </div>
            <span className="px-2 py-1 bg-surface-container text-on-surface-variant rounded-full font-label-md text-label-md">{data?.sentiment?.neutralTrend ?? data?.stats?.neutralTrend ?? "-"}</span>
          </div>
          <div>
            <p className="text-on-surface-variant font-body-md text-body-md mb-1">Neutral Sentiment</p>
            <p className="font-display-lg text-display-lg text-on-surface">{data?.sentiment?.neutral ?? data?.stats?.neutralSentiment ?? "-"}</p>
          </div>
        </div>
        {/* Negative */}
        <div className="bg-surface-container-lowest p-6 rounded-xl ambient-shadow flex flex-col justify-between border-t-4 border-error">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-error/10 rounded-lg text-error">
              <span className="material-symbols-outlined">sentiment_dissatisfied</span>
            </div>
            <span className="px-2 py-1 bg-error/10 text-error rounded-full font-label-md text-label-md">{data?.sentiment?.negativeTrend ?? data?.stats?.negativeTrend ?? "-"}</span>
          </div>
          <div>
            <p className="text-on-surface-variant font-body-md text-body-md mb-1">Negative Sentiment</p>
            <p className="font-display-lg text-display-lg text-on-surface">{data?.sentiment?.negative ?? data?.stats?.negativeSentiment ?? "-"}</p>
          </div>
        </div>
      </div>
      {/* Reviews List Section */}
      <div className="bg-surface-container-lowest rounded-xl ambient-shadow overflow-hidden">
        <div className="p-6 border-b border-surface-container flex justify-between items-center">
          <h3 className="font-headline-md text-headline-md text-on-surface">Recent Reviews</h3>
          <div className="flex space-x-2">
            <button onClick={() => {setFilter("All"); setPage(1);}} className={`px-3 py-1 rounded-full font-label-md text-label-md transition-colors ${filter === "All" ? "bg-surface-variant text-on-surface" : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high"}`}>All</button>
            <button onClick={() => {setFilter("Flagged"); setPage(1);}} className={`px-3 py-1 rounded-full font-label-md text-label-md border transition-colors ${filter === "Flagged" ? "bg-error text-on-error border-error" : "bg-error/10 text-error border-error/20 hover:bg-error/20"}`}>Flagged ({data?.flaggedCount ?? "-"})</button>
          </div>
        </div>
        <div className="divide-y divide-surface-container">
          {loading ? (
            Array.from({length: 2}).map((_, i) => (
              <div key={i} className="p-6 animate-pulse">
                <div className="h-20 bg-surface-variant rounded-lg w-full mb-4"></div>
                <div className="h-10 bg-surface-variant rounded-lg w-3/4"></div>
              </div>
            ))
          ) : paginatedReviews.length === 0 ? (
            <div className="p-8 text-center text-on-surface-variant">No reviews found.</div>
          ) : (
            paginatedReviews.map((review: any, i: number) => (
              <div key={i} className="p-6 hover:bg-surface-container-low transition-colors duration-200">
                <div className="flex flex-col lg:flex-row gap-6">
                  {/* Left: Prop/User info */}
                  <div className="lg:w-1/4 flex flex-col gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center text-on-surface-variant font-bold">{review.authorInitials || "U"}</div>
                      <div>
                        <p className="font-label-md text-label-md text-on-surface">{review.author ?? "-"}</p>
                        <p className="text-xs text-on-surface-variant">Guest • {review.time ?? "-"}</p>
                      </div>
                    </div>
                    <div className="bg-surface p-3 rounded-lg border border-outline-variant">
                      <p className="font-label-md text-label-md text-on-surface mb-1 truncate">{review.property ?? "-"}</p>
                      <div className="flex items-center gap-1 text-on-surface-variant text-xs">
                        <span className="material-symbols-outlined text-[14px]">location_on</span> {review.location ?? "-"}
                      </div>
                      <div className="mt-2 text-xs font-data-mono text-on-surface-variant">ID: {review.bookingId ?? "-"}</div>
                    </div>
                  </div>
                  {/* Right: Content & Actions */}
                  <div className="lg:w-3/4 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                          <div className="flex text-amber-400">
                            {Array.from({length: 5}).map((_, j) => (
                              <span key={j} className="material-symbols-outlined" data-weight={j < (review.rating || 0) ? "fill" : ""}>star</span>
                            ))}
                          </div>
                          {review.sentiment && <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${review.sentiment === 'Negative' ? 'bg-error/10 text-error' : review.sentiment === 'Positive' ? 'bg-secondary/10 text-secondary' : 'bg-surface-variant text-on-surface-variant'}`}>{review.sentiment}</span>}
                          {review.flagged && <span className="px-2 py-0.5 bg-tertiary-container/10 text-tertiary-container rounded text-[10px] font-bold uppercase tracking-wider flex items-center gap-1"><span className="material-symbols-outlined text-[12px]">flag</span> Flagged by AI</span>}
                        </div>
                      </div>
                      <h4 className="font-headline-sm text-on-surface font-semibold mb-1">{review.title ?? "-"}</h4>
                      <p className="text-body-md text-on-surface-variant line-clamp-2">{review.content ?? "-"}</p>
                      {review.hostResponse && (
                        <div className="mt-3 bg-surface p-3 rounded-lg border-l-2 border-primary">
                          <p className="text-xs font-bold text-primary mb-1">Host Response:</p>
                          <p className="text-sm text-on-surface-variant italic">"{review.hostResponse}"</p>
                        </div>
                      )}
                    </div>
                    <div className="mt-4 flex flex-wrap gap-3 items-center justify-end">
                      <button onClick={() => setToast({message: "View Booking " + review.bookingId, type: 'info'})} className="px-3 py-1.5 text-on-surface-variant font-label-md text-label-md hover:bg-surface-container rounded-full transition-colors border border-outline-variant">View Booking</button>
                      <button onClick={() => setToast({message: "Review hidden successfully", type: 'success'})} className="px-3 py-1.5 text-error font-label-md text-label-md hover:bg-error/10 rounded-full transition-colors border border-error/30">Hide Review</button>
                      <button onClick={() => setToast({message: "Case opened for Review " + review.id, type: 'info'})} className="px-4 py-1.5 bg-primary text-on-primary font-label-md text-label-md rounded-full hover:bg-primary-container hover:text-on-primary-container transition-colors shadow-sm">Review Case</button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
        {/* Pagination */}
        <div className="p-4 border-t border-surface-container flex items-center justify-between bg-surface-container-lowest">
          <p className="text-sm text-on-surface-variant">Showing {reviews.length ? (page - 1) * ITEMS_PER_PAGE + 1 : 0} to {Math.min(page * ITEMS_PER_PAGE, reviews.length)} of {reviews.length} reviews</p>
          <div className="flex space-x-1">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-1 rounded-md text-outline hover:bg-surface-container disabled:opacity-50"><span className="material-symbols-outlined text-sm">chevron_left</span></button>
            <span className="px-2.5 py-1 rounded-md bg-primary text-on-primary text-sm font-medium">{page}</span>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="p-1 rounded-md text-on-surface-variant hover:bg-surface-container disabled:opacity-50"><span className="material-symbols-outlined text-sm">chevron_right</span></button>
          </div>
        </div>
      </div>
      {/* Side Drawer Filter */}
      <div className={`fixed inset-y-0 right-0 w-80 z-50 bg-surface shadow-2xl transition-transform transform ${isFilterOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="p-4 border-b border-outline-variant flex justify-between items-center">
          <h2 className="font-headline-sm font-semibold text-on-surface">Filter Reviews</h2>
          <button onClick={() => setIsFilterOpen(false)} className="material-symbols-outlined text-on-surface-variant hover:text-on-surface">close</button>
        </div>
        <div className="p-4 flex flex-col gap-6">
          <div>
            <label className="block text-sm mb-2 text-on-surface">Minimum Rating</label>
            <input type="range" min="1" max="5" defaultValue="1" className="w-full accent-primary" />
            <div className="flex justify-between text-xs text-on-surface-variant mt-1">
              <span>1 Star</span>
              <span>5 Stars</span>
            </div>
          </div>
          <div>
            <label className="block text-sm mb-1 text-on-surface">Sentiment</label>
            <select className="w-full p-2 border border-outline-variant rounded bg-surface text-on-surface">
              <option>All Sentiments</option>
              <option>Positive</option>
              <option>Neutral</option>
              <option>Negative</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}
