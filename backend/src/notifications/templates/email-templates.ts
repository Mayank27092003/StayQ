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
    return template('Welcome to StayQ', { userName });
  },
  guestWelcomeWithReferral(params: {
    guestName: string;
    referralCode: string;
    walletCredit?: number;
  }) {
    return template('guest Welcome With Referral', { params });
  },
  hostWelcomeWithCode(params: { hostName: string; hostCode: string }) {
    return template('host Welcome With Code', { params });
  },
};
