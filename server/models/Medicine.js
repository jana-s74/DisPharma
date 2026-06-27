const mongoose = require('mongoose');

const medicineSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  genericName: {
    type: String,
    trim: true,
    default: '',
  },
  category: {
    type: String,
    trim: true,
    default: 'General',
  },
  aliases: {
    type: [String],
    default: [],
  },
});

medicineSchema.index({ name: 'text', aliases: 'text', genericName: 'text' });

module.exports = mongoose.model('Medicine', medicineSchema);
