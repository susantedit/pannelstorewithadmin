import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    passwordHash: { type: String, select: false, default: '' },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    emailVerified: { type: Boolean, default: false },
    emailVerificationTokenHash: { type: String, select: false },
    emailVerificationExpiresAt: { type: Date },
    passwordResetTokenHash: { type: String, select: false },
    passwordResetExpiresAt: { type: Date },
    loginAttempts: { type: Number, default: 0 },
    lockUntil: { type: Date },
    lastLoginAt: { type: Date },
    firebaseUid: { type: String, default: '' },

    // Referral & wallet
    referralCode:  { type: String, default: '', unique: true, sparse: true },
    couponBalance: { type: Number, default: 0 },
    walletBalance: { type: Number, default: 0 },
    referralCount: { type: Number, default: 0 },
    referredBy:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    partnerBadge:  { type: Boolean, default: false },

    // Gamification — XP & Rank
    xp:            { type: Number, default: 0 },
    totalSpend:    { type: Number, default: 0 }, // Rs spent total (for rank)

    // Daily streak
    streakCount:   { type: Number, default: 0 },
    lastCheckIn:   { type: Date, default: null },
    streakRewardClaimed: { type: Boolean, default: false }, // for 7-day reward

    // Last order (for quick reorder)
    lastOrderProduct:  { type: String, default: '' },
    lastOrderPackage:  { type: String, default: '' },
    lastOrderPrice:    { type: String, default: '' },

    // Daily spin wheel
    lastSpinAt:        { type: Date, default: null },

    // Reactivation & birthday
    lastBirthdayCredit:  { type: Date, default: null },
    reactivationSentAt:  { type: Date, default: null },

    // VIP Subscription — Rs 199/month, hides ads
    vipExpiresAt:        { type: Date, default: null },

    // FCM push notification tokens (one per device)
    fcmTokens: { type: [String], default: [] },

    // Web Push subscriptions (VAPID — no Firebase needed)
    pushSubscriptions: {
      type: [{
        endpoint: { type: String, required: true },
        keys: {
          p256dh: { type: String, required: true },
          auth:   { type: String, required: true },
        }
      }],
      default: []
    },

    // Web Push subscriptions (VAPID — works without Firebase)
    pushSubscriptions: { type: [mongoose.Schema.Types.Mixed], default: [] },

    // Notification intelligence
    notifSentToday:    { type: Number, default: 0 },       // cooldown counter
    notifSentDate:     { type: Date, default: null },       // date of last reset
    lastNotifAt:       { type: Date, default: null },       // last notification sent
    notifRoastToday:   { type: Boolean, default: false },   // max 1 roast/day
    totalOrders:       { type: Number, default: 0 },        // for targeting
    lastActiveAt:      { type: Date, default: null },       // for inactivity detection

    // Profile fields — auto-fill purchase form
    profile: {
      uid:         { type: String, default: '' },
      gameId:      { type: String, default: '' },
      tiktok:      { type: String, default: '' },
      whatsapp:    { type: String, default: '' },
      displayName: { type: String, default: '' },
      avatarUrl:   { type: String, default: '' },
      birthday:    { type: String, default: '' } // MM-DD format
    }
  },
  { timestamps: true }
);

export default mongoose.model('User', userSchema);
