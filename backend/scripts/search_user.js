const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const users = await prisma.user.findMany({
    where: {
      OR: [
        { displayName: { contains: 'pooja', mode: 'insensitive' } },
        { email: { contains: 'pooja', mode: 'insensitive' } },
        { displayName: { contains: 'sharma', mode: 'insensitive' } },
        { email: { contains: 'sharma', mode: 'insensitive' } }
      ]
    },
    include: {
      properties: true,
      payoutAccount: true
    }
  });
  console.log('--- USERS MATCHING POOJA / SHARMA ---');
  console.log(JSON.stringify(users, null, 2));

  // Also check lead, inquiry, waitlist, contact submissions
  try {
    const leads = await prisma.lead?.findMany({
      where: {
        OR: [
          { name: { contains: 'pooja', mode: 'insensitive' } },
          { email: { contains: 'pooja', mode: 'insensitive' } }
        ]
      }
    });
    console.log('--- LEADS MATCHING POOJA ---', leads);
  } catch (e) {}

  await prisma.$disconnect();
}

run().catch(e => {
  console.error(e);
  process.exit(1);
});
