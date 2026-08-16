import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Globe, MapPin, ChevronDown, CheckCircle2 } from 'lucide-react';
import { Nav } from './Nav';

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
};

const FAQs = [
  { q: "How do I cancel a booking?", a: "You can cancel a booking directly through the app under 'My Trips' or by contacting us via email." },
  { q: "How long does a refund take?", a: "Refunds typically take 5-7 business days to reflect in your original payment method." },
  { q: "How do I become a host?", a: "Download the Stay Q app, switch to 'Host Mode' from your profile, and follow the simple onboarding steps." },
  { q: "Is Stay Q available outside India?", a: "We are currently operating exclusively in India, but international expansion is in our future plans." },
  { q: "How does Zero Broker work?", a: "Our long-term rentals are strictly 11-month leases direct from owners. You pay zero brokerage fees, just a small one-time platform verification fee." }
];

export function ContactPage() {
  const [submitted, setSubmitted] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 5000);
  };

  return (
    <div className="contact__page">
      <Nav />
      <main>
        {/* Hero */}
        <section className="contact__hero">
          <div className="shell">
            <motion.div
              className="contact__hero-content"
              initial="hidden"
              animate="visible"
              variants={fadeUp}
            >
              <h1>Get in Touch</h1>
              <p className="lead">We're here to help. Reach out to our 24/7 support team.</p>
            </motion.div>
          </div>
        </section>

        <section className="contact__main shell">
          <motion.div 
            className="contact__cards"
            initial="hidden"
            animate="visible"
            variants={fadeUp}
          >
            <div className="contact__card">
              <div className="contact__icon-wrap"><Mail size={24} /></div>
              <h3>Email Us</h3>
              <a href="mailto:support@stayq.space">support@stayq.space</a>
            </div>
            <div className="contact__card">
              <div className="contact__icon-wrap"><Globe size={24} /></div>
              <h3>Website</h3>
              <a href="https://www.stayq.space" target="_blank" rel="noreferrer">www.stayq.space</a>
            </div>
            <div className="contact__card">
              <div className="contact__icon-wrap"><MapPin size={24} /></div>
              <h3>Location</h3>
              <p>India</p>
            </div>
          </motion.div>

          <div className="contact__split">
            <motion.div 
              className="contact__form-wrap"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-10%" }}
              variants={fadeUp}
            >
              <h2>Send a Message</h2>
              {submitted ? (
                <div className="contact__success">
                  <CheckCircle2 size={48} className="contact__success-icon" />
                  <h3>Message Sent!</h3>
                  <p>We've received your request and will get back to you shortly.</p>
                </div>
              ) : (
                <form className="contact__form" onSubmit={handleSubmit}>
                  <div className="form-group">
                    <label>Name</label>
                    <input type="text" required placeholder="John Doe" />
                  </div>
                  <div className="form-group">
                    <label>Email</label>
                    <input type="email" required placeholder="john@example.com" />
                  </div>
                  <div className="form-group">
                    <label>Subject</label>
                    <select required>
                      <option value="">Select a topic...</option>
                      <option value="general">General Inquiry</option>
                      <option value="booking">Booking Issue</option>
                      <option value="host">Host Support</option>
                      <option value="partner">Partnership</option>
                      <option value="bug">Bug Report</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Message</label>
                    <textarea required rows={5} placeholder="How can we help?"></textarea>
                  </div>
                  <button type="submit" className="contact__submit">
                    Send Message
                  </button>
                </form>
              )}
            </motion.div>

            <motion.div 
              className="contact__faq-wrap"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-10%" }}
              variants={fadeUp}
            >
              <h2>FAQs</h2>
              <div className="contact__faqs">
                {FAQs.map((faq, i) => (
                  <div key={i} className={`contact__faq ${openFaq === i ? 'is-open' : ''}`}>
                    <button className="contact__faq-btn" onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                      <span>{faq.q}</span>
                      <ChevronDown size={18} className="contact__faq-icon" />
                    </button>
                    <AnimatePresence>
                      {openFaq === i && (
                        <motion.div 
                          className="contact__faq-content"
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                        >
                          <p>{faq.a}</p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </section>
      </main>
    </div>
  );
}
