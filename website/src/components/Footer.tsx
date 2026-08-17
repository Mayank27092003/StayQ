import { Mail, Globe, ShieldCheck, Lock, Scale, CheckCircle2, HeartHandshake } from 'lucide-react';

export function Footer() {
  return (
    <footer className="footer" style={{ background: '#0F0D15', color: '#E4E4E7', paddingTop: '4.5rem', paddingBottom: '3rem', borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
      <div className="shell" style={{ maxWidth: '1280px' }}>
        {/* Main Footer Columns */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '2.5rem',
            marginBottom: '3.5rem',
          }}
        >
          {/* Brand & Corporate Summary */}
          <div style={{ gridColumn: 'span 1' }}>
            <a
              className="nav__brand"
              href="#/"
              onClick={(e) => {
                e.preventDefault();
                window.location.hash = '#/';
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.65rem', marginBottom: '1rem', textDecoration: 'none' }}
            >
              <img className="nav__logo" src="/images/logo_sq.png" alt="Stay Q Logo" style={{ width: '34px', height: '34px' }} />
              <span style={{ fontSize: '1.4rem', fontWeight: 900, color: '#ffffff', letterSpacing: '-0.02em' }}>Stay Q</span>
            </a>

            <p style={{ fontSize: '0.82rem', lineHeight: 1.6, color: '#A1A1AA', marginBottom: '1.25rem' }}>
              Handpicked boutique villas, alpine cabins, and zero-broker rental residences. A platform by Quatalyst Private Limited. Powered by Qube AI.
            </p>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <a
                href="mailto:grievance@stayq.space"
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  background: 'rgba(255, 255, 255, 0.08)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ffffff',
                  textDecoration: 'none',
                }}
                aria-label="Email Stay Q Official Desk"
                title="Email Stay Q (grievance@stayq.space)"
              >
                <Mail size={16} />
              </a>
              <a
                href="#/"
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  background: 'rgba(255, 255, 255, 0.08)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ffffff',
                  textDecoration: 'none',
                }}
                aria-label="Stay Q Space"
                title="www.stayq.space"
              >
                <Globe size={16} />
              </a>
            </div>
          </div>

          {/* Column 1: Explore Stays */}
          <div>
            <h4 style={{ fontSize: '0.85rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#ffffff', marginBottom: '1.1rem' }}>
              Explore Stays
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              <a href="#/stays" style={{ color: '#A1A1AA', fontSize: '0.82rem', textDecoration: 'none' }}>Luxury Private Villas</a>
              <a href="#/stays" style={{ color: '#A1A1AA', fontSize: '0.82rem', textDecoration: 'none' }}>Himalayan Cabins &amp; Cottages</a>
              <a href="#/stays" style={{ color: '#A1A1AA', fontSize: '0.82rem', textDecoration: 'none' }}>Rainforest Treehouses</a>
              <a href="#/stays" style={{ color: '#A1A1AA', fontSize: '0.82rem', textDecoration: 'none' }}>Heritage Havelis &amp; Palaces</a>
              <a href="#/experiences" style={{ color: '#A1A1AA', fontSize: '0.82rem', textDecoration: 'none' }}>Curated Travel Experiences</a>
              <a href="#/stays" style={{ color: '#A1A1AA', fontSize: '0.82rem', textDecoration: 'none' }}>Off-Grid RVs &amp; Stargazing</a>
            </div>
          </div>

          {/* Column 2: Zero-Broker Living */}
          <div>
            <h4 style={{ fontSize: '0.85rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#ffffff', marginBottom: '1.1rem' }}>
              Zero-Broker Living
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              <a href="#/zero-broker" style={{ color: '#A1A1AA', fontSize: '0.82rem', textDecoration: 'none' }}>11-Month Long Term Rentals</a>
              <a href="#/zero-broker" style={{ color: '#A1A1AA', fontSize: '0.82rem', textDecoration: 'none' }}>Verified Owner Direct Connect</a>
              <a href="#/policy/zero-brokerage" style={{ color: '#A1A1AA', fontSize: '0.82rem', textDecoration: 'none' }}>Zero Brokerage Fair Charter</a>
              <a href="#/zero-broker" style={{ color: '#A1A1AA', fontSize: '0.82rem', textDecoration: 'none' }}>Digital Tenancy Agreements</a>
              <a href="#/zero-broker" style={{ color: '#A1A1AA', fontSize: '0.82rem', textDecoration: 'none' }}>Tenant Identity Vetting</a>
            </div>
          </div>

          {/* Column 3: Host & Partner Hub */}
          <div>
            <h4 style={{ fontSize: '0.85rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#ffffff', marginBottom: '1.1rem' }}>
              Host &amp; Partner Hub
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              <a href="#/partner" style={{ color: '#A1A1AA', fontSize: '0.82rem', textDecoration: 'none' }}>List Your Property (Host Onboarding)</a>
              <a href="#/partner" style={{ color: '#A1A1AA', fontSize: '0.82rem', textDecoration: 'none' }}>Earnings &amp; Payout Terms</a>
              <a href="#/policy/host-protection" style={{ color: '#A1A1AA', fontSize: '0.82rem', textDecoration: 'none' }}>Host Protection &amp; Standards</a>
              <a href="#/partner" style={{ color: '#A1A1AA', fontSize: '0.82rem', textDecoration: 'none' }}>Automated Payout Settlements</a>
              <a href="/StayQ-Release.apk" download style={{ color: '#A1A1AA', fontSize: '0.82rem', textDecoration: 'none' }}>Download Host Mobile APK</a>
            </div>
          </div>

          {/* Column 4: Legal & Governance (Directly from Privacy Policy & Guidelines) */}
          <div>
            <h4 style={{ fontSize: '0.85rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#A78BFA', marginBottom: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Scale size={15} /> Legal &amp; Policies
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              <a href="#/about" style={{ color: '#ffffff', fontWeight: 600, fontSize: '0.82rem', textDecoration: 'none' }}>About Stay Q (Quatalyst Pvt. Ltd.)</a>
              <a href="#/guest-rules" style={{ color: '#ffffff', fontWeight: 600, fontSize: '0.82rem', textDecoration: 'none' }}>Guest House Rules (39 Articles)</a>
              <a href="#/privacy" style={{ color: '#ffffff', fontWeight: 600, fontSize: '0.82rem', textDecoration: 'none' }}>Privacy Policy (13 Sections)</a>
              <a href="#/terms" style={{ color: '#ffffff', fontWeight: 600, fontSize: '0.82rem', textDecoration: 'none' }}>Terms of Service</a>
              <a href="#/policy/refunds" style={{ color: '#ffffff', fontWeight: 600, fontSize: '0.82rem', textDecoration: 'none' }}>Cancellation &amp; Refund Policy</a>
              <a href="#/policy/disruptive-events" style={{ color: '#ffffff', fontWeight: 600, fontSize: '0.82rem', textDecoration: 'none' }}>Disruptive Events &amp; Force Majeure</a>
              <a href="#/policy/host-protection" style={{ color: '#ffffff', fontWeight: 600, fontSize: '0.82rem', textDecoration: 'none' }}>Host Property Protection Policy</a>
              <a href="#/policy/guest-safety" style={{ color: '#ffffff', fontWeight: 600, fontSize: '0.82rem', textDecoration: 'none' }}>Guest Safety &amp; Anti-Discrimination</a>
              <a href="#/legal-contact" style={{ color: '#A78BFA', fontWeight: 700, fontSize: '0.82rem', textDecoration: 'none' }}>Contact &amp; Grievance Desk</a>
            </div>
          </div>
        </div>

        {/* Authentic Security & Trust Pillars */}
        <div
          style={{
            background: 'rgba(255, 255, 255, 0.03)',
            borderRadius: '20px',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            padding: '1.5rem',
            marginBottom: '2.5rem',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '1.25rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Lock size={22} style={{ color: '#10B981', flexShrink: 0 }} />
            <div>
              <strong style={{ fontSize: '0.82rem', color: '#ffffff', display: 'block' }}>Data Security &amp; Encryption</strong>
              <span style={{ fontSize: '0.72rem', color: '#71717A' }}>Technical &amp; organizational safeguards</span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <ShieldCheck size={22} style={{ color: '#38BDF8', flexShrink: 0 }} />
            <div>
              <strong style={{ fontSize: '0.82rem', color: '#ffffff', display: 'block' }}>Identity &amp; KYC Verification</strong>
              <span style={{ fontSize: '0.72rem', color: '#71717A' }}>Government ID verified guest &amp; host community</span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <CheckCircle2 size={22} style={{ color: '#A78BFA', flexShrink: 0 }} />
            <div>
              <strong style={{ fontSize: '0.82rem', color: '#ffffff', display: 'block' }}>Secure Payment Processing</strong>
              <span style={{ fontSize: '0.72rem', color: '#71717A' }}>RBI-compliant gateway; zero full card storage</span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <HeartHandshake size={22} style={{ color: '#F59E0B', flexShrink: 0 }} />
            <div>
              <strong style={{ fontSize: '0.82rem', color: '#ffffff', display: 'block' }}>Zero-Broker Direct Connect</strong>
              <span style={{ fontSize: '0.72rem', color: '#71717A' }}>Transparent pricing connecting guests &amp; owners</span>
            </div>
          </div>
        </div>

        {/* Corporate & Regulatory Statutory Text */}
        <div
          style={{
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            paddingTop: '1.75rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
            fontSize: '0.75rem',
            color: '#71717A',
            lineHeight: 1.6,
          }}
        >
          <p style={{ margin: 0 }}>
            <strong>Platform Ownership &amp; Privacy Notice:</strong> Stay Q (www.stayq.space) is operated by <strong>Quatalyst Private Limited</strong>, India. All personal data collection, processing, user rights (Access, Correction, Deletion, Portability), and cookie preferences strictly adhere to our 13-point Privacy Policy.
          </p>

          <p style={{ margin: 0 }}>
            <strong>Support &amp; Grievances:</strong> For assistance, bookings, inquiries, or legal grievances, reach out directly to our official desk at <a href="mailto:grievance@stayq.space" style={{ color: '#A78BFA', fontWeight: 600 }}>grievance@stayq.space</a>.
          </p>

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '1rem',
              paddingTop: '0.75rem',
            }}
          >
            <span>&copy; {new Date().getFullYear()} Quatalyst Private Limited (Stay Q). All rights reserved.</span>
            <div style={{ display: 'flex', gap: '1.25rem' }}>
              <a href="#/privacy" style={{ color: '#A1A1AA', textDecoration: 'none' }}>Privacy Policy</a>
              <a href="#/terms" style={{ color: '#A1A1AA', textDecoration: 'none' }}>Terms of Service</a>
              <a href="#/policy/refunds" style={{ color: '#A1A1AA', textDecoration: 'none' }}>Refund Policy</a>
              <a href="#/legal-contact" style={{ color: '#A1A1AA', textDecoration: 'none' }}>Contact &amp; Grievance</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
