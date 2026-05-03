import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import Product from '../models/Product.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../.env') });

// Restore old products to original prices
const restoreProducts = [
  {
    name: 'DRIP CLINT (ROOT)',
    price: 'Rs 170',
    packages: [
      { label: '1 Day', price: '170', originalPrice: '' },
      { label: '7 Days', price: '550', originalPrice: '' },
      { label: '30 Days', price: '1080', originalPrice: '' }
    ]
  },
  {
    name: 'DRIP CLINT (PC)',
    price: 'Rs 200',
    packages: [
      { label: '1 Day', price: '200', originalPrice: '' },
      { label: '7 Days', price: '650', originalPrice: '' },
      { label: '15 Days', price: '900', originalPrice: '' },
      { label: '30 Days', price: '1450', originalPrice: '' }
    ]
  },
  {
    name: 'HG CHEATS (ROOT)',
    price: 'Rs 130',
    packages: [
      { label: '1 Day', price: '130', originalPrice: '' },
      { label: '7 Days', price: '350', originalPrice: '' },
      { label: '10 Days', price: '450', originalPrice: '' },
      { label: '30 Days', price: '750', originalPrice: '' }
    ]
  },
  {
    name: 'BR MOD ROOT',
    price: 'Rs 150',
    packages: [
      { label: '1 Day', price: '150', originalPrice: '' },
      { label: '7 Days', price: '450', originalPrice: '' },
      { label: '15 Days', price: '750', originalPrice: '' },
      { label: '30 Days', price: '1250', originalPrice: '' }
    ]
  },
  {
    name: 'BR MOD PC',
    price: 'Rs 180',
    packages: [
      { label: '1 Day', price: '180', originalPrice: '' },
      { label: '10 Days', price: '650', originalPrice: '' },
      { label: '30 Days', price: '1250', originalPrice: '' },
      { label: '1 Day (BYPASS + AIM SILENT)', price: '250', originalPrice: '' },
      { label: '10 Days (BYPASS + AIM SILENT)', price: '750', originalPrice: '' },
      { label: '30 Days (BYPASS + AIM SILENT)', price: '1450', originalPrice: '' }
    ]
  }
];

async function restoreAndAdd() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Restore old products to original prices
    console.log('\n📦 Restoring old products to original prices...');
    for (const productData of restoreProducts) {
      const result = await Product.findOneAndUpdate(
        { name: productData.name },
        { 
          price: productData.price,
          packages: productData.packages 
        },
        { new: true }
      );

      if (result) {
        console.log(`✅ Restored: ${productData.name} to original price`);
      }
    }

    console.log('\n🎉 All products restored to original prices!');
    console.log('Old products are back with their original pricing.');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

restoreAndAdd();
