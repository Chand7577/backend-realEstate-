const express = require('express');
const paymentController = require('../controllers/paymentController');
const { protect } = require('../middlewares/auth');

const router = express.Router();

router.use(protect);
router.post('/create-order', paymentController.createOrder);
router.post('/verify-payment', paymentController.verifyPayment);

module.exports = router;
