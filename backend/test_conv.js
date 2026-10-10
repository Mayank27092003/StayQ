const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const crypto = require('crypto');

function fingerprint(payload) {
  return crypto.createHash('sha256').update(JSON.stringify(payload)).digest('hex');
}

async function test() {
  const guestId = 'ce7c4849-196a-4975-825f-e7c47ebb4dd6';
  const hostId = 'c1a14cc3-6fa2-44d1-92ff-2eaa9e509cda';
  const propertyId = '4ddeddb3-80fe-4d1d-aae9-aed250a3328a';

  const key = fingerprint({ pair: [guestId, hostId].sort(), propertyId, bookingId: null });

  try {
    const res = await prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${key},0))`;
      const existing = await tx.conversation.findFirst({
        where: {
          propertyId: propertyId || null,
          bookingId: null,
          OR: [
            { guestId, hostId },
            { guestId: hostId, hostId: guestId },
          ],
        },
      });
      if (existing) return existing;
      return tx.conversation.create({
        data: {
          guestId,
          hostId,
          propertyId,
        },
      });
    });
    console.log('Success:', res.id);
  } catch (err) {
    console.error('Error during transaction:', err);
  } finally {
    await prisma.$disconnect();
  }
}

test();
