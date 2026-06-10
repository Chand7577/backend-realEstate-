const mongoose = require('mongoose');

const KycSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  email: {
    type: String,
    required: true
  },
  phone: {
    type: String,
    required: true
  },
  aadhaar: {
    front: { type: String, required: true },
    back: { type: String, required: true }
  },
  pan: {
    front: { type: String, required: true },
    back: { type: String, required: true }
  },
  address: {
    streetAddress: { type: String, required: true },
    locality: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    pincode: { type: String, required: true }
  },
  status: {
    type: String,
    enum: ['PENDING', 'APPROVED', 'REJECTED'],
    default: 'PENDING'
  },
  rejectReason: {
    type: String,
    default: null
  },
  submissionCount: {
    type: Number,
    default: 1
  },
  reviewer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  reviewedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Kyc', KycSchema);
