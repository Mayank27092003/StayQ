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

async function checkMail() {
    console.log('Fetching documents from mail collection...');
    try {
        const snapshot = await getFirestore().collection('mail').orderBy('createdAt', 'desc').limit(5).get();
        if (snapshot.empty) {
            console.log('No documents found in mail collection.');
            return;
        }
        
        snapshot.forEach(doc => {
            console.log(`\nDocument ID: ${doc.id}`);
            const data = doc.data();
            console.log(`To: ${data.to}`);
            if (data.delivery) {
                console.log(`Delivery State: ${data.delivery.state}`);
                if (data.delivery.error) {
                    console.error(`Delivery Error:`, data.delivery.error);
                }
            } else {
                console.log(`Delivery Status: NO DELIVERY FIELD FOUND (Extension might not be running on this collection)`);
            }
        });
    } catch (e) {
        console.error('Error fetching documents:', e);
    }
}

checkMail().then(() => process.exit(0));
