const axios = require('axios');

async function createAdminViaApi() {
  try {
    const res = await axios.post('http://localhost:5000/api/auth/register', {
      name: 'Super Admin API',
      email: 'admin2@luxeliving.com',
      password: 'admin123',
      role: 'admin',
      phone: '1234567890'
    });
    console.log('API Registration Success:', res.data);
  } catch (error) {
    console.log('API Registration Error:', error.response ? error.response.data : error.message);
  }
}

createAdminViaApi();
