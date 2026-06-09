const Razorpay = require('razorpay');
const crypto = require('crypto');
const Payment = require('../models/Payment');
const Package = require('../models/Package');
const creditService = require('./creditService');
const mongoose = require('mongoose');
const notificationService = require('./notificationService');
const AppError = require('../utils/AppError');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'mock_id',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'mock_secret',
});

exports.createOrder = async (userId, packageId) => {
  const pkg = await Package.findOne({ _id: packageId, isActive: true });
  if (!pkg) throw new AppError('Package not found or inactive', 404);

  const shortUserId = userId.toString().slice(-8);
  const shortDate = Date.now().toString().slice(-8);
  
  const options = {
    amount: pkg.priceInPaise,
    currency: "INR",
    receipt: `rcpt_${shortDate}_${shortUserId}`
  };

  const order = await razorpay.orders.create(options);
  
  const payment = await Payment.create({
    userId,
    packageId,
    razorpayOrderId: order.id,
    amountInPaise: pkg.priceInPaise,
    currency: 'INR',
    status: 'PENDING',
    creditsGranted: pkg.credits,
    idempotencyKey: order.id
  });

  return { orderId: order.id, amount: pkg.priceInPaise, currency: 'INR', paymentId: payment._id };
};

exports.verifyAndGrantCredits = async (razorpayOrderId, razorpayPaymentId, razorpaySignature) => {
  const payment = await Payment.findOne({ razorpayOrderId }).populate('packageId');
  if (!payment) throw new AppError('Payment not found', 404);

  // Idempotency check
  if (payment.status === 'SUCCESS') return payment;

  const generatedSignature = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || 'mock_secret')
    .update(razorpayOrderId + "|" + razorpayPaymentId)
    .digest('hex');

  if (generatedSignature !== razorpaySignature) {
    payment.status = 'FAILED';
    await payment.save();
    throw new AppError('Invalid payment signature', 400);
  }

  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    payment.status = 'SUCCESS';
    payment.razorpayPaymentId = razorpayPaymentId;
    payment.razorpaySignature = razorpaySignature;
    
    let expiresAt = null;
    if (payment.packageId && payment.packageId.validityDays) {
      expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + payment.packageId.validityDays);
    }

    await creditService.addCredits(
      payment.userId, 
      payment.creditsGranted, 
      'PACKAGE_PURCHASE', 
      payment.packageId._id, 
      'Package', 
      expiresAt, 
      `Purchased ${payment.packageId.name} package`, 
      session
    );

    await payment.save({ session });
    await session.commitTransaction();

    notificationService.sendNotification({
      userId: payment.userId,
      type: 'PAYMENT_SUCCESS',
      title: 'Payment Successful',
      body: `Your payment was successful and ${payment.creditsGranted} credits have been added.`
    }).catch(console.error);

    // Also notify all admins
    const user = await mongoose.model('User').findById(payment.userId);
    notificationService.notifyAdmins({
      type: 'PAYMENT_SUCCESS',
      title: 'New Payment Received',
      body: `User ${user ? user.name : 'Unknown'} purchased the ${payment.packageId.name} package for ₹${payment.amountInPaise / 100}.`,
      metadata: { paymentId: payment._id }
    }).catch(console.error);

    return payment;
  } catch (error) {
    await session.abortTransaction();
    payment.status = 'FAILED';
    await payment.save();
    throw error;
  } finally {
    session.endSession();
  }
};
