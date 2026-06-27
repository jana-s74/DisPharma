const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Stock = require('../models/Stock');
const { fetchMedicineImage } = require('../utils/aiImageFetcher');

dotenv.config({ path: '../../.env' });

const generateImages = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to DB');

    const stocks = await Stock.find({ $or: [{ imageUrl: { $exists: false } }, { imageUrl: '' }] });
    console.log(`Found ${stocks.length} stocks without images.`);

    for (let stock of stocks) {
      console.log(`Fetching image for ${stock.medicineName}...`);
      const aiImage = await fetchMedicineImage(stock.medicineName);
      if (aiImage) {
        stock.imageUrl = aiImage;
        await stock.save();
        console.log(`✅ Success: ${aiImage}`);
      } else {
        console.log(`❌ Failed: No image found for ${stock.medicineName}`);
      }
      // Small delay to prevent rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    console.log('Finished updating existing stocks!');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

generateImages();
