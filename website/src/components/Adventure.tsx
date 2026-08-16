import { Check } from 'lucide-react';
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
              <img
                className="duo__mascot float"
                src="/images/mascot_rv.png"
                alt=""
                loading="lazy"
                aria-hidden="true"
              />
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
              <div style={{ marginTop: '1.75rem' }}>
                <a
                  href="#/rvs"
                  className="btn btn--primary"
                  style={{ width: '100%', justifyContent: 'center', fontWeight: 700 }}
                  onClick={() => {
                    window.location.hash = '#/rvs';
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
              <img
                className="duo__mascot float--slow"
                src="/images/mascot_camping.png"
                alt=""
                loading="lazy"
                aria-hidden="true"
              />
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
              <div style={{ marginTop: '1.75rem' }}>
                <a
                  href="#/camping"
                  className="btn btn--primary"
                  style={{ width: '100%', justifyContent: 'center', fontWeight: 700 }}
                  onClick={() => {
                    window.location.hash = '#/camping';
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
