import React, { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, X } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { askQubeAI } from '../services/api';

interface ChatMessage {
  id: string;
  sender: 'user' | 'qube';
  text: string;
  timestamp: string;
}

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: 'm1',
    sender: 'qube',
    text: "👋 Hi! I'm Qube, your Stay Q AI travel companion.\n\nTell me where you want to go or what kind of vibe you're looking for (e.g. *beach villa with private pool*, *snow cabin in Manali*, or *zero-broker rental in Bangalore*), and I'll find the best options!",
    timestamp: 'Just now',
  },
];

const SUGGESTION_PILLS = [
  '🏖️ Beach villas in Goa with pool',
  '🏔️ Cozy snow cabin in Manali',
  '🔑 Zero broker rental in Bangalore',
  '🌿 Guided treks & food masterclasses',
];

export const QubeDrawer: React.FC = () => {
  const { isQubeOpen, setIsQubeOpen } = useApp();
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isQubeOpen) {
      endRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isQubeOpen]);

  const handleSend = async (textToSend?: string) => {
    const text = (textToSend || input).trim();
    if (!text || isTyping) return;

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    try {
      const replyText = await askQubeAI(text);
      const qubeMsg: ChatMessage = {
        id: `q-${Date.now()}`,
        sender: 'qube',
        text: replyText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, qubeMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <>
      {/* Floating Trigger Button */}
      {!isQubeOpen && (
        <button
          type="button"
          className="qube-float-trigger"
          onClick={() => setIsQubeOpen(true)}
          aria-label="Open Qube AI Assistant"
        >
          <div className="qube-float-trigger__avatar">
            <img src="/images/qube_mascot.jpg" alt="Qube AI" />
            <span className="qube-float-trigger__online-dot" />
          </div>
          <div className="qube-float-trigger__text">
            <span>Ask Qube AI</span>
            <small>Plan trip in seconds</small>
          </div>
          <Sparkles size={16} className="text-gold" />
        </button>
      )}

      {/* Chat Drawer */}
      {isQubeOpen && (
        <div className="qube-drawer-backdrop" onClick={() => setIsQubeOpen(false)}>
          <div className="qube-drawer" onClick={(e) => e.stopPropagation()}>
            <div className="qube-drawer__header">
              <div className="qube-drawer__avatar-wrap">
                <img src="/images/qube_mascot.jpg" alt="Qube" className="qube-drawer__avatar" />
                <div>
                  <div className="qube-drawer__name">
                    Qube AI Companion <Sparkles size={14} className="text-gold" />
                  </div>
                  <div className="qube-drawer__status">Online · Instant Stay & Trip Planner</div>
                </div>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setIsQubeOpen(false)}
                aria-label="Close Qube AI"
              >
                <X size={20} />
              </button>
            </div>

            <div className="qube-drawer__messages">
              {messages.map((m) => (
                <div key={m.id} className={`qube-msg qube-msg--${m.sender}`}>
                  {m.sender === 'qube' && (
                    <img src="/images/qube_mascot.jpg" alt="Qube" className="qube-msg__avatar" />
                  )}
                  <div className="qube-msg__bubble">
                    <div className="qube-msg__text" dangerouslySetInnerHTML={{ __html: formatMessage(m.text) }} />
                    <span className="qube-msg__time">{m.timestamp}</span>
                  </div>
                </div>
              ))}

              {isTyping && (
                <div className="qube-msg qube-msg--qube">
                  <img src="/images/qube_mascot.jpg" alt="Qube" className="qube-msg__avatar" />
                  <div className="qube-msg__bubble qube-msg__bubble--typing">
                    <span className="typing-dot" />
                    <span className="typing-dot" />
                    <span className="typing-dot" />
                  </div>
                </div>
              )}
              <div ref={endRef} />
            </div>

            {/* Suggestions */}
            <div className="qube-drawer__suggestions">
              {SUGGESTION_PILLS.map((pill) => (
                <button
                  key={pill}
                  type="button"
                  className="qube-suggestion-pill"
                  onClick={() => handleSend(pill)}
                >
                  {pill}
                </button>
              ))}
            </div>

            {/* Input Form */}
            <form
              className="qube-drawer__input-bar"
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
            >
              <input
                type="text"
                className="qube-drawer__input"
                placeholder="Ask Qube about stays, vibes, itineraries..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
              />
              <button
                type="submit"
                className="qube-drawer__send-btn"
                disabled={!input.trim() || isTyping}
                aria-label="Send message"
              >
                <Send size={16} />
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

function formatMessage(text: string): string {
  // Convert markdown bold to html bold and linebreaks
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/\n/g, '<br />');
}
