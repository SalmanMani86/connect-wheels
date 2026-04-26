import express from 'express';
import path from 'path';
import { AppDataSource } from './data-source';
import routes from './routes';
import rateLimit from 'express-rate-limit';

// --- Server lifecycle logging ---
console.log('[garage-service] Starting...');

process.on('uncaughtException', (err) => {
  console.error('[garage-service] uncaughtException:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('[garage-service] unhandledRejection at:', promise, 'reason:', reason);
});

process.on('beforeExit', (code) => {
  console.log('[garage-service] beforeExit, code:', code);
});

process.on('exit', (code) => {
  console.log('[garage-service] exit, code:', code);
});

const app = express();
const PORT = parseInt(process.env.PORT || '3002', 10);

app.set('trust proxy', 1);

app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'garage-service',
    timestamp: new Date().toISOString(),
  });
});

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000,                 // 1000 requests per window per IP
  message: 'Too many requests, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.ip === '127.0.0.1' || req.ip === '::1', // no limit for localhost
});

app.use(express.json());
app.use(limiter);

// Serve uploaded files (gateway: /api/garage/uploads/* -> garage /api/uploads/*)
app.use('/api/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Mount all garage + car routes at /api (for API Gateway: /api/garage/* → /api/*)
app.use('/api', routes);

console.log('[garage-service] Initializing Data Source...');
AppDataSource.initialize()
  .then(() => {
    console.log('[garage-service] Data Source initialized.');
    const server = app.listen(PORT, () => {
      console.log('[garage-service] Server listening on port', PORT);
      console.log('[garage-service] API: http://localhost:' + PORT + '/api/*');
    });
    server.on('close', () => console.log('[garage-service] Server closed.'));
    server.on('error', (err) => console.error('[garage-service] Server error:', err));
    // startAllConsumers() - uncomment when Kafka is ready
  })
  .catch((err) => {
    console.error('[garage-service] Data Source initialization failed:', err);
    process.exitCode = 1;
  });