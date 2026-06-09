const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  serviceType: { type: String, enum: ['vastu', 'interior', 'exterior', 'legal', 'financial'], required: true },
  pricing: {
    type: { type: String, enum: ['FIXED', 'HOURLY', 'CUSTOM'], required: true },
    amount: { type: Number, validate: Number.isInteger }, // paise
    currency: { type: String, default: 'INR' }
  },
  coverageAreas: [{ type: String }],
  portfolio: [{ type: String }], // image urls
  status: { 
    type: String, 
    enum: ['DRAFT', 'PENDING_REVIEW', 'ACTIVE', 'REJECTED', 'SUSPENDED'], 
    default: 'DRAFT' 
  },
  isFeatured: { type: Boolean, default: false },
  creditsUsed: { type: Number, default: 0, validate: Number.isInteger }
}, { timestamps: true });

serviceSchema.index({ userId: 1, status: 1 });
serviceSchema.index({ serviceType: 1, status: 1 });

module.exports = mongoose.model('Service', serviceSchema);
