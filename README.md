# ⚔️ SUSANTEDIT — Elite Gaming Services Platform

> **Nepal's premium Free Fire gaming services store** — panels, diamond top-ups, memberships, and more. Built from scratch as a full-stack web application with manual payment verification, gamification, AI chat, and ad monetization.

---

## 💡 The Idea

SUSANTEDIT started as a simple problem: selling Free Fire gaming panels and diamond top-ups in Nepal required manually handling every order through WhatsApp — no tracking, no automation, no professional storefront.

The goal was to build a **complete business platform** that:
- Shows products professionally with pricing and images
- Lets users pay via eSewa or Bank Transfer (Nepal's dominant payment methods)
- Gives the admin a dashboard to verify payments and deliver keys
- Keeps users engaged with gamification so they come back
- Generates passive revenue through ads while VIP users pay to remove them
- Works on mobile (most Nepali users are on phones)

What started as "just a store" evolved into a full platform with XP systems, spin wheels, referral networks, gift sending, AI chat support, and more — all built iteratively based on what would actually make users spend more and return more often.

---

## 🏗️ How It Was Built

### Phase 1 — Core Store
The foundation: product catalog, purchase flow, admin approval queue.

Users browse products → fill a form → scan a QR code → pay → enter transaction number → admin manually verifies in eSewa/Bank app → delivers the activation key.

This mirrors how the business already worked on WhatsApp, but now it's tracked, organized, and professional.

### Phase 2 — Admin Dashboard
The admin needed full control without touching code:
- Manage products (add/edit/delete with packages and images)
- Review and approve/reject payment requests
- Deliver keys via a loot box reveal (gamified key delivery)
- Manage coupons and referral codes
- View analytics (revenue, top products, order stats)
- Upload QR codes for eSewa and Bank (drag & drop)
- Set announcements, form labels, contact info

### Phase 3 — Gamification
To increase retention and repeat purchases:
- **XP + Rank system**: Recruit → Soldier → Elite → Legend based on total spend
- **Daily check-in streaks**: Rs 50 reward at 7 days, Rs 200 at 30 days
- **Spin wheel**: Daily free spin with weighted prizes (60% try again, 30% 20XP, 0.5% Rs 50 wallet, ultra-rare jackpot)
- **First Blood overlay**: Celebration animation on first ever order
- **Player card**: Shows rank, XP bar, wallet balance, streak
- **Achievement badges**: Top Buyer, Big Spender, Streak Master, Partner
- **Loss aversion hooks**: "Your 5-day streak resets tonight!" banners

### Phase 4 — Social & Referral
To grow the user base organically:
- **Referral codes**: Share your code, earn Rs 30 per signup that orders
- **Squad leaderboard**: Top referrers shown publicly
- **Partner badge**: Earned at 10 referrals
- **Gift to friends**: Pay for a product, key delivered to friend's account
- **WhatsApp share**: One-tap share of activation key
- **TikTok share**: Pre-filled caption for viral content

### Phase 5 — Monetization
Two revenue streams beyond product sales:
- **Adsterra ads**: Gaming-friendly ad network (AdSense rejects cheat/panel content). Ads shown on landing page, dashboard, and after purchase.
- **VIP subscription**: Rs 199/month removes all ads. Admin manually verifies payment and grants VIP. VIP users get a ⭐ badge and zero ads.

### Phase 6 — Polish & UX
Everything that makes it feel like a real product:
- Dark cyberpunk theme (Orbitron + Rajdhani fonts, red accent)
- Kill feed ticker (bottom left, shows fake purchase activity to create FOMO)
- 7 sound effects wired to real events (order placed, key delivered, spin tick, etc.)
- Background ambient music toggle (cyberpunk loop)
- AI support chat (local Q&A engine, instant, no API cost)
- Price drop watchlist with browser notifications
- "You might like" recommendations based on order history
- Birthday wallet credit (Rs 100 on your birthday)
- Payment window check (shows green/red based on user's local time)
- QR zoom + download on every payment screen

---

## 🔐 Security Architecture

### Authentication
- **Firebase Google Sign-In** for the primary auth flow — no passwords to manage for most users
- **JWT sessions** stored in httpOnly cookies (never accessible to JavaScript)
- **bcrypt** (cost factor 12) for password hashing on email/password accounts
- **Account lockout**: 5 failed login attempts → 15-minute lockout
- **Email verification**: Required before login on production (auto-bypassed in dev)
- **Password reset tokens**: SHA-256 hashed, expire in 1 hour
- **Session expiry**: 7-day JWT with automatic expiry

### Authorization
- Every protected route goes through `requireAuth` middleware
- Admin routes additionally require `requireAdmin`
- Users can only read/modify their own requests (ownership enforced in queries)
- Admin can see all requests only when `scope=all` is explicitly passed
- VIP grant endpoint is admin-only

### Input Validation
- All user input is cast to string and trimmed before use
- Email validated with regex before any DB query
- Password length enforced (8–128 chars)
- Status updates validated against an allowlist
- Package prices stripped of non-numeric characters
- Coupon codes uppercased and length-limited
- Profile fields sliced to max length (80 chars)
- Payment method restricted to enum values only

### Rate Limiting
- Global: 200 requests per 15 minutes per IP
- Auth endpoints: 5 requests per 15 minutes per IP
- Registration: 3 accounts per hour per IP
- Application-level lockout on repeated failed logins

### Secrets Management
- All secrets in `.env` files, never in code
- `client/.env` in `.gitignore` (Firebase keys, ad keys)
- `server/.env` in `.gitignore` (MongoDB URI, JWT secret, Gemini key)
- Frontend only receives sanitized user objects — no password hashes, no tokens
- Gemini API key only used server-side (proxied through `/api/ai/chat`)
- HTTPS enforced in production via redirect middleware

### Other
- Helmet.js security headers on all responses
- CORS restricted to `CLIENT_URL` in production
- Morgan request logging for audit trail
- Firebase token verified via public JWKS (no service account file needed)

---

## 🛠️ Tech Stack

### Frontend
| Package | Purpose |
|---|---|
| React 18 | UI framework |
| Vite | Build tool + dev server |
| React Router v6 | Client-side routing |
| Firebase SDK | Google Sign-In |

### Backend
| Package | Purpose |
|---|---|
| Express | HTTP server |
| Mongoose | MongoDB ODM |
| bcryptjs | Password hashing |
| jsonwebtoken | JWT session tokens |
| cookie-parser | httpOnly cookie handling |
| helmet | Security headers |
| cors | Cross-origin policy |
| express-rate-limit | Rate limiting |
| morgan | Request logging |
| nodemailer | Email (verification, reset) |
| jose | Firebase JWKS verification |

### Infrastructure
| Service | Purpose |
|---|---|
| MongoDB Atlas | Database |
| Firebase Auth | Google Sign-In |
| Render | Server hosting |
| Vercel | Client hosting |
| Adsterra | Ad monetization |

---

## 📁 Project Structure

```
susantedit/
├── client/                          # React + Vite frontend
│   ├── public/
│   │   ├── sounds/                  # Audio files
│   │   │   ├── ambient-loop.mp3     # Background music
│   │   │   ├── ui-click.mp3         # Button click
│   │   │   ├── order-placed.mp3     # Order submitted
│   │   │   ├── key-unlock.mp3       # Key delivered
│   │   │   ├── rank-up.mp3          # Rank/level up
│   │   │   ├── killfeed-pop.mp3     # Kill feed entry
│   │   │   └── spin-tick.mp3        # Spin wheel
│   │   ├── payment.jpeg             # eSewa QR code
│   │   ├── bank.jpg                 # NMB Bank QR code
│   │   ├── eswalogo.png             # eSewa logo
│   │   ├── nmblogo.webp             # NMB Bank logo
│   │   └── logo.png                 # App logo
│   └── src/
│       ├── components/
│       │   ├── ads/
│       │   │   ├── AdBanner.jsx     # Adsterra/AdSense integration
│       │   │   └── VipModal.jsx     # VIP subscription flow
│       │   ├── chat/
│       │   │   └── AiChat.jsx       # Local Q&A support chat
│       │   ├── feed/
│       │   │   └── KillFeed.jsx     # Purchase activity ticker
│       │   ├── gamification/
│       │   │   ├── SpinWheel.jsx    # Daily spin wheel
│       │   │   ├── PlayerCard.jsx   # XP/rank display
│       │   │   ├── FirstBlood.jsx   # First order celebration
│       │   │   └── QuickReorder.jsx # Reorder last purchase
│       │   ├── modals/
│       │   │   └── Modal.jsx        # Reusable modal (scrollable)
│       │   └── shared/
│       │       ├── Button.jsx
│       │       ├── Input.jsx
│       │       ├── Badge.jsx
│       │       ├── Table.jsx
│       │       ├── Icons.jsx
│       │       ├── QrDisplay.jsx    # QR with zoom + download
│       │       └── SupportFab.jsx   # WhatsApp floating button
│       ├── context/
│       │   └── AuthContext.jsx      # User session + isAdmin + isVip
│       ├── firebase/
│       │   └── firebaseConfig.js    # Firebase init + Google sign-in
│       ├── pages/
│       │   ├── admin/
│       │   │   └── AdminDashboardPage.jsx  # Full admin panel
│       │   ├── public/
│       │   │   ├── LandingPage.jsx
│       │   │   ├── LoginPage.jsx
│       │   │   ├── RegisterPage.jsx
│       │   │   └── ForgotPasswordPage.jsx
│       │   └── user/
│       │       ├── UserDashboardPage.jsx   # Store + Squad + Gift tabs
│       │       └── ProfileSettingsPage.jsx
│       ├── services/
│       │   └── api.js               # All API calls (fetch wrapper)
│       └── utils/
│           ├── sounds.js            # Web Audio API + file-based sounds
│           ├── notify.js            # Toast + browser notifications
│           └── helpers.js           # Date formatting, ID generation
│
└── server/                          # Express backend
    ├── config/
    │   └── db.js                    # MongoDB connection
    ├── controllers/
    │   ├── authController.js        # Register, login, Firebase, reset
    │   ├── requestController.js     # Order CRUD + VIP auto-grant
    │   ├── productController.js     # Product CRUD
    │   └── couponController.js      # Coupon validation + rewards
    ├── lib/
    │   └── firebaseAdmin.js         # Firebase token verification (JWKS)
    ├── middleware/
    │   └── auth.js                  # requireAuth, requireAdmin, requireVerifiedEmail
    ├── models/
    │   ├── User.js                  # User schema (XP, wallet, VIP, streak)
    │   ├── Request.js               # Order schema (gift fields, coupon fields)
    │   ├── Product.js               # Product + packages schema
    │   ├── Coupon.js                # Coupon schema
    │   └── AppSettings.js           # Singleton settings (QR codes, labels)
    ├── routes/
    │   └── api.js                   # All routes (auth, products, requests, gamification, VIP, gifts, AI)
    ├── scripts/
    │   └── makeAdmin.js             # CLI script to promote user to admin
    └── server.js                    # Express app entry point
```

---

## ⚙️ Local Development

### Prerequisites
- Node.js 18+
- MongoDB Atlas account (free tier works)
- Firebase project with Google Sign-In enabled

### 1. Clone and install
```bash
git clone https://github.com/susantedit/pannelstorewithadmin
cd susantedit
npm run install:all
```

### 2. Server environment (`server/.env`)

Copy `server/.env.example` to `server/.env` and fill in your values. See `.env.example` for all required keys:
- MongoDB Atlas connection string
- JWT secret (generate a strong 64-char random string)
- Firebase project ID
- Admin email
- Optional: Gemini API key, SMTP settings for email

### 3. Client environment (`client/.env`)

Copy `client/.env.example` to `client/.env` and fill in your values. See `.env.example` for all required keys:
- Firebase config (API key, auth domain, project ID, etc.)
- Adsterra publisher key and zone script URLs
- Payment details (eSewa number, bank name, account number)

### 4. Run
```bash
# Terminal 1
cd server && node server.js

# Terminal 2
cd client && npm run dev
```

### 5. Make yourself admin
Sign in with Google first, then visit:
```
http://localhost:3000/api/auth/bootstrap-admin
```

---

## 🚀 Deployment

### Server → Render
1. New Web Service → connect GitHub repo
2. Root directory: `server` | Build: `npm install` | Start: `node server.js`
3. Add env vars in Render dashboard (all `server/.env` values)
4. Set `NODE_ENV=production`, `CLIENT_URL=https://your-vercel-app.vercel.app`

### Client → Vercel
1. New Project → connect GitHub repo
2. Root directory: `client` | Framework preset: Vite
3. Add env vars in Vercel dashboard (all `client/.env` values)
4. Set `VITE_API_URL=https://your-render-app.onrender.com`

### Post-deploy
```
https://your-render-app.onrender.com/api/auth/bootstrap-admin
```
Visit once to promote your Google account to admin.

Then go to **Admin → Settings** to:
- Upload your eSewa and NMB Bank QR codes
- Set your announcement banner
- Add your products

---

## 💰 Ad Monetization Setup

**Why Adsterra and not AdSense:** Google AdSense explicitly bans sites that sell game cheats or hacking tools. Adsterra has no such restriction and performs well for gaming traffic.

1. Sign up at [publishers.adsterra.com](https://publishers.adsterra.com)
2. Deploy your site first, then add your live domain
3. Wait for approval (24–48 hours)
4. Create 4 banner zones → copy each script URL
5. Add to Vercel env vars → redeploy

VIP users (Rs 199/month) see zero ads. Admin grants VIP after verifying payment in the Requests queue.

---

## 🎮 Admin Order Workflow

```
User submits order
       ↓
Appears in Admin → Requests tab (highlighted if VIP)
       ↓
Admin opens request → verifies transaction in eSewa/Bank app
       ↓
For normal orders: enters activation key → Approve & Send
For VIP orders: clicks Approve — Grant VIP (auto-grants 1 month)
       ↓
Key delivered to user's loot box (animated reveal)
User can copy key, share on WhatsApp, share on TikTok
```

---

## 🔊 Sound System

All sounds use real audio files from `client/public/sounds/`. If a file is missing, that sound silently skips — nothing breaks.

| File | Trigger | Volume |
|---|---|---|
| `ambient-loop.mp3` | 🎵 button in topbar | 18% (fade in/out) |
| `ui-click.mp3` | Buy Now button | 50% |
| `order-placed.mp3` | Order submitted | 80% |
| `key-unlock.mp3` | Key delivered | 90% |
| `rank-up.mp3` | Spin win / level up | 85% |
| `killfeed-pop.mp3` | Kill feed new entry | 35% |
| `spin-tick.mp3` | Spin wheel (slows down) | 40% |

---

## 🎰 Spin Wheel Odds

| Prize | Probability | Real frequency |
|---|---|---|
| 😅 Try Again | 60% | 6 in 10 spins |
| ⚡ 20 XP | 30% | 3 in 10 spins |
| ✨ 5 XP | 9.5% | ~1 in 10 spins |
| 💰 Rs 50 Wallet | 0.5% | ~once every 2 months (daily spinner) |
| 🏆 JACKPOT Rs 50 | 1×10⁻⁴³ | ~1–2 times per year across ALL users |

---

## 📞 Contact

- **WhatsApp:** [+977 9708838261](https://wa.me/9779708838261)
- **Email:** susantedit@gmail.com
- **TikTok:** [@vortexeditz34](https://tiktok.com/@vortexeditz34)
- **Instagram:** [@susantgamerz](https://instagram.com/susantgamerz)
- **YouTube:** [@yubrajedit1](https://youtube.com/@yubrajedit1)

---

## ⚠️ Disclaimer

This platform is built for educational and business management purposes. The operator is responsible for ensuring compliance with local laws and platform terms of service. The developer is not responsible for how the platform is used.

---

*Built with ❤️ for SUSANTEDIT — Nepal's elite Free Fire gaming services platform*
