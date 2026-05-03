/**
 * Smart Scheduled Notifications — SUSANTEDIT
 * - Segmented pools: different message per user type
 * - Cooldown: max 3/day per user
 * - Roast safety: never to new users or recent buyers
 * - Rotating daily: never same message twice in a row
 *
 * NPT → UTC offsets:
 *   6:15 AM NPT  = 00:30 UTC
 *   10:15 AM NPT = 04:30 UTC
 *   1:15 PM NPT  = 07:30 UTC
 *   6:15 PM NPT  = 12:30 UTC
 *   9:15 PM NPT  = 15:30 UTC
 */

import User from '../models/User.js';
import { segmentedBroadcast, createNotification } from '../controllers/notificationController.js';
import { broadcastPush } from '../lib/webpush.js';

// ─────────────────────────────────────────────────────────────────────────────
// SEGMENTED POOLS
// Each slot has a pool per segment. Falls back to 'regular' if segment missing.
// ─────────────────────────────────────────────────────────────────────────────

const MORNING_POOLS = [
  // Day 0
  {
    new:          { title: 'Welcome Back',          message: 'Your daily check-in is ready. Earn XP and start your streak today.',                    type: 'success', tone: 'reward',   deepLink: '/dashboard' },
    inactive:     { title: 'Still Here',             message: 'Your account is waiting. Log in, claim your daily XP, and get back in the game.',       type: 'info',    tone: 'roast',    deepLink: '/dashboard' },
    elite:        { title: 'Elite Check-In',         message: 'Top players start their day with a check-in. Your XP streak is waiting.',               type: 'success', tone: 'elite',    deepLink: '/dashboard' },
    vip:          { title: 'VIP Morning',            message: 'Your VIP daily reward is ready. Claim it before the day gets busy.',                    type: 'success', tone: 'reward',   deepLink: '/dashboard' },
    high_spender: { title: 'Premium Start',          message: 'Your daily bonus is live. High-tier players never miss a check-in.',                    type: 'success', tone: 'elite',    deepLink: '/dashboard' },
    just_bought:  { title: 'Good Morning',           message: 'Your order is being processed. Check your dashboard for updates.',                      type: 'info',    tone: 'info',     deepLink: '/dashboard' },
    regular:      { title: 'Daily Reward Unlocked',  message: 'Your daily check-in is ready. Log in now to earn XP and keep your streak alive.',       type: 'success', tone: 'reward',   deepLink: '/dashboard' },
  },
  // Day 1
  {
    new:          { title: 'Free XP Waiting',        message: 'Claim your first daily XP. Every point counts toward your first rank upgrade.',         type: 'success', tone: 'reward',   deepLink: '/dashboard' },
    inactive:     { title: 'You Disappeared',        message: 'Your streak reset. But you can start a new one right now. One tap.',                    type: 'info',    tone: 'roast',    deepLink: '/dashboard' },
    elite:        { title: 'Streak Alive',           message: 'Do not break it today. Elite players protect their streaks like their rank.',            type: 'warning', tone: 'elite',    deepLink: '/dashboard' },
    vip:          { title: 'VIP Streak Bonus',       message: 'Your streak gives you extra wallet credits. Keep it going today.',                      type: 'success', tone: 'reward',   deepLink: '/dashboard' },
    high_spender: { title: 'Loyalty Bonus',          message: 'Your spending history earns you extra XP on check-ins. Do not skip today.',             type: 'success', tone: 'elite',    deepLink: '/dashboard' },
    just_bought:  { title: 'Order Update',           message: 'Your recent order is under review. We will notify you the moment it is approved.',      type: 'info',    tone: 'info',     deepLink: '/dashboard' },
    regular:      { title: 'Your Streak Is Alive',   message: 'Do not break it today. One check-in keeps your streak going and rewards stacking.',     type: 'warning', tone: 'urgency',  deepLink: '/dashboard' },
  },
  // Day 2
  {
    new:          { title: 'Small Action Today',     message: 'Big results tomorrow. Check in, earn XP, and see your rank grow.',                      type: 'info',    tone: 'reward',   deepLink: '/dashboard' },
    inactive:     { title: 'Bro Really Said Later',  message: 'It is still later. Your XP is not going to earn itself. One tap.',                      type: 'info',    tone: 'roast',    deepLink: '/dashboard' },
    elite:        { title: 'Legends Do Not Wait',    message: 'They act. Your daily XP is ready. Collect it before the day slips.',                    type: 'success', tone: 'elite',    deepLink: '/dashboard' },
    vip:          { title: 'VIP Daily Drop',         message: 'Exclusive daily reward for VIP members. Claim it now.',                                 type: 'success', tone: 'reward',   deepLink: '/dashboard' },
    high_spender: { title: 'Top Tier Morning',       message: 'Your account is in the top tier. Keep the streak going for maximum rewards.',           type: 'success', tone: 'elite',    deepLink: '/dashboard' },
    just_bought:  { title: 'Processing Your Order',  message: 'Our team is on it. Sit tight — you will get a notification the moment it is done.',     type: 'info',    tone: 'info',     deepLink: '/dashboard' },
    regular:      { title: 'XP Waiting',             message: 'Your XP is sitting there. Do not leave it unclaimed. One tap is all it takes.',         type: 'info',    tone: 'funny',    deepLink: '/dashboard' },
  },
];

const AFTERNOON_POOLS = [
  // Day 0
  {
    new:          { title: 'New Panels Available',   message: 'Drag Headshot, Aim Silent, Proxy Panel — all ready for instant activation. Check them out.', type: 'info',    tone: 'info',     deepLink: '/dashboard' },
    inactive:     { title: 'Others Already Upgraded', message: 'You are still thinking. Limited stock on panels. Do not be the one who misses it.',     type: 'warning', tone: 'roast',    deepLink: '/dashboard' },
    elite:        { title: 'Elite Deals Live',       message: 'New panels dropped. Top players already moved. Your turn.',                              type: 'info',    tone: 'elite',    deepLink: '/dashboard' },
    vip:          { title: 'VIP Early Access',       message: 'New stock is live. VIP members get first pick. Check the store now.',                    type: 'success', tone: 'reward',   deepLink: '/dashboard' },
    high_spender: { title: 'Premium Stock Live',     message: 'New panels added. Your spending history qualifies you for the best deals.',              type: 'info',    tone: 'elite',    deepLink: '/dashboard' },
    just_bought:  { title: 'While You Wait',         message: 'Browse the store. New panels and rank push deals are live right now.',                   type: 'info',    tone: 'info',     deepLink: '/dashboard' },
    regular:      { title: 'Limited Time Offer',     message: 'Special deals are live today. Check the store before they expire.',                      type: 'warning', tone: 'fomo',     deepLink: '/dashboard' },
  },
  // Day 1
  {
    new:          { title: 'Rank Push Service',      message: 'Professional rank boosting. 25 stars for Rs 50. Fast completion in 2 to 6 hours.',       type: 'success', tone: 'info',     deepLink: '/dashboard' },
    inactive:     { title: 'Rank Stuck',             message: 'Yeah, we can see that. Rank Push is live — 25 stars for Rs 50. Still thinking?',         type: 'info',    tone: 'roast',    deepLink: '/dashboard' },
    elite:        { title: 'Push Your Rank',         message: 'Elite players do not stay stuck. Rank Push service is live. Fast and safe.',             type: 'success', tone: 'elite',    deepLink: '/dashboard' },
    vip:          { title: 'VIP Rank Boost',         message: 'Rank Push with priority processing for VIP members. 25 stars, Rs 50.',                   type: 'success', tone: 'reward',   deepLink: '/dashboard' },
    high_spender: { title: 'Rank Push Available',    message: 'Your spending history shows you take the game seriously. Rank Push is live.',            type: 'info',    tone: 'elite',    deepLink: '/dashboard' },
    just_bought:  { title: 'Also Available',         message: 'Rank Push service is live. 25 stars for Rs 50 while your current order processes.',      type: 'info',    tone: 'info',     deepLink: '/dashboard' },
    regular:      { title: 'This Deal Will Not Wait', message: 'Everyone is moving ahead. Flash deals are live right now. What about you?',             type: 'warning', tone: 'fomo',     deepLink: '/dashboard' },
  },
  // Day 2
  {
    new:          { title: '4K Panel — Best Value',  message: '1 full year access, no domain required. One payment. Check it out in the store.',        type: 'info',    tone: 'info',     deepLink: '/dashboard' },
    inactive:     { title: 'Others Grinding',        message: 'You are scrolling. Makes sense. Or you could upgrade right now and change that.',        type: 'info',    tone: 'roast',    deepLink: '/dashboard' },
    elite:        { title: 'New Drop',               message: 'Only today. Do not be the one who misses it. Others already moved.',                     type: 'warning', tone: 'fomo',     deepLink: '/dashboard' },
    vip:          { title: 'VIP Exclusive',          message: 'New stock added. VIP members get the best deals first. Check the store.',                type: 'success', tone: 'reward',   deepLink: '/dashboard' },
    high_spender: { title: 'Premium Deal Live',      message: 'New panels added for high-tier players. Your loyalty gets you the best access.',         type: 'info',    tone: 'elite',    deepLink: '/dashboard' },
    just_bought:  { title: 'More Options',           message: 'While your order is processing, check out the 4K Panel — 1 year, no domain needed.',     type: 'info',    tone: 'info',     deepLink: '/dashboard' },
    regular:      { title: 'You Missed It Once',     message: 'Do not do it again. Limited time offers are back. This window will not stay open.',      type: 'warning', tone: 'fomo',     deepLink: '/dashboard' },
  },
];

const EVENING_POOLS = [
  // Day 0
  {
    new:          { title: 'Your Progress Matters',  message: 'Every XP point gets you closer to Elite rank. Check in tonight and keep building.',      type: 'success', tone: 'reward',   deepLink: '/dashboard' },
    inactive:     { title: 'Your Future Self',       message: 'Is judging you right now. Upgrade tonight and give them something to be proud of.',      type: 'info',    tone: 'roast',    deepLink: '/dashboard' },
    elite:        { title: 'Top Players Move',       message: 'Like you. Keep going. Your progress speaks louder than anything else tonight.',          type: 'success', tone: 'elite',    deepLink: '/dashboard' },
    vip:          { title: 'VIP Evening',            message: 'Your VIP status is active. Make the most of it tonight with new deals in the store.',    type: 'success', tone: 'reward',   deepLink: '/dashboard' },
    high_spender: { title: 'Elite Status',           message: 'Your spending puts you in the top tier. Keep the momentum going tonight.',               type: 'success', tone: 'elite',    deepLink: '/dashboard' },
    just_bought:  { title: 'Order In Progress',      message: 'Your order is being reviewed. Our team works until late. You will hear from us soon.',   type: 'info',    tone: 'info',     deepLink: '/dashboard' },
    regular:      { title: 'You Are Closer',         message: 'Than you think. Do not stop now. This is how champions are built. One more step.',       type: 'success', tone: 'elite',    deepLink: '/dashboard' },
  },
  // Day 1
  {
    new:          { title: 'Consistency Wins',       message: 'Small action today, big results tomorrow. Check in and earn your evening XP.',           type: 'info',    tone: 'reward',   deepLink: '/dashboard' },
    inactive:     { title: 'Tap Now',                message: 'Or act surprised later. New deals are live and they expire at midnight.',                type: 'warning', tone: 'funny',    deepLink: '/dashboard' },
    elite:        { title: 'Legends Do Not Quit',    message: 'They adapt. New panels are live. Aim Silent, Proxy Panel, Drag Headshot — all ready.',   type: 'info',    tone: 'elite',    deepLink: '/dashboard' },
    vip:          { title: 'VIP Night Deals',        message: 'Exclusive evening deals for VIP members. Check the store before midnight.',              type: 'success', tone: 'reward',   deepLink: '/dashboard' },
    high_spender: { title: 'Premium Evening',        message: 'New panels added tonight. Your account qualifies for the best access.',                  type: 'info',    tone: 'elite',    deepLink: '/dashboard' },
    just_bought:  { title: 'Almost There',           message: 'Your order review is in progress. Check your dashboard for the latest status.',          type: 'info',    tone: 'info',     deepLink: '/dashboard' },
    regular:      { title: 'This Notification',      message: 'Is doing more work than you right now. Prove it wrong. Check the store.',                type: 'info',    tone: 'funny',    deepLink: '/dashboard' },
  },
];

const NIGHT_POOLS = [
  // Day 0
  {
    new:          { title: 'Last Chance Tonight',    message: 'Grab your panel or rank push before the day ends. New user deals are live.',             type: 'warning', tone: 'urgency',  deepLink: '/dashboard' },
    inactive:     { title: 'Missed Again',           message: 'At this point it is a habit. Break the cycle tonight. One tap is all it takes.',         type: 'info',    tone: 'roast',    deepLink: '/dashboard' },
    elite:        { title: 'Final Call',             message: 'This window will not open again today. Elite players do not leave deals on the table.',   type: 'warning', tone: 'urgency',  deepLink: '/dashboard' },
    vip:          { title: 'VIP Final Call',         message: 'Last chance for tonight\'s VIP deals. After midnight, prices reset.',                    type: 'warning', tone: 'urgency',  deepLink: '/dashboard' },
    high_spender: { title: 'Ending Soon',            message: 'Tonight\'s deals close at midnight. Your account history gets you the best rates.',      type: 'warning', tone: 'urgency',  deepLink: '/dashboard' },
    just_bought:  { title: 'Streak Reminder',        message: 'Do not forget your check-in before midnight. Keep your streak alive.',                   type: 'warning', tone: 'urgency',  deepLink: '/dashboard' },
    regular:      { title: 'Ending Soon',            message: 'Last chance. This deal will not be here tomorrow. Final call.',                          type: 'warning', tone: 'urgency',  deepLink: '/dashboard' },
  },
  // Day 1
  {
    new:          { title: 'Your Streak Needs You',  message: 'Do not break it tonight. Check in before midnight and keep your rewards alive.',         type: 'warning', tone: 'urgency',  deepLink: '/dashboard' },
    inactive:     { title: 'Your Enemies Said Thanks', message: 'For staying weak. Aim Silent panel is live. Change that tonight.',                     type: 'info',    tone: 'roast',    deepLink: '/dashboard' },
    elite:        { title: '2 Hours Left',           message: 'After that, gone. You have been warned. Do not come back saying you did not know.',       type: 'warning', tone: 'urgency',  deepLink: '/dashboard' },
    vip:          { title: 'VIP Streak',             message: 'Your VIP streak bonus resets at midnight. Check in now to keep it.',                     type: 'warning', tone: 'urgency',  deepLink: '/dashboard' },
    high_spender: { title: 'Premium Final Call',     message: 'Tonight\'s premium deals expire at midnight. Your loyalty deserves the best.',           type: 'warning', tone: 'urgency',  deepLink: '/dashboard' },
    just_bought:  { title: 'Check In Tonight',       message: 'Your order is processing. While you wait, check in and earn your daily XP.',             type: 'info',    tone: 'info',     deepLink: '/dashboard' },
    regular:      { title: 'Wallet Balance Reminder', message: 'You have unused wallet balance. Use it on your next order for an instant discount.',    type: 'warning', tone: 'reward',   deepLink: '/dashboard' },
  },
];

const WEEKEND_POOLS = [
  {
    new:          { title: 'Weekend Special',        message: 'New to SUSANTEDIT? Weekend is the best time to start. Rank Push, panels, all live.',     type: 'success', tone: 'reward',   deepLink: '/dashboard' },
    inactive:     { title: 'Weekend Grind',          message: 'Top players do not take weekends off. Come back and push your rank.',                    type: 'info',    tone: 'roast',    deepLink: '/dashboard' },
    elite:        { title: 'Weekend Rank Push',      message: 'Push your rank this weekend. 25 stars for Rs 50. Fast completion by pro players.',       type: 'success', tone: 'elite',    deepLink: '/dashboard' },
    vip:          { title: 'VIP Weekend',            message: 'Weekend deals are live for VIP members. Check the store for exclusive access.',          type: 'success', tone: 'reward',   deepLink: '/dashboard' },
    high_spender: { title: 'Premium Weekend',        message: 'New panels and rank push deals are live. Your tier gets priority processing.',           type: 'success', tone: 'elite',    deepLink: '/dashboard' },
    just_bought:  { title: 'Weekend Update',         message: 'Your order is being processed. Weekend orders get priority. Check your dashboard.',      type: 'info',    tone: 'info',     deepLink: '/dashboard' },
    regular:      { title: 'Weekend Rank Push',      message: 'Push your rank this weekend. 25 stars for Rs 50. Fast completion by pro players.',       type: 'success', tone: 'fomo',     deepLink: '/dashboard' },
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// SCHEDULE
// ─────────────────────────────────────────────────────────────────────────────

const SCHEDULE = [
  { id: 'morning',     hour: 0,  minute: 30, pools: MORNING_POOLS,   dayOfWeek: null },
  { id: 'afternoon',   hour: 7,  minute: 30, pools: AFTERNOON_POOLS, dayOfWeek: null },
  { id: 'evening',     hour: 12, minute: 30, pools: EVENING_POOLS,   dayOfWeek: null },
  { id: 'night',       hour: 15, minute: 30, pools: NIGHT_POOLS,     dayOfWeek: null },
  { id: 'weekend-sat', hour: 4,  minute: 30, pools: WEEKEND_POOLS,   dayOfWeek: 6 },
  { id: 'weekend-sun', hour: 4,  minute: 30, pools: WEEKEND_POOLS,   dayOfWeek: 0 },
];

// ─────────────────────────────────────────────────────────────────────────────
// Pick pool for today (rotates daily)
// ─────────────────────────────────────────────────────────────────────────────

function pickPool(pools) {
  const now = new Date();
  const dayOfYear = Math.floor((now - new Date(now.getUTCFullYear(), 0, 0)) / 86400000);
  return pools[dayOfYear % pools.length];
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
// Tick
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

    const pool = pickPool(slot.pools);
    console.log(`[scheduler] Firing slot "${slot.id}"`);
    segmentedBroadcast(pool, { metadata: { scheduledId: slot.id } });
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
// Admin-scheduled queue
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
          fromAdmin: true, relatedType: 'custom', tone: job.tone || 'info', deepLink: job.deepLink || '/dashboard',
        });
      } else {
        const users = await User.find({ role: 'user' }).select('_id').limit(2000).lean();
        await Promise.allSettled(
          users.map(u =>
            createNotification(u._id, job.title, job.message, job.type || 'info', {
              fromAdmin: true, relatedType: 'custom', tone: job.tone || 'info', deepLink: job.deepLink || '/dashboard',
            })
          )
        );
        broadcastPush(job.title, job.message, { type: job.type, url: job.deepLink || '/dashboard' }).catch(() => {});
      }
      console.log(`[scheduler] Queued job "${job.title}" delivered`);
    } catch (e) {
      console.error(`[scheduler] Queue job failed:`, e.message);
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Inactivity scanner — runs every 6 hours, nudges users inactive 24h+
// ─────────────────────────────────────────────────────────────────────────────

async function scanInactiveUsers() {
  try {
    const { NotificationHelpers } = await import('../controllers/notificationController.js');
    const cutoff = new Date(Date.now() - 24 * 3600000);
    const users = await User.find({
      role: 'user',
      $or: [{ lastActiveAt: { $lt: cutoff } }, { lastActiveAt: null }],
      // Don't spam — only nudge if not notified in last 24h
      $or: [{ lastNotifAt: { $lt: cutoff } }, { lastNotifAt: null }],
    }).select('_id').limit(100).lean();

    for (const u of users) {
      await NotificationHelpers.inactivityNudge(u._id);
    }
    if (users.length > 0) console.log(`[scheduler] Inactivity nudge sent to ${users.length} users`);
  } catch (e) {
    console.error('[scheduler] Inactivity scan error:', e.message);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Start
// ─────────────────────────────────────────────────────────────────────────────

export function startScheduler() {
  console.log('[scheduler] Smart scheduler started — segmented, cooldown-aware, roast-safe');

  const msToNextMinute = (60 - new Date().getSeconds()) * 1000;
  setTimeout(() => {
    tick();
    processQueue();
    setInterval(() => { tick(); processQueue(); }, 60 * 1000);

    // Inactivity scan every 6 hours
    setInterval(scanInactiveUsers, 6 * 3600 * 1000);
  }, msToNextMinute);
}
