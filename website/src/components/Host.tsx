import { ArrowRight, Check } from 'lucide-react';
import { Reveal } from './Reveal';

/** Reflects the real host onboarding and payout flow. */
const POINTS = [
  { strong: 'List in guided steps.', rest: 'Property details, photos, pricing and policies.' },
  { strong: 'Set your own rules.', rest: 'House rules, min/max stay, cancellation policy.' },
  { strong: 'Multi-unit support.', rest: 'Room types with their own capacity and pricing.' },
  { strong: 'Verified payouts.', rest: 'Bank details verified, earnings tracked per booking.' },
  { strong: 'Own calendar control.', rest: 'Block dates yourself; bookings block automatically.' },
];

export function Host() {
  return (
    <section className="section section--wash" id="host">
      <div className="shell rel">
        <div className="split">
          <div className="split__visual">
            <Reveal>
              <img
                className="split__mascot float"
                src="/images/human_host.png"
                alt="A Stay Q host ready to welcome guests"
                loading="lazy"
              />
            </Reveal>
          </div>

          <div className="split__copy">
            <Reveal>
              <span className="eyebrow">Become a host</span>
            </Reveal>
            <Reveal delay={0.06}>
              <h2 className="h1">
                Your space,
                <br />
                <span className="grad-text">earning for you.</span>
              </h2>
            </Reveal>
            <Reveal delay={0.12}>
              <p className="lead">
                Whether it's a spare room, a second home or a fleet of campsites — listing on
                Stay Q takes a few guided steps, and you stay in control of pricing and dates.
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
              <a className="btn btn--primary" href="#download">
                Start hosting
                <ArrowRight size={16} aria-hidden="true" />
              </a>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}
