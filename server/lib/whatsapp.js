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

// ── Discord ───────────────────────────────────────────────────────────────────
async function sendDiscord(message) {
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
  if (!webhookUrl) return false;

  try {
    const res = await fetch(webhookUrl, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({
        username:   'SUSANTEDIT Orders',
        avatar_url: 'https://pannelstorewithadmin.vercel.app/logo.png',
        embeds: [{
          title:       '🛒 New Order',
          description: message,
          color:       0xe63946, // red
          timestamp:   new Date().toISOString(),
          footer:      { text: 'SUSANTEDIT Admin Alert' },
        }],
      }),
      signal: AbortSignal.timeout(8000),
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

// ── Main export — tries Discord first, then Telegram ─────────────────────────
export async function sendWhatsAppAlert(message) {
  const hasDiscord  = !!process.env.DISCORD_WEBHOOK_URL;
  const hasTelegram = !!(process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID);

  if (!hasDiscord && !hasTelegram) {
    console.log('[Alert] No alert channel configured. Add DISCORD_WEBHOOK_URL or TELEGRAM_BOT_TOKEN + TELEGRAM_CHAT_ID to .env');
    return false;
  }

  // Send to all configured channels simultaneously
  const results = await Promise.allSettled([
    hasDiscord  ? sendDiscord(message)  : Promise.resolve(false),
    hasTelegram ? sendTelegram(message) : Promise.resolve(false),
  ]);

  return results.some(r => r.value === true);
}
