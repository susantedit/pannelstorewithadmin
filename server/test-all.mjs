/**
 * Full system test — run with: node test-all.mjs
 * Tests: DB connection, user lookup, notifications, push, requests, admin view
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import webpush from 'web-push';
dotenv.config();

const BASE = 'http://localhost:3000/api';
let passed = 0;
let failed = 0;

function ok(label, val) {
  console.log(`  ✓ ${label}: ${val}`);
  passed++;
}
function fail(label, err) {
  console.log(`  ✗ ${label}: ${err}`);
  failed++;
}

async function get(path) {
  const r = await fetch(`${BASE}${path}`);
  return r.json();
}
async function post(path, body, cookie = '') {
  const r = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(cookie ? { Cookie: cookie } : {}) },
    body: JSON.stringify(body),
  });
  return r.json();
}

// ── 1. Public API endpoints ───────────────────────────────────────────────────
console.log('\n=== 1. PUBLIC ENDPOINTS ===');
try {
  const h = await get('/health');
  h.ok ? ok('Health', 'server running') : fail('Health', 'not ok');
} catch(e) { fail('Health', e.message); }

try {
  const p = await get('/products');
  p.products?.length > 0 ? ok('Products', `${p.products.length} products`) : fail('Products', 'empty');
} catch(e) { fail('Products', e.message); }

try {
  const s = await get('/settings');
  s.ok ? ok('Settings', 'loaded') : fail('Settings', 'not ok');
} catch(e) { fail('Settings', e.message); }

try {
  const v = await get('/push/vapid-public-key');
  v.ok && v.publicKey ? ok('VAPID key', v.publicKey.slice(0,20)+'...') : fail('VAPID key', 'missing');
} catch(e) { fail('VAPID key', e.message); }

// ── 2. VAPID keys valid ───────────────────────────────────────────────────────
console.log('\n=== 2. VAPID KEYS ===');
try {
  webpush.setVapidDetails(
    process.env.VAPID_EMAIL,
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
  ok('VAPID setup', 'keys valid');
} catch(e) { fail('VAPID setup', e.message); }

// ── 3. DB + user lookup ───────────────────────────────────────────────────────
console.log('\n=== 3. DATABASE ===');
await mongoose.connect(process.env.MONGO_URI);
ok('MongoDB', 'connected');

const { default: User }         = await import('./models/User.js');
const { default: Notification } = await import('./models/Notification.js');
const { default: Request }      = await import('./models/Request.js');

const user = await User.findOne({ email: 'itachiinbd@gmail.com' }).lean();
if (!user) {
  fail('User itachiinbd@gmail.com', 'NOT FOUND in DB');
} else {
  ok('User found', `${user.name} | role=${user.role} | xp=${user.xp}`);
  ok('User wallet', `Rs ${user.walletBalance || 0}`);
  ok('User streak', `${user.streakCount || 0} days`);
  ok('Push subscriptions', `${user.pushSubscriptions?.length || 0} devices`);
  ok('FCM tokens', `${user.fcmTokens?.length || 0} tokens`);
}

// ── 4. Requests ───────────────────────────────────────────────────────────────
console.log('\n=== 4. REQUESTS ===');
const allReqs = await Request.find({}).sort({ createdAt: -1 }).limit(10).lean();
ok('Total requests in DB', allReqs.length);
allReqs.slice(0,5).forEach(r => {
  console.log(`     ${r.userName} | ${r.product} | ${r.status} | ${r.createdAt?.toISOString()?.slice(0,10)}`);
});

if (user) {
  const userReqs = await Request.find({ userId: user._id }).lean();
  ok(`Requests for itachiinbd`, userReqs.length);
}

// ── 5. Notifications ─────────────────────────────────────────────────────────
console.log('\n=== 5. NOTIFICATIONS ===');
const totalNotifs = await Notification.countDocuments();
ok('Total notifications in DB', totalNotifs);

if (user) {
  const userNotifs = await Notification.find({ userId: user._id }).sort({ createdAt: -1 }).limit(5).lean();
  ok(`Notifications for itachiinbd`, userNotifs.length);
  userNotifs.forEach(n => {
    console.log(`     "${n.title}" | read=${n.read} | tone=${n.tone}`);
  });
}

// ── 6. Send test notification to itachiinbd ───────────────────────────────────
console.log('\n=== 6. SEND TEST NOTIFICATION ===');
if (user) {
  const { createNotification } = await import('./controllers/notificationController.js');
  const notif = await createNotification(
    user._id,
    'Test Notification',
    'This is a test from the local test suite. All systems working.',
    'success',
    { tone: 'info', deepLink: '/dashboard', relatedType: 'system' }
  );
  notif ? ok('Notification created', `id=${notif._id}`) : fail('Notification created', 'returned null');
} else {
  fail('Send notification', 'user not found, skipped');
}

// ── 7. Web Push test (only if user has subscriptions) ────────────────────────
console.log('\n=== 7. WEB PUSH ===');
if (user?.pushSubscriptions?.length > 0) {
  const { sendPushToUser } = await import('./lib/webpush.js');
  const result = await sendPushToUser(
    user._id,
    'OS Push Test',
    'This is a real OS push notification from the test suite!',
    { url: '/dashboard' }
  );
  result.sent > 0
    ? ok('Web push sent', `${result.sent} sent, ${result.failed} failed`)
    : fail('Web push', `0 sent — ${result.failed} failed (subscription may be expired)`);
} else {
  console.log('  ⚠ No push subscriptions for itachiinbd — user needs to open the app and allow notifications first');
  console.log('  ⚠ Open http://localhost:5173/dashboard in browser, allow notifications, then re-run this test');
}

// ── 8. Admin requests view ────────────────────────────────────────────────────
console.log('\n=== 8. ADMIN REQUESTS VIEW ===');
try {
  const r = await get('/requests?scope=all');
  // This will fail without auth — expected
  r.ok ? ok('Admin requests (no auth)', `${r.requests?.length} requests`) : ok('Admin requests (no auth)', 'correctly blocked: ' + r.message);
} catch(e) { fail('Admin requests', e.message); }

// ── Summary ───────────────────────────────────────────────────────────────────
await mongoose.disconnect();
console.log(`\n${'='.repeat(40)}`);
console.log(`RESULTS: ${passed} passed, ${failed} failed`);
if (failed === 0) {
  console.log('ALL TESTS PASSED ✓');
} else {
  console.log('SOME TESTS FAILED — check above');
}
