/**
 * DisPharma — FULL RESET + SEED
 * Deletes ALL data and creates fresh sample pharmacies with stock + images
 */

require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Medicine = require('../models/Medicine');
const Stock = require('../models/Stock');
const Transaction = require('../models/Transaction');

// ── Category → local image mapping ───────────────────────────────────────────
// Images are served from client/public/medicines/
const CAT_IMAGE = {
  'Analgesic':         '/medicines/fever_pain.png',
  'Pain Relief':       '/medicines/fever_pain.png',
  'Antibiotic':        '/medicines/antibiotic.png',
  'Antacid':           '/medicines/antacid.png',
  'Diabetic Care':     '/medicines/diabetic.png',
  'Heart Care':        '/medicines/heart.png',
  'Antihistamine':     '/medicines/antihistamine.png',
  'Antiasthmatic':     '/medicines/antihistamine.png',
  'Vitamins':          '/medicines/vitamins.png',
  'Personal Care':     '/medicines/skincare.png',
  'Enzyme Supplement': '/medicines/antibiotic.png',
  'Anxiolytic':        '/medicines/diabetic.png',
};

// ── 30 Medicines ─────────────────────────────────────────────────────────────
const MEDICINES = [
  { name: 'Dolo 650',            generic: 'Paracetamol',                       cat: 'Analgesic',          buy: 18,  sell: 28,  qty: 200 },
  { name: 'Crocin 500',          generic: 'Paracetamol 500mg',                 cat: 'Analgesic',          buy: 14,  sell: 22,  qty: 150 },
  { name: 'Combiflam',           generic: 'Ibuprofen + Paracetamol',           cat: 'Pain Relief',        buy: 20,  sell: 32,  qty: 175 },
  { name: 'Ibuprofen 400',       generic: 'Ibuprofen',                         cat: 'Pain Relief',        buy: 15,  sell: 25,  qty: 180 },
  { name: 'Augmentin 625',       generic: 'Amoxicillin + Clavulanate',         cat: 'Antibiotic',         buy: 120, sell: 155, qty: 60  },
  { name: 'Azithromycin 500',    generic: 'Azithromycin',                      cat: 'Antibiotic',         buy: 85,  sell: 110, qty: 40  },
  { name: 'Amoxicillin 500',     generic: 'Amoxicillin',                       cat: 'Antibiotic',         buy: 55,  sell: 78,  qty: 85  },
  { name: 'Pan D',               generic: 'Pantoprazole + Domperidone',        cat: 'Antacid',            buy: 60,  sell: 80,  qty: 80  },
  { name: 'Omeprazole 20',       generic: 'Omeprazole',                        cat: 'Antacid',            buy: 30,  sell: 45,  qty: 100 },
  { name: 'Pantoprazole 40',     generic: 'Pantoprazole',                      cat: 'Antacid',            buy: 28,  sell: 42,  qty: 110 },
  { name: 'Digene Gel',          generic: 'Magnesium + Simethicone',           cat: 'Antacid',            buy: 55,  sell: 75,  qty: 90  },
  { name: 'Metformin 500',       generic: 'Metformin HCl',                     cat: 'Diabetic Care',      buy: 22,  sell: 35,  qty: 300 },
  { name: 'Glimepiride 1',       generic: 'Glimepiride',                       cat: 'Diabetic Care',      buy: 30,  sell: 45,  qty: 115 },
  { name: 'Insulin Glargine',    generic: 'Insulin Glargine',                  cat: 'Diabetic Care',      buy: 580, sell: 700, qty: 20  },
  { name: 'Atorvastatin 10',     generic: 'Atorvastatin',                      cat: 'Heart Care',         buy: 40,  sell: 58,  qty: 120 },
  { name: 'Amlodipine 5',        generic: 'Amlodipine Besylate',               cat: 'Heart Care',         buy: 22,  sell: 35,  qty: 170 },
  { name: 'Losartan 50',         generic: 'Losartan Potassium',                cat: 'Heart Care',         buy: 48,  sell: 68,  qty: 95  },
  { name: 'Cetirizine 10',       generic: 'Cetirizine HCl',                    cat: 'Antihistamine',      buy: 12,  sell: 20,  qty: 250 },
  { name: 'Levocetirizine 5',    generic: 'Levocetirizine',                    cat: 'Antihistamine',      buy: 18,  sell: 28,  qty: 140 },
  { name: 'Montelukast 10',      generic: 'Montelukast Sodium',                cat: 'Antiasthmatic',      buy: 75,  sell: 100, qty: 70  },
  { name: 'Vitamin C 500',       generic: 'Ascorbic Acid',                     cat: 'Vitamins',           buy: 45,  sell: 65,  qty: 200 },
  { name: 'Vitamin D3 1000IU',   generic: 'Cholecalciferol',                   cat: 'Vitamins',           buy: 80,  sell: 110, qty: 90  },
  { name: 'B-Complex Tablets',   generic: 'Vitamin B Complex',                 cat: 'Vitamins',           buy: 35,  sell: 50,  qty: 220 },
  { name: 'Calcium 500',         generic: 'Calcium Carbonate',                 cat: 'Vitamins',           buy: 55,  sell: 75,  qty: 160 },
  { name: 'Betamethasone Cream', generic: 'Betamethasone Valerate',            cat: 'Personal Care',      buy: 45,  sell: 65,  qty: 60  },
  { name: 'Ketoconazole Shampoo',generic: 'Ketoconazole 2%',                   cat: 'Personal Care',      buy: 110, sell: 145, qty: 35  },
  { name: 'Chymoral Forte',      generic: 'Trypsin + Chymotrypsin',            cat: 'Enzyme Supplement',  buy: 95,  sell: 128, qty: 55  },
  { name: 'Ranitidine 150',      generic: 'Ranitidine HCl',                    cat: 'Antacid',            buy: 20,  sell: 32,  qty: 130 },
  { name: 'Clonazepam 0.5',      generic: 'Clonazepam',                        cat: 'Anxiolytic',         buy: 35,  sell: 52,  qty: 40  },
  { name: 'Mucaine Gel',         generic: 'Oxethazaine + Antacid',             cat: 'Antacid',            buy: 90,  sell: 120, qty: 45  },
];

// Pick real medicine image by category
function img(med) {
  return CAT_IMAGE[med.cat] || '/medicines/fever_pain.png';
}

// ── 4 Sample pharmacies (will share pincode of primary user) ─────────────────
const PHARMA_TEMPLATES = [
  {
    medicalName: 'Apollo Pharmacy',
    ownerName: 'Rajan Kumar',
    licenseNo: 'TN-APOLLO-001',
    address: '12, Gandhi Street, Near Bus Stand',
    offset: [0.004,  0.003],
    meds: [0, 1, 2, 3, 4, 5, 6, 7],        // 8 medicines
  },
  {
    medicalName: 'MedPlus Pharmacy',
    ownerName: 'Priya Venkat',
    licenseNo: 'TN-MEDPLUS-002',
    address: '45, Anna Nagar Main Road, 2nd Cross',
    offset: [-0.003, 0.004],
    meds: [8, 9, 10, 11, 12, 13, 14, 15],  // 8 medicines
  },
  {
    medicalName: 'Wellness Pharmacy',
    ownerName: 'Suresh Babu',
    licenseNo: 'TN-WELL-003',
    address: '78, Nehru Road, Opp. HDFC Bank',
    offset: [0.002, -0.003],
    meds: [16, 17, 18, 19, 20, 21, 22, 23], // 8 medicines
  },
  {
    medicalName: 'Netmeds Store',
    ownerName: 'Kavitha Raj',
    licenseNo: 'TN-NET-004',
    address: '5, Kamaraj Salai, West End',
    offset: [-0.001, -0.004],
    meds: [24, 25, 26, 27, 28, 29],         // 6 medicines
  },
];

// ── Main ──────────────────────────────────────────────────────────────────────
const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB Connected\n');

    // ── STEP 1: CLEAR EVERYTHING ─────────────────────────────────────────────
    console.log('🗑️  Deleting all existing data...');
    await Promise.all([
      User.deleteMany({}),
      Medicine.deleteMany({}),
      Stock.deleteMany({}),
      Transaction.deleteMany({}),
    ]);
    console.log('   ✅ All users, medicines, stock, transactions cleared!\n');

    // ── STEP 2: Create PRIMARY user (Saran Pharmacy) ─────────────────────────
    const salt = await bcrypt.genSalt(10);
    const primaryPass = await bcrypt.hash('saran@123', salt);
    const samplePass  = await bcrypt.hash('pharmacy@123', salt);

    const PINCODE = '600040';
    const BASE_LON = 80.2357;
    const BASE_LAT = 13.0827;

    const primary = await User.create({
      medicalName: 'Saran Pharmacy',
      ownerName: 'Saran',
      email: 'saran@dispharma.com',
      phone: '9876543000',
      licenseNo: 'TN-SARAN-2024',
      address: '1, Main Street, Anna Nagar, Chennai',
      pincode: PINCODE,
      location: { type: 'Point', coordinates: [BASE_LON, BASE_LAT] },
      password: primaryPass,
      isVerified: true,
    });
    console.log(`👤 Primary User: "${primary.medicalName}"`);
    console.log(`   📧 Email    : saran@dispharma.com`);
    console.log(`   🔑 Password : saran@123`);
    console.log(`   📍 Pincode  : ${PINCODE}\n`);

    // ── STEP 3: Seed Medicine master data ─────────────────────────────────────
    console.log('💊 Seeding medicine catalog...');
    const medDocs = await Medicine.insertMany(MEDICINES.map(m => ({
      name: m.name,
      genericName: m.generic,
      category: m.cat,
      aliases: [m.name.toLowerCase(), m.generic.toLowerCase()],
    })));
    console.log(`   ✅ ${medDocs.length} medicines added\n`);

    // ── STEP 4: Create 4 nearby pharmacies + their stock ─────────────────────
    console.log('🏥 Creating 4 nearby pharmacies...');
    let totalStock = 0;

    for (let i = 0; i < PHARMA_TEMPLATES.length; i++) {
      const t = PHARMA_TEMPLATES[i];
      const ph = await User.create({
        medicalName: t.medicalName,
        ownerName: t.ownerName,
        email: `pharma${i + 1}near${PINCODE}@dispharma.com`,
        phone: `9000${String(10000 + i + 1)}`,
        licenseNo: t.licenseNo,
        address: `${t.address}, Chennai - ${PINCODE}`,
        pincode: PINCODE,
        location: {
          type: 'Point',
          coordinates: [BASE_LON + t.offset[0], BASE_LAT + t.offset[1]],
        },
        password: samplePass,
        isVerified: true,
      });

      // Create stock for this pharmacy
      const stockDocs = t.meds.map(idx => {
        const med = MEDICINES[idx];
        return {
          medicalId: ph._id,
          medicineId: medDocs[idx]._id,
          medicineName: med.name,
          quantity: med.qty,
          buyPrice: med.buy,
          sellPrice: med.sell,
          imageUrl: img(med),
          lastUpdated: new Date(),
        };
      });

      await Stock.insertMany(stockDocs);
      totalStock += stockDocs.length;

      console.log(`   ✅ ${t.medicalName} — ${stockDocs.length} medicines`);
      stockDocs.forEach(s => console.log(`      💊 ${s.medicineName}  (₹${s.buyPrice} → ₹${s.sellPrice})  [Qty: ${s.quantity}]`));
    }

    // ── Summary ───────────────────────────────────────────────────────────────
    console.log('\n══════════════════════════════════════════════════');
    console.log('         🎉 RESET + SEED COMPLETED!');
    console.log('══════════════════════════════════════════════════');
    console.log(`💊 Medicines    : ${medDocs.length}`);
    console.log(`🏥 Pharmacies   : ${PHARMA_TEMPLATES.length} nearby + 1 primary`);
    console.log(`📦 Stock items  : ${totalStock}`);
    console.log(`📍 Pincode      : ${PINCODE}`);
    console.log('\n🔑 LOGIN CREDENTIALS:');
    console.log('   Email    : saran@dispharma.com');
    console.log('   Password : saran@123');
    console.log('\nRefresh the app → Explore Medicines to see stock! 🚀');

    process.exit(0);
  } catch (err) {
    console.error('\n❌ Seed error:', err.message);
    if (err.code === 11000) {
      console.error('   Duplicate key — try running again or check DB manually.');
    }
    process.exit(1);
  }
};

seed();
