import { Check, ArrowRight } from 'lucide-react';
import { Reveal } from './Reveal';

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
              <a className="btn btn--primary" href="#/zero-broker">
                Browse long-term homes
                <ArrowRight size={16} aria-hidden="true" />
              </a>
            </Reveal>
          </div>

          <div className="split__visual">
            <Reveal delay={0.1}>
              <div 
                className="split__mascot float--slow"
                style={{
                  position: 'relative',
                  display: 'inline-block',
                  borderRadius: '3rem',
                  boxShadow: '0 30px 60px -15px rgba(90, 49, 244, 0.6), 0 0 0 8px rgba(90, 49, 244, 0.05), inset 0 2px 4px rgba(255,255,255,0.4)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  overflow: 'hidden',
                  cursor: 'pointer',
                  transform: 'perspective(1000px) rotateY(-8deg) rotateX(4deg)',
                  transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'perspective(1000px) rotateY(0deg) rotateX(0deg) scale(1.05)';
                  e.currentTarget.style.boxShadow = '0 40px 80px -15px rgba(90, 49, 244, 0.7), 0 0 0 12px rgba(90, 49, 244, 0.1), inset 0 2px 4px rgba(255,255,255,0.5)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'perspective(1000px) rotateY(-8deg) rotateX(4deg) scale(1)';
                  e.currentTarget.style.boxShadow = '0 30px 60px -15px rgba(90, 49, 244, 0.6), 0 0 0 8px rgba(90, 49, 244, 0.05), inset 0 2px 4px rgba(255,255,255,0.4)';
                }}
              >
                <img
                  style={{ display: 'block', width: '100%', height: 'auto', transform: 'scale(1.02)' }}
                  src="/images/logo_3d.png"
                  alt="Stay Q Zero Broker emblem"
                  loading="lazy"
                />
              </div>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}
