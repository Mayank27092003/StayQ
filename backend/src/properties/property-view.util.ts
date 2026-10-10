const documentFields = [
  'electricityBillDocUrl',
  'propertyRegistryDocUrl',
  'leaseAgreementDocUrl',
  'landlordNocDocUrl',
  'societyNocDocUrl',
  'tradeLicenseDocUrl',
  'ownerIdProofDocUrl',
  'selfieFaceProofDocUrl',
];
const detailFields = [
  'isStayingWithHost',
  'hostPresenceNotes',
  'rvDetails',
  'campingDetails',
  'roomDetails',
  'roomCategories',
  'longTermDetails',
  'quietHoursEnabled',
  'quietHoursText',
  'rvFacilities',
  'bookingOptionCatalog',
  'availabilityScheduleType',
  'weekendSurchargePercent',
];
function redactNested(v: any): any {
  if (Array.isArray(v)) return v.map(redactNested);
  if (v && typeof v === 'object')
    return Object.fromEntries(
      Object.entries(v)
        .filter(
          ([k]) =>
            !/(password|wifi|access|gatecode|pin|account|government|aadhaar|pan(number)?|idproof|selfie|docurl|address|latitude|longitude|^lat$|^lng$|phone|email|secret|token)/i.test(
              k,
            ),
        )
        .map(([k, x]) => [k, redactNested(x)]),
    );
  return v;
}
export function publicProperty(property: any, exact = false) {
  if (!property) return null;
  const result = { ...property };
  for (const key of [
    ...documentFields,
    'wifiPassword',
    'wifiSsid',
    'accessInstructions',
    'incidents',
    'pincode',
  ])
    delete result[key];
  const details = Object.fromEntries(
    detailFields
      .filter((k) => property.details?.[k] !== undefined)
      .map((k) => [k, redactNested(property.details[k])]),
  );
  result.details = details;
  Object.assign(result, details);
  result.blockedDates = (property.availabilityBlocks || [])
    .filter(
      (b) =>
        b.type === 'HOST_BLOCKED' ||
        !b.bookingId ||
        b.booking?.status !== 'CANCELLED',
    )
    .flatMap((b) => {
      const days: string[] = [];
      for (
        let d = new Date(b.startDate);
        d < new Date(b.endDate) && days.length < 400;
        d = new Date(d.getTime() + 86400000)
      )
        days.push(d.toISOString().slice(0, 10));
      return days;
    });
  delete result.availabilityBlocks;
  const location = [property.city, property.state, property.country]
    .filter(Boolean)
    .join(', ');
  result.address = exact ? property.address : location;
  // Quantized coordinates cannot be reversed by subtracting a fixed offset.
  result.lat =
    property.lat === null || property.lat === undefined
      ? null
      : exact
        ? property.lat
        : Math.round(property.lat * 50) / 50;
  result.lng =
    property.lng === null || property.lng === undefined
      ? null
      : exact
        ? property.lng
        : Math.round(property.lng * 50) / 50;
  result.approximateLat = result.lat;
  result.approximateLng = result.lng;
  result.isExactLocation = exact;
  result.exactAddressMasked = !exact;
  result.approximateLocation = location;
  result.approximateRadiusMeters = 2000;
  if (
    !property.sponsoredUntil ||
    new Date(property.sponsoredUntil) <= new Date()
  ) {
    result.isSponsored = false;
    result.searchRankBoost = 0;
    result.sponsoredTier = null;
  }
  if (property.host) {
    result.hostId = property.host.firebaseUid || property.hostId;
    result.host = {
      id: property.host.firebaseUid || property.host.id,
      firebaseUid: property.host.firebaseUid,
      displayName: property.host.displayName,
      photoUrl: property.host.photoUrl,
      bio: property.host.bio,
      isSuperhost: property.host.isSuperhost,
      isStarhost: property.host.isStarhost,
      isHostVerified: property.host.isHostVerified,
      createdAt: property.host.createdAt,
      ...(exact ? { phone: property.host.phone } : {}),
    };
  }
  return result;
}
