const { initializeApp, cert, getApps } = require('firebase-admin/app');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
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

async function testEmail() {
    const to = 'mayankshukla270903@gmail.com';
    console.log(`Sending test email to ${to}...`);
    try {
        await getFirestore().collection('mail').add({
            to: to,
            message: {
                subject: 'Test Email from Stay Q Backend',
                html: '<h1>Success!</h1><p>The Firebase Trigger Email extension is working perfectly!</p>',
                text: 'Success! The Firebase Trigger Email extension is working perfectly!',
            },
            createdAt: FieldValue.serverTimestamp(),
        });
        console.log('Successfully added document to the mail collection.');
    } catch (e) {
        console.error('Error adding document:', e);
    }
}

testEmail().then(() => process.exit(0));
