import { motion } from 'framer-motion';
import { ArrowRight, BadgeCheck, Sparkles } from 'lucide-react';

const rise = {
  hidden: { opacity: 0, y: 30 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.85, delay: 0.07 * i, ease: [0.16, 1, 0.3, 1] as const },
  }),
};

export function Hero() {
  return (
    <section className="hero grain" id="top">
      {/* Soft violet aurora */}
      <div
        className="aurora aurora--violet"
        style={{ width: 620, height: 620, top: -220, right: -140 }}
        aria-hidden="true"
      />
      <div
        className="aurora aurora--orchid"
        style={{ width: 500, height: 500, bottom: -260, left: -180 }}
        aria-hidden="true"
      />

      <div className="shell rel">
        <div className="hero__grid">
          <div className="hero__copy">
            <motion.div variants={rise} initial="hidden" animate="show" custom={0}>
              <span className="eyebrow">
                <Sparkles size={13} aria-hidden="true" />
                Stays · Experiences · Zero Broker
              </span>
            </motion.div>

            <motion.h1
              className="h-display"
              variants={rise}
              initial="hidden"
              animate="show"
              custom={1}
            >
              Find your
              <br />
              <span className="grad-text">perfect stay.</span>
            </motion.h1>

            <motion.p
              className="lead"
              variants={rise}
              initial="hidden"
              animate="show"
              custom={2}
              style={{ maxWidth: 500 }}
            >
              Villas, cabins, treehouses, campsites and RVs — plus long-term homes with
              absolutely zero brokerage. Let Qube AI plan the whole trip for you.
            </motion.p>

            <motion.div
              className="hero__actions"
              variants={rise}
              initial="hidden"
              animate="show"
              custom={3}
            >
              <a className="btn btn--primary btn--lg" href="#/stays">
                Browse Stays
                <ArrowRight size={17} aria-hidden="true" />
              </a>
              <a className="btn btn--ghost btn--lg" href="#/zero-broker">
                Explore Zero Broker
              </a>
            </motion.div>

            <motion.p
              className="hero__note"
              variants={rise}
              initial="hidden"
              animate="show"
              custom={4}
            >
              <BadgeCheck size={15} color="var(--green)" aria-hidden="true" />
              Verified hosts · Instant booking · Secure payments
            </motion.p>
          </div>

          <div className="hero__visual">
            <div className="hero__halo" aria-hidden="true" />

            <motion.img
              className="hero__mascot float"
              src="/images/mascot.png"
              alt="Stay Q guide character welcoming travellers"
              initial={{ opacity: 0, scale: 0.9, y: 24 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 1.05, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
