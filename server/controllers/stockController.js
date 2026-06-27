const Stock = require('../models/Stock');
const Medicine = require('../models/Medicine');

// @desc    Get own medical's stock
// @route   GET /api/stock/my
// @access  Private
const getMyStock = async (req, res) => {
  try {
    const stock = await Stock.find({ medicalId: req.user._id })
      .populate('medicineId', 'name genericName category')
      .sort({ _id: -1 }); // LIFO stack algorithm for recently added
    res.json(stock);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching stock' });
  }
};

const { fetchMedicineImage } = require('../utils/aiImageFetcher');

// @desc    Add medicine to own stock
// @route   POST /api/stock/add
// @access  Private
const addStock = async (req, res) => {
  try {
    const { medicineId, medicineName, quantity, buyPrice, sellPrice } = req.body;

    if (!medicineId || !medicineName || quantity === undefined || !buyPrice || !sellPrice) {
      return res.status(400).json({ message: 'All fields are required' });
    }
    if (quantity < 0 || buyPrice < 0 || sellPrice < 0) {
      return res.status(400).json({ message: 'Prices and quantity must be non-negative' });
    }

    // Check if medicine already in stock for this medical
    const existing = await Stock.findOne({ medicalId: req.user._id, medicineId });
    if (existing) {
      return res.status(400).json({ message: 'Medicine already in your stock. Use update instead.' });
    }

    // Determine imageUrl
    let imageUrl = '';
    if (req.file) {
      // Local upload
      imageUrl = '/uploads/' + req.file.filename;
    } else {
      // AI Fetch fallback
      const aiImage = await fetchMedicineImage(medicineName);
      if (aiImage) {
        imageUrl = aiImage;
      }
    }

    const stock = await Stock.create({
      medicalId: req.user._id,
      medicineId,
      medicineName,
      quantity,
      buyPrice,
      sellPrice,
      imageUrl,
      lastUpdated: new Date(),
    });

    res.status(201).json(stock);
  } catch (error) {
    console.error('Add stock error:', error);
    res.status(500).json({ message: error.message || 'Error adding stock' });
  }
};

// @desc    Update stock item
// @route   PUT /api/stock/:id
// @access  Private
const updateStock = async (req, res) => {
  try {
    const stock = await Stock.findOne({ _id: req.params.id, medicalId: req.user._id });
    if (!stock) {
      return res.status(404).json({ message: 'Stock item not found' });
    }

    const { quantity, buyPrice, sellPrice } = req.body;

    if (quantity !== undefined) {
      if (quantity < 0) return res.status(400).json({ message: 'Quantity cannot be negative' });
      stock.quantity = quantity;
    }
    if (buyPrice !== undefined) {
      if (buyPrice < 0) return res.status(400).json({ message: 'Buy price cannot be negative' });
      stock.buyPrice = buyPrice;
    }
    if (sellPrice !== undefined) {
      if (sellPrice < 0) return res.status(400).json({ message: 'Sell price cannot be negative' });
      stock.sellPrice = sellPrice;
    }
    stock.lastUpdated = new Date();

    await stock.save();
    res.json(stock);
  } catch (error) {
    res.status(500).json({ message: 'Error updating stock' });
  }
};

// @desc    Delete stock item
// @route   DELETE /api/stock/:id
// @access  Private
const deleteStock = async (req, res) => {
  try {
    const stock = await Stock.findOne({ _id: req.params.id, medicalId: req.user._id });
    if (!stock) {
      return res.status(404).json({ message: 'Stock item not found' });
    }
    await stock.deleteOne();
    res.json({ message: 'Stock item removed' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting stock' });
  }
};

// @desc    Get low stock items (qty <= 10)
// @route   GET /api/stock/low
// @access  Private
const getLowStock = async (req, res) => {
  try {
    const lowStock = await Stock.find({
      medicalId: req.user._id,
      quantity: { $lte: 10 },
    }).sort({ quantity: 1 });
    res.json(lowStock);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching low stock' });
  }
};

module.exports = { getMyStock, addStock, updateStock, deleteStock, getLowStock };
