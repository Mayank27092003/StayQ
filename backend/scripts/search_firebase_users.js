require('dotenv/config');
const { initializeApp, cert, getApps } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');

async function main() {
  if (!getApps().length) {
    const key = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
    initializeApp(
      key
        ? {
            credential: cert({
              projectId: process.env.FIREBASE_PROJECT_ID || 'stay-q',
              clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
              privateKey: key,
            }),
          }
        : { projectId: process.env.FIREBASE_PROJECT_ID || 'stay-q' },
    );
  }

  const list = await getAuth().listUsers(100);
  console.log(`Total Firebase Auth users fetched: ${list.users.length}`);
  const matching = list.users.filter(u => {
    const str = `${u.displayName || ''} ${u.email || ''} ${u.phoneNumber || ''}`.toLowerCase();
    return str.includes('pooja') || str.includes('sharma');
  });

  console.log('Matching Firebase Users:', matching.map(u => ({
    uid: u.uid,
    displayName: u.displayName,
    email: u.email,
    phoneNumber: u.phoneNumber,
    createdAt: u.metadata.creationTime,
    lastSignInTime: u.metadata.lastSignInTime
  })));

  // If no match, print all user displayNames and emails to see if there is a similar name
  console.log('All recent Firebase users:');
  list.users.slice(0, 15).forEach(u => {
    console.log(`- ${u.displayName} | ${u.email} | ${u.phoneNumber}`);
  });
}

main().catch(err => {
  console.error('Error:', err.message);
});
