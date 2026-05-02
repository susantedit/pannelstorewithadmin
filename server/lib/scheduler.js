/**
 * Automatic scheduled notifications — SUSANTEDIT
 * Runs inside Express server. No external cron needed.
 *
 * NPT = UTC+5:45
 * NPT 6:00 AM  = UTC 00:15
 * NPT 10:00 AM = UTC 04:15
 * NPT 1:00 PM  = UTC 07:15
 * NPT 6:00 PM  = UTC 12:15
 * NPT 9:00 PM  = UTC 15:15
 * NPT 11:00 PM = UTC 17:15
 *
 * Strategy:
 *   Morning (6–10 AM NPT)   → Motivation / Reward / Check-in
 *   Afternoon (1–4 PM NPT)  → Deals / FOMO / Roast
 *   Evening (6–8 PM NPT)    → Elite / Respect / Combo
 *   Night (9–11 PM NPT)     → Urgency / Roast / Savage
 */

import User from '../models/User.js';
import { createNotification } from '../controllers/notificationController.js';
import { broadcastPush } from './fcm.js';

// ─────────────────────────────────────────────────────────────────────────────
// NOTIFICATION POOLS — rotated daily so users never see the same one twice
// ─────────────────────────────────────────────────────────────────────────────

const POOLS = {

  // ── MORNING: Motivation + Reward + Check-in (6:15 AM NPT = 00:30 UTC) ──────
  morning: [
    // Reward / Addiction
    { title: 'Daily Reward Unlocked',       message: 'Your daily check-in is ready. Log in now to earn XP and keep your streak alive.',           type: 'success' },
    { title: 'Free XP Drop',                message: 'Claim your daily XP before it expires. Every point counts toward your next rank.',           type: 'success' },
    { title: 'Your Streak Is Alive',         message: 'Do not break it today. One check-in keeps your streak going and your rewards stacking.',    type: 'warning' },
    { title: 'Bonus Waiting',               message: 'You earned this. Come collect your daily reward before someone else takes the energy.',       type: 'success' },
    // Motivation / Smart Psychology
    { title: 'Small Action Today',          message: 'Big results tomorrow. Consistency beats talent every time. Prove it.',                        type: 'info' },
    { title: 'Your Growth Starts Now',      message: 'The next level is closer than you think. What you do in the next 5 minutes matters.',        type: 'info' },
    { title: 'Legends Do Not Wait',         message: 'They act. Top players are already online. Where are you?',                                   type: 'info' },
    { title: 'Elite Mindset Detected',      message: 'Keep pushing. Your progress speaks louder than anything else today.',                        type: 'success' },
    // Funny / Meme
    { title: 'XP Waiting',                  message: 'Your XP is sitting there like: bro click me. Do not leave it hanging.',                      type: 'info' },
    { title: 'We Sent This Twice',          message: 'Just saying. Your daily reward is still unclaimed. We are patient. Are you?',                type: 'info' },
  ],

  // ── AFTERNOON: Deals + FOMO + Roast (1:15 PM NPT = 07:30 UTC) ──────────────
  afternoon: [
    // FOMO / Pressure
    { title: 'Others Already Upgraded',     message: 'You are still thinking. Limited stock on panels — do not be the one who misses it.',         type: 'warning' },
    { title: 'This Deal Will Not Wait',     message: 'Everyone is moving ahead. Flash deals are live right now. What about you?',                  type: 'warning' },
    { title: 'You Missed It Once',          message: 'Do not do it again. Limited time offers are back. This window will not stay open.',           type: 'warning' },
    { title: 'Limited Time',               message: 'Limited chances. Others upgraded while you were scrolling. Last call.',                       type: 'warning' },
    // Savage / Roast
    { title: 'Still No Upgrade',            message: 'Even bots are ahead of you now. Drag Headshot panel is live. Just saying.',                  type: 'info' },
    { title: 'You Watching or Winning',     message: 'Big difference. Your enemies just said thanks for staying weak. Your move.',                 type: 'info' },
    { title: 'Rank Stuck',                  message: 'Yeah, we can see that. Rank Push service is live — 25 stars for Rs 50. Still thinking?',    type: 'info' },
    { title: 'Others Grinding',             message: 'You are scrolling. Makes sense. Or you could upgrade right now and change that.',            type: 'info' },
    // Combo
    { title: 'New Drop',                    message: 'Only 2 hours left. Do not be the one who misses it. Others already moved.',                  type: 'warning' },
    { title: 'Free XP Inside',              message: 'Others upgraded and got bonus XP. Your move. Do not let it expire.',                         type: 'success' },
  ],

  // ── EVENING: Elite + Respect + New Products (6:15 PM NPT = 12:30 UTC) ──────
  evening: [
    // Respect / Elite
    { title: 'Top Players Move Like You',   message: 'Keep going. You are not average — do not play like one. The grind is real.',                 type: 'success' },
    { title: 'You Are Closer Than You Think', message: 'Do not stop now. This is how champions are built. One more step.',                         type: 'success' },
    { title: 'Your Progress Speaks',        message: 'Louder than others. Elite mindset is rare. You have it — use it tonight.',                   type: 'success' },
    { title: 'Legends Do Not Quit',         message: 'They adapt. New panels are live. Aim Silent, Proxy Panel, Drag Headshot — all ready.',       type: 'info' },
    // Product push
    { title: 'New Panels Available',        message: 'Fresh stock added. Drag Headshot, Aim Silent and Proxy Panel ready for instant activation.', type: 'info' },
    { title: 'Rank Push Service Live',      message: 'Professional players. Fast completion in 2 to 6 hours. 25 stars for Rs 50.',                 type: 'success' },
    { title: '4K Panel — 1 Year Access',    message: 'No domain required. One payment, full year. Best value in the store right now.',             type: 'info' },
    // Funny evening
    { title: 'Your Future Self',            message: 'Is judging you right now. Upgrade tonight and give them something to be proud of.',          type: 'info' },
    { title: 'Tap Now',                     message: 'Or act surprised later. New deals are live and they expire at midnight.',                    type: 'warning' },
    { title: 'This Notification',           message: 'Is doing more work than you right now. Prove it wrong. Check the store.',                    type: 'info' },
  ],

  // ── NIGHT: Urgency + Savage + Final Call (9:15 PM NPT = 15:30 UTC) ─────────
  night: [
    // Urgency / Timer
    { title: 'Ending Soon',                 message: 'Last chance. This deal will not be here tomorrow. Final call — do not regret this later.',   type: 'warning' },
    { title: 'Final Call',                  message: 'This window will not open again today. Act now or wait until tomorrow.',                     type: 'warning' },
    { title: 'Last Chance Tonight',         message: 'After midnight, prices reset. Grab your panel or rank push before the day ends.',            type: 'warning' },
    { title: '2 Hours Left',               message: 'After that, gone. You have been warned. Do not come back saying you did not know.',           type: 'warning' },
    // Savage / Night roast
    { title: 'Bro Really Said Later',       message: 'It is still later. Your rank is not going to push itself. We are here when you are ready.',  type: 'info' },
    { title: 'You Had Potential',           message: 'What happened? The store is open. Panels are live. Your enemies are already upgraded.',      type: 'info' },
    { title: 'Missed Again',               message: 'At this point it is a habit. Break the cycle tonight. One tap is all it takes.',              type: 'info' },
    { title: 'Your Enemies Said Thanks',    message: 'For staying weak. Aim Silent panel is live. Change that tonight.',                           type: 'info' },
    // Retention
    { title: 'Your Streak Needs You',       message: 'Do not break it tonight. Check in before midnight and keep your rewards alive.',             type: 'warning' },
    { title: 'Wallet Balance Reminder',     message: 'You have unused wallet balance. Use it on your next order for an instant discount.',         type: 'warning' },
  ],

  // ── WEEKEND SPECIAL: Saturday + Sunday ──────────────────────────────────────
  weekend: [
    { title: 'Weekend Rank Push',           message: 'Push your rank this weekend. 25 stars for Rs 50 — fast completion by pro players.',          type: 'success' },
    { title: 'Weekend Grind Mode',          message: 'Top players do not take weekends off. New panels, rank push, and deals are all live.',        type: 'info' },
    { title: 'Saturday Drop',              message: 'Fresh deals every Saturday. Check the store before your squad does.',                         type: 'success' },
    { title: 'Sunday Last Chance',          message: 'Week ends tonight. Grab your panel or rank push before Monday prices.',                      type: 'warning' },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// SCHEDULE — when each pool fires (UTC time)
// ─────────────────────────────────────────────────────────────────────────────

const SCHEDULE = [
  { id: 'morning',   hour: 0,  minute: 30, pool: 'morning',   dayOfWeek: null },
  { id: 'afternoon', hour: 7,  minute: 30, pool: 'afternoon', dayOfWeek: null },
  { id: 'evening',   hour: 12, minute: 30, pool: 'evening',   dayOfWeek: null },
  { id: 'night',     hour: 15, minute: 30, pool: 'night',     dayOfWeek: null },
  // Weekend extras
  { id: 'weekend-sat', hour: 4, minute: 30, pool: 'weekend', dayOfWeek: 6 }, // Saturday
  { id: 'weekend-sun', hour: 4, minute: 30, pool: 'weekend', dayOfWeek: 0 }, // Sunday
];

// ─────────────────────────────────────────────────────────────────────────────
// Pick notification from pool — rotates daily so it never repeats
// ─────────────────────────────────────────────────────────────────────────────

function pickFromPool(poolName) {
  const pool = POOLS[poolName];
  if (!pool?.length) return null;
  // Use day-of-year as index so it rotates daily
  const now = new Date();
  const dayOfYear = Math.floor((now - new Date(now.getUTCFullYear(), 0, 0)) / 86400000);
  return pool[dayOfYear % pool.length];
}

// ─────────────────────────────────────────────────────────────────────────────
// Broadcast to all users
// ─────────────────────────────────────────────────────────────────────────────

async function broadcastScheduled(notif, scheduleId) {
  try {
    const users = await User.find({ role: 'user' }).select('_id').limit(2000).lean();
    if (!users.length) return;

    console.log(`[scheduler] "${scheduleId}" → "${notif.title}" → ${users.length} users`);

    const batchSize = 50;
    for (let i = 0; i < users.length; i += batchSize) {
      const batch = users.slice(i, i + batchSize);
      await Promise.allSettled(
        batch.map(u =>
          createNotification(u._id, notif.title, notif.message, notif.type, {
            relatedType: 'system',
            metadata: { scheduledId: scheduleId },
          })
        )
      );
    }

    broadcastPush(
      { title: notif.title, body: notif.message },
      { type: notif.type, url: '/dashboard' }
    ).catch(() => {});

    console.log(`[scheduler] "${scheduleId}" delivered`);
  } catch (e) {
    console.error(`[scheduler] "${scheduleId}" failed:`, e.message);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Fired-today tracker
// ─────────────────────────────────────────────────────────────────────────────

const firedToday = new Set();

function todayKey(id) {
  const d = new Date();
  return `${id}-${d.getUTCFullYear()}-${d.getUTCMonth()}-${d.getUTCDate()}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Tick — runs every minute
// ─────────────────────────────────────────────────────────────────────────────

function tick() {
  const now = new Date();
  const h   = now.getUTCHours();
  const m   = now.getUTCMinutes();
  const dow = now.getUTCDay();

  for (const slot of SCHEDULE) {
    if (slot.hour !== h || slot.minute !== m) continue;
    if (slot.dayOfWeek !== null && slot.dayOfWeek !== dow) continue;

    const key = todayKey(slot.id);
    if (firedToday.has(key)) continue;
    firedToday.add(key);

    const notif = pickFromPool(slot.pool);
    if (notif) broadcastScheduled(notif, slot.id);
  }

  // Prune old keys
  const todaySuffix = (() => {
    const d = new Date();
    return `${d.getUTCFullYear()}-${d.getUTCMonth()}-${d.getUTCDate()}`;
  })();
  for (const key of firedToday) {
    if (!key.endsWith(todaySuffix)) firedToday.delete(key);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Admin-scheduled queue (send at a specific future time)
// ─────────────────────────────────────────────────────────────────────────────

const scheduledQueue = [];

export function queueScheduledNotification(job) {
  scheduledQueue.push(job);
  console.log(`[scheduler] Queued "${job.title}" for ${new Date(job.sendAt).toISOString()}`);
}

async function processQueue() {
  const now = new Date();
  const due = scheduledQueue.filter(j => new Date(j.sendAt) <= now);
  for (const job of due) {
    scheduledQueue.splice(scheduledQueue.indexOf(job), 1);
    try {
      if (job.targetType === 'specific' && job.targetUserId) {
        await createNotification(job.targetUserId, job.title, job.message, job.type || 'info', {
          fromAdmin: true, relatedType: 'custom',
        });
      } else {
        const users = await User.find({ role: 'user' }).select('_id').limit(2000).lean();
        await Promise.allSettled(
          users.map(u =>
            createNotification(u._id, job.title, job.message, job.type || 'info', {
              fromAdmin: true, relatedType: 'custom',
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

// ─────────────────────────────────────────────────────────────────────────────
// Start
// ─────────────────────────────────────────────────────────────────────────────

export function startScheduler() {
  console.log('[scheduler] Started — 4 daily slots + weekend extras');
  const msToNextMinute = (60 - new Date().getSeconds()) * 1000;
  setTimeout(() => {
    tick();
    processQueue();
    setInterval(() => { tick(); processQueue(); }, 60 * 1000);
  }, msToNextMinute);
}
