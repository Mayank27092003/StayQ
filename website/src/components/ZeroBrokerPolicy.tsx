import React from 'react';
import { HeartHandshake } from 'lucide-react';

export const ZeroBrokerPolicy: React.FC = () => {
  return (
    <div className="shell" style={{ padding: '7.5rem 1rem 6rem', maxWidth: '840px' }}>
      <div style={{ marginBottom: '2.5rem' }}>
        <span style={{ fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#10B981', background: 'rgba(16, 185, 129, 0.08)', padding: '0.35rem 0.85rem', borderRadius: '999px', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
          <HeartHandshake size={14} /> Direct Tenancy Charter
        </span>
        <h1 className="h1" style={{ marginTop: '0.75rem', marginBottom: '0.5rem' }}>
          Stay Q Zero-Brokerage Fair Pricing Charter
        </h1>
        <p className="lead" style={{ color: 'var(--gray-600)', fontSize: '1rem' }}>
          Eliminating middleman exploitation and broker commissions from long-term home rentals across India.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', fontSize: '0.95rem', lineHeight: 1.7, color: 'var(--gray-700)' }}>
        <section style={{ background: 'var(--white)', padding: '1.5rem', borderRadius: '18px', border: '1px solid var(--border)' }}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--ink)', marginBottom: '0.6rem' }}>
            The 4 Zero-Broker Pillars
          </h3>
          <ul style={{ paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            <li><strong>0% Tenant Brokerage:</strong> Tenants never pay 15 days or 1 month brokerage fees to any middleman.</li>
            <li><strong>Direct Owner Interaction:</strong> Video tours, chat, and lease agreements directly with property title holders.</li>
            <li><strong>Digital 11-Month Agreements:</strong> Compliant e-stamped legal rental agreements generated in under 10 minutes.</li>
            <li><strong>Security Deposit Cap:</strong> Standardized fair deposit thresholds (maximum 2 to 3 months) to avoid unfair capital locking.</li>
          </ul>
        </section>
      </div>
    </div>
  );
};
