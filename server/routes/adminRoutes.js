const express = require('express');
const router = express.Router();
const {
  adminLogin,
  getAdminStats,
  getAllPharmacies,
  getAllTransactions,
} = require('../controllers/adminController');
const { protectAdmin } = require('../middleware/adminMiddleware');

router.post('/login', adminLogin);
router.get('/stats', protectAdmin, getAdminStats);
router.get('/pharmacies', protectAdmin, getAllPharmacies);
router.get('/transactions', protectAdmin, getAllTransactions);

module.exports = router;
