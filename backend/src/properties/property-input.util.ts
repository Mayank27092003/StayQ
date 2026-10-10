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
      if (
        typeof source[key] !== 'string' ||
        source[key].length >
          (['description', 'houseRules', 'accessInstructions'].includes(key)
            ? 15000
            : key.includes('Url')
              ? 3000
              : 500)
      )
        throw new BadRequestException(`Invalid ${key}`);
      data[key] = source[key].trim();
      if (key.endsWith('DocUrl') && data[key] && !/^https:\/\//.test(data[key]))
        throw new BadRequestException(
          'Document URL must be an uploaded HTTPS resource',
        );
    }
  for (const key of ints)
    if (source[key] !== undefined && source[key] !== null)
      data[key] = integer(
        source[key],
        key,
        ['maxGuests', 'minStay', 'maxStay', 'leaseDurationMonths'].includes(key)
          ? 1
          : 0,
        key === 'yearEstablished' ? 2100 : 1000,
      );
  for (const key of booleans)
    if (source[key] !== undefined) {
      if (typeof source[key] !== 'boolean')
        throw new BadRequestException(`${key} must be a boolean`);
      data[key] = source[key];
    }
  for (const key of amounts)
    if (source[key] !== undefined && source[key] !== null)
      data[key] = money(source[key], key, !current || key !== 'pricePerNight');
  for (const key of arrays)
    if (source[key] !== undefined) {
      if (
        !Array.isArray(source[key]) ||
        source[key].length > 100 ||
        source[key].some((v) => typeof v !== 'string' || v.length > 200)
      )
        throw new BadRequestException(`Invalid ${key}`);
      data[key] = source[key];
    }
  for (const key of ['lat', 'lng'])
    if (source[key] !== undefined) {
      if (source[key] === null) data[key] = null;
      else if (
        typeof source[key] !== 'number' ||
        !Number.isFinite(source[key]) ||
        Math.abs(source[key]) > (key === 'lat' ? 90 : 180)
      )
        throw new BadRequestException(`Invalid ${key}`);
      else data[key] = source[key];
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
        const num = typeof source[key] === 'string' ? Number(source[key]) : source[key];
        if (
          typeof num !== 'number' ||
          !Number.isFinite(num) ||
          num < 0 ||
          num > 100
        )
          throw new BadRequestException(`Invalid ${key}`);
        data[key] = num;
      }
    }
  if (source.type !== undefined || !current) {
    let type = normalize(source.type || 'VILLA');
    const aliases = {
      CAMPING: 'CAMPING_SITE',
      CAMPSITE: 'CAMPING_SITE',
      LONG_TERM: 'LONG_TERM_HOME',
      ZERO_BROKER: 'LONG_TERM_HOME',
      EXPERIENCE: 'EXPERIENCES',
      CAMPERVAN: 'RV',
    };
    type = aliases[type] || type;
    if (!Object.values(PropertyType).includes(type as PropertyType))
      throw new BadRequestException('Unsupported property type');
    data.type = type;
  }
  if (source.category !== undefined || !current) {
    let category = normalize(
      source.category ||
        (data.type === 'CAMPING_SITE'
          ? 'CAMPING'
          : data.type === 'EXPERIENCES'
            ? 'EXPERIENCES'
            : 'VILLA'),
    );
    const aliases = {
      VILLAS: 'VILLA',
      APARTMENTS: 'APARTMENT',
      CABINS: 'CABIN',
      EXPERIENCES: 'EXPERIENCES',
      CAMPING_SITE: 'CAMPING',
      TREEHOUSES: 'TREEHOUSE',
      RV: 'CAMPING',
      CAMPERVAN: 'CAMPING',
    };
    category = aliases[category] || category;
    if (!Object.values(PropertyCategory).includes(category as PropertyCategory))
      throw new BadRequestException('Unsupported property category');
    data.category = category;
  }
  if (source.availabilityScheduleType !== undefined) {
    if (
      !['ALL_DAYS', 'WEEKENDS_ONLY', 'CUSTOM_SPLIT'].includes(
        source.availabilityScheduleType,
      )
    )
      throw new BadRequestException('Invalid availability schedule');
    data.availabilityScheduleType = source.availabilityScheduleType;
  }
  if (
    data.cancellationPolicy &&
    !['flexible', 'moderate', 'strict'].includes(
      data.cancellationPolicy.toLowerCase(),
    )
  )
    throw new BadRequestException('Unsupported cancellation policy');
  if (data.cancellationPolicy)
    data.cancellationPolicy = data.cancellationPolicy.toLowerCase();
  for (const key of ['checkInTime', 'checkOutTime'])
    if (data[key] && !/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(data[key]))
      throw new BadRequestException('Invalid check-in/check-out time');
  if (
    (data.maxStay ?? current?.maxStay) &&
    (data.maxStay ?? current?.maxStay) < (data.minStay ?? current?.minStay ?? 1)
  )
    throw new BadRequestException(
      'Maximum stay must be at least the minimum stay',
    );
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
  ];
  const details = { ...(current?.details || {}) };
  for (const key of detailKeys)
    if (source[key] !== undefined) details[key] = source[key];
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
  let images: any[] | undefined;
  if (source.categorizedImages !== undefined) {
    if (
      !source.categorizedImages ||
      typeof source.categorizedImages !== 'object' ||
      Array.isArray(source.categorizedImages)
    )
      throw new BadRequestException('Invalid categorized images');
    images = Object.entries(source.categorizedImages).flatMap(
      ([caption, urls]) => {
        if (!Array.isArray(urls))
          throw new BadRequestException('Image category must contain an array');
        return urls.map((url) => ({ url, caption }));
      },
    );
  } else if (
    source.images !== undefined ||
    source.imageUrls !== undefined ||
    source.photoUrls !== undefined
  )
    images = source.images ?? source.imageUrls ?? source.photoUrls;
  if (images !== undefined) {
    if (!Array.isArray(images) || images.length > 100)
      throw new BadRequestException('Invalid images');
    images = images.map((v, order) => {
      const url = typeof v === 'string' ? v : v?.url;
      if (
        typeof url !== 'string' ||
        url.length > 3000 ||
        !/^https:\/\//.test(url)
      )
        throw new BadRequestException('Images must be uploaded HTTPS URLs');
      return {
        url,
        order,
        caption:
          typeof v?.caption === 'string' ? v.caption.slice(0, 100) : null,
      };
    });
  }
  // Host supplied tags are restricted to descriptive attributes, never awards.
  let tags: string[] | undefined;
  if (source.tags !== undefined) {
    if (
      !Array.isArray(source.tags) ||
      source.tags.length > 30 ||
      source.tags.some(
        (v) =>
          ![
            'PET_FRIENDLY',
            'ZERO_BROKER',
            'INSTANT_BOOK',
            'FAMILY_FRIENDLY',
            'COUPLE_FRIENDLY',
            'WORKCATION',
          ].includes(v),
      )
    )
      throw new BadRequestException('Unsupported host tag');
    tags = [...new Set(source.tags)] as string[];
  }
  return { data, images, tags, source };
}
