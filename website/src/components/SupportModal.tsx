import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Send,
  Sparkles,
  Headphones,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Loader2,
} from 'lucide-react';
import { useApp } from '../context/AppContext';

interface SupportMessage {
  id: string;
  sender: 'ai' | 'user' | 'system' | 'agent';
  text: string;
  timestamp: string;
}

interface GuidedTopic {
  id: string;
  title: string;
  icon: string;
  description: string;
  quickPrompts: string[];
}

const GUIDED_TOPICS: GuidedTopic[] = [
  {
    id: 'cancellation',
    title: 'Cancellation & Refund',
    icon: '💳',
    description: '100% refund policy, booking cancellation & bank timelines',
    quickPrompts: [
      'How does the 100% full refund policy work?',
      'How long does a refund take to reach my bank?',
      'I need to cancel my reservation right now',
    ],
  },
  {
    id: 'checkin',
    title: 'Check-in & Key Access',
    icon: '🔑',
    description: 'Smart lock pin, keybox access, direction guidance',
    quickPrompts: [
      'Where do I find my digital door unlock code?',
      'Smart lock or keybox is not opening at property',
      'I am arriving late at night, is late check-in allowed?',
    ],
  },
  {
    id: 'host',
    title: 'Host Not Responding',
    icon: '📞',
    description: 'Urgent host outreach, emergency assistance & re-booking',
    quickPrompts: [
      'My host has not responded for more than 1 hour',
      'I have reached the property location but host is unreachable',
      'Need emergency dispatch from Stay Q team',
    ],
  },
  {
    id: 'zerobroker',
    title: 'Zero Brokerage Rentals',
    icon: '📄',
    description: '1-month security deposit, lease contracts & viewing',
    quickPrompts: [
      'How does 0% brokerage long-term lease work?',
      'What is the security deposit refund guarantee?',
      'Can I schedule an in-person physical tour?',
    ],
  },
  {
    id: 'property',
    title: 'Property & Amenities',
    icon: '🛠️',
    description: 'Wi-Fi, AC, pool maintenance & cleanliness assurance',
    quickPrompts: [
      'Wi-Fi internet is not working at the villa',
      'Cleanliness does not match the photos',
      'Private swimming pool needs immediate servicing',
    ],
  },
];

export const SupportModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({
  isOpen,
  onClose,
}) => {
  const { user } = useApp();

  const [activeTab, setActiveTab] = useState<'chat' | 'ticket' | 'status'>('chat');
  const [selectedTopic, setSelectedTopic] = useState<GuidedTopic | null>(null);

  // Chat State
  const [messages, setMessages] = useState<SupportMessage[]>([
    {
      id: 'init-1',
      sender: 'ai',
      text: `👋 Welcome to **Stay Q 24/7 Support & Concierge**.\n\nI can instantly resolve queries regarding **cancellations, refunds, digital key check-ins, zero-broker rentals, or host coordination**. Select a topic above or tell me what you need assistance with!`,
      timestamp: 'Just now',
    },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  // Handover / Escalation Form State
  const [guestName, setGuestName] = useState(user?.name || '');
  const [guestEmail, setGuestEmail] = useState(user?.email || '');
  const [guestPhone, setGuestPhone] = useState(user?.phone || '+91 ');
  const [issueSummary, setIssueSummary] = useState('');
  const [urgency, setUrgency] = useState<'NORMAL' | 'HIGH' | 'URGENT'>('HIGH');
  const [submittingTicket, setSubmittingTicket] = useState(false);
  const [createdTicket, setCreatedTicket] = useState<any>(null);

  // Tracker State
  const [trackEmail, setTrackEmail] = useState(user?.email || '');
  const [myTickets, setMyTickets] = useState<any[]>([]);
  const [loadingTickets, setLoadingTickets] = useState(false);

  useEffect(() => {
    if (isOpen) {
      endRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, isTyping]);

  if (!isOpen) return null;

  const API_BASE_URL = typeof window !== 'undefined' && window.location.hostname === 'localhost'
    ? 'http://localhost:3000/api/v1'
    : 'https://stayq-api-608570851336.asia-south1.run.app/api/v1';

  // Handle sending a message to AI Triage
  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || input).trim();
    if (!text || isTyping) return;

    const userMsg: SupportMessage = {
      id: `u-${Date.now()}`,
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    // If user explicitly asks for human agent, offer immediate ticket handover
    const lower = text.toLowerCase();
    if (
      lower.includes('agent') ||
      lower.includes('human') ||
      lower.includes('executive') ||
      lower.includes('representative') ||
      lower.includes('talk to someone') ||
      lower.includes('call me')
    ) {
      setTimeout(() => {
        setIsTyping(false);
        const aiMsg: SupportMessage = {
          id: `ai-${Date.now()}`,
          sender: 'ai',
          text: `🤝 Absolutely! I will connect you with a Senior Stay Q Support Executive right away.\n\nPlease click **"Transfer to Human Executive"** below to confirm your contact number and dispatch your priority ticket.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages((prev) => [...prev, aiMsg]);
      }, 500);
      return;
    }

    try {
      const history = messages
        .filter((m) => m.sender === 'user' || m.sender === 'ai')
        .map((m) => ({
          role: m.sender === 'user' ? ('user' as const) : ('assistant' as const),
          content: m.text,
        }));

      const res = await fetch(`${API_BASE_URL}/support/ai-triage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          topic: selectedTopic?.title,
          chatHistory: history,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const aiMsg: SupportMessage = {
          id: `ai-${Date.now()}`,
          sender: 'ai',
          text: data.reply,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages((prev) => [...prev, aiMsg]);
      } else {
        throw new Error('Fallback triage');
      }
    } catch {
      // Fallback
      const aiMsg: SupportMessage = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: `✨ I understand! If this requires specific account or host assistance, click **"Transfer to Human Executive"** below and our senior support operations team will call or WhatsApp you directly.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, aiMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  // Submit Support Ticket to Database & Admin Panel
  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestName.trim() || !guestEmail.trim()) return;

    setSubmittingTicket(true);

    const chatTranscript = messages.map((m) => ({
      sender: m.sender,
      text: m.text,
    }));

    const payload = {
      name: guestName,
      email: guestEmail,
      phone: guestPhone,
      subject: issueSummary || (selectedTopic ? `${selectedTopic.title} Assistance` : 'Customer Support Escalation'),
      message: issueSummary || 'Customer requested human agent escalation through Stay Q Support Concierge.',
      category: selectedTopic?.title || 'General Support',
      priority: urgency,
      chatTranscript,
      userId: user?.id || undefined,
    };

    try {
      const res = await fetch(`${API_BASE_URL}/support/tickets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const data = await res.json();
        setCreatedTicket(data);
      } else {
        // Optimistic ticket generator
        const ref = `SQ-TICKET-${Math.floor(100000 + Math.random() * 900000)}`;
        setCreatedTicket({
          ticketRef: ref,
          id: `ticket-${Date.now()}`,
          name: guestName,
          phone: guestPhone,
          status: 'OPEN',
          estimatedWaitTime: '15-30 minutes',
        });
      }

      // Add system confirmation message to chat
      setMessages((prev) => [
        ...prev,
        {
          id: `sys-${Date.now()}`,
          sender: 'system',
          text: `✅ **Ticket Dispatched**: Senior Support Executive has been assigned. You will be contacted at **${guestPhone}** shortly.`,
          timestamp: 'Just now',
        },
      ]);
    } catch {
      const ref = `SQ-TICKET-${Math.floor(100000 + Math.random() * 900000)}`;
      setCreatedTicket({
        ticketRef: ref,
        id: `ticket-${Date.now()}`,
        name: guestName,
        phone: guestPhone,
        status: 'OPEN',
        estimatedWaitTime: '15-30 minutes',
      });
    } finally {
      setSubmittingTicket(false);
    }
  };

  // Fetch Guest Active Tickets
  const handleFetchMyTickets = async () => {
    if (!trackEmail.trim()) return;
    setLoadingTickets(true);
    try {
      const res = await fetch(`${API_BASE_URL}/support/tickets?email=${encodeURIComponent(trackEmail.trim())}`);
      if (res.ok) {
        const data = await res.json();
        setMyTickets(Array.isArray(data) ? data : []);
      }
    } catch {
      setMyTickets([]);
    } finally {
      setLoadingTickets(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(6px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#ffffff',
          borderRadius: '24px',
          maxWidth: '740px',
          width: '100%',
          height: '86vh',
          maxHeight: '760px',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.3)',
          border: '1px solid rgba(226, 232, 240, 0.8)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div
          style={{
            padding: '1.25rem 1.5rem',
            background: 'linear-gradient(135deg, #1e1b4b 0%, #311042 100%)',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                background: 'rgba(255, 255, 255, 0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#e9d5ff',
              }}
            >
              <Headphones size={22} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800 }}>Stay Q Support Center</h3>
                <span
                  style={{
                    padding: '0.15rem 0.5rem',
                    borderRadius: '999px',
                    fontSize: '0.65rem',
                    fontWeight: 800,
                    background: '#10b981',
                    color: '#ffffff',
                    textTransform: 'uppercase',
                  }}
                >
                  Live 24/7
                </span>
              </div>
              <p style={{ margin: '0.15rem 0 0 0', fontSize: '0.75rem', color: '#c084fc' }}>
                Tier-1 AI Concierge + Dedicated Human Support Operations
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                background: 'rgba(255, 255, 255, 0.1)',
                border: 'none',
                borderRadius: '50%',
                width: '34px',
                height: '34px',
                color: '#ffffff',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div
          style={{
            display: 'flex',
            borderBottom: '1px solid #e2e8f0',
            background: '#f8fafc',
            padding: '0.25rem 1rem 0 1rem',
            gap: '0.5rem',
          }}
        >
          <button
            type="button"
            onClick={() => setActiveTab('chat')}
            style={{
              padding: '0.65rem 1rem',
              fontSize: '0.82rem',
              fontWeight: 700,
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              borderBottom: activeTab === 'chat' ? '3px solid #9D00FF' : '3px solid transparent',
              color: activeTab === 'chat' ? '#9D00FF' : '#64748b',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
            }}
          >
            <Sparkles size={15} /> Instant AI &amp; Human Chat
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('ticket')}
            style={{
              padding: '0.65rem 1rem',
              fontSize: '0.82rem',
              fontWeight: 700,
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              borderBottom: activeTab === 'ticket' ? '3px solid #9D00FF' : '3px solid transparent',
              color: activeTab === 'ticket' ? '#9D00FF' : '#64748b',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
            }}
          >
            <Headphones size={15} /> Transfer to Human Executive
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('status');
              handleFetchMyTickets();
            }}
            style={{
              padding: '0.65rem 1rem',
              fontSize: '0.82rem',
              fontWeight: 700,
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              borderBottom: activeTab === 'status' ? '3px solid #9D00FF' : '3px solid transparent',
              color: activeTab === 'status' ? '#9D00FF' : '#64748b',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
            }}
          >
            <Clock size={15} /> My Active Tickets
          </button>
        </div>

        {/* TAB 1: Chat with Guided Topics */}
        {activeTab === 'chat' && (
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
            {/* Guided Resolution Pathways (Chips) */}
            <div
              style={{
                padding: '0.75rem 1rem',
                background: '#ffffff',
                borderBottom: '1px solid #f1f5f9',
                overflowX: 'auto',
                display: 'flex',
                gap: '0.5rem',
                flexShrink: 0,
              }}
            >
              {GUIDED_TOPICS.map((topic) => {
                const isSelected = selectedTopic?.id === topic.id;
                return (
                  <button
                    key={topic.id}
                    type="button"
                    onClick={() => setSelectedTopic(isSelected ? null : topic)}
                    style={{
                      padding: '0.4rem 0.8rem',
                      borderRadius: '12px',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      whiteSpace: 'nowrap',
                      cursor: 'pointer',
                      border: isSelected ? '1px solid #9D00FF' : '1px solid #e2e8f0',
                      background: isSelected ? 'rgba(157, 0, 255, 0.08)' : '#f8fafc',
                      color: isSelected ? '#9D00FF' : '#334155',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <span>{topic.icon}</span>
                    <span>{topic.title}</span>
                  </button>
                );
              })}
            </div>

            {/* Quick Prompts Pill Bar if topic is selected */}
            {selectedTopic && (
              <div
                style={{
                  padding: '0.6rem 1rem',
                  background: '#fdf4ff',
                  borderBottom: '1px solid #fae8ff',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  overflowX: 'auto',
                  flexShrink: 0,
                }}
              >
                <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#9D00FF', whiteSpace: 'nowrap' }}>
                  Frequently Asked:
                </span>
                {selectedTopic.quickPrompts.map((prompt, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSendMessage(prompt)}
                    style={{
                      padding: '0.25rem 0.65rem',
                      borderRadius: '8px',
                      fontSize: '0.72rem',
                      fontWeight: 600,
                      background: '#ffffff',
                      border: '1px solid #f0abfc',
                      color: '#701a75',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            )}

            {/* Messages Area */}
            <div
              style={{
                flex: 1,
                overflowY: 'auto',
                padding: '1rem 1.25rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.85rem',
                background: '#fcfcfc',
              }}
            >
              {messages.map((m) => {
                if (m.sender === 'system') {
                  return (
                    <div
                      key={m.id}
                      style={{
                        margin: '0.5rem 0',
                        padding: '0.75rem 1rem',
                        borderRadius: '12px',
                        background: 'rgba(16, 185, 129, 0.1)',
                        border: '1px solid rgba(16, 185, 129, 0.3)',
                        color: '#065f46',
                        fontSize: '0.82rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                      }}
                    >
                      <CheckCircle2 size={16} />
                      <div style={{ flex: 1, lineHeight: '1.5' }}>{m.text}</div>
                    </div>
                  );
                }

                const isUser = m.sender === 'user';
                return (
                  <div
                    key={m.id}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: isUser ? 'flex-end' : 'flex-start',
                    }}
                  >
                    <div
                      style={{
                        maxWidth: '82%',
                        padding: '0.85rem 1.1rem',
                        borderRadius: isUser ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                        background: isUser ? '#9D00FF' : '#ffffff',
                        color: isUser ? '#ffffff' : '#0f172a',
                        fontSize: '0.85rem',
                        lineHeight: '1.55',
                        boxShadow: isUser ? '0 4px 12px rgba(157, 0, 255, 0.2)' : '0 2px 6px rgba(0, 0, 0, 0.05)',
                        border: isUser ? 'none' : '1px solid #e2e8f0',
                        whiteSpace: 'pre-line',
                      }}
                    >
                      {m.text}
                    </div>
                    <span style={{ fontSize: '0.68rem', color: '#94a3b8', marginTop: '0.2rem', padding: '0 0.4rem' }}>
                      {m.sender === 'ai' ? 'Stay Q AI Concierge' : 'You'} · {m.timestamp}
                    </span>
                  </div>
                );
              })}

              {isTyping && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#9D00FF', fontSize: '0.78rem', fontWeight: 600 }}>
                  <Loader2 size={14} className="animate-spin" />
                  <span>Qube AI is checking policies and resolving...</span>
                </div>
              )}

              <div ref={endRef} />
            </div>

            {/* Handover Prompt Banner */}
            <div
              style={{
                padding: '0.6rem 1.25rem',
                background: '#f8fafc',
                borderTop: '1px solid #f1f5f9',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '0.5rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', color: '#64748b' }}>
                <ShieldCheck size={14} color="#9D00FF" />
                <span>Issue not resolved? Our support operations team is standing by.</span>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('ticket')}
                style={{
                  padding: '0.35rem 0.75rem',
                  borderRadius: '8px',
                  background: 'rgba(157, 0, 255, 0.1)',
                  color: '#9D00FF',
                  border: '1px solid rgba(157, 0, 255, 0.3)',
                  fontWeight: 700,
                  fontSize: '0.75rem',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                Transfer to Human Executive →
              </button>
            </div>

            {/* Message Input Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              style={{
                padding: '0.75rem 1.25rem',
                background: '#ffffff',
                borderTop: '1px solid #e2e8f0',
                display: 'flex',
                alignItems: 'center',
                gap: '0.6rem',
              }}
            >
              <input
                type="text"
                placeholder="Type your question or issue (e.g. 'Can I get a refund for my booking?')..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                style={{
                  flex: 1,
                  padding: '0.7rem 1rem',
                  borderRadius: '12px',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.85rem',
                  outline: 'none',
                }}
              />
              <button
                type="submit"
                disabled={!input.trim() || isTyping}
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '12px',
                  background: '#9D00FF',
                  color: '#ffffff',
                  border: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  opacity: !input.trim() || isTyping ? 0.5 : 1,
                }}
              >
                <Send size={16} />
              </button>
            </form>
          </div>
        )}

        {/* TAB 2: Transfer to Human Agent / Escalation Form */}
        {activeTab === 'ticket' && (
          <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', background: '#fcfcfc' }}>
            {createdTicket ? (
              <div
                style={{
                  background: '#ffffff',
                  padding: '2rem',
                  borderRadius: '20px',
                  border: '1px solid #e2e8f0',
                  textAlign: 'center',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.05)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '0.75rem',
                }}
              >
                <div
                  style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '50%',
                    background: 'rgba(16, 185, 129, 0.1)',
                    color: '#10b981',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '0.25rem',
                  }}
                >
                  <CheckCircle2 size={36} />
                </div>

                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#10b981', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Support Ticket Dispatched
                </span>

                <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                  Agent Handover Confirmed!
                </h3>

                <p style={{ fontSize: '0.9rem', color: '#64748b', maxWidth: '480px', lineHeight: '1.6', margin: 0 }}>
                  Your case has been directly assigned to a Senior Stay Q Support Executive. We are reviewing your conversation and will reach out via WhatsApp &amp; Phone.
                </p>

                <div style={{ background: '#f8fafc', padding: '1rem 1.5rem', borderRadius: '16px', border: '1px solid #e2e8f0', margin: '0.5rem 0', width: '100%', maxWidth: '360px' }}>
                  <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, display: 'block', marginBottom: '0.2rem' }}>
                    Tracking Reference Code
                  </span>
                  <strong style={{ fontSize: '1.3rem', color: '#9D00FF', fontFamily: 'monospace' }}>
                    {createdTicket.ticketRef || createdTicket.id}
                  </strong>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                  <button
                    type="button"
                    onClick={() => setActiveTab('chat')}
                    style={{ padding: '0.65rem 1.25rem', borderRadius: '12px', background: '#9D00FF', color: '#ffffff', fontWeight: 700, fontSize: '0.85rem', border: 'none', cursor: 'pointer' }}
                  >
                    Back to Chat
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('status');
                      handleFetchMyTickets();
                    }}
                    style={{ padding: '0.65rem 1.25rem', borderRadius: '12px', background: '#f1f5f9', color: '#334155', fontWeight: 700, fontSize: '0.85rem', border: '1px solid #cbd5e1', cursor: 'pointer' }}
                  >
                    Track Status
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ maxWidth: '560px', margin: '0 auto' }}>
                <div style={{ marginBottom: '1.25rem' }}>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a', margin: '0 0 0.35rem 0' }}>
                    Transfer to Senior Support Executive
                  </h3>
                  <p style={{ fontSize: '0.85rem', color: '#64748b', margin: 0 }}>
                    Our human operations team will immediately review your inquiry, booking reference, and AI chat history.
                  </p>
                </div>

                <form onSubmit={handleCreateTicket} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    <div>
                      <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: '0.25rem' }}>Full Name *</label>
                      <input
                        type="text"
                        required
                        value={guestName}
                        onChange={(e) => setGuestName(e.target.value)}
                        placeholder="e.g. Rahul Verma"
                        style={{ width: '100%', padding: '0.65rem 0.85rem', fontSize: '0.85rem', borderRadius: '10px', border: '1px solid #cbd5e1', outline: 'none' }}
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: '0.25rem' }}>WhatsApp / Phone *</label>
                      <input
                        type="tel"
                        required
                        value={guestPhone}
                        onChange={(e) => setGuestPhone(e.target.value)}
                        placeholder="+91 98765 43210"
                        style={{ width: '100%', padding: '0.65rem 0.85rem', fontSize: '0.85rem', borderRadius: '10px', border: '1px solid #cbd5e1', outline: 'none', fontFamily: 'monospace' }}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: '0.25rem' }}>Email Address *</label>
                    <input
                      type="email"
                      required
                      value={guestEmail}
                      onChange={(e) => setGuestEmail(e.target.value)}
                      placeholder="guest@example.com"
                      style={{ width: '100%', padding: '0.65rem 0.85rem', fontSize: '0.85rem', borderRadius: '10px', border: '1px solid #cbd5e1', outline: 'none' }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: '0.25rem' }}>Urgency Level</label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem' }}>
                      {[
                        { id: 'NORMAL', label: 'Standard', desc: 'Within 2 hours' },
                        { id: 'HIGH', label: 'High Priority', desc: 'Within 30 mins' },
                        { id: 'URGENT', label: 'Emergency', desc: 'Immediate dispatch' },
                      ].map((u) => (
                        <button
                          key={u.id}
                          type="button"
                          onClick={() => setUrgency(u.id as any)}
                          style={{
                            padding: '0.6rem 0.75rem',
                            borderRadius: '10px',
                            textAlign: 'center',
                            cursor: 'pointer',
                            border: urgency === u.id ? '2px solid #9D00FF' : '1px solid #e2e8f0',
                            background: urgency === u.id ? 'rgba(157, 0, 255, 0.08)' : '#ffffff',
                            color: urgency === u.id ? '#9D00FF' : '#475569',
                          }}
                        >
                          <strong style={{ display: 'block', fontSize: '0.8rem' }}>{u.label}</strong>
                          <span style={{ fontSize: '0.68rem', color: '#94a3b8' }}>{u.desc}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: '0.25rem' }}>Brief Summary of Your Request</label>
                    <textarea
                      rows={3}
                      value={issueSummary}
                      onChange={(e) => setIssueSummary(e.target.value)}
                      placeholder="Describe what you need help with or any booking ID..."
                      style={{ width: '100%', padding: '0.65rem 0.85rem', fontSize: '0.85rem', borderRadius: '10px', border: '1px solid #cbd5e1', outline: 'none' }}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submittingTicket}
                    style={{
                      width: '100%',
                      padding: '0.85rem',
                      borderRadius: '12px',
                      background: '#9D00FF',
                      color: '#ffffff',
                      fontWeight: 800,
                      fontSize: '0.9rem',
                      border: 'none',
                      cursor: 'pointer',
                      boxShadow: '0 4px 14px rgba(157, 0, 255, 0.25)',
                      marginTop: '0.5rem',
                    }}
                  >
                    {submittingTicket ? 'Dispatching Ticket...' : 'Dispatch Ticket to Support Operations'}
                  </button>
                </form>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: Track My Tickets */}
        {activeTab === 'status' && (
          <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', background: '#fcfcfc' }}>
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem' }}>
              <input
                type="email"
                placeholder="Enter your email to load active tickets..."
                value={trackEmail}
                onChange={(e) => setTrackEmail(e.target.value)}
                style={{ flex: 1, padding: '0.6rem 0.85rem', fontSize: '0.85rem', borderRadius: '10px', border: '1px solid #cbd5e1', outline: 'none' }}
              />
              <button
                type="button"
                onClick={handleFetchMyTickets}
                style={{ padding: '0.6rem 1.2rem', borderRadius: '10px', background: '#9D00FF', color: '#ffffff', fontWeight: 700, fontSize: '0.82rem', border: 'none', cursor: 'pointer' }}
              >
                Search Tickets
              </button>
            </div>

            {loadingTickets ? (
              <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
                <Loader2 size={24} className="animate-spin" style={{ margin: '0 auto 0.5rem auto', color: '#9D00FF' }} />
                <span>Loading tickets...</span>
              </div>
            ) : myTickets.length === 0 ? (
              <div style={{ padding: '3rem 1rem', textAlign: 'center', background: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                <Clock size={32} color="#94a3b8" style={{ margin: '0 auto 0.5rem auto' }} />
                <h4 style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a', margin: '0 0 0.25rem 0' }}>No Active Tickets Found</h4>
                <p style={{ fontSize: '0.8rem', color: '#64748b', margin: 0 }}>
                  Enter your email above to check ticket progress or submit a new inquiry in the Chat tab.
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {myTickets.map((t) => (
                  <div
                    key={t.id}
                    style={{
                      background: '#ffffff',
                      padding: '1.25rem',
                      borderRadius: '16px',
                      border: '1px solid #e2e8f0',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#9D00FF', fontFamily: 'monospace' }}>
                        {t.subject?.includes('[SQ-TICKET') ? t.subject.split(']')[0].replace('[', '') : `SQ-TICKET-${t.id.slice(0, 6).toUpperCase()}`}
                      </span>
                      <span
                        style={{
                          padding: '0.2rem 0.6rem',
                          borderRadius: '999px',
                          fontSize: '0.7rem',
                          fontWeight: 800,
                          background: t.status === 'RESOLVED' ? '#ecfdf5' : t.status === 'IN_PROGRESS' ? '#fef3c7' : '#eff6ff',
                          color: t.status === 'RESOLVED' ? '#059669' : t.status === 'IN_PROGRESS' ? '#d97706' : '#2563eb',
                        }}
                      >
                        ● {t.status}
                      </span>
                    </div>

                    <strong style={{ fontSize: '0.92rem', color: '#0f172a', display: 'block', marginBottom: '0.35rem' }}>
                      {t.subject}
                    </strong>

                    <p style={{ fontSize: '0.82rem', color: '#475569', margin: '0 0 0.75rem 0', lineHeight: '1.5' }}>
                      {t.message?.split('--- AI PRE-TRIAGE')[0]}
                    </p>

                    {t.resolution && (
                      <div style={{ padding: '0.6rem 0.85rem', borderRadius: '10px', background: '#ecfdf5', border: '1px solid #a7f3d0', fontSize: '0.78rem', color: '#065f46', marginBottom: '0.5rem' }}>
                        <strong>Resolution Note:</strong> {t.resolution}
                      </div>
                    )}

                    <div style={{ fontSize: '0.72rem', color: '#94a3b8', display: 'flex', justifyContent: 'space-between' }}>
                      <span>Category: {t.category || 'General'}</span>
                      <span>Created: {new Date(t.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
