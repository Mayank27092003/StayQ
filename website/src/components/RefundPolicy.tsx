import React from 'react';
import { IndianRupee, Clock, AlertCircle } from 'lucide-react';

export const RefundPolicy: React.FC = () => {
  return (
    <div className="shell" style={{ padding: '7.5rem 1rem 6rem', maxWidth: '880px' }}>
      <div style={{ marginBottom: '2.5rem' }}>
        <span style={{ fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#10B981', background: 'rgba(16, 185, 129, 0.08)', padding: '0.35rem 0.85rem', borderRadius: '999px', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
          <IndianRupee size={14} /> Fair Cancellation &amp; Refund Framework
        </span>
        <h1 className="h1" style={{ marginTop: '0.75rem', marginBottom: '0.5rem' }}>
          Stay Q Cancellation, Refund &amp; Deposit Policy
        </h1>
        <p className="lead" style={{ color: 'var(--gray-600)', fontSize: '1rem' }}>
          Clear, transparent, and dispute-free refunds directly credited to your original payment method.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', fontSize: '0.95rem', lineHeight: 1.7, color: 'var(--gray-700)' }}>
        {/* Tier Cards Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.25rem' }}>
          {/* Tier 1: Flexible */}
          <div style={{ background: 'var(--white)', padding: '1.5rem', borderRadius: '18px', border: '1.5px solid #10B981', boxShadow: 'var(--shadow-sm)' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#10B981', textTransform: 'uppercase' }}>Tier 1: Flexible</span>
            <h4 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--ink)', margin: '0.4rem 0' }}>100% Full Refund</h4>
            <p style={{ fontSize: '0.84rem', color: 'var(--gray-600)', margin: '0 0 0.75rem 0' }}>
              Cancel up to 24 hours before check-in time (3:00 PM local) for a full 100% refund, with zero cancellation penalty.
            </p>
            <span style={{ fontSize: '0.75rem', color: '#059669', background: 'rgba(16, 185, 129, 0.1)', padding: '0.2rem 0.5rem', borderRadius: '6px', fontWeight: 700 }}>
              Best for spontaneous travel
            </span>
          </div>

          {/* Tier 2: Moderate */}
          <div style={{ background: 'var(--white)', padding: '1.5rem', borderRadius: '18px', border: '1.5px solid #F59E0B', boxShadow: 'var(--shadow-sm)' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#F59E0B', textTransform: 'uppercase' }}>Tier 2: Moderate</span>
            <h4 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--ink)', margin: '0.4rem 0' }}>5-Day Full / 50% Window</h4>
            <p style={{ fontSize: '0.84rem', color: 'var(--gray-600)', margin: '0 0 0.75rem 0' }}>
              Full refund if cancelled at least 5 full days before check-in. 50% refund on nightly rate if cancelled within 5 to 2 days before check-in.
            </p>
            <span style={{ fontSize: '0.75rem', color: '#D97706', background: 'rgba(245, 158, 11, 0.1)', padding: '0.2rem 0.5rem', borderRadius: '6px', fontWeight: 700 }}>
              Balanced host-guest policy
            </span>
          </div>

          {/* Tier 3: Strict */}
          <div style={{ background: 'var(--white)', padding: '1.5rem', borderRadius: '18px', border: '1.5px solid #EF4444', boxShadow: 'var(--shadow-sm)' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#EF4444', textTransform: 'uppercase' }}>Tier 3: Strict</span>
            <h4 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--ink)', margin: '0.4rem 0' }}>Strict Policy (Luxury Villas)</h4>
            <p style={{ fontSize: '0.84rem', color: 'var(--gray-600)', margin: '0 0 0.75rem 0' }}>
              Full refund for cancellations made within 48 hours of booking if the check-in date is at least 14 days away. 50% refund up to 7 days before check-in. Non-refundable within 7 days of arrival.
            </p>
            <span style={{ fontSize: '0.75rem', color: '#DC2626', background: 'rgba(239, 68, 68, 0.1)', padding: '0.2rem 0.5rem', borderRadius: '6px', fontWeight: 700 }}>
              High-value &amp; Estate listings
            </span>
          </div>

          {/* Tier 4: Zero-Broker Leases */}
          <div style={{ background: 'var(--white)', padding: '1.5rem', borderRadius: '18px', border: '1.5px solid var(--violet)', boxShadow: 'var(--shadow-sm)' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--violet)', textTransform: 'uppercase' }}>Zero-Broker Leases</span>
            <h4 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--ink)', margin: '0.4rem 0' }}>100% Deposit Protection</h4>
            <p style={{ fontSize: '0.84rem', color: 'var(--gray-600)', margin: '0 0 0.75rem 0' }}>
              Full security deposit refunded upon tenancy completion with mandatory digital move-out inspection and 30-day lease exit notice.
            </p>
            <span style={{ fontSize: '0.75rem', color: 'var(--violet)', background: 'rgba(157, 0, 255, 0.1)', padding: '0.2rem 0.5rem', borderRadius: '6px', fontWeight: 700 }}>
              Monthly &amp; Long-term stays
            </span>
          </div>
        </div>

        {/* Detailed Strict Policy Explanation Section */}
        <section style={{ background: 'var(--white)', padding: '2rem', borderRadius: '20px', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--ink)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <AlertCircle size={20} style={{ color: '#EF4444' }} />
            Understanding the Strict Cancellation Policy
          </h3>
          <p style={{ fontSize: '0.92rem', color: 'var(--gray-700)', marginBottom: '1.2rem' }}>
            The <strong>Strict Policy</strong> applies primarily to private luxury villas, heritage estates, and high-demand holiday homes where hosts hold exclusive private inventory for reserved guests.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
            <div style={{ background: 'var(--surface)', padding: '1.2rem', borderRadius: '14px', borderLeft: '4px solid #10B981' }}>
              <strong style={{ color: 'var(--ink)', fontSize: '0.95rem', display: 'block', marginBottom: '0.3rem' }}>48-Hour Grace Window</strong>
              <p style={{ fontSize: '0.82rem', color: 'var(--gray-600)', margin: 0 }}>
                100% refund if cancelled within 48 hours of booking, provided check-in is at least 14 days away.
              </p>
            </div>

            <div style={{ background: 'var(--surface)', padding: '1.2rem', borderRadius: '14px', borderLeft: '4px solid #F59E0B' }}>
              <strong style={{ color: 'var(--ink)', fontSize: '0.95rem', display: 'block', marginBottom: '0.3rem' }}>7 to 14 Days Before Check-in</strong>
              <p style={{ fontSize: '0.82rem', color: 'var(--gray-600)', margin: 0 }}>
                50% refund of the total booking amount + 100% refund of cleaning fees.
              </p>
            </div>

            <div style={{ background: 'var(--surface)', padding: '1.2rem', borderRadius: '14px', borderLeft: '4px solid #EF4444' }}>
              <strong style={{ color: 'var(--ink)', fontSize: '0.95rem', display: 'block', marginBottom: '0.3rem' }}>Less than 7 Days Before Check-in</strong>
              <p style={{ fontSize: '0.82rem', color: 'var(--gray-600)', margin: 0 }}>
                Non-refundable. Cleaning fees are fully refunded if the guest has not checked in.
              </p>
            </div>
          </div>
        </section>

        {/* Processing Timelines Section */}
        <section style={{ background: 'var(--surface)', padding: '1.75rem', borderRadius: '18px', border: '1px solid var(--border)' }}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--ink)', marginBottom: '0.6rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Clock size={18} style={{ color: '#10B981' }} />
            Automated Refund Processing Timelines
          </h3>
          <p style={{ margin: '0 0 0.8rem 0' }}>
            Once a cancellation is confirmed on the Stay Q platform or app, the refund is initiated automatically via our Cashfree Banking Gateway:
          </p>
          <ul style={{ paddingLeft: '1.25rem', margin: 0, display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.9rem' }}>
            <li><strong>UPI &amp; Instant NetBanking:</strong> Direct refund credited within <strong>2 to 4 hours</strong>.</li>
            <li><strong>Credit &amp; Debit Cards:</strong> Settled within <strong>3 to 5 business days</strong> per standard bank clearing cycles.</li>
            <li><strong>Zero Cancellation Surcharge:</strong> Stay Q charges ₹0 processing or penalty fees on eligible refunds.</li>
          </ul>
        </section>
      </div>
    </div>
  );
};
