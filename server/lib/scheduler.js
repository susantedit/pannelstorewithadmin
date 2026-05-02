/**
 * Automatic scheduled notifications
 * Runs inside the Express server — no external cron service needed.
 * Works on Render free tier (as long as server is awake via keepalive ping).
 *
 * Schedule format: { hour, minute } in 24h UTC
 * Render servers run in UTC. Nepal is UTC+5:45, so:
 *   NPT 6:00 AM  = UTC 00:15
 *   NPT 10:00 AM = UTC 04:15
 *   NPT 6:00 PM  = UTC 12:15
 *   NPT 9:00 PM  = UTC 15:15
 */

import User from '../models/User.js';
import { createNotification } from '../controllers/notificationController.js';
import { broadcastPush } from './fcm.js';

// ── Scheduled notification templates ─────────────────────────────────────────
// Add your own ideas here — each entry fires once per day at the given UTC time.
// hour/minute = UTC time. dayOfWeek = 0 (Sun) to 6 (Sat), null = every day.

const SCHEDULED_NOTIFICATIONS = [
  // Morning check-in reminder — 6:15 AM NPT (00:30 UTC)
  {
    id: 'morning-checkin',
    hour: 0, minute: 30,
    dayOfWeek: null, // every day
    title: 'Daily Check-In Available',
    message: 'Your daily check-in is ready. Log in now to earn XP and keep your streak alive.',
    type: 'info',
  },

  // Flash sale tease — 10:15 AM NPT (04:30 UTC) — weekdays only
  {
    id: 'flash-sale-tease',
    hour: 4, minute: 30,
    dayOfWeek: null,
    title: 'Limited Time Offer',
    message: 'Special deals are live today. Check the store before they expire.',
    type: 'warning',
  },

  // Evening engagement — 6:15 PM NPT (12:30 UTC)
  {
    id: 'evening-engage',
    hour: 12, minute: 30,
    dayOfWeek: null,
    title: 'New Panels Available',
    message: 'Fresh stock added. Drag Headshot, Aim Silent and more are ready for instant activation.',
    type: 'info',
  },

  // Weekend rank push promo — Saturday 10:15 AM NPT (04:30 UTC)
  {
    id: 'weekend-rank',
    hour: 4, minute: 30,
    dayOfWeek: 6, // Saturday
    title: 'Weekend Rank Push',
    message: 'Push your rank this weekend. 25 stars for Rs 50 — fast completion by pro players.',
    type: 'success',
  },

  // Wallet reminder — Sunday 11:15 AM NPT (05:30 UTC)
  {
    id: 'wallet-reminder',
    hour: 5, minute: 30,
    dayOfWeek: 0, // Sunday
    title: 'Wallet Balance Reminder',
    message: 'You have unused wallet balance. Use it on your next order for an instant discount.',
    type: 'warning',
  },
];

// ── Track which notifications fired today ─────────────────────────────────────
const firedToday = new Set();

function getTodayKey(id) {
  const d = new Date();
  return `${id}-${d.getUTCFullYear()}-${d.getUTCMonth()}-${d.getUTCDate()}`;
}

// ── Broadcast to all users ────────────────────────────────────────────────────
async function broadcastScheduled(notif) {
  try {
    const users = await User.find({ role: 'user' }).select('_id').limit(2000).lean();
    if (!users.length) return;

    console.log(`[scheduler] Firing "${notif.id}" to ${users.length} users`);

    // Save to DB for each user (batched, non-blocking)
    const batchSize = 50;
    for (let i = 0; i < users.length; i += batchSize) {
      const batch = users.slice(i, i + batchSize);
      await Promise.allSettled(
        batch.map(u =>
          createNotification(u._id, notif.title, notif.message, notif.type, {
            relatedType: 'system',
            metadata: { scheduledId: notif.id },
          })
        )
      );
    }

    // FCM broadcast (one call for all tokens — more efficient)
    broadcastPush(
      { title: notif.title, body: notif.message },
      { type: notif.type, url: '/dashboard' }
    ).catch(() => {});

    console.log(`[scheduler] "${notif.id}" sent successfully`);
  } catch (e) {
    console.error(`[scheduler] Failed to send "${notif.id}":`, e.message);
  }
}

// ── Main tick — runs every minute ────────────────────────────────────────────
function tick() {
  const now = new Date();
  const h = now.getUTCHours();
  const m = now.getUTCMinutes();
  const dow = now.getUTCDay(); // 0=Sun, 6=Sat

  for (const notif of SCHEDULED_NOTIFICATIONS) {
    if (notif.hour !== h || notif.minute !== m) continue;
    if (notif.dayOfWeek !== null && notif.dayOfWeek !== dow) continue;

    const key = getTodayKey(notif.id);
    if (firedToday.has(key)) continue; // already fired this minute

    firedToday.add(key);
    broadcastScheduled(notif); // fire async, don't block tick
  }

  // Clean up old keys (keep only today's)
  const todayPrefix = (() => {
    const d = new Date();
    return `${d.getUTCFullYear()}-${d.getUTCMonth()}-${d.getUTCDate()}`;
  })();
  for (const key of firedToday) {
    if (!key.endsWith(todayPrefix)) firedToday.delete(key);
  }
}

// ── Scheduled send queue (admin-set future notifications) ────────────────────
// Stored in memory — survives server restarts via DB polling on startup.
const scheduledQueue = [];

export function queueScheduledNotification(job) {
  // job = { sendAt: Date, title, message, type, targetType, targetUserId? }
  scheduledQueue.push(job);
  console.log(`[scheduler] Queued "${job.title}" for ${job.sendAt.toISOString()}`);
}

async function processQueue() {
  const now = new Date();
  const due = scheduledQueue.filter(j => new Date(j.sendAt) <= now);
  for (const job of due) {
    scheduledQueue.splice(scheduledQueue.indexOf(job), 1);
    try {
      if (job.targetType === 'specific' && job.targetUserId) {
        await createNotification(job.targetUserId, job.title, job.message, job.type || 'info', {
          fromAdmin: true,
          relatedType: 'custom',
        });
      } else {
        const users = await User.find({ role: 'user' }).select('_id').limit(2000).lean();
        await Promise.allSettled(
          users.map(u =>
            createNotification(u._id, job.title, job.message, job.type || 'info', {
              fromAdmin: true,
              relatedType: 'custom',
            })
          )
        );
        broadcastPush({ title: job.title, body: job.message }, { type: job.type, url: '/dashboard' }).catch(() => {});
      }
      console.log(`[scheduler] Queued job "${job.title}" delivered`);
    } catch (e) {
      console.error(`[scheduler] Queue job failed:`, e.message);
    }
  }
}

// ── Start the scheduler ───────────────────────────────────────────────────────
export function startScheduler() {
  console.log('[scheduler] Started — checking every 60s');

  // Align to the next full minute
  const msToNextMinute = (60 - new Date().getSeconds()) * 1000;
  setTimeout(() => {
    tick();
    processQueue();
    setInterval(() => {
      tick();
      processQueue();
    }, 60 * 1000);
  }, msToNextMinute);
}
