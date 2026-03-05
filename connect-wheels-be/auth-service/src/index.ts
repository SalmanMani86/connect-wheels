import express from 'express';
import { AppDataSource } from './data-source';
import authRoutes from './routes/auth-routes';
import userRoutes from './routes/user-routes';
import { startGrpcServer } from './grpc/grpc-server';
import dns from 'dns';
dns.setDefaultResultOrder('ipv4first');
import cors from "cors";

const app = express();

// ✅ CORS should be first
app.use(cors({
  origin: "http://localhost:5173", // 👈 remove the trailing slash!
  credentials: true,
}));

app.use(express.json());

app.get('/health', (req, res) => {
  res.send('Auth Microservice is running');
});

app.use('/auth', authRoutes);
app.use('/user', userRoutes);

AppDataSource.initialize()
  .then(() => {
    console.log("Data Source has been initialized!");
    
    const server = app.listen(3000, () => {
      console.log('Auth Microservice is running on port 3000');
    });

    // Move server error handler here
    server.on('error', (err) => {
      console.error("Server error:", err);
    });

    // Start gRPC server (garage service uses this to verify users)
    startGrpcServer();
  })
  .catch((err) => {
    console.error("Error during Data Source initialization:", err);
  });