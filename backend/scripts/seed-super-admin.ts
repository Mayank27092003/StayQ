import { PrismaClient, AdminRole } from '@prisma/client';
import { initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import * as dotenv from 'dotenv';
dotenv.config();

const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

initializeApp({
  credential: cert({ projectId, clientEmail, privateKey }),
});

const prisma = new PrismaClient();
const auth = getAuth();

async function createSuperAdmin() {
  const email = 'shayan@stayq.space'; // You can change this to a real gmail if needed
  const password = 'Password@123';
  const displayName = 'Shayan';

  try {
    console.log(`Creating Firebase Auth user for ${email}...`);
    let firebaseUser;
    try {
      firebaseUser = await auth.getUserByEmail(email);
      console.log('Firebase user already exists. Updating password...');
      await auth.updateUser(firebaseUser.uid, { password, displayName });
    } catch (e) {
      if (e.code === 'auth/user-not-found') {
        firebaseUser = await auth.createUser({
          email,
          password,
          displayName,
          emailVerified: true,
        });
      } else {
        throw e;
      }
    }

    console.log(`Firebase UID: ${firebaseUser.uid}`);

    console.log('Upserting user in Postgres database as SUPER_ADMIN...');
    const dbUser = await prisma.user.upsert({
      where: { email },
      update: {
        firebaseUid: firebaseUser.uid,
        displayName,
        isAdmin: true,
        adminRole: AdminRole.SUPER_ADMIN,
        roles: ['GUEST'], 
      },
      create: {
        firebaseUid: firebaseUser.uid,
        email,
        displayName,
        isAdmin: true,
        adminRole: AdminRole.SUPER_ADMIN,
        roles: ['GUEST'], 
      },
    });

    console.log('Successfully created/updated Super Admin!');
    console.log('--------------------------------------------------');
    console.log(`Email: ${email}`);
    console.log(`Password: ${password}`);
    console.log(`Admin Role: ${dbUser.adminRole}`);
    console.log('--------------------------------------------------');
    console.log('You can now use these credentials to log in to the Admin Panel.');

  } catch (error) {
    console.error('Error creating super admin:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createSuperAdmin();
