import express from 'express';
import path from 'path';
import { AppDataSource } from './data-source';
import routes from './routes';
import rateLimit from 'express-rate-limit';

const app = express();
const PORT = parseInt(process.env.PORT || '3002', 10);

app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'garage-service',
    timestamp: new Date().toISOString(),
  });
});

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(express.json());
app.use(limiter);

// Serve uploaded files (gateway: /api/garage/uploads/* -> garage /api/uploads/*)
app.use('/api/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Mount all garage + car routes at /api (for API Gateway: /api/garage/* → /api/*)
app.use('/api', routes);

AppDataSource.initialize()
  .then(() => {
    console.log('Data Source has been initialized!');
    app.listen(PORT, () => {
      console.log(`Garage Microservice is running on port ${PORT}`);
      console.log(`API: http://localhost:${PORT}/api/*`);
    });
    // startAllConsumers() - uncomment when Kafka is ready
  })
  .catch((err) => {
    console.error('Error during Data Source initialization:', err);
  });