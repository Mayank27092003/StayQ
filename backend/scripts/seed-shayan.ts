import { PrismaClient, AdminRole } from '@prisma/client';

async function createSuperAdmin() {
  const email = 'shayan@stayq.space';
  const password = 'Password@123';
  const displayName = 'Shayan';
  const apiKey = 'AIzaSyAluufen67WYeGx_GUEG7x476EZcA8_WUo'; // From admin-panel .env

  console.log(`Creating Firebase Auth user for ${email} using REST API...`);
  
  try {
    // 1. Create Firebase User via REST API
    const authRes = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, returnSecureToken: true }),
    });

    const authData = await authRes.json();
    
    let firebaseUid = authData.localId;

    if (!authRes.ok) {
      if (authData.error?.message === 'EMAIL_EXISTS') {
        console.log('User already exists in Firebase. Attempting to sign in to get UID...');
        const signInRes = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password, returnSecureToken: true }),
        });
        const signInData = await signInRes.json();
        if (!signInRes.ok) {
          throw new Error(`Failed to sign in existing user: ${JSON.stringify(signInData)}`);
        }
        firebaseUid = signInData.localId;
      } else {
        throw new Error(`Firebase Auth Error: ${JSON.stringify(authData)}`);
      }
    }

    console.log(`Firebase UID: ${firebaseUid}`);
    console.log('Upserting user in Postgres database as SUPER_ADMIN...');
    
    // 2. Create in Postgres
    const prisma = new PrismaClient();
    const dbUser = await prisma.user.upsert({
      where: { email },
      update: {
        firebaseUid,
        displayName,
        isAdmin: true,
        adminRole: AdminRole.SUPER_ADMIN,
        roles: ['GUEST'], 
      },
      create: {
        firebaseUid,
        email,
        displayName,
        isAdmin: true,
        adminRole: AdminRole.SUPER_ADMIN,
        roles: ['GUEST'], 
      },
    });
    
    await prisma.$disconnect();

    console.log('Successfully created/updated Super Admin!');
    console.log('--------------------------------------------------');
    console.log(`Email: ${email}`);
    console.log(`Password: ${password}`);
    console.log(`Admin Role: ${dbUser.adminRole}`);
    console.log('--------------------------------------------------');

  } catch (error) {
    console.error('Error creating super admin:', error);
  }
}

createSuperAdmin();
