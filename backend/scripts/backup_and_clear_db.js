const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function main() {
  console.log('--- 1. CONNECTING TO DATABASE & FETCHING ALL TABLES ---');
  const backupDir = path.join(__dirname, '..', 'backup');
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupFilePath = path.join(backupDir, `stayq_db_backup_${timestamp}.json`);

  const backupData = {};
  let totalRows = 0;

  // List of all Prisma models in Stay Q
  const modelNames = [
    'user',
    'hostPayoutAccount',
    'property',
    'roomType',
    'propertyImage',
    'availabilityBlock',
    'booking',
    'payment',
    'hostEarning',
    'review',
    'wishlist',
    'savedSearch',
    'conversation',
    'message',
    'notification',
    'deviceToken',
    'notificationPreference',
    'walletEntry',
    'referral',
    'dispute',
    'adminAuditLog',
    'propertyIncident',
    'loyaltyProfile',
    'loyaltyTransaction',
    'experience',
  ];

  for (const model of modelNames) {
    if (prisma[model] && typeof prisma[model].findMany === 'function') {
      try {
        const rows = await prisma[model].findMany();
        backupData[model] = rows;
        totalRows += rows.length;
        console.log(`[Backup] ${model}: ${rows.length} rows`);
      } catch (err) {
        console.warn(`[Backup] Could not export ${model}: ${err.message}`);
      }
    }
  }

  // Save to JSON
  fs.writeFileSync(backupFilePath, JSON.stringify(backupData, null, 2), 'utf-8');
  console.log(`\n✅ DATABASE SUCCESSFULLY BACKED UP!`);
  console.log(`📁 File saved at: ${backupFilePath}`);
  console.log(`📊 Total rows exported: ${totalRows}\n`);

  // Verify file exists and is not empty
  const stats = fs.statSync(backupFilePath);
  if (stats.size === 0) {
    throw new Error('Backup file size is 0 bytes! Aborting wipe for safety.');
  }

  console.log('--- 2. CLEARING ALL DATA FROM DATABASE (TRUNCATE CASCADE) ---');
  // Get all table names in public schema
  const tablenames = await prisma.$queryRaw`
    SELECT tablename FROM pg_tables WHERE schemaname='public' AND tablename != '_prisma_migrations';
  `;

  for (const { tablename } of tablenames) {
    try {
      await prisma.$executeRawUnsafe(`TRUNCATE TABLE "public"."${tablename}" CASCADE;`);
      console.log(`[Cleared] Table: ${tablename}`);
    } catch (err) {
      console.warn(`[Clear Error] Table ${tablename}: ${err.message}`);
    }
  }

  console.log('\n🎉 ALL DATABASE DATA HAS BEEN CLEARED SUCCESSFULLY!');
  console.log('The database schema remains intact and ready for new data.');
}

main()
  .catch((e) => {
    console.error('Fatal Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
