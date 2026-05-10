const email = 'test_reg@example.com';
const mobileNumber = '9999988888';
const name = 'Test Reg';
const password = 'password123';

async function testRegistration() {
  console.log('--- Step 1: Send OTP ---');
  const sendRes = await fetch('http://localhost:3000/api/auth/send-otp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email })
  });
  
  const sendData = await sendRes.json();
  console.log('Send OTP Response:', JSON.stringify(sendData, null, 2));

  if (!sendData.debugOtp) {
    console.error('No debug OTP found in response. Is NODE_ENV=development?');
    return;
  }

  const otp = sendData.debugOtp;

  console.log('\n--- Step 2: Verify OTP & Register ---');
  const verifyRes = await fetch('http://localhost:3000/api/auth/verify-otp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email,
      otp,
      name,
      mobileNumber,
      role: 'CUSTOMER',
      password
    })
  });

  const verifyData = await verifyRes.json();
  console.log('Verify OTP Response:', JSON.stringify(verifyData, null, 2));
}

testRegistration().catch(console.error);
