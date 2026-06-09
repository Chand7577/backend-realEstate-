const express = require('express');
const creditController = require('../controllers/creditController');
const { protect } = require('../middlewares/auth');

const router = express.Router();

router.use(protect);
router.get('/wallet', creditController.getWalletDetails);

module.exports = router;
