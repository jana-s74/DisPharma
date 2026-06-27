const express = require('express');
const router = express.Router();
const { searchMedicines, exploreNearby, getNearbyPharmacies } = require('../controllers/searchController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/', searchMedicines);
router.get('/explore', exploreNearby);
router.get('/nearby-pharmacies', getNearbyPharmacies);

module.exports = router;
