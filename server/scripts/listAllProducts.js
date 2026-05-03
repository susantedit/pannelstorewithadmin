import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import Product from '../models/Product.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../.env') });

async function listAll() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    const products = await Product.find({}).sort({ createdAt: 1 });
    
    console.log(`📦 Total Products: ${products.length}\n`);
    
    products.forEach((p, i) => {
      console.log(`${i + 1}. ${p.name}`);
      console.log(`   Price: ${p.price}`);
      console.log(`   Category: ${p.category}`);
      console.log(`   Status: ${p.status}`);
      console.log(`   Packages: ${p.packages?.length || 0}`);
      if (p.packages && p.packages.length > 0) {
        p.packages.forEach(pkg => {
          console.log(`      - ${pkg.label}: Rs ${pkg.price}`);
        });
      }
      console.log('');
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

listAll();
