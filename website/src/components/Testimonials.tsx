import { Star } from 'lucide-react';
import { Reveal } from './Reveal';

/**
 * Illustrative guest quotes shown with the app's own avatar artwork. Replace
 * with attributed reviews once real ones are collected.
 */
const QUOTES = [
  {
    avatar: 'avatar_rohan.jpg',
    name: 'Rohan',
    place: 'Stayed in Lonavala',
    text: 'Booked a villa with a private pool in about four minutes. Instant Book meant no back-and-forth waiting for someone to approve it.',
  },
  {
    avatar: 'avatar_elena.jpg',
    name: 'Elena',
    place: 'Long-term in Bengaluru',
    text: 'Zero Broker is the reason I switched. I saved a full month of rent that would have gone straight to an agent for doing very little.',
  },
  {
    avatar: 'avatar_alex.jpg',
    name: 'Alex',
    place: 'Camping in Coorg',
    text: 'The campsite listing said riverside with campfire allowed, and that is exactly what we got. No surprises on arrival.',
  },
  {
    avatar: 'avatar_sophia.jpg',
    name: 'Sophia',
    place: 'Hosting in Goa',
    text: 'Listing my place took one sitting. Payouts land on schedule and I can block my own dates whenever I need the house back.',
  },
  {
    avatar: 'avatar_jean.jpg',
    name: 'Jean',
    place: 'RV trip, Himachal',
    text: 'Told Qube what kind of route I wanted and it came back with campervans plus places to park. Saved me hours of searching.',
  },
];

export function Testimonials() {
  return (
    <section className="section" id="testimonials">
      <div className="shell rel">
        <div className="section-head section-head--center">
          <Reveal>
            <span className="eyebrow">Guests & hosts</span>
          </Reveal>
          <Reveal delay={0.06}>
            <h2 className="h1">
              What people <span className="grad-text">tell us.</span>
            </h2>
          </Reveal>
        </div>

        <div className="quotes">
          {QUOTES.map((q, i) => (
            <Reveal key={q.name} delay={i * 0.06}>
              <figure className="quote">
                <div className="quote__stars" aria-label="Rated 5 out of 5">
                  {Array.from({ length: 5 }).map((_, s) => (
                    <Star key={s} size={14} fill="currentColor" aria-hidden="true" />
                  ))}
                </div>
                <blockquote className="quote__text">"{q.text}"</blockquote>
                <figcaption className="quote__who">
                  <img
                    className="quote__avatar"
                    src={`/images/${q.avatar}`}
                    alt=""
                    loading="lazy"
                    aria-hidden="true"
                  />
                  <span>
                    <span className="quote__name">{q.name}</span>
                    <br />
                    <span className="quote__place">{q.place}</span>
                  </span>
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
