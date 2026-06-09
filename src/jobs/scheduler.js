const cron = require('node-cron');
const mongoose = require('mongoose');
const Property = require('../models/Property');
const Service = require('../models/Service');
const CreditWallet = require('../models/CreditWallet');
const CreditTransaction = require('../models/CreditTransaction');
const notificationService = require('../services/notificationService');

exports.initJobs = () => {
  // 1. Expire Listings - Runs daily at midnight
  cron.schedule('0 0 * * *', async () => {
    console.log('Running Expiry Job for Listings...');
    try {
      const now = new Date();
      await Property.updateMany(
        { status: 'ACTIVE', expiresAt: { $lt: now } },
        { status: 'EXPIRED' }
      );
      await Service.updateMany(
        { status: 'ACTIVE', expiresAt: { $lt: now } },
        { status: 'EXPIRED' }
      );
    } catch (err) {
      console.error('Error expiring listings:', err);
    }
  });

  // 2. Expire Credits - Runs daily at 1 AM
  cron.schedule('0 1 * * *', async () => {
    console.log('Running Expiry Job for Credits...');
    const session = await mongoose.startSession();
    try {
      const now = new Date();
      const expiredWallets = await CreditWallet.find({ 
        creditsExpiresAt: { $lt: now }, 
        balance: { $gt: 0 } 
      });

      for (const wallet of expiredWallets) {
        session.startTransaction();
        try {
          const expiredAmount = wallet.balance;
          wallet.balance = 0;
          await wallet.save({ session });

          await CreditTransaction.create([{
            userId: wallet.userId,
            type: 'DEBIT',
            amount: expiredAmount,
            reason: 'CREDIT_EXPIRY',
            balanceBefore: expiredAmount,
            balanceAfter: 0,
            note: 'Credits expired based on package validity'
          }], { session });

          await session.commitTransaction();
        } catch (txnErr) {
          await session.abortTransaction();
          console.error(`Error expiring credits for user ${wallet.userId}:`, txnErr);
        }
      }
    } catch (err) {
      console.error('Error in credit expiry job:', err);
    } finally {
      session.endSession();
    }
  });

  // 3. Credits Expiring Soon Warning - Runs daily at 2 AM
  cron.schedule('0 2 * * *', async () => {
    console.log('Running Warning Job for Expiring Credits...');
    try {
      const today = new Date();
      const sevenDaysFromNow = new Date();
      sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

      const expiringWallets = await CreditWallet.find({
        creditsExpiresAt: { $gt: today, $lt: sevenDaysFromNow },
        balance: { $gt: 0 }
      });

      for (const wallet of expiringWallets) {
        notificationService.sendNotification({
          userId: wallet.userId,
          type: 'CREDITS_EXPIRING',
          title: 'Credits Expiring Soon',
          body: `You have ${wallet.balance} credits that will expire on ${wallet.creditsExpiresAt.toDateString()}.`
        });
      }
    } catch (err) {
      console.error('Error warning for expiring credits:', err);
    }
  });
};
