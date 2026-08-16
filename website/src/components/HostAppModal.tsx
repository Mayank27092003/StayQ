import React from 'react';
import { X, Sparkles, ShieldCheck, IndianRupee, Key, Download, MessageSquare } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const HostAppModal: React.FC = () => {
  const { isHostAppModalOpen, setIsHostAppModalOpen } = useApp();

  if (!isHostAppModalOpen) return null;

  return (
    <div
      className="host-modal-backdrop"
      onClick={() => setIsHostAppModalOpen(false)}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(0, 0, 0, 0.65)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.25rem',
        overflowY: 'auto',
      }}
    >
      <div
        className="host-modal"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '540px',
          width: '100%',
          maxHeight: 'min(90vh, 720px)',
          overflowY: 'auto',
          background: '#ffffff',
          borderRadius: '24px',
          padding: '1.75rem 2rem',
          position: 'relative',
          boxShadow: '0 24px 48px -12px rgba(0, 0, 0, 0.25)',
          border: '1px solid var(--border)',
          display: 'flex',
          flexDirection: 'column',
          margin: 'auto',
        }}
      >
        {/* Close Button */}
        <button
          className="modal-close-btn"
          onClick={() => setIsHostAppModalOpen(false)}
          style={{
            position: 'absolute',
            top: '1.25rem',
            right: '1.25rem',
            width: '34px',
            height: '34px',
            borderRadius: '50%',
            background: 'var(--gray-100)',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: 'var(--ink)',
            zIndex: 10,
          }}
        >
          <X size={18} />
        </button>

        {/* Head */}
        <div className="host-modal__head" style={{ marginBottom: '1.25rem', textAlign: 'center', paddingRight: '1rem' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.3rem 0.8rem',
              borderRadius: '999px',
              background: 'rgba(90, 49, 244, 0.08)',
              color: 'var(--violet)',
              fontSize: '0.74rem',
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom: '0.5rem',
            }}
          >
            <Sparkles size={13} /> Stay Q Host Partner Program
          </div>

          <h2 className="h2" style={{ fontSize: '1.5rem', lineHeight: 1.25, color: 'var(--ink)', margin: '0 0 0.4rem' }}>
            List &amp; Manage Your Stays on the Stay Q App
          </h2>

          <p className="lead" style={{ fontSize: '0.88rem', color: 'var(--gray-600)', margin: 0, lineHeight: 1.5 }}>
            Download the official Stay Q mobile app to list luxury villas, mountain cabins, campervans, or zero-broker rentals in under 3 minutes.
          </p>
        </div>

        {/* Value Highlights */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.65rem', padding: '0.75rem 0.9rem', background: 'var(--gray-50)', borderRadius: '14px', border: '1px solid var(--border)' }}>
            <div style={{ width: '30px', height: '30px', borderRadius: '8px', background: 'rgba(18, 183, 106, 0.12)', color: '#12b76a', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '2px' }}>
              <Key size={16} />
            </div>
            <div>
              <strong style={{ fontSize: '0.84rem', color: 'var(--ink)', display: 'block' }}>1-Tap Mobile Property Listing</strong>
              <span style={{ fontSize: '0.76rem', color: 'var(--gray-600)', lineHeight: 1.4, display: 'block' }}>
                Upload high-res photos, set nightly pricing, and configure house rules directly from your phone.
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.65rem', padding: '0.75rem 0.9rem', background: 'var(--gray-50)', borderRadius: '14px', border: '1px solid var(--border)' }}>
            <div style={{ width: '30px', height: '30px', borderRadius: '8px', background: 'rgba(90, 49, 244, 0.12)', color: 'var(--violet)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '2px' }}>
              <ShieldCheck size={16} />
            </div>
            <div>
              <strong style={{ fontSize: '0.84rem', color: 'var(--ink)', display: 'block' }}>Live Calendar Sync &amp; Guest Verification</strong>
              <span style={{ fontSize: '0.76rem', color: 'var(--gray-600)', lineHeight: 1.4, display: 'block' }}>
                Real-time calendar blocking, government ID screening, and direct in-app guest chat.
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.65rem', padding: '0.75rem 0.9rem', background: 'var(--gray-50)', borderRadius: '14px', border: '1px solid var(--border)' }}>
            <div style={{ width: '30px', height: '30px', borderRadius: '8px', background: 'rgba(247, 144, 9, 0.12)', color: '#f79009', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '2px' }}>
              <IndianRupee size={16} />
            </div>
            <div>
              <strong style={{ fontSize: '0.84rem', color: 'var(--ink)', display: 'block' }}>Automated Direct Bank Settlements</strong>
              <span style={{ fontSize: '0.76rem', color: 'var(--gray-600)', lineHeight: 1.4, display: 'block' }}>
                Seamless payouts straight to your registered bank account on check-in day.
              </span>
            </div>
          </div>
        </div>

        {/* Download App CTA Buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', marginBottom: '1rem' }}>
          <a
            href="/StayQ-Release.apk"
            download="StayQ-Release.apk"
            className="btn btn--primary"
            style={{
              width: '100%',
              justifyContent: 'center',
              fontSize: '0.95rem',
              fontWeight: 800,
              padding: '0.85rem 1.25rem',
              borderRadius: '14px',
              textDecoration: 'none',
              gap: '0.5rem',
            }}
          >
            <Download size={18} />
            <span>Download Stay Q App (Android APK)</span>
          </a>

          <a
            href="https://wa.me/919999999999?text=Hi%20Stay%20Q%20Team%2C%20I%20am%20a%20property%20owner%20and%20want%20to%20list%20my%20stay."
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn--secondary"
            style={{
              width: '100%',
              justifyContent: 'center',
              fontSize: '0.88rem',
              fontWeight: 700,
              padding: '0.75rem 1.25rem',
              borderRadius: '14px',
              textDecoration: 'none',
              gap: '0.45rem',
              border: '1.5px solid var(--border)',
            }}
          >
            <MessageSquare size={16} style={{ color: '#25D366' }} />
            <span>Chat with Host Acquisition Team</span>
          </a>
        </div>

        {/* Footer Note */}
        <p style={{ textAlign: 'center', fontSize: '0.74rem', color: 'var(--gray-500)', margin: 0, lineHeight: 1.4 }}>
          iOS App coming soon to Apple App Store · QUATALYST PRIVATE LIMITED (CIN: U62011GA2026PTC018230)
        </p>
      </div>
    </div>
  );
};
