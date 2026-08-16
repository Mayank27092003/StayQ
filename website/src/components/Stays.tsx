import { Reveal } from './Reveal';

/** Real category names from the `PropertyCategory` enum, paired with real photos. */
const STAYS = [
  { img: 'villa_1.jpg', tag: 'Villa', name: 'Private villas', where: 'Pools, decks & full privacy' },
  { img: 'beach_1.jpg', tag: 'Beachfront', name: 'Beachfront stays', where: 'Wake up to the waves' },
  { img: 'cabin_1.jpg', tag: 'Cabin', name: 'Forest cabins', where: 'Quiet, wooded escapes' },
  { img: 'glass_1.jpg', tag: 'Design', name: 'Design homes', where: 'Architectural one-offs' },
  { img: 'nordic_1.jpg', tag: 'Countryside', name: 'Countryside retreats', where: 'Slow mornings, big skies' },
  { img: 'suite_1.jpg', tag: 'Premium', name: 'Premium suites', where: 'Hotel comfort, home space' },
];

export function Stays() {
  return (
    <section className="section section--wash" id="stays">
      <div className="shell rel">
        <div className="section-head section-head--center">
          <Reveal>
            <span className="eyebrow">Every kind of stay</span>
          </Reveal>
          <Reveal delay={0.06}>
            <h2 className="h1">
              From city studios to <span className="grad-text">treehouses.</span>
            </h2>
          </Reveal>
          <Reveal delay={0.12}>
            <p className="lead">
              Fourteen property types across every category — whatever the trip calls for,
              there's a place for it.
            </p>
          </Reveal>
        </div>

        <div className="stays__marquee">
          <div className="stays__track">
            {[...STAYS, ...STAYS].map((s, i) => (
              <article className="stay" key={`${s.img}-${i}`}>
                <img src={`/images/${s.img}`} alt={s.name} loading="lazy" />
                <div className="stay__veil" aria-hidden="true" />
                <div className="stay__meta">
                  <span className="stay__tag">{s.tag}</span>
                  <h3 className="stay__name">{s.name}</h3>
                  <p className="stay__where">{s.where}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
