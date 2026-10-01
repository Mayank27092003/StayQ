"use client";

import { navigateTo } from '../utils/navigation';
import { Check, Compass, Flame } from 'lucide-react';
import { Reveal } from './Reveal';

/** Fields mirror the RV and camping columns on the real `Property` model. */
const RV = ['Pickup & drop locations', 'Caravans, motorhomes & campervans', 'Onboard facilities listed upfront'];
const CAMP = ['Forest, riverside & mountain terrain', 'Tent capacity per site', 'Campfire-permitted spots'];

export function Adventure() {
  return (
    <section className="section" id="adventure">
      <div className="shell rel">
        <div className="section-head section-head--center">
          <Reveal>
            <span className="eyebrow">Off the beaten path</span>
          </Reveal>
          <Reveal delay={0.06}>
            <h2 className="h1">
              Wheels and <span className="grad-text">wilderness.</span>
            </h2>
          </Reveal>
        </div>

        <div className="duo">
          <Reveal>
            <article className="duo__card duo__card--rv">
              <div className="duo__photo-wrap">
                <img
                  className="duo__photo"
                  src="/images/real_rv.jpg"
                  alt="Luxury Overland Campervan by Alpine Lake"
                  loading="lazy"
                />
                <span className="duo__photo-badge">
                  <Compass size={13} color="#a78bfa" />
                  All-Terrain Campervans
                </span>
              </div>
              <h3 className="h3">RV rentals</h3>
              <p className="muted" style={{ fontSize: 'var(--t-sm)' }}>
                Take the whole trip with you. Pick up a caravan, drive the route you want, park
                where the view is.
              </p>
              <ul className="ticks">
                {RV.map((t) => (
                  <li className="tick" key={t}>
                    <span className="tick__icon" aria-hidden="true">
                      <Check size={13} strokeWidth={3} />
                    </span>
                    {t}
                  </li>
                ))}
              </ul>
              <div style={{ marginTop: 'auto', width: '100%', paddingTop: '1rem' }}>
                <a
                  href="/rvs"
                  className="btn btn--primary"
                  style={{ width: '100%', justifyContent: 'center', fontWeight: 700 }}
                  onClick={(e) => {
                    navigateTo('/rvs', e);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                >
                  Explore RVs &amp; Campervans &rarr;
                </a>
              </div>
            </article>
          </Reveal>

          <Reveal delay={0.1}>
            <article className="duo__card duo__card--camp">
              <div className="duo__photo-wrap">
                <img
                  className="duo__photo"
                  src="/images/real_camping.jpg"
                  alt="Stargazing Glamping Geodesic Dome"
                  loading="lazy"
                />
                <span className="duo__photo-badge" style={{ background: 'rgba(6, 95, 70, 0.85)' }}>
                  <Flame size={13} color="#34d399" />
                  Stargazing &amp; Campfires
                </span>
              </div>
              <h3 className="h3">Camping sites</h3>
              <p className="muted" style={{ fontSize: 'var(--t-sm)' }}>
                Pitch a tent by a river or high on a ridge. Every site lists its terrain and
                what's allowed before you book.
              </p>
              <ul className="ticks">
                {CAMP.map((t) => (
                  <li className="tick" key={t}>
                    <span className="tick__icon" aria-hidden="true">
                      <Check size={13} strokeWidth={3} />
                    </span>
                    {t}
                  </li>
                ))}
              </ul>
              <div style={{ marginTop: 'auto', width: '100%', paddingTop: '1rem' }}>
                <a
                  href="/camping"
                  className="btn btn--primary"
                  style={{ width: '100%', justifyContent: 'center', fontWeight: 700 }}
                  onClick={(e) => {
                    navigateTo('/camping', e);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                >
                  Explore Camping &amp; Glamping &rarr;
                </a>
              </div>
            </article>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
