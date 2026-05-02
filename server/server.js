import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { fileURLToPath } from 'url';
import connectDb from './config/db.js';
import apiRoutes from './routes/api.js';
import { startScheduler } from './lib/scheduler.js';

dotenv.config();

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const clientBuildDir = path.join(__dirname, '..', 'client', 'dist');
const port = process.env.PORT || 3000;
const isProduction = process.env.NODE_ENV === 'production';

app.set('trust proxy', 1);
// Helmet with COOP disabled — Firebase Google popup requires same-origin opener access
app.use(helmet({
  crossOriginOpenerPolicy: false
}));
app.use(morgan('combined'));

// Log authentication attempts and errors
app.use((req, _res, next) => {
  if (req.path.startsWith('/api/auth/')) {
    console.log(`[auth-attempt] ${req.method} ${req.path} ip=${req.ip} ua=${req.headers['user-agent']?.slice(0,80) || 'unknown'}`);
  }
  next();
});
app.use(cors({
  origin: process.env.CLIENT_URL || true,
  credentials: true
}));
app.use(cookieParser());
app.use(express.json({ limit: '1mb' }));

app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { ok: false, message: 'Too many requests' }
}));

app.use((req, res, next) => {
  if (isProduction && req.headers['x-forwarded-proto'] !== 'https') {
    return res.redirect(301, `https://${req.headers.host}${req.originalUrl}`);
  }

  next();
});
app.use('/api', apiRoutes);

app.get('/', (_req, res) => {
  res.json({
    ok: true,
    name: 'Smart Payment Request System API',
    message: 'Backend is running and ready for the React client.'
  });
});

if (isProduction) {
  app.use(express.static(clientBuildDir));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(clientBuildDir, 'index.html'));
  });
}

app.use((_, res) => {
  res.status(404).json({ ok: false, message: 'Not found' });
});

app.use((error, _req, res, _next) => {
  console.error('[api-error]', error);
  res.status(500).json({ ok: false, message: 'Internal server error' });
});

connectDb()
  .then(() => {
    console.log('MongoDB connected.');
    startScheduler(); // start auto notifications after DB is ready
  })
  .catch((error) => {
    console.warn('Mongo connection failed, running without database.', error.message);
    startScheduler(); // still start scheduler (will skip DB ops gracefully)
  });

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
