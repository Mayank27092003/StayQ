import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const firebaseUid = 'tELX9Jj9NNTBUqSVLt3ylOzQzlG3';
  const email = 'admin@stayq.com';

  const user = await prisma.user.upsert({
    where: { firebaseUid },
    update: {
      isAdmin: true,
      adminRole: 'SUPER_ADMIN',
    },
    create: {
      firebaseUid,
      email,
      isAdmin: true,
      adminRole: 'SUPER_ADMIN',
    },
  });

  console.log('Successfully set admin:', user.email);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
