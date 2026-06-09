const mongoose = require('mongoose');

const packageSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  forRole: { type: String, enum: ['seller', 'agent', 'service_provider', 'all'], required: true },
  credits: { type: Number, required: true, validate: Number.isInteger },
  priceInPaise: { type: Number, required: true, validate: Number.isInteger },
  validityDays: { type: Number, default: null }, // Null means no expiry
  isActive: { type: Boolean, default: true },
  isPopular: { type: Boolean, default: false },
  sortOrder: { type: Number, default: 0 }
}, { timestamps: true });

packageSchema.index({ forRole: 1, isActive: 1 });

module.exports = mongoose.model('Package', packageSchema);
