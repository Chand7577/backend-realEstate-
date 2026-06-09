const paymentService = require('../services/paymentService');

exports.createOrder = async (req, res, next) => {
  try {
    const { packageId } = req.body;
    const result = await paymentService.createOrder(req.user.id, packageId);
    
    res.status(201).json({
      success: true,
      data: result
    });
  } catch (err) {
    next(err);
  }
};

exports.verifyPayment = async (req, res, next) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    const payment = await paymentService.verifyAndGrantCredits(razorpay_order_id, razorpay_payment_id, razorpay_signature);
    
    res.status(200).json({
      success: true,
      data: { payment }
    });
  } catch (err) {
    next(err);
  }
};
