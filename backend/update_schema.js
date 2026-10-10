const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Altering Experience table in Cloud SQL...');
  const stmts = [
    'ALTER TABLE "Experience" ADD COLUMN IF NOT EXISTS "city" TEXT DEFAULT \'\'',
    'ALTER TABLE "Experience" ADD COLUMN IF NOT EXISTS "transportOption" TEXT DEFAULT \'SELF_ARRIVE\'',
    'ALTER TABLE "Experience" ADD COLUMN IF NOT EXISTS "kidsFreeAgeLimit" INTEGER DEFAULT 0',
    'ALTER TABLE "Experience" ADD COLUMN IF NOT EXISTS "foodIncluded" BOOLEAN DEFAULT false',
    'ALTER TABLE "Experience" ADD COLUMN IF NOT EXISTS "equipmentIncluded" BOOLEAN DEFAULT false',
    'ALTER TABLE "Experience" ADD COLUMN IF NOT EXISTS "scheduleTime" TEXT DEFAULT \'\''
  ];

  for (const sql of stmts) {
    await prisma.$executeRawUnsafe(sql);
  }
  console.log('Successfully altered Experience table!');

  const cols = await prisma.$queryRaw`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'Experience'
    ORDER BY ordinal_position;
  `;
  console.log('Updated columns:', cols.map(c => c.column_name));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
