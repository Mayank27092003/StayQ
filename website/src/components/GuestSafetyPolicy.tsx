import React from 'react';
import { ShieldCheck } from 'lucide-react';

export const GuestSafetyPolicy: React.FC = () => {
  return (
    <div className="shell" style={{ padding: '7.5rem 1rem 6rem', maxWidth: '840px' }}>
      <div style={{ marginBottom: '2.5rem' }}>
        <span style={{ fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#0EA5E9', background: 'rgba(14, 165, 233, 0.08)', padding: '0.35rem 0.85rem', borderRadius: '999px', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
          <ShieldCheck size={14} /> Community Standards &amp; Safety
        </span>
        <h1 className="h1" style={{ marginTop: '0.75rem', marginBottom: '0.5rem' }}>
          Stay Q Guest Safety &amp; Anti-Discrimination Policy
        </h1>
        <p className="lead" style={{ color: 'var(--gray-600)', fontSize: '1rem' }}>
          Ensuring secure, welcoming, and inclusive spaces for every traveler and host across India.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', fontSize: '0.95rem', lineHeight: 1.7, color: 'var(--gray-700)' }}>
        <section style={{ background: 'var(--white)', padding: '1.5rem', borderRadius: '18px', border: '1px solid var(--border)' }}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--ink)', marginBottom: '0.6rem' }}>
            Zero-Tolerance Anti-Discrimination Policy
          </h3>
          <p>
            Stay Q strictly prohibits discrimination against any guest or host on the basis of race, religion, national origin, ethnicity, disability, gender, gender identity, sexual orientation, or marital status.
          </p>
        </section>

        <section style={{ background: 'var(--surface)', padding: '1.5rem', borderRadius: '18px', border: '1px solid var(--border)' }}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--ink)', marginBottom: '0.6rem' }}>
            Physical Safety &amp; Emergency Concierge
          </h3>
          <p>
            Every Stay Q property must maintain operational first aid kits, emergency contact placards, and secure digital or deadbolt locks. Our 24/7 Safety Rapid Response Desk is reachable directly in-app or via <strong>emergency@stayq.in</strong>.
          </p>
        </section>
      </div>
    </div>
  );
};
