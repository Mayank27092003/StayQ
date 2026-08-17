import React from 'react';
import { ShieldCheck, FileCheck, CheckCircle2, AlertCircle } from 'lucide-react';

export const HostProtectionPolicy: React.FC = () => {
  return (
    <div className="shell" style={{ padding: '7.5rem 1rem 6rem', maxWidth: '840px' }}>
      <div style={{ marginBottom: '2.5rem' }}>
        <span style={{ fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--violet)', background: 'rgba(90, 49, 244, 0.08)', padding: '0.35rem 0.85rem', borderRadius: '999px', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
          <ShieldCheck size={14} /> Host Protection &amp; Safety Standards
        </span>
        <h1 className="h1" style={{ marginTop: '0.75rem', marginBottom: '0.5rem' }}>
          Host Property Protection Policy
        </h1>
        <p className="lead" style={{ color: 'var(--gray-600)', fontSize: '1rem' }}>
          Stay Q is committed to safeguarding our host community with mandatory guest identity verification, clear house rule enforcement, and structured damage resolution.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem', fontSize: '0.95rem', lineHeight: 1.7, color: 'var(--gray-700)' }}>
        <section style={{ background: 'var(--white)', padding: '1.75rem', borderRadius: '18px', border: '1px solid var(--border)' }}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--ink)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FileCheck size={18} style={{ color: 'var(--violet)' }} />
            1. Guest Identity Verification &amp; KYC
          </h3>
          <p>
            To ensure the security of your property, all guests booking through Stay Q are required to provide valid government-issued identification prior to check-in. Hosts receive guest details and confirmed booking headcounts in advance.
          </p>
        </section>

        <section style={{ background: 'var(--white)', padding: '1.75rem', borderRadius: '18px', border: '1px solid var(--border)' }}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--ink)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <CheckCircle2 size={18} style={{ color: '#10B981' }} />
            2. House Rules Enforcement &amp; Security Deposits
          </h3>
          <ul style={{ paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <li><strong>Custom House Rules:</strong> Hosts define explicit pet policies, quiet hours, maximum occupancy, and smoking guidelines that guests agree to upon booking.</li>
            <li><strong>Security Deposit Management:</strong> Hosts may opt to collect refundable damage deposits held securely through our platform.</li>
            <li><strong>Damage Reporting:</strong> If damage or rule violations occur, hosts can submit documentation within 48 hours of check-out for resolution desk review.</li>
          </ul>
        </section>

        <section style={{ background: 'var(--surface)', padding: '1.75rem', borderRadius: '18px', border: '1px solid var(--border)' }}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--ink)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <AlertCircle size={18} style={{ color: 'var(--violet)' }} />
            3. Dispute Resolution &amp; Support
          </h3>
          <p>
            In the event of property damage or guest disputes, our Resolution Team acts as an objective mediator to review evidence (pre-stay and post-stay photos/invoices) and facilitate appropriate settlements between parties. Contact our host desk at <a href="mailto:grievance@stayq.space" style={{ color: 'var(--violet)', fontWeight: 700 }}>grievance@stayq.space</a>.
          </p>
        </section>
      </div>
    </div>
  );
};
