import express from 'express';
import { AppDataSource } from './data-source';
import authRoutes from './routes/auth-routes';
import userRoutes from './routes/user-routes';
import { startGrpcServer } from './grpc/grpc-server';
import startAllConsumers from './messaging/kafka/consumers';
import dns from 'dns';
dns.setDefaultResultOrder('ipv4first');
import cors from "cors";

const app = express();

const allowedOrigins = (process.env.CORS_ORIGINS || process.env.FRONTEND_URL || "http://localhost:5173")
  .split(',')
  .map(o => o.trim())
  .filter(Boolean);

app.use(cors({
  origin: (origin, cb) => {
    if (!origin) return cb(null, true);
    if (allowedOrigins.includes(origin) || allowedOrigins.includes('*')) return cb(null, true);
    return cb(new Error(`CORS blocked for origin: ${origin}`));
  },
  credentials: true,
}));

app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'auth-service', timestamp: new Date().toISOString() });
});

app.use('/auth', authRoutes);
app.use('/user', userRoutes);

const PORT = parseInt(process.env.PORT || '3000', 10);
const ENABLE_GRPC = process.env.ENABLE_GRPC !== 'false';

AppDataSource.initialize()
  .then(() => {
    console.log("Data Source has been initialized!");

    const server = app.listen(PORT, () => {
      console.log(`Auth Microservice is running on port ${PORT}`);
    });

    server.on('error', (err) => {
      console.error("Server error:", err);
    });

    if (ENABLE_GRPC) {
      startGrpcServer();
    } else {
      console.log('[auth-service] gRPC disabled (using HTTP /user/internal/exists for cross-service calls)');
    }

    // Start Kafka email verification consumer only when Kafka is enabled (e.g. ENABLE_KAFKA=true)
    if (process.env.ENABLE_KAFKA === 'true' || process.env.ENABLE_KAFKA === '1') {
      startAllConsumers();
    } else {
      console.log('[auth-service] Kafka disabled (set ENABLE_KAFKA=true when Kafka is running)');
    }
  })
  .catch((err) => {
    console.error("Error during Data Source initialization:", err);
  });