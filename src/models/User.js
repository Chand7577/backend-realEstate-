const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true, index: true },
  password: { type: String }, // Nullable for Google accounts
  googleId: { type: String, sparse: true, unique: true },
  role: { 
    type: String, 
    enum: ['admin', 'buyer', 'seller', 'agent', 'service_provider'], 
    required: true,
    index: true
  },
  serviceSubType: { 
    type: String, 
    enum: ['vastu', 'interior', 'exterior', 'legal', 'financial'],
    required: function() { return this.role === 'service_provider'; }
  },
  phone: { type: String },
  avatar: { type: String },
  isEmailVerified: { type: Boolean, default: false },
  emailVerifyToken: { type: String },
  emailVerifyExpires: { type: Date },
  resetPasswordToken: { type: String },
  resetPasswordExpires: { type: Date },
  loginAttempts: { type: Number, default: 0 },
  lockUntil: { type: Date },
  hashedRefreshToken: { type: String },
  isActive: { type: Boolean, default: true, index: true }
}, { timestamps: true });

// Check if locked
userSchema.methods.isLocked = function() {
  return !!(this.lockUntil && this.lockUntil > Date.now());
};

// Compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  if (!this.password) return false;
  return await bcrypt.compare(candidatePassword, this.password);
};

// Post-save hook to auto-create a CreditWallet
userSchema.post('save', async function(doc, next) {
  if (['seller', 'agent', 'service_provider'].includes(doc.role)) {
    try {
      const CreditWallet = mongoose.model('CreditWallet');
      await CreditWallet.updateOne(
        { userId: doc._id },
        { $setOnInsert: { userId: doc._id, balance: 0, lifetimeCredits: 0, creditsExpiresAt: null } },
        { upsert: true }
      );
    } catch (err) {
      console.error('Error auto-creating CreditWallet:', err);
    }
  }
  next();
});

module.exports = mongoose.model('User', userSchema);
