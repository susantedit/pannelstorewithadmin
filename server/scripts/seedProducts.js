import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import Product from '../models/Product.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../.env') });

const products = [
  {
    name: 'DRIP CLINT (ROOT)',
    category: 'Digital key',
    price: 'Rs 170',
    status: 'Available',
    description: 'ROOT DEVICE Support',
    img: 'https://i.postimg.cc/Jnwh1T2q/Screenshot-20260421-102516.jpg',
    packages: [
      { label: '1 Day', price: '170', originalPrice: '' },
      { label: '7 Days', price: '550', originalPrice: '' },
      { label: '30 Days', price: '1080', originalPrice: '' }
    ]
  },
  {
    name: 'DRIP CLINT (PC)',
    category: 'Digital key',
    price: 'Rs 200',
    status: 'Available',
    description: 'PC EMULATOR Support',
    img: 'https://i.postimg.cc/Jnwh1T2q/Screenshot-20260421-102516.jpg',
    packages: [
      { label: '1 Day', price: '200', originalPrice: '' },
      { label: '7 Days', price: '650', originalPrice: '' },
      { label: '15 Days', price: '900', originalPrice: '' },
      { label: '30 Days', price: '1450', originalPrice: '' }
    ]
  },
  {
    name: 'HG CHEATS (ROOT)',
    category: 'Digital key',
    price: 'Rs 130',
    status: 'Available',
    description: 'ROOT APK',
    img: 'https://i.postimg.cc/fRGsXVfy/Screenshot-20260421-102611.jpg',
    packages: [
      { label: '1 Day', price: '130', originalPrice: '' },
      { label: '7 Days', price: '350', originalPrice: '' },
      { label: '10 Days', price: '450', originalPrice: '' },
      { label: '30 Days', price: '750', originalPrice: '' }
    ]
  },
  {
    name: 'BR MOD ROOT',
    category: 'Digital key',
    price: 'Rs 150',
    status: 'Available',
    description: 'ROOT APK MAIN ID SAFE',
    img: 'https://i.postimg.cc/65Fdfcgp/Screenshot-20260425-150006.jpg',
    packages: [
      { label: '1 Day', price: '150', originalPrice: '' },
      { label: '7 Days', price: '450', originalPrice: '' },
      { label: '15 Days', price: '750', originalPrice: '' },
      { label: '30 Days', price: '1250', originalPrice: '' }
    ]
  },
  {
    name: 'BR MOD PC',
    category: 'Digital key',
    price: 'Rs 180',
    status: 'Available',
    description: 'PC EMULATOR SAFE',
    img: 'https://i.postimg.cc/65Fdfcgp/Screenshot-20260425-150006.jpg',
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

async function seedProducts() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Check if products already exist
    for (const productData of products) {
      const existing = await Product.findOne({ name: productData.name });
      if (existing) {
        console.log(`⚠️  Product "${productData.name}" already exists, skipping...`);
        continue;
      }

      const product = new Product(productData);
      await product.save();
      console.log(`✅ Added product: ${productData.name}`);
    }

    console.log('\n🎉 Product seeding completed!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding products:', error);
    process.exit(1);
  }
}

seedProducts();
