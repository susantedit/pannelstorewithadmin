import mongoose from 'mongoose';

const requestSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    userName: { type: String, required: true },
    tikTok: { type: String, default: '' },
    whatsapp: { type: String, default: '' },
    transaction: { type: String, default: '' },
    product: { type: String, required: true },
    packageName: { type: String, default: '' },
    packagePrice: { type: String, default: '' },
    couponCode: { type: String, default: '' },
    couponType: { type: String, enum: ['referral', 'promo', ''], default: '' },
    couponDiscountKind: { type: String, enum: ['flat', 'percent', ''], default: '' },
    couponDiscountValue: { type: Number, default: 0 },
    discountAmount: { type: Number, default: 0 },
    finalPrice: { type: Number, default: 0 },
    couponOwnerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    referralRewardAmount: { type: Number, default: 0 },
    couponRewardedAt: { type: Date, default: null },
    paymentMethod: { type: String, enum: ['bank', 'esewa'], default: 'bank' },
    status: { type: String, default: 'Awaiting review' },
    notes: { type: String, default: '' },
    lastPingAt: { type: Date, default: Date.now },
    // Payment window expiry (2 hours from creation)
    expiryTime: { type: Date, default: null },
    // Gift fields
    isGift:       { type: Boolean, default: false },
    giftSenderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    giftFrom:     { type: String, default: '' },
    giftMessage:  { type: String, default: '' },

    // Order chat messages
    messages: {
      type: [{
        from:      { type: String, enum: ['user', 'admin'], required: true },
        text:      { type: String, required: true },
        createdAt: { type: Date, default: Date.now }
      }],
      default: []
    }
  },
  { timestamps: true }
);

export default mongoose.model('Request', requestSchema);
