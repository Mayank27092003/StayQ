import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
dotenv.config();

const prisma = new PrismaClient();

async function check() {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      phone: true,
      displayName: true,
      roles: true,
      isAdmin: true,
      adminRole: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  const properties = await prisma.property.findMany({
    select: {
      id: true,
      title: true,
      type: true,
      status: true,
      hostId: true,
      city: true,
      state: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  const payoutAccounts = await prisma.hostPayoutAccount.findMany({
    orderBy: { createdAt: 'desc' },
  });

  console.log('====================================================');
  console.log('       LIVE HOST APPLICATIONS REPORT (DB)           ');
  console.log('====================================================');
  console.log(`\n👥 Total Users in DB: ${users.length}`);
  users.forEach((u, i) => {
    console.log(`  ${i + 1}. [User] ${u.displayName || 'No Name'} | Email: ${u.email || 'None'} | Phone: ${u.phone || 'None'} | Roles: [${u.roles.join(', ')}] | Admin: ${u.isAdmin ? 'YES (' + u.adminRole + ')' : 'NO'}`);
  });

  console.log(`\n🏡 Total Properties / Listings in DB: ${properties.length}`);
  if (properties.length === 0) {
    console.log('  -> No property listings submitted yet.');
  } else {
    properties.forEach((p, i) => {
      console.log(`  ${i + 1}. [Property] "${p.title}" | Type: ${p.type} | Status: ${p.status} | Host ID: ${p.hostId} | Created: ${p.createdAt}`);
    });
  }

  console.log(`\n💳 Total Host Payout Accounts in DB: ${payoutAccounts.length}`);
  if (payoutAccounts.length === 0) {
    console.log('  -> No host payout accounts submitted yet.');
  } else {
    payoutAccounts.forEach((pa, i) => {
      console.log(`  ${i + 1}. [Payout] User: ${pa.userId} | Holder: ${pa.accountHolderName} | Verified: ${pa.verified} | GovID: ${pa.govIdType} ${pa.govIdNumber}`);
    });
  }
  console.log('====================================================\n');

  await prisma.$disconnect();
}

check();
