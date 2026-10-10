// Counts only: never print account details, KYC inputs, tokens, or email bodies.
if (process.env.ALLOW_DIAGNOSTICS !== 'true')
  throw new Error(
    'Set ALLOW_DIAGNOSTICS=true explicitly for a read-only database count',
  );
const { PrismaClient } = require('@prisma/client');
const db = new PrismaClient();
(async () => {
  const result = {};
  for (const model of [
    'user',
    'property',
    'booking',
    'payment',
    'refund',
    'dispute',
    'domainJob',
    'supportTicket',
  ])
    result[model] = await db[model].count();
  console.log(JSON.stringify(result));
})()
  .catch(() => {
    console.error('Database diagnostics failed');
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
