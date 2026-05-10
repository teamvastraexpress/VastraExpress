async function testLogin() {
  console.log('--- Testing Login ---');
  const res = await fetch('http://localhost:3000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'customer@test.com',
      password: 'password123'
    })
  });
  
  const data = await res.json();
  console.log('Login Response:', JSON.stringify(data, null, 2));
}

testLogin().catch(console.error);
