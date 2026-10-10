// Run explicitly after the chosen account signs in through Firebase and the API.
require('dotenv/config');
const { PrismaClient } = require('@prisma/client');
const { initializeApp, cert, getApps } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');
const uid = process.env.TARGET_FIREBASE_UID;
if (!uid || process.env.CONFIRM_ADMIN_UID !== uid)
  throw new Error(
    'Set TARGET_FIREBASE_UID and matching CONFIRM_ADMIN_UID explicitly',
  );
const db = new PrismaClient();
(async () => {
  if (!getApps().length) {
    const key = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
    initializeApp(
      key
        ? {
            credential: cert({
              projectId: process.env.FIREBASE_PROJECT_ID,
              clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
              privateKey: key,
            }),
          }
        : { projectId: process.env.FIREBASE_PROJECT_ID },
    );
  }
  const identity = await getAuth().getUser(uid);
  if (identity.disabled || !identity.emailVerified)
    throw new Error('Use an enabled, verified Firebase identity');
  await db.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended('admin-privileges',0))`;
    if (
      await tx.user.count({
        where: { isAdmin: true, adminRole: 'SUPER_ADMIN', deletedAt: null },
      })
    )
      throw new Error(
        'A super admin already exists; use its role-management endpoints',
      );
    const user = await tx.user.findUnique({ where: { firebaseUid: uid } });
    if (!user || user.deletedAt)
      throw new Error('Sign in to create this backend account first');
    await tx.user.update({
      where: { id: user.id },
      data: { isAdmin: true, adminRole: 'SUPER_ADMIN' },
    });
    await tx.adminAuditLog.create({
      data: {
        adminId: user.id,
        action: 'BOOTSTRAP_FIRST_SUPER_ADMIN',
        targetType: 'ADMIN_USER',
        targetId: user.id,
        details: { method: 'explicit-operator-cli' },
      },
    });
  });
  console.log(
    'First super admin provisioned. No password or account was created.',
  );
})()
  .catch((e) => {
    console.error(e.message);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
