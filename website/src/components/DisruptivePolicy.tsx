import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, ChevronDown } from 'lucide-react';
import { Nav } from './Nav';

// The full policy content structured for rendering
const policyData = [
  {
    id: "overview",
    title: "1. Overview",
    content: (
      <>
        <p>In most situations, cancellations and refunds for Stay Q reservations are governed by the cancellation policy applicable to the property or booking.</p>
        <p>However, in exceptional circumstances, a major event may occur that prevents a guest or host from reasonably completing a reservation. In such situations, the Stay Q Major Disruptive Events Policy ("Policy") may apply.</p>
        <p>When this Policy is activated, eligible guests may be permitted to cancel an affected reservation and receive a full or partial refund, Stay Q travel credit, or another appropriate remedy, regardless of the property's standard cancellation policy.</p>
        <p>Hosts may also be permitted to cancel affected reservations without cancellation penalties or other adverse consequences, subject to this Policy.</p>
        <p>This Policy may apply to eligible accommodation bookings and other Stay Q services where applicable.</p>
        <p>This Policy is not an insurance policy and does not provide insurance coverage.</p>
      </>
    )
  },
  {
    id: "covered-events",
    title: "2. Events Covered Under This Policy",
    content: (
      <>
        <p>The Policy may apply when an exceptional event:</p>
        <ol>
          <li>occurs after the reservation was made;</li>
          <li>affects the location of the booked property or service;</li>
          <li>is outside the reasonable control of the guest and host; and</li>
          <li>prevents or legally prohibits the completion of the reservation.</li>
        </ol>
        <p>Covered events may include:</p>
        
        <h3>A. Government-Declared Public Health Emergencies</h3>
        <p>Government-declared epidemics, pandemics, or significant public health emergencies may qualify where they directly affect the reservation location and prevent or legally restrict the stay.</p>
        <p>Ordinary illnesses, seasonal diseases, or health conditions that are generally expected in a particular location will not normally qualify.</p>
        <p>Stay Q may determine the geographical area and period for which a public health event is covered.</p>
        
        <h3>B. Mandatory Government Travel Restrictions</h3>
        <p>Mandatory restrictions imposed by a government or competent authority may qualify. Examples may include:</p>
        <ul>
          <li>Mandatory evacuation orders</li>
          <li>Legally enforced lockdowns</li>
          <li>Government-imposed travel bans</li>
          <li>Mandatory closure of the relevant area</li>
          <li>Restrictions that legally prevent access to the property</li>
        </ul>
        <p>General government advice, recommendations, warnings, or non-binding travel advisories will not normally qualify.</p>
        
        <h3>C. War, Terrorism & Major Civil Disturbances</h3>
        <p>The Policy may cover significant events such as:</p>
        <ul>
          <li>Acts of war</li>
          <li>Armed conflict</li>
          <li>Terrorist attacks</li>
          <li>Invasions</li>
          <li>Civil unrest</li>
          <li>Riots</li>
          <li>Rebellion</li>
          <li>Insurrection</li>
          <li>Major explosions or bombings</li>
        </ul>
        <p>The event must materially affect the reservation location and prevent or legally prohibit completion of the stay.</p>

        <h3>D. Large-Scale Essential Utility Failures</h3>
        <p>A prolonged and widespread failure of essential services may qualify where it materially affects the reservation location. Examples include significant outages affecting:</p>
        <ul>
          <li>Electricity</li>
          <li>Water supply</li>
          <li>Heating or cooling systems</li>
          <li>Other essential utilities</li>
        </ul>
        <p>A temporary or isolated utility interruption at an individual property will not automatically qualify under this Policy.</p>

        <h3>E. Major Natural Disasters & Severe Weather</h3>
        <p>Unexpected and significant natural disasters or severe weather events may qualify where they make the reservation impossible or legally prohibited. Examples may include:</p>
        <ul>
          <li>Earthquakes</li>
          <li>Tsunamis</li>
          <li>Major floods</li>
          <li>Severe cyclones</li>
          <li>Tornadoes</li>
          <li>Major wildfires</li>
          <li>Other extraordinary natural disasters</li>
        </ul>
        <p>Normal or seasonal weather conditions that are reasonably foreseeable for a particular location will generally not qualify.</p>
      </>
    )
  },
  {
    id: "when-applicable",
    title: "3. When the Policy Becomes Applicable",
    content: (
      <>
        <p>Stay Q will assess major events on a case-by-case basis.</p>
        <p>When we determine that a qualifying event is likely to prevent or legally prohibit reservations in a particular location, Stay Q may activate this Policy for:</p>
        <ul>
          <li>A specific geographical area;</li>
          <li>A defined period of time; and</li>
          <li>Eligible reservations affected by the event.</li>
        </ul>
        <p>The Policy may not automatically apply to every reservation in a country, state, city, or region.</p>
        <p>Stay Q may expand, reduce, or deactivate coverage as circumstances change.</p>
      </>
    )
  },
  {
    id: "reservation-covered",
    title: "4. What Happens When a Reservation Is Covered",
    content: (
      <>
        <p>If Stay Q determines that a reservation is covered by this Policy, eligible guests may be able to cancel the reservation even if the property's normal cancellation policy would otherwise apply.</p>
        <p>Depending on the circumstances, the guest may receive:</p>
        <ul>
          <li>A full refund;</li>
          <li>A partial refund;</li>
          <li>Stay Q booking credit;</li>
          <li>Refund of eligible platform charges;</li>
          <li>Assistance with finding an alternative property; or</li>
          <li>Another appropriate remedy.</li>
        </ul>
        <p>The exact remedy will depend on the circumstances, applicable law, payment status, and nature of the affected reservation.</p>
      </>
    )
  },
  {
    id: "affected-guests",
    title: "5. Guests Who Are Affected",
    content: (
      <>
        <p>Guests should contact Stay Q as soon as reasonably possible if they believe a major disruptive event has affected their reservation.</p>
        <p>Stay Q may request information or documentation to determine eligibility. Examples of relevant information may include:</p>
        <ul>
          <li>Booking confirmation;</li>
          <li>Property location;</li>
          <li>Dates of travel;</li>
          <li>Government restrictions;</li>
          <li>Official evacuation information;</li>
          <li>Other evidence showing that the reservation cannot reasonably be completed.</li>
        </ul>
      </>
    )
  },
  {
    id: "guest-only-events",
    title: "6. Events That Affect Only the Guest",
    content: (
      <>
        <p>A major event affecting a guest personally does not automatically qualify under this Policy if the booked property remains accessible and the reservation can otherwise be completed.</p>
        <p>For example, a guest's personal travel problem may be subject to the property's normal cancellation policy.</p>
        <p>Guests may still contact the host to request a voluntary cancellation or alternative arrangement.</p>
      </>
    )
  },
  {
    id: "not-covered",
    title: "7. Events Not Covered",
    content: (
      <>
        <p>The following circumstances generally do not qualify under the Major Disruptive Events Policy:</p>
        <ul>
          <li>Personal illness or injury;</li>
          <li>Personal emergencies;</li>
          <li>Change in travel plans;</li>
          <li>Financial difficulties;</li>
          <li>Government recommendations that are not mandatory;</li>
          <li>Flight cancellations;</li>
          <li>Airline or transportation company failures;</li>
          <li>Transport strikes;</li>
          <li>Road closures caused by routine maintenance;</li>
          <li>Loss of employment;</li>
          <li>Visa or passport problems;</li>
          <li>Cancellation of concerts, weddings, conferences, or other events;</li>
          <li>Weather that is normal or reasonably foreseeable for the destination;</li>
          <li>Seasonal weather conditions;</li>
          <li>Personal fear of travelling where no qualifying event affects the reservation location.</li>
        </ul>
        <p>In these situations, the reservation will generally remain subject to the property's applicable cancellation policy.</p>
      </>
    )
  },
  {
    id: "alternative-arrangements",
    title: "8. Alternative Arrangements",
    content: (
      <>
        <p>For situations that do not qualify under this Policy, Stay Q encourages guests and hosts to communicate and consider reasonable alternatives, such as:</p>
        <ul>
          <li>Changing the reservation dates;</li>
          <li>Providing a partial refund;</li>
          <li>Providing a full refund;</li>
          <li>Providing Stay Q booking credit; or</li>
          <li>Modifying the reservation.</li>
        </ul>
        <p>Any voluntary refund or alternative arrangement outside the property's cancellation policy may be subject to the host's agreement.</p>
        <p>Stay Q does not guarantee a refund where the reservation is not covered by this Policy or another applicable refund policy.</p>
      </>
    )
  },
  {
    id: "host-cancellations",
    title: "9. Host Cancellations During a Covered Event",
    content: (
      <>
        <p>Where a reservation qualifies under this Policy, a host may be permitted to cancel the reservation without standard cancellation penalties.</p>
        <p>If a host cancels under this Policy:</p>
        <ul>
          <li>The host generally will not receive a payout for the cancelled reservation;</li>
          <li>The dates may be blocked on the host's calendar;</li>
          <li>Stay Q may refund the guest according to the applicable policy;</li>
          <li>Any payout already made to the host may be recovered or offset against future payouts where permitted.</li>
        </ul>
        <p>Hosts should notify Stay Q as soon as they determine that they cannot safely or legally accommodate the guest.</p>
      </>
    )
  },
  {
    id: "uninhabitable",
    title: "10. Property Becomes Uninhabitable",
    content: (
      <>
        <p>Regardless of whether a major disruptive event is formally covered by this Policy, hosts must notify Stay Q if their property becomes:</p>
        <ul>
          <li>Uninhabitable;</li>
          <li>Unsafe;</li>
          <li>Legally inaccessible;</li>
          <li>Substantially damaged; or</li>
          <li>Materially different from what the guest booked.</li>
        </ul>
        <p>The host may be required to cancel the reservation where the property cannot reasonably accommodate the guest.</p>
        <p>Depending on the circumstances, Stay Q may provide the guest with:</p>
        <ul>
          <li>A full refund;</li>
          <li>A partial refund;</li>
          <li>Alternative accommodation assistance;</li>
          <li>Booking credit; or</li>
          <li>Another appropriate remedy.</li>
        </ul>
      </>
    )
  },
  {
    id: "host-responsibilities",
    title: "11. Host Responsibilities",
    content: (
      <>
        <p>Hosts are responsible for maintaining their listings in a condition that reasonably matches the information provided to guests.</p>
        <p>If a property is affected by a major event, hosts should:</p>
        <ul>
          <li>Inform Stay Q promptly;</li>
          <li>Provide accurate information about the property's condition;</li>
          <li>Avoid accepting guests when the property is unsafe or unavailable;</li>
          <li>Cooperate with Stay Q regarding affected reservations.</li>
        </ul>
        <p>Failure to disclose a serious property problem may result in appropriate action under Stay Q's Host Policies.</p>
      </>
    )
  },
  {
    id: "stay-q-assessment",
    title: "12. Stay Q's Assessment",
    content: (
      <>
        <p>Stay Q may consider information from reliable sources when determining whether this Policy applies, including:</p>
        <ul>
          <li>Government authorities;</li>
          <li>Emergency management authorities;</li>
          <li>Weather agencies;</li>
          <li>Public health authorities;</li>
          <li>Utility providers;</li>
          <li>Reliable news and information sources;</li>
          <li>Local authorities;</li>
          <li>Property and host information.</li>
        </ul>
        <p>Stay Q may determine:</p>
        <ul>
          <li>Whether an event qualifies;</li>
          <li>Which locations are affected;</li>
          <li>Which dates are covered;</li>
          <li>Which reservations qualify; and</li>
          <li>What refund or remedy is appropriate.</li>
        </ul>
      </>
    )
  },
  {
    id: "limitations",
    title: "13. Geographic & Time Limitations",
    content: (
      <>
        <p>Activation of this Policy does not necessarily apply to all Stay Q reservations.</p>
        <p>Stay Q may define:</p>
        <ul>
          <li><strong>Affected Area:</strong> The geographical area directly impacted by the event.</li>
          <li><strong>Affected Period:</strong> The dates during which the event is expected to prevent or legally prohibit completion of reservations.</li>
        </ul>
        <p>Reservations outside the affected area or period may remain subject to the property's normal cancellation policy.</p>
      </>
    )
  },
  {
    id: "evidence",
    title: "14. Evidence & Verification",
    content: (
      <>
        <p>Stay Q may request reasonable evidence when determining eligibility.</p>
        <p>Guests and hosts must provide accurate information.</p>
        <p>Submitting false documents, misleading information, manipulated photographs, or fraudulent claims may result in:</p>
        <ul>
          <li>Denial of the claim;</li>
          <li>Cancellation of the reservation;</li>
          <li>Account restrictions;</li>
          <li>Suspension;</li>
          <li>Permanent account termination; or</li>
          <li>Other action permitted by applicable law.</li>
        </ul>
      </>
    )
  },
  {
    id: "no-automatic-refund",
    title: "15. No Automatic Refund",
    content: (
      <>
        <p>The occurrence of a major event does not automatically mean that every Stay Q reservation will receive a refund.</p>
        <p>The event must satisfy the requirements of this Policy and materially affect the specific reservation.</p>
        <p>Stay Q will communicate the applicable remedy to affected users where reasonably possible.</p>
      </>
    )
  },
  {
    id: "travel-insurance",
    title: "16. Travel Insurance",
    content: (
      <>
        <p>This Policy is not travel insurance.</p>
        <p>Guests are encouraged to consider appropriate travel insurance or other protection for circumstances that are not covered by Stay Q's cancellation policies.</p>
      </>
    )
  },
  {
    id: "statutory-rights",
    title: "17. Statutory Rights",
    content: (
      <>
        <p>Nothing in this Policy is intended to remove or restrict any mandatory rights that guests or hosts may have under applicable consumer protection, accommodation, contract, payment, or other laws.</p>
        <p>Where applicable law provides greater rights than this Policy, those legal rights will prevail.</p>
      </>
    )
  },
  {
    id: "changes",
    title: "18. Changes to This Policy",
    content: (
      <>
        <p>Stay Q may update this Major Disruptive Events Policy from time to time to reflect:</p>
        <ul>
          <li>Changes in our services;</li>
          <li>Changes in applicable laws;</li>
          <li>New types of disruptive events;</li>
          <li>Changes in risk-management practices; or</li>
          <li>Changes in the Stay Q platform.</li>
        </ul>
        <p>The latest version will be published on the Stay Q website or application.</p>
      </>
    )
  }
];

export default function DisruptivePolicy() {
  const [activeId, setActiveId] = useState<string>('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    // Scroll to top on load
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
    <div className="policy-page">
      <Nav />
      
      <main className="policy-main">
        {/* Header Banner */}
        <div className="policy-header-banner">
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
              <h1 className="policy-title">Major Disruptive Events Policy</h1>
              <div className="policy-meta">
                <span>Effective Date: 01/08/2026</span>
                <span className="policy-meta-dot">•</span>
                <span>Last Updated: 01/08/2026</span>
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
                {policyData.map((item) => (
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
                {policyData.map((item) => (
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
            {policyData.map((item) => (
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

            {/* Contact Section */}
            <motion.section
              id="contact"
              className="policy-section policy-contact"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <h2 className="policy-section-title">19. Contact Stay Q</h2>
              <div className="policy-section-body">
                <p>If you believe your reservation has been affected by a major disruptive event, please contact Stay Q through the Help or Support section of the application or website.</p>
                <div className="policy-contact-card">
                  <div className="policy-contact-logo">
                    Stay Q
                  </div>
                  <p><strong>A property booking and hosting platform by Quatalyst Private Limited</strong></p>
                  <p>Email: <a href="mailto:support@stayq.space">support@stayq.space</a></p>
                  <p>Website: <a href="https://www.stayq.space">www.stayq.space</a></p>
                  <p className="policy-slogan">Stay. Discover. Experience.</p>
                  <p className="policy-copyright">© 2026 Quatalyst Private Limited. All Rights Reserved</p>
                </div>
              </div>
            </motion.section>
          </div>
        </div>
      </main>
    </div>
  );
}
