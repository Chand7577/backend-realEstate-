const mongoose = require('mongoose');
const Package = require('../models/Package');
const CreditCostConfig = require('../models/CreditCostConfig');
const User = require('../models/User');
const Property = require('../models/Property');
const creditService = require('../services/creditService');
const AppError = require('../utils/AppError');

// -- User Management --
exports.getUsers = async (req, res, next) => {
  try {
    const users = await User.find().select('-password');
    res.status(200).json({ success: true, data: { users } });
  } catch (err) { next(err); }
};

exports.adjustUserCredits = async (req, res, next) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    const { userId, amount, type, note } = req.body; // type: 'add' or 'deduct'
    
    if (!note) throw new AppError('A note is mandatory for manual credit adjustments', 400);

    if (type === 'add') {
      await creditService.addCredits(userId, amount, 'ADMIN_ADJUSTMENT', req.user.id, 'Manual', null, note, session);
    } else {
      await creditService.deductCredits(userId, amount, 'ADMIN_ADJUSTMENT', req.user.id, 'Manual', note, session);
    }

    await session.commitTransaction();
    res.status(200).json({ success: true, message: 'Credits adjusted successfully' });
  } catch (err) {
    await session.abortTransaction();
    next(err);
  } finally {
    session.endSession();
  }
};

// -- Listing Management --
exports.reviewListing = async (req, res, next) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    const { action, refundCredits } = req.body; // action: 'APPROVE' or 'REJECT'
    
    const property = await Property.findById(req.params.id).session(session);
    if (!property || property.status !== 'PENDING_REVIEW') {
      throw new AppError('Listing not found or not pending review', 404);
    }

    if (action === 'APPROVE') {
      property.status = 'ACTIVE';
    } else if (action === 'REJECT') {
      property.status = 'REJECTED';
      if (refundCredits && property.creditsUsed > 0) {
        await creditService.addCredits(
          property.userId, 
          property.creditsUsed, 
          'REFUND', 
          property._id, 
          'Property', 
          null, 
          'Listing rejected refund', 
          session
        );
      }
    }

    await property.save({ session });
    await session.commitTransaction();
    res.status(200).json({ success: true, data: { property } });
  } catch (err) {
    await session.abortTransaction();
    next(err);
  } finally {
    session.endSession();
  }
};

// -- Package & Config --
// Add standard CRUD controllers here as needed

exports.getPayments = async (req, res, next) => {
  try {
    const Payment = require('../models/Payment');
    const payments = await Payment.find()
      .populate('userId', 'name email role serviceSubType')
      .populate('packageId', 'name')
      .sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: { payments } });
  } catch (err) {
    next(err);
  }
};

exports.getCreditTransactions = async (req, res, next) => {
  try {
    const CreditTransaction = require('../models/CreditTransaction');
    const transactions = await CreditTransaction.find()
      .populate('userId', 'name email role serviceSubType')
      .sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: { transactions } });
  } catch (err) {
    next(err);
  }
};
