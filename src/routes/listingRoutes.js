const express = require('express');
const listingController = require('../controllers/listingController');
const { protect, creditParticipant } = require('../middlewares/auth');
const upload = require('../middlewares/upload');

const router = express.Router();

// Specific protected routes (must be defined before /properties/:id to avoid collision)
router.post('/properties/upload', protect, upload.array('media', 10), listingController.uploadMedia);
router.get('/properties/my-listings', protect, listingController.getMyProperties);
router.get('/services/my-services', protect, listingController.getMyServices);

// Public routes
router.get('/properties', listingController.getProperties);
router.get('/properties/:id', listingController.getPropertyDetail);
router.get('/services', listingController.getServices);

// General Protected routes
router.use(protect);
router.post('/properties', creditParticipant, listingController.createProperty);
router.put('/properties/:id', listingController.updateProperty);
router.delete('/properties/:id', listingController.deleteProperty);
router.post('/properties/:id/feature', listingController.featureProperty);
router.post('/properties/:id/unfeature', listingController.unfeatureProperty);
router.post('/services', listingController.createService);
router.get('/services/:id', listingController.getServiceById);
router.put('/services/:id', listingController.updateService);
router.delete('/services/:id', listingController.deleteService);

module.exports = router;
