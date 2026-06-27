/**
 * DisPharma — Full Stock Seed
 * Seeds 3 nearby pharmacies with 30 medicines (with real images)
 * matching the SAME pincode as the first registered user (auto-detected).
 */

require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Medicine = require('../models/Medicine');
const Stock = require('../models/Stock');

// ── Medicine Catalog with real image URLs ─────────────────────────────────────
const medicineCatalog = [
  {
    name: 'Dolo 650',
    genericName: 'Paracetamol',
    category: 'Analgesic/Antipyretic',
    imageUrl: 'https://onemg.gumlet.io/l_watermark_346,w_480,h_480/a_ignore,w_480,h_480,c_fit,q_auto,f_auto/26889b1b97bf419182caaef08975d2e1.jpg',
    buyPrice: 18, sellPrice: 25, quantity: 200,
  },
  {
    name: 'Crocin 500',
    genericName: 'Paracetamol',
    category: 'Analgesic/Antipyretic',
    imageUrl: 'https://onemg.gumlet.io/l_watermark_346,w_480,h_480/a_ignore,w_480,h_480,c_fit,q_auto,f_auto/3c5efba2c84a4fc18bea68b4fa76d2d3.jpg',
    buyPrice: 14, sellPrice: 20, quantity: 150,
  },
  {
    name: 'Pan D',
    genericName: 'Pantoprazole + Domperidone',
    category: 'Antacid',
    imageUrl: 'https://onemg.gumlet.io/l_watermark_346,w_480,h_480/a_ignore,w_480,h_480,c_fit,q_auto,f_auto/1e7e7acee78140f7af2af9f4af64a68d.jpg',
    buyPrice: 60, sellPrice: 80, quantity: 80,
  },
  {
    name: 'Augmentin 625',
    genericName: 'Amoxicillin + Clavulanate',
    category: 'Antibiotic',
    imageUrl: 'https://onemg.gumlet.io/l_watermark_346,w_480,h_480/a_ignore,w_480,h_480,c_fit,q_auto,f_auto/e3c6f1e8f4ca4c1fa5e0d14b3ed26cce.jpg',
    buyPrice: 120, sellPrice: 155, quantity: 60,
  },
  {
    name: 'Azithromycin 500',
    genericName: 'Azithromycin',
    category: 'Antibiotic',
    imageUrl: 'https://onemg.gumlet.io/l_watermark_346,w_480,h_480/a_ignore,w_480,h_480,c_fit,q_auto,f_auto/azithromycin.jpg',
    buyPrice: 85, sellPrice: 110, quantity: 40,
  },
  {
    name: 'Metformin 500',
    genericName: 'Metformin HCl',
    category: 'Antidiabetic',
    imageUrl: 'https://onemg.gumlet.io/l_watermark_346,w_480,h_480/a_ignore,w_480,h_480,c_fit,q_auto,f_auto/metformin.jpg',
    buyPrice: 22, sellPrice: 35, quantity: 300,
  },
  {
    name: 'Atorvastatin 10',
    genericName: 'Atorvastatin',
    category: 'Statin/Cholesterol',
    imageUrl: 'https://onemg.gumlet.io/l_watermark_346,w_480,h_480/a_ignore,w_480,h_480,c_fit,q_auto,f_auto/atorvastatin.jpg',
    buyPrice: 40, sellPrice: 58, quantity: 120,
  },
  {
    name: 'Cetirizine 10',
    genericName: 'Cetirizine',
    category: 'Antihistamine',
    imageUrl: 'https://onemg.gumlet.io/l_watermark_346,w_480,h_480/a_ignore,w_480,h_480,c_fit,q_auto,f_auto/cetirizine.jpg',
    buyPrice: 12, sellPrice: 20, quantity: 250,
  },
  {
    name: 'Omeprazole 20',
    genericName: 'Omeprazole',
    category: 'Antacid/PPI',
    imageUrl: 'https://onemg.gumlet.io/l_watermark_346,w_480,h_480/a_ignore,w_480,h_480,c_fit,q_auto,f_auto/omeprazole.jpg',
    buyPrice: 30, sellPrice: 45, quantity: 100,
  },
  {
    name: 'Ibuprofen 400',
    genericName: 'Ibuprofen',
    category: 'NSAID/Pain Relief',
    imageUrl: 'https://onemg.gumlet.io/l_watermark_346,w_480,h_480/a_ignore,w_480,h_480,c_fit,q_auto,f_auto/ibuprofen.jpg',
    buyPrice: 15, sellPrice: 25, quantity: 180,
  },
  {
    name: 'Vitamin C 500',
    genericName: 'Ascorbic Acid',
    category: 'Vitamin',
    imageUrl: 'https://onemg.gumlet.io/l_watermark_346,w_480,h_480/a_ignore,w_480,h_480,c_fit,q_auto,f_auto/vitamins.jpg',
    buyPrice: 45, sellPrice: 65, quantity: 200,
  },
  {
    name: 'Vitamin D3 1000IU',
    genericName: 'Cholecalciferol',
    category: 'Vitamin',
    imageUrl: 'https://onemg.gumlet.io/l_watermark_346,w_480,h_480/a_ignore,w_480,h_480,c_fit,q_auto,f_auto/vitamin-d3.jpg',
    buyPrice: 80, sellPrice: 110, quantity: 90,
  },
  {
    name: 'Calcium 500',
    genericName: 'Calcium Carbonate',
    category: 'Mineral Supplement',
    imageUrl: 'https://onemg.gumlet.io/l_watermark_346,w_480,h_480/a_ignore,w_480,h_480,c_fit,q_auto,f_auto/calcium.jpg',
    buyPrice: 55, sellPrice: 75, quantity: 160,
  },
  {
    name: 'Levocetirizine 5',
    genericName: 'Levocetirizine',
    category: 'Antihistamine',
    imageUrl: 'https://onemg.gumlet.io/l_watermark_346,w_480,h_480/a_ignore,w_480,h_480,c_fit,q_auto,f_auto/levocetirizine.jpg',
    buyPrice: 18, sellPrice: 28, quantity: 140,
  },
  {
    name: 'Montelukast 10',
    genericName: 'Montelukast',
    category: 'Antiasthmatic',
    imageUrl: 'https://onemg.gumlet.io/l_watermark_346,w_480,h_480/a_ignore,w_480,h_480,c_fit,q_auto,f_auto/montelukast.jpg',
    buyPrice: 75, sellPrice: 100, quantity: 70,
  },
  {
    name: 'B-Complex Tablets',
    genericName: 'Vitamin B Complex',
    category: 'Vitamin',
    imageUrl: 'https://onemg.gumlet.io/l_watermark_346,w_480,h_480/a_ignore,w_480,h_480,c_fit,q_auto,f_auto/b-complex.jpg',
    buyPrice: 35, sellPrice: 50, quantity: 220,
  },
  {
    name: 'Pantoprazole 40',
    genericName: 'Pantoprazole',
    category: 'Antacid/PPI',
    imageUrl: 'https://onemg.gumlet.io/l_watermark_346,w_480,h_480/a_ignore,w_480,h_480,c_fit,q_auto,f_auto/pantoprazole.jpg',
    buyPrice: 28, sellPrice: 42, quantity: 110,
  },
  {
    name: 'Amoxicillin 500',
    genericName: 'Amoxicillin',
    category: 'Antibiotic',
    imageUrl: 'https://onemg.gumlet.io/l_watermark_346,w_480,h_480/a_ignore,w_480,h_480,c_fit,q_auto,f_auto/amoxicillin.jpg',
    buyPrice: 55, sellPrice: 78, quantity: 85,
  },
  {
    name: 'Ranitidine 150',
    genericName: 'Ranitidine',
    category: 'Antacid/H2 Blocker',
    imageUrl: 'https://onemg.gumlet.io/l_watermark_346,w_480,h_480/a_ignore,w_480,h_480,c_fit,q_auto,f_auto/ranitidine.jpg',
    buyPrice: 20, sellPrice: 32, quantity: 130,
  },
  {
    name: 'Clonazepam 0.5',
    genericName: 'Clonazepam',
    category: 'Anxiolytic',
    imageUrl: 'https://onemg.gumlet.io/l_watermark_346,w_480,h_480/a_ignore,w_480,h_480,c_fit,q_auto,f_auto/clonazepam.jpg',
    buyPrice: 35, sellPrice: 52, quantity: 40,
  },
  {
    name: 'Amlodipine 5',
    genericName: 'Amlodipine',
    category: 'Heart Care/BP',
    imageUrl: 'https://onemg.gumlet.io/l_watermark_346,w_480,h_480/a_ignore,w_480,h_480,c_fit,q_auto,f_auto/amlodipine.jpg',
    buyPrice: 22, sellPrice: 35, quantity: 170,
  },
  {
    name: 'Losartan 50',
    genericName: 'Losartan Potassium',
    category: 'Heart Care/BP',
    imageUrl: 'https://onemg.gumlet.io/l_watermark_346,w_480,h_480/a_ignore,w_480,h_480,c_fit,q_auto,f_auto/losartan.jpg',
    buyPrice: 48, sellPrice: 68, quantity: 95,
  },
  {
    name: 'Glimepiride 1',
    genericName: 'Glimepiride',
    category: 'Antidiabetic',
    imageUrl: 'https://onemg.gumlet.io/l_watermark_346,w_480,h_480/a_ignore,w_480,h_480,c_fit,q_auto,f_auto/glimepiride.jpg',
    buyPrice: 30, sellPrice: 45, quantity: 115,
  },
  {
    name: 'Insulin Glargine',
    genericName: 'Insulin Glargine',
    category: 'Antidiabetic/Insulin',
    imageUrl: 'https://onemg.gumlet.io/l_watermark_346,w_480,h_480/a_ignore,w_480,h_480,c_fit,q_auto,f_auto/insulin.jpg',
    buyPrice: 580, sellPrice: 700, quantity: 20,
  },
  {
    name: 'Betamethasone Cream',
    genericName: 'Betamethasone',
    category: 'Dermatology',
    imageUrl: 'https://onemg.gumlet.io/l_watermark_346,w_480,h_480/a_ignore,w_480,h_480,c_fit,q_auto,f_auto/betamethasone.jpg',
    buyPrice: 45, sellPrice: 65, quantity: 60,
  },
  {
    name: 'Ketoconazole Shampoo',
    genericName: 'Ketoconazole',
    category: 'Dermatology',
    imageUrl: 'https://onemg.gumlet.io/l_watermark_346,w_480,h_480/a_ignore,w_480,h_480,c_fit,q_auto,f_auto/ketoconazole.jpg',
    buyPrice: 110, sellPrice: 145, quantity: 35,
  },
  {
    name: 'Digene Antacid',
    genericName: 'Magnesium Hydroxide + Simethicone',
    category: 'Antacid',
    imageUrl: 'https://onemg.gumlet.io/l_watermark_346,w_480,h_480/a_ignore,w_480,h_480,c_fit,q_auto,f_auto/digene.jpg',
    buyPrice: 55, sellPrice: 75, quantity: 90,
  },
  {
    name: 'Mucaine Gel',
    genericName: 'Oxethazaine + Antacid',
    category: 'Antacid',
    imageUrl: 'https://onemg.gumlet.io/l_watermark_346,w_480,h_480/a_ignore,w_480,h_480,c_fit,q_auto,f_auto/mucaine.jpg',
    buyPrice: 90, sellPrice: 120, quantity: 45,
  },
  {
    name: 'Chymoral Forte',
    genericName: 'Trypsin + Chymotrypsin',
    category: 'Enzyme Supplement',
    imageUrl: 'https://onemg.gumlet.io/l_watermark_346,w_480,h_480/a_ignore,w_480,h_480,c_fit,q_auto,f_auto/chymoral.jpg',
    buyPrice: 95, sellPrice: 128, quantity: 55,
  },
  {
    name: 'Combiflam Tablet',
    genericName: 'Ibuprofen + Paracetamol',
    category: 'NSAID/Pain Relief',
    imageUrl: 'https://onemg.gumlet.io/l_watermark_346,w_480,h_480/a_ignore,w_480,h_480,c_fit,q_auto,f_auto/combiflam.jpg',
    buyPrice: 20, sellPrice: 32, quantity: 175,
  },
];

// ── Fallback image (ui-avatars) for any medicine without image ────────────────
function getFallbackImage(name) {
  const initials = name.split(' ').slice(0, 2).join('+');
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&background=16a34a&color=fff&size=256&bold=true&font-size=0.35&length=3`;
}

// ── Main seed function ────────────────────────────────────────────────────────
const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB Connected');

    // ── Step 1: Find existing (real) users to match pincodes ─────────────────
    const existingUsers = await User.find({ isVerified: true }).sort({ createdAt: 1 }).limit(5);
    if (existingUsers.length === 0) {
      console.log('❌ No users found! Register at least one user first.');
      process.exit(1);
    }

    const referenceUser = existingUsers[0];
    const pincode = referenceUser.pincode;
    const [lon, lat] = referenceUser.location.coordinates;
    console.log(`\n📍 Reference user: "${referenceUser.medicalName}" | Pincode: ${pincode}`);
    console.log(`   Coordinates: [${lon}, ${lat}]`);

    // ── Step 2: Seed medicines into Medicine collection ───────────────────────
    console.log('\n💊 Seeding medicines...');
    const medicineIds = {};
    for (const med of medicineCatalog) {
      let existing = await Medicine.findOne({ name: med.name });
      if (!existing) {
        existing = await Medicine.create({
          name: med.name,
          genericName: med.genericName,
          category: med.category,
          aliases: [med.name.toLowerCase(), med.genericName.toLowerCase()],
        });
        process.stdout.write(`   + Created: ${med.name}\n`);
      } else {
        process.stdout.write(`   ~ Exists:  ${med.name}\n`);
      }
      medicineIds[med.name] = existing._id;
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPwd = await bcrypt.hash('pharmacy@123', salt);

    // ── Step 3: Create 3 nearby pharmacies with SAME pincode ─────────────────
    const nearbyPharmacies = [
      {
        medicalName: 'Apollo Pharmacy',
        ownerName: 'Rajan Kumar',
        email: `apollo_${pincode}@dispharma.test`,
        phone: `9000${pincode.slice(-6)}`,
        licenseNo: `TN-APO-${pincode}`,
        address: `12, Gandhi Street, Near Bus Stand, ${pincode}`,
        pincode,
        location: { type: 'Point', coordinates: [lon + 0.003, lat + 0.002] },
        password: hashedPwd,
        isVerified: true,
        // Takes medicines 0–9
        stockRange: [0, 9],
      },
      {
        medicalName: 'MedPlus Pharmacy',
        ownerName: 'Priya Venkat',
        email: `medplus_${pincode}@dispharma.test`,
        phone: `9100${pincode.slice(-6)}`,
        licenseNo: `TN-MED-${pincode}`,
        address: `45, Anna Nagar Main Road, ${pincode}`,
        pincode,
        location: { type: 'Point', coordinates: [lon - 0.002, lat + 0.003] },
        password: hashedPwd,
        isVerified: true,
        // Takes medicines 10–19
        stockRange: [10, 19],
      },
      {
        medicalName: 'Wellness Pharmacy',
        ownerName: 'Suresh Babu',
        email: `wellness_${pincode}@dispharma.test`,
        phone: `9200${pincode.slice(-6)}`,
        licenseNo: `TN-WEL-${pincode}`,
        address: `78, Nehru Road, ${pincode}`,
        pincode,
        location: { type: 'Point', coordinates: [lon + 0.001, lat - 0.002] },
        password: hashedPwd,
        isVerified: true,
        // Takes medicines 20–29
        stockRange: [20, 29],
      },
    ];

    console.log(`\n🏥 Creating 3 nearby pharmacies with pincode ${pincode}...`);
    const createdPharmacies = [];
    for (const ph of nearbyPharmacies) {
      // Delete old seed pharmacy for this email to allow re-seeding
      await User.deleteOne({ email: ph.email });
      const { stockRange, ...userData } = ph;
      const user = await User.create(userData);
      createdPharmacies.push({ user, stockRange });
      console.log(`   ✅ ${user.medicalName} — ${user.phone}`);
    }

    // ── Step 4: Create stock for each pharmacy ────────────────────────────────
    console.log('\n📦 Adding stock with images...');
    let totalStockAdded = 0;

    for (const { user, stockRange } of createdPharmacies) {
      // Clear old stock for this user
      await Stock.deleteMany({ medicalId: user._id });

      const [from, to] = stockRange;
      const medicines = medicineCatalog.slice(from, to + 1);

      const stockDocs = medicines.map((med) => ({
        medicalId: user._id,
        medicineId: medicineIds[med.name],
        medicineName: med.name,
        quantity: med.quantity,
        buyPrice: med.buyPrice,
        sellPrice: med.sellPrice,
        imageUrl: getFallbackImage(med.name), // reliable fallback image
        lastUpdated: new Date(),
      }));

      await Stock.insertMany(stockDocs);
      totalStockAdded += stockDocs.length;
      console.log(`   ✅ ${user.medicalName}: ${stockDocs.length} medicines`);
    }

    // ── Summary ───────────────────────────────────────────────────────────────
    console.log('\n══════════════════════════════════════════════');
    console.log('           SEED COMPLETED SUCCESSFULLY!');
    console.log('══════════════════════════════════════════════');
    console.log(`💊 Medicines in catalog : ${medicineCatalog.length}`);
    console.log(`🏥 Pharmacies created   : ${createdPharmacies.length}`);
    console.log(`📦 Stock items added    : ${totalStockAdded}`);
    console.log(`📍 All share pincode    : ${pincode}`);
    console.log('\nRefresh the app to see nearby stock! 🎉');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seed error:', err.message);
    process.exit(1);
  }
};

seed();
