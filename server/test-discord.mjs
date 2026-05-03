import dotenv from 'dotenv';
dotenv.config();
import { sendWhatsAppAlert } from './lib/whatsapp.js';

console.log('DISCORD_WEBHOOK_URL:', process.env.DISCORD_WEBHOOK_URL ? 'SET ✓' : 'NOT SET ✗');

const result = await sendWhatsAppAlert(
  'TEST ORDER - SUSANTEDIT\n' +
  'Customer: Itachi Uchiha\n' +
  'Product: DRIP CLIENT - 7 Days\n' +
  'Amount: Rs 799\n' +
  'Payment: eSewa\n' +
  'TikTok: @itachi\n' +
  'WhatsApp: +977-9800000000\n' +
  'Txn: TXN123456\n' +
  'Review at: https://pannelstorewithadmin.vercel.app/admin'
);

console.log('Discord alert sent:', result ? 'YES ✓' : 'NO ✗');
process.exit(0);
