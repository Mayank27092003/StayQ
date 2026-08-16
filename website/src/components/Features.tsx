import { Gift, Heart, MessageSquare, ShieldCheck, Users, Wallet, Zap, BellRing } from 'lucide-react';
import { Reveal } from './Reveal';

/** Each card corresponds to a capability that exists in the product. */
const FEATURES = [
  {
    icon: Zap,
    title: 'Instant Book',
    body: 'Listings marked Instant Book confirm immediately — no waiting on host approval.',
  },
  {
    icon: ShieldCheck,
    title: 'Two-way reviews',
    body: 'Reviews stay hidden until both guest and host submit, so nobody writes defensively.',
  },
  {
    icon: Users,
    title: 'StarHosts',
    body: 'Hosts with consistently strong ratings and response times carry a StarHost badge.',
  },
  {
    icon: Wallet,
    title: 'Wallet credits',
    body: 'Referral bonuses and goodwill credits land in your wallet and apply at checkout.',
  },
  {
    icon: Gift,
    title: 'Referrals',
    body: 'Invite a friend and you both earn — ₹500 for you, ₹300 for them on their first stay.',
  },
  {
    icon: Heart,
    title: 'Wishlists & alerts',
    body: 'Save places you love and get notified when a saved search drops in price.',
  },
  {
    icon: MessageSquare,
    title: 'Direct messaging',
    body: 'Talk to your host before and during the stay, all inside the app.',
  },
  {
    icon: BellRing,
    title: 'Cruise Ticket',
    body: 'Every confirmed booking generates a shareable ticket with your trip details.',
  },
];

export function Features() {
  return (
    <section className="section" id="features">
      <div className="shell rel">
        <div className="section-head section-head--center">
          <Reveal>
            <span className="eyebrow">Why Stay Q</span>
          </Reveal>
          <Reveal delay={0.06}>
            <h2 className="h1">
              Built to be <span className="grad-text">trusted.</span>
            </h2>
          </Reveal>
        </div>

        <div className="feat__grid">
          {FEATURES.map((f, i) => {
            const Icon = f.icon;
            return (
              <Reveal key={f.title} delay={i * 0.05}>
                <article className="feat">
                  <span className="feat__icon" aria-hidden="true">
                    <Icon size={22} />
                  </span>
                  <h3 className="feat__title">{f.title}</h3>
                  <p className="feat__body">{f.body}</p>
                </article>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
