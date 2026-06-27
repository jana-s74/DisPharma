const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../../.env') });

const Medicine = require('../models/Medicine');

const medicines = [
  { name: 'Dolo 650', genericName: 'Paracetamol', category: 'Analgesic/Antipyretic', aliases: ['dolo', 'paracetamol 650'] },
  { name: 'Crocin 500', genericName: 'Paracetamol', category: 'Analgesic/Antipyretic', aliases: ['crocin', 'paracetamol 500'] },
  { name: 'Pan D', genericName: 'Pantoprazole + Domperidone', category: 'Antacid', aliases: ['pan d', 'pantoprazole domperidone'] },
  { name: 'Augmentin 625', genericName: 'Amoxicillin + Clavulanate', category: 'Antibiotic', aliases: ['augmentin', 'amoxicillin clavulanate'] },
  { name: 'Azithromycin 500', genericName: 'Azithromycin', category: 'Antibiotic', aliases: ['azithromycin', 'azee 500', 'zithromax'] },
  { name: 'Metformin 500', genericName: 'Metformin', category: 'Antidiabetic', aliases: ['metformin', 'glycomet'] },
  { name: 'Atorvastatin 10', genericName: 'Atorvastatin', category: 'Statin', aliases: ['atorvastatin', 'lipitor'] },
  { name: 'Cetirizine 10', genericName: 'Cetirizine', category: 'Antihistamine', aliases: ['cetirizine', 'zyrtec', 'cetz'] },
  { name: 'Pantoprazole 40', genericName: 'Pantoprazole', category: 'Antacid/PPI', aliases: ['pantoprazole', 'pan 40', 'pantocid'] },
  { name: 'Amoxicillin 500', genericName: 'Amoxicillin', category: 'Antibiotic', aliases: ['amoxicillin', 'amoxil', 'mox'] },
  { name: 'Ibuprofen 400', genericName: 'Ibuprofen', category: 'NSAID', aliases: ['ibuprofen', 'brufen', 'combiflam'] },
  { name: 'Paracetamol 500', genericName: 'Paracetamol', category: 'Analgesic/Antipyretic', aliases: ['paracetamol', 'calpol'] },
  { name: 'Omeprazole 20', genericName: 'Omeprazole', category: 'Antacid/PPI', aliases: ['omeprazole', 'omez', 'prilosec'] },
  { name: 'Vitamin C 500', genericName: 'Ascorbic Acid', category: 'Vitamin', aliases: ['vitamin c', 'ascorbic acid', 'celin'] },
  { name: 'Vitamin D3', genericName: 'Cholecalciferol', category: 'Vitamin', aliases: ['vitamin d3', 'cholecalciferol', 'd3'] },
  { name: 'Calcium 500', genericName: 'Calcium Carbonate', category: 'Mineral Supplement', aliases: ['calcium', 'shelcal', 'calcit'] },
  { name: 'Ranitidine 150', genericName: 'Ranitidine', category: 'Antacid/H2 Blocker', aliases: ['ranitidine', 'rantac', 'zantac'] },
  { name: 'Levocetirizine 5', genericName: 'Levocetirizine', category: 'Antihistamine', aliases: ['levocetirizine', 'levocet', 'xyzal'] },
  { name: 'Montelukast 10', genericName: 'Montelukast', category: 'Antiasthmatic', aliases: ['montelukast', 'singulair', 'montair'] },
  { name: 'B-Complex Tablets', genericName: 'Vitamin B Complex', category: 'Vitamin', aliases: ['b complex', 'becosules', 'bcomplex'] },
];

const seedMedicines = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    await Medicine.deleteMany({});
    console.log('🗑️  Cleared existing medicines');

    const inserted = await Medicine.insertMany(medicines);
    console.log(`✅ Seeded ${inserted.length} medicines successfully`);

    console.log('\nMedicines seeded:');
    inserted.forEach((m, i) => console.log(`  ${i + 1}. ${m.name} (${m.category})`));

    process.exit(0);
  } catch (error) {
    console.error('❌ Seed error:', error);
    process.exit(1);
  }
};

seedMedicines();
