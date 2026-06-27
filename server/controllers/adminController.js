const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Stock = require('../models/Stock');
const Transaction = require('../models/Transaction');

// @desc    Admin Login
// @route   POST /api/admin/login
// @access  Public
const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    const inputEmail = (email || '').trim();
    const inputPass = (password || '').trim();

    const ADMIN_EMAIL = 'janaselvarasu7@gmail.com';
    const ADMIN_PASS = 'janaSK@1123';

    if (inputEmail === ADMIN_EMAIL && inputPass === ADMIN_PASS) {
      const token = jwt.sign({ email: inputEmail, role: 'admin' }, process.env.JWT_SECRET, {
        expiresIn: '7d',
      });
      res.json({ token, email: inputEmail });
    } else {
      res.status(401).json({ message: 'Invalid admin email or password' });
    }
  } catch (error) {
    console.error('Admin Login Error:', error);
    res.status(500).json({ message: 'Server error during admin login' });
  }
};

// @desc    Get global statistics
// @route   GET /api/admin/stats
// @access  Private (Admin)
const getAdminStats = async (req, res) => {
  try {
    const totalPharmacies = await User.countDocuments();
    const totalStockItems = await Stock.countDocuments();
    const totalTransactions = await Transaction.countDocuments();

    // Calculate global margins/earnings
    const bills = await Transaction.find({});
    const totalVolume = bills.reduce((acc, b) => acc + (b.totalSellPrice || 0), 0);
    const totalMargin = bills.reduce((acc, b) => acc + (b.totalMargin || 0), 0);

    res.json({
      totalPharmacies,
      totalStockItems,
      totalTransactions,
      totalVolume,
      totalMargin,
    });
  } catch (error) {
    console.error('Admin Stats Error:', error);
    res.status(500).json({ message: 'Failed to fetch admin stats' });
  }
};

// @desc    Get all pharmacies
// @route   GET /api/admin/pharmacies
// @access  Private (Admin)
const getAllPharmacies = async (req, res) => {
  try {
    const pharmacies = await User.find({})
      .select('-password -__v -resetPasswordOtp -loginOtp')
      .sort({ createdAt: -1 });
    res.json(pharmacies);
  } catch (error) {
    console.error('Admin Pharmacies Error:', error);
    res.status(500).json({ message: 'Failed to fetch pharmacies' });
  }
};

// @desc    Get all transactions (bills)
// @route   GET /api/admin/transactions
// @access  Private (Admin)
const getAllTransactions = async (req, res) => {
  try {
    const transactions = await Transaction.find({})
      .populate('fromMedicalId', 'medicalName ownerName phone address')
      .populate('toMedicalId', 'medicalName ownerName phone address')
      .sort({ timestamp: -1 });
    res.json(transactions);
  } catch (error) {
    console.error('Admin Transactions Error:', error);
    res.status(500).json({ message: 'Failed to fetch transactions' });
  }
};

module.exports = { adminLogin, getAdminStats, getAllPharmacies, getAllTransactions };
