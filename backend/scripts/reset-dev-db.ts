import { PrismaClient } from '@prisma/client';
import { CURATED_CORRIDORS } from '../src/corridors/corridors.data';

const prisma = new PrismaClient();

async function main() {
  console.log('--- RESETTING DATABASE DATA SAFELY ---');

  // 1. Delete dependent tables first
  console.log('Clearing bookings, reviews, wishlist, blocks...');
  await prisma.booking.deleteMany({});
  await prisma.review.deleteMany({});
  await prisma.wishlist.deleteMany({});
  await prisma.availabilityBlock.deleteMany({});
  await prisma.propertyImage.deleteMany({});
  await prisma.propertyTag.deleteMany({});
  await prisma.propertyIncident.deleteMany({});
  await prisma.propertyBoost.deleteMany({});
  await prisma.roomType.deleteMany({});
  await prisma.gatewayOrder.deleteMany({});
  await prisma.walletTransaction.deleteMany({});
  await prisma.referral.deleteMany({});
  await prisma.otpSession.deleteMany({});
  await prisma.hostPayoutAccount.deleteMany({});

  // 2. Clear all properties
  console.log('Clearing properties...');
  await prisma.property.deleteMany({});

  // 3. Keep admin@stayq.space, delete other test users
  console.log('Cleaning test users (preserving master admin)...');
  await prisma.user.deleteMany({
    where: {
      email: {
        not: 'admin@stayq.space',
      },
    },
  });

  // Ensure master admin exists
  const admin = await prisma.user.upsert({
    where: { email: 'admin@stayq.space' },
    update: { isAdmin: true },
    create: {
      firebaseUid: 'admin-master-uid',
      email: 'admin@stayq.space',
      displayName: 'StayQ Master Admin',
      isAdmin: true,
      emailVerified: true,
      phoneVerified: true,
    },
  });
  console.log('Preserved Admin:', admin.email);

  // 4. Reseed the 30 Curated Corridors
  console.log(`Reseeding ${CURATED_CORRIDORS.length} curated corridors...`);
  for (const item of CURATED_CORRIDORS) {
    await prisma.campervanCorridor.upsert({
      where: { slug: item.slug },
      update: {},
      create: {
        slug: item.slug,
        region: item.region,
        name: item.name,
        sortOrder: item.sortOrder,
        durationMinDays: item.durationMinDays,
        durationMaxDays: item.durationMaxDays,
        distanceKm: item.distanceKm,
        stops: item.stops,
        theme: item.theme,
        description: item.description,
        sourceName: item.sourceName,
        sourceUrl: item.sourceUrl,
        permits: item.permits,
        advisoryNotes: item.advisoryNotes,
        badge: item.badge,
        highlights: item.highlights,
        imageKey: item.imageKey,
        isActive: true,
      },
    });
  }

  const uCount = await prisma.user.count();
  const pCount = await prisma.property.count();
  const cCount = await prisma.campervanCorridor.count();
  console.log('--- DATABASE RESET COMPLETED SUCCESSFULLY ---');
  console.log({ remainingUsers: uCount, properties: pCount, corridors: cCount });
}

main()
  .catch((e) => {
    console.error('Reset failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
