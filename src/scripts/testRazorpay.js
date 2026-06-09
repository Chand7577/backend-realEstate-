require('dotenv').config({ path: './.env' });
const Razorpay = require('razorpay');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'mock_id',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'mock_secret',
});

async function test() {
  try {
    const order = await razorpay.orders.create({ amount: 1000, currency: "INR" });
    console.log(order);
  } catch (e) {
    console.error('RAZORPAY ERROR:', e.error || e.message || e);
  }
}
test();
