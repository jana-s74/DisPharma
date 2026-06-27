const express = require('express');
const router = express.Router();
const { getMyStock, addStock, updateStock, deleteStock, getLowStock } = require('../controllers/stockController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../utils/upload');

router.use(protect);

router.get('/my', getMyStock);
router.post('/add', upload.single('image'), addStock);
router.get('/low', getLowStock);
router.put('/:id', updateStock);
router.delete('/:id', deleteStock);

module.exports = router;
