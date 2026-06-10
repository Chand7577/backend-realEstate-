const express = require('express');
const kycController = require('../controllers/kycController');
const { protect, hasRole } = require('../middlewares/auth');

const router = express.Router();

router.use(protect);
router.use(hasRole('seller', 'agent', 'service_provider'));

router.post('/submit', kycController.submitKyc);
router.get('/me', kycController.getMyKyc);
router.put('/edit', kycController.editKyc);

module.exports = router;
