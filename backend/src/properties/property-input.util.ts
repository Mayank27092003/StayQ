import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { PropertyType, PropertyCategory } from '@prisma/client';
import { integer, money } from '../common/utils/input.util';
const strings = [
  'title',
  'description',
  'address',
  'city',
  'state',
  'country',
  'pincode',
  'houseRules',
  'checkInTime',
  'checkOutTime',
  'cancellationPolicy',
  'pickupLocation',
  'dropLocation',
  'vehicleType',
  'terrainType',
  'dormType',
  'ownershipType',
  'checkInType',
  'electricityBillDocUrl',
  'propertyRegistryDocUrl',
  'leaseAgreementDocUrl',
  'landlordNocDocUrl',
  'societyNocDocUrl',
  'tradeLicenseDocUrl',
  'ownerIdProofDocUrl',
  'selfieFaceProofDocUrl',
  'accessInstructions',
  'wifiSsid',
  'wifiPassword',
];
const ints = [
  'bedrooms',
  'bathrooms',
  'beds',
  'maxGuests',
  'minStay',
  'maxStay',
  'leaseDurationMonths',
  'yearEstablished',
  'tentCapacity',
  'bedCount',
];
const booleans = [
  'instantBook',
  'longTermAvailable',
  'petsAllowed',
  'smokingAllowed',
  'partiesAllowed',
  'hasCampfire',
  'hasLocker',
  'isInsideGatedSociety',
];
const amounts = [
  'pricePerNight',
  'cleaningFee',
  'monthlyRent',
  'securityDeposit',
];
const arrays = ['amenities', 'languagesSpoken', 'rvFacilities'];
const protectedFields = [
  'isSponsored',
  'sponsoredTier',
  'sponsoredUntil',
  'searchRankBoost',
  'propertyDocsVerified',
  'propertyDocsVerifiedAt',
  'propertyCode',
  'hasActiveFault',
  'faultCount',
  'hostId',
  'isFeatured',
];
const normalize = (v: any) =>
  typeof v === 'string' ? v.trim().toUpperCase().replace(/[ -]+/g, '_') : '';
export function propertyInput(payload: any, current?: any) {
  if (
    !payload ||
    typeof payload !== 'object' ||
    Array.isArray(payload) ||
    JSON.stringify(payload).length > 200000
  )
    throw new BadRequestException('Invalid property payload');
  const source = { ...payload };
  for (const key of protectedFields)
    if (key in source)
      throw new ForbiddenException(
        `Property field ${key} is managed by the server`,
      );
  const aliases = {
    basePrice: 'pricePerNight',
    latitude: 'lat',
    longitude: 'lng',
    weeklyDiscountPercent: 'weeklyDiscount',
    monthlyDiscountPercent: 'monthlyDiscount',
    propertyType: 'type',
    bankPassbookImageUrl: 'passbookImageUrl',
  };
  for (const [from, to] of Object.entries(aliases))
    if (source[from] !== undefined && source[to] === undefined)
      source[to] = source[from];
  const data: any = {};
  for (const key of strings)
    if (source[key] !== undefined) {
      const rawVal =
        typeof source[key] === 'number' ? String(source[key]) : source[key];
      if (
        typeof rawVal !== 'string' ||
        rawVal.length >
          (['description', 'houseRules', 'accessInstructions'].includes(key)
            ? 15000
            : key.includes('Url')
              ? 3000
              : 500)
      ) {
        data[key] = '';
      } else {
        data[key] = rawVal.trim();
        if (key.endsWith('DocUrl') && data[key] && !/^(?:https?:\/\/|gs:\/\/)/i.test(data[key])) {
          data[key] = null;
        }
      }
    }
  for (const key of ints)
    if (source[key] !== undefined && source[key] !== null && source[key] !== '') {
      const numVal =
        typeof source[key] === 'string' ? Number(source[key]) : source[key];
      const intVal =
        typeof numVal === 'number' && Number.isFinite(numVal)
          ? Math.round(numVal)
          : source[key];
      data[key] = integer(
        intVal,
        key,
        ['maxGuests', 'minStay', 'maxStay', 'leaseDurationMonths'].includes(key)
          ? 1
          : 0,
        key === 'yearEstablished' ? 2100 : 1000,
      );
    }
  for (const key of booleans)
    if (source[key] !== undefined) {
      if (typeof source[key] !== 'boolean')
        data[key] = Boolean(source[key]);
      else
        data[key] = source[key];
    }
  for (const key of amounts)
    if (source[key] !== undefined && source[key] !== null && source[key] !== '') {
      let rawAmt = source[key];
      if (typeof rawAmt === 'string') rawAmt = rawAmt.replace(/[,\s₹$]/g, '');
      const parsed = Number(rawAmt);
      if (Number.isFinite(parsed)) {
        data[key] = money(Math.max(0, parsed), key, true);
      }
    }
  for (const key of arrays)
    if (source[key] !== undefined) {
      if (Array.isArray(source[key])) {
        data[key] = source[key]
          .map((v) =>
            typeof v === 'string'
              ? v.trim()
              : v && (v as any).id
                ? String((v as any).id).trim()
                : v && (v as any).name
                  ? String((v as any).name).trim()
                  : '',
          )
          .filter((v) => v.length > 0 && v.length <= 200)
          .slice(0, 100);
      } else {
        data[key] = [];
      }
    }
  for (const key of ['lat', 'lng'])
    if (source[key] !== undefined) {
      if (source[key] === null || source[key] === '') data[key] = null;
      else {
        const num =
          typeof source[key] === 'string' ? Number(source[key]) : source[key];
        if (
          typeof num === 'number' &&
          Number.isFinite(num) &&
          Math.abs(num) <= (key === 'lat' ? 90 : 180)
        ) {
          data[key] = num;
        } else {
          data[key] = key === 'lat' ? 28.6139 : 77.209;
        }
      }
    }
  for (const key of [
    'weeklyDiscount',
    'monthlyDiscount',
    'weekendSurchargePercent',
  ])
    if (source[key] !== undefined) {
      if (source[key] === null || source[key] === '') {
        data[key] = null;
      } else {
        const num =
          typeof source[key] === 'string' ? Number(source[key]) : source[key];
        if (typeof num === 'number' && Number.isFinite(num)) {
          data[key] = Math.max(0, Math.min(100, Math.round(num)));
        } else {
          data[key] = null;
        }
      }
    }
  if (source.type !== undefined || !current) {
    let type = normalize(source.type || 'VILLA');
    const aliases: Record<string, string> = {
      CAMPING: 'CAMPING_SITE',
      CAMPSITE: 'CAMPING_SITE',
      LONG_TERM: 'LONG_TERM_HOME',
      ZERO_BROKER: 'LONG_TERM_HOME',
      EXPERIENCE: 'EXPERIENCES',
      CAMPERVAN: 'RV',
      MOTORHOME: 'RV',
      CARAVAN: 'RV',
      TREEHOUSE: 'CABIN',
      TREEHOUSES: 'CABIN',
      HAVELI: 'HOMESTAY',
      HERITAGE_HAVELI: 'HOMESTAY',
      RESORT: 'VILLA',
    };
    type = aliases[type] || type;
    if (!Object.values(PropertyType).includes(type as PropertyType)) {
      type = PropertyType.VILLA;
    }
    data.type = type;
  }
  if (source.category !== undefined || !current) {
    let category = normalize(
      source.category ||
        (data.type === 'CAMPING_SITE'
          ? 'CAMPING'
          : data.type === 'EXPERIENCES'
            ? 'EXPERIENCES'
            : data.type === 'CABIN'
              ? 'CABIN'
              : data.type === 'APARTMENT'
                ? 'APARTMENT'
                : 'VILLA'),
    );
    const aliases: Record<string, string> = {
      VILLAS: 'VILLA',
      APARTMENTS: 'APARTMENT',
      CABINS: 'CABIN',
      EXPERIENCES: 'EXPERIENCES',
      CAMPING_SITE: 'CAMPING',
      CAMPSITE: 'CAMPING',
      TREEHOUSES: 'TREEHOUSE',
      RV: 'CAMPING',
      CAMPERVAN: 'CAMPING',
      MOTORHOME: 'CAMPING',
      CARAVAN: 'CAMPING',
      HOMESTAY: 'COUNTRYSIDE',
      HOMESTAYS: 'COUNTRYSIDE',
      HOTEL: 'MANSION',
      HOTELS: 'MANSION',
      HOSTEL: 'COUNTRYSIDE',
      HOSTELS: 'COUNTRYSIDE',
      DORM: 'COUNTRYSIDE',
      DORMS: 'COUNTRYSIDE',
      FARMHOUSE: 'COUNTRYSIDE',
      COTTAGE: 'CABIN',
      PENTHOUSE: 'APARTMENT',
      STUDIO: 'APARTMENT',
      LONG_TERM_HOME: 'COUNTRYSIDE',
    };
    category = aliases[category] || category;
    if (!Object.values(PropertyCategory).includes(category as PropertyCategory)) {
      category = PropertyCategory.VILLA;
    }
    data.category = category;
  }
  if (source.availabilityScheduleType !== undefined) {
    if (
      ['ALL_DAYS', 'WEEKENDS_ONLY', 'CUSTOM_SPLIT'].includes(
        source.availabilityScheduleType,
      )
    ) {
      data.availabilityScheduleType = source.availabilityScheduleType;
    } else {
      data.availabilityScheduleType = 'ALL_DAYS';
    }
  }
  if (data.cancellationPolicy) {
    const rawPolicy = data.cancellationPolicy
      .toLowerCase()
      .trim()
      .replace(/[- ]+/g, '_');
    if (
      ['flexible', 'moderate', 'strict', 'super_strict'].includes(rawPolicy)
    ) {
      data.cancellationPolicy =
        rawPolicy === 'super_strict' ? 'strict' : rawPolicy;
    } else {
      data.cancellationPolicy = 'flexible';
    }
  }
  for (const key of ['checkInTime', 'checkOutTime']) {
    if (data[key]) {
      let t = String(data[key]).trim();
      if (/^\d:[0-5]\d$/.test(t)) {
        t = `0${t}`;
      } else if (/^\d{1,2}:[0-5]\d\s*(?:am|pm)$/i.test(t)) {
        const match = t.match(/^(\d{1,2}):([0-5]\d)\s*(am|pm)$/i);
        if (match) {
          let h = parseInt(match[1], 10);
          const m = match[2];
          const meridian = match[3].toLowerCase();
          if (meridian === 'pm' && h < 12) h += 12;
          if (meridian === 'am' && h === 12) h = 0;
          t = `${String(h).padStart(2, '0')}:${m}`;
        }
      }
      if (/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(t)) {
        data[key] = t;
      } else {
        data[key] = key === 'checkInTime' ? '14:00' : '11:00';
      }
    }
  }
  if (data.maxStay !== undefined && data.minStay !== undefined) {
    if (data.maxStay < data.minStay) {
      data.maxStay = data.minStay;
    }
  }
  const detailKeys = [
    'isStayingWithHost',
    'hostPresenceNotes',
    'rvDetails',
    'campingDetails',
    'roomDetails',
    'roomCategories',
    'longTermDetails',
    'quietHoursEnabled',
    'quietHoursText',
    'landmark',
    'streetAddress',
    'houseNumber',
    'buildingName',
    'floor',
    'tower',
    'areaLocality',
    'securityDepositRefundPolicy',
    'petRules',
    'extraGuestFee',
    'rvPickupTerms',
    'rvDropTerms',
    'rvMileageTerms',
    'rvDriverTerms',
    'rvInsuranceTerms',
    'campingAddOns',
    'bookingOptionCatalog',
    'linkedCorridor',
    'linkedCorridorId',
    'linkedCorridorSlug',
    'linkedCorridorName',
    'isCorridorWaypoint',
    'corridorWaypointNote',
  ];
  const details = { ...(current?.details || {}) };
  for (const key of detailKeys)
    if (source[key] !== undefined) details[key] = source[key];

  // Harmonize Overland Corridor Waystation linking
  if (source.linkedCorridor !== undefined) {
    details.linkedCorridor = source.linkedCorridor;
  } else if (source.linkedCorridorId) {
    details.linkedCorridor = {
      corridorId: source.linkedCorridorId,
      corridorSlug: source.linkedCorridorSlug || source.linkedCorridorId,
      corridorName: source.linkedCorridorName || '',
      isCorridorWaypoint: true,
      corridorWaypointNote: source.corridorWaypointNote || null,
    };
  }

  if (details.bookingOptionCatalog !== undefined) {
    if (
      !details.bookingOptionCatalog ||
      typeof details.bookingOptionCatalog !== 'object' ||
      Array.isArray(details.bookingOptionCatalog) ||
      Object.keys(details.bookingOptionCatalog).length > 100
    )
      throw new BadRequestException('Invalid option catalog');
    for (const value of Object.values(details.bookingOptionCatalog)) {
      if (!value || typeof value !== 'object' || Array.isArray(value))
        throw new BadRequestException('Invalid option catalog entry');
      const item = value as Record<string, unknown>;
      if (
        typeof item.enabled !== 'boolean' ||
        typeof item.billing !== 'string' ||
        !['PER_NIGHT', 'PER_STAY', 'PER_GUEST_NIGHT'].includes(item.billing)
      )
        throw new BadRequestException('Invalid option catalog entry');
      money(item.price, 'Option price', true);
    }
  }
  data.details = details;

  // Harmonize both categorized and flat images gracefully without dropping photos
  let images: any[] | undefined;
  const rawCategorized =
    source.categorizedImages &&
    typeof source.categorizedImages === 'object' &&
    !Array.isArray(source.categorizedImages)
      ? Object.entries(source.categorizedImages).flatMap(([caption, urls]) => {
          if (!Array.isArray(urls)) return [];
          return urls.filter(Boolean).map((url) => ({ url, caption }));
        })
      : [];

  const rawFlat = source.images ?? source.imageUrls ?? source.photoUrls;
  const flatArray = Array.isArray(rawFlat) ? rawFlat.filter(Boolean) : [];

  if (rawCategorized.length > 0 || flatArray.length > 0) {
    const combined: { url: string; caption: string | null }[] = [];
    const seenUrls = new Set<string>();

    for (const item of (rawCategorized as any[])) {
      const u = typeof item === 'string' ? item.trim() : (item && (item as any).url ? String((item as any).url).trim() : '');
      if (u && !seenUrls.has(u)) {
        seenUrls.add(u);
        combined.push({
          url: u,
          caption: typeof (item as any)?.caption === 'string' ? (item as any).caption.slice(0, 100) : null,
        });
      }
    }

    for (const item of (flatArray as any[])) {
      const u = typeof item === 'string' ? item.trim() : (item && (item as any).url ? String((item as any).url).trim() : '');
      if (u && !seenUrls.has(u)) {
        seenUrls.add(u);
        combined.push({
          url: u,
          caption: typeof (item as any)?.caption === 'string' ? (item as any).caption.slice(0, 100) : null,
        });
      }
    }

    const validItems = combined.filter(
      (item) =>
        typeof item.url === 'string' &&
        item.url.length <= 3000 &&
        /^(?:https?:\/\/|gs:\/\/)/i.test(item.url),
    );

    images = validItems.map((item, order) => ({
      url: item.url,
      order,
      caption: item.caption,
    }));
  }
  // Host supplied tags are restricted to descriptive attributes, never awards.
  let tags: string[] | undefined;
  if (source.tags !== undefined) {
    if (Array.isArray(source.tags)) {
      const allowed = [
        'PET_FRIENDLY',
        'ZERO_BROKER',
        'INSTANT_BOOK',
        'FAMILY_FRIENDLY',
        'COUPLE_FRIENDLY',
        'WORKCATION',
      ];
      tags = [
        ...new Set(source.tags.filter((v: any) => typeof v === 'string' && allowed.includes(v))),
      ] as string[];
    } else {
      tags = [];
    }
  }
  return { data, images, tags, source };
}
