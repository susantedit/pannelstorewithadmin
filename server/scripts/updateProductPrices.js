import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import Product from '../models/Product.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../.env') });

const updatedProducts = [
  {
    name: 'DRIP CLINT (ROOT)',
    price: 'Rs 200',
    packages: [
      { label: '1 Day', price: '200', originalPrice: '' },
      { label: '7 Days', price: '590', originalPrice: '' },
      { label: '30 Days', price: '1120', originalPrice: '' }
    ]
  },
  {
    name: 'DRIP CLINT (PC)',
    price: 'Rs 230',
    packages: [
      { label: '1 Day', price: '230', originalPrice: '' },
      { label: '7 Days', price: '690', originalPrice: '' },
      { label: '15 Days', price: '940', originalPrice: '' },
      { label: '30 Days', price: '1490', originalPrice: '' }
    ]
  },
  {
    name: 'HG CHEATS (ROOT)',
    price: 'Rs 160',
    packages: [
      { label: '1 Day', price: '160', originalPrice: '' },
      { label: '7 Days', price: '390', originalPrice: '' },
      { label: '10 Days', price: '490', originalPrice: '' },
      { label: '30 Days', price: '790', originalPrice: '' }
    ]
  },
  {
    name: 'BR MOD ROOT',
    price: 'Rs 180',
    packages: [
      { label: '1 Day', price: '180', originalPrice: '' },
      { label: '7 Days', price: '490', originalPrice: '' },
      { label: '15 Days', price: '790', originalPrice: '' },
      { label: '30 Days', price: '1290', originalPrice: '' }
    ]
  },
  {
    name: 'BR MOD PC',
    price: 'Rs 210',
    packages: [
      { label: '1 Day', price: '210', originalPrice: '' },
      { label: '10 Days', price: '690', originalPrice: '' },
      { label: '30 Days', price: '1290', originalPrice: '' },
      { label: '1 Day (BYPASS + AIM SILENT)', price: '280', originalPrice: '' },
      { label: '10 Days (BYPASS + AIM SILENT)', price: '790', originalPrice: '' },
      { label: '30 Days (BYPASS + AIM SILENT)', price: '1490', originalPrice: '' }
    ]
  }
];

async function updatePrices() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    for (const productData of updatedProducts) {
      const result = await Product.findOneAndUpdate(
        { name: productData.name },
        { 
          price: productData.price,
          packages: productData.packages 
        },
        { new: true }
      );

      if (result) {
        console.log(`✅ Updated prices for: ${productData.name}`);
      } else {
        console.log(`⚠️  Product "${productData.name}" not found`);
      }
    }

    console.log('\n🎉 Price update completed!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error updating prices:', error);
    process.exit(1);
  }
}

updatePrices();
