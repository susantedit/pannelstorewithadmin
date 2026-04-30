import mongoose from 'mongoose';

const couponSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true, index: true },
    ownerUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null, index: true },
    createdByUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    type: { type: String, enum: ['referral', 'promo'], default: 'promo' },
    discountKind: { type: String, enum: ['flat', 'percent'], default: 'flat' },
    discountValue: { type: Number, default: 30 },
    rewardAmount: { type: Number, default: 30 },
    active: { type: Boolean, default: true },
    startsAt: { type: Date, default: null },
    endsAt: { type: Date, default: null },
    usageLimit: { type: Number, default: 0 },
    usedCount: { type: Number, default: 0 },
    note: { type: String, default: '' }
  },
  { timestamps: true }
);

export default mongoose.model('Coupon', couponSchema);
