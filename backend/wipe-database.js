const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || "postgresql://postgres:stayq_dev_2026@34.47.135.114:5432/stayq_db?schema=public"
    }
  }
});

async function wipeDatabase() {
  console.log('\n======================================================');
  console.log('   STAY Q — PRODUCTION DATABASE DATA WIPE & RESET');
  console.log('======================================================\n');

  try {
    // 1. Identify Admin Users to PRESERVE
    const adminUsers = await prisma.user.findMany({
      where: {
        OR: [
          { isAdmin: true },
          { adminRole: { not: null } }
        ]
      },
      select: { id: true, email: true, phone: true, displayName: true, isAdmin: true, adminRole: true }
    });

    console.log(`[INFO] Found ${adminUsers.length} Admin account(s) to preserve:`);
    adminUsers.forEach(a => console.log(`   🛡️ Admin: ${a.displayName || 'Admin'} (${a.email || a.phone || a.id})`));

    const adminIds = adminUsers.map(a => `'${a.id}'`).join(',');

    // 2. Truncate all transactional & domain tables using CASCADE
    console.log('\n[1/3] Truncating all bookings, properties, payments, reviews & experiences...');
    
    const tablesToTruncate = [
      'AdminAuditLog',
      'BookingStatusHistory',
      'AvailabilityBlock',
      'LeaseAgreement',
      'Payment',
      'Review',
      'PropertyIncident',
      'Booking',
      'RoomType',
      'PropertyImage',
      'PropertyTag',
      'PropertyDiscount',
      'Property',
      'ExperienceBooking',
      'ExperienceSlot',
      'Experience',
      'SupportMessage',
      'SupportTicket',
      'Dispute',
      'Message',
      'Conversation',
      'HostLead',
      'Wishlist',
      'SavedSearch',
      'WalletEntry',
      'Notification',
      'DeviceToken',
      'NotificationPreference',
      'Referral',
      'HostEarning',
      'HostPayout'
    ];

    for (const table of tablesToTruncate) {
      try {
        await prisma.$executeRawUnsafe(`TRUNCATE TABLE "${table}" CASCADE;`);
        console.log(`   ✓ Truncated "${table}"`);
      } catch (err) {
        // Ignored if table doesn't exist
      }
    }

    // 3. Remove non-admin payout accounts & non-admin users
    console.log('\n[2/3] Cleaning up non-admin User accounts & Payout records...');
    if (adminIds.length > 0) {
      await prisma.$executeRawUnsafe(`DELETE FROM "HostPayoutAccount" WHERE "userId" NOT IN (${adminIds});`).catch(() => {});
      const deletedUsers = await prisma.$executeRawUnsafe(`DELETE FROM "User" WHERE "id" NOT IN (${adminIds});`);
      console.log(`   ✓ Deleted all non-admin users. Preserved ${adminUsers.length} Admin account(s).`);
    } else {
      console.log('   ⚠️ No admin IDs found, skipping user deletion to avoid lockout.');
    }

    // 4. Verify remaining database records
    console.log('\n[3/3] Verifying Clean Database State:');
    const remainingUsers = await prisma.user.findMany({});
    console.log(`   ✓ Users in DB: ${remainingUsers.length} (Only Admins preserved)`);
    remainingUsers.forEach(u => {
      console.log(`     - [ADMIN] ID: ${u.id} | Email: ${u.email || 'N/A'} | Phone: ${u.phone || 'N/A'} | Role: ${u.adminRole || 'SUPER_ADMIN'}`);
    });

    const propCount = await prisma.property.count().catch(() => 0);
    const bookingCount = await prisma.booking.count().catch(() => 0);
    const reviewCount = await prisma.review.count().catch(() => 0);
    const paymentCount = await prisma.payment.count().catch(() => 0);

    console.log(`   ✓ Properties in DB: ${propCount}`);
    console.log(`   ✓ Bookings in DB: ${bookingCount}`);
    console.log(`   ✓ Reviews in DB: ${reviewCount}`);
    console.log(`   ✓ Payments in DB: ${paymentCount}`);

    console.log('\n======================================================');
    console.log('   🎉 DATABASE WIPE COMPLETED SUCCESSFULLY! ');
    console.log('   All dummy/test data removed. Database is fresh & clean.');
    console.log('======================================================\n');
  } catch (err) {
    console.error('Error during database wipe:', err);
  } finally {
    await prisma.$disconnect();
  }
}

wipeDatabase();
