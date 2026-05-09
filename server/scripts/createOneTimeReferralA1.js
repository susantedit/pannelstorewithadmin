import connectDb from '../config/db.js';
import Coupon from '../models/Coupon.js';

async function main() {
  await connectDb();

  const code = 'A1';
  const norm = String(code || '').trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '');

  const existing = await Coupon.findOne({ code: norm }).lean();
  if (existing) {
    console.log(`Coupon ${norm} already exists:`);
    console.log(existing);
    process.exit(0);
  }

  const coupon = new Coupon({
    code: norm,
    type: 'referral',
    discountKind: 'flat',
    discountValue: 0,
    rewardAmount: 30,
    usageLimit: 1,
    active: true,
    note: 'One-time referral created via script'
  });

  await coupon.save();
  console.log('Created coupon:', coupon);
  process.exit(0);
}

main().catch(err => {
  console.error('Failed to create coupon:', err);
  process.exit(1);
});
