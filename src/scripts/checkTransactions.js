require('dotenv').config();
const mongoose = require('mongoose');

const MONGO_URI = process.env.MONGO_URI;
const MONGO_DB  = process.env.MONGO_DB_NAME || 'realestate';

async function run() {
  console.log('Connecting to MongoDB...');
  await mongoose.connect(MONGO_URI, { dbName: MONGO_DB });
  console.log('Connected.\n');

  require('../models/User');
  require('../models/Package');
  const Payment = require('../models/Payment');
  const payments = await Payment.find().populate('userId', 'name role').populate('packageId', 'name').sort({ createdAt: -1 });
  
  console.log(`Found ${payments.length} Payment records.`);
  payments.forEach(p => {
    console.log(`- ${p._id}: ${p.status} | User: ${p.userId?.name} (${p.userId?.role}) | Package: ${p.packageId?.name} | Amount: ${p.amountInPaise} | Date: ${p.createdAt}`);
  });

  console.log('\n--- Credit Transactions ---');
  const CreditTransaction = require('../models/CreditTransaction');
  const txs = await CreditTransaction.find().populate('userId', 'name role').sort({ createdAt: -1 });
  console.log(`Found ${txs.length} CreditTransaction records.`);
  txs.forEach(t => {
    console.log(`- ${t._id}: ${t.type} ${t.amount} | Reason: ${t.reason} | Note: ${t.note} | User: ${t.userId?.name}`);
  });

  await mongoose.disconnect();
}

run().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
