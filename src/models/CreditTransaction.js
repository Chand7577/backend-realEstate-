const mongoose = require('mongoose');

const creditTransactionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  type: { type: String, enum: ['CREDIT', 'DEBIT'], required: true },
  amount: { type: Number, required: true, min: 1, validate: Number.isInteger },
  reason: { 
    type: String, 
    enum: ['PACKAGE_PURCHASE', 'PROPERTY_LISTING', 'SERVICE_LISTING', 'LEAD_UNLOCK', 'FEATURED_LISTING', 'ADMIN_ADJUSTMENT', 'CREDIT_EXPIRY', 'REFUND'], 
    required: true 
  },
  referenceId: { type: mongoose.Schema.Types.ObjectId, index: true },
  referenceType: { type: String, enum: ['Package', 'Property', 'Service', 'Lead', 'Manual'] },
  balanceBefore: { type: Number, required: true, validate: Number.isInteger },
  balanceAfter: { type: Number, required: true, validate: Number.isInteger },
  note: { type: String }
}, { timestamps: true });

// Compound index for history sorting
creditTransactionSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('CreditTransaction', creditTransactionSchema);
