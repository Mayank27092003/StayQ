"use client";
import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import Toast from '@/components/Toast';

interface SupportTicket {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  category?: string;
  priority: 'NORMAL' | 'HIGH' | 'URGENT' | 'LOW';
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  resolution?: string;
  assignedTo?: string;
  createdAt: string;
  updatedAt: string;
  messages?: Array<{
    id: string;
    authorType: 'USER' | 'ADMIN' | 'SYSTEM';
    authorName?: string;
    body: string;
    createdAt: string;
  }>;
}

export default function SupportCenter() {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [replyText, setReplyText] = useState('');
  const [resolutionText, setResolutionText] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Fetch real tickets from database
  const fetchTickets = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/v1/support/tickets');
      if (Array.isArray(res.data)) {
        setTickets(res.data);
      }
    } catch (err) {
      console.error('Error fetching support tickets:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  // Filter tickets
  const filteredTickets = tickets.filter((t) => {
    const matchesSearch =
      search === '' ||
      t.subject?.toLowerCase().includes(search.toLowerCase()) ||
      t.name?.toLowerCase().includes(search.toLowerCase()) ||
      t.email?.toLowerCase().includes(search.toLowerCase()) ||
      t.message?.toLowerCase().includes(search.toLowerCase());

    const matchesStatus = statusFilter === 'ALL' || t.status === statusFilter;
    const matchesPriority = priorityFilter === 'ALL' || t.priority === priorityFilter;

    return matchesSearch && matchesStatus && matchesPriority;
  });

  // Calculate live KPI metrics
  const totalOpen = tickets.filter((t) => t.status === 'OPEN').length;
  const totalInProgress = tickets.filter((t) => t.status === 'IN_PROGRESS').length;
  const totalUrgent = tickets.filter((t) => t.priority === 'URGENT' || t.priority === 'HIGH').length;
  const totalResolved = tickets.filter((t) => t.status === 'RESOLVED').length;

  // Extract phone number from ticket message or name if available
  const extractPhone = (ticket: SupportTicket): string | null => {
    const phoneMatch = ticket.message?.match(/(\+91\s?[6-9]\d{9}|[6-9]\d{9})/);
    return phoneMatch ? phoneMatch[0].replace(/\s+/g, '') : null;
  };

  // Update Ticket Status or Resolution
  const handleUpdateTicket = async (
    ticketId: string,
    updates: {
      status?: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
      priority?: 'NORMAL' | 'HIGH' | 'URGENT' | 'LOW';
      resolution?: string;
    }
  ) => {
    try {
      setIsUpdating(true);
      const res = await axios.patch(`/api/v1/support/tickets/${ticketId}`, updates);
      setTickets((prev) => prev.map((t) => (t.id === ticketId ? { ...t, ...res.data } : t)));
      if (selectedTicket?.id === ticketId) {
        setSelectedTicket((prev) => (prev ? { ...prev, ...res.data } : null));
      }
      setToast({
        message: updates.status === 'RESOLVED' ? 'Ticket marked as RESOLVED!' : 'Ticket updated successfully!',
        type: 'success',
      });
    } catch (err) {
      console.error('Failed to update ticket:', err);
      setToast({ message: 'Failed to update ticket', type: 'error' });
    } finally {
      setIsUpdating(false);
    }
  };

  // Send Admin Reply
  const handleSendReply = async (ticketId: string) => {
    if (!replyText.trim()) return;
    try {
      setIsUpdating(true);
      const res = await axios.post(`/api/v1/support/tickets/${ticketId}/messages`, {
        authorType: 'ADMIN',
        authorName: 'Stay Q Senior Executive',
        body: replyText.trim(),
      });

      // Update state
      const updatedMessages = [...(selectedTicket?.messages || []), res.data];
      setSelectedTicket((prev) => (prev ? { ...prev, status: 'IN_PROGRESS', messages: updatedMessages } : null));
      setTickets((prev) =>
        prev.map((t) =>
          t.id === ticketId ? { ...t, status: 'IN_PROGRESS', messages: updatedMessages } : t
        )
      );
      setReplyText('');
      setToast({ message: 'Reply sent to guest!', type: 'success' });
    } catch (err) {
      console.error('Failed to send reply:', err);
      setToast({ message: 'Failed to send reply', type: 'error' });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="max-w-[1440px] mx-auto space-y-6 p-6 relative">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-surface rounded-2xl p-6 border border-outline-variant/30 shadow-sm">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <span className="material-symbols-outlined text-[24px]">support_agent</span>
            </div>
            <div>
              <h2 className="text-2xl font-black text-on-surface">Support &amp; Escalations Desk</h2>
              <p className="text-sm text-on-surface-variant">
                Live customer support tickets, AI triage transcripts, and 1-click WhatsApp/Call outreach.
              </p>
            </div>
          </div>
        </div>

        <div className="flex gap-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={fetchTickets}
            className="px-4 py-2.5 bg-surface-container border border-outline-variant/50 text-on-surface font-semibold text-sm rounded-xl hover:bg-surface-container-high transition-colors flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-[18px]">refresh</span>
            Refresh Live
          </button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1 */}
        <div className="bg-surface rounded-2xl p-5 border border-outline-variant/30 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Open Tickets</span>
            <span className="material-symbols-outlined text-blue-600 bg-blue-50 dark:bg-blue-950/40 p-2 rounded-xl text-[20px]">
              pending_actions
            </span>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-black text-on-surface">{totalOpen}</span>
            <span className="text-xs text-blue-600 font-bold block mt-0.5">Awaiting agent action</span>
          </div>
        </div>

        {/* KPI 2 */}
        <div className="bg-surface rounded-2xl p-5 border border-outline-variant/30 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">In Progress</span>
            <span className="material-symbols-outlined text-amber-600 bg-amber-50 dark:bg-amber-950/40 p-2 rounded-xl text-[20px]">
              sync
            </span>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-black text-on-surface">{totalInProgress}</span>
            <span className="text-xs text-amber-600 font-bold block mt-0.5">Active agent discussions</span>
          </div>
        </div>

        {/* KPI 3 */}
        <div className="bg-surface rounded-2xl p-5 border border-outline-variant/30 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">High / Urgent</span>
            <span className="material-symbols-outlined text-red-600 bg-red-50 dark:bg-red-950/40 p-2 rounded-xl text-[20px]">
              priority_high
            </span>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-black text-on-surface">{totalUrgent}</span>
            <span className="text-xs text-red-600 font-bold block mt-0.5">Priority escalations</span>
          </div>
        </div>

        {/* KPI 4 */}
        <div className="bg-surface rounded-2xl p-5 border border-outline-variant/30 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Resolved</span>
            <span className="material-symbols-outlined text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 p-2 rounded-xl text-[20px]">
              task_alt
            </span>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-black text-on-surface">{totalResolved}</span>
            <span className="text-xs text-emerald-600 font-bold block mt-0.5">Closed resolutions</span>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-surface rounded-2xl p-4 border border-outline-variant/30 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
        {/* Status Pills */}
        <div className="flex flex-wrap gap-1.5 w-full md:w-auto">
          {['ALL', 'OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'].map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                statusFilter === s
                  ? 'bg-primary text-on-primary shadow-sm'
                  : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
              }`}
            >
              {s.replace('_', ' ')}
            </button>
          ))}
        </div>

        {/* Search & Priority Select */}
        <div className="flex gap-2 w-full md:w-auto">
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-outline-variant bg-surface-container-lowest text-xs font-bold text-on-surface"
          >
            <option value="ALL">All Priorities</option>
            <option value="URGENT">🚨 Urgent</option>
            <option value="HIGH">🔥 High</option>
            <option value="NORMAL">Standard</option>
            <option value="LOW">Low</option>
          </select>

          <div className="relative flex-1 md:w-64">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">
              search
            </span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search reference, name, phone..."
              className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-outline-variant bg-surface-container-lowest text-xs text-on-surface focus:outline-none focus:border-primary"
            />
          </div>
        </div>
      </div>

      {/* Tickets List Table */}
      <div className="bg-surface rounded-2xl border border-outline-variant/30 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-outline-variant/20 bg-surface-container-lowest text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                <th className="p-4">Reference &amp; Guest</th>
                <th className="p-4">Category &amp; Issue</th>
                <th className="p-4">Priority</th>
                <th className="p-4">Status</th>
                <th className="p-4">Received</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/10 text-sm text-on-surface">
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-on-surface-variant">
                    <span className="material-symbols-outlined animate-spin text-[28px] text-primary block mb-2">
                      progress_activity
                    </span>
                    Loading support tickets...
                  </td>
                </tr>
              ) : filteredTickets.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-on-surface-variant">
                    <span className="material-symbols-outlined text-[40px] text-outline block mb-2">
                      inbox
                    </span>
                    No tickets found matching your filters.
                  </td>
                </tr>
              ) : (
                filteredTickets.map((t) => {
                  const phone = extractPhone(t);
                  return (
                    <tr
                      key={t.id}
                      onClick={() => {
                        setSelectedTicket(t);
                        setResolutionText(t.resolution || '');
                      }}
                      className="hover:bg-surface-container-low transition-colors cursor-pointer group"
                    >
                      <td className="p-4">
                        <div className="font-bold text-on-surface flex items-center gap-2">
                          <span className="font-mono text-xs text-primary font-black">
                            {t.subject?.includes('[SQ-TICKET')
                              ? t.subject.split(']')[0].replace('[', '')
                              : `SQ-${t.id.slice(0, 6).toUpperCase()}`}
                          </span>
                        </div>
                        <div className="text-xs text-on-surface-variant mt-0.5 font-medium">
                          {t.name} · {t.email}
                        </div>
                      </td>

                      <td className="p-4 max-w-xs">
                        <span className="inline-block px-2 py-0.5 rounded-md bg-surface-container text-[11px] font-bold text-on-surface-variant mb-1">
                          {t.category || 'General'}
                        </span>
                        <div className="font-semibold text-on-surface truncate">
                          {t.subject?.replace(/\[SQ-TICKET-[^\]]+\]\s*/, '')}
                        </div>
                      </td>

                      <td className="p-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-black uppercase ${
                            t.priority === 'URGENT'
                              ? 'bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-300'
                              : t.priority === 'HIGH'
                              ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300'
                              : 'bg-surface-container text-on-surface-variant'
                          }`}
                        >
                          {t.priority}
                        </span>
                      </td>

                      <td className="p-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-extrabold ${
                            t.status === 'RESOLVED'
                              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300'
                              : t.status === 'IN_PROGRESS'
                              ? 'bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300'
                              : 'bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300'
                          }`}
                        >
                          ● {t.status.replace('_', ' ')}
                        </span>
                      </td>

                      <td className="p-4 text-xs text-on-surface-variant font-medium">
                        {new Date(t.createdAt).toLocaleDateString([], {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>

                      <td className="p-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-end gap-1.5">
                          {phone && (
                            <a
                              href={`https://wa.me/${phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                                `Hello ${t.name}, this is Stay Q Support Executive regarding your ticket ${t.subject}. How may I assist you?`
                              )}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300 transition-colors"
                              title="Chat on WhatsApp"
                            >
                              <span className="material-symbols-outlined text-[18px]">chat</span>
                            </a>
                          )}

                          <button
                            type="button"
                            onClick={() => {
                              setSelectedTicket(t);
                              setResolutionText(t.resolution || '');
                            }}
                            className="p-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                            title="Open Ticket Desk"
                          >
                            <span className="material-symbols-outlined text-[18px]">open_in_new</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Full Ticket Details & Live Resolution Modal Drawer */}
      {selectedTicket && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-150"
          onClick={() => setSelectedTicket(null)}
        >
          <div
            className="bg-surface rounded-3xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl border border-outline-variant/30"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-6 bg-surface-container-high border-b border-outline-variant/20 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm font-black text-primary">
                    {selectedTicket.subject?.includes('[SQ-TICKET')
                      ? selectedTicket.subject.split(']')[0].replace('[', '')
                      : `SQ-TICKET-${selectedTicket.id.slice(0, 6).toUpperCase()}`}
                  </span>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-xs font-black uppercase ${
                      selectedTicket.status === 'RESOLVED'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {selectedTicket.status}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-on-surface mt-1">
                  {selectedTicket.subject?.replace(/\[SQ-TICKET-[^\]]+\]\s*/, '')}
                </h3>
              </div>

              <button
                type="button"
                onClick={() => setSelectedTicket(null)}
                className="w-9 h-9 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant hover:bg-surface-container-highest transition-colors"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-5 flex-1 bg-surface">
              {/* Guest Information Card & Rapid Outreach */}
              <div className="bg-surface-container-lowest p-4 rounded-2xl border border-outline-variant/20 flex flex-col sm:flex-row justify-between gap-4 items-start sm:items-center">
                <div>
                  <div className="font-bold text-on-surface text-base">{selectedTicket.name}</div>
                  <div className="text-xs text-on-surface-variant mt-0.5">
                    ✉️ {selectedTicket.email}
                    {extractPhone(selectedTicket) && (
                      <span className="ml-2">📞 {extractPhone(selectedTicket)}</span>
                    )}
                  </div>
                </div>

                <div className="flex gap-2 w-full sm:w-auto">
                  {extractPhone(selectedTicket) && (
                    <>
                      <a
                        href={`https://wa.me/${extractPhone(selectedTicket)?.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                          `Hello ${selectedTicket.name}, Stay Q Support Executive here regarding your ticket: ${selectedTicket.subject}.`
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 flex items-center gap-1.5 shadow-sm"
                      >
                        <span className="material-symbols-outlined text-[16px]">chat</span>
                        WhatsApp Guest
                      </a>

                      <a
                        href={`tel:${extractPhone(selectedTicket)}`}
                        className="px-3 py-1.5 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 flex items-center gap-1.5 shadow-sm"
                      >
                        <span className="material-symbols-outlined text-[16px]">call</span>
                        Call Phone
                      </a>
                    </>
                  )}
                </div>
              </div>

              {/* AI Pre-Triage Transcript Box */}
              <div className="bg-surface-container-low p-4 rounded-2xl border border-outline-variant/20">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary mb-2">
                  <span className="material-symbols-outlined text-[16px]">auto_awesome</span>
                  AI Pre-Triage Transcript &amp; Guest Issue
                </div>
                <div className="text-xs text-on-surface font-mono whitespace-pre-line leading-relaxed bg-surface-container-lowest p-3.5 rounded-xl border border-outline-variant/10 max-h-60 overflow-y-auto">
                  {selectedTicket.message}
                </div>
              </div>

              {/* Live Messages Thread */}
              {selectedTicket.messages && selectedTicket.messages.length > 0 && (
                <div className="space-y-2">
                  <span className="text-xs font-bold uppercase text-on-surface-variant">Conversation Thread</span>
                  <div className="space-y-2 bg-surface-container-lowest p-4 rounded-2xl border border-outline-variant/20 max-h-52 overflow-y-auto">
                    {selectedTicket.messages.map((m) => (
                      <div
                        key={m.id}
                        className={`p-3 rounded-xl text-xs ${
                          m.authorType === 'ADMIN'
                            ? 'bg-primary/10 text-on-surface ml-8 border border-primary/20'
                            : 'bg-surface-container text-on-surface mr-8'
                        }`}
                      >
                        <div className="font-bold mb-1 flex justify-between text-[11px] text-on-surface-variant">
                          <span>{m.authorName || (m.authorType === 'ADMIN' ? 'Stay Q Executive' : 'Guest')}</span>
                          <span>{new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <div>{m.body}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Admin Reply Composer */}
              <div>
                <label className="text-xs font-bold uppercase text-on-surface-variant block mb-1.5">
                  Send Official Executive Reply
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Type executive message to guest..."
                    className="flex-1 px-4 py-2.5 rounded-xl border border-outline-variant bg-surface-container-lowest text-xs text-on-surface outline-none focus:border-primary"
                  />
                  <button
                    type="button"
                    disabled={!replyText.trim() || isUpdating}
                    onClick={() => handleSendReply(selectedTicket.id)}
                    className="px-4 py-2.5 rounded-xl bg-primary text-on-primary text-xs font-bold hover:bg-primary-container disabled:opacity-50 flex items-center gap-1.5 shadow-sm"
                  >
                    <span className="material-symbols-outlined text-[16px]">send</span>
                    Send Reply
                  </button>
                </div>
              </div>

              {/* Resolution & Status Update Section */}
              <div className="bg-surface-container-high p-4 rounded-2xl border border-outline-variant/30 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold uppercase text-on-surface">Resolution &amp; Lifecycle</span>
                  <div className="flex gap-2">
                    <select
                      value={selectedTicket.priority}
                      onChange={(e) =>
                        handleUpdateTicket(selectedTicket.id, {
                          priority: e.target.value as any,
                        })
                      }
                      className="px-2.5 py-1 rounded-lg bg-surface text-xs font-bold border border-outline-variant"
                    >
                      <option value="NORMAL">Standard Priority</option>
                      <option value="HIGH">High Priority</option>
                      <option value="URGENT">Urgent</option>
                      <option value="LOW">Low</option>
                    </select>

                    <select
                      value={selectedTicket.status}
                      onChange={(e) =>
                        handleUpdateTicket(selectedTicket.id, {
                          status: e.target.value as any,
                        })
                      }
                      className="px-2.5 py-1 rounded-lg bg-surface text-xs font-bold border border-outline-variant"
                    >
                      <option value="OPEN">OPEN</option>
                      <option value="IN_PROGRESS">IN PROGRESS</option>
                      <option value="RESOLVED">RESOLVED</option>
                      <option value="CLOSED">CLOSED</option>
                    </select>
                  </div>
                </div>

                <div>
                  <textarea
                    rows={2}
                    value={resolutionText}
                    onChange={(e) => setResolutionText(e.target.value)}
                    placeholder="Enter final resolution note (e.g. 100% refund processed, host contacted and key handed over)..."
                    className="w-full px-3 py-2 rounded-xl border border-outline-variant bg-surface text-xs text-on-surface outline-none focus:border-primary"
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    disabled={isUpdating}
                    onClick={() =>
                      handleUpdateTicket(selectedTicket.id, {
                        status: 'RESOLVED',
                        resolution: resolutionText.trim() || 'Issue resolved successfully by Stay Q Support Operations.',
                      })
                    }
                    className="px-5 py-2 rounded-xl bg-emerald-600 text-white text-xs font-black hover:bg-emerald-700 transition-colors flex items-center gap-1.5 shadow-sm"
                  >
                    <span className="material-symbols-outlined text-[16px]">check_circle</span>
                    Mark as RESOLVED
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
