const express = require('express');
const listingController = require('../controllers/listingController');
const { protect, creditParticipant } = require('../middlewares/auth');

const router = express.Router();

router.get('/properties', listingController.getProperties);
router.get('/services', listingController.getServices);

router.use(protect);
router.post('/properties', creditParticipant, listingController.createProperty);
router.post('/services', creditParticipant, listingController.createService);

module.exports = router;
