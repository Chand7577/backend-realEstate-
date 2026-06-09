const express = require('express');
const webhookController = require('../controllers/webhookController');

const router = express.Router();

// Webhook payload should ideally be raw for signature verification
router.post('/razorpay', webhookController.handleRazorpayWebhook);

module.exports = router;
