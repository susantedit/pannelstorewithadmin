import Product from '../models/Product.js';

const fallbackProducts = [
  {
    id: 'dc',
    name: 'DRIP CLINT',
    category: 'Performance',
    price: 'From Rs 299',
    status: 'Available',
    img: 'https://i.postimg.cc/Jnwh1T2q/Screenshot-20260421-102516.jpg',
    description: 'DRIP CLIENT package tiers with fast manual approval and premium support.',
    packages: [
      { label: '1 Day Trial', price: '299', originalPrice: '499' },
      { label: '3 Days', price: '499', originalPrice: '799' },
      { label: '7 Days', price: '799', originalPrice: '1,299' },
      { label: '15 Days', price: '899', originalPrice: '1,499' },
      { label: '30 Days Premium', price: '1,399', originalPrice: '2,199' }
    ]
  },
  {
    id: 'hg',
    name: 'HG CHEATS',
    category: 'Performance',
    price: 'From Rs 399',
    status: 'Available',
    img: 'https://i.postimg.cc/fRGsXVfy/Screenshot-20260421-102611.jpg',
    description: 'Pro edition packages with regular updates and premium support.',
    packages: [
      { label: '1 Day Trial', price: '399', originalPrice: '649' },
      { label: '3 Days', price: '699', originalPrice: '1,099' },
      { label: '7 Days', price: '1,199', originalPrice: '1,899' },
      { label: '15 Days', price: '1,599', originalPrice: '2,499' },
      { label: '30 Days Elite', price: '1,899', originalPrice: '2,999' }
    ]
  },
  {
    id: 'ios',
    name: 'IOS FLUORITE',
    category: 'iOS Premium',
    price: 'From Rs 699',
    status: 'Limited',
    img: 'https://i.postimg.cc/R07kHX0k/fluorite-ios-ff-og-1765886845.webp',
    description: 'Premium iOS package with certificate and long-duration options.',
    packages: [
      { label: '1 Day Trial', price: '699', originalPrice: '1,099' },
      { label: '7 Days', price: '1,499', originalPrice: '2,299' },
      { label: '30 Days', price: '5,999', originalPrice: '6,999' },
      { label: 'Certificate Only', price: '999', originalPrice: '1,499' },
      { label: 'Special Offer (Cert + 32 Days)', price: '6,500', originalPrice: '9,999' }
    ]
  },
  {
    id: 'ph',
    name: 'PRIME HOOK',
    category: 'Performance',
    price: 'Contact for price',
    status: 'Available',
    img: 'https://i.postimg.cc/x8ChBQPd/IMG-20260421-102934-585.jpg',
    description: 'Premium package with manual review and custom pricing.',
    packages: []
  },
  {
    id: 'pt',
    name: 'PATO TEAM',
    category: 'Team Package',
    price: 'From Rs 699',
    status: 'Available',
    img: 'https://i.postimg.cc/RV2ypjJM/Screenshot-20260421-102813.jpg',
    description: 'Team-oriented package tiers with verified-safe setup.',
    packages: [
      { label: '3 Days', price: '699', originalPrice: '1,099' },
      { label: '7 Days', price: '1,199', originalPrice: '1,899' },
      { label: '15 Days', price: '1,599', originalPrice: '2,499' },
      { label: '30 Days Premium', price: '1,899', originalPrice: '2,999' }
    ]
  },
  {
    id: 'dm',
    name: 'DIAMOND',
    category: 'Top-up',
    price: 'From Rs 60',
    status: 'Available',
    img: 'diamond.webp',
    description: 'Free Fire diamond top-ups with multiple denominations.',
    packages: [
      { label: '50 Diamonds', price: '60' },
      { label: '115 Diamonds', price: '110' },
      { label: '240 Diamonds', price: '230' },
      { label: '355 Diamonds', price: '250' },
      { label: '480 Diamonds', price: '450' },
      { label: '610 Diamonds', price: '580' },
      { label: '725 Diamonds', price: '680' },
      { label: '850 Diamonds', price: '780' },
      { label: '1090 Diamonds', price: '950' },
      { label: '1240 Diamonds', price: '1,100' },
      { label: '2530 Diamonds', price: '2,200' }
    ]
  },
  {
    id: 'wl',
    name: 'WEEKLY LITE',
    category: 'Top-up',
    price: 'Rs 90',
    status: 'Available',
    img: 'weeklylite.webp',
    description: 'Weekly Lite top-up membership.',
    packages: [{ label: 'Weekly Lite', price: '90' }]
  },
  {
    id: 'wk',
    name: 'WEEKLY',
    category: 'Top-up',
    price: 'Rs 220',
    status: 'Available',
    img: 'weekly.webp',
    description: 'Weekly member top-up membership.',
    packages: [{ label: 'Weekly Member', price: '220' }]
  },
  {
    id: 'mn',
    name: 'MONTHLY',
    category: 'Top-up',
    price: 'Rs 1,050',
    status: 'Available',
    img: 'monthly.webp',
    description: 'Monthly member top-up membership.',
    packages: [{ label: 'Monthly Member', price: '1,050' }]
  },
  {
    id: '4k-panel',
    name: '4K PANEL',
    category: 'Performance',
    price: 'Rs 4,000',
    status: 'Available',
    img: 'head.jpg',
    badge: 'BEST VALUE',
    description: '1 full year access — no domain required. One-time payment, lifetime-style value. Includes all updates for the year.',
    packages: [
      { label: '1 Year (No Domain Required)', price: '4,000', originalPrice: '9,999' }
    ]
  },
  {
    id: 'rank-push',
    name: 'RANK PUSHING',
    category: 'Rank Boost',
    price: 'From Rs 50',
    status: 'Available',
    img: 'rankpush.webp',
    badge: 'FAST 🚀',
    description: 'Professional rank boosting service. Fast completion in 2–6 hours by verified pro players. Safe rank boost with no risk.',
    features: ['Fast 🚀 Completed in 2–6 hours', 'Professional players', 'Safe rank boost', 'Fast completion'],
    packages: [
      { label: '25 Stars Rank Push', price: '50', originalPrice: '100' }
    ]
  },
  {
    id: 'drag-headshot',
    name: 'DRAG HEADSHOT',
    category: 'Android Panel',
    price: 'From Rs 899',
    status: 'Available',
    img: 'head.jpg',
    badge: 'ANDROID ⚡',
    description: 'Precision aim assist panel for Android. Activated in 5–10 minutes. Valid until next update. Android optimized.',
    features: ['Android ⚡ Activated in 5–10 minutes', 'Precision aim assist', 'Valid until update', 'Android optimized'],
    packages: [
      { label: 'Drag Headshot Access', price: '899', originalPrice: '1,299' }
    ]
  },
  {
    id: 'redmi-poco',
    name: 'REDMI / POCO PANEL',
    category: 'Android Panel',
    price: 'From Rs 899',
    status: 'Available',
    img: 'head.jpg',
    badge: 'RECOMMENDED',
    description: 'Optimized panel specifically tuned for Redmi and POCO devices. Instant activation.',
    packages: [
      { label: 'Redmi / POCO Access', price: '899', originalPrice: '1,299' }
    ]
  },
  {
    id: 'gula-v3',
    name: 'GULA PANEL V3',
    category: 'Android Panel',
    price: 'From Rs 999',
    status: 'Available',
    img: 'head.jpg',
    badge: 'UPGRADED',
    description: 'Enhanced V3 edition of the popular Gula Panel. More features, better stability.',
    packages: [
      { label: 'Gula Panel V3 Access', price: '999', originalPrice: '1,499' }
    ]
  },
  {
    id: 'aim-silent-redmi',
    name: 'AIM SILENT (REDMI)',
    category: 'Android Panel',
    price: 'From Rs 999',
    status: 'Available',
    img: 'head.jpg',
    badge: 'TOP RATED',
    description: 'Precision silent aim panel optimized for Redmi devices. High accuracy, low detection risk.',
    packages: [
      { label: 'Aim Silent Redmi Access', price: '999', originalPrice: '1,499' }
    ]
  },
  {
    id: 'aim-silent-all',
    name: 'AIM SILENT (ALL DEVICES)',
    category: 'Android Panel',
    price: 'From Rs 1,099',
    status: 'Available',
    img: 'head.jpg',
    badge: 'PREMIUM',
    description: 'Universal silent aim panel — works on all Android devices. Maximum compatibility.',
    packages: [
      { label: 'Aim Silent Universal Access', price: '1,099', originalPrice: '1,599' }
    ]
  },
  {
    id: 'proxy-panel',
    name: 'PROXY PANEL',
    category: 'Android Panel',
    price: 'From Rs 899',
    status: 'Available',
    img: 'head.jpg',
    badge: 'SECURE',
    description: 'Secure proxy-based panel for maximum safety. Routes through secure servers to minimize detection.',
    packages: [
      { label: 'Proxy Panel Basic', price: '899', originalPrice: '1,299' },
      { label: 'Proxy Panel Pro', price: '1,099', originalPrice: '1,599' },
      { label: 'Proxy Panel Elite', price: '1,299', originalPrice: '1,899' }
    ]
  }
];

export async function listProducts(_req, res) {
  const readyState = Product.db?.readyState;
  const shouldUseDb = readyState === 1;

  if (!shouldUseDb) {
    return res.json({ ok: true, products: fallbackProducts });
  }

  try {
    const products = await Product.find().sort({ sortOrder: 1, createdAt: -1 }).lean();
    // If DB is empty, serve the fallback catalog so the UI always has data
    if (!products || products.length === 0) {
      return res.json({ ok: true, products: fallbackProducts });
    }
    res.json({ ok: true, products });
  } catch {
    res.json({ ok: true, products: fallbackProducts });
  }
}

export async function createProduct(req, res) {
  if (!isDbReady()) {
    return res.status(503).json({ ok: false, message: 'Database required for product management' });
  }
  const { name, category, price, status, description, img, packages } = req.body || {};
  if (!name || !price) {
    return res.status(400).json({ ok: false, message: 'Name and price are required' });
  }
  const product = await Product.create({ name, category, price, status, description, img, packages: packages || [] });
  res.status(201).json({ ok: true, product });
}

export async function updateProduct(req, res) {
  if (!isDbReady()) {
    return res.status(503).json({ ok: false, message: 'Database required for product management' });
  }
  const { id } = req.params;
  const updates = req.body || {};
  const product = await Product.findByIdAndUpdate(id, updates, { new: true, runValidators: true }).lean();
  if (!product) return res.status(404).json({ ok: false, message: 'Product not found' });
  res.json({ ok: true, product });
}

export async function deleteProduct(req, res) {
  if (!isDbReady()) {
    return res.status(503).json({ ok: false, message: 'Database required for product management' });
  }
  const { id } = req.params;
  const product = await Product.findByIdAndDelete(id).lean();
  if (!product) return res.status(404).json({ ok: false, message: 'Product not found' });
  res.json({ ok: true, message: 'Product deleted' });
}

function isDbReady() {
  return Product.db?.readyState === 1;
}
