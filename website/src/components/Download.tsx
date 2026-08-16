import { Apple, Smartphone } from 'lucide-react';
import { Reveal } from './Reveal';

export function Download() {
  return (
    <section className="section" id="download">
      <div className="shell">
        <Reveal>
          <div className="cta grain">
            <div className="cta__glow cta__glow--a" aria-hidden="true" />
            <div className="cta__glow cta__glow--b" aria-hidden="true" />

            <div className="rel" style={{ display: 'grid', placeItems: 'center', gap: '1.5rem' }}>


              <h2 className="h1" style={{ color: 'var(--white)' }}>
                Your next stay is
                <br />
                one tap away.
              </h2>

              <p className="lead">
                Download Stay Q and browse villas, campsites, RVs and zero-broker homes across
                India.
              </p>

              {/* Store links are placeholders until the listings are live —
                  labelled honestly rather than pointing nowhere. */}
              <div className="cta__actions">
                <span className="btn btn--onviolet btn--lg" aria-disabled="true">
                  <Apple size={19} aria-hidden="true" />
                  iOS — coming soon
                </span>
                <span className="btn btn--outline-light btn--lg" aria-disabled="true">
                  <Smartphone size={19} aria-hidden="true" />
                  Android — coming soon
                </span>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
