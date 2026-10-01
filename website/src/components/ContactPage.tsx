"use client";

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Globe, MapPin, ChevronDown, CheckCircle2, Headphones, Scale, Sparkles, MessageSquare } from 'lucide-react';

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
};

const FAQs = [
  { q: "How do I cancel a booking?", a: "You can cancel a booking directly through the app under 'My Trips' or by contacting our 24/7 support on WhatsApp (+91 9225270718) or via email at support@stayq.space." },
  { q: "How long does a refund take?", a: "Refunds typically take 5-7 business days to reflect in your original payment method." },
  { q: "How do I become a host?", a: "Download the Stay Q app, switch to 'Host Mode' from your profile, or chat with our host team on WhatsApp (+91 9225270718) / email hello@stayq.space." },
];

export const ContactPage = () => {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.name && formData.email && formData.message) {
      setSubmitted(true);
    }
  };

  return (
    <div className="contact-page">
      <main>
        {/* Hero */}
        <section className="contact__hero">
          <div className="shell">
            <motion.div 
              className="contact__header"
              initial="hidden"
              animate="visible"
              variants={fadeUp}
            >
              <h1>Get in Touch</h1>
              <p className="lead">We're here to help. Reach out to our 24/7 dedicated support &amp; concierge teams.</p>
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
            {/* 1. Official WhatsApp Support (Instant) */}
            <div className="contact__card" style={{ borderTop: '3px solid #25D366' }}>
              <div className="contact__icon-wrap" style={{ background: 'rgba(37, 211, 102, 0.12)', color: '#25D366' }}><MessageSquare size={24} /></div>
              <h3>WhatsApp Support</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--gray-500)', marginBottom: '0.5rem' }}>Instant chat &amp; 24/7 concierge assistance</p>
              <a href="https://wa.me/919225270718?text=Hi%20Stay%20Q%20Support" target="_blank" rel="noopener noreferrer" style={{ fontWeight: 700, color: '#16A34A' }}>+91 9225270718</a>
            </div>

            {/* 2. Customer Support Desk */}
            <div className="contact__card" style={{ borderTop: '3px solid var(--violet)' }}>
              <div className="contact__icon-wrap"><Headphones size={24} /></div>
              <h3>Customer Support Desk</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--gray-500)', marginBottom: '0.5rem' }}>Bookings, cancellations &amp; ticketing</p>
              <a href="mailto:support@stayq.space" style={{ fontWeight: 700, color: 'var(--violet)' }}>support@stayq.space</a>
            </div>

            {/* 3. Grievance Redressal */}
            <div className="contact__card" style={{ borderTop: '3px solid #10B981' }}>
              <div className="contact__icon-wrap" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10B981' }}><Scale size={24} /></div>
              <h3>Grievance Redressal</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--gray-500)', marginBottom: '0.5rem' }}>Statutory complaints &amp; legal compliance</p>
              <a href="mailto:grievance@stayq.space" style={{ fontWeight: 700, color: '#10B981' }}>grievance@stayq.space</a>
            </div>

            {/* 4. Brand & Partnerships */}
            <div className="contact__card" style={{ borderTop: '3px solid #F59E0B' }}>
              <div className="contact__icon-wrap" style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#F59E0B' }}><Sparkles size={24} /></div>
              <h3>Hello &amp; Partnerships</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--gray-500)', marginBottom: '0.5rem' }}>Host onboarding, press &amp; collaborations</p>
              <a href="mailto:hello@stayq.space" style={{ fontWeight: 700, color: '#D97706' }}>hello@stayq.space</a>
            </div>

            {/* 4. Platform Headquarters */}
            <div className="contact__card">
              <div className="contact__icon-wrap"><Globe size={24} /></div>
              <h3>Platform &amp; Corporate</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--gray-500)', marginBottom: '0.5rem' }}>Quatalyst Private Limited · India</p>
              <a href="https://www.stayq.space" target="_blank" rel="noreferrer">www.stayq.space</a>
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
              <p style={{ fontSize: '0.85rem', color: 'var(--gray-600)', marginBottom: '1.25rem', marginTop: '0.25rem' }}>
                All customer messages are routed directly to our 24/7 Concierge &amp; Support desk (<a href="mailto:support@stayq.space" style={{ color: 'var(--violet)', fontWeight: 600 }}>support@stayq.space</a>).
              </p>
              {submitted ? (
                <div className="contact__success">
                  <CheckCircle2 size={48} className="contact__success-icon" />
                  <h3>Message Sent!</h3>
                  <p>We've received your request and dispatched it to support@stayq.space. Our team will get back to you shortly.</p>
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
