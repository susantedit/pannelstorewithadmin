# ⚔️ SUSANTEDIT — Elite Gaming Services Platform

> **Nepal's premium Free Fire gaming services store** — panels, diamond top-ups, memberships, rank pushing, and more. A complete full-stack business platform built from scratch with manual payment verification, gamification, AI chat, push notifications, and ad monetization.

---

## 📋 Table of Contents

- [The Idea](#-the-idea)
- [Architecture](#-architecture)
- [Project Structure](#-project-structure)
- [Feature Map](#-feature-map)
- [Tech Stack](#-tech-stack)
- [Data Flow](#-data-flow)
- [API Reference](#-api-reference)
- [Database Models](#-database-models)
- [Setup & Installation](#-setup--installation)
- [Environment Variables](#-environment-variables)
- [Deployment](#-deployment)
- [Build History](#-build-history)

---

## 💡 The Idea

SUSANTEDIT started as a simple problem: selling Free Fire gaming panels and diamond top-ups in Nepal required manually handling every order through WhatsApp — no tracking, no automation, no professional storefront.

**The goal:** Build a complete business platform that:
- Shows products professionally with pricing, images, and packages
- Lets users pay via eSewa or Bank Transfer (Nepal's dominant payment methods)
- Gives the admin a dashboard to verify payments and deliver keys
- Keeps users engaged with gamification so they come back
- Generates passive revenue through ads while VIP users pay to remove them
- Works on mobile (most Nepali users are on phones)

What started as "just a store" evolved into a full platform with XP systems, spin wheels, referral networks, gift sending, AI chat support, push notifications, order chat, product ratings, conversion funnels, and more.

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENT (React)                        │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────────┐  │
│  │ Landing  │  │  User    │  │  Admin   │  │  Profile   │  │
│  │  Page    │  │Dashboard │  │Dashboard │  │ Settings   │  │
│  └──────────┘  └──────────┘  └──────────┘  └────────────┘  │
│         │            │              │               │        │
│         └────────────┴──────────────┴───────────────┘        │
│                              │                               │
│                         api.js (fetch)                       │
└──────────────────────────────┼──────────────────────────────┘
                               │ HTTPS
┌──────────────────────────────┼──────────────────────────────┐
│                    SERVER (Node.js + Express)                 │
│                              │                               │
│  ┌─────────────────────────────────────────────────────┐    │
│  │                   routes/api.js                      │    │
│  │  /auth  /products  /requests  /gamification          │    │
│  │  /referral  /notifications  /vip  /admin  /ai        │    │
│  │  /wishlist  /checkout  /funnel  /gifts  /push        │    │
│  └─────────────────────────────────────────────────────┘    │
│         │           │            │           │               │
│  ┌──────┴──┐  ┌─────┴──┐  ┌────┴───┐  ┌────┴────┐         │
│  │  Auth   │  │Products│  │Requests│  │Notifs   │         │
│  │Controller│  │Controller│  │Controller│  │Controller│         │
│  └─────────┘  └────────┘  └────────┘  └─────────┘         │
│                              │                               │
│  ┌───────────────────────────┴─────────────────────────┐    │
│  │                    lib/                              │    │
│  │  alerts.js (Discord/Telegram)  fcm.js  webpush.js   │    │
│  │  scheduler.js                                        │    │
│  └─────────────────────────────────────────────────────┘    │
└──────────────────────────────┼──────────────────────────────┘
                               │
┌──────────────────────────────┼──────────────────────────────┐
│                    EXTERNAL SERVICES                          │
│  MongoDB Atlas  │  Firebase  │  Gemini AI  │  Discord/TG    │
└─────────────────────────────────────────────────────────────┘
```

---

## 📁 Project Structure

```
pannelstorewithadmin/
├── client/                          # React frontend (Vite)
│   ├── public/
│   │   ├── sw.js                    # Service Worker (Web Push / VAPID)
│   │   ├── firebase-messaging-sw.js # FCM background notifications
│   │   ├── manifest.json            # PWA manifest
│   │   ├── icon-192.png             # PWA icon
│   │   ├── badge-96.png             # Notification badge
│   │   └── sounds/                  # 7 sound effects
│   └── src/
│       ├── components/
│       │   ├── 3d/                  # Three.js components (EarthGlobe, FloatingDiamond)
│       │   ├── admin/               # NotificationSender
│       │   ├── ads/                 # AdBanner, VipModal
│       │   ├── chat/                # AiChat (Gemini)
│       │   ├── feed/                # KillFeed (FOMO ticker)
│       │   ├── gamification/        # PlayerCard, SpinWheel, FirstBlood, QuickReorder
│       │   ├── notifications/       # NotificationPanel
│       │   ├── shared/              # Button, Input, Badge, Modal, Table, QrDisplay
│       │   ├── timers/              # Countdown
│       │   └── user/                # ReferralShareCard, AvatarUploadCard
│       ├── context/
│       │   └── AuthContext.jsx      # Firebase + JWT auth state
│       ├── firebase/
│       │   └── firebaseConfig.js    # Firebase init + FCM token registration
│       ├── pages/
│       │   ├── admin/
│       │   │   └── AdminDashboardPage.jsx   # 9-tab admin panel
│       │   ├── public/
│       │   │   ├── LandingPage.jsx          # 3D hero, features, FAQ
│       │   │   ├── LoginPage.jsx
│       │   │   ├── RegisterPage.jsx
│       │   │   └── ForgotPasswordPage.jsx
│       │   └── user/
│       │       ├── UserDashboardPage.jsx    # Main user app (Store/History/Squad/Gift)
│       │       ├── OrderHistoryPage.jsx     # Full order history with filters
│       │       └── ProfileSettingsPage.jsx
│       ├── services/
│       │   └── api.js               # All API calls (80+ methods)
│       ├── styles/
│       │   └── global.css           # Dark cyberpunk theme
│       └── utils/
│           ├── helpers.js
│           ├── notify.js            # Toast + browser notifications
│           ├── pushNotifications.js # VAPID subscription
│           └── sounds.js            # Web Audio API sound engine
│
├── server/                          # Node.js + Express backend
│   ├── controllers/
│   │   ├── authController.js        # Register, login, Firebase session
│   │   ├── couponController.js      # Coupon CRUD + validation
│   │   ├── notificationController.js # In-app notifications
│   │   ├── productController.js     # Product CRUD + fallback catalog
│   │   └── requestController.js     # Order lifecycle
│   ├── lib/
│   │   ├── alerts.js                # Discord + Telegram webhooks
│   │   ├── fcm.js                   # Firebase Cloud Messaging
│   │   ├── scheduler.js             # Scheduled notifications engine
│   │   └── webpush.js               # VAPID push notifications
│   ├── middleware/
│   │   └── auth.js                  # JWT + Firebase token verification
│   ├── models/
│   │   ├── AppSettings.js           # Global app config
│   │   ├── Coupon.js                # Discount codes
│   │   ├── Notification.js          # In-app notification history
│   │   ├── Product.js               # Products with packages + ratings
│   │   ├── Request.js               # Orders with chat messages
│   │   └── User.js                  # Users with gamification + wishlist
│   ├── routes/
│   │   └── api.js                   # All 80+ API routes
│   └── scripts/
│       ├── migrateAllProducts.js    # Seed all 22 products to DB
│       ├── seedProducts.js          # Seed 5 new products
│       └── updateProductPrices.js   # Bulk price update
```

---

## 🗺️ Feature Map

### User-Facing Features

| Feature | Status | Description |
|---------|--------|-------------|
| Product Catalog | ✅ | 22 products with packages, images, badges, hype meter |
| Buy Flow | ✅ | 6-step: select → confirm → form → payment → QR → transaction |
| eSewa / Bank QR | ✅ | Dynamic QR codes from admin settings |
| Order Tracking Timeline | ✅ | 4-step visual: Submitted → Review → Approved → Delivered |
| Loot Box Key Reveal | ✅ | Animated box opens to reveal activation key |
| Order Receipt | ✅ | Clean receipt modal with copy button |
| Order History Tab | ✅ | Full history with search, date filter, spend summary |
| Order Chat | ✅ | User ↔ Admin chat per order (Facebook-style bubbles) |
| Product Ratings | ✅ | 1-5 stars + comment (only for verified buyers) |
| Wishlist | ✅ | Server-synced, notified on price drops |
| Quick Reorder | ✅ | One-tap reorder of last purchased product |
| Gift to Friends | ✅ | Pay for product, key delivered to friend's account |
| XP + Rank System | ✅ | Recruit → Soldier → Elite → Legend (based on spend) |
| Daily Check-in | ✅ | 20h cooldown, streak rewards (Rs 50 at 7 days, Rs 200 at 30) |
| Spin Wheel | ✅ | Daily free spin with weighted prizes |
| Referral System | ✅ | 6-char code, Rs 30 per signup that orders |
| Referral Sharing | ✅ | One-tap WhatsApp/TikTok share buttons |
| Squad Leaderboard | ✅ | Top 5 referrers shown publicly |
| Wallet Credits | ✅ | Earned from referrals, streaks, spins, birthday |
| Birthday Bonus | ✅ | Rs 50 wallet credit on birthday (MM-DD profile field) |
| VIP Subscription | ✅ | Rs 199/month removes all ads |
| Profile Avatar | ✅ | Upload profile picture (base64, max 200KB) |
| AI Chat Support | ✅ | Gemini API + local Q&A fallback |
| Push Notifications | ✅ | Web Push (VAPID) + FCM (works when browser closed) |
| PWA Install | ✅ | "Add to Home Screen" banner on mobile |
| Sound Effects | ✅ | 7 sounds wired to real events |
| Kill Feed | ✅ | Fake purchase ticker for FOMO |
| Category Filter | ✅ | Filter 22 products by category |
| Product Search | ✅ | Search by name/description |
| Price Drop Watchlist | ✅ | Server-synced wishlist with notifications |
| Flash Sales | ✅ | Countdown timer on discounted products |
| Coupon Codes | ✅ | Flat/percent discounts with usage limits |

### Admin Features

| Feature | Status | Description |
|---------|--------|-------------|
| Requests Queue | ✅ | Smart priority sort (high value first), search, filter |
| Inline Status Update | ✅ | Change status without opening modal |
| Order Details Modal | ✅ | Full order info + approve/reject/revoke |
| Order Chat (Admin) | ✅ | Reply to user messages with king-style gold bubbles |
| Delete Order | ✅ | Permanently delete any order |
| CSV Export | ✅ | Download all orders as spreadsheet |
| Duplicate TXN Flag | ✅ | Red badge when same transaction ID used twice |
| High-Value Badge | ✅ | 🔥 badge on orders ≥ Rs 500 |
| Product CRUD | ✅ | Add/edit/delete with packages, images, badges |
| Product Reorder | ✅ | ▲▼ arrows to change display order |
| User Management | ✅ | Search, promote/demote admin, ban/unban |
| VIP Manager | ✅ | Grant/revoke VIP with expiry tracking |
| Admin Notes | ✅ | Private notes on any user |
| Coupon Manager | ✅ | Full CRUD with flat/percent, dates, limits |
| Notification Sender | ✅ | Broadcast to all users or specific user |
| Scheduled Notifications | ✅ | Queue future notifications |
| Analytics Dashboard | ✅ | 7-day revenue chart, top products, order stats |
| Conversion Funnel | ✅ | Views → Orders → Accepted per product |
| User Lifetime Value | ✅ | Top 20 customers by total spend |
| Suspicious Orders | ✅ | Auto-flag 3+ orders from same IP/WhatsApp in 1 hour |
| Renewal Reminders | ✅ | Send "expires soon" to users with expiring orders |
| Abandoned Cart Recovery | ✅ | Notify users who opened buy modal but didn't complete |
| Reactivation Campaign | ✅ | Rs 30 credit to inactive users |
| Flash Sale Creator | ✅ | Set discount % and end time per product |
| App Settings | ✅ | Name, tagline, announcement, QR codes, labels |

---

## 🛠️ Tech Stack

### Frontend
| Technology | Purpose |
|-----------|---------|
| React 18 | UI framework |
| Vite 5 | Build tool + dev server |
| Framer Motion | Animations |
| Three.js | 3D landing page graphics |
| Firebase SDK | Google Sign-In + FCM |
| Font Awesome 6 | Icons |
| Orbitron + Rajdhani | Cyberpunk fonts |

### Backend
| Technology | Purpose |
|-----------|---------|
| Node.js + Express | API server |
| MongoDB + Mongoose | Database |
| JWT (jose) | Session tokens |
| bcrypt | Password hashing |
| web-push | VAPID push notifications |
| Firebase Admin | FCM server-side push |
| Nodemailer | Email verification + password reset |
| express-rate-limit | Rate limiting |
| Helmet.js | Security headers |

### External Services
| Service | Purpose | Cost |
|---------|---------|------|
| MongoDB Atlas | Database | Free tier |
| Firebase | Auth + FCM | Free tier |
| Vercel | Frontend hosting | Free |
| Render | Backend hosting | Free tier |
| Discord Webhook | Order alerts | Free |
| Telegram Bot | Order alerts | Free |
| Gemini API | AI chat | Free tier |
| Adsterra | Ad monetization | Revenue share |

---

## 🔄 Data Flow

### Order Lifecycle
```
User selects product
        ↓
Confirms payment window (8AM-10PM)
        ↓
Fills form (name, TikTok, WhatsApp)
        ↓
Chooses payment method (eSewa/Bank)
        ↓
Views QR code → pays externally
        ↓
Enters transaction number
        ↓
Request created in DB (status: "Awaiting review")
        ↓
Discord/Telegram alert sent to admin
        ↓
Admin verifies transaction in eSewa/Bank app
        ↓
Admin enters activation key → approves
        ↓
Status → "Accepted"
        ↓
User notified (in-app + push + browser)
        ↓
User opens loot box → key revealed
        ↓
User can copy, share via WhatsApp/TikTok
        ↓
User can rate product (1-5 stars)
```

### Notification Flow
```
Event occurs (order approved, key delivered, etc.)
        ↓
NotificationHelpers.showNotification() called
        ↓
Notification saved to DB (Notification model)
        ↓
FCM push sent to all user's devices (works when browser closed)
        ↓
VAPID push sent to all subscribed browsers
        ↓
User sees OS-level notification
        ↓
User clicks → opens app at relevant page
        ↓
In-app notification panel shows full history
```

### Gamification Flow
```
User places order
        ↓
XP awarded (10 XP per Rs 100 spent, min 10)
        ↓
totalSpend updated
        ↓
Rank recalculated (Recruit/Soldier/Elite/Legend)
        ↓
Daily check-in available (20h cooldown)
        ↓
Streak incremented → rewards at 7 and 30 days
        ↓
Daily spin wheel (20h cooldown)
        ↓
Referral code shared → friend signs up
        ↓
Friend places order → Rs 30 credited to referrer
        ↓
At 10 referrals → Partner badge unlocked
```

---

## 📡 API Reference

### Authentication (8 routes)
```
POST /api/auth/register          Create account
POST /api/auth/login             Login with email/password
POST /api/auth/logout            Clear session
GET  /api/auth/me                Get current user
GET  /api/auth/verify-email      Verify email token
POST /api/auth/forgot-password   Request password reset
POST /api/auth/reset-password    Reset with token
POST /api/auth/firebase          Firebase Google Sign-In
PATCH /api/auth/profile          Update profile fields
PATCH /api/auth/avatar           Upload avatar (base64)
```

### Products (6 routes)
```
GET    /api/products             List all (sorted by sortOrder)
POST   /api/products             Create (admin)
PUT    /api/products/:id         Update (admin)
DELETE /api/products/:id         Delete (admin)
PATCH  /api/products/reorder     Reorder products (admin)
POST   /api/products/:id/rate    Rate product (verified buyers only)
GET    /api/products/:id/ratings Get ratings
POST   /api/products/:id/view    Track view (conversion funnel)
```

### Orders / Requests (6 routes)
```
GET    /api/requests             List (mine or all for admin)
POST   /api/requests             Create order
PATCH  /api/requests/:id/status  Update status (admin)
PATCH  /api/requests/:id/revoke  Revoke approval (admin)
DELETE /api/requests/:id         Delete order (admin)
GET    /api/requests/:id/messages  Get order chat
POST   /api/requests/:id/messages  Send chat message
GET    /api/requests/check-duplicate  Check txn ID
```

### Gamification (4 routes)
```
GET  /api/gamification/profile   XP, rank, streak, wallet
POST /api/gamification/checkin   Daily check-in
POST /api/gamification/spin      Daily spin wheel
POST /api/gamification/birthday-check  Birthday wallet credit
```

### Notifications (7 routes)
```
GET   /api/notifications         Get user notifications
PATCH /api/notifications/read    Mark as read
PATCH /api/notifications/read-all  Mark all read
PATCH /api/notifications/:id/click  Track click
POST  /api/admin/notifications/send  Broadcast (admin)
GET   /api/admin/notifications/stats  Stats (admin)
POST  /api/admin/notifications/schedule  Schedule (admin)
```

### Admin Tools (10 routes)
```
GET  /api/admin/analytics        Revenue, top products, stats
GET  /api/admin/funnel           Conversion funnel per product
GET  /api/admin/user-ltv         Top customers by lifetime value
GET  /api/admin/suspicious       Suspicious orders (same IP/WA)
GET  /api/admin/export/orders    CSV export of all orders
POST /api/admin/ban              Ban user
POST /api/admin/unban            Unban user
PATCH /api/admin/users/:id/notes  Save admin notes on user
POST /api/admin/send-renewal-reminders  Send expiry reminders
POST /api/admin/send-abandoned-recovery  Abandoned cart recovery
POST /api/admin/reactivate       Send Rs 30 to inactive users
```

### Other Routes
```
GET  /api/referral/my-code       Get/generate referral code
GET  /api/referral/stats         Wallet, count, badge
GET  /api/referral/leaderboard   Top 5 referrers
POST /api/referral/apply         Apply referral code

GET  /api/wishlist               Get user wishlist
POST /api/wishlist/toggle        Add/remove from wishlist

POST /api/vip/request            Submit VIP payment proof
POST /api/vip/grant              Grant VIP (admin)
POST /api/vip/revoke             Revoke VIP (admin)

POST /api/ai/chat                Gemini AI proxy
POST /api/checkout/start         Track checkout start (abandoned cart)

GET  /api/push/vapid-public-key  VAPID key for subscription
POST /api/push/subscribe         Subscribe to push
POST /api/push/register          Register FCM token
```

---

## 🗄️ Database Models

### User
```javascript
{
  name, email, passwordHash, role,           // Core
  emailVerified, firebaseUid,                // Auth
  referralCode, walletBalance, couponBalance, // Economy
  referralCount, referredBy, partnerBadge,   // Referral
  xp, totalSpend,                            // Gamification
  streakCount, lastCheckIn,                  // Streaks
  lastSpinAt,                                // Spin wheel
  vipExpiresAt,                              // VIP
  isBanned, banReason,                       // Moderation
  wishlist,                                  // Wishlist
  adminNotes,                                // Admin private notes
  fcmTokens, pushSubscriptions,              // Push notifications
  profile: { uid, gameId, tiktok, whatsapp, birthday, avatarUrl }
}
```

### Request (Order)
```javascript
{
  userId, userName, tikTok, whatsapp,        // User info
  product, packageName, packagePrice,        // Product info
  paymentMethod, transaction, status,        // Payment
  couponCode, discountAmount, finalPrice,    // Discounts
  notes,                                     // Delivery key
  expiryTime,                                // 2-hour payment window
  ip,                                        // Anti-fraud
  messages: [{ from, text, createdAt }],     // Order chat
  isGift, giftSenderId, giftFrom,            // Gift orders
}
```

### Product
```javascript
{
  name, category, price, status,             // Core
  description, img, badge,                   // Display
  packages: [{ label, price, originalPrice }], // Pricing tiers
  ratings: [{ userId, stars, comment }],     // Reviews
  avgRating, ratingCount,                    // Aggregated
  viewCount, orderCount,                     // Conversion tracking
  sortOrder,                                 // Admin ordering
}
```

### Notification
```javascript
{
  userId, title, message, type,              // Content
  read, clickedAt,                           // Tracking
  deepLink,                                  // Navigation
  createdAt
}
```

---

## ⚙️ Setup & Installation

### Prerequisites
- Node.js 18+
- MongoDB Atlas account (free)
- Firebase project (free)

### 1. Clone & Install
```bash
git clone https://github.com/susantedit/pannelstorewithadmin.git
cd pannelstorewithadmin

# Install server dependencies
cd server && npm install

# Install client dependencies
cd ../client && npm install
```

### 2. Configure Environment
```bash
# Server
cp server/.env.example server/.env
# Fill in: MONGO_URI, JWT_SECRET, FIREBASE_*, DISCORD_WEBHOOK_URL, etc.

# Client
cp client/.env.example client/.env
# Fill in: VITE_API_URL, VITE_FIREBASE_*, VITE_FIREBASE_VAPID_KEY
```

### 3. Seed Products
```bash
cd server
node scripts/migrateAllProducts.js
```

### 4. Bootstrap Admin
```bash
# Set ADMIN_EMAIL in server/.env
# Sign in with Google on the frontend
# Visit: http://localhost:3000/api/auth/bootstrap-admin
```

### 5. Run Development
```bash
# Terminal 1 — Backend
cd server && npm run dev

# Terminal 2 — Frontend
cd client && npm run dev
```

---

## 🔐 Environment Variables

### Server (`server/.env`)
```env
# Database
MONGO_URI=mongodb+srv://...

# Auth
JWT_SECRET=your-secret-key
ADMIN_EMAIL=admin@gmail.com

# Firebase Admin (for FCM push)
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@...
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n..."

# Alerts
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/...
TELEGRAM_BOT_TOKEN=7123456789:AAF...
TELEGRAM_CHAT_ID=123456789

# Email (Nodemailer)
EMAIL_HOST=smtp.gmail.com
EMAIL_USER=your@gmail.com
EMAIL_PASS=app-password

# AI
GEMINI_API_KEY=AIza...

# Push (VAPID)
VAPID_PUBLIC_KEY=BIuIXGF2...
VAPID_PRIVATE_KEY=...
VAPID_SUBJECT=mailto:admin@susantedit.com

# App
CLIENT_URL=https://pannelstorewithadmin.vercel.app
PORT=3000
```

### Client (`client/.env`)
```env
VITE_API_URL=https://your-backend.onrender.com
VITE_FIREBASE_API_KEY=AIza...
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc123
VITE_FIREBASE_VAPID_KEY=BIuIXGF2...
```

---

## 🚀 Deployment

### Frontend → Vercel
1. Connect GitHub repo to Vercel
2. Set root directory to `client`
3. Build command: `npm run build`
4. Add all `VITE_*` environment variables
5. Deploy

### Backend → Render
1. Create new Web Service on Render
2. Connect GitHub repo
3. Root directory: `server`
4. Build command: `npm install`
5. Start command: `node index.js`
6. Add all server environment variables
7. Deploy

### Database → MongoDB Atlas
1. Create free cluster
2. Create database user
3. Whitelist `0.0.0.0/0` for Render
4. Copy connection string to `MONGO_URI`

---

## 📈 Build History

| Phase | Features Added |
|-------|---------------|
| Phase 1 | Core store, product catalog, buy flow, admin queue |
| Phase 2 | Admin dashboard (8 tabs), product CRUD, analytics |
| Phase 3 | XP/Rank system, daily check-in, spin wheel, first blood |
| Phase 4 | Referral codes, squad leaderboard, gift to friends |
| Phase 5 | VIP subscription, Adsterra ads, ad-free toggle |
| Phase 6 | AI chat (Gemini), kill feed, sounds, 3D landing page |
| Phase 7 | Discord/Telegram alerts, email/IP anti-spam |
| Phase 8 | FCM push notifications, VAPID web push |
| Phase 9 | Product category filter, order search, birthday celebration |
| Phase 10 | User ban system, order delete, order chat, PWA |
| Phase 11 | Smart priority sort, key security (removed from Discord) |
| Phase 12 | Product ratings, order timeline, CSV export, LTV, funnel |
| Phase 13 | Suspicious order detection, VIP revoke, product reorder |
| Phase 14 | Wishlist (server-synced), order receipt, duplicate TXN detector |
| Phase 15 | Renewal reminders, abandoned cart recovery, admin notes |
| Phase 16 | Order history tab, referral sharing, avatar upload |

---

## 🔒 Security

- **Rate limiting**: Global (200/15min), auth (5/15min), registration (3/hour), AI (10/min)
- **Input validation**: All fields trimmed, length-limited, type-cast
- **CORS**: Restricted to `CLIENT_URL` in production
- **Helmet.js**: Security headers on all responses
- **bcrypt**: Password hashing (cost factor 12)
- **JWT**: 7-day session tokens (httpOnly cookies)
- **Email verification**: Required before login
- **Account lockout**: 5 failed attempts → 15-minute lockout
- **Admin protection**: Role-based middleware on all admin routes
- **Key security**: Activation keys never sent to Discord/Telegram
- **Duplicate detection**: Same transaction ID blocked server-side
- **IP tracking**: Stored per order for fraud detection
- **User ban**: Banned users blocked from placing orders

---

## 📱 PWA Support

The app is installable as a Progressive Web App:
- **Manifest**: `/public/manifest.json` with icons, theme color, shortcuts
- **Service Worker**: Handles push notifications in background
- **Install prompt**: Shows "Add to Home Screen" banner on mobile Chrome/Edge
- **Offline**: Basic caching via service worker

---

*Built with ❤️ for the Nepali gaming community by SUSANTEDIT*
