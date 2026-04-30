/**
 * Usage:
 *   node server/scripts/makeAdmin.js your@gmail.com
 *
 * Promotes the given email to admin role in MongoDB.
 * Run this AFTER the user has signed in at least once (so the account exists).
 */

import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { fileURLToPath } from 'url';
import path from 'path';

// Load .env from server/
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const email = process.argv[2]?.trim().toLowerCase();
if (!email) {
  console.error('Usage: node server/scripts/makeAdmin.js your@email.com');
  process.exit(1);
}

const uri = process.env.MONGO_URI;
if (!uri) {
  console.error('MONGO_URI not set in server/.env');
  process.exit(1);
}

await mongoose.connect(uri, { serverSelectionTimeoutMS: 8000 });

const User = (await import('../models/User.js')).default;

const user = await User.findOneAndUpdate(
  { email },
  { role: 'admin' },
  { new: true }
);

if (!user) {
  console.error(`No user found with email: ${email}`);
  console.error('Sign in with Google first, then run this script.');
  process.exit(1);
}

console.log(`✅ ${user.email} is now admin (id: ${user._id})`);
await mongoose.disconnect();
