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
  }
];

export async function listProducts(_req, res) {
  const readyState = Product.db?.readyState;
  const shouldUseDb = readyState === 1;

  if (!shouldUseDb) {
    return res.json({ ok: true, products: fallbackProducts });
  }

  try {
    const products = await Product.find().sort({ createdAt: -1 }).lean();
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
