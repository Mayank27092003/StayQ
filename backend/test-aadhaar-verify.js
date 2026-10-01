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

async function verifyAadhaarWithOtp(ref_id, otp) {
  console.log(`\n========================================`);
  console.log(`Verifying Aadhaar OTP with UIDAI / Cashfree`);
  console.log(`Ref ID: ${ref_id}`);
  console.log(`OTP: ${otp}`);
  console.log(`========================================\n`);

  try {
    const res = await fetch(`${baseUrl}/offline-aadhaar/verify`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        ref_id: ref_id,
        otp: otp.trim(),
      }),
    });

    const data = await res.json();
    console.log(`HTTP Status: ${res.status}`);
    console.log('Verification Response:');
    console.log(JSON.stringify(data, null, 2));

    if (data.status === 'VALID' || data.name) {
      console.log('\n>>> AADHAAR VERIFIED SUCCESSFULLY! <<<');
      console.log('Name on Aadhaar:', data.name);
      console.log('DOB:', data.dob);
      console.log('Gender:', data.gender);
      console.log('Address:', data.address || data.split_address);
    }
    return data;
  } catch (err) {
    console.error('Error during Aadhaar OTP verify:', err.message);
  }
}

verifyAadhaarWithOtp('84089494', '401631');
