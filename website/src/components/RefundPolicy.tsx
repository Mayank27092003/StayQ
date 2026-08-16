import React from 'react';
import { IndianRupee } from 'lucide-react';

export const RefundPolicy: React.FC = () => {
  return (
    <div className="shell" style={{ padding: '7.5rem 1rem 6rem', maxWidth: '840px' }}>
      <div style={{ marginBottom: '2.5rem' }}>
        <span style={{ fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#10B981', background: 'rgba(16, 185, 129, 0.08)', padding: '0.35rem 0.85rem', borderRadius: '999px', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
          <IndianRupee size={14} /> Fair Cancellation &amp; Refund Framework
        </span>
        <h1 className="h1" style={{ marginTop: '0.75rem', marginBottom: '0.5rem' }}>
          Stay Q Cancellation, Refund &amp; Deposit Policy
        </h1>
        <p className="lead" style={{ color: 'var(--gray-600)', fontSize: '1rem' }}>
          Clear, automated, and dispute-free refunds directly credited to your original payment method.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', fontSize: '0.95rem', lineHeight: 1.7, color: 'var(--gray-700)' }}>
        {/* Tier Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem' }}>
          <div style={{ background: 'var(--white)', padding: '1.5rem', borderRadius: '18px', border: '1.5px solid #10B981', boxShadow: 'var(--shadow-sm)' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#10B981', textTransform: 'uppercase' }}>Tier 1: Flexible</span>
            <h4 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--ink)', margin: '0.4rem 0' }}>100% Full Refund</h4>
            <p style={{ fontSize: '0.82rem', color: 'var(--gray-600)', margin: 0 }}>
              Cancel up to 48 hours before check-in for a full 100% refund, with zero cancellation penalty.
            </p>
          </div>

          <div style={{ background: 'var(--white)', padding: '1.5rem', borderRadius: '18px', border: '1.5px solid #F59E0B', boxShadow: 'var(--shadow-sm)' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#F59E0B', textTransform: 'uppercase' }}>Tier 2: Moderate</span>
            <h4 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--ink)', margin: '0.4rem 0' }}>50% Refund Window</h4>
            <p style={{ fontSize: '0.82rem', color: 'var(--gray-600)', margin: 0 }}>
              Cancel within 48 to 24 hours of check-in to receive a 50% refund on nightly base rate.
            </p>
          </div>

          <div style={{ background: 'var(--white)', padding: '1.5rem', borderRadius: '18px', border: '1.5px solid var(--violet)', boxShadow: 'var(--shadow-sm)' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--violet)', textTransform: 'uppercase' }}>Zero-Broker Leases</span>
            <h4 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--ink)', margin: '0.4rem 0' }}>100% Deposit Protection</h4>
            <p style={{ fontSize: '0.82rem', color: 'var(--gray-600)', margin: 0 }}>
              Full security deposit refunded upon tenancy completion with mandatory digital move-out inspection.
            </p>
          </div>
        </div>

        <section style={{ background: 'var(--surface)', padding: '1.5rem', borderRadius: '18px', border: '1px solid var(--border)' }}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--ink)', marginBottom: '0.6rem' }}>
            Automated Processing Timelines
          </h3>
          <p>
            Once a cancellation is confirmed on the Stay Q platform, refund processing is initiated automatically:
          </p>
          <ul style={{ paddingLeft: '1.25rem', marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            <li><strong>UPI &amp; NetBanking:</strong> Settled within 2 to 4 hours.</li>
            <li><strong>Credit &amp; Debit Cards:</strong> Settled within 3 to 5 business days per standard bank clearing cycles.</li>
          </ul>
        </section>
      </div>
    </div>
  );
};
