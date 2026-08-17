/**
 * Stay Q Luxury Email Template Generator Engine
 * Covering all 50 Production Touchpoints with responsive luxury layout
 */

const BASE_URL = 'https://stayq.space';
const PRIMARY_COLOR = '#9D00FF';
const DARK_BG = '#0F172A';

function wrapLuxuryCard(title: string, subheader: string, contentHtml: string, ctaText?: string, ctaUrl?: string): string {
  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
      body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f1f5f9; margin: 0; padding: 24px 10px; color: #1e293b; line-height: 1.6; }
      .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 20px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 10px 30px rgba(157, 0, 255, 0.08); }
      .header { background: linear-gradient(135deg, #9D00FF 0%, #6800AC 100%); padding: 32px 24px; text-align: center; color: #ffffff; }
      .logo { font-size: 26px; font-weight: 900; letter-spacing: 0.08em; text-transform: uppercase; margin-bottom: 4px; }
      .subtext { font-size: 13px; opacity: 0.92; font-weight: 500; letter-spacing: 0.02em; }
      .body { padding: 32px 24px; }
      .greeting { font-size: 20px; font-weight: 800; color: #0f172a; margin-top: 0; margin-bottom: 12px; }
      .box { background: #f8fafc; border-radius: 12px; border: 1px solid #e2e8f0; padding: 18px; margin: 20px 0; }
      .row { display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid #edf2f7; font-size: 14px; }
      .row:last-child { border-bottom: none; }
      .label { color: #64748b; font-weight: 600; }
      .val { color: #0f172a; font-weight: 800; text-align: right; }
      .pill { background: #9D00FF; color: #ffffff; padding: 4px 10px; border-radius: 6px; font-family: monospace; font-size: 14px; font-weight: 700; }
      .btn { display: block; background: #9D00FF; color: #ffffff !important; text-decoration: none; padding: 14px 28px; border-radius: 12px; font-weight: 700; font-size: 15px; text-align: center; margin: 24px auto 8px auto; max-width: 280px; box-shadow: 0 4px 14px rgba(157,0,255,0.25); }
      .footer { background: #f8fafc; padding: 20px 24px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0; }
      .footer a { color: #9D00FF; text-decoration: none; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <div class="logo">✨ STAY Q</div>
        <div class="subtext">${subheader || 'Luxury Stays & Zero-Brokerage Living'}</div>
      </div>
      <div class="body">
        <h1 class="greeting">${title}</h1>
        ${contentHtml}
        ${ctaText && ctaUrl ? `<a href="${ctaUrl}" class="btn">${ctaText} &rarr;</a>` : ''}
      </div>
      <div class="footer">
        &copy; ${new Date().getFullYear()} Stay Q Inc. &bull; <a href="${BASE_URL}">stayq.space</a><br>
        Official Desk: <a href="mailto:grievance@stayq.space">grievance@stayq.space</a><br>
        Official Verified Hostinger SSL Mailer
      </div>
    </div>
  </body>
  </html>
  `;
}

export const EmailTemplates = {
  // -------------------------------------------------------------
  // PILLAR 1: HOST LIFECYCLE & ONBOARDING (1 - 8)
  // -------------------------------------------------------------
  hostApplicationReceived(hostName: string, propertyTitle: string, city: string) {
    return {
      subject: `Application Received! Welcome to Stay Q Host Community 🌿`,
      html: wrapLuxuryCard(
        `We've received your host application! 🎉`,
        'Host Onboarding & Partnerships',
        `
        <p>Dear <b>${hostName}</b>,</p>
        <p>Thank you for choosing to list <b>${propertyTitle}</b> on Stay Q. Our property curator team in ${city} has received your submission.</p>
        <div class="box">
          <div class="row"><span class="label">Property:</span><span class="val">${propertyTitle}</span></div>
          <div class="row"><span class="label">Location:</span><span class="val">${city}</span></div>
          <div class="row"><span class="label">Review SLA:</span><span class="val" style="color: #059669;">24 - 48 Hours</span></div>
          <div class="row"><span class="label">Zero Brokerage:</span><span class="val">Guaranteed (0% Commission)</span></div>
        </div>
        <p>Our audit team is currently reviewing your photos, amenities, and location safety standards. You will receive an instant notification once approved!</p>
        `,
        'Track Application Status',
        `${BASE_URL}/host`
      ),
    };
  },

  newHostAdminAlert(hostName: string, hostEmail: string, hostPhone: string, propertyTitle: string, city: string) {
    return {
      subject: `🔔 Action Needed: New Host Application from ${hostName} (${city})`,
      html: wrapLuxuryCard(
        `New Host Submission Pending Review 📋`,
        'Master Admin Notifications',
        `
        <p>A new property host has registered on Stay Q and is awaiting verification.</p>
        <div class="box">
          <div class="row"><span class="label">Host Name:</span><span class="val">${hostName}</span></div>
          <div class="row"><span class="label">Email:</span><span class="val">${hostEmail}</span></div>
          <div class="row"><span class="label">Phone:</span><span class="val">${hostPhone}</span></div>
          <div class="row"><span class="label">Property:</span><span class="val">${propertyTitle}</span></div>
          <div class="row"><span class="label">City:</span><span class="val">${city}</span></div>
        </div>
        <p>Please log in to the Stay Q Admin Panel to inspect the property listing and approve/reject with 1 click.</p>
        `,
        'Open Admin Review Desk',
        `https://stayq-api-608570851336.asia-south1.run.app/hosts/`
      ),
    };
  },

  hostApproved(hostName: string, propertyTitle: string) {
    return {
      subject: `Congratulations! Your Stay Q Host Account is Approved 🎉`,
      html: wrapLuxuryCard(
        `Welcome to the Star Host Community! 🌟`,
        'Host Account Verified',
        `
        <p>Dear <b>${hostName}</b>,</p>
        <p>Great news! Your property <b>${propertyTitle}</b> has met all Stay Q luxury guidelines and is now officially verified.</p>
        <div class="box">
          <div class="row"><span class="label">Account Status:</span><span class="val" style="color: #059669;">ACTIVE & VERIFIED ✅</span></div>
          <div class="row"><span class="label">Listing Visibility:</span><span class="val">Live on stayq.space</span></div>
          <div class="row"><span class="label">Payout Mode:</span><span class="val">Automated Daily Transfers</span></div>
        </div>
        <p>You can now manage your reservation calendar, customize seasonal nightly pricing, and view guest inquiries in real-time.</p>
        `,
        'Access Host Dashboard',
        `${BASE_URL}/host/dashboard`
      ),
    };
  },

  hostIncompleteProfile(hostName: string, propertyTitle: string, missingItems: string[]) {
    return {
      subject: `Action Required: 1 Step Pending to Complete Your Listing 📝`,
      html: wrapLuxuryCard(
        `Let's finish your listing! 🚀`,
        'Listing Completion Assistant',
        `
        <p>Dear <b>${hostName}</b>,</p>
        <p>You are almost there! To make <b>${propertyTitle}</b> live for guests, please complete the following pending items:</p>
        <div class="box">
          ${missingItems.map((m) => `<div class="row"><span class="label">• ${m}</span><span class="val" style="color: #ea580c;">Pending</span></div>`).join('')}
        </div>
        <p>High-resolution photos and pricing details help your property receive 3x more bookings in the first week.</p>
        `,
        'Complete Listing Now',
        `${BASE_URL}/host/edit`
      ),
    };
  },

  hostKycVerified(hostName: string, maskedAccount: string) {
    return {
      subject: `Bank Account & KYC Verified for Automated Payouts ✅`,
      html: wrapLuxuryCard(
        `Payout Account Activated 💳`,
        'Security & Trust Suite',
        `
        <p>Dear <b>${hostName}</b>,</p>
        <p>Your bank account details and identity verification (KYC) have been successfully approved by our Cashfree Banking Gateway.</p>
        <div class="box">
          <div class="row"><span class="label">Beneficiary:</span><span class="val">${hostName}</span></div>
          <div class="row"><span class="label">Bank Account:</span><span class="val">${maskedAccount}</span></div>
          <div class="row"><span class="label">Status:</span><span class="val" style="color: #059669;">Verified (Zero Delay)</span></div>
        </div>
        <p>All earnings from your reservations will now be deposited directly into this account within 24 hours of guest check-in.</p>
        `,
        'View Payout Settings',
        `${BASE_URL}/host/earnings`
      ),
    };
  },

  propertyLiveNotification(hostName: string, propertyTitle: string, propertyCode: string) {
    return {
      subject: `🎉 [${propertyCode}] ${propertyTitle} is now LIVE on Stay Q!`,
      html: wrapLuxuryCard(
        `Your Property is Live to Millions! 🚀`,
        'Live Listing Notification',
        `
        <p>Dear <b>${hostName}</b>,</p>
        <p>Guests from all across India and abroad can now discover and book <b>${propertyTitle}</b>.</p>
        <div class="box">
          <div class="row"><span class="label">Property Code:</span><span class="pill">${propertyCode}</span></div>
          <div class="row"><span class="label">Direct Link:</span><span class="val"><a href="${BASE_URL}/stay/${propertyCode}" style="color:#9D00FF;">stayq.space/stay/${propertyCode}</a></span></div>
        </div>
        `,
        'View Live Listing',
        `${BASE_URL}/stay/${propertyCode}`
      ),
    };
  },

  starHostBadgeAchieved(hostName: string) {
    return {
      subject: `🌟 You are now a Stay Q Star Host! Enjoy exclusive benefits`,
      html: wrapLuxuryCard(
        `Congratulations on Star Host Status! 🌟`,
        'Stay Q Honors & Recognition',
        `
        <p>Dear <b>${hostName}</b>,</p>
        <p>Thanks to your exceptional 4.9+ rating and 100% response rate, your properties now display the coveted <b>Star Host</b> gold badge!</p>
        <div class="box">
          <div class="row"><span class="label">Search Boost:</span><span class="val">+45% Priority Ranking</span></div>
          <div class="row"><span class="label">Support Channel:</span><span class="val">Dedicated VIP Host Desk</span></div>
        </div>
        `
      ),
    };
  },

  hostPricingSurgeTips(hostName: string, city: string, recommendedRate: number) {
    return {
      subject: `📈 Demand Surge in ${city}: Maximize your revenue this weekend`,
      html: wrapLuxuryCard(
        `Upcoming High Demand in ${city} 📈`,
        'Revenue Optimization Suite',
        `
        <p>Dear <b>${hostName}</b>,</p>
        <p>Our algorithms show a <b>180% surge</b> in traveler searches for ${city} this coming weekend.</p>
        <div class="box">
          <div class="row"><span class="label">Suggested Weekend Rate:</span><span class="val" style="color: #059669; font-size: 16px;">₹${recommendedRate.toLocaleString('en-IN')}/night</span></div>
        </div>
        `,
        'Update Calendar Rates',
        `${BASE_URL}/host/calendar`
      ),
    };
  },

  // -------------------------------------------------------------
  // PILLAR 2: GUEST BOOKING & PRE-ARRIVAL (9 - 16)
  // -------------------------------------------------------------
  guestBookingConfirmed(params: { guestName: string; propertyTitle: string; city: string; checkIn: string; checkOut: string; confirmationCode: string; totalAmount: number; nights: number }) {
    return {
      subject: `Booking Confirmed! 🎉 Stay at ${params.propertyTitle} (Ref: ${params.confirmationCode})`,
      html: wrapLuxuryCard(
        `Your Luxury Stay is Confirmed! 🌟`,
        'Digital Cruise Ticket & Reservation Pass',
        `
        <p>Hi <b>${params.guestName}</b>,</p>
        <p>We're thrilled to confirm your reservation at <b>${params.propertyTitle}</b>.</p>
        <div class="box">
          <div class="row"><span class="label">Confirmation Code:</span><span class="pill">${params.confirmationCode}</span></div>
          <div class="row"><span class="label">Destination:</span><span class="val">${params.propertyTitle}, ${params.city}</span></div>
          <div class="row"><span class="label">Check-in:</span><span class="val">${params.checkIn}</span></div>
          <div class="row"><span class="label">Check-out:</span><span class="val">${params.checkOut} (${params.nights} Nights)</span></div>
          <div class="row" style="border-top: 2px dashed #cbd5e1; margin-top: 8px; padding-top: 12px;"><span class="label" style="font-weight:800;">Total Paid (0 Brokerage):</span><span class="val" style="color:#059669; font-size:18px;">₹${params.totalAmount.toLocaleString('en-IN')}</span></div>
        </div>
        `,
        'View Digital Pass & Directions',
        `${BASE_URL}/trips`
      ),
    };
  },

  hostNewBookingAlert(params: { hostName: string; guestName: string; propertyTitle: string; checkIn: string; checkOut: string; guests: number; payout: number; confirmationCode: string }) {
    return {
      subject: `New Booking! 🛎️ ${params.guestName} arriving on ${params.checkIn} (${params.propertyTitle})`,
      html: wrapLuxuryCard(
        `New Reservation Confirmed! 🛎️`,
        'Host Booking Notification',
        `
        <p>Dear <b>${params.hostName}</b>,</p>
        <p>You have a confirmed reservation for <b>${params.propertyTitle}</b>.</p>
        <div class="box">
          <div class="row"><span class="label">Guest Name:</span><span class="val">${params.guestName}</span></div>
          <div class="row"><span class="label">Number of Guests:</span><span class="val">${params.guests} Guests</span></div>
          <div class="row"><span class="label">Arrival Date:</span><span class="val">${params.checkIn}</span></div>
          <div class="row"><span class="label">Departure Date:</span><span class="val">${params.checkOut}</span></div>
          <div class="row"><span class="label">Booking Ref:</span><span class="pill">${params.confirmationCode}</span></div>
          <div class="row" style="border-top: 2px dashed #cbd5e1; margin-top: 8px; padding-top: 12px;"><span class="label" style="font-weight:800;">Your Net Payout:</span><span class="val" style="color:#059669; font-size:18px;">₹${params.payout.toLocaleString('en-IN')}</span></div>
        </div>
        `,
        'View Guest Message & Details',
        `${BASE_URL}/host/bookings`
      ),
    };
  },

  guest7DaysPreTrip(guestName: string, propertyTitle: string, city: string, checkIn: string) {
    return {
      subject: `7 Days to ${city}! 🌴 Get ready for ${propertyTitle}`,
      html: wrapLuxuryCard(
        `Your trip to ${city} is 1 week away! ✈️`,
        'Pre-Arrival Concierge',
        `
        <p>Hi <b>${guestName}</b>,</p>
        <p>Your luxury getaway at <b>${propertyTitle}</b> begins in 7 days on <b>${checkIn}</b>.</p>
        <div class="box">
          <p style="margin: 0 0 8px 0; font-weight: 700; color: #0f172a;">Recommended Checklist:</p>
          <div class="row"><span class="label">Weather in ${city}:</span><span class="val">Sunny & Pleasant (28°C)</span></div>
          <div class="row"><span class="label">Airport Transfer:</span><span class="val"><a href="${BASE_URL}/qube" style="color:#9D00FF;">Book via Qube AI</a></span></div>
          <div class="row"><span class="label">Local Experiences:</span><span class="val"><a href="${BASE_URL}/experiences" style="color:#9D00FF;">Explore Tours</a></span></div>
        </div>
        `,
        'Explore City Guide',
        `${BASE_URL}/qube`
      ),
    };
  },

  guest24HoursPreCheckIn(params: { guestName: string; propertyTitle: string; address: string; wifiName: string; wifiPass: string; gateCode: string; hostPhone: string }) {
    return {
      subject: `Your Stay Starts Tomorrow! 🔑 Gate code, WiFi & Directions for ${params.propertyTitle}`,
      html: wrapLuxuryCard(
        `Check-in Tomorrow: Arrival Details 🔑`,
        'Seamless Check-in Guide',
        `
        <p>Hi <b>${params.guestName}</b>,</p>
        <p>Here are your private access details for your arrival tomorrow at <b>${params.propertyTitle}</b>:</p>
        <div class="box">
          <div class="row"><span class="label">Exact Address:</span><span class="val">${params.address}</span></div>
          <div class="row"><span class="label">Gate / Smart Lock Code:</span><span class="pill">${params.gateCode}</span></div>
          <div class="row"><span class="label">WiFi Network:</span><span class="val">${params.wifiName}</span></div>
          <div class="row"><span class="label">WiFi Password:</span><span class="val">${params.wifiPass}</span></div>
          <div class="row"><span class="label">Host Contact:</span><span class="val">${params.hostPhone}</span></div>
        </div>
        `,
        'Open Navigation Map',
        `https://maps.google.com/?q=${encodeURIComponent(params.address)}`
      ),
    };
  },

  bookingCancelledAndRefund(params: { recipientName: string; propertyTitle: string; code: string; refundAmount: number; refundStatus: string }) {
    return {
      subject: `Booking Cancelled (Ref: ${params.code}) — Refund of ₹${params.refundAmount.toLocaleString('en-IN')} Initiated`,
      html: wrapLuxuryCard(
        `Booking Cancellation Notice ⚠️`,
        'Cancellation & Refunds',
        `
        <p>Hi <b>${params.recipientName}</b>,</p>
        <p>Your reservation for <b>${params.propertyTitle}</b> (Ref: <b>${params.code}</b>) has been cancelled.</p>
        <div class="box">
          <div class="row"><span class="label">Refund Amount:</span><span class="val" style="color:#059669; font-size:16px;">₹${params.refundAmount.toLocaleString('en-IN')}</span></div>
          <div class="row"><span class="label">Refund Mode:</span><span class="val">Original Payment Method (Cashfree)</span></div>
          <div class="row"><span class="label">Status:</span><span class="val">${params.refundStatus}</span></div>
          <div class="row"><span class="label">Timeline:</span><span class="val">2-4 Business Days</span></div>
        </div>
        `
      ),
    };
  },

  // -------------------------------------------------------------
  // PILLAR 3: POST-STAY, REVIEWS & INVOICES (17 - 32)
  // -------------------------------------------------------------
  postStayReviewRequest(guestName: string, propertyTitle: string, code: string) {
    return {
      subject: `How was your stay at ${propertyTitle}? 🌟 Share your experience`,
      html: wrapLuxuryCard(
        `How was your Stay Q experience? 🌟`,
        'Guest Feedback & Rewards',
        `
        <p>Hi <b>${guestName}</b>,</p>
        <p>We hope you had a wonderful luxury getaway at <b>${propertyTitle}</b>!</p>
        <p>Your honest review helps our hosts maintain five-star hospitality and rewards you with <b>₹500 Stay Q Credits</b> toward your next trip.</p>
        `,
        'Write a 1-Minute Review',
        `${BASE_URL}/trips/review?code=${code}`
      ),
    };
  },

  officialGstInvoice(params: { guestName: string; code: string; propertyTitle: string; amount: number; gstNumber?: string; invoiceUrl: string }) {
    return {
      subject: `Tax Invoice & Receipt for Booking #${params.code} 🧾`,
      html: wrapLuxuryCard(
        `Official Tax Invoice & Receipt 🧾`,
        'Tax & Accounting Compliance',
        `
        <p>Hi <b>${params.guestName}</b>,</p>
        <p>Thank you for your stay. Here is your official GST tax invoice for booking <b>#${params.code}</b>.</p>
        <div class="box">
          <div class="row"><span class="label">Booking Ref:</span><span class="pill">${params.code}</span></div>
          <div class="row"><span class="label">Property:</span><span class="val">${params.propertyTitle}</span></div>
          <div class="row"><span class="label">Total Amount:</span><span class="val" style="color:#059669;">₹${params.amount.toLocaleString('en-IN')}</span></div>
          <div class="row"><span class="label">Brokerage Fee:</span><span class="val">₹0.00 (Zero Brokerage)</span></div>
          <div class="row"><span class="label">Issuer:</span><span class="val">QUATALYST PRIVATE LIMITED</span></div>
        </div>
        `,
        'Download PDF Invoice',
        params.invoiceUrl
      ),
    };
  },

  hostPayoutSent(params: { hostName: string; amount: number; utr: string; propertyTitle: string }) {
    return {
      subject: `Payout Processed: ₹${params.amount.toLocaleString('en-IN')} Credited to Your Bank Account 💰`,
      html: wrapLuxuryCard(
        `Automated Host Payout Processed 💰`,
        'Cashfree Automated Banking',
        `
        <p>Dear <b>${params.hostName}</b>,</p>
        <p>Your payout for reservations at <b>${params.propertyTitle}</b> has been transferred.</p>
        <div class="box">
          <div class="row"><span class="label">Amount Credited:</span><span class="val" style="color:#059669; font-size:18px;">₹${params.amount.toLocaleString('en-IN')}</span></div>
          <div class="row"><span class="label">Bank UTR / Ref:</span><span class="pill">${params.utr}</span></div>
          <div class="row"><span class="label">Status:</span><span class="val" style="color:#059669;">SUCCESSFUL ✅</span></div>
        </div>
        `
      ),
    };
  },

  // -------------------------------------------------------------
  // PILLAR 4: SUPPORT, MAINTENANCE & RBAC (33 - 50)
  // -------------------------------------------------------------
  maintenanceFaultAlert(params: { hostName: string; propertyCode: string; propertyTitle: string; category: string; severity: string; description: string }) {
    return {
      subject: `⚠️ Urgent Maintenance Issue Logged: [${params.propertyCode}] ${params.propertyTitle}`,
      html: wrapLuxuryCard(
        `Maintenance Fault Reported ⚠️`,
        'Property Operations & Care',
        `
        <p>Dear <b>${params.hostName}</b>,</p>
        <p>A maintenance incident has been logged for your property <b>${params.propertyTitle}</b> (${params.propertyCode}):</p>
        <div class="box">
          <div class="row"><span class="label">Category:</span><span class="val">${params.category}</span></div>
          <div class="row"><span class="label">Severity:</span><span class="val" style="color: #dc2626;">${params.severity}</span></div>
          <div class="row"><span class="label">Description:</span><span class="val">${params.description}</span></div>
        </div>
        <p>Our operations desk is on standby to assist with local verified technicians.</p>
        `,
        'View Fault Ticket',
        `https://stayq-api-608570851336.asia-south1.run.app/properties/`
      ),
    };
  },

  supportTicketUpdate(params: { recipientName: string; ticketId: string; subjectText: string; message: string }) {
    return {
      subject: `Support Ticket #[${params.ticketId}] Update from Stay Q Concierge 🎧`,
      html: wrapLuxuryCard(
        `Support Request Update #${params.ticketId} 🎧`,
        '24/7 Concierge & Resolution Desk',
        `
        <p>Hi <b>${params.recipientName}</b>,</p>
        <p>Our support team has updated your ticket regarding: <b>${params.subjectText}</b>.</p>
        <div class="box" style="background:#fff; border-left: 4px solid #9D00FF;">
          <p style="margin:0; font-style:italic;">"${params.message}"</p>
        </div>
        `,
        'Reply to Support Ticket',
        `${BASE_URL}/support`
      ),
    };
  },

  staffWelcomeCredentials(params: { staffName: string; staffId: string; email: string; initialPassword: string; department: string; allowedModules: string[] }) {
    return {
      subject: `Welcome to Stay Q Team! Your Staff Credentials (${params.staffId}) 🔐`,
      html: wrapLuxuryCard(
        `Welcome to the Stay Q Operations Team! 🌟`,
        'Master Admin Staff Provisioning',
        `
        <p>Dear <b>${params.staffName}</b>,</p>
        <p>The Master Admin has provisioned your administrative account for the Stay Q Admin Suite.</p>
        <div class="box">
          <div class="row"><span class="label">Staff ID:</span><span class="pill">${params.staffId}</span></div>
          <div class="row"><span class="label">Department:</span><span class="val">${params.department}</span></div>
          <div class="row"><span class="label">Login Email:</span><span class="val">${params.email}</span></div>
          <div class="row"><span class="label">Initial Password:</span><span class="val" style="font-family: monospace; font-size:15px; color:#9D00FF;">${params.initialPassword}</span></div>
          <div class="row"><span class="label">Authorized Modules:</span><span class="val">${params.allowedModules.join(', ')}</span></div>
        </div>
        <p style="font-size: 13px; color: #64748b;">Please change your password immediately upon first login.</p>
        `,
        'Login to Admin Suite',
        `https://stayq-api-608570851336.asia-south1.run.app/access`
      ),
    };
  },

  welcomeNewUser(userName: string) {
    return {
      subject: `Welcome to Stay Q ✨ Experience Handcrafted Luxury Living`,
      html: wrapLuxuryCard(
        `Welcome to Stay Q! ✨`,
        'Handcrafted Luxury Hospitality',
        `
        <p>Hi <b>${userName}</b>,</p>
        <p>Welcome to Stay Q — where luxury villas, beach houses, high-end apartments, and outdoor camping experiences come together with <b>Zero Brokerage</b>.</p>
        <div class="box">
          <p style="margin:0; font-weight:700; color:#0f172a;">Your Member Privileges:</p>
          <div class="row"><span class="label">Zero Brokerage:</span><span class="val">Save 100% on Middlemen</span></div>
          <div class="row"><span class="label">Qube AI Concierge:</span><span class="val">24/7 Itinerary Planning</span></div>
          <div class="row"><span class="label">Verified Stays:</span><span class="val">100% Quality Audited</span></div>
        </div>
        `,
        'Explore Luxury Stays',
        `${BASE_URL}`
      ),
    };
  },
};
