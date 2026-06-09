const axios = require('axios');
const jwt = require('jsonwebtoken');

async function test() {
  // 1. Login as admin to get token, or use user?
  // Let's create a test user token manually to test the API directly
  const token = jwt.sign({ id: '60d21b4667d0d8992e610c85', role: 'seller' }, '2b5f7e8a9d1c3e4f6b8a2c5d7e9f1a3b5c7d9e1f3a5b7c9d2e4f6a8b0c2d4e6');
  
  try {
    const res = await axios.get('http://localhost:5000/api/credits/wallet', {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('Wallet:', res.data);
  } catch (e) {
    console.log('Wallet Error:', e.response?.data || e.message);
  }

  try {
    const res2 = await axios.get('http://localhost:5000/api/packages');
    console.log('Packages:', res2.data);
  } catch (e) {
    console.log('Packages Error:', e.response?.data || e.message);
  }
}
test();
