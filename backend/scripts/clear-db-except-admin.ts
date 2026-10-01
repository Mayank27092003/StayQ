import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
dotenv.config();

const prisma = new PrismaClient();

async function clearDbExceptAdmin() {
  console.log('====================================================');
  console.log('   STAY Q — CLEAR DATABASE (PRESERVING ADMINS)     ');
  console.log('====================================================');

  try {
    // 1. Log Preserved Admin Accounts
    const adminStaff = await prisma.$queryRawUnsafe<any[]>(
      `SELECT * FROM "AdminStaff" WHERE 1=1;`
    ).catch(() => []);

    const adminUsers = await prisma.$queryRawUnsafe<any[]>(
      `SELECT * FROM "User" WHERE "isAdmin" = true OR "adminRole" IS NOT NULL;`
    ).catch(() => []);

    console.log(`\n🛡️ PRESERVING ADMINS:`);
    console.log(`- AdminStaff accounts: ${adminStaff.length}`);
    adminStaff.forEach(s => console.log(`   • [Staff] ${s.email} (${s.fullName || s.staffId} - ${s.role})`));

    console.log(`- Admin Users: ${adminUsers.length}`);
    adminUsers.forEach(u => console.log(`   • [Admin User] ${u.email} (${u.displayName || 'No Name'} - ${u.adminRole || 'Admin'})`));

    // 2. Fetch all public tables in the database
    const tables = await prisma.$queryRawUnsafe<any[]>(
      `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE';`
    );

    const preservedTables = ['_prisma_migrations', 'AdminStaff', 'AdminSetting'];
    const allTableNames = tables.map(t => t.table_name).filter(name => !preservedTables.includes(name));

    console.log(`\n📋 Found ${allTableNames.length} tables to clean:`);
    console.log(allTableNames.join(', '));

    // Disable foreign key triggers temporarily for clean bulk truncate
    console.log('\n🧹 Truncating data tables with CASCADE...');

    // Truncate all non-user transactional tables first
    const tablesToTruncate = allTableNames.filter(t => t !== 'User');
    for (const table of tablesToTruncate) {
      try {
        await prisma.$executeRawUnsafe(`TRUNCATE TABLE "${table}" CASCADE;`);
        console.log(`  ✓ Cleared table: ${table}`);
      } catch (err: any) {
        console.warn(`  ⚠️ Could not truncate ${table}: ${err.message}`);
      }
    }

    // Now clean the User table, deleting only non-admin users
    console.log('\n🧹 Cleaning User table (preserving Super Admins & Staff)...');
    const deleteUsersResult = await prisma.$executeRawUnsafe(
      `DELETE FROM "User" WHERE ("isAdmin" IS NOT TRUE AND "adminRole" IS NULL);`
    );
    console.log(`  ✓ Removed ${deleteUsersResult} regular test guest & host records.`);

    // 3. Final verification of remaining records
    const finalStaffCount = await prisma.$queryRawUnsafe<any[]>(`SELECT count(*) FROM "AdminStaff";`);
    const finalUserCount = await prisma.$queryRawUnsafe<any[]>(`SELECT count(*) FROM "User";`);
    const finalSettingsCount = await prisma.$queryRawUnsafe<any[]>(`SELECT count(*) FROM "AdminSetting";`);
    const finalPropCount = await prisma.$queryRawUnsafe<any[]>(`SELECT count(*) FROM "Property";`);
    const finalBookingCount = await prisma.$queryRawUnsafe<any[]>(`SELECT count(*) FROM "Booking";`);

    console.log('\n====================================================');
    console.log('✅ DATABASE CLEANUP COMPLETE!');
    console.log(`🛡️ Preserved Admin Staff: ${finalStaffCount[0]?.count || 0}`);
    console.log(`🛡️ Preserved Admin Users: ${finalUserCount[0]?.count || 0}`);
    console.log(`⚙️ Preserved Admin Settings: ${finalSettingsCount[0]?.count || 0}`);
    console.log(`🏡 Properties in DB: ${finalPropCount[0]?.count || 0}`);
    console.log(`📅 Bookings in DB: ${finalBookingCount[0]?.count || 0}`);
    console.log('====================================================\n');
  } catch (error: any) {
    console.error('❌ Error during database cleanup:', error);
  } finally {
    await prisma.$disconnect();
  }
}

clearDbExceptAdmin();
