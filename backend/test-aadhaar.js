const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.join(__dirname, '.env') });

const clientId = process.env.CASHFREE_CLIENT_ID || process.env.CASHFREE_APP_ID;
const clientSecret = process.env.CASHFREE_CLIENT_SECRET || process.env.CASHFREE_SECRET_KEY;
const baseUrl = process.env.CASHFREE_BASE_URL || 'https://api.cashfree.com/verification';

const headers = {
  'x-client-id': clientId,
  'x-client-secret': clientSecret,
  'Content-Type': 'application/json',
  'User-Agent': 'StayQ-Backend-Test',
};

async function testUserAadhaar(aadhaarNumber) {
  const verification_id = 'aadhaar_' + Date.now();
  console.log(`\n========================================`);
  console.log(`Testing Cashfree OKYC Aadhaar Verification`);
  console.log(`Aadhaar Number: ${aadhaarNumber}`);
  console.log(`Verification ID: ${verification_id}`);
  console.log(`========================================\n`);

  try {
    // 1. Generate OTP
    const res = await fetch(`${baseUrl}/offline-aadhaar/otp`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        verification_id,
        aadhaar_number: aadhaarNumber,
      }),
    });
    
    const data = await res.json();
    console.log(`HTTP Status: ${res.status}`);
    console.log('Cashfree Response:');
    console.log(JSON.stringify(data, null, 2));

    if (data.ref_id || data.reference_id) {
      console.log(`\n>>> SUCCESS: OTP sent to the mobile number registered with Aadhaar ending in ${aadhaarNumber.slice(-4)}!`);
      console.log(`Reference ID: ${data.ref_id || data.reference_id}`);
    }
  } catch (err) {
    console.error('Error during Aadhaar test:', err.message);
  }
}

testUserAadhaar('482145927257');
