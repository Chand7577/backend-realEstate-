const crypto = require('crypto');
const paymentService = require('../services/paymentService');
const Payment = require('../models/Payment');

exports.handleRazorpayWebhook = async (req, res, next) => {
  try {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET || 'mock_webhook_secret';
    
    // Validate signature
    const signature = req.headers['x-razorpay-signature'];
    const expectedSignature = crypto.createHmac('sha256', secret)
      .update(JSON.stringify(req.body))
      .digest('hex');

    if (signature !== expectedSignature) {
      return res.status(400).send('Invalid signature');
    }

    const event = req.body.event;
    if (event === 'payment.captured') {
      const paymentEntity = req.body.payload.payment.entity;
      const orderId = paymentEntity.order_id;
      const paymentId = paymentEntity.id;
      
      // In a real webhook we don't have the frontend's generated signature, 
      // so the service needs a way to bypass signature check OR we handle logic here.
      // Since it's a webhook, we can just process it directly if it's not already SUCCESS.
      const payment = await Payment.findOne({ razorpayOrderId: orderId });
      if (payment && payment.status === 'PENDING') {
        // Mock a signature if verifyAndGrantCredits strictly requires it, OR
        // better yet, update the service to handle direct admin/webhook confirmations.
        // For simplicity here: we can just manually trigger the service internals.
        // We will call a dedicated webhook processor if we had one.
        console.log('Webhook confirmed payment for order:', orderId);
        // Implement webhook credit grant logic similar to Step 3.
      }
    }

    res.status(200).json({ status: 'ok' });
  } catch (err) {
    next(err);
  }
};
