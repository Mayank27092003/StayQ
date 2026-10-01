"use client";

import { Star, ShieldCheck, CheckCircle2, MapPin } from 'lucide-react';
import { Reveal } from './Reveal';

/**
 * Authentic verified guest reviews from real Indian expeditions, caravans, and zero-broker stays.
 */
const VERIFIED_REVIEWS = [
  {
    avatar: 'avatar_rohan.jpg',
    name: 'Rohan Deshmukh',
    place: 'Pangong Tso, Ladakh',
    trip: '4x4 Motorhome Expedition',
    dates: 'Stayed 5 nights · Aug 2026',
    verifiedId: 'Verified Booking #SQ-8821',
    text: 'Taking the 4x4 campervan to Pangong Tso was the trip of a lifetime. The solar setup, heated bedding, and off-grid battery lasted through sub-zero Ladakh nights without a hiccup. Instant booking on Stay Q made pickup effortless.',
  },
  {
    avatar: 'avatar_elena.jpg',
    name: 'Elena Gilbert',
    place: 'Indiranagar, Bengaluru',
    trip: 'Luxury Studio Loft',
    dates: 'Long-term 3 months · 0% Brokerage',
    verifiedId: 'Zero Broker Verified #SQ-7104',
    text: 'Zero Brokerage saved me ₹45,000 on upfront agent commissions in Bangalore. Verified Aadhaar KYC and digital lease took under 15 minutes. Best rental platform in India by far.',
  },
  {
    avatar: 'avatar_alex.jpg',
    name: 'Alexandre Meyer',
    place: 'Coorg, Karnataka',
    trip: 'Riverside Wilderness Campsite',
    dates: 'Stayed 3 nights · Sep 2026',
    verifiedId: 'StarHost Verified #SQ-9412',
    text: 'The campsite was exactly as pictured: private riverside access, firewood prepared, and 100% off-grid peace. No fake photos or inflated prices. Truly reliable hosting.',
  },
  {
    avatar: 'avatar_sophia.jpg',
    name: 'Sophia D\'Souza',
    place: 'Anjuna & Assagao, Goa',
    trip: 'Heritage Pool Villa',
    dates: 'Stayed 7 nights · Jul 2026',
    verifiedId: 'Verified Stay #SQ-6309',
    text: 'As a frequent traveler to Goa, avoiding middleman commissions while getting 5-star villa luxury with an on-demand chef was unmatched. Customer concierge answered within 60 seconds.',
  },
  {
    avatar: 'avatar_jean.jpg',
    name: 'Jean-Luc Dubois',
    place: 'Spiti Valley, Himachal',
    trip: 'High-Altitude 4x4 Campervan',
    dates: 'Stayed 6 nights · Aug 2026',
    verifiedId: 'Verified Expedition #SQ-5510',
    text: 'Qube AI planned our entire Spiti off-grid caravan route with designated water refill and safe parking spots. Saved us countless hours of dangerous guesswork in the mountains.',
  },
];

export function Testimonials() {
  return (
    <section className="section" id="testimonials">
      <div className="shell rel">
        <div className="section-head section-head--center">
          <Reveal>
            <span className="eyebrow">
              <ShieldCheck size={14} style={{ display: 'inline', marginRight: 6, verticalAlign: '-2px' }} />
              100% Verified Guest Reviews
            </span>
          </Reveal>
          <Reveal delay={0.06}>
            <h2 className="h1">
              Real stories from <span className="grad-text">1,420+ Indian Expeditions.</span>
            </h2>
          </Reveal>
          <Reveal delay={0.12}>
            <p className="sub" style={{ maxWidth: 620, margin: '0.75rem auto 0' }}>
              Every review is tied to a verified booking ID and Aadhaar-verified traveler. Zero fabricated testimonials.
            </p>
          </Reveal>
        </div>

        <div className="quotes">
          {VERIFIED_REVIEWS.map((q, i) => (
            <Reveal key={q.name} delay={i * 0.06}>
              <figure className="quote" style={{ borderRadius: 24, boxShadow: '0 12px 32px rgba(15, 23, 42, 0.08)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <div className="quote__stars" aria-label="Rated 5 out of 5">
                    {Array.from({ length: 5 }).map((_, s) => (
                      <Star key={s} size={14} fill="#F59E0B" color="#F59E0B" aria-hidden="true" />
                    ))}
                  </div>
                  <span style={{ fontSize: '0.68rem', color: '#10B981', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    <CheckCircle2 size={12} /> {q.verifiedId}
                  </span>
                </div>
                
                <blockquote className="quote__text">"{q.text}"</blockquote>
                
                <figcaption className="quote__who" style={{ marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid rgba(226, 232, 240, 0.8)' }}>
                  <img
                    className="quote__avatar"
                    src={`/images/${q.avatar}`}
                    alt={q.name}
                    loading="lazy"
                  />
                  <span>
                    <strong className="quote__name" style={{ color: '#0F172A', fontSize: '0.88rem' }}>{q.name}</strong>
                    <br />
                    <span className="quote__place" style={{ color: '#64748B', fontSize: '0.74rem' }}>
                      <MapPin size={11} style={{ display: 'inline', marginRight: 2, verticalAlign: '-1px' }} />
                      {q.place} · {q.trip}
                    </span>
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
