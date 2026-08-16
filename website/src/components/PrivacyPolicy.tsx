import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, ChevronDown } from 'lucide-react';
import { Nav } from './Nav';

const privacyData = [
  {
    id: "introduction",
    title: "1. Introduction",
    content: (
      <>
        <p>Welcome to Stay Q, a platform by Quatalyst Private Limited. We are committed to protecting your personal information and your right to privacy.</p>
        <p>This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website (www.stayq.space), use our mobile application, or use any of our services.</p>
        <p>By using Stay Q, you consent to the data practices described in this policy.</p>
      </>
    )
  },
  {
    id: "info-we-collect",
    title: "2. Information We Collect",
    content: (
      <>
        <p>We collect personal information that you voluntarily provide to us when you register on the platform, express an interest in obtaining information about us or our products and services, or otherwise contact us.</p>
        <ul>
          <li><strong>Personal Information:</strong> Name, email address, phone number, date of birth, government ID (for verification).</li>
          <li><strong>Booking Data:</strong> Stay history, preferences, reviews, messages with hosts.</li>
          <li><strong>Payment Information:</strong> Processed securely by our payment partners; we do not store full credit card details.</li>
          <li><strong>Device & Usage Info:</strong> IP address, browser type, operating system, device identifiers, app usage statistics.</li>
          <li><strong>Location Data:</strong> To provide location-based services like finding nearby stays (with your permission).</li>
        </ul>
      </>
    )
  },
  {
    id: "how-we-use",
    title: "3. How We Use Your Information",
    content: (
      <>
        <p>We use the information we collect or receive for various purposes, including:</p>
        <ul>
          <li>To facilitate account creation and logon process.</li>
          <li>To process bookings, payments, and refunds.</li>
          <li>To communicate with you (confirmations, updates, support).</li>
          <li>To personalize your experience and power Qube AI recommendations.</li>
          <li>To enforce our terms, conditions, and policies.</li>
          <li>To keep our platform safe and secure (fraud prevention, identity verification).</li>
        </ul>
      </>
    )
  },
  {
    id: "info-sharing",
    title: "4. Information Sharing",
    content: (
      <>
        <p>We only share information with your consent, to comply with laws, to provide you with services, to protect your rights, or to fulfill business obligations.</p>
        <ul>
          <li><strong>Between Hosts and Guests:</strong> When a booking is made, necessary info (name, profile, contact) is shared.</li>
          <li><strong>Service Providers:</strong> Payment processors, cloud hosting, customer support tools, analytics providers.</li>
          <li><strong>Legal Requirements:</strong> We may disclose information if required by law, subpoena, or similar legal process.</li>
          <li><strong>Business Transfers:</strong> In connection with any merger, sale of company assets, financing, or acquisition.</li>
        </ul>
      </>
    )
  },
  {
    id: "data-security",
    title: "5. Data Security",
    content: (
      <>
        <p>We have implemented appropriate technical and organizational security measures designed to protect the security of any personal information we process. This includes encryption, secure storage, and strict access controls.</p>
        <p>However, despite our safeguards and efforts to secure your information, no electronic transmission over the Internet or information storage technology can be guaranteed to be 100% secure.</p>
      </>
    )
  },
  {
    id: "your-rights",
    title: "6. Your Rights",
    content: (
      <>
        <p>Depending on your location, you may have the following rights regarding your personal information:</p>
        <ul>
          <li><strong>Access:</strong> Request a copy of your personal data.</li>
          <li><strong>Correction:</strong> Request correction of inaccurate data.</li>
          <li><strong>Deletion:</strong> Request deletion of your personal data (subject to legal obligations).</li>
          <li><strong>Data Portability:</strong> Request transfer of your data to another organization.</li>
        </ul>
        <p>To exercise these rights, please contact us at support@stayq.space.</p>
      </>
    )
  },
  {
    id: "cookies",
    title: "7. Cookies & Tracking",
    content: (
      <>
        <p>We use cookies and similar tracking technologies to access or store information. This helps us understand how you use Stay Q, remember your preferences, and improve our services.</p>
        <p>You can set your browser to refuse all or some browser cookies, but this may affect how the platform functions.</p>
      </>
    )
  },
  {
    id: "third-party",
    title: "8. Third-Party Services",
    content: (
      <>
        <p>Our platform may contain links to third-party websites and applications. We are not responsible for the privacy practices or the content of these third parties.</p>
      </>
    )
  },
  {
    id: "children",
    title: "9. Children's Privacy",
    content: (
      <>
        <p>Stay Q is not intended for use by individuals under the age of 18. We do not knowingly collect personal information from children. If we learn we have collected such info, we will delete it promptly.</p>
      </>
    )
  },
  {
    id: "data-retention",
    title: "10. Data Retention",
    content: (
      <>
        <p>We will only keep your personal information for as long as it is necessary for the purposes set out in this privacy notice, unless a longer retention period is required or permitted by law (such as tax, accounting, or other legal requirements).</p>
      </>
    )
  },
  {
    id: "international-transfers",
    title: "11. International Transfers",
    content: (
      <>
        <p>Your information may be transferred to, and maintained on, computers located outside of your state, province, country, or other governmental jurisdiction where the data protection laws may differ.</p>
      </>
    )
  },
  {
    id: "changes",
    title: "12. Changes to This Policy",
    content: (
      <>
        <p>We may update this privacy notice from time to time. The updated version will be indicated by an updated "Effective Date" and the updated version will be effective as soon as it is accessible.</p>
      </>
    )
  },
  {
    id: "contact",
    title: "13. Contact & Grievance Officer",
    content: (
      <>
        <p>If you have questions, comments, or statutory grievances about this notice or personal data handling, reach out to:</p>
        <p>
          <strong>Grievance Officer:</strong> Shayan Mandal<br />
          <strong>Grievance Email:</strong> <a href="mailto:grivance@stayq.space" style={{ color: 'var(--violet)', fontWeight: 700 }}>grivance@stayq.space</a> (alt: grievance@stayq.space)<br />
          <strong>General Support:</strong> <a href="mailto:support@stayq.space" style={{ color: 'var(--violet)', fontWeight: 700 }}>support@stayq.space</a><br />
          <strong>Entity:</strong> QUATALYST PRIVATE LIMITED (CIN: U62011GA2026PTC018230)
        </p>
      </>
    )
  }
];

export function PrivacyPolicy() {
  const [activeId, setActiveId] = useState<string>('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      { rootMargin: '-20% 0px -60% 0px' }
    );

    document.querySelectorAll('section.policy-section').forEach((section) => {
      observer.observe(section);
    });

    return () => observer.disconnect();
  }, []);

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      const y = el.getBoundingClientRect().top + window.scrollY - 100;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
    setIsMobileMenuOpen(false);
  };

  return (
    <div className="policy-page privacy__page">
      <Nav />
      
      <main className="policy-main">
        {/* Header Banner */}
        <div className="policy-header-banner privacy-header">
          <div className="policy-container">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="policy-header-content"
            >
              <div className="policy-icon-wrapper">
                <Shield size={32} />
              </div>
              <h1 className="policy-title">Privacy Policy</h1>
              <div className="policy-meta">
                <span>Effective Date: 01/08/2026</span>
                <span className="policy-meta-dot">•</span>
                <span>Quatalyst Private Limited</span>
              </div>
            </motion.div>
          </div>
        </div>

        <div className="policy-container policy-layout">
          {/* Mobile TOC Dropdown */}
          <div className="policy-mobile-toc">
            <button 
              className="policy-mobile-toc-btn"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              <span>Table of Contents</span>
              <ChevronDown size={20} className={isMobileMenuOpen ? 'rotate-180' : ''} />
            </button>
            {isMobileMenuOpen && (
              <div className="policy-mobile-toc-menu">
                {privacyData.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => scrollToSection(item.id)}
                    className={`policy-mobile-toc-link ${activeId === item.id ? 'active' : ''}`}
                  >
                    {item.title}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Desktop Sidebar */}
          <aside className="policy-sidebar">
            <div className="policy-toc">
              <h3 className="policy-toc-title">Contents</h3>
              <nav className="policy-toc-nav">
                {privacyData.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => scrollToSection(item.id)}
                    className={`policy-toc-link ${activeId === item.id ? 'active' : ''}`}
                  >
                    {item.title}
                  </button>
                ))}
              </nav>
            </div>
          </aside>

          {/* Content Area */}
          <div className="policy-content">
            {privacyData.map((item) => (
              <motion.section
                key={item.id}
                id={item.id}
                className="policy-section"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                <h2 className="policy-section-title">{item.title}</h2>
                <div className="policy-section-body">
                  {item.content}
                </div>
              </motion.section>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
