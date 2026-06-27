const Stock = require('../models/Stock');
const User = require('../models/User');

const Medicine = require('../models/Medicine');

// @desc    Search medicines across all pharmacies in the network
// @route   GET /api/search?name=...
// @access  Private
const searchMedicines = async (req, res) => {
  try {
    const { name } = req.query;
    if (!name || name.trim().length < 1) {
      return res.status(400).json({ message: 'Search name is required' });
    }

    const searchRegex = new RegExp(name.trim(), 'i');
    const currentUser = req.user;

    // Helper: Build result item with distance
    const buildResultItem = (item, isOwn = false) => {
      let distance = null;
      if (
        !isOwn &&
        item.medicalId.location &&
        currentUser.location &&
        currentUser.location.coordinates[0] !== 0
      ) {
        distance = calculateDistance(
          currentUser.location.coordinates[1],
          currentUser.location.coordinates[0],
          item.medicalId.location.coordinates[1],
          item.medicalId.location.coordinates[0]
        );
      }
      return {
        _id: item._id,
        medicineName: item.medicineName,
        medicineId: item.medicineId,
        medicalId: isOwn ? currentUser._id : item.medicalId._id,
        medicalName: isOwn ? currentUser.medicalName + ' (Your Stock)' : item.medicalId.medicalName,
        medicalAddress: isOwn ? currentUser.address : item.medicalId.address,
        medicalPhone: isOwn ? currentUser.phone : item.medicalId.phone,
        medicalWebsite: isOwn ? (currentUser.website || '') : (item.medicalId.website || ''),
        quantity: item.quantity,
        buyPrice: item.buyPrice,
        sellPrice: item.sellPrice,
        imageUrl: item.imageUrl || '',
        distance: distance ? `${distance.toFixed(1)} km` : (isOwn ? '0 km' : 'In Network'),
        distanceKm: isOwn ? 0 : distance,
        isOwn,
      };
    };

    // Step 1: Find Exact Matches in Stock
    const ownStock = await Stock.find({
      medicalId: currentUser._id,
      medicineName: { $regex: searchRegex },
    });

    const otherStock = await Stock.find({
      medicalId: { $ne: currentUser._id },
      medicineName: { $regex: searchRegex },
      quantity: { $gt: 0 },
    }).populate('medicalId', 'medicalName address phone pincode location website');

    const exactOwnResults = ownStock.map(item => buildResultItem(item, true));
    const exactNearbyResults = otherStock
      .filter((item) => item.medicalId)
      .map(item => buildResultItem(item, false))
      .sort((a, b) => (a.distanceKm ?? 9999) - (b.distanceKm ?? 9999));

    // Step 2: Recommendations (Generic Substitutes)
    let recommendationResults = [];
    
    // Find the medicines the user is searching for in the catalogue
    const searchedMedicines = await Medicine.find({ name: { $regex: searchRegex } });
    
    // Extract unique generic names (ignoring empty ones)
    const genericNames = [...new Set(
      searchedMedicines
        .map(m => m.genericName)
        .filter(g => g && g.trim().length > 0)
    )];

    if (genericNames.length > 0) {
      // Find all OTHER medicines with these generic names
      const substituteMedicines = await Medicine.find({
        genericName: { $in: genericNames },
        name: { $not: searchRegex } // Exclude the ones they already searched exactly
      });

      if (substituteMedicines.length > 0) {
        const substituteNames = substituteMedicines.map(m => m.name);
        
        // Find stock for these substitute names (excluding own stock to keep it simple, or include it)
        const subStock = await Stock.find({
          medicalId: { $ne: currentUser._id }, // show substitutes from network
          medicineName: { $in: substituteNames },
          quantity: { $gt: 0 },
        }).populate('medicalId', 'medicalName address phone pincode location website');

        recommendationResults = subStock
          .filter(item => item.medicalId)
          .map(item => buildResultItem(item, false))
          .sort((a, b) => (a.distanceKm ?? 9999) - (b.distanceKm ?? 9999));
      }
    }

    res.json({
      own: exactOwnResults,
      nearby: exactNearbyResults,
      recommendations: recommendationResults,
    });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ message: 'Error searching medicines' });
  }
};

// @desc    Get ALL medicines from ALL pharmacies in the network (explore page)
// @route   GET /api/search/explore
// @access  Private
const exploreNearby = async (req, res) => {
  try {
    const currentUser = req.user;

    // All stock from all other pharmacies
    const allStock = await Stock.find({
      medicalId: { $ne: currentUser._id },
      quantity: { $gt: 0 },
    })
      .populate('medicalId', 'medicalName address phone pincode location website')
      .sort({ medicineName: 1 });

    const results = allStock
      .filter((item) => item.medicalId)
      .map((item) => {
        let distance = null;
        if (
          item.medicalId.location &&
          currentUser.location &&
          currentUser.location.coordinates[0] !== 0
        ) {
          distance = calculateDistance(
            currentUser.location.coordinates[1],
            currentUser.location.coordinates[0],
            item.medicalId.location.coordinates[1],
            item.medicalId.location.coordinates[0]
          );
        }
        return {
          _id: item._id,
          medicineName: item.medicineName,
          medicineId: item.medicineId,
          medicalId: item.medicalId._id,
          medicalName: item.medicalId.medicalName,
          medicalAddress: item.medicalId.address,
          medicalPhone: item.medicalId.phone,
          medicalWebsite: item.medicalId.website || '',
          quantity: item.quantity,
          buyPrice: item.buyPrice,
          sellPrice: item.sellPrice,
          imageUrl: item.imageUrl || '',
          distance: distance ? `${distance.toFixed(1)} km` : 'In Network',
          distanceKm: distance,
        };
      });

    results.sort((a, b) => (a.distanceKm ?? 9999) - (b.distanceKm ?? 9999));
    res.json(results);
  } catch (error) {
    console.error('Explore error:', error);
    res.status(500).json({ message: 'Error fetching network medicines' });
  }
};

// @desc    Get nearby pharmacies (for post-registration suggestion)
// @route   GET /api/search/nearby-pharmacies
// @access  Private
const getNearbyPharmacies = async (req, res) => {
  try {
    const currentUser = req.user;

    // All pharmacies except self
    const allPharmacies = await User.find({
      _id: { $ne: currentUser._id },
    }).select('medicalName ownerName address phone pincode location website createdAt');

    const results = allPharmacies.map((pharmacy) => {
      let distance = null;
      if (
        pharmacy.location &&
        currentUser.location &&
        currentUser.location.coordinates[0] !== 0
      ) {
        distance = calculateDistance(
          currentUser.location.coordinates[1],
          currentUser.location.coordinates[0],
          pharmacy.location.coordinates[1],
          pharmacy.location.coordinates[0]
        );
      }
      return {
        _id: pharmacy._id,
        medicalName: pharmacy.medicalName,
        ownerName: pharmacy.ownerName,
        address: pharmacy.address,
        phone: pharmacy.phone,
        pincode: pharmacy.pincode,
        website: pharmacy.website || '',
        distance: distance ? `${distance.toFixed(1)} km` : 'In Network',
        distanceKm: distance,
        joinedAt: pharmacy.createdAt,
        lat: pharmacy.location?.coordinates?.[1] ?? null,
        lng: pharmacy.location?.coordinates?.[0] ?? null,
      };
    });

    // Sort by distance
    results.sort((a, b) => (a.distanceKm ?? 9999) - (b.distanceKm ?? 9999));
    res.json(results);
  } catch (error) {
    console.error('Nearby pharmacies error:', error);
    res.status(500).json({ message: 'Error fetching nearby pharmacies' });
  }
};

// Haversine formula — distance in km
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg) {
  return deg * (Math.PI / 180);
}

module.exports = { searchMedicines, exploreNearby, getNearbyPharmacies };
