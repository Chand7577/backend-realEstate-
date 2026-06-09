const axios = require('axios');
async function test() {
  try {
    const res = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'admin@gmail.com',
      password: '1234'
    });
    console.log(res.data);
  } catch (e) {
    console.log(e.response ? e.response.data : e.message);
  }
}
test();
