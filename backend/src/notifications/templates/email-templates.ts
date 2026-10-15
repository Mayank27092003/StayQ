export function escapeHtml(value: unknown): string {
  return String(value ?? '').replace(
    /[&<>"']/g,
    (ch) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[
        ch
      ]!,
  );
}

function renderInfoTable(
  rows: { label: string; value: string | number; isBadge?: boolean; isHighlight?: boolean }[],
): string {
  const trs = rows
    .map(
      (r, idx) => `
    <tr style="border-bottom: ${idx === rows.length - 1 ? 'none' : '1px solid #F1F5F9'};">
      <td style="padding: 12px 16px; font-size: 13px; font-weight: 500; color: #64748B; width: 40%; vertical-align: top;">
        ${escapeHtml(r.label)}
      </td>
      <td style="padding: 12px 16px; font-size: 14px; font-weight: ${r.isHighlight ? '800' : '600'}; color: ${r.isHighlight ? '#5A31F4' : '#0F172A'}; text-align: right; vertical-align: top;">
        ${
          r.isBadge
            ? `<span style="display:inline-block;padding:2px 8px;background:#EEF2FF;border:1px solid #C7D2FE;border-radius:6px;font-size:12px;font-weight:700;color:#4338CA;">${escapeHtml(r.value)}</span>`
            : escapeHtml(r.value)
        }
      </td>
    </tr>`,
    )
    .join('');

  return `
    <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:14px;margin:18px 0;overflow:hidden;border-collapse:collapse;">
      ${trs}
    </table>`;
}

function renderCallout(
  icon: string,
  title: string,
  text: string,
  variant: 'info' | 'success' | 'warning' = 'info',
): string {
  const bg = variant === 'warning' ? '#FFFBEB' : variant === 'success' ? '#F0FDF4' : '#F5F3FF';
  const border = variant === 'warning' ? '#FDE68A' : variant === 'success' ? '#BBF7D0' : '#DDD6FE';
  const titleColor = variant === 'warning' ? '#92400E' : variant === 'success' ? '#166534' : '#5B21B6';
  const textColor = variant === 'warning' ? '#78350F' : variant === 'success' ? '#14532D' : '#4C1D95';

  return `
    <div style="background:${bg};border:1px solid ${border};border-radius:14px;padding:16px;margin:18px 0;">
      <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0">
        <tr>
          <td style="vertical-align:top;width:28px;font-size:18px;line-height:1;">${icon}</td>
          <td style="vertical-align:top;padding-left:8px;">
            ${title ? `<div style="font-size:13px;font-weight:700;color:${titleColor};margin-bottom:4px;">${escapeHtml(title)}</div>` : ''}
            <div style="font-size:13px;line-height:1.5;color:${textColor};">${escapeHtml(text)}</div>
          </td>
        </tr>
      </table>
    </div>`;
}

function renderCodeBox(label: string, code: string, note?: string): string {
  return `
    <div style="background:linear-gradient(135deg, #18181B 0%, #27272A 100%);border-radius:14px;padding:20px;margin:20px 0;text-align:center;color:#ffffff;">
      <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#A1A1AA;">${escapeHtml(label)}</div>
      <div style="font-size:24px;font-weight:900;letter-spacing:2px;margin:8px 0;font-family:monospace;background:rgba(255,255,255,0.1);display:inline-block;padding:6px 18px;border-radius:10px;border:1px dashed rgba(255,255,255,0.3);color:#A78BFA;">
        ${escapeHtml(code)}
      </div>
      ${note ? `<div style="font-size:12px;color:#D4D4D8;margin-top:6px;">${escapeHtml(note)}</div>` : ''}
    </div>`;
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
  const ctaButton =
    options.ctaText && options.ctaUrl
      ? `
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" style="margin: 28px 0 20px 0;">
      <tr>
        <td align="center" style="border-radius: 12px; background: linear-gradient(135deg, #5A31F4 0%, #7F56D9 100%);">
          <a href="${escapeHtml(options.ctaUrl)}" target="_blank" style="font-size: 15px; font-weight: 700; color: #ffffff; text-decoration: none; padding: 14px 28px; display: inline-block; border-radius: 12px; letter-spacing: 0.2px;">
            ${escapeHtml(options.ctaText)} &rarr;
          </a>
        </td>
      </tr>
    </table>`
      : '';

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
                      Verified
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
              ${
                options.footerNote
                  ? `<p style="margin: 20px 0 0 0; font-size: 12px; color: #A1A1AA; line-height: 1.5;">${escapeHtml(options.footerNote)}</p>`
                  : ''
              }
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
    const cleanHost = hostName ? hostName.trim() : 'Host Partner';
    const html = renderBrandedEmail({
      previewText: `We received your host application for ${propertyTitle} in ${city}.`,
      heading: `Application Received! 🏡`,
      subheading: `Dear ${cleanHost}, thank you for submitting "${propertyTitle}" to join the StayQ Curated Host Network.`,
      bodyHtml: `
        ${renderInfoTable([
          { label: 'Property Title', value: propertyTitle },
          { label: 'Location', value: city },
          { label: 'Curation Status', value: 'Under Verification', isBadge: true },
        ])}
        ${renderCallout(
          '⏳',
          'Next Steps',
          'Our curation team verifies property amenities, location coordinates, and host identification. Approvals are typically completed within 24 to 48 hours.',
          'info',
        )}
      `,
      ctaText: 'View Application Status',
      ctaUrl: 'https://stayq.space/host',
      footerNote: 'You received this email because you submitted a property listing on StayQ.',
    });

    return {
      subject: `Host Application Received: ${propertyTitle} 🌿`,
      html,
    };
  },

  newHostAdminAlert(
    hostName: string,
    hostEmail: string,
    hostPhone: string,
    propertyTitle: string,
    city: string,
  ) {
    const html = renderBrandedEmail({
      previewText: `[ADMIN ALERT] New host application: ${propertyTitle} by ${hostName}`,
      heading: `New Host Submission 📋`,
      subheading: `A prospective host partner has submitted a property for StayQ curation and verification.`,
      bodyHtml: `
        ${renderInfoTable([
          { label: 'Host Name', value: hostName },
          { label: 'Host Email', value: hostEmail },
          { label: 'Host Phone', value: hostPhone },
          { label: 'Property Title', value: propertyTitle },
          { label: 'City / Region', value: city },
          { label: 'Submission Status', value: 'PENDING_REVIEW', isBadge: true },
        ])}
        ${renderCallout(
          '⚡',
          'Action Required',
          'Inspect the uploaded property images, location pin accuracy, and host KYC details before approving for public discovery.',
          'warning',
        )}
      `,
      ctaText: 'Review in Admin Console',
      ctaUrl: 'https://stayq.space/admin/moderation/host-applications',
      footerNote: 'StayQ Internal Administrative Notification.',
    });

    return {
      subject: `🚨 New Host Application: ${propertyTitle} (${city})`,
      html,
    };
  },

  hostApproved(hostName: string, propertyTitle: string) {
    const cleanHost = hostName ? hostName.trim() : 'Host Partner';
    const html = renderBrandedEmail({
      previewText: `Congratulations! ${propertyTitle} is approved on StayQ.`,
      heading: `Your Listing is Approved! 🎉`,
      subheading: `Dear ${cleanHost}, "${propertyTitle}" has passed curation standards and is now officially approved on StayQ.`,
      bodyHtml: `
        ${renderCallout(
          '🌟',
          'Ready for Travelers',
          'Your property is approved! Open your host dashboard to set availability dates, define seasonal rates, and manage house rules.',
          'success',
        )}
      `,
      ctaText: 'Open Host Dashboard',
      ctaUrl: 'https://stayq.space/host',
      footerNote: 'StayQ Host Partner Operations.',
    });

    return {
      subject: `🎉 Congratulations! "${propertyTitle}" is Approved on StayQ`,
      html,
    };
  },

  hostIncompleteProfile(
    hostName: string,
    propertyTitle: string,
    missingItems: string[],
  ) {
    const cleanHost = hostName ? hostName.trim() : 'Host Partner';
    const itemsList = (missingItems || [])
      .map((item) => `&bull; ${escapeHtml(item)}`)
      .join('<br>');

    const html = renderBrandedEmail({
      previewText: `Action required: Please complete your listing details for ${propertyTitle}.`,
      heading: `Listing Details Needed 📝`,
      subheading: `Dear ${cleanHost}, we are excited to onboard "${propertyTitle}", but we need a few details to finish verification.`,
      bodyHtml: `
        <div style="background:#FEF2F2;border:1px solid #FECACA;border-radius:14px;padding:16px;margin:18px 0;">
          <div style="font-size:13px;font-weight:700;color:#991B1B;margin-bottom:6px;">Missing Requirements:</div>
          <div style="font-size:13px;line-height:1.6;color:#7F1D1D;">${itemsList || 'Additional listing documentation'}</div>
        </div>
        ${renderCallout(
          '💡',
          'Quick Resolution',
          'Updating these missing items allows our team to approve your stay for instant booking without delay.',
          'info',
        )}
      `,
      ctaText: 'Complete Listing Details',
      ctaUrl: 'https://stayq.space/host',
      footerNote: 'StayQ Host Partner Operations.',
    });

    return {
      subject: `Action Required: Complete Listing for "${propertyTitle}"`,
      html,
    };
  },

  hostKycVerified(hostName: string, maskedAccount: string) {
    const cleanHost = hostName ? hostName.trim() : 'Host Partner';
    const html = renderBrandedEmail({
      previewText: `Your host KYC and bank payout account have been verified.`,
      heading: `Payout Account Verified ✅`,
      subheading: `Dear ${cleanHost}, your banking and KYC details have been successfully verified for automated settlements.`,
      bodyHtml: `
        ${renderInfoTable([
          { label: 'Host Partner', value: cleanHost },
          { label: 'Settlement Account', value: maskedAccount },
          { label: 'Verification Status', value: 'ACTIVE & VERIFIED', isBadge: true },
        ])}
        ${renderCallout(
          '🛡️',
          'Automated Settlements',
          'Direct bank transfers are disbursed 24 hours after verified guest check-in with 0% brokerage deduction.',
          'success',
        )}
      `,
      ctaText: 'Open Host Wallet',
      ctaUrl: 'https://stayq.space/host/payouts',
      footerNote: 'StayQ Automated Settlement Gateway.',
    });

    return {
      subject: `✅ KYC & Payout Account Verified - StayQ Partner`,
      html,
    };
  },

  propertyLiveNotification(
    hostName: string,
    propertyTitle: string,
    propertyCode: string,
  ) {
    const cleanHost = hostName ? hostName.trim() : 'Host Partner';
    const html = renderBrandedEmail({
      previewText: `"${propertyTitle}" is now live and bookable on StayQ!`,
      heading: `Your Stay is Live! 🚀`,
      subheading: `Dear ${cleanHost}, "${propertyTitle}" (Code: ${propertyCode}) is now visible to travelers across India.`,
      bodyHtml: `
        ${renderCodeBox('Listing Reference Code', propertyCode, 'Share this listing link directly with travelers for direct reservations')}
        ${renderCallout(
          '⚡',
          'Instant Reservations Active',
          'Travelers can now discover your property on StayQ explore feed and book instantly with verified payment escrow.',
          'success',
        )}
      `,
      ctaText: 'View Live Listing',
      ctaUrl: `https://stayq.space/stays/${propertyCode}`,
      footerNote: 'StayQ Host Partner Network.',
    });

    return {
      subject: `🚀 "${propertyTitle}" is Now LIVE on StayQ!`,
      html,
    };
  },

  starHostBadgeAchieved(hostName: string) {
    const cleanHost = hostName ? hostName.trim() : 'Host Partner';
    const html = renderBrandedEmail({
      previewText: `Congratulations! You have earned the StayQ Star Host badge.`,
      heading: `Star Host Badge Unlocked! ⭐`,
      subheading: `Dear ${cleanHost}, your stellar ratings, guest responsiveness, and hospitality have earned you the coveted Star Host status.`,
      bodyHtml: `
        ${renderCallout(
          '⭐',
          'Star Host Perks',
          'Enjoy boosted ranking in search results, an exclusive Star Host badge displayed on all your property cards, and priority support.',
          'info',
        )}
      `,
      ctaText: 'View Host Profile',
      ctaUrl: 'https://stayq.space/host',
      footerNote: 'StayQ Host Recognition Program.',
    });

    return {
      subject: `⭐ You've Earned the StayQ Star Host Badge!`,
      html,
    };
  },

  hostPricingSurgeTips(
    hostName: string,
    city: string,
    recommendedRate: number,
  ) {
    const cleanHost = hostName ? hostName.trim() : 'Host Partner';
    const html = renderBrandedEmail({
      previewText: `Traveler search activity is surging in ${city}! Recommended rate: ₹${recommendedRate}/night.`,
      heading: `High Demand Alert for ${city} 📈`,
      subheading: `Dear ${cleanHost}, traveler searches and booking requests are surging in your destination for upcoming dates.`,
      bodyHtml: `
        ${renderInfoTable([
          { label: 'Destination', value: city },
          { label: 'Recommended Dynamic Rate', value: `₹${recommendedRate} / night`, isHighlight: true },
          { label: 'Projected Earnings Lift', value: '+25% to +35%', isBadge: true },
        ])}
        ${renderCallout(
          '💡',
          'Dynamic Pricing Tip',
          'Update your weekend calendar availability to capitalize on high traveler demand in your area.',
          'info',
        )}
      `,
      ctaText: 'Update Calendar Pricing',
      ctaUrl: 'https://stayq.space/host/calendar',
      footerNote: 'StayQ Revenue Optimization Insights.',
    });

    return {
      subject: `📈 High Travel Demand Alert in ${city}`,
      html,
    };
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
    const cleanGuest = params.guestName ? params.guestName.trim() : 'Explorer';
    const html = renderBrandedEmail({
      previewText: `Booking confirmed: ${params.propertyTitle} (${params.confirmationCode})`,
      heading: `Your Stay is Confirmed! 🏕️`,
      subheading: `Dear ${cleanGuest}, get ready for your upcoming journey! Your reservation at "${params.propertyTitle}" in ${params.city} is secured.`,
      bodyHtml: `
        ${renderCodeBox('Confirmation Code', params.confirmationCode, 'Present this code or your digital pass upon arrival')}
        ${renderInfoTable([
          { label: 'Property', value: params.propertyTitle },
          { label: 'Destination', value: params.city },
          { label: 'Check-In', value: params.checkIn },
          { label: 'Check-Out', value: params.checkOut },
          { label: 'Duration', value: `${params.nights} night(s)` },
          { label: 'Total Paid', value: `₹${params.totalAmount}`, isHighlight: true },
        ])}
        ${renderCallout(
          '🛡️',
          'Zero-Brokerage Guarantee',
          'Your payment is held securely in escrow until after check-in. Directions and access details will be delivered 24h prior to check-in.',
          'success',
        )}
      `,
      ctaText: 'View Booking Pass',
      ctaUrl: `https://stayq.space/bookings/${params.confirmationCode}`,
      footerNote: 'StayQ Travel Booking Confirmation.',
    });

    return {
      subject: `✨ Booking Confirmed: ${params.propertyTitle} (${params.confirmationCode})`,
      html,
    };
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
    const cleanHost = params.hostName ? params.hostName.trim() : 'Host Partner';
    const html = renderBrandedEmail({
      previewText: `New Booking! ${params.guestName} booked ${params.propertyTitle} (${params.confirmationCode})`,
      heading: `New Booking Confirmed! 💰`,
      subheading: `Dear ${cleanHost}, ${params.guestName} just booked "${params.propertyTitle}".`,
      bodyHtml: `
        ${renderCodeBox('Booking Reference', params.confirmationCode)}
        ${renderInfoTable([
          { label: 'Guest Name', value: params.guestName },
          { label: 'Guests', value: `${params.guests} guest(s)` },
          { label: 'Check-In', value: params.checkIn },
          { label: 'Check-Out', value: params.checkOut },
          { label: 'Net Host Payout', value: `₹${params.payout}`, isHighlight: true },
        ])}
        ${renderCallout(
          '🛎️',
          'Host Preparation',
          'Ensure the accommodation is prepared according to StayQ hygiene standards prior to the guest arrival time.',
          'info',
        )}
      `,
      ctaText: 'Manage Reservation',
      ctaUrl: `https://stayq.space/host/bookings/${params.confirmationCode}`,
      footerNote: 'StayQ Host Partner Reservation Alert.',
    });

    return {
      subject: `🎉 New Booking: ${params.guestName} booked ${params.propertyTitle}`,
      html,
    };
  },

  guest7DaysPreTrip(
    guestName: string,
    propertyTitle: string,
    city: string,
    checkIn: string,
  ) {
    const cleanGuest = guestName ? guestName.trim() : 'Explorer';
    const html = renderBrandedEmail({
      previewText: `7 days until your trip to ${city}! Get ready for ${propertyTitle}.`,
      heading: `Your Trip is in 7 Days! 🎒`,
      subheading: `Dear ${cleanGuest}, only 1 week remains until your adventure at "${propertyTitle}" in ${city} starts on ${checkIn}.`,
      bodyHtml: `
        ${renderCallout(
          '🗺️',
          'Preparation Checklist',
          'Download offline routes, check local mountain passes or weather advisories, and confirm your transportation arrangements.',
          'info',
        )}
      `,
      ctaText: 'View Trip Itinerary',
      ctaUrl: 'https://stayq.space/trips',
      footerNote: 'StayQ Pre-Trip Journey Updates.',
    });

    return {
      subject: `🎒 7 Days Until Your Trip to ${city}!`,
      html,
    };
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
    const cleanGuest = params.guestName ? params.guestName.trim() : 'Explorer';
    const html = renderBrandedEmail({
      previewText: `Check-in tomorrow: Access and arrival instructions for ${params.propertyTitle}.`,
      heading: `Arrival Details for Tomorrow 🔑`,
      subheading: `Dear ${cleanGuest}, here are your arrival and entry details for "${params.propertyTitle}".`,
      bodyHtml: `
        ${renderInfoTable([
          { label: 'Property Address', value: params.address },
          { label: 'Access / Gate Code', value: params.gateCode || 'Contact Host' },
          { label: 'WiFi Network', value: params.wifiName || 'Available on-site' },
          { label: 'WiFi Password', value: params.wifiPass || 'See host welcome sheet' },
          { label: 'Host Contact', value: params.hostPhone, isBadge: true },
        ])}
        ${renderCallout(
          '📍',
          'Smooth Arrival',
          'Call or message your host when you are 30 minutes away to ensure a seamless greeting and key handoff.',
          'info',
        )}
      `,
      ctaText: 'Get Directions in Maps',
      ctaUrl: 'https://stayq.space/trips',
      footerNote: 'StayQ Guest Check-In Services.',
    });

    return {
      subject: `🔑 Check-in Tomorrow: ${params.propertyTitle} Access Details`,
      html,
    };
  },

  bookingCancelledAndRefund(params: {
    recipientName: string;
    propertyTitle: string;
    code: string;
    refundAmount: number;
    refundStatus: string;
  }) {
    const cleanName = params.recipientName ? params.recipientName.trim() : 'Member';
    const html = renderBrandedEmail({
      previewText: `Booking cancellation & refund notice for ${params.propertyTitle} (${params.code})`,
      heading: `Booking Cancellation Notice 🔄`,
      subheading: `Dear ${cleanName}, reservation ${params.code} for "${params.propertyTitle}" has been cancelled.`,
      bodyHtml: `
        ${renderInfoTable([
          { label: 'Booking Reference', value: params.code },
          { label: 'Refund Amount', value: `₹${params.refundAmount}`, isHighlight: true },
          { label: 'Refund Status', value: params.refundStatus, isBadge: true },
        ])}
        ${renderCallout(
          '💳',
          'Refund Processing',
          'Refunds are credited directly to the original payment method and typically reflect within 3 to 5 banking days.',
          'info',
        )}
      `,
      ctaText: 'View Booking Status',
      ctaUrl: `https://stayq.space/bookings/${params.code}`,
      footerNote: 'StayQ Customer Support & Cancellations.',
    });

    return {
      subject: `Cancellation & Refund Notice (${params.code})`,
      html,
    };
  },

  postStayReviewRequest(
    guestName: string,
    propertyTitle: string,
    code: string,
  ) {
    const cleanGuest = guestName ? guestName.trim() : 'Explorer';
    const html = renderBrandedEmail({
      previewText: `How was your stay at ${propertyTitle}? Review & earn reward points!`,
      heading: `How Was Your Adventure? ⭐`,
      subheading: `Dear ${cleanGuest}, we hope you had an unforgettable time at "${propertyTitle}".`,
      bodyHtml: `
        ${renderCallout(
          '🎁',
          'Earn 500 Loyalty Points',
          'Leave an honest review of your host and stay. You will earn 500 StayQ travel points to use on your next getaway!',
          'success',
        )}
      `,
      ctaText: 'Write a Review',
      ctaUrl: `https://stayq.space/review/${code}`,
      footerNote: 'StayQ Community & Verified Reviews.',
    });

    return {
      subject: `🌟 How was your stay at ${propertyTitle}?`,
      html,
    };
  },

  officialGstInvoice(params: {
    guestName: string;
    code: string;
    propertyTitle: string;
    amount: number;
    gstNumber?: string;
    invoiceUrl: string;
  }) {
    const cleanGuest = params.guestName ? params.guestName.trim() : 'Customer';
    const html = renderBrandedEmail({
      previewText: `Tax invoice for your StayQ booking ${params.code}`,
      heading: `Official Tax Invoice 🧾`,
      subheading: `Dear ${cleanGuest}, here is the official tax invoice for your reservation at "${params.propertyTitle}".`,
      bodyHtml: `
        ${renderInfoTable([
          { label: 'Booking Code', value: params.code },
          { label: 'Total Amount', value: `₹${params.amount}`, isHighlight: true },
          { label: 'GSTIN', value: params.gstNumber || 'N/A' },
        ])}
      `,
      ctaText: 'Download PDF Invoice',
      ctaUrl: params.invoiceUrl,
      footerNote: 'StayQ Financial & Billing Operations.',
    });

    return {
      subject: `🧾 Tax Invoice: StayQ Booking ${params.code}`,
      html,
    };
  },

  hostPayoutSent(params: {
    hostName: string;
    amount: number;
    utr: string;
    propertyTitle: string;
  }) {
    const cleanHost = params.hostName ? params.hostName.trim() : 'Host Partner';
    const html = renderBrandedEmail({
      previewText: `Payout processed: ₹${params.amount} for ${params.propertyTitle} (UTR: ${params.utr})`,
      heading: `Payout Transferred to Your Bank 💸`,
      subheading: `Dear ${cleanHost}, your payout for "${params.propertyTitle}" has been disbursed to your verified bank account.`,
      bodyHtml: `
        ${renderInfoTable([
          { label: 'Amount Settled', value: `₹${params.amount}`, isHighlight: true },
          { label: 'Bank UTR / Reference', value: params.utr },
          { label: 'Property', value: params.propertyTitle },
          { label: 'Settlement Status', value: 'COMPLETED', isBadge: true },
        ])}
      `,
      ctaText: 'View Payout History',
      ctaUrl: 'https://stayq.space/host/payouts',
      footerNote: 'StayQ Automated Partner Settlements.',
    });

    return {
      subject: `💸 Payout Sent: ₹${params.amount} for ${params.propertyTitle}`,
      html,
    };
  },

  maintenanceFaultAlert(params: {
    hostName: string;
    propertyCode: string;
    propertyTitle: string;
    category: string;
    severity: string;
    description: string;
  }) {
    const cleanHost = params.hostName ? params.hostName.trim() : 'Host Partner';
    const html = renderBrandedEmail({
      previewText: `[MAINTENANCE ALERT] ${params.severity} issue reported for ${params.propertyTitle}`,
      heading: `Maintenance Notice Logged ⚠️`,
      subheading: `Dear ${cleanHost}, a maintenance notice was logged for "${params.propertyTitle}" (${params.propertyCode}).`,
      bodyHtml: `
        ${renderInfoTable([
          { label: 'Category', value: params.category },
          { label: 'Severity', value: params.severity, isBadge: true },
          { label: 'Details', value: params.description },
        ])}
      `,
      ctaText: 'Manage Property',
      ctaUrl: 'https://stayq.space/host',
      footerNote: 'StayQ Operations & Quality Assurance.',
    });

    return {
      subject: `⚠️ Maintenance Alert: ${params.severity} issue at ${params.propertyTitle}`,
      html,
    };
  },

  supportTicketUpdate(params: {
    recipientName: string;
    ticketId: string;
    subjectText: string;
    message: string;
  }) {
    const cleanName = params.recipientName ? params.recipientName.trim() : 'Member';
    const html = renderBrandedEmail({
      previewText: `Support Update: [Ticket #${params.ticketId}] ${params.subjectText}`,
      heading: `Support Ticket Update 💬`,
      subheading: `Dear ${cleanName}, our support team has updated your ticket #${params.ticketId}.`,
      bodyHtml: `
        ${renderCallout(
          '💬',
          params.subjectText,
          params.message,
          'info',
        )}
      `,
      ctaText: 'View Support Ticket',
      ctaUrl: `https://stayq.space/support/${params.ticketId}`,
      footerNote: 'StayQ 24/7 Traveler & Host Support.',
    });

    return {
      subject: `💬 Support Update: [Ticket #${params.ticketId}] ${params.subjectText}`,
      html,
    };
  },

  staffWelcomeCredentials(params: {
    staffName: string;
    staffId: string;
    email: string;
    initialPassword: string;
    department: string;
    allowedModules: string[];
  }) {
    const cleanName = params.staffName ? params.staffName.trim() : 'Staff Member';
    const modules = (params.allowedModules || []).join(', ') || 'Standard Console';
    // Note: initialPassword is intentionally omitted from the HTML email for security compliance
    const html = renderBrandedEmail({
      previewText: `Welcome to StayQ Staff Portal! Credentials for ${params.staffName}.`,
      heading: `Welcome to StayQ Team! 🛡️`,
      subheading: `Dear ${cleanName}, your administrative staff account has been provisioned.`,
      bodyHtml: `
        ${renderInfoTable([
          { label: 'Staff ID', value: params.staffId },
          { label: 'Email', value: params.email },
          { label: 'Department', value: params.department },
          { label: 'Assigned Modules', value: modules },
        ])}
        ${renderCallout(
          '🔒',
          'Security Notice',
          'For your security, initial temporary credentials have been generated. Click the button below to sign in and set your permanent password.',
          'warning',
        )}
      `,
      ctaText: 'Sign In to Ops Console',
      ctaUrl: 'https://stayq.space/ops/login',
      footerNote: 'StayQ Internal Administrative Staff Directory.',
    });

    return {
      subject: `🔐 Welcome to StayQ Ops Portal: Credentials for ${params.staffName}`,
      html,
    };
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
