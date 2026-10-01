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

async function testUpiWithVerificationId(vpa) {
  const verification_id = 'vpa_' + Date.now();
  console.log(`[TEST UPI] Testing UPI VPA Verification with verification_id: ${verification_id} for VPA: ${vpa}`);
  try {
    const res = await fetch(`${baseUrl}/upi`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        verification_id,
        vpa,
        name: ''
      }),
    });
    const data = await res.json();
    console.log(`HTTP Status: ${res.status}`);
    console.log('UPI Response:', JSON.stringify(data, null, 2));
    return data;
  } catch (err) {
    console.error('UPI Error:', err.message);
  }
}

async function testBankPennyDrop(account_number, ifsc) {
  const verification_id = 'bank_' + Date.now();
  console.log(`\n[TEST BANK] Testing Bank Penny Drop for Acc: ${account_number}, IFSC: ${ifsc}`);
  try {
    const res = await fetch(`${baseUrl}/bank-account/sync`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        verification_id,
        bank_account: account_number,
        ifsc,
        name: 'Test Account'
      }),
    });
    const data = await res.json();
    console.log(`HTTP Status: ${res.status}`);
    console.log('Bank Penny Drop Response:', JSON.stringify(data, null, 2));
    return data;
  } catch (err) {
    console.error('Bank Error:', err.message);
  }
}

async function run() {
  await testUpiWithVerificationId('success@upi');
  await testBankPennyDrop('50100234567890', 'HDFC0000001');
}

run();
