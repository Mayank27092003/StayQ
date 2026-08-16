import React, { useState } from 'react';
import { Shield, Search, Info } from 'lucide-react';

interface RuleItem {
  id: number;
  title: string;
  category: 'General' | 'Conduct' | 'Safety' | 'Legal' | 'Check-in/out';
  content: string[];
}

const GUEST_RULES: RuleItem[] = [
  {
    id: 1,
    title: '1. Respect the Property',
    category: 'General',
    content: [
      'Guests must treat the property, furniture, appliances, equipment, and other facilities with reasonable care.',
      'Guests must not intentionally damage, misuse, remove, or alter property belonging to the host.',
      'Any accidental damage should be reported to the host or Stay Q as soon as reasonably possible.',
    ],
  },
  {
    id: 2,
    title: '2. Follow the Maximum Guest Limit',
    category: 'General',
    content: [
      'Guests must not exceed the maximum occupancy stated in the property listing.',
      'Only guests included in the confirmed booking should stay overnight unless the host has expressly approved additional guests and the booking has been appropriately updated.',
    ],
  },
  {
    id: 3,
    title: '3. Check-In & Check-Out',
    category: 'Check-in/out',
    content: [
      "Guests must follow the property's stated check-in and check-out times.",
      'Early check-in or late check-out is permitted only when approved by the host in advance.',
      "Guests should return keys, access cards, remotes, or digital access devices according to the host's instructions.",
      'Lost keys or access devices may result in applicable replacement charges.',
    ],
  },
  {
    id: 4,
    title: '4. Identification & Verification',
    category: 'Legal',
    content: [
      'Guests may be required to provide valid government identification (e.g. Aadhaar, Passport, Driving Licence) where required by the host, property management, local authorities, or applicable law.',
      'Guests must provide accurate information during the booking and verification process.',
      'Providing false or misleading information may result in immediate cancellation of the reservation.',
    ],
  },
  {
    id: 5,
    title: '5. Cleanliness & Hygiene',
    category: 'General',
    content: [
      'Guests are expected to maintain reasonable cleanliness during their stay.',
      'Dispose of waste properly in provided bins and follow recycling or waste-separation instructions where available.',
      'Keep food and beverages in appropriate areas and avoid damaging furniture or surfaces.',
      'Keep bathrooms reasonably clean and leave the property in a respectful condition at checkout.',
      'Guests should not intentionally create excessive mess requiring extraordinary cleaning.',
    ],
  },
  {
    id: 6,
    title: '6. Noise & Quiet Hours',
    category: 'Conduct',
    content: [
      'Guests must respect neighbours and surrounding occupants.',
      "Excessive noise, loud music, shouting, or disruptive behaviour is strictly prohibited, particularly during the property's specified quiet hours (typically 10:00 PM to 07:00 AM).",
      'Guests should comply with all building, society, neighbourhood, or community noise restrictions.',
    ],
  },
  {
    id: 7,
    title: '7. Parties & Events',
    category: 'Conduct',
    content: [
      'Unless explicitly permitted by the property listing and host in writing, parties, events, celebrations, or large gatherings are strictly prohibited.',
      'Guests must not invite large numbers of unregistered visitors without prior approval from the host.',
      'Stay Q reserves the right to take immediate action, including booking cancellation, against unauthorized parties.',
    ],
  },
  {
    id: 8,
    title: '8. Smoking & Vaping Policy',
    category: 'Safety',
    content: [
      "Guests must strictly follow the property's smoking policy.",
      'If smoking is prohibited, guests must not smoke cigarettes, cigars, vaping devices, or e-cigarettes inside the premises.',
      'Guests should use designated outdoor smoking areas where available and safely dispose of cigarette butts.',
      'Any smoking-related damage, odor removal, or rule violation will result in dedicated deep-cleaning charges.',
    ],
  },
  {
    id: 9,
    title: '9. Alcohol & Controlled Substances',
    category: 'Legal',
    content: [
      'Guests must comply with all applicable central, state, and local laws relating to alcohol consumption.',
      'Illegal drugs, narcotics, or prohibited substances must not be brought onto or used at the property under any circumstances.',
      'Guests must not engage in any illegal substance abuse or criminal conduct.',
    ],
  },
  {
    id: 10,
    title: '10. Pets & Service Animals',
    category: 'General',
    content: [
      'Guests may bring pets only when the property listing explicitly permits pets or the host has provided prior written approval.',
      'Guests are fully responsible for ensuring that their pets do not damage the property or disturb neighbours.',
      'Any applicable pet restrictions, fees, cleaning requirements, or community leash rules must be strictly followed.',
    ],
  },
  {
    id: 11,
    title: '11. Day Visitors',
    category: 'General',
    content: [
      'Guests should confirm with the host if day visitors are permitted and obtain prior approval if required by society or gate security.',
      'Visitors must adhere to all property rules and community regulations.',
      'The booking guest remains legally and financially responsible for the conduct of all visitors they invite.',
    ],
  },
  {
    id: 12,
    title: '12. Security & Access Protocols',
    category: 'Safety',
    content: [
      'Guests must keep doors, windows, gates, and other access points secure when leaving the property unattended.',
      'Keys, smart locks, access cards, and digital PINs must never be shared with unauthorized third parties.',
      'Notify the host or Stay Q immediately if keys or access credentials are lost or compromised.',
    ],
  },
  {
    id: 13,
    title: '13. Safety Equipment & Alarms',
    category: 'Safety',
    content: [
      'Guests must not disable, remove, damage, or interfere with smoke detectors, fire extinguishers, emergency equipment, CCTV in common areas, or safety alarms.',
      'Familiarize yourself with emergency exits and posted safety instructions upon arrival.',
    ],
  },
  {
    id: 14,
    title: '14. Candles, Fire & Hazardous Items',
    category: 'Safety',
    content: [
      'Guests must exercise utmost care with candles, cooking equipment, heaters, and electrical appliances.',
      'Unattended open flames are prohibited indoors. Bonfires at campsites or villas are permitted only in designated fire pits.',
      'Hazardous, explosive, flammable, or illegal materials must never be brought onto the premises.',
    ],
  },
  {
    id: 15,
    title: '15. Electrical Appliances & Power Usage',
    category: 'Safety',
    content: [
      "Use electrical appliances according to manufacturer guidelines and the host's instructions.",
      'Do not tamper with electrical wiring, main breaker panels, high-voltage sockets, or solar systems.',
      'Report any electrical malfunction or outage to the host immediately.',
    ],
  },
  {
    id: 16,
    title: '16. Kitchen Usage & Food Safety',
    category: 'General',
    content: [
      'Where a private or shared kitchen is provided, guests should operate appliances responsibly.',
      'Always turn off gas stoves, induction hobs, and ovens after cooking.',
      'Clean used utensils, cookware, and dining tables, and dispose of organic waste in designated bins.',
      'Never leave cooking unattended.',
    ],
  },
  {
    id: 17,
    title: '17. Furniture & Fixtures',
    category: 'General',
    content: [
      'Guests must not drag or rearrange heavy furniture, beds, televisions, audio setups, or appliances without host permission.',
      'Use all furniture, mattresses, and outdoor loungers strictly for their intended purpose.',
    ],
  },
  {
    id: 18,
    title: '18. Internet & Cyber Conduct',
    category: 'Legal',
    content: [
      'Where Wi-Fi or broadband is provided, guests must use the connection lawfully.',
      'Prohibited activities include: unauthorized network penetration, hacking, downloading pirated or illegal content, distributing malware, or committing cyber offences under the IT Act.',
    ],
  },
  {
    id: 19,
    title: '19. Privacy of Hosts & Neighbours',
    category: 'Conduct',
    content: [
      'Guests must respect the personal privacy of hosts, neighbours, estate staff, and other guests in shared properties.',
      'Do not photograph, record, monitor, or broadcast private individuals or private adjacent properties without express consent.',
    ],
  },
  {
    id: 20,
    title: '20. Security Cameras & Disclosures',
    category: 'Safety',
    content: [
      'Guests must not tamper with legally installed and properly disclosed exterior/common-area security equipment.',
      'Cameras or recording devices are strictly prohibited in private indoor areas (bedrooms, bathrooms). Any concerns should be reported to Stay Q immediately.',
    ],
  },
  {
    id: 21,
    title: '21. Prohibited Illegal Activities',
    category: 'Legal',
    content: [
      'The property must never be used for unlawful purposes.',
      'Strictly prohibited: drug trafficking, fraud, theft, human exploitation, unauthorized commercial gambling, or any criminal activity that endangers lives.',
      'Stay Q cooperates fully with statutory law enforcement agencies.',
    ],
  },
  {
    id: 22,
    title: '22. Commercial Shoots & Events',
    category: 'Legal',
    content: [
      'Residential listings may not be used for unauthorized commercial photography, film shoots, brand campaigns, or business operations without prior written approval and commercial fee clearance from the host.',
    ],
  },
  {
    id: 23,
    title: '23. Damage & Loss Reporting',
    category: 'General',
    content: [
      'Guests are legally responsible for damage caused intentionally or through negligence.',
      'Report accidental breakage immediately to the host rather than attempting to conceal it.',
      'Stay Q facilitates transparent resolution and documentation for legitimate damage claims.',
    ],
  },
  {
    id: 24,
    title: '24. Lost & Found Property',
    category: 'General',
    content: [
      'Guests should carefully check all drawers, closets, and outdoor areas before checkout.',
      'If an item is left behind, contact the host promptly through Stay Q to coordinate courier returns (subject to courier charges).',
    ],
  },
  {
    id: 25,
    title: '25. Respect for Neighbours & Community',
    category: 'Conduct',
    content: [
      'Guests must act courteously toward residential neighbours and community security.',
      'Do not block shared gates, litter in common hallways, harass residents, or misuse common amenities.',
    ],
  },
  {
    id: 26,
    title: '26. Parking Regulations',
    category: 'General',
    content: [
      'Park only in designated visitor or assigned villa/RV parking slots.',
      'Never block emergency fire lanes, driveways, or neighbouring gates. Follow local municipal parking guidelines.',
    ],
  },
  {
    id: 27,
    title: '27. Property Amenities & Swimming Pools',
    category: 'Safety',
    content: [
      'Use swimming pools, plunge baths, gyms, elevators, and outdoor decks responsibly.',
      'Adhere to pool timings, shower before entering, and observe posted depth warnings and age limits.',
      'Never attempt to access restricted maintenance rooms or locked service areas.',
    ],
  },
  {
    id: 28,
    title: '28. Supervision of Children & Minors',
    category: 'Safety',
    content: [
      'Parents or guardians must provide continuous supervision for children, especially around swimming pools, cliffside balconies, open terraces, fireplaces, staircases, or water bodies.',
    ],
  },
  {
    id: 29,
    title: '29. Accessibility Requirements',
    category: 'General',
    content: [
      'Guests requiring step-free access, wheelchair accessibility, or ground-floor rooms should verify listing features and message the host prior to booking to ensure the space meets specific requirements.',
    ],
  },
  {
    id: 30,
    title: '30. Respectful Communication',
    category: 'Conduct',
    content: [
      'Always use official Stay Q communication channels for booking correspondence.',
      'Harassment, abusive language, discrimination, extortion, or intimidation will result in immediate permanent account termination.',
    ],
  },
  {
    id: 31,
    title: '31. Emergency Situations & First Aid',
    category: 'Safety',
    content: [
      'In an emergency, prioritize personal safety and immediately dial local emergency services (112 / 108 / 100).',
      'Notify the host and Stay Q support team as soon as safely possible.',
    ],
  },
  {
    id: 32,
    title: '32. Booking Modifications',
    category: 'Check-in/out',
    content: [
      'Request changes to dates, guest headcount, or check-in timings via the Stay Q app or support desk.',
      'Modifications remain subject to host confirmation, seasonal rate differences, and platform policies.',
    ],
  },
  {
    id: 33,
    title: '33. Cancellation & Refunds',
    category: 'Check-in/out',
    content: [
      "Cancellations are governed by the specific property's policy (Flexible, Moderate, or Strict) selected at booking time.",
      'Review cancellation milestones carefully prior to making payments.',
    ],
  },
  {
    id: 34,
    title: '34. Review & Rating Integrity',
    category: 'Conduct',
    content: [
      'Reviews must reflect genuine, firsthand experiences.',
      'Review extortion, posting fake feedback, or demanding discounts in exchange for positive reviews is strictly prohibited and subject to review removal.',
    ],
  },
  {
    id: 35,
    title: '35. Anti-Circumvention Policy',
    category: 'Legal',
    content: [
      'Guests and hosts must not intentionally move confirmed bookings off-platform to bypass safety verifications, security deposits, or legitimate platform protections.',
    ],
  },
  {
    id: 36,
    title: '36. Host-Specific House Rules',
    category: 'General',
    content: [
      'Every property may have specific building or environmental rules displayed on the listing.',
      'Where a specific rule exists, guests must comply with both Stay Q standard guidelines and custom listing rules.',
    ],
  },
  {
    id: 37,
    title: '37. Prohibited Behaviour Penalties',
    category: 'Legal',
    content: [
      'Violations of safety, property integrity, identity authenticity, or guest conduct rules may result in immediate reservation termination, forfeiture of fees, damage recovery, or permanent platform banning.',
    ],
  },
  {
    id: 38,
    title: '38. Guest Responsibility & Care',
    category: 'General',
    content: [
      'By booking through Stay Q, guests acknowledge full personal responsibility for providing accurate information, following property rules, and ensuring lawful, respectful conduct throughout their stay.',
    ],
  },
  {
    id: 39,
    title: '39. Acceptance of Guest Rules',
    category: 'Legal',
    content: [
      'Completing a reservation on Stay Q constitutes binding acceptance of these Guest House Rules, the listing-specific terms, and all applicable statutory regulations.',
    ],
  },
];

export const GuestRulesPage: React.FC = () => {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  const filteredRules = GUEST_RULES.filter((rule) => {
    const matchesCategory = selectedCategory === 'ALL' || rule.category === selectedCategory;
    const matchesSearch =
      search === '' ||
      rule.title.toLowerCase().includes(search.toLowerCase()) ||
      rule.content.some((c) => c.toLowerCase().includes(search.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  return (
    <div style={{ paddingTop: '5.5rem', background: '#F8FAFC', minHeight: '100vh' }}>
      {/* Header Banner */}
      <section style={{ background: 'linear-gradient(180deg, #FAF5FF 0%, #FFFFFF 100%)', borderBottom: '1px solid var(--border)', padding: '4rem 1.5rem 3rem' }}>
        <div className="shell" style={{ maxWidth: '880px', margin: '0 auto', textAlign: 'center' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.35rem 0.9rem',
              borderRadius: '999px',
              background: 'rgba(90, 49, 244, 0.08)',
              color: 'var(--violet)',
              fontSize: '0.78rem',
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom: '1rem',
            }}
          >
            <Shield size={14} /> Official Platform Standards
          </div>

          <h1 style={{ fontSize: 'clamp(2rem, 3.8vw, 2.85rem)', fontWeight: 900, color: 'var(--ink)', letterSpacing: '-0.03em', lineHeight: 1.2, marginBottom: '1rem' }}>
            Stay Q Guest House Rules &amp; Stay Guidelines
          </h1>

          <p style={{ fontSize: '1.05rem', color: 'var(--gray-600)', lineHeight: 1.6, maxWidth: '680px', margin: '0 auto 2rem' }}>
            Stay Q is committed to providing guests with safe, comfortable, respectful, and enjoyable stays. These 39 standard rules apply across all homestays, luxury villas, mountain cabins, campervans, and campsites.
          </p>

          {/* Search & Filter Bar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '640px', margin: '0 auto' }}>
            <div style={{ position: 'relative', width: '100%' }}>
              <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--gray-400)' }} />
              <input
                type="text"
                placeholder="Search rules (e.g. noise, smoking, pets, parking, swimming pool)..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.85rem 1rem 0.85rem 2.8rem',
                  borderRadius: '16px',
                  border: '1.5px solid var(--border)',
                  background: 'var(--white)',
                  fontSize: '0.95rem',
                  outline: 'none',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                }}
              />
            </div>

            {/* Filter Pills */}
            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              {['ALL', 'General', 'Safety', 'Conduct', 'Legal', 'Check-in/out'].map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  style={{
                    padding: '0.4rem 0.85rem',
                    borderRadius: '999px',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    border: `1.5px solid ${selectedCategory === cat ? 'var(--violet)' : 'var(--border)'}`,
                    background: selectedCategory === cat ? 'var(--violet)' : 'var(--white)',
                    color: selectedCategory === cat ? '#ffffff' : 'var(--ink)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {cat === 'ALL' ? 'All 39 Rules' : cat}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Rules Grid */}
      <section className="shell" style={{ maxWidth: '960px', margin: '0 auto', padding: '3rem 1.5rem 5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--gray-600)' }}>
            Showing {filteredRules.length} of {GUEST_RULES.length} rules
          </span>
          <span style={{ fontSize: '0.8rem', color: 'var(--gray-500)' }}>
            Updated: August 2026 · Quatalyst Pvt. Ltd.
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.25rem' }}>
          {filteredRules.map((rule) => (
            <div
              key={rule.id}
              style={{
                background: 'var(--white)',
                borderRadius: '20px',
                border: '1px solid var(--border)',
                padding: '1.75rem',
                boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
                transition: 'transform 0.15s ease, box-shadow 0.15s ease',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--ink)', margin: 0 }}>
                  {rule.title}
                </h3>
                <span
                  style={{
                    fontSize: '0.72rem',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                    padding: '0.25rem 0.65rem',
                    borderRadius: '6px',
                    background:
                      rule.category === 'Safety'
                        ? 'rgba(239, 68, 68, 0.1)'
                        : rule.category === 'Legal'
                        ? 'rgba(90, 49, 244, 0.1)'
                        : rule.category === 'Conduct'
                        ? 'rgba(247, 144, 9, 0.1)'
                        : 'rgba(18, 183, 106, 0.1)',
                    color:
                      rule.category === 'Safety'
                        ? '#dc2626'
                        : rule.category === 'Legal'
                        ? 'var(--violet)'
                        : rule.category === 'Conduct'
                        ? '#d97706'
                        : '#12b76a',
                  }}
                >
                  {rule.category}
                </span>
              </div>

              <ul style={{ margin: 0, paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {rule.content.map((point, idx) => (
                  <li key={idx} style={{ fontSize: '0.92rem', color: 'var(--gray-700)', lineHeight: 1.6 }}>
                    {point}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Legal Disclaimer Box */}
        <div
          style={{
            marginTop: '3rem',
            background: 'linear-gradient(135deg, #FAF5FF 0%, #F5F3FF 100%)',
            border: '1.5px solid rgba(90, 49, 244, 0.2)',
            borderRadius: '20px',
            padding: '2rem',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '1rem',
          }}
        >
          <Info size={24} style={{ color: 'var(--violet)', flexShrink: 0, marginTop: '2px' }} />
          <div>
            <strong style={{ fontSize: '0.95rem', color: 'var(--ink)', display: 'block', marginBottom: '0.35rem' }}>
              Statutory Platform Notice &amp; Precedence
            </strong>
            <p style={{ fontSize: '0.85rem', color: 'var(--gray-600)', lineHeight: 1.6, margin: 0 }}>
              These Guest House Rules represent the baseline standard of conduct for all bookings across the Stay Q platform. Where a property-specific rule conflicts with applicable law or Stay Q's mandatory safety policies, applicable law and Stay Q's policies prevail.
            </p>
            <div style={{ marginTop: '0.75rem', fontSize: '0.78rem', color: 'var(--violet)', fontWeight: 700 }}>
              QUATALYST PRIVATE LIMITED (CIN: U62011GA2026PTC018230) · Grievance Redressal: grievance@stayq.space
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
