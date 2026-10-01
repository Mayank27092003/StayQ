"use client";

import React from 'react';
import { IndianRupee, ShieldCheck, Clock, CheckCircle2 } from 'lucide-react';

export const RefundPolicy: React.FC = () => {
  return (
    <div className="shell" style={{ padding: '7.5rem 1rem 6rem', maxWidth: '920px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '2.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '2rem' }}>
        <span style={{ fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#10B981', background: 'rgba(16, 185, 129, 0.08)', padding: '0.35rem 0.85rem', borderRadius: '999px', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
          <IndianRupee size={14} /> Official Marketplace Policy
        </span>
        <h1 className="h1" style={{ marginTop: '0.75rem', marginBottom: '0.5rem', fontSize: '2.2rem', fontWeight: 900, color: 'var(--ink)' }}>
          Stay Q – Cancellation &amp; Refund Policy
        </h1>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem', fontSize: '0.88rem', color: 'var(--gray-600)', marginTop: '0.75rem' }}>
          <span><strong>Operated by:</strong> Quatalyst Private Limited</span>
          <span><strong>Effective Date:</strong> March 1, 2026</span>
          <span><strong>Last Updated:</strong> August 2026</span>
        </div>
        <p style={{ color: 'var(--gray-700)', fontSize: '0.98rem', marginTop: '1rem', lineHeight: 1.7 }}>
          Stay Q, operated by <strong>Quatalyst Private Limited</strong>, is a property booking and hosting marketplace that connects guests with hosts offering accommodation and related services. This Cancellation &amp; Refund Policy explains the circumstances under which a guest may cancel a reservation and receive a full or partial refund. By making a reservation through Stay Q, you agree to the cancellation and refund terms applicable to that reservation.
        </p>
      </div>

      {/* 4 Standard Policy Tiers Visual Summary */}
      <div style={{ marginBottom: '3rem' }}>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--ink)', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <ShieldCheck size={22} style={{ color: 'var(--primary)' }} />
          Standard Cancellation Options Overview
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
          {/* Flexible */}
          <div style={{ background: 'var(--white)', padding: '1.4rem', borderRadius: '16px', border: '1.5px solid #10B981', boxShadow: 'var(--shadow-sm)' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#10B981', textTransform: 'uppercase' }}>Tier A: Flexible</span>
            <h4 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--ink)', margin: '0.35rem 0' }}>100% Full Refund</h4>
            <p style={{ fontSize: '0.84rem', color: 'var(--gray-600)', margin: '0 0 0.6rem 0', lineHeight: 1.5 }}>
              Full refund if cancelled within the period specified in the property listing (typically 24h–48h before check-in).
            </p>
          </div>

          {/* Moderate */}
          <div style={{ background: 'var(--white)', padding: '1.4rem', borderRadius: '16px', border: '1.5px solid #F59E0B', boxShadow: 'var(--shadow-sm)' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#F59E0B', textTransform: 'uppercase' }}>Tier B: Moderate</span>
            <h4 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--ink)', margin: '0.35rem 0' }}>5-Day Full / 50%</h4>
            <p style={{ fontSize: '0.84rem', color: 'var(--gray-600)', margin: '0 0 0.6rem 0', lineHeight: 1.5 }}>
              Full refund when cancelling at least 5 days prior to check-in. Partial refund if cancelling closer to check-in.
            </p>
          </div>

          {/* Strict */}
          <div style={{ background: 'var(--white)', padding: '1.4rem', borderRadius: '16px', border: '1.5px solid #EF4444', boxShadow: 'var(--shadow-sm)' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#EF4444', textTransform: 'uppercase' }}>Tier C: Strict</span>
            <h4 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--ink)', margin: '0.35rem 0' }}>48h Grace / 50% Window</h4>
            <p style={{ fontSize: '0.84rem', color: 'var(--gray-600)', margin: '0 0 0.6rem 0', lineHeight: 1.5 }}>
              Full refund within 48 hours of booking if check-in is 14+ days away. 50% refund up to 7 days before check-in.
            </p>
          </div>

          {/* Non-Refundable */}
          <div style={{ background: 'var(--white)', padding: '1.4rem', borderRadius: '16px', border: '1.5px solid var(--gray-400)', boxShadow: 'var(--shadow-sm)' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--gray-600)', textTransform: 'uppercase' }}>Tier D: Non-Refundable</span>
            <h4 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--ink)', margin: '0.35rem 0' }}>Discounted / Fixed Rate</h4>
            <p style={{ fontSize: '0.84rem', color: 'var(--gray-600)', margin: '0 0 0.6rem 0', lineHeight: 1.5 }}>
              Promotional rates offering special discounts with no refund except under applicable law or extraordinary circumstances.
            </p>
          </div>
        </div>
      </div>

      {/* Complete 28 Legal Sections */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem', fontSize: '0.94rem', lineHeight: 1.75, color: 'var(--gray-800)' }}>
        
        {/* Section 1 */}
        <section id="section-1" style={{ background: 'var(--white)', padding: '1.8rem', borderRadius: '16px', border: '1px solid var(--border)' }}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--ink)', marginBottom: '0.8rem' }}>
            1. Property-Specific Cancellation Policy
          </h3>
          <p>
            Each property listed on Stay Q may have a cancellation policy selected by the host and approved or made available through Stay Q. The applicable cancellation policy will be displayed to the guest before the booking is confirmed.
          </p>
          <p style={{ marginTop: '0.6rem' }}>
            Guests should carefully review the cancellation terms, refund conditions, check-in date, and applicable fees before completing a reservation. The cancellation policy displayed at the time of booking generally governs the reservation unless Stay Q's exceptional circumstances or other applicable policies apply.
          </p>
        </section>

        {/* Section 2 */}
        <section id="section-2" style={{ background: 'var(--white)', padding: '1.8rem', borderRadius: '16px', border: '1px solid var(--border)' }}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--ink)', marginBottom: '0.8rem' }}>
            2. Standard Cancellation Options
          </h3>
          <p>Stay Q may offer different cancellation options depending on the property, host, location, booking type, and length of stay:</p>
          <ul style={{ paddingLeft: '1.5rem', marginTop: '0.6rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <li><strong>A. Flexible Cancellation:</strong> Under a Flexible policy, the guest may receive a full refund if the reservation is cancelled within the period specified in the property's listing. After the applicable cancellation deadline, the guest may receive a partial refund or no refund depending on the reservation terms.</li>
            <li><strong>B. Moderate Cancellation:</strong> Under a Moderate policy, guests may receive a full or partial refund when cancelling sufficiently before the scheduled check-in date. Cancellations made closer to check-in may result in a partial refund or no refund.</li>
            <li><strong>C. Strict Cancellation:</strong> Under a Strict policy, the guest may receive a limited refund only when cancelling within the specified period after booking or sufficiently before check-in. Cancellations made after the applicable deadline may be non-refundable.</li>
            <li><strong>D. Non-Refundable Reservations:</strong> Some properties, promotional rates, special offers, or booking types may be offered as non-refundable. If a reservation is marked Non-Refundable, the guest may not receive a refund except where required by applicable law or where Stay Q's applicable exceptional-circumstances policy applies.</li>
          </ul>
        </section>

        {/* Section 3 */}
        <section id="section-3" style={{ background: 'var(--white)', padding: '1.8rem', borderRadius: '16px', border: '1px solid var(--border)' }}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--ink)', marginBottom: '0.8rem' }}>
            3. Cancellation by Guest
          </h3>
          <p>Guests may cancel a reservation through their Stay Q account or through the cancellation method provided by Stay Q. The refund amount will depend on:</p>
          <ul style={{ paddingLeft: '1.5rem', marginTop: '0.6rem', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
            <li>The property's cancellation policy.</li>
            <li>Date and time of cancellation.</li>
            <li>Check-in date.</li>
            <li>Booking type.</li>
            <li>Number of nights.</li>
            <li>Applicable taxes and fees.</li>
            <li>Special promotional conditions.</li>
            <li>Any applicable non-refundable charges.</li>
          </ul>
          <p style={{ marginTop: '0.8rem' }}>
            The applicable refund amount should be displayed to the guest before the cancellation is finalized where technically possible.
          </p>
        </section>

        {/* Section 4 & 5 */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '1.5rem' }}>
          <section id="section-4" style={{ background: 'var(--white)', padding: '1.8rem', borderRadius: '16px', border: '1px solid var(--border)' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--ink)', marginBottom: '0.8rem' }}>
              4. Full Refund
            </h3>
            <p>A guest may be eligible for a full refund where:</p>
            <ul style={{ paddingLeft: '1.5rem', marginTop: '0.6rem', display: 'flex', flexDirection: 'column', gap: '0.3rem', fontSize: '0.9rem' }}>
              <li>The reservation is cancelled within the property's full-refund period.</li>
              <li>The host cancels the reservation.</li>
              <li>The property is unavailable due to circumstances attributable to the host.</li>
              <li>Stay Q determines that the reservation cannot reasonably be fulfilled.</li>
              <li>The guest qualifies under an applicable Stay Q exceptional-circumstances policy.</li>
              <li>A full refund is required under applicable law.</li>
            </ul>
            <p style={{ marginTop: '0.6rem', fontSize: '0.88rem', color: 'var(--gray-600)' }}>
              A full refund generally means the eligible booking amount is returned, subject to the specific terms displayed at the time of booking.
            </p>
          </section>

          <section id="section-5" style={{ background: 'var(--white)', padding: '1.8rem', borderRadius: '16px', border: '1px solid var(--border)' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--ink)', marginBottom: '0.8rem' }}>
              5. Partial Refund
            </h3>
            <p>A partial refund may apply where:</p>
            <ul style={{ paddingLeft: '1.5rem', marginTop: '0.6rem', display: 'flex', flexDirection: 'column', gap: '0.3rem', fontSize: '0.9rem' }}>
              <li>The guest cancels after the full-refund period.</li>
              <li>The guest shortens an existing reservation.</li>
              <li>The guest does not use all booked nights.</li>
              <li>The property becomes partially unavailable.</li>
              <li>The host and guest agree to a partial refund.</li>
              <li>Stay Q determines that a partial refund is appropriate under an applicable policy.</li>
            </ul>
            <p style={{ marginTop: '0.6rem', fontSize: '0.88rem', color: 'var(--gray-600)' }}>
              The amount of the refund will depend on the circumstances and applicable booking terms.
            </p>
          </section>
        </div>

        {/* Section 6 & 7 */}
        <section id="section-6" style={{ background: 'var(--white)', padding: '1.8rem', borderRadius: '16px', border: '1px solid var(--border)' }}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--ink)', marginBottom: '0.8rem' }}>
            6. Cancellation by Host
          </h3>
          <p>
            Hosts are expected to honour confirmed reservations. If a host cancels a confirmed reservation without an applicable exception, Stay Q may:
          </p>
          <ul style={{ paddingLeft: '1.5rem', marginTop: '0.6rem', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
            <li>Provide the guest with a full refund.</li>
            <li>Help the guest find an alternative property.</li>
            <li>Provide booking credits or other assistance where appropriate.</li>
            <li>Restrict or suspend the host's listing.</li>
            <li>Apply other measures permitted under Stay Q's host policies.</li>
          </ul>
          <p style={{ marginTop: '0.6rem', fontSize: '0.88rem', color: 'var(--gray-600)' }}>
            Host cancellation consequences may depend on the circumstances, timing, and reason for cancellation.
          </p>
        </section>

        {/* Section 7 */}
        <section id="section-7" style={{ background: 'var(--white)', padding: '1.8rem', borderRadius: '16px', border: '1px solid var(--border)' }}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--ink)', marginBottom: '0.8rem' }}>
            7. Property Not Available
          </h3>
          <p>
            If the property is materially different from the confirmed listing or is not reasonably available for the guest's stay, the guest should contact Stay Q as soon as possible. Examples may include:
          </p>
          <ul style={{ paddingLeft: '1.5rem', marginTop: '0.6rem', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
            <li>Property unavailable at arrival.</li>
            <li>Incorrect property address.</li>
            <li>Property substantially different from its listing.</li>
            <li>Major advertised facilities unavailable.</li>
            <li>Serious cleanliness or safety issues.</li>
            <li>Property rendered unusable before check-in.</li>
          </ul>
          <p style={{ marginTop: '0.6rem' }}>
            Stay Q may investigate the issue and may provide an appropriate remedy, which may include a full or partial refund or assistance finding alternative accommodation.
          </p>
        </section>

        {/* Section 8 */}
        <section id="section-8" style={{ background: 'var(--white)', padding: '1.8rem', borderRadius: '16px', border: '1px solid var(--border)' }}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--ink)', marginBottom: '0.8rem' }}>
            8. Major Property Problems During Stay
          </h3>
          <p>If a serious problem occurs during a stay, guests should:</p>
          <ol style={{ paddingLeft: '1.5rem', marginTop: '0.6rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            <li>Contact the host as soon as reasonably possible.</li>
            <li>Give the host a reasonable opportunity to resolve the issue where practical.</li>
            <li>Contact Stay Q if the problem cannot reasonably be resolved.</li>
            <li>Provide photographs, videos, messages, receipts, or other evidence where requested.</li>
          </ol>
          <p style={{ marginTop: '0.8rem' }}>
            Depending on the circumstances, Stay Q may provide a partial refund, full refund for unused nights, alternative accommodation assistance, or other appropriate remedies.
          </p>
        </section>

        {/* Section 9 */}
        <section id="section-9" style={{ background: 'var(--white)', padding: '1.8rem', borderRadius: '16px', border: '1px solid var(--border)' }}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--ink)', marginBottom: '0.8rem' }}>
            9. Extraordinary or Unavoidable Circumstances
          </h3>
          <p>
            Stay Q may provide special cancellation or refund options when extraordinary circumstances make a reservation impossible or materially impractical. Examples may include:
          </p>
          <ul style={{ paddingLeft: '1.5rem', marginTop: '0.6rem', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
            <li>Natural disasters and extreme weather emergencies.</li>
            <li>Government-mandated travel restrictions or lockdowns.</li>
            <li>War, civil unrest, or declared state of emergency.</li>
            <li>Public health emergencies and mandatory evacuations.</li>
            <li>Major utility or infrastructure failures outside host control.</li>
          </ul>
          <p style={{ marginTop: '0.8rem', fontSize: '0.88rem', color: 'var(--gray-600)' }}>
            Personal circumstances such as changes in travel plans, flight delays, minor personal illness, or financial difficulties do not automatically qualify for an exceptional refund. Guests are strongly encouraged to obtain comprehensive travel insurance.
          </p>
        </section>

        {/* Section 10 to 15 Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
          {/* Section 10 */}
          <div style={{ background: 'var(--white)', padding: '1.5rem', borderRadius: '16px', border: '1px solid var(--border)' }}>
            <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--ink)', marginBottom: '0.5rem' }}>10. Early Departure</h4>
            <p style={{ fontSize: '0.88rem', color: 'var(--gray-700)' }}>
              Leaving before scheduled checkout does not automatically entitle a guest to a refund for unused nights. Refunds depend on host agreement and property policy.
            </p>
          </div>

          {/* Section 11 */}
          <div style={{ background: 'var(--white)', padding: '1.5rem', borderRadius: '16px', border: '1px solid var(--border)' }}>
            <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--ink)', marginBottom: '0.5rem' }}>11. No-Show</h4>
            <p style={{ fontSize: '0.88rem', color: 'var(--gray-700)' }}>
              Failure to arrive without prior cancellation will be treated as a no-show. Unused nights are non-refundable unless specified otherwise by the host.
            </p>
          </div>

          {/* Section 12 */}
          <div style={{ background: 'var(--white)', padding: '1.5rem', borderRadius: '16px', border: '1px solid var(--border)' }}>
            <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--ink)', marginBottom: '0.5rem' }}>12. Late Arrival</h4>
            <p style={{ fontSize: '0.88rem', color: 'var(--gray-700)' }}>
              Guests should notify the host of late check-ins. If access is unjustly denied by the host, contact Stay Q Support immediately.
            </p>
          </div>

          {/* Section 13 */}
          <div style={{ background: 'var(--white)', padding: '1.5rem', borderRadius: '16px', border: '1px solid var(--border)' }}>
            <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--ink)', marginBottom: '0.5rem' }}>13. Booking Modification</h4>
            <p style={{ fontSize: '0.88rem', color: 'var(--gray-700)' }}>
              Date or guest count modifications are subject to host approval, rate differences, and may apply a new cancellation policy window.
            </p>
          </div>

          {/* Section 14 */}
          <div style={{ background: 'var(--white)', padding: '1.5rem', borderRadius: '16px', border: '1px solid var(--border)' }}>
            <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--ink)', marginBottom: '0.5rem' }}>14. Service Fees</h4>
            <p style={{ fontSize: '0.88rem', color: 'var(--gray-700)' }}>
              Platform service fees are refunded when a booking is eligible for a 100% full refund before the strict deadline.
            </p>
          </div>

          {/* Section 15 */}
          <div style={{ background: 'var(--white)', padding: '1.5rem', borderRadius: '16px', border: '1px solid var(--border)' }}>
            <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--ink)', marginBottom: '0.5rem' }}>15. Taxes</h4>
            <p style={{ fontSize: '0.88rem', color: 'var(--gray-700)' }}>
              Applicable GST or local statutory taxes are refunded in accordance with applicable Indian tax regulations and remittance status.
            </p>
          </div>
        </div>

        {/* Section 16 & 17: Refund Processing */}
        <section id="section-16" style={{ background: 'var(--white)', padding: '1.8rem', borderRadius: '16px', border: '1px solid var(--border)' }}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--ink)', marginBottom: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Clock size={20} style={{ color: 'var(--primary)' }} />
            16. Refund Processing Timelines &amp; 17. Alternative Payment Methods
          </h3>
          <p>
            Once Stay Q approves a refund, the amount is automatically initiated through our licensed payment gateway (Cashfree Payments / UPI / NetBanking / Cards) directly to your original payment method:
          </p>
          <ul style={{ paddingLeft: '1.5rem', marginTop: '0.6rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            <li><strong>UPI &amp; Instant Wallets:</strong> 15 minutes to 24 business hours.</li>
            <li><strong>NetBanking &amp; Debit Cards:</strong> 2 to 5 banking business days.</li>
            <li><strong>Credit Cards:</strong> 3 to 7 banking business days (depending on your issuing bank).</li>
          </ul>
          <p style={{ marginTop: '0.8rem' }}>
            <strong>Section 17 (Alternative Methods):</strong> Where the original payment method is closed or expired, Stay Q may conduct identity verification and process via verified bank account (Penny Drop / IMPS).
          </p>
        </section>

        {/* Section 18 to 22: Credits, Damage, Fraud, Disputes */}
        <section id="section-18" style={{ background: 'var(--white)', padding: '1.8rem', borderRadius: '16px', border: '1px solid var(--border)' }}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--ink)', marginBottom: '0.8rem' }}>
            18. Promotions, 19. Credits, 20. Security Deposits &amp; 21. Fraud Prevention
          </h3>
          <ul style={{ paddingLeft: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            <li><strong>18. Promotional Codes:</strong> Discounts and coupons are non-refundable and non-transferable once applied to a completed reservation.</li>
            <li><strong>19. Booking Credits:</strong> Stay Q travel credits may have specific validity periods and terms communicated upon issuance.</li>
            <li><strong>20. Security Deposits &amp; Damage Claims:</strong> Security deposits for zero-broker homes or high-end properties are held safely and refunded post-checkout inspection. Guests have the right to respond to damage disputes with photographic proof.</li>
            <li><strong>21. Fraudulent Claims:</strong> Any fraudulent claims, manufactured evidence, or abuse of the refund policy will result in immediate claim denial and account suspension.</li>
            <li><strong>22. Dispute Resolution:</strong> If a host and guest disagree, Stay Q evaluates digital chat logs, entry logs, photos, and payment records to issue a fair, binding decision.</li>
          </ul>
        </section>

        {/* Section 23 & 24: How to Request Refund & Time Limits */}
        <section id="section-23" style={{ background: 'linear-gradient(135deg, rgba(90, 49, 244, 0.04), rgba(16, 185, 129, 0.04))', padding: '2rem', borderRadius: '20px', border: '1.5px solid var(--primary)', boxShadow: 'var(--shadow-sm)' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--ink)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <CheckCircle2 size={22} style={{ color: 'var(--primary)' }} />
            23. How to Request a Refund &amp; 24. Time Limits for Complaints
          </h3>
          <p style={{ marginBottom: '1rem' }}>
            Guests can initiate a cancellation or refund request directly from the application or web portal:
          </p>
          <div style={{ background: 'var(--white)', padding: '1.2rem 1.5rem', borderRadius: '12px', border: '1px solid var(--border)', fontWeight: 700, color: 'var(--primary)', display: 'inline-block', marginBottom: '1.2rem' }}>
            Stay Q App / Website → My Bookings → Select Booking → Help / Request Refund
          </div>
          <p>
            Alternatively, contact our 24/7 dedicated support desk with your Booking Reference Number:
          </p>
          <ul style={{ paddingLeft: '1.5rem', marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            <li><strong>Customer Support Email:</strong> <a href="mailto:support@stayq.space" style={{ color: 'var(--primary)', fontWeight: 700 }}>support@stayq.space</a></li>
            <li><strong>Formal Dispute &amp; Grievance Escalation:</strong> <a href="mailto:grievance@stayq.space" style={{ color: 'var(--primary)', fontWeight: 700 }}>grievance@stayq.space</a></li>
            <li><strong>24/7 Helpline:</strong> Accessible directly in the Stay Q App Support Hub</li>
          </ul>
          <p style={{ marginTop: '0.8rem', fontSize: '0.88rem', color: 'var(--gray-600)' }}>
            <strong>Section 24 (Time Limit):</strong> Issues discovered during stay must be reported within 24 hours of discovery with supporting documentation so Stay Q and the host have adequate opportunity to resolve the matter.
          </p>
        </section>

        {/* Section 25 to 28: Legal & Contact */}
        <section id="section-25" style={{ background: 'var(--white)', padding: '1.8rem', borderRadius: '16px', border: '1px solid var(--border)' }}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--ink)', marginBottom: '0.8rem' }}>
            25. Payment Gateways, 26. Modifications, 27. Applicable Law &amp; 28. Contact
          </h3>
          <ul style={{ paddingLeft: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            <li><strong>25. Third-Party Payment Providers:</strong> Payments and refunds are processed via RBI-authorized payment gateways, banking partners, and NPCI UPI networks.</li>
            <li><strong>26. Changes to This Policy:</strong> Stay Q may update this policy to reflect operational or regulatory changes. The &quot;Last Updated&quot; timestamp indicates the latest revision.</li>
            <li><strong>27. Applicable Law &amp; Jurisdiction:</strong> This policy is governed by and construed in accordance with the laws of India. Mandatory consumer protection rights under the Consumer Protection Act, 2019 are fully respected.</li>
            <li><strong>28. Legal Entity:</strong> Stay Q is a property booking and hosting platform operated by <strong>Quatalyst Private Limited</strong>.</li>
          </ul>
        </section>

      </div>

      {/* Footer Signoff */}
      <div style={{ marginTop: '3.5rem', padding: '2rem', background: 'var(--surface)', borderRadius: '18px', textAlign: 'center', border: '1px solid var(--border)' }}>
        <h4 style={{ fontSize: '1.2rem', fontWeight: 900, color: 'var(--ink)', margin: '0 0 0.4rem 0' }}>Stay Q</h4>
        <p style={{ fontSize: '0.9rem', color: 'var(--gray-600)', margin: '0 0 1rem 0', fontWeight: 600 }}>Stay. Discover. Experience.</p>
        <p style={{ fontSize: '0.82rem', color: 'var(--gray-500)', margin: 0 }}>
          &copy; 2026 Quatalyst Private Limited. All Rights Reserved.
        </p>
      </div>
    </div>
  );
};

