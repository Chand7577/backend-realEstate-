const mongoose = require('mongoose');

const creditWalletSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true, 
    unique: true,
    index: true
  },
  balance: { 
    type: Number, 
    required: true, 
    default: 0,
    min: [0, 'Balance cannot be negative'],
    validate : {
      validator : Number.isInteger,
      message   : '{VALUE} is not an integer value'
    }
  },
  lifetimeCredits: { 
    type: Number, 
    required: true, 
    default: 0,
    validate : {
      validator : Number.isInteger,
      message   : '{VALUE} is not an integer value'
    }
  },
  creditsExpiresAt: { 
    type: Date, 
    default: null 
  }
}, { timestamps: true });

module.exports = mongoose.model('CreditWallet', creditWalletSchema);
