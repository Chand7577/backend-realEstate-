const express = require('express');
const leadController = require('../controllers/leadController');
const { protect, hasRole } = require('../middlewares/auth');

const router = express.Router();

router.use(protect);

// Buyers can submit leads
router.post('/', hasRole('buyer'), leadController.submitLead);

// Target users can view and unlock leads
router.get('/inbox', hasRole('seller', 'agent', 'service_provider', 'admin'), leadController.getInbox);
router.post('/:id/unlock', hasRole('seller', 'agent', 'service_provider', 'admin'), leadController.unlockLead);

module.exports = router;
