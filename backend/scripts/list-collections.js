const { initializeApp, cert, getApps } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
require('dotenv').config();

if (getApps().length === 0) {
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

    if (projectId && clientEmail && privateKey) {
        initializeApp({
            credential: cert({
                projectId,
                clientEmail,
                privateKey,
            }),
        });
    } else {
        initializeApp();
    }
}

async function listCollections() {
    console.log('Fetching top-level collections...');
    try {
        const collections = await getFirestore().listCollections();
        collections.forEach(collection => {
            console.log(collection.id);
        });
    } catch (e) {
        console.error('Error fetching collections:', e);
    }
}

listCollections().then(() => process.exit(0));
