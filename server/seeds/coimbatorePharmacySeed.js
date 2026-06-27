const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../../.env') });

const User = require('../models/User');
const Stock = require('../models/Stock');
const Medicine = require('../models/Medicine');

// 25 Coimbatore district pharmacies with real area coordinates
const pharmacies = [
  { medicalName: 'Sri Venkatesh Medicals',     ownerName: 'Venkatesh Rajan',    email: 'venkatesh@dispharma.com',   phone: '9801112221', licenseNo: 'TN-CBE-2024-101', address: 'RS Puram, Coimbatore',          pincode: '641002', password: 'pharma123', location: { type: 'Point', coordinates: [76.9530, 11.0120] } },
  { medicalName: 'Kavitha Medicals',           ownerName: 'Kavitha Devi',       email: 'kavitha@dispharma.com',     phone: '9802223332', licenseNo: 'TN-CBE-2024-102', address: 'Gandhipuram, Coimbatore',       pincode: '641001', password: 'pharma123', location: { type: 'Point', coordinates: [76.9622, 11.0210] } },
  { medicalName: 'Rajan Drug Store',           ownerName: 'Rajan Kumar',        email: 'rajan@dispharma.com',       phone: '9803334443', licenseNo: 'TN-CBE-2024-103', address: 'Saibaba Colony, Coimbatore',    pincode: '641011', password: 'pharma123', location: { type: 'Point', coordinates: [76.9480, 11.0300] } },
  { medicalName: 'Amudha Pharmacy',            ownerName: 'Amudha Krishnan',    email: 'amudha@dispharma.com',      phone: '9804445554', licenseNo: 'TN-CBE-2024-104', address: 'Peelamedu, Coimbatore',         pincode: '641004', password: 'pharma123', location: { type: 'Point', coordinates: [77.0010, 11.0250] } },
  { medicalName: 'Ganesha Medical Centre',     ownerName: 'Ganesha Moorthy',    email: 'ganesha@dispharma.com',     phone: '9805556665', licenseNo: 'TN-CBE-2024-105', address: 'Tatabad, Coimbatore',           pincode: '641012', password: 'pharma123', location: { type: 'Point', coordinates: [76.9700, 11.0180] } },
  { medicalName: 'Murugan Medicals',           ownerName: 'Murugan Selvan',     email: 'murugan@dispharma.com',     phone: '9806667776', licenseNo: 'TN-CBE-2024-106', address: 'Singanallur, Coimbatore',       pincode: '641005', password: 'pharma123', location: { type: 'Point', coordinates: [77.0180, 11.0050] } },
  { medicalName: 'Lakshmi Drug House',         ownerName: 'Lakshmi Prabhu',     email: 'lakshmi@dispharma.com',     phone: '9807778887', licenseNo: 'TN-CBE-2024-107', address: 'Ganapathy, Coimbatore',         pincode: '641006', password: 'pharma123', location: { type: 'Point', coordinates: [76.9390, 11.0420] } },
  { medicalName: 'Arun Pharmacy',              ownerName: 'Arun Babu',          email: 'arun@dispharma.com',        phone: '9808889998', licenseNo: 'TN-CBE-2024-108', address: 'Vadavalli, Coimbatore',         pincode: '641041', password: 'pharma123', location: { type: 'Point', coordinates: [76.9110, 11.0200] } },
  { medicalName: 'Vijaya Medical Store',       ownerName: 'Vijaya Kumari',      email: 'vijaya@dispharma.com',      phone: '9809990009', licenseNo: 'TN-CBE-2024-109', address: 'Kuniyamuthur, Coimbatore',      pincode: '641008', password: 'pharma123', location: { type: 'Point', coordinates: [76.9300, 10.9900] } },
  { medicalName: 'Siva Medicals',             ownerName: 'Sivakumar P',        email: 'siva@dispharma.com',        phone: '9800001110', licenseNo: 'TN-CBE-2024-110', address: 'Kovaipudur, Coimbatore',        pincode: '641042', password: 'pharma123', location: { type: 'Point', coordinates: [76.9200, 10.9750] } },
  { medicalName: 'Ponni Pharmacy',             ownerName: 'Ponni Devi',         email: 'ponni@dispharma.com',       phone: '9811112221', licenseNo: 'TN-CBE-2024-111', address: 'Hopes College, Coimbatore',     pincode: '641032', password: 'pharma123', location: { type: 'Point', coordinates: [76.9800, 11.0350] } },
  { medicalName: 'Ram Medical Agency',         ownerName: 'Ramesh Naidu',       email: 'ramesh@dispharma.com',      phone: '9822223332', licenseNo: 'TN-CBE-2024-112', address: 'Thudiyalur, Coimbatore',        pincode: '641034', password: 'pharma123', location: { type: 'Point', coordinates: [76.9560, 11.0550] } },
  { medicalName: 'Annai Drug Store',           ownerName: 'Annamalai Raj',      email: 'annai@dispharma.com',       phone: '9833334443', licenseNo: 'TN-CBE-2024-113', address: 'Saravanampatti, Coimbatore',    pincode: '641035', password: 'pharma123', location: { type: 'Point', coordinates: [77.0060, 11.0600] } },
  { medicalName: 'Priya Pharmacy',             ownerName: 'Priya Sundaram',     email: 'priya@dispharma.com',       phone: '9844445554', licenseNo: 'TN-CBE-2024-114', address: 'Vadapalani, Coimbatore',        pincode: '641036', password: 'pharma123', location: { type: 'Point', coordinates: [77.0250, 11.0450] } },
  { medicalName: 'Karthik Medical Hall',       ownerName: 'Karthik Suresh',     email: 'karthik@dispharma.com',     phone: '9855556665', licenseNo: 'TN-CBE-2024-115', address: 'Sulur, Coimbatore',             pincode: '641402', password: 'pharma123', location: { type: 'Point', coordinates: [77.1020, 11.0220] } },
  { medicalName: 'Anand Medicals',             ownerName: 'Anand Babu',         email: 'anand@dispharma.com',       phone: '9866667776', licenseNo: 'TN-CBE-2024-116', address: 'Irugur, Coimbatore',            pincode: '641103', password: 'pharma123', location: { type: 'Point', coordinates: [77.0650, 11.0100] } },
  { medicalName: 'Kumar Drug House',           ownerName: 'Kumar Pandian',      email: 'kumar@dispharma.com',       phone: '9877778887', licenseNo: 'TN-CBE-2024-117', address: 'Kinathukadavu, Coimbatore',     pincode: '642109', password: 'pharma123', location: { type: 'Point', coordinates: [76.9050, 10.9500] } },
  { medicalName: 'Selvam Pharmacy',            ownerName: 'Selvam Raj',         email: 'selvam@dispharma.com',      phone: '9888889998', licenseNo: 'TN-CBE-2024-118', address: 'Pollachi Road, Coimbatore',     pincode: '641001', password: 'pharma123', location: { type: 'Point', coordinates: [76.9600, 10.9650] } },
  { medicalName: 'Meenakshi Medical Centre',   ownerName: 'Meenakshi Raman',    email: 'meenakshi@dispharma.com',   phone: '9899990009', licenseNo: 'TN-CBE-2024-119', address: 'Ondipudur, Coimbatore',         pincode: '641016', password: 'pharma123', location: { type: 'Point', coordinates: [77.0350, 10.9950] } },
  { medicalName: 'Senthil Drug Store',         ownerName: 'Senthilkumar A',     email: 'senthil@dispharma.com',     phone: '9890001110', licenseNo: 'TN-CBE-2024-120', address: 'Podanur, Coimbatore',           pincode: '641023', password: 'pharma123', location: { type: 'Point', coordinates: [76.9800, 10.9780] } },
  { medicalName: 'Jothi Pharmacy',             ownerName: 'Jothilakshmi N',     email: 'jothi@dispharma.com',       phone: '9811223341', licenseNo: 'TN-CBE-2024-121', address: 'Ukkadam, Coimbatore',           pincode: '641001', password: 'pharma123', location: { type: 'Point', coordinates: [76.9710, 11.0010] } },
  { medicalName: 'Sri Ram Medical Shop',       ownerName: 'Sriraman Iyer',      email: 'sriram@dispharma.com',      phone: '9822334452', licenseNo: 'TN-CBE-2024-122', address: 'Uppilipalayam, Coimbatore',     pincode: '641015', password: 'pharma123', location: { type: 'Point', coordinates: [76.9860, 11.0400] } },
  { medicalName: 'Malathi Medicals',           ownerName: 'Malathi Ganesan',    email: 'malathi@dispharma.com',     phone: '9833445563', licenseNo: 'TN-CBE-2024-123', address: 'Race Course, Coimbatore',       pincode: '641018', password: 'pharma123', location: { type: 'Point', coordinates: [76.9630, 11.0060] } },
  { medicalName: 'Bharath Pharmacy',           ownerName: 'Bharathiraja M',     email: 'bharath@dispharma.com',     phone: '9844556674', licenseNo: 'TN-CBE-2024-124', address: 'Perur, Coimbatore',             pincode: '641010', password: 'pharma123', location: { type: 'Point', coordinates: [76.9220, 11.0000] } },
  { medicalName: 'Thangam Drug Palace',        ownerName: 'Thangam Balasubramaniam', email: 'thangam@dispharma.com', phone: '9855667785', licenseNo: 'TN-CBE-2024-125', address: 'Karamadai, Coimbatore',     pincode: '641104', password: 'pharma123', location: { type: 'Point', coordinates: [76.9700, 11.2400] } },
];

// Stock items per pharmacy — varied medicines
const allStockOptions = [
  ['Dolo 650',        45, 28,  35 ],
  ['Crocin 500',      60, 20,  25 ],
  ['Augmentin 625',   18, 130, 155],
  ['Metformin 500',   30, 22,  28 ],
  ['Pantoprazole 40', 25, 18,  22 ],
  ['Vitamin C 500',   55, 12,  15 ],
  ['Pan D',           35, 42,  50 ],
  ['Azithromycin 500',12, 95,  115],
  ['Cetirizine 10',   70, 8,   12 ],
  ['Ibuprofen 400',   40, 15,  20 ],
  ['Vitamin D3',      25, 35,  42 ],
  ['B-Complex Tablets',50,10,  14 ],
  ['Amoxicillin 500', 22, 55,  68 ],
  ['Omeprazole 20',   38, 16,  20 ],
  ['Atorvastatin 10', 30, 48,  58 ],
  ['Montelukast 10',  15, 72,  88 ],
  ['Paracetamol 500', 80, 10,  14 ],
  ['Levocetirizine 5',28, 32,  40 ],
  ['Calcium 500',     42, 25,  32 ],
  ['Amlodipine 5',    35, 22,  28 ],
  ['Glimepiride 2',   20, 38,  48 ],
  ['Telmisartan 40',  18, 42,  52 ],
  ['Rosuvastatin 10', 22, 55,  68 ],
  ['Ranitidine 150',   9, 12,  16 ],
  ['Combiflam',       50, 25,  32 ],
  ['Cifran 500',      15, 85,  100],
  ['Cardace 5',       12, 110, 135],
  ['Betnovate-N',     30, 78,  95 ],
  ['Benadryl Cough',  40, 95,  115],
  ['Glimestar M2',    18, 100, 118],
];

const getRandomStock = (seed) => {
  // Pick 5-8 random items deterministically per pharmacy
  const count = 5 + (seed % 4);
  const items = [];
  for (let i = 0; i < count; i++) {
    items.push(allStockOptions[(seed * 3 + i * 7) % allStockOptions.length]);
  }
  return [...new Map(items.map(x => [x[0], x])).values()]; // dedupe by name
};

const seedPharmacies = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    const medicines = await Medicine.find({});
    const medMap = {};
    medicines.forEach((m) => { medMap[m.name.toLowerCase()] = m; });

    let created = 0, skipped = 0, totalStock = 0;

    for (let i = 0; i < pharmacies.length; i++) {
      const pharma = pharmacies[i];

      // Skip if already exists
      const existing = await User.findOne({ phone: pharma.phone });
      if (existing) {
        console.log(`⚠️  Skipping ${pharma.medicalName} — already exists`);
        skipped++;
        continue;
      }

      const salt = await bcrypt.genSalt(10);
      const hashed = await bcrypt.hash(pharma.password, salt);
      const user = await User.create({ ...pharma, password: hashed, isVerified: true });
      created++;
      console.log(`✅ ${pharma.medicalName} — ${pharma.address}`);

      const stockItems = getRandomStock(i + 1);
      for (const [name, qty, buy, sell] of stockItems) {
        const med = medMap[name.toLowerCase()];
        await Stock.create({
          medicalId:    user._id,
          medicineId:   med?._id ?? new mongoose.Types.ObjectId(),
          medicineName: name,
          quantity:     qty + Math.floor(Math.random() * 30),
          buyPrice:     buy,
          sellPrice:    sell,
          lastUpdated:  new Date(),
        });
        totalStock++;
      }
      console.log(`   📦 Added ${stockItems.length} stock items\n`);
    }

    console.log('═'.repeat(55));
    console.log(`✅ Done! Created: ${created} | Skipped: ${skipped} | Stock items: ${totalStock}`);
    console.log('\n🔑 Default password for all: pharma123');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seed error:', err.message);
    process.exit(1);
  }
};

seedPharmacies();
