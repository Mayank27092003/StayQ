const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const images = await prisma.propertyImage.findMany({ take: 5 });
  console.log('Sample Property Images:', images);
}

main().catch(console.error).finally(() => prisma.$disconnect());
