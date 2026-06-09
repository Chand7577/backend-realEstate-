/**
 * resetWallets.js
 * ---------------
 * Resets ALL user wallets to zero and deletes all CreditTransaction + Payment records.
 * Run once: node src/scripts/resetWallets.js
 */

require('dotenv').config();
const mongoose = require('mongoose');

const MONGO_URI = process.env.MONGO_URI;
const MONGO_DB  = process.env.MONGO_DB_NAME || 'realestate';

async function run() {
  console.log('Connecting to MongoDB...');
  await mongoose.connect(MONGO_URI, { dbName: MONGO_DB });
  console.log('Connected.\n');

  // 1. Wipe all CreditTransaction records
  const txResult = await mongoose.connection.collection('credittransactions').deleteMany({});
  console.log(`✅ Deleted ${txResult.deletedCount} CreditTransaction record(s).`);

  // 2. Wipe all Payment records
  const payResult = await mongoose.connection.collection('payments').deleteMany({});
  console.log(`✅ Deleted ${payResult.deletedCount} Payment record(s).`);

  // 3. Reset all CreditWallet balances to 0
  const walletResult = await mongoose.connection.collection('creditwallets').updateMany(
    {},
    { $set: { balance: 0, lifetimeCredits: 0, creditsExpiresAt: null } }
  );
  console.log(`✅ Reset ${walletResult.modifiedCount} CreditWallet(s) to zero.`);

  console.log('\n🎉 Done! All wallets are now at 0 and transaction history is cleared.');
  await mongoose.disconnect();
}

run().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
