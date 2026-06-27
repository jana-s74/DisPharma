/**
 * aiImageFetcher.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Returns a local category-based medicine image path based on the medicine name.
 * Images are stored in /uploads/medicines/ and served statically.
 *
 * For medicines not in the map, falls back to a generic medicine image.
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');

const { GoogleGenAI } = require('@google/genai');
const fs = require('fs');
const path = require('path');

// Medicine name → category image (exact match first, then keyword match)
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

/**
 * Saves base64 image data to a file
 */
const saveBinaryFile = (fileName, base64Data) => {
  const uploadsDir = path.join(__dirname, '..', 'uploads', 'medicines');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
  const filePath = path.join(uploadsDir, fileName);
  fs.writeFileSync(filePath, Buffer.from(base64Data, 'base64'));
  return `/uploads/medicines/${fileName}`;
};

/**
 * Returns a local image path for a given medicine name.
 * Tries exact keyword match (lowercased), then uses Gemini Image Generation, then falls back to generic.
 *
 * @param {string} medicineName
 * @returns {string} Always returns a valid image path
 */
const fetchMedicineImage = async (medicineName) => {
  try {
    const lower = (medicineName || '').toLowerCase();

    // 1. Check each keyword (fast local mapping)
    for (const [keyword, imagePath] of Object.entries(MEDICINE_IMAGE_MAP)) {
      if (lower.includes(keyword)) {
        return imagePath;
      }
    }

    // 2. Use Gemini AI to GENERATE an image for the medicine
    if (process.env.GEMINI_API_KEY) {
      try {
        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
        console.log(`[Gemini AI] Generating image for "${medicineName}"...`);
        
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: `A highly realistic, professional product photo of a medicine box or bottle named "${medicineName}". Clean white background, minimalist clinical look, 4k resolution.`,
          config: {
            responseModalities: ["IMAGE"]
          }
        });

        const candidates = response.candidates;
        if (candidates && candidates.length > 0) {
          const parts = candidates[0].content?.parts;
          if (parts && parts.length > 0 && parts[0].inlineData) {
            const inlineData = parts[0].inlineData;
            if (inlineData.data) {
              const fileName = `generated_${Date.now()}_${Math.floor(Math.random() * 1000)}.png`;
              const publicPath = saveBinaryFile(fileName, inlineData.data);
              console.log(`[Gemini AI] Successfully generated and saved image for "${medicineName}" -> ${publicPath}`);
              return publicPath;
            }
          }
        }
      } catch (aiError) {
        console.error(`Gemini Image Generation error for ${medicineName}:`, aiError.message);
      }
    }

    // 3. Default fallback — fever/pain image (most common)
    return '/uploads/medicines/fever_pain.png';
  } catch (error) {
    console.error(`Image fetch error for ${medicineName}:`, error.message);
    return '/uploads/medicines/fever_pain.png';
  }
};

module.exports = { fetchMedicineImage };
