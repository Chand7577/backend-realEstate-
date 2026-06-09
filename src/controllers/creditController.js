const CreditWallet = require('../models/CreditWallet');
const CreditTransaction = require('../models/CreditTransaction');
const AppError = require('../utils/AppError');

exports.getWalletDetails = async (req, res, next) => {
  try {
    const userId = req.user.id;

    // Get the wallet
    let wallet = await CreditWallet.findOne({ userId });
    
    // If wallet somehow doesn't exist, return a default 0 balance object
    if (!wallet) {
      wallet = {
        balance: 0,
        lifetimeCredits: 0,
        creditsExpiresAt: null
      };
    }

    // Get recent transactions (last 10)
    const transactions = await CreditTransaction.find({ userId })
      .sort({ createdAt: -1 })
      .limit(10);

    res.status(200).json({
      status: 'success',
      data: {
        wallet,
        transactions
      }
    });
  } catch (err) {
    next(err);
  }
};
