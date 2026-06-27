const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  fromMedicalId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  toMedicalId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  items: [
    {
      medicineId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Medicine',
      },
      medicineName: String,
      quantity: Number,
      buyPrice: Number,
      sellPrice: Number,
      margin: Number,
    },
  ],
  totalBuyPrice: {
    type: Number,
    required: true,
  },
  totalSellPrice: {
    type: Number,
    required: true,
  },
  totalMargin: {
    type: Number,
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Transaction', transactionSchema);
