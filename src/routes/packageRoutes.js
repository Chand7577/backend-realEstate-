const express = require('express');
const packageController = require('../controllers/packageController');
const { protect, hasRole } = require('../middlewares/auth');

const router = express.Router();

router.get('/', packageController.getAllPackages);

router.use(protect);
router.get('/admin', hasRole('admin'), packageController.getAdminPackages);
router.post('/', hasRole('admin'), packageController.createPackage);
router.patch('/:id', hasRole('admin'), packageController.updatePackage);

module.exports = router;
