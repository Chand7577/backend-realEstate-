const express = require('express');
const adminController = require('../controllers/adminController');
const adminKycController = require('../controllers/adminKycController');
const { protect, hasRole } = require('../middlewares/auth');

const router = express.Router();

router.use(protect);
router.use(hasRole('admin'));

router.get('/users', adminController.getUsers);
router.post('/users/adjust-credits', adminController.adjustUserCredits);
router.post('/listings/:id/review', adminController.reviewListing);
router.get('/payments', adminController.getPayments);
router.get('/credit-transactions', adminController.getCreditTransactions);

// KYC Routes
router.get('/kyc', adminKycController.getAllKyc);
router.get('/kyc/:id', adminKycController.getKycById);
router.patch('/kyc/:id/approve', adminKycController.approveKyc);
router.patch('/kyc/:id/reject', adminKycController.rejectKyc);

module.exports = router;
