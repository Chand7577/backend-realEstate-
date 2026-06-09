const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { 
    type: String, 
    enum: ['LEAD_RECEIVED', 'LEAD_UNLOCKED', 'PAYMENT_SUCCESS', 'PAYMENT_FAILED', 'LISTING_APPROVED', 'LISTING_REJECTED', 'LOW_CREDITS', 'CREDITS_EXPIRING', 'ADMIN_MESSAGE'],
    required: true
  },
  title: { type: String, required: true },
  body: { type: String, required: true },
  isRead: { type: Boolean, default: false },
  metadata: { type: mongoose.Schema.Types.Mixed }
}, { timestamps: true });

notificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
