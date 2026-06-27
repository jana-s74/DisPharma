const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.join(__dirname, '../../.env') });

const Stock = require('../models/Stock');

const MEDICINE_IMAGE_MAP = {
  // Fever / Pain
  'dolo':          '/uploads/medicines/fever_pain.png',
  'combiflam':     '/uploads/medicines/fever_pain.png',
  'crocin':        '/uploads/medicines/fever_pain.png',
  'zerodol':       '/uploads/medicines/fever_pain.png',
  'paracetamol':   '/uploads/medicines/fever_pain.png',
  'ibuprofen':     '/uploads/medicines/fever_pain.png',
  'aceclofenac':   '/uploads/medicines/fever_pain.png',

  // Antibiotic
  'azithral':      '/uploads/medicines/antibiotic.png',
  'augmentin':     '/uploads/medicines/antibiotic.png',
  'cifran':        '/uploads/medicines/antibiotic.png',
  'azithromycin':  '/uploads/medicines/antibiotic.png',
  'amoxicillin':   '/uploads/medicines/antibiotic.png',
  'ciprofloxacin': '/uploads/medicines/antibiotic.png',
  'antibiotic':    '/uploads/medicines/antibiotic.png',

  // Acidity / Gastro
  'pantocid':      '/uploads/medicines/acidity_gastro.png',
  'gelusil':       '/uploads/medicines/acidity_gastro.png',
  'cremaffin':     '/uploads/medicines/acidity_gastro.png',
  'pantoprazole':  '/uploads/medicines/acidity_gastro.png',
  'antacid':       '/uploads/medicines/acidity_gastro.png',
  'omeprazole':    '/uploads/medicines/acidity_gastro.png',
  'pan d':         '/uploads/medicines/acidity_gastro.png',
  'ranitidine':    '/uploads/medicines/acidity_gastro.png',

  // Blood Pressure / Heart
  'amlokind':      '/uploads/medicines/bp_heart.png',
  'telma':         '/uploads/medicines/bp_heart.png',
  'cardace':       '/uploads/medicines/bp_heart.png',
  'amlodipine':    '/uploads/medicines/bp_heart.png',
  'telmisartan':   '/uploads/medicines/bp_heart.png',
  'ramipril':      '/uploads/medicines/bp_heart.png',
  'atenolol':      '/uploads/medicines/bp_heart.png',
  'atorvastatin':  '/uploads/medicines/bp_heart.png',
  'rosuvastatin':  '/uploads/medicines/bp_heart.png',

  // Diabetes
  'glucophage':    '/uploads/medicines/diabetes.png',
  'glimestar':     '/uploads/medicines/diabetes.png',
  'metformin':     '/uploads/medicines/diabetes.png',
  'glimepiride':   '/uploads/medicines/diabetes.png',
  'insulin':       '/uploads/medicines/diabetes.png',

  // Cough / Cold / Asthma
  'benadryl':      '/uploads/medicines/cough_cold.png',
  'sinarest':      '/uploads/medicines/cough_cold.png',
  'grilinctus':    '/uploads/medicines/cough_cold.png',
  'cough':         '/uploads/medicines/cough_cold.png',
  'cold':          '/uploads/medicines/cough_cold.png',
  'syrup':         '/uploads/medicines/cough_cold.png',
  'bromhexine':    '/uploads/medicines/cough_cold.png',
  'montelukast':   '/uploads/medicines/cough_cold.png',

  // Vitamins / Supplements
  'shelcal':       '/uploads/medicines/vitamins.png',
  'becosules':     '/uploads/medicines/vitamins.png',
  'revital':       '/uploads/medicines/vitamins.png',
  'calcium':       '/uploads/medicines/vitamins.png',
  'vitamin':       '/uploads/medicines/vitamins.png',
  'multivitamin':  '/uploads/medicines/vitamins.png',
  'b-complex':     '/uploads/medicines/vitamins.png',

  // Skin / Eye / Allergy
  'betnovate':     '/uploads/medicines/skin_eye_allergy.png',
  'ciplox':        '/uploads/medicines/skin_eye_allergy.png',
  'allegra':       '/uploads/medicines/skin_eye_allergy.png',
  'avil':          '/uploads/medicines/skin_eye_allergy.png',
  'cream':         '/uploads/medicines/skin_eye_allergy.png',
  'eye drop':      '/uploads/medicines/skin_eye_allergy.png',
  'fexofenadine':  '/uploads/medicines/skin_eye_allergy.png',
  'allergy':       '/uploads/medicines/skin_eye_allergy.png',
  'cetirizine':    '/uploads/medicines/skin_eye_allergy.png',
  'levocetirizine':'/uploads/medicines/skin_eye_allergy.png',

  // Liver / Kidney / Urology
  'liv 52':        '/uploads/medicines/liver_kidney.png',
  'udiliv':        '/uploads/medicines/liver_kidney.png',
  'urimax':        '/uploads/medicines/liver_kidney.png',
  'alkasol':       '/uploads/medicines/liver_kidney.png',
  'liver':         '/uploads/medicines/liver_kidney.png',
  'kidney':        '/uploads/medicines/liver_kidney.png',
  'tamsulosin':    '/uploads/medicines/liver_kidney.png',
};

const getLocalImage = (name) => {
  const lower = (name || '').toLowerCase();
  for (const [keyword, imagePath] of Object.entries(MEDICINE_IMAGE_MAP)) {
    if (lower.includes(keyword)) {
      return imagePath;
    }
  }
  return '/uploads/medicines/fever_pain.png';
};

const updateImages = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to DB');

    const stocks = await Stock.find({});
    let updated = 0;

    for (const stock of stocks) {
      const img = getLocalImage(stock.medicineName);
      if (stock.imageUrl !== img) {
        stock.imageUrl = img;
        await stock.save();
        updated++;
      }
    }

    console.log(`Updated ${updated} stock items with images.`);
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
};

updateImages();
