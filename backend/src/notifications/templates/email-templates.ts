export function escapeHtml(value: unknown): string {
  return String(value ?? '').replace(
    /[&<>"']/g,
    (ch) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[
        ch
      ]!,
  );
}
function template(subject: string, data: Record<string, unknown>) {
  const flatten = (v: any): any =>
    Array.isArray(v)
      ? v.map(flatten)
      : v && typeof v === 'object'
        ? Object.fromEntries(
            Object.entries(v)
              .filter(([k]) => k !== 'initialPassword' && k !== 'to')
              .map(([k, x]) => [k, flatten(x)]),
          )
        : v;
  const values = flatten(data);
  return {
    subject,
    html:
      '<!doctype html><html><body style="font-family:Arial,sans-serif;background:#f5f7fa;padding:24px"><main style="max-width:600px;margin:auto;background:white;padding:24px;border-radius:12px"><h1>StayQ</h1><h2>' +
      escapeHtml(subject) +
      '</h2>' +
      Object.entries(values)
        .map(
          ([k, v]) =>
            '<p><strong>' +
            escapeHtml(k) +
            ':</strong> ' +
            escapeHtml(typeof v === 'object' ? JSON.stringify(v) : v) +
            '</p>',
        )
        .join('') +
      '<p>View the app for the latest status. Do not share verification codes.</p></main></body></html>',
  };
}

function renderBrandedEmail(options: {
  previewText: string;
  heading: string;
  subheading: string;
  bodyHtml: string;
  ctaText?: string;
  ctaUrl?: string;
  footerNote?: string;
}): string {
  const ctaButton = options.ctaText && options.ctaUrl ? `
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" style="margin: 28px 0 20px 0;">
      <tr>
        <td align="center" style="border-radius: 12px; background: linear-gradient(135deg, #5A31F4 0%, #7F56D9 100%);">
          <a href="${escapeHtml(options.ctaUrl)}" target="_blank" style="font-size: 15px; font-weight: 700; color: #ffffff; text-decoration: none; padding: 14px 28px; display: inline-block; border-radius: 12px; letter-spacing: 0.2px;">
            ${escapeHtml(options.ctaText)} &rarr;
          </a>
        </td>
      </tr>
    </table>` : '';

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(options.heading)}</title>
</head>
<body style="margin:0;padding:0;background-color:#F8FAFC;font-family:-apple-system,BlinkMacSystemFont,'SF Pro Display','Segoe UI',Roboto,Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;">
  <div style="display:none;font-size:1px;color:#F8FAFC;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;">
    ${escapeHtml(options.previewText)}
  </div>
  <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color:#F8FAFC;padding:36px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:24px;overflow:hidden;box-shadow:0 8px 30px rgba(0,0,0,0.06);border:1px solid #E2E8F0;">
          <tr>
            <td style="background: linear-gradient(135deg, #09090B 0%, #18181B 100%); padding: 32px 32px; border-bottom: 2px solid #5A31F4;">
              <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <div style="font-size: 26px; font-weight: 900; color: #ffffff; letter-spacing: -0.5px;">
                      Stay<span style="color: #A78BFA;">Q</span>
                    </div>
                    <div style="font-size: 12px; font-weight: 500; color: #A1A1AA; margin-top: 4px; letter-spacing: 0.2px;">
                      India's 1st Curated Campervan &amp; Unique Stays Network
                    </div>
                  </td>
                  <td align="right">
                    <span style="display:inline-block;padding:4px 10px;background:rgba(90,49,244,0.25);border:1px solid rgba(167,139,250,0.3);border-radius:20px;font-size:11px;font-weight:700;color:#C4B5FD;text-transform:uppercase;letter-spacing:0.5px;">
                      Verified Guest
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding: 36px 32px 28px 32px;">
              <h1 style="margin: 0 0 8px 0; font-size: 22px; font-weight: 800; color: #09090B; letter-spacing: -0.3px;">
                ${escapeHtml(options.heading)}
              </h1>
              <p style="margin: 0 0 24px 0; font-size: 15px; line-height: 1.6; color: #52525B;">
                ${escapeHtml(options.subheading)}
              </p>
              ${options.bodyHtml}
              ${ctaButton}
              ${options.footerNote ? `<p style="margin: 20px 0 0 0; font-size: 12px; color: #A1A1AA; line-height: 1.5;">${escapeHtml(options.footerNote)}</p>` : ''}
            </td>
          </tr>
          <tr>
            <td style="background-color: #FAFAFA; padding: 24px 32px; border-top: 1px solid #F4F4F5; text-align: center;">
              <p style="margin: 0 0 8px 0; font-size: 12px; color: #71717A; font-weight: 500;">
                StayQ Technologies &bull; Direct Verified Bookings with Zero Brokerage
              </p>
              <p style="margin: 0; font-size: 11px; color: #A1A1AA;">
                Questions? Reply directly to this email or reach us at <a href="mailto:support@stayq.space" style="color: #5A31F4; text-decoration: none; font-weight: 600;">support@stayq.space</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export const EmailTemplates = {
  hostApplicationReceived(
    hostName: string,
    propertyTitle: string,
    city: string,
  ) {
    return template('Host application received', {
      hostName,
      propertyTitle,
      city,
    });
  },
  newHostAdminAlert(
    hostName: string,
    hostEmail: string,
    hostPhone: string,
    propertyTitle: string,
    city: string,
  ) {
    return template('new Host Admin Alert', {
      hostName,
      hostEmail,
      hostPhone,
      propertyTitle,
      city,
    });
  },
  hostApproved(hostName: string, propertyTitle: string) {
    return template('Host approved', { hostName, propertyTitle });
  },
  hostIncompleteProfile(
    hostName: string,
    propertyTitle: string,
    missingItems: string[],
  ) {
    return template('host Incomplete Profile', {
      hostName,
      propertyTitle,
      missingItems,
    });
  },
  hostKycVerified(hostName: string, maskedAccount: string) {
    return template('host Kyc Verified', { hostName, maskedAccount });
  },
  propertyLiveNotification(
    hostName: string,
    propertyTitle: string,
    propertyCode: string,
  ) {
    return template('property Live Notification', {
      hostName,
      propertyTitle,
      propertyCode,
    });
  },
  starHostBadgeAchieved(hostName: string) {
    return template('star Host Badge Achieved', { hostName });
  },
  hostPricingSurgeTips(
    hostName: string,
    city: string,
    recommendedRate: number,
  ) {
    return template('host Pricing Surge Tips', {
      hostName,
      city,
      recommendedRate,
    });
  },
  guestBookingConfirmed(params: {
    guestName: string;
    propertyTitle: string;
    city: string;
    checkIn: string;
    checkOut: string;
    confirmationCode: string;
    totalAmount: number;
    nights: number;
  }) {
    return template('Booking confirmed', { params });
  },
  hostNewBookingAlert(params: {
    hostName: string;
    guestName: string;
    propertyTitle: string;
    checkIn: string;
    checkOut: string;
    guests: number;
    payout: number;
    confirmationCode: string;
  }) {
    return template('host New Booking Alert', { params });
  },
  guest7DaysPreTrip(
    guestName: string,
    propertyTitle: string,
    city: string,
    checkIn: string,
  ) {
    return template('guest7Days Pre Trip', {
      guestName,
      propertyTitle,
      city,
      checkIn,
    });
  },
  guest24HoursPreCheckIn(params: {
    guestName: string;
    propertyTitle: string;
    address: string;
    wifiName: string;
    wifiPass: string;
    gateCode: string;
    hostPhone: string;
  }) {
    return template('guest24Hours Pre Check In', { params });
  },
  bookingCancelledAndRefund(params: {
    recipientName: string;
    propertyTitle: string;
    code: string;
    refundAmount: number;
    refundStatus: string;
  }) {
    return template('Cancellation and refund update', { params });
  },
  postStayReviewRequest(
    guestName: string,
    propertyTitle: string,
    code: string,
  ) {
    return template('post Stay Review Request', {
      guestName,
      propertyTitle,
      code,
    });
  },
  officialGstInvoice(params: {
    guestName: string;
    code: string;
    propertyTitle: string;
    amount: number;
    gstNumber?: string;
    invoiceUrl: string;
  }) {
    return template('Invoice details', { params });
  },
  hostPayoutSent(params: {
    hostName: string;
    amount: number;
    utr: string;
    propertyTitle: string;
  }) {
    return template('Host transfer recorded', { params });
  },
  maintenanceFaultAlert(params: {
    hostName: string;
    propertyCode: string;
    propertyTitle: string;
    category: string;
    severity: string;
    description: string;
  }) {
    return template('maintenance Fault Alert', { params });
  },
  supportTicketUpdate(params: {
    recipientName: string;
    ticketId: string;
    subjectText: string;
    message: string;
  }) {
    return template('Support ticket update', { params });
  },
  staffWelcomeCredentials(params: {
    staffName: string;
    staffId: string;
    email: string;
    initialPassword: string;
    department: string;
    allowedModules: string[];
  }) {
    return template('Staff directory invitation', { params });
  },
  welcomeNewUser(userName: string) {
    const cleanName = userName ? userName.trim() : 'Explorer';
    const html = renderBrandedEmail({
      previewText: `Welcome to StayQ, ${cleanName}! Your adventure begins now.`,
      heading: `Welcome to StayQ, ${cleanName}!`,
      subheading: `Your account is active. Explore verified campervans, handpicked nature stays, and zero-broker direct bookings across India.`,
      bodyHtml: `
        <div style="background: #F4F4F5; border-radius: 16px; padding: 20px; margin: 20px 0;">
          <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0">
            <tr>
              <td style="padding-bottom: 14px;">
                <div style="font-weight: 700; font-size: 14px; color: #18181B; margin-bottom: 2px;">🚐 Overland Campervans</div>
                <div style="font-size: 13px; color: #71717A; line-height: 1.4;">India's first curated campervan fleet ready for mountain corridors and coastal escapes.</div>
              </td>
            </tr>
            <tr>
              <td style="padding-bottom: 14px;">
                <div style="font-weight: 700; font-size: 14px; color: #18181B; margin-bottom: 2px;">🏕️ Handpicked Eco-Camps &amp; Stays</div>
                <div style="font-size: 13px; color: #71717A; line-height: 1.4;">Curated stargazing glamps, heritage homestays, and private villas with verified hosts.</div>
              </td>
            </tr>
            <tr>
              <td>
                <div style="font-weight: 700; font-size: 14px; color: #18181B; margin-bottom: 2px;">🛡️ 100% Direct &amp; Secure</div>
                <div style="font-size: 13px; color: #71717A; line-height: 1.4;">Zero hidden brokerage, escrow payment protection, and 24/7 travel support.</div>
              </td>
            </tr>
          </table>
        </div>
      `,
      ctaText: 'Start Exploring Stays',
      ctaUrl: 'https://stayq.space',
      footerNote: 'You received this email because you created an account on StayQ.',
    });

    return {
      subject: `Welcome to StayQ, ${cleanName}! ✨`,
      html,
    };
  },

  guestWelcomeWithReferral(params: {
    guestName: string;
    referralCode: string;
    walletCredit?: number;
  }) {
    const cleanName = params.guestName ? params.guestName.trim() : 'Explorer';
    const code = params.referralCode || 'STAYQ';
    const credit = params.walletCredit ?? 250;

    const html = renderBrandedEmail({
      previewText: `Welcome to StayQ! Your invite code ${code} unlocked ₹${credit} in travel credits.`,
      heading: `Welcome to StayQ, ${cleanName}!`,
      subheading: `Your account is ready, and we've credited ₹${credit} StayQ travel points to your wallet for your first booking.`,
      bodyHtml: `
        <div style="background: linear-gradient(135deg, #5A31F4 0%, #4318FF 100%); border-radius: 16px; padding: 22px; margin: 20px 0; text-align: center; color: #ffffff;">
          <div style="font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #E0E7FF;">Your Exclusive Referral Code</div>
          <div style="font-size: 26px; font-weight: 900; letter-spacing: 2px; margin: 8px 0; font-family: monospace; background: rgba(255,255,255,0.15); display: inline-block; padding: 6px 18px; border-radius: 10px; border: 1px dashed rgba(255,255,255,0.4);">
            ${escapeHtml(code)}
          </div>
          <div style="font-size: 13px; color: #C7D2FE; margin-top: 6px;">Share with friends to earn ₹250 points whenever they complete their first trip.</div>
        </div>

        <div style="background: #F4F4F5; border-radius: 16px; padding: 20px; margin: 20px 0;">
          <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0">
            <tr>
              <td style="padding-bottom: 14px;">
                <div style="font-weight: 700; font-size: 14px; color: #18181B; margin-bottom: 2px;">🚐 Overland Campervans &amp; RVs</div>
                <div style="font-size: 13px; color: #71717A; line-height: 1.4;">Explore Himachal, Ladakh, and Western Ghats in full comfort.</div>
              </td>
            </tr>
            <tr>
              <td style="padding-bottom: 14px;">
                <div style="font-weight: 700; font-size: 14px; color: #18181B; margin-bottom: 2px;">🏕️ Secret Glamping &amp; Nature Sites</div>
                <div style="font-size: 13px; color: #71717A; line-height: 1.4;">Riverside camping, treehouses, and private estates.</div>
              </td>
            </tr>
            <tr>
              <td>
                <div style="font-weight: 700; font-size: 14px; color: #18181B; margin-bottom: 2px;">⚡ Instant UIDAI Aadhaar Verification</div>
                <div style="font-size: 13px; color: #71717A; line-height: 1.4;">One-tap instant check-in without cumbersome physical paperwork.</div>
              </td>
            </tr>
          </table>
        </div>
      `,
      ctaText: 'Claim Reward & Explore Stays',
      ctaUrl: 'https://stayq.space',
      footerNote: 'Your welcome reward points are automatically applied at checkout.',
    });

    return {
      subject: `Welcome to StayQ! Your ₹${credit} travel credit is ready 🎁`,
      html,
    };
  },

  hostWelcomeWithCode(params: { hostName: string; hostCode: string }) {
    const cleanName = params.hostName ? params.hostName.trim() : 'Host Partner';
    const code = params.hostCode || 'ST-HOST';

    const html = renderBrandedEmail({
      previewText: `Welcome to StayQ Host Network! Your Host ID is ${code}.`,
      heading: `Welcome to StayQ Host Network, ${cleanName}!`,
      subheading: `Your listing partner account has been created. Connect with thousands of verified travelers looking for unique stays.`,
      bodyHtml: `
        <div style="background: #F4F4F5; border-radius: 16px; padding: 22px; margin: 20px 0; text-align: center;">
          <div style="font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #71717A;">Your Host Partner ID</div>
          <div style="font-size: 24px; font-weight: 900; letter-spacing: 1.5px; margin: 8px 0; font-family: monospace; color: #5A31F4;">
            ${escapeHtml(code)}
          </div>
          <div style="font-size: 13px; color: #52525B; margin-top: 6px;">Quote this reference ID for host payouts, priority onboarding, and support.</div>
        </div>
      `,
      ctaText: 'Open Host Dashboard',
      ctaUrl: 'https://stayq.space/host',
      footerNote: 'You received this notification as a registered StayQ host partner.',
    });

    return {
      subject: `Welcome to the StayQ Host Network! (Partner ID: ${code}) 🌟`,
      html,
    };
  },
};
