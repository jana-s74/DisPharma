const PDFDocument = require('pdfkit');
const Transaction = require('../models/Transaction');
const User = require('../models/User');
const Stock = require('../models/Stock');

// @desc    Generate a bill
// @route   POST /api/bill/generate
// @access  Private
const generateBill = async (req, res) => {
  try {
    const { toMedicalId, items } = req.body;

    if (!toMedicalId || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'toMedicalId and items array are required' });
    }

    const toMedical = await User.findById(toMedicalId);
    if (!toMedical) {
      return res.status(404).json({ message: 'Target medical not found' });
    }

    // Calculate totals with 4% margin
    const processedItems = items.map((item) => {
      const buyPrice = Number(item.buyPrice);
      const sellPrice = parseFloat((buyPrice * 1.04).toFixed(2));
      const quantity = Number(item.quantity);
      const margin = parseFloat(((sellPrice - buyPrice) * quantity).toFixed(2));
      return {
        medicineId: item.medicineId,
        medicineName: item.medicineName,
        quantity,
        buyPrice,
        sellPrice,
        margin,
      };
    });

    const totalBuyPrice = processedItems.reduce((sum, i) => sum + i.buyPrice * i.quantity, 0);
    const totalSellPrice = processedItems.reduce((sum, i) => sum + i.sellPrice * i.quantity, 0);
    const totalMargin = processedItems.reduce((sum, i) => sum + i.margin, 0);

    const transaction = await Transaction.create({
      fromMedicalId: req.user._id,
      toMedicalId,
      items: processedItems,
      totalBuyPrice: parseFloat(totalBuyPrice.toFixed(2)),
      totalSellPrice: parseFloat(totalSellPrice.toFixed(2)),
      totalMargin: parseFloat(totalMargin.toFixed(2)),
      timestamp: new Date(),
    });

    // ── Deduct stock from source pharmacies ──────────────────────────────────
    const stockUpdates = [];
    for (const item of items) {
      try {
        const billedQty = Number(item.quantity);
        let stockDoc = null;

        // Try by stockItemId first (most precise)
        if (item.stockItemId) {
          stockDoc = await Stock.findById(item.stockItemId);
        }
        // Fallback: find by sourceMedicalId + medicineId
        if (!stockDoc && item.sourceMedicalId && item.medicineId) {
          stockDoc = await Stock.findOne({
            medicalId: item.sourceMedicalId,
            medicineId: item.medicineId,
          });
        }

        if (stockDoc) {
          const prevQty = stockDoc.quantity;
          stockDoc.quantity = Math.max(0, stockDoc.quantity - billedQty);
          stockDoc.lastUpdated = new Date();
          await stockDoc.save();
          stockUpdates.push({
            medicineName: item.medicineName,
            previousQty: prevQty,
            billedQty,
            remainingQty: stockDoc.quantity,
          });
          console.log(`📦 Stock deducted: ${item.medicineName} | ${prevQty} - ${billedQty} = ${stockDoc.quantity} remaining`);
        }
      } catch (stockErr) {
        console.warn(`Stock update failed for ${item.medicineName}:`, stockErr.message);
      }
    }

    res.status(201).json({
      transaction,
      stockUpdates,
      fromMedical: {
        _id: req.user._id,
        medicalName: req.user.medicalName,
        address: req.user.address,
        phone: req.user.phone,
        licenseNo: req.user.licenseNo,
      },
      toMedical: {
        _id: toMedical._id,
        medicalName: toMedical.medicalName,
        address: toMedical.address,
        phone: toMedical.phone,
      },
    });
  } catch (error) {
    console.error('Generate bill error:', error);
    res.status(500).json({ message: 'Error generating bill' });
  }
};

// @desc    Get bill history for logged-in medical
// @route   GET /api/bill/history
// @access  Private
const getBillHistory = async (req, res) => {
  try {
    const transactions = await Transaction.find({ fromMedicalId: req.user._id })
      .populate('toMedicalId', 'medicalName address phone')
      .sort({ timestamp: -1 })
      .limit(50);
    res.json(transactions);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching bill history' });
  }
};

// @desc    Download bill as PDF
// @route   GET /api/bill/pdf/:id
// @access  Private
const downloadBillPDF = async (req, res) => {
  try {
    const transaction = await Transaction.findOne({
      _id: req.params.id,
      fromMedicalId: req.user._id,
    })
      .populate('toMedicalId', 'medicalName address phone')
      .populate('fromMedicalId', 'medicalName address phone licenseNo');

    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    const doc = new PDFDocument({ margin: 50 });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=DisPharma_Bill_${transaction._id}.pdf`
    );
    doc.pipe(res);

    // Header (Source Medical Details)
    doc.fontSize(22).font('Helvetica-Bold').text(req.user.medicalName, { align: 'center' });
    doc.fontSize(10).font('Helvetica').text(req.user.address, { align: 'center' });
    doc.text(`Phone: ${req.user.phone} | License: ${req.user.licenseNo}`, { align: 'center' });
    doc.moveDown(0.5);
    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown(0.5);

    // Bill info
    doc.fontSize(12).font('Helvetica-Bold').text('TAX INVOICE / BILL', { align: 'center' });
    doc.moveDown(0.5);
    
    const startY = doc.y;
    
    // Right column: Bill Info
    doc.fontSize(10).font('Helvetica');
    doc.text(`Bill ID: #${transaction._id.toString().slice(-6).toUpperCase()}`, 50, startY, { align: 'right', width: 500 });
    doc.text(`Date: ${new Date(transaction.timestamp).toLocaleDateString('en-IN')}`, 50, doc.y, { align: 'right', width: 500 });
    doc.text(`Time: ${new Date(transaction.timestamp).toLocaleTimeString('en-IN')}`, 50, doc.y, { align: 'right', width: 500 });
    const rightY = doc.y;

    // Left column: Billed To
    doc.font('Helvetica-Bold').text('Billed To (Destination Medical):', 50, startY);
    doc.font('Helvetica').text(`${transaction.toMedicalId.medicalName}`, 50, doc.y);
    doc.text(`Address: ${transaction.toMedicalId.address}`, 50, doc.y);
    doc.text(`Phone: ${transaction.toMedicalId.phone}`, 50, doc.y);
    const leftY = doc.y;

    // Advance doc.y past both columns
    doc.y = Math.max(leftY, rightY) + 20;

    // Table header
    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown(0.3);
    doc.font('Helvetica-Bold').fontSize(9);
    const col = [50, 200, 280, 340, 400, 470];
    doc.text('Medicine', col[0], doc.y, { width: 140 });
    doc.text('Qty', col[1], doc.y - 12, { width: 60 });
    doc.text('Buy (Rs.)', col[2], doc.y - 12, { width: 60 });
    doc.text('Sell (Rs.)', col[3], doc.y - 12, { width: 60 });
    doc.text('Total (Rs.)', col[4], doc.y - 12, { width: 70 });
    doc.text('Margin (Rs.)', col[5], doc.y - 12, { width: 80 });
    doc.moveDown(0.3);
    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown(0.3);

    // Table rows
    doc.font('Helvetica').fontSize(9);
    transaction.items.forEach((item) => {
      const y = doc.y;
      doc.text(item.medicineName, col[0], y, { width: 140 });
      doc.text(String(item.quantity), col[1], y, { width: 60 });
      doc.text(`Rs. ${item.buyPrice.toFixed(2)}`, col[2], y, { width: 60 });
      doc.text(`Rs. ${item.sellPrice.toFixed(2)}`, col[3], y, { width: 60 });
      doc.text(`Rs. ${(item.sellPrice * item.quantity).toFixed(2)}`, col[4], y, { width: 70 });
      doc.text(`Rs. ${item.margin.toFixed(2)}`, col[5], y, { width: 80 });
      doc.moveDown(0.8);
    });

    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown(0.5);

    // Summary
    doc.font('Helvetica-Bold').fontSize(10);
    doc.text(`Subtotal (Buy): Rs. ${transaction.totalBuyPrice.toFixed(2)}`, { align: 'right' });
    doc.text(`Grand Total (Sell): Rs. ${transaction.totalSellPrice.toFixed(2)}`, { align: 'right' });
    doc.fillColor('#16a34a').text(`Total Margin (4%): Rs. ${transaction.totalMargin.toFixed(2)}`, { align: 'right' });
    doc.fillColor('black');
    doc.moveDown(1);
    doc.fontSize(8).font('Helvetica').fillColor('gray').text('Generated by DisPharma — Inter-Pharmacy Network', { align: 'center' });

    doc.end();
  } catch (error) {
    console.error('PDF error:', error);
    res.status(500).json({ message: 'Error generating PDF' });
  }
};

// @desc    Get dashboard stats
// @route   GET /api/bill/stats
// @access  Private
const getDashboardStats = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayTransactions = await Transaction.find({
      fromMedicalId: req.user._id,
      timestamp: { $gte: today, $lt: tomorrow },
    });

    const todayProfit = todayTransactions.reduce((sum, t) => sum + t.totalMargin, 0);
    const referralsMade = todayTransactions.length;

    res.json({
      todayProfit: parseFloat(todayProfit.toFixed(2)),
      referralsMade,
      pendingSettlements: 0, // Can be expanded later
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching stats' });
  }
};

module.exports = { generateBill, getBillHistory, downloadBillPDF, getDashboardStats };
