import { motion } from 'framer-motion';
import { Home, Key, Tent, Truck, Sparkles } from 'lucide-react';

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
};

export function AboutPage() {
  return (
    <div className="about__page" style={{ paddingTop: '5.5rem' }}>
      <main>
        {/* Hero */}
        <section className="about__hero" style={{ background: 'linear-gradient(180deg, #FAF5FF 0%, #FFFFFF 100%)', padding: '5rem 0 3.5rem', borderBottom: '1px solid var(--border)' }}>
          <div className="shell">
            <motion.div
              className="about__hero-content"
              initial="hidden"
              animate="visible"
              variants={fadeUp}
              style={{ maxWidth: '820px', margin: '0 auto', textAlign: 'center' }}
            >
              <span className="eyebrow" style={{ color: 'var(--violet)', marginBottom: '1rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                <Sparkles size={15} /> Quatalyst Private Limited
              </span>
              <h1 style={{ fontSize: 'clamp(2.2rem, 4vw, 3.2rem)', fontWeight: 900, lineHeight: 1.15, color: 'var(--ink)', letterSpacing: '-0.03em', marginBottom: '1.25rem' }}>
                More Than a Place to Stay. <br />
                <span className="grad-text">It’s Where Your Journey Begins.</span>
              </h1>
              <p className="lead" style={{ fontSize: '1.15rem', color: 'var(--gray-600)', lineHeight: 1.6 }}>
                Stay Q is a next-generation accommodation and travel marketplace developed by <strong>Quatalyst Private Limited</strong>, created to make finding, booking, renting, and experiencing places easier, more flexible, and more accessible.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Narrative Section */}
        <motion.section 
          className="about__story shell"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-10%" }}
          variants={fadeUp}
          style={{ padding: '4rem 1.5rem', maxWidth: '840px', margin: '0 auto' }}
        >
          <div style={{ background: 'var(--white)', padding: '2.5rem', borderRadius: '24px', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
            <h2 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--ink)', marginBottom: '1rem' }}>Built for the Way People Travel Today</h2>
            <p style={{ fontSize: '1.02rem', lineHeight: 1.7, color: 'var(--gray-700)', marginBottom: '1rem' }}>
              Travel is changing. People are looking for more flexibility, better value, unique experiences, longer stays, and new ways to explore. Whether you are planning a weekend getaway, looking for a comfortable homestay, searching for a long-term rental, planning an adventurous road trip, or heading into the mountains for your next trek, Stay Q brings multiple ways to stay and explore together on one unified platform.
            </p>
            <p style={{ fontSize: '1.02rem', lineHeight: 1.7, color: 'var(--gray-700)' }}>
              From a cozy homestay to a long-term apartment, from an RV adventure to a campsite in the mountains, Stay Q brings different accommodation possibilities together in one growing ecosystem.
            </p>
          </div>
        </motion.section>

        {/* 4 Core Verticals from PDF */}
        <motion.section 
          className="about__offer shell"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-10%" }}
          variants={fadeUp}
          style={{ padding: '2rem 1.5rem 4rem' }}
        >
          <div style={{ textAlign: 'center', maxWidth: '640px', margin: '0 auto 3rem' }}>
            <span className="eyebrow" style={{ color: 'var(--violet)' }}>One Platform · Multiple Ways to Stay</span>
            <h2 style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--ink)', marginTop: '0.4rem' }}>Our 4 Core Travel Verticals</h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', maxWidth: '1140px', margin: '0 auto' }}>
            {/* 1. Homestays */}
            <div style={{ background: 'var(--white)', padding: '2rem', borderRadius: '20px', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'rgba(90, 49, 244, 0.1)', color: 'var(--violet)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.25rem' }}>
                <Home size={24} />
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--ink)', marginBottom: '0.6rem' }}>🏡 Homestays &amp; Short-Term Rentals</h3>
              <p style={{ fontSize: '0.92rem', color: 'var(--gray-600)', lineHeight: 1.6, flexGrow: 1 }}>
                Discover a curated collection of homes, apartments, luxury villas, mountain cabins, cottages, and heritage havelis for holidays, workcations, family vacations, and weekend escapes.
              </p>
            </div>

            {/* 2. Zero-Broker */}
            <div style={{ background: 'var(--white)', padding: '2rem', borderRadius: '20px', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'rgba(18, 183, 106, 0.1)', color: '#12b76a', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.25rem' }}>
                <Key size={24} />
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--ink)', marginBottom: '0.6rem' }}>🔑 Zero-Broker Long-Stay Rentals</h3>
              <p style={{ fontSize: '0.92rem', color: 'var(--gray-600)', lineHeight: 1.6, flexGrow: 1 }}>
                Finding a home for a few months shouldn't mean paying large brokerage fees. Stay Q offers transparent, zero-brokerage 11-month rental opportunities connecting owners and prospective tenants directly.
              </p>
            </div>

            {/* 3. RVs */}
            <div style={{ background: 'var(--white)', padding: '2rem', borderRadius: '20px', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'rgba(247, 144, 9, 0.1)', color: '#f79009', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.25rem' }}>
                <Truck size={24} />
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--ink)', marginBottom: '0.6rem' }}>🚐 RV &amp; Road-Trip Bookings</h3>
              <p style={{ fontSize: '0.92rem', color: 'var(--gray-600)', lineHeight: 1.6, flexGrow: 1 }}>
                For travellers who believe the journey is just as important as the destination. Book campervans, motorhomes, and overland 4x4 vehicles with digital handovers and verified insurance.
              </p>
            </div>

            {/* 4. Camps & Treks */}
            <div style={{ background: 'var(--white)', padding: '2rem', borderRadius: '20px', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'rgba(2, 122, 72, 0.1)', color: '#027a48', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.25rem' }}>
                <Tent size={24} />
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--ink)', marginBottom: '0.6rem' }}>⛺ Camps &amp; Trekking Experiences</h3>
              <p style={{ fontSize: '0.92rem', color: 'var(--gray-600)', lineHeight: 1.6, flexGrow: 1 }}>
                For adventure seekers, discover campsites and outdoor stays located close to trekking routes, mountains, alpine forests, and adventure trails, paired with guided outdoor experiences.
              </p>
            </div>
          </div>
        </motion.section>

        {/* Our Vision Banner */}
        <motion.section 
          className="shell"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-10%" }}
          variants={fadeUp}
          style={{ padding: '0 1.5rem 5rem' }}
        >
          <div
            style={{
              background: 'linear-gradient(135deg, #1E1B4B 0%, #0F172A 100%)',
              borderRadius: '28px',
              padding: '3.5rem 2.5rem',
              color: '#ffffff',
              textAlign: 'center',
              maxWidth: '1040px',
              margin: '0 auto',
            }}
          >
            <span style={{ fontSize: '0.82rem', fontWeight: 800, letterSpacing: '0.12em', color: '#A78BFA', textTransform: 'uppercase' }}>
              Our Core Vision
            </span>
            <h2 style={{ fontSize: 'clamp(2rem, 3.5vw, 2.75rem)', fontWeight: 900, marginTop: '0.75rem', marginBottom: '1rem', color: '#FFFFFF' }}>
              Stay • Rent • Explore • Travel • Adventure
            </h2>
            <p style={{ fontSize: '1.05rem', color: '#CBD5E1', maxWidth: '640px', margin: '0 auto 2rem', lineHeight: 1.6 }}>
              At the same time, Stay Q empowers property owners, hosts, landlords, RV operators, campsite owners, and adventure-stay providers to reach customers and grow their businesses through a trusted digital platform.
            </p>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1.25rem', borderRadius: '999px', background: 'rgba(255, 255, 255, 0.1)', border: '1px solid rgba(255, 255, 255, 0.2)', fontSize: '0.9rem', fontWeight: 700 }}>
              Stay Q — Stay Your Way. Explore Your World.
            </div>
          </div>
        </motion.section>
      </main>
    </div>
  );
}
