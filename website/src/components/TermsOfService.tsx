import React from 'react';
import { Scale } from 'lucide-react';

export const TermsOfService: React.FC = () => {
  return (
    <div className="shell" style={{ padding: '7.5rem 1rem 6rem', maxWidth: '840px' }}>
      <div style={{ marginBottom: '2.5rem' }}>
        <span style={{ fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--violet)', background: 'rgba(90, 49, 244, 0.08)', padding: '0.35rem 0.85rem', borderRadius: '999px', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
          <Scale size={14} /> Legal Terms &amp; Conditions
        </span>
        <h1 className="h1" style={{ marginTop: '0.75rem', marginBottom: '0.5rem' }}>
          Stay Q Terms of Service &amp; User Agreement
        </h1>
        <p className="lead" style={{ color: 'var(--gray-600)', fontSize: '1rem' }}>
          Last Updated: August 15, 2026 · Effective across all Stay Q web platforms, mobile applications, and partner network.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', fontSize: '0.95rem', lineHeight: 1.7, color: 'var(--gray-700)' }}>
        <section style={{ background: 'var(--surface)', padding: '1.5rem', borderRadius: '18px', border: '1px solid var(--border)' }}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--ink)', marginBottom: '0.6rem' }}>
            1. Acceptance of Agreement
          </h3>
          <p>
            By accessing or using the Stay Q website, mobile application, or related booking services operated by <strong>QUATALYST PRIVATE LIMITED (CIN: U62011GA2026PTC018230)</strong>, you agree to comply with and be bound by these Terms of Service, our Privacy Policy, Cancellation Policy, and Guest Rules.
          </p>
        </section>

        <section style={{ background: 'var(--white)', padding: '1.5rem', borderRadius: '18px', border: '1px solid var(--border)' }}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--ink)', marginBottom: '0.6rem' }}>
            2. Verified Guest &amp; Host Obligations
          </h3>
          <ul style={{ paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <li><strong>Identity Verification:</strong> Guests must provide valid government-issued photo identification (Aadhaar, Passport, or Voter ID) prior to or upon physical check-in.</li>
            <li><strong>Host Listing Accuracy:</strong> Hosts warrant that all photographs, amenity disclosures, and location pins represent actual property conditions.</li>
            <li><strong>House Rules &amp; Zero-Tolerance Noise:</strong> Guests must respect property-specific quiet hours (typically 10:00 PM – 7:00 AM) and local community guidelines.</li>
          </ul>
        </section>

        <section style={{ background: 'var(--white)', padding: '1.5rem', borderRadius: '18px', border: '1px solid var(--border)' }}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--ink)', marginBottom: '0.6rem' }}>
            3. Payments, Deposits &amp; Zero-Brokerage Transparency
          </h3>
          <p>
            All financial transactions are processed securely through RBI-licensed payment gateways. For short-term boutique stays, nightly pricing is inclusive of listed amenities. For 11-month Zero-Broker long-term rentals, security deposits are held directly under standard digital tenancy agreements with 100% refund compliance upon lease termination.
          </p>
        </section>

        <section style={{ background: 'var(--white)', padding: '1.5rem', borderRadius: '18px', border: '1px solid var(--border)' }}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--ink)', marginBottom: '0.6rem' }}>
            4. Limitation of Liability &amp; Dispute Resolution
          </h3>
          <p>
            Stay Q facilitates trusted marketplace connections and underwrites verified host protection. Any disputes arising under this agreement shall be governed by the laws of India and subject to the exclusive jurisdiction of the courts of Bengaluru, Karnataka.
          </p>
        </section>
      </div>
    </div>
  );
};
