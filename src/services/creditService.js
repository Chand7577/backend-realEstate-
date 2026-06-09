const CreditWallet = require('../models/CreditWallet');
const CreditTransaction = require('../models/CreditTransaction');
const CreditCostConfig = require('../models/CreditCostConfig');
const AppError = require('../utils/AppError');
const notificationService = require('./notificationService');

exports.getCreditCost = async (action) => {
  const config = await CreditCostConfig.findOne({ action, isActive: true });
  if (!config) {
    throw new AppError(`CONFIG_NOT_FOUND: Credit cost configuration for action ${action} not found.`, 500);
  }
  return config.creditCost;
};

exports.getWalletBalance = async (userId) => {
  const wallet = await CreditWallet.findOne({ userId });
  return wallet ? wallet.balance : 0;
};

exports.deductCredits = async (userId, amount, reason, referenceId, referenceType, note, session) => {
  if (!session) throw new Error('Mongoose session is required for credit transactions.');
  
  const wallet = await CreditWallet.findOne({ userId }).session(session);
  if (!wallet) {
    throw new AppError('Wallet not found for user', 404);
  }

  if (wallet.balance < amount) {
    throw new AppError('INSUFFICIENT_CREDITS', 402);
  }

  const balanceBefore = wallet.balance;
  wallet.balance -= amount;
  const balanceAfter = wallet.balance;

  await wallet.save({ session });

  await CreditTransaction.create([{
    userId,
    type: 'DEBIT',
    amount,
    reason,
    referenceId,
    referenceType,
    balanceBefore,
    balanceAfter,
    note
  }], { session });

  // Non-blocking low credit notification
  const lowCreditThreshold = parseInt(process.env.LOW_CREDIT_THRESHOLD || '50', 10);
  if (balanceBefore >= lowCreditThreshold && balanceAfter < lowCreditThreshold) {
    notificationService.sendNotification({
      userId,
      type: 'LOW_CREDITS',
      title: 'Low Credits Alert',
      body: `Your credit balance has fallen below ${lowCreditThreshold}. Please recharge soon.`
    }).catch(console.error);
  }

  return wallet;
};

exports.addCredits = async (userId, amount, reason, referenceId, referenceType, expiresAt, note, session) => {
  if (!session) throw new Error('Mongoose session is required for credit transactions.');

  const wallet = await CreditWallet.findOne({ userId }).session(session);
  if (!wallet) {
    throw new AppError('Wallet not found for user', 404);
  }

  const balanceBefore = wallet.balance;
  wallet.balance += amount;
  wallet.lifetimeCredits += amount;
  
  if (expiresAt) {
    wallet.creditsExpiresAt = expiresAt;
  }
  
  const balanceAfter = wallet.balance;

  await wallet.save({ session });

  await CreditTransaction.create([{
    userId,
    type: 'CREDIT',
    amount,
    reason,
    referenceId,
    referenceType,
    balanceBefore,
    balanceAfter,
    note
  }], { session });

  return wallet;
};
