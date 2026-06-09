const mongoose = require('mongoose');

const creditCostConfigSchema = new mongoose.Schema({
  action: { 
    type: String, 
    enum: ['LIST_PROPERTY', 'LIST_SERVICE', 'UNLOCK_LEAD', 'FEATURE_LISTING', 'RELIST_PROPERTY'], 
    required: true, 
    unique: true 
  },
  creditCost: { type: Number, required: true, validate: Number.isInteger },
  applicableRoles: [{ type: String }],
  description: { type: String },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('CreditCostConfig', creditCostConfigSchema);
