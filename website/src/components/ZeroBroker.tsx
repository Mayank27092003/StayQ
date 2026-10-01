"use client";

import { Check, ArrowRight } from 'lucide-react';
import { Reveal } from './Reveal';
import { useApp } from '../context/AppContext';

/** Points reflect the real `LeaseAgreement` model: 11-month term, zero broker
 *  fee, security deposit, digital agreement, renewal reminders. */
const POINTS = [
  { strong: '₹0 brokerage.', rest: 'No agent, no cut, no hidden commission.' },
  { strong: '11-month leases.', rest: 'The standard term, handled end to end in-app.' },
  { strong: 'Digital agreement.', rest: 'Signed by both sides, stored and downloadable.' },
  { strong: 'Transparent deposits.', rest: 'Rent, maintenance and deposit shown upfront.' },
  { strong: 'Renewal reminders.', rest: 'You get notified before the term runs out.' },
];

export function ZeroBroker() {
  const { updateFilters } = useApp();

  const handleBrowseHomes = (e: React.MouseEvent) => {
    e.preventDefault();
    updateFilters({ category: 'ZERO_BROKER', zeroBrokerOnly: true });
    window.location.hash = '#/stays';
  };
  return (
    <section className="section" id="zero-broker">
      <div
        className="aurora aurora--violet"
        style={{ width: 520, height: 520, top: '10%', left: -220 }}
        aria-hidden="true"
      />

      <div className="shell rel">
        <div className="split">
          <div className="split__copy">
            <Reveal>
              <span className="eyebrow eyebrow--green">
                <Check size={13} aria-hidden="true" />
                Zero Broker
              </span>
            </Reveal>
            <Reveal delay={0.06}>
              <h2 className="h1">
                Rent long-term.
                <br />
                <span className="grad-text">Pay no brokerage.</span>
              </h2>
            </Reveal>
            <Reveal delay={0.12}>
              <p className="lead">
                Brokerage on a rental in India routinely costs a month's rent or more. We
                removed the middleman entirely — you deal with the owner, we handle the
                paperwork.
              </p>
            </Reveal>

            <Reveal delay={0.18}>
              <ul className="ticks">
                {POINTS.map((p) => (
                  <li className="tick" key={p.strong}>
                    <span className="tick__icon" aria-hidden="true">
                      <Check size={13} strokeWidth={3} />
                    </span>
                    <span>
                      <strong>{p.strong}</strong> {p.rest}
                    </span>
                  </li>
                ))}
              </ul>
            </Reveal>

            <Reveal delay={0.24}>
              <a className="btn btn--primary" href="#/stays" onClick={handleBrowseHomes}>
                Browse long-term homes
                <ArrowRight size={16} aria-hidden="true" />
              </a>
            </Reveal>
          </div>

          <div className="split__visual">
            <Reveal delay={0.1}>
              <div className="split__host-card float--slow">
                <img
                  className="split__host-img"
                  src="/images/real_zero_broker_living.jpg"
                  alt="Modern zero-brokerage designer apartment"
                  loading="lazy"
                />
                <div className="split__host-gradient" aria-hidden="true" />
                <span className="split__host-earning-badge" style={{ background: 'linear-gradient(135deg, #5a31f4, #7f56d9)' }}>
                  <Check size={13} strokeWidth={3} />
                  ₹0 Brokerage Fee · Save ₹40,000+
                </span>
                <div className="split__host-overlay">
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: '0 0 0.2rem 0', color: '#fff' }}>
                    11-Month Verified Leases
                  </h3>
                  <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.85)', margin: 0 }}>
                    Direct Landlord Agreement · Zero Broker Commission
                  </p>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}
