import connectDb from '../config/db.js';
import Coupon from '../models/Coupon.js';

async function main() {
  const codeArg = process.argv[2] || process.env.CODE || '';
  const code = String(codeArg || '').trim().toUpperCase();
  if (!code) {
    console.error('Usage: node scripts/checkCoupon.js <CODE>');
    process.exit(2);
  }

  await connectDb();
  const coupon = await Coupon.findOne({ code }).lean();
  if (!coupon) {
    console.log(`Coupon ${code} not found`);
    process.exit(0);
  }

  console.log('Found coupon:');
  console.log(JSON.stringify(coupon, null, 2));
  process.exit(0);
}

main().catch(err => { console.error(err); process.exit(1); });
