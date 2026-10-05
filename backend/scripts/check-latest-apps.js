const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const props = await prisma.property.findMany({
    select: {
      id: true,
      title: true,
      status: true,
      hostId: true,
      createdAt: true,
      host: { select: { email: true, phone: true, displayName: true } }
    },
    orderBy: { createdAt: 'desc' },
    take: 10
  });

  console.log(`Found ${props.length} properties in DB:`);
  for (const p of props) {
    const full = await prisma.property.findUnique({
      where: { id: p.id },
      include: { host: true, images: true }
    });
    console.log(JSON.stringify(full, null, 2));
  }

  // Also check HostApplication or similar models
  try {
    const leads = await prisma.hostLead?.findMany().catch(() => []);
    if (leads && leads.length > 0) {
      console.log(`\nFound ${leads.length} host leads:`, leads);
    }
  } catch (e) {}
}

main().catch(console.error).finally(() => prisma.$disconnect());
