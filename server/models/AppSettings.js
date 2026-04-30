import mongoose from 'mongoose';

// Singleton settings document — only one record ever exists
const appSettingsSchema = new mongoose.Schema({
  // Branding
  appName:      { type: String, default: 'SUSANTEDIT' },
  appTagline:   { type: String, default: 'Premium Gaming Services' },
  announcement: { type: String, default: '' }, // banner shown to all users

  // Form field labels (admin can rename these)
  labels: {
    fullName:    { type: String, default: 'Full Name' },
    tiktok:      { type: String, default: 'TikTok Handle' },
    whatsapp:    { type: String, default: 'WhatsApp Number' },
    transaction: { type: String, default: 'Transaction Number' },
  },

  // Payment window message
  paymentWindow: { type: String, default: 'Payment Time: 8AM - 10PM' },

  // Contact info shown to users
  contactWhatsApp: { type: String, default: '' },
  contactTelegram: { type: String, default: '' },

  // Payment QR images (base64 or URL)
  qrEsewa: { type: String, default: '' },
  qrBank:  { type: String, default: '' },
}, { timestamps: true });

export default mongoose.model('AppSettings', appSettingsSchema);
