const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  packageId: { type: mongoose.Schema.Types.ObjectId, ref: 'Package', required: true },
  razorpayOrderId: { type: String, required: true, unique: true, index: true },
  razorpayPaymentId: { type: String, sparse: true },
  razorpaySignature: { type: String },
  amountInPaise: { type: Number, required: true, validate: Number.isInteger },
  currency: { type: String, default: 'INR' },
  status: { type: String, enum: ['PENDING', 'SUCCESS', 'FAILED', 'REFUNDED'], default: 'PENDING' },
  creditsGranted: { type: Number, validate: Number.isInteger },
  webhookVerified: { type: Boolean, default: false },
  idempotencyKey: { type: String, required: true, unique: true, index: true },
  metadata: { type: mongoose.Schema.Types.Mixed }
}, { timestamps: true });

paymentSchema.index({ userId: 1, status: 1 });

module.exports = mongoose.model('Payment', paymentSchema);
