import { useState } from 'react';
import { Reveal } from './Reveal';
import { ArrowRight } from 'lucide-react';

const EXPERIENCES = [
  { img: 'exp_trekking.jpg', name: 'Adventure' },
  { img: 'exp_local_food.jpg', name: 'Food & Drink' },
  { img: 'exp_cultural_walk.jpg', name: 'Art & Culture' },
  { img: 'exp_nature_wildlife.jpg', name: 'Nature' },
  { img: 'exp_yoga_retreat.jpg', name: 'Wellness' },
];

export function Experiences() {
  const [activeIndex, setActiveIndex] = useState(0);

  return (
    <section className="section section--surface" id="experiences">
      <div className="shell rel">
        <div className="section-head section-head--center">
          <Reveal>
            <span className="eyebrow" style={{
              display: 'inline-flex',
              alignItems: 'center',
              padding: '0.6rem 1.5rem',
              background: 'linear-gradient(135deg, rgba(90, 49, 244, 0.1), rgba(233, 69, 96, 0.15))',
              border: '1px solid rgba(90, 49, 244, 0.4)',
              borderRadius: '100px',
              color: 'var(--primary)',
              fontWeight: 800,
              fontSize: '0.85rem',
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              boxShadow: '0 8px 25px -5px rgba(90, 49, 244, 0.3)',
              marginBottom: '1rem'
            }}>Experiences</span>
          </Reveal>
          <Reveal delay={0.06}>
            <h2 className="h1">
              Book your own <span className="grad-text">experience.</span>
            </h2>
          </Reveal>
          <Reveal delay={0.12}>
            <p className="lead">
              Guided treks, cooking classes, dive sessions, studio workshops — hosted by
              locals who actually know the place.
            </p>
          </Reveal>
        </div>

          <div className="exp__grid">
            {EXPERIENCES.map((e, index) => (
              <Reveal 
                className={`exp ${activeIndex === index ? 'exp--active' : ''}`} 
                key={e.name} 
                delay={0.2 + (index * 0.05)}
              >
                <div 
                  className="exp__click-area"
                  style={{ position: 'absolute', inset: 0, zIndex: 10, cursor: 'pointer' }}
                  onClick={() => setActiveIndex(index)}
                  onMouseEnter={() => setActiveIndex(index)}
                ></div>
                <img className="exp__img" src={`/images/${e.img}`} alt="" loading="lazy" aria-hidden="true" />
                <div className="exp__glass"></div>
                <div className="exp__overlay">
                  <h3 className="exp__name">{e.name}</h3>
                </div>
              </Reveal>
            ))}
          </div>

          <Reveal delay={0.4}>
            <div className="exp-cta">
              <div className="exp-cta__bg">
                <div className="exp-cta__blob exp-cta__blob--1"></div>
                <div className="exp-cta__blob exp-cta__blob--2"></div>
              </div>
              <div className="exp-cta__content">
                <h3 className="h2">Got a passion? Share it with the world.</h3>
                <p className="lead" style={{ maxWidth: '600px', margin: '0 auto', color: 'var(--text-secondary)' }}>
                  From cooking masterclasses to hidden city walks, host your own unique experience on Stay Q and earn doing what you love.
                </p>
                <div style={{ marginTop: '2rem' }}>
                  <a href="#" className="btn btn--primary" style={{ display: 'inline-flex', padding: '0.85rem 2rem', fontSize: '1.1rem', borderRadius: '100px', boxShadow: '0 12px 30px -10px rgba(90, 49, 244, 0.6)' }}>
                    Host your Experience
                    <ArrowRight size={20} style={{ marginLeft: '10px' }} />
                  </a>
                </div>
              </div>
            </div>
          </Reveal>
      </div>
    </section>
  );
}
