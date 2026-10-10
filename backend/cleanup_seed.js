const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Cleaning up seeded test records from Cloud SQL...');
  await prisma.experienceSlot.deleteMany({});
  await prisma.experienceImage.deleteMany({});
  await prisma.experience.deleteMany({});
  console.log('Experience table is now clean and ready for real host listings.');

  const expCount = await prisma.experience.count();
  console.log('Current Experience count in DB:', expCount);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
