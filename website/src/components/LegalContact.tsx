import React from 'react';
import { Scale, Building, Clock, MapPin, ShieldCheck } from 'lucide-react';

export const LegalContact: React.FC = () => {
  return (
    <div className="shell" style={{ padding: '7.5rem 1rem 6rem', maxWidth: '840px' }}>
      <div style={{ marginBottom: '2.5rem' }}>
        <span style={{ fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--violet)', background: 'rgba(90, 49, 244, 0.08)', padding: '0.35rem 0.85rem', borderRadius: '999px', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
          <Scale size={14} /> Statutory Regulatory Desk
        </span>
        <h1 className="h1" style={{ marginTop: '0.75rem', marginBottom: '0.5rem' }}>
          Grievance Officer &amp; Legal Notices
        </h1>
        <p className="lead" style={{ color: 'var(--gray-600)', fontSize: '1rem' }}>
          Statutory compliance under the Information Technology Act, 2000 &amp; Consumer Protection (E-Commerce) Rules, 2020.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', fontSize: '0.95rem', lineHeight: 1.7, color: 'var(--gray-700)' }}>
        {/* Nodal Officer Card */}
        <section style={{ background: 'var(--white)', padding: '2rem', borderRadius: '24px', border: '1.5px solid var(--border)', boxShadow: 'var(--shadow-md)' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--ink)', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Building size={20} style={{ color: 'var(--violet)' }} />
            Appointed Grievance Officer
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem' }}>
            <div>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--gray-500)', textTransform: 'uppercase' }}>Officer Name</span>
              <strong style={{ fontSize: '1.15rem', color: 'var(--ink)', display: 'block', marginTop: '0.2rem' }}>Shayan Mandal</strong>
            </div>

            <div>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--gray-500)', textTransform: 'uppercase' }}>Designation</span>
              <span style={{ fontSize: '0.95rem', color: 'var(--ink)', display: 'block', fontWeight: 600, marginTop: '0.2rem' }}>Nodal Grievance &amp; Compliance Head</span>
            </div>

            <div>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--gray-500)', textTransform: 'uppercase' }}>Official Email</span>
              <a href="mailto:grievance@stayq.space" style={{ fontSize: '0.95rem', color: 'var(--violet)', display: 'block', fontWeight: 700, textDecoration: 'none', marginTop: '0.2rem' }}>
                grievance@stayq.space
              </a>
              <span style={{ fontSize: '0.75rem', color: 'var(--gray-500)' }}>Direct Nodal Inbox</span>
            </div>

            <div>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--gray-500)', textTransform: 'uppercase' }}>Acknowledgement SLA</span>
              <span style={{ fontSize: '0.95rem', color: '#10B981', display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 700, marginTop: '0.2rem' }}>
                <Clock size={16} /> Within 48 Hours
              </span>
            </div>
          </div>

          <div style={{ marginTop: '1.75rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border)' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--gray-500)', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <MapPin size={14} style={{ color: 'var(--violet)' }} /> Registered Corporate Entity &amp; Address
            </span>
            <p style={{ margin: '0.4rem 0 0', color: 'var(--ink)', fontWeight: 600, fontSize: '1rem', lineHeight: 1.6 }}>
              QUATALYST PRIVATE LIMITED<br />
              <span style={{ fontSize: '0.85rem', color: 'var(--gray-600)', fontWeight: 500 }}>
                Corporate Identification Number (CIN): <strong>U62011GA2026PTC018230</strong>
              </span><br />
              <span style={{ fontSize: '0.85rem', color: 'var(--gray-600)', fontWeight: 500 }}>
                Operating platform: Stay Q (www.stayq.space)
              </span>
            </p>
          </div>
        </section>

        {/* Grievance Redressal Mechanism & Timelines */}
        <section style={{ background: 'var(--surface)', padding: '1.75rem', borderRadius: '20px', border: '1px solid var(--border)' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--ink)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ShieldCheck size={18} style={{ color: '#10B981' }} />
            Statutory Redressal Mechanism
          </h3>
          <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--gray-600)', lineHeight: 1.7 }}>
            In accordance with the Information Technology (Intermediary Guidelines and Digital Media Ethics Code) Rules, 2021, any consumer or host grievance addressed to the Grievance Officer will be acknowledged within forty-eight (48) hours and redressed within fifteen (15) days from the date of its receipt.
          </p>
        </section>
      </div>
    </div>
  );
};
