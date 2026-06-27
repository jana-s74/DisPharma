const express = require('express');
const router = express.Router();
const { generateBill, getBillHistory, downloadBillPDF, getDashboardStats } = require('../controllers/billController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.post('/generate', generateBill);
router.get('/history', getBillHistory);
router.get('/stats', getDashboardStats);
router.get('/pdf/:id', downloadBillPDF);

module.exports = router;
