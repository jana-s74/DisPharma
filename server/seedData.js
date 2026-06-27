/**
 * DisPharma — Coimbatore Seed Data
 * ------------------------------------
 * 8 real-area Coimbatore pharmacies with realistic stock.
 * Run: node seedData.js  (from /server directory)
 *
 * HOW THE BUSINESS WORKS:
 * -----------------------
 * 1. Pharmacy A runs out of Medicine X.
 * 2. Pharmacy A searches DisPharma → finds Pharmacy B has it in stock.
 * 3. Pharmacy A REFERS the customer to Pharmacy B.
 * 4. Pharmacy B sells to the customer at a slightly higher price.
 * 5. Pharmacy A earns 4% of the sell price as REFERRAL MARGIN (profit).
 *    Example: sellPrice = ₹100 → Pharmacy A earns ₹4 automatically.
 * 6. Both pharmacies benefit: B gets the sale, A earns margin without stock.
 */

require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const Medicine = require('./models/Medicine');
const Stock = require('./models/Stock');

const seedData = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB Connected');

    // ─────────────────────────────────────────────────────────────────────────
    // MEDICINES (common medicines found in Tamil Nadu pharmacies)
    // ─────────────────────────────────────────────────────────────────────────
    const medicinesData = [
      // Fever / Pain
      { name: 'Dolo 650',         genericName: 'Paracetamol 650mg',               category: 'Fever/Pain',      aliases: ['paracetamol', 'panadol'] },
      { name: 'Combiflam',        genericName: 'Ibuprofen + Paracetamol',          category: 'Fever/Pain',      aliases: ['ibuprofen combo'] },
      { name: 'Crocin Advance',   genericName: 'Paracetamol 500mg',               category: 'Fever/Pain',      aliases: ['crocin'] },
      { name: 'Zerodol-P',        genericName: 'Aceclofenac + Paracetamol',       category: 'Pain Relief',     aliases: ['aceclofenac'] },

      // Antibiotic
      { name: 'Azithral 500',     genericName: 'Azithromycin 500mg',              category: 'Antibiotic',      aliases: ['azithromycin', 'zithromax'] },
      { name: 'Augmentin 625',    genericName: 'Amoxicillin + Clavulanate',       category: 'Antibiotic',      aliases: ['amoxicillin'] },
      { name: 'Cifran 500',       genericName: 'Ciprofloxacin 500mg',             category: 'Antibiotic',      aliases: ['ciprofloxacin'] },

      // Acidity / Gastro
      { name: 'Pantocid DSR',     genericName: 'Pantoprazole + Domperidone',      category: 'Acidity',         aliases: ['pantoprazole', 'pan dsr'] },
      { name: 'Gelusil MPS',      genericName: 'Antacid Suspension',              category: 'Acidity',         aliases: ['antacid'] },
      { name: 'Cremaffin Plus',   genericName: 'Liquid Paraffin + Milk of Magnesia', category: 'Constipation', aliases: ['laxative'] },

      // Blood Pressure / Heart
      { name: 'Amlokind-AT',      genericName: 'Amlodipine + Atenolol',           category: 'Blood Pressure',  aliases: ['amlodipine atenolol'] },
      { name: 'Telma 40',         genericName: 'Telmisartan 40mg',                category: 'Blood Pressure',  aliases: ['telmisartan'] },
      { name: 'Cardace 5',        genericName: 'Ramipril 5mg',                    category: 'Heart Care',      aliases: ['ramipril'] },

      // Diabetes
      { name: 'Glucophage 500',   genericName: 'Metformin 500mg',                 category: 'Diabetes',        aliases: ['metformin'] },
      { name: 'Glimestar M2',     genericName: 'Glimepiride + Metformin',         category: 'Diabetes',        aliases: ['glimepiride'] },

      // Cough / Cold
      { name: 'Benadryl Cough',   genericName: 'Diphenhydramine Syrup',           category: 'Cough/Cold',      aliases: ['benadryl', 'cough syrup'] },
      { name: 'Sinarest',         genericName: 'Chlorpheniramine + Paracetamol',  category: 'Cough/Cold',      aliases: ['cold tablet', 'sinarest'] },
      { name: 'Grilinctus BM',    genericName: 'Bromhexine + Menthol',            category: 'Cough/Cold',      aliases: ['grilinctus'] },

      // Vitamins / Supplements
      { name: 'Shelcal 500',      genericName: 'Calcium + Vitamin D3',            category: 'Vitamins',        aliases: ['calcium tablet', 'shelcal'] },
      { name: 'Becosules',        genericName: 'Vitamin B Complex',               category: 'Vitamins',        aliases: ['b complex', 'becosule'] },
      { name: 'Revital H',        genericName: 'Multivitamin + Ginseng',          category: 'Vitamins',        aliases: ['revital', 'multivitamin'] },

      // Skin
      { name: 'Betnovate-N',      genericName: 'Betamethasone + Neomycin Cream',  category: 'Skin',            aliases: ['betamethasone cream'] },
      { name: 'Ciplox Eye Drops', genericName: 'Ciprofloxacin Eye Drops',         category: 'Eye Care',        aliases: ['eye drops', 'ciplox'] },

      // Allergy
      { name: 'Allegra 120',      genericName: 'Fexofenadine 120mg',              category: 'Allergy',         aliases: ['fexofenadine', 'allegra'] },
      { name: 'Avil 25',          genericName: 'Pheniramine 25mg',                category: 'Allergy',         aliases: ['pheniramine'] },

      // Liver
      { name: 'Liv 52',           genericName: 'Herbal Liver Supplement',         category: 'Liver Care',      aliases: ['liver tonic'] },
      { name: 'Udiliv 300',       genericName: 'Ursodeoxycholic Acid 300mg',      category: 'Liver Care',      aliases: ['ursodiol'] },

      // Kidney / Urology
      { name: 'Urimax 0.4',       genericName: 'Tamsulosin 0.4mg',               category: 'Urology',         aliases: ['tamsulosin'] },
      { name: 'Alkasol Syrup',    genericName: 'Disodium Hydrogen Citrate',       category: 'Kidney Care',     aliases: ['kidney syrup', 'alkasol'] },
    ];

    const createdMedicines = [];
    for (const med of medicinesData) {
      let existing = await Medicine.findOne({ name: med.name });
      if (!existing) existing = await Medicine.create(med);
      createdMedicines.push(existing);
    }
    console.log(`✅ ${createdMedicines.length} medicines seeded`);

    // ─────────────────────────────────────────────────────────────────────────
    // COIMBATORE PHARMACIES
    // (Real area names, real GPS coordinates in Coimbatore)
    // ─────────────────────────────────────────────────────────────────────────
    const salt = await bcrypt.genSalt(10);
    const pw = await bcrypt.hash('medical123', salt);

    const pharmaciesData = [
      {
        medicalName: 'Sri Vinayaga Medical',
        ownerName: 'Murugesan Pillai',
        email: 'srivinayaga.medical@dispharma.com',
        phone: '9842100001',
        licenseNo: 'DL-TN-CBE-10001',
        address: '12, Oppanakara Street, Coimbatore',
        pincode: '641001',
        location: { type: 'Point', coordinates: [76.9558, 11.0168] }, // RS Puram area
        website: '',
        password: pw,
        isVerified: true,
      },
      {
        medicalName: 'Annai Medicals',
        ownerName: 'Kavitha Rajan',
        email: 'annai.medicals@dispharma.com',
        phone: '9842100002',
        licenseNo: 'DL-TN-CBE-10002',
        address: '45, Gandhipuram Bus Stand Road, Coimbatore',
        pincode: '641012',
        location: { type: 'Point', coordinates: [76.9695, 11.0143] }, // Gandhipuram
        website: '',
        password: pw,
        isVerified: true,
      },
      {
        medicalName: 'Kumaran Pharmacy',
        ownerName: 'Selvaraj Krishnan',
        email: 'kumaran.pharmacy@dispharma.com',
        phone: '9842100003',
        licenseNo: 'DL-TN-CBE-10003',
        address: '8, Saibaba Colony Main Road, Coimbatore',
        pincode: '641011',
        location: { type: 'Point', coordinates: [76.9442, 11.0217] }, // Saibaba Colony
        website: 'https://kumaranpharma.in',
        password: pw,
        isVerified: true,
      },
      {
        medicalName: 'RS Puram Medical Centre',
        ownerName: 'Priya Subramaniam',
        email: 'rspuram.medical@dispharma.com',
        phone: '9842100004',
        licenseNo: 'DL-TN-CBE-10004',
        address: '3, 100 Feet Road, RS Puram, Coimbatore',
        pincode: '641002',
        location: { type: 'Point', coordinates: [76.9525, 11.0107] }, // RS Puram
        website: '',
        password: pw,
        isVerified: true,
      },
      {
        medicalName: 'Peelamedu Apollo Medical',
        ownerName: 'Arun Venkatesh',
        email: 'peelamedu.apollo@dispharma.com',
        phone: '9842100005',
        licenseNo: 'DL-TN-CBE-10005',
        address: '56, Avinashi Road, Peelamedu, Coimbatore',
        pincode: '641004',
        location: { type: 'Point', coordinates: [77.0126, 11.0273] }, // Peelamedu
        website: 'https://apollopharmacy.in',
        password: pw,
        isVerified: true,
      },
      {
        medicalName: 'Singanallur MedPlus',
        ownerName: 'Deepa Murugan',
        email: 'singanallur.medplus@dispharma.com',
        phone: '9842100006',
        licenseNo: 'DL-TN-CBE-10006',
        address: '22, Trichy Road, Singanallur, Coimbatore',
        pincode: '641005',
        location: { type: 'Point', coordinates: [77.0301, 10.9999] }, // Singanallur
        website: 'https://medplusmarts.com',
        password: pw,
        isVerified: true,
      },
      {
        medicalName: 'Ganapathy Health Pharmacy',
        ownerName: 'Babu Natarajan',
        email: 'ganapathy.health@dispharma.com',
        phone: '9842100007',
        licenseNo: 'DL-TN-CBE-10007',
        address: '17, Ganapathy Main Road, Coimbatore',
        pincode: '641006',
        location: { type: 'Point', coordinates: [76.9980, 11.0388] }, // Ganapathy
        website: '',
        password: pw,
        isVerified: true,
      },
      {
        medicalName: 'Vadavalli Wellness Medical',
        ownerName: 'Lakshmi Chandran',
        email: 'vadavalli.wellness@dispharma.com',
        phone: '9842100008',
        licenseNo: 'DL-TN-CBE-10008',
        address: '5, Vadavalli Bypass Road, Coimbatore',
        pincode: '641041',
        location: { type: 'Point', coordinates: [76.9074, 10.9948] }, // Vadavalli
        website: '',
        password: pw,
        isVerified: true,
      },
    ];

    const createdPharmacies = [];
    for (const p of pharmaciesData) {
      let existing = await User.findOne({ phone: p.phone });
      if (!existing) existing = await User.create(p);
      else {
        // Update with latest data
        Object.assign(existing, p);
        await existing.save();
        existing = await User.findOne({ phone: p.phone });
      }
      createdPharmacies.push(existing);
    }
    console.log(`✅ ${createdPharmacies.length} Coimbatore pharmacies seeded`);

    // ─────────────────────────────────────────────────────────────────────────
    // STOCK ASSIGNMENT
    // Each pharmacy gets a unique set of medicines with realistic prices.
    // No pharmacy has everything — this forces the referral system to be used.
    // ─────────────────────────────────────────────────────────────────────────

    // Helper: get medicine by name
    const med = (name) => createdMedicines.find((m) => m.name === name);

    // Clear existing stock for seeded pharmacies
    for (const ph of createdPharmacies) await Stock.deleteMany({ medicalId: ph._id });

    const stockAssignments = [
      // ── Sri Vinayaga Medical (RS Puram area) ─────────────────────────────
      {
        pharmacy: createdPharmacies[0],
        stock: [
          { med: 'Dolo 650',       qty: 200, buy: 22,  sell: 28  },
          { med: 'Combiflam',      qty: 80,  buy: 30,  sell: 38  },
          { med: 'Pantocid DSR',   qty: 60,  buy: 85,  sell: 100 },
          { med: 'Amlokind-AT',    qty: 45,  buy: 55,  sell: 68  },
          { med: 'Shelcal 500',    qty: 100, buy: 90,  sell: 110 },
          { med: 'Becosules',      qty: 120, buy: 55,  sell: 70  },
          { med: 'Allegra 120',    qty: 70,  buy: 120, sell: 145 },
          { med: 'Benadryl Cough', qty: 50,  buy: 95,  sell: 115 },
        ],
      },
      // ── Annai Medicals (Gandhipuram) ──────────────────────────────────────
      {
        pharmacy: createdPharmacies[1],
        stock: [
          { med: 'Azithral 500',   qty: 40,  buy: 95,  sell: 118 },
          { med: 'Augmentin 625',  qty: 30,  buy: 140, sell: 175 },
          { med: 'Glucophage 500', qty: 90,  buy: 35,  sell: 45  },
          { med: 'Telma 40',       qty: 65,  buy: 80,  sell: 98  },
          { med: 'Crocin Advance', qty: 180, buy: 18,  sell: 25  },
          { med: 'Gelusil MPS',    qty: 55,  buy: 65,  sell: 80  },
          { med: 'Betnovate-N',    qty: 40,  buy: 78,  sell: 95  },
          { med: 'Liv 52',         qty: 75,  buy: 135, sell: 165 },
        ],
      },
      // ── Kumaran Pharmacy (Saibaba Colony) ────────────────────────────────
      {
        pharmacy: createdPharmacies[2],
        stock: [
          { med: 'Zerodol-P',      qty: 60,  buy: 60,  sell: 75  },
          { med: 'Cifran 500',     qty: 25,  buy: 80,  sell: 100 },
          { med: 'Glimestar M2',   qty: 50,  buy: 95,  sell: 118 },
          { med: 'Cardace 5',      qty: 70,  buy: 110, sell: 135 },
          { med: 'Revital H',      qty: 60,  buy: 225, sell: 270 },
          { med: 'Sinarest',       qty: 100, buy: 28,  sell: 38  },
          { med: 'Avil 25',        qty: 80,  buy: 20,  sell: 28  },
          { med: 'Urimax 0.4',     qty: 35,  buy: 150, sell: 188 },
        ],
      },
      // ── RS Puram Medical Centre ───────────────────────────────────────────
      {
        pharmacy: createdPharmacies[3],
        stock: [
          { med: 'Dolo 650',       qty: 150, buy: 22,  sell: 28  },
          { med: 'Pantocid DSR',   qty: 45,  buy: 85,  sell: 100 },
          { med: 'Glucophage 500', qty: 60,  buy: 35,  sell: 45  },
          { med: 'Cremaffin Plus', qty: 30,  buy: 110, sell: 135 },
          { med: 'Ciplox Eye Drops', qty: 55, buy: 40, sell: 52  },
          { med: 'Udiliv 300',     qty: 20,  buy: 180, sell: 220 },
          { med: 'Alkasol Syrup',  qty: 40,  buy: 75,  sell: 92  },
          { med: 'Becosules',      qty: 90,  buy: 55,  sell: 70  },
        ],
      },
      // ── Peelamedu Apollo Medical ──────────────────────────────────────────
      {
        pharmacy: createdPharmacies[4],
        stock: [
          { med: 'Augmentin 625',  qty: 50,  buy: 140, sell: 175 },
          { med: 'Azithral 500',   qty: 35,  buy: 95,  sell: 118 },
          { med: 'Telma 40',       qty: 80,  buy: 80,  sell: 98  },
          { med: 'Amlokind-AT',    qty: 60,  buy: 55,  sell: 68  },
          { med: 'Shelcal 500',    qty: 120, buy: 90,  sell: 110 },
          { med: 'Revital H',      qty: 45,  buy: 225, sell: 270 },
          { med: 'Grilinctus BM',  qty: 55,  buy: 72,  sell: 90  },
          { med: 'Allegra 120',    qty: 60,  buy: 120, sell: 145 },
        ],
      },
      // ── Singanallur MedPlus ───────────────────────────────────────────────
      {
        pharmacy: createdPharmacies[5],
        stock: [
          { med: 'Combiflam',      qty: 120, buy: 30,  sell: 38  },
          { med: 'Cifran 500',     qty: 40,  buy: 80,  sell: 100 },
          { med: 'Zerodol-P',      qty: 75,  buy: 60,  sell: 75  },
          { med: 'Glimestar M2',   qty: 65,  buy: 95,  sell: 118 },
          { med: 'Cardace 5',      qty: 50,  buy: 110, sell: 135 },
          { med: 'Benadryl Cough', qty: 70,  buy: 95,  sell: 115 },
          { med: 'Liv 52',         qty: 80,  buy: 135, sell: 165 },
          { med: 'Betnovate-N',    qty: 30,  buy: 78,  sell: 95  },
        ],
      },
      // ── Ganapathy Health Pharmacy ─────────────────────────────────────────
      {
        pharmacy: createdPharmacies[6],
        stock: [
          { med: 'Crocin Advance', qty: 200, buy: 18,  sell: 25  },
          { med: 'Sinarest',       qty: 110, buy: 28,  sell: 38  },
          { med: 'Gelusil MPS',    qty: 65,  buy: 65,  sell: 80  },
          { med: 'Cremaffin Plus', qty: 35,  buy: 110, sell: 135 },
          { med: 'Urimax 0.4',     qty: 25,  buy: 150, sell: 188 },
          { med: 'Alkasol Syrup',  qty: 50,  buy: 75,  sell: 92  },
          { med: 'Ciplox Eye Drops', qty: 45, buy: 40, sell: 52  },
          { med: 'Avil 25',        qty: 90,  buy: 20,  sell: 28  },
        ],
      },
      // ── Vadavalli Wellness Medical ────────────────────────────────────────
      {
        pharmacy: createdPharmacies[7],
        stock: [
          { med: 'Dolo 650',       qty: 180, buy: 22,  sell: 28  },
          { med: 'Augmentin 625',  qty: 20,  buy: 140, sell: 175 },
          { med: 'Glucophage 500', qty: 70,  buy: 35,  sell: 45  },
          { med: 'Telma 40',       qty: 55,  buy: 80,  sell: 98  },
          { med: 'Udiliv 300',     qty: 30,  buy: 180, sell: 220 },
          { med: 'Grilinctus BM',  qty: 60,  buy: 72,  sell: 90  },
          { med: 'Shelcal 500',    qty: 85,  buy: 90,  sell: 110 },
          { med: 'Becosules',      qty: 110, buy: 55,  sell: 70  },
        ],
      },
    ];

    let totalStock = 0;
    for (const assignment of stockAssignments) {
      const stockDocs = assignment.stock
        .map(({ med: medName, qty, buy, sell }) => {
          const medicine = med(medName);
          if (!medicine) { console.warn(`⚠️  Medicine not found: ${medName}`); return null; }
          return {
            medicalId: assignment.pharmacy._id,
            medicineId: medicine._id,
            medicineName: medicine.name,
            quantity: qty,
            buyPrice: buy,
            sellPrice: sell,
            lastUpdated: new Date(),
          };
        })
        .filter(Boolean);

      await Stock.insertMany(stockDocs);
      totalStock += stockDocs.length;
      console.log(`  ✅ ${assignment.pharmacy.medicalName}: ${stockDocs.length} medicines`);
    }

    console.log(`\n🎉 Seeding complete!`);
    console.log(`   Medicines : ${createdMedicines.length}`);
    console.log(`   Pharmacies: ${createdPharmacies.length}`);
    console.log(`   Stock rows: ${totalStock}`);
    console.log('\n📋 Login credentials for all sample pharmacies:');
    console.log('   Password: medical123');
    pharmaciesData.forEach((p) => console.log(`   ${p.medicalName.padEnd(32)} → ${p.email}`));

    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding error:', error);
    process.exit(1);
  }
};

seedData();
