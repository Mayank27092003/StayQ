"use client";

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
              <div className="cta__actions" style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                <a
                  href="https://play.google.com/store/apps/details?id=com.stayq.stay_q"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn--primary btn--lg"
                  style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.6rem' }}
                >
                  <Smartphone size={20} aria-hidden="true" />
                  <span>Get it on Google Play</span>
                </a>
                <span
                  className="btn btn--outline-light btn--lg"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.6rem', opacity: 0.9, cursor: 'default' }}
                  title="iOS App has been submitted to Apple App Store review team"
                >
                  <Apple size={20} aria-hidden="true" />
                  <span>iOS App: In Review with Apple Team</span>
                </span>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
