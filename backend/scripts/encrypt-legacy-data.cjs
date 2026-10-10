// Local operator maintenance; never runs at application startup.
try {
  process.loadEnvFile();
} catch (e) {
  if (e.code !== 'ENOENT') throw e;
}
const { PrismaClient } = require('@prisma/client');
const {
  encryptSensitive,
  decryptSensitive,
} = require('../dist/common/utils/encryption.util');
const apply = process.argv.includes('--apply');
if (Buffer.from(process.env.DATA_ENCRYPTION_KEY || '', 'base64').length !== 32)
  throw new Error('A valid, backed-up DATA_ENCRYPTION_KEY is required');
if (
  apply &&
  (process.env.ALLOW_MAINTENANCE !== 'true' ||
    process.env.CONFIRM_DB_NAME !==
      decodeURIComponent(new URL(process.env.DATABASE_URL).pathname.slice(1)))
)
  throw new Error(
    'For --apply, set ALLOW_MAINTENANCE=true and CONFIRM_DB_NAME to the exact target database name',
  );
const prisma = new PrismaClient();
(async () => {
  let cursor,
    accounts = 0,
    fields = 0;
  while (true) {
    const batch = await prisma.hostPayoutAccount.findMany({
      orderBy: { id: 'asc' },
      take: 100,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      select: { id: true },
    });
    if (!batch.length) break;
    for (const item of batch)
      await prisma.$transaction(async (tx) => {
        await tx.$queryRaw`SELECT id FROM "HostPayoutAccount" WHERE id=${item.id} FOR UPDATE`;
        const row = await tx.hostPayoutAccount.findUniqueOrThrow({
          where: { id: item.id },
        });
        const data = {};
        for (const column of ['accountNumber', 'govIdNumber']) {
          const value = row[column];
          if (!value) continue;
          if (value.startsWith('enc:v1:')) {
            decryptSensitive(value);
            continue;
          }
          data[column] = encryptSensitive(value);
          fields++;
        }
        if (Object.keys(data).length) {
          accounts++;
          if (apply)
            await tx.hostPayoutAccount.update({ where: { id: row.id }, data });
        }
      });
    cursor = batch[batch.length - 1].id;
  }
  console.log(
    JSON.stringify({ mode: apply ? 'applied' : 'dry-run', accounts, fields }),
  );
})()
  .catch(() => {
    console.error(
      'Encryption maintenance failed; inspect configuration and database access without logging sensitive values',
    );
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
