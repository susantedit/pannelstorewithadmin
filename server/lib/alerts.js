/**
 * Admin order alerts — supports Discord Webhook + Telegram Bot
 * Both are 100% free forever.
 *
 * ── DISCORD (easiest — 30 seconds) ──────────────────────────────────────────
 * 1. Discord → your server → channel gear ⚙️ → Integrations → Webhooks → New Webhook → Copy URL
 * 2. Add to server/.env:
 *    DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/xxx/yyy
 *
 * ── TELEGRAM (also free) ────────────────────────────────────────────────────
 * 1. Telegram → @BotFather → /newbot → get token
 * 2. Start your bot, send it a message
 * 3. Open https://api.telegram.org/bot<TOKEN>/getUpdates → find chat "id"
 * 4. Add to server/.env:
 *    TELEGRAM_BOT_TOKEN=7123456789:AAFxxx...
 *    TELEGRAM_CHAT_ID=123456789
 *
 * If both are configured, both get the alert.
 */

// ── Discord (Elite Embed) ─────────────────────────────────────────────────────
async function sendDiscord(payload) {
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
  if (!webhookUrl) return false;

  try {
    const body = typeof payload === 'string'
      ? { username: 'SUSANTEDIT Orders', avatar_url: 'https://pannelstorewithadmin.vercel.app/logo.png', content: payload }
      : { username: 'SUSANTEDIT Orders', avatar_url: 'https://pannelstorewithadmin.vercel.app/logo.png', ...payload };

    const res = await fetch(webhookUrl, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(body),
      signal:  AbortSignal.timeout(8000),
    });

    if (res.ok || res.status === 204) {
      console.log('[Alert] Discord notification sent');
      return true;
    }
    const text = await res.text();
    console.warn('[Alert] Discord error:', res.status, text.slice(0, 100));
    return false;
  } catch (e) {
    console.warn('[Alert] Discord failed:', e.message);
    return false;
  }
}

// ── Telegram ──────────────────────────────────────────────────────────────────
async function sendTelegram(message) {
  const token  = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return false;

  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ chat_id: chatId, text: message, parse_mode: 'HTML' }),
      signal:  AbortSignal.timeout(8000),
    });
    const data = await res.json();
    if (data?.ok) {
      console.log('[Alert] Telegram notification sent');
      return true;
    }
    console.warn('[Alert] Telegram error:', data?.description);
    return false;
  } catch (e) {
    console.warn('[Alert] Telegram failed:', e.message);
    return false;
  }
}

/**
 * Build an elite Discord embed payload for a new order.
 * Returns the full webhook body object (pass directly to sendDiscord).
 */
export function buildOrderEmbed({ userName, product, packageName, price, paymentMethod, tikTok, whatsapp, transaction }) {
  const method = paymentMethod === 'esewa' ? 'eSewa' : 'Bank';
  const productLabel = packageName ? `${product} (${packageName})` : product;
  const waLink = whatsapp ? `[WhatsApp](https://wa.me/${whatsapp.replace(/[^0-9]/g, '')})` : whatsapp;

  return {
    embeds: [{
      title:       '🚀 NEW ORDER — SUSANTEDIT',
      color:       0x5865F2, // Discord blurple — stands out in dark mode
      timestamp:   new Date().toISOString(),
      fields: [
        // ── Order Info ──
        { name: '👤 Customer',  value: `\`${userName}\``,      inline: true  },
        { name: '📦 Product',   value: `\`${productLabel}\``,  inline: true  },
        { name: '💰 Amount',    value: `\`Rs ${price}\``,       inline: true  },
        { name: '💳 Payment',   value: `\`${method}\``,         inline: true  },
        { name: '🆔 Txn ID',    value: `\`${transaction}\``,    inline: true  },
        // ── Contact Info ──
        { name: '📱 Contact',   value: waLink || '—',           inline: true  },
        { name: '🎵 TikTok',    value: tikTok  || '—',          inline: true  },
        // ── Admin Action ──
        {
          name:   '⚡ ADMIN ACTION',
          value:  '[👉 Open Admin Panel](https://pannelstorewithadmin.vercel.app/admin)',
          inline: false,
        },
      ],
      footer: { text: '⏱️ Status: PENDING APPROVAL  •  SUSANTEDIT' },
    }],
  };
}

/**
 * Build a Telegram-formatted message for a new order.
 */
export function buildOrderTelegramMessage({ userName, product, packageName, price, paymentMethod, tikTok, whatsapp, transaction }) {
  const method = paymentMethod === 'esewa' ? 'eSewa' : 'Bank';
  const productLabel = packageName ? `${product} (${packageName})` : product;
  return (
    `🚀 <b>NEW ORDER — SUSANTEDIT</b>\n` +
    `━━━━━━━━━━━━━━━━━━━━━━\n` +
    `👤 <b>Customer:</b> <code>${userName}</code>\n` +
    `📦 <b>Product:</b>  <code>${productLabel}</code>\n` +
    `💰 <b>Amount:</b>   <code>Rs ${price}</code>\n` +
    `💳 <b>Payment:</b>  <code>${method}</code>\n` +
    `━━━━━━━━━━━━━━━━━━━━━━\n` +
    `📱 <b>WhatsApp:</b> ${whatsapp || '—'}\n` +
    `🎵 <b>TikTok:</b>   ${tikTok || '—'}\n` +
    `🆔 <b>Txn ID:</b>   <code>${transaction}</code>\n` +
    `━━━━━━━━━━━━━━━━━━━━━━\n` +
    `⚡ <b>ADMIN ACTION:</b>\n` +
    `👉 https://pannelstorewithadmin.vercel.app/admin\n` +
    `⏱️ <b>Status:</b> PENDING APPROVAL`
  );
}

// ── Main export ───────────────────────────────────────────────────────────────
/**
 * sendDiscordAlert — sends an order alert to all configured channels.
 * Pass an order data object for rich embeds, or a plain string for a simple message.
 *
 * @param {object|string} orderData  Order fields object (preferred) or raw string
 */
export async function sendDiscordAlert(orderData) {
  const hasDiscord  = !!process.env.DISCORD_WEBHOOK_URL;
  const hasTelegram = !!(process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID);

  if (!hasDiscord && !hasTelegram) {
    console.log('[Alert] No alert channel configured. Add DISCORD_WEBHOOK_URL or TELEGRAM_BOT_TOKEN + TELEGRAM_CHAT_ID to .env');
    return false;
  }

  const discordPayload = typeof orderData === 'string' ? orderData : buildOrderEmbed(orderData);
  const telegramMessage = typeof orderData === 'string' ? orderData : buildOrderTelegramMessage(orderData);

  const results = await Promise.allSettled([
    hasDiscord  ? sendDiscord(discordPayload)      : Promise.resolve(false),
    hasTelegram ? sendTelegram(telegramMessage)    : Promise.resolve(false),
  ]);

  return results.some(r => r.value === true);
}

// ── Legacy alias — keeps old imports working during migration ─────────────────
/** @deprecated Use sendDiscordAlert instead */
export const sendWhatsAppAlert = sendDiscordAlert;
