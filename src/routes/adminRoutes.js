const express = require('express');
const adminController = require('../controllers/adminController');
const { protect, hasRole } = require('../middlewares/auth');

const router = express.Router();

router.use(protect);
router.use(hasRole('admin'));

router.get('/users', adminController.getUsers);
router.post('/users/adjust-credits', adminController.adjustUserCredits);
router.post('/listings/:id/review', adminController.reviewListing);
router.get('/payments', adminController.getPayments);
router.get('/credit-transactions', adminController.getCreditTransactions);

module.exports = router;
