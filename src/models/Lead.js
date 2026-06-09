const mongoose = require('mongoose');

const leadSchema = new mongoose.Schema({
  buyerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  targetUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  listingId: { type: mongoose.Schema.Types.ObjectId, required: true, refPath: 'listingModel' },
  listingModel: { type: String, required: true, enum: ['Property', 'Service'] },
  buyerSnapshot: {
    name: { type: String, required: true },
    phone: { type: String },
    email: { type: String, required: true },
    message: { type: String }
  },
  isLocked: { type: Boolean, default: true },
  unlockedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  unlockedAt: { type: Date },
  creditsUsed: { type: Number, default: 0, validate: Number.isInteger },
  status: { type: String, enum: ['NEW', 'VIEWED', 'CONTACTED', 'CLOSED'], default: 'NEW' }
}, { timestamps: true });

leadSchema.index({ buyerId: 1, listingId: 1 }, { unique: true });
leadSchema.index({ targetUserId: 1, isLocked: 1, createdAt: -1 });

module.exports = mongoose.model('Lead', leadSchema);
