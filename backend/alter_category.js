const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Altering Experience.category to TEXT in Cloud SQL...');
  await prisma.$executeRawUnsafe('ALTER TABLE "Experience" ALTER COLUMN "category" TYPE text USING "category"::text;');
  console.log('Successfully altered Experience.category to text!');
}

main().catch(console.error).finally(() => prisma.$disconnect());
