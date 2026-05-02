import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: { type: String, enum: ['info', 'success', 'warning', 'error', 'key', 'xp'], default: 'info' },
    read: { type: Boolean, default: false },
    readAt: { type: Date, default: null },
    
    // Admin notification fields
    fromAdmin: { type: Boolean, default: false },
    adminId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    
    // Related data
    relatedType: { type: String, enum: ['request', 'xp', 'system', 'custom'], default: 'system' },
    relatedId: { type: mongoose.Schema.Types.ObjectId, default: null },
    
    // Metadata
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
    
    // Expiry for cleanup
    expiresAt: { type: Date, default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) } // 30 days
  },
  { timestamps: true }
);

// Index for efficient queries
notificationSchema.index({ userId: 1, read: 1, createdAt: -1 });
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model('Notification', notificationSchema);