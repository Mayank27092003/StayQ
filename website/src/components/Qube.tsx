import { ArrowRight, Sparkles } from 'lucide-react';
import { Reveal } from './Reveal';

export function Qube() {
  return (
    <section className="section" id="qube">
      <div
        className="aurora aurora--orchid"
        style={{ width: 560, height: 560, top: '4%', right: -220 }}
        aria-hidden="true"
      />

      <div className="shell rel">
        <div className="split split--reverse">
          <div className="split__copy">
            <Reveal>
              <span className="eyebrow">
                <Sparkles size={13} aria-hidden="true" />
                Qube AI
              </span>
            </Reveal>
            <Reveal delay={0.06}>
              <h2 className="h1">
                Describe the trip.
                <br />
                <span className="grad-text">Qube plans it.</span>
              </h2>
            </Reveal>
            <Reveal delay={0.12}>
              <p className="lead">
                Skip the endless filtering. Tell Qube what you're after in plain language and
                it returns real listings that actually match — dates, budget, vibe and all.
              </p>
            </Reveal>
            <Reveal delay={0.18}>
              <a className="btn btn--primary" href="#download">
                Try Qube in the app
                <ArrowRight size={16} aria-hidden="true" />
              </a>
            </Reveal>
          </div>

          <div className="split__visual">
            <Reveal delay={0.1}>
              {/* Illustrative example of the assistant's output format. */}
              <div className="chat">
                <div className="chat__head">
                  <img
                    className="chat__avatar"
                    src="/images/qube_mascot.jpg"
                    alt=""
                    aria-hidden="true"
                  />
                  Qube
                  <span className="chat__badge">AI</span>
                </div>

                <div className="bubble bubble--user">
                  Weekend for 4 near Lonavala, pool, under ₹12k a night
                </div>

                <div className="bubble bubble--bot">
                  Found 3 that fit. Best match: <strong>Hilltop Villa</strong> — private pool,
                  sleeps 6, ₹9,800/night. Instant Book is on, so you can confirm right now.
                </div>

                <div className="bubble bubble--user">Anything pet friendly?</div>

                <div className="bubble bubble--bot">
                  Yes — <strong>Misty Pines Cottage</strong> allows pets, ₹7,400/night, 12 min
                  from the lake. Want me to hold the dates?
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}
