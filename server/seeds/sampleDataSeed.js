const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../../.env') });

const User = require('../models/User');
const Stock = require('../models/Stock');
const Medicine = require('../models/Medicine');

const samplePharmacies = [
  {
    medicalName: 'Sri Balaji Medical',
    ownerName: 'Balaji Suresh',
    email: 'balaji@dispharma.com',
    phone: '9111222333',
    licenseNo: 'DL-CBE-2024-001',
    address: '12, RS Puram, Coimbatore',
    pincode: '641001',
    password: 'pharma123',
    location: { type: 'Point', coordinates: [76.9530, 11.0120] },
  },
  {
    medicalName: 'Kavitha Medicals',
    ownerName: 'Kavitha Devi',
    email: 'kavitha@dispharma.com',
    phone: '9222333444',
    licenseNo: 'DL-CBE-2024-002',
    address: '34, Gandhipuram, Coimbatore',
    pincode: '641001',
    password: 'pharma123',
    location: { type: 'Point', coordinates: [76.9622, 11.0210] },
  },
  {
    medicalName: 'Rajan Drug Store',
    ownerName: 'Rajan Kumar',
    email: 'rajan@dispharma.com',
    phone: '9333444555',
    licenseNo: 'DL-CBE-2024-003',
    address: '78, Saibaba Colony, Coimbatore',
    pincode: '641001',
    password: 'pharma123',
    location: { type: 'Point', coordinates: [76.9480, 11.0300] },
  },
  {
    medicalName: 'Amudha Pharmacy',
    ownerName: 'Amudha Krishnan',
    email: 'amudha@dispharma.com',
    phone: '9444555666',
    licenseNo: 'DL-CBE-2024-004',
    address: '5, Peelamedu, Coimbatore',
    pincode: '641001',
    password: 'pharma123',
    location: { type: 'Point', coordinates: [77.0010, 11.0250] },
  },
  {
    medicalName: 'Ganesha Medical Centre',
    ownerName: 'Ganesha Moorthy',
    email: 'ganesha@dispharma.com',
    phone: '9555666777',
    licenseNo: 'DL-CBE-2024-005',
    address: '22, Tatabad, Coimbatore',
    pincode: '641001',
    password: 'pharma123',
    location: { type: 'Point', coordinates: [76.9700, 11.0180] },
  },
];

// Stock per pharmacy [medicineName, qty, buyPrice, sellPrice]
const stockData = [
  // Sri Balaji Medical
  [
    ['Dolo 650',        45, 28,  35 ],
    ['Crocin 500',      60, 20,  25 ],
    ['Augmentin 625',   18, 130, 155],
    ['Metformin 500',   30, 22,  28 ],
    ['Pantoprazole 40',  8, 18,  22 ],
    ['Vitamin C 500',   55, 12,  15 ],
  ],
  // Kavitha Medicals
  [
    ['Pan D',           35, 42,  50 ],
    ['Azithromycin 500',12, 95,  115],
    ['Cetirizine 10',   70, 8,   12 ],
    ['Ibuprofen 400',   40, 15,  20 ],
    ['Vitamin D3',      25, 35,  42 ],
    ['B-Complex Tablets',50,10,  14 ],
    ['Dolo 650',         5, 28,  35 ],
  ],
  // Rajan Drug Store
  [
    ['Amoxicillin 500', 22, 55,  68 ],
    ['Omeprazole 20',   38, 16,  20 ],
    ['Atorvastatin 10', 30, 48,  58 ],
    ['Ranitidine 150',   9, 12,  16 ],
    ['Montelukast 10',  15, 72,  88 ],
    ['Paracetamol 500', 80, 10,  14 ],
  ],
  // Amudha Pharmacy
  [
    ['Levocetirizine 5', 28, 32,  40 ],
    ['Calcium 500',      42, 25,  32 ],
    ['Pantoprazole 40',  20, 18,  22 ],
    ['Pan D',             7, 42,  50 ],
    ['Augmentin 625',    14, 130, 155],
    ['Dolo 650',         30, 28,  35 ],
  ],
  // Ganesha Medical Centre
  [
    ['Metformin 500',   55, 22,  28 ],
    ['Cetirizine 10',   35, 8,   12 ],
    ['Vitamin C 500',   48, 12,  15 ],
    ['Azithromycin 500',10, 95,  115],
    ['Omeprazole 20',   25, 16,  20 ],
    ['B-Complex Tablets',60,10,  14 ],
  ],
];

const seedSampleData = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    // Clear existing sample pharmacies and their stocks to avoid duplicates and refresh IDs
    const phoneNumbers = samplePharmacies.map(p => p.phone);
    const existingUsers = await User.find({ phone: { $in: phoneNumbers } });
    const existingIds = existingUsers.map(u => u._id);
    
    await User.deleteMany({ _id: { $in: existingIds } });
    await Stock.deleteMany({ medicalId: { $in: existingIds } });
    console.log('🗑️  Cleared existing sample pharmacies and stocks\n');

    // Fetch all medicines for ID lookup
    const medicines = await Medicine.find({});
    const medMap = {};
    medicines.forEach((m) => { medMap[m.name.toLowerCase()] = m; });

    let totalUsers = 0;
    let totalStock = 0;

    for (let i = 0; i < samplePharmacies.length; i++) {
      const pharma = samplePharmacies[i];

      // Skip if already exists (safeguard)
      const existing = await User.findOne({ phone: pharma.phone });
      if (existing) {
        console.log(`⚠️  Skipping ${pharma.medicalName} — already exists`);
        continue;
      }

      // Hash password & create user
      const salt = await bcrypt.genSalt(10);
      const hashed = await bcrypt.hash(pharma.password, salt);
      const user = await User.create({ ...pharma, password: hashed });
      totalUsers++;
      console.log(`✅ Created: ${pharma.medicalName} (${pharma.phone})`);

      // Add stock for this pharmacy
      const items = stockData[i];
      for (const [name, qty, buy, sell] of items) {
        const med = medMap[name.toLowerCase()];
        await Stock.create({
          medicalId:    user._id,
          medicineId:   med ? med._id : new mongoose.Types.ObjectId(),
          medicineName: name,
          quantity:     qty,
          buyPrice:     buy,
          sellPrice:    sell,
          lastUpdated:  new Date(),
        });
        totalStock++;
        console.log(`   📦 ${name.padEnd(20)} qty:${String(qty).padStart(3)}  ₹${buy}→₹${sell}`);
      }
      console.log('');
    }

    console.log('═'.repeat(50));
    console.log(`✅ Done! Created ${totalUsers} pharmacies, ${totalStock} stock items`);
    console.log('\n📋 Login credentials for all sample pharmacies:');
    samplePharmacies.forEach((p) => {
      console.log(`   ${p.medicalName.padEnd(28)} | Phone: ${p.phone} | Pass: ${p.password}`);
    });

    process.exit(0);
  } catch (err) {
    console.error('❌ Seed error:', err.message);
    process.exit(1);
  }
};

seedSampleData();
