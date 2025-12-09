import express, { Express, Request, Response } from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import dotenv from "dotenv";

// Import configurations
import { connectDatabase } from "./config/database";

// Import middleware
import { errorHandler } from "./middleware/error.middleware";
import { socketAuthMiddleware } from "./socket/socket.middleware";

// Import socket handlers
import { setupSocketHandlers } from "./socket/socket.handler";

// Import routes
import chatRoutes from "./routes/chat.routes";
import messageRoutes from "./routes/message.routes";

// Load environment variables
dotenv.config();

// Initialize Express app
const app: Express = express();
const PORT = process.env.CHAT_SERVICE_PORT || 3001;

// Create HTTP server (needed for Socket.IO)
const httpServer = createServer(app);

// Initialize Socket.IO server
const io = new Server(httpServer, {
  cors: {
    origin: process.env.WEBSOCKET_CORS_ORIGIN || "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true,
  },
  transports: ["websocket", "polling"], // Support both transports
});

// ===== MIDDLEWARE SETUP =====

// CORS middleware for REST API
app.use(
  cors({
    origin: process.env.WEBSOCKET_CORS_ORIGIN || "http://localhost:5173",
    credentials: true,
  })
);

// Body parser middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get("/health", (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: "Chat service is running",
    timestamp: new Date().toISOString(),
  });
});

// ===== ROUTES SETUP =====

// API routes
app.use("/api/chats", chatRoutes);
app.use("/api/messages", messageRoutes);

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
    code: "ROUTE_NOT_FOUND",
  });
});

// Error handler (must be last)
app.use(errorHandler);

// ===== SOCKET.IO SETUP =====

// Apply authentication middleware to Socket.IO
io.use(socketAuthMiddleware);

// Setup socket event handlers
setupSocketHandlers(io);

// ===== DATABASE CONNECTION =====

// Connect to MongoDB
connectDatabase()
  .then(() => {
    console.log("✅ MongoDB connected successfully");
  })
  .catch((error) => {
    console.error("❌ Failed to connect to MongoDB:", error);
    process.exit(1);
  });

// ===== SERVER STARTUP =====

// Start HTTP server (includes Socket.IO)
httpServer.listen(PORT, () => {
  console.log(`🚀 Chat Service running on port ${PORT}`);
  console.log(`📡 Socket.IO server ready`);
  console.log(`🌐 CORS enabled for: ${process.env.WEBSOCKET_CORS_ORIGIN || "http://localhost:5173"}`);
  console.log(`📝 REST API: http://localhost:${PORT}/api`);
  console.log(`💚 Health check: http://localhost:${PORT}/health`);
});

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("SIGTERM signal received: closing HTTP server");
  httpServer.close(() => {
    console.log("HTTP server closed");
    process.exit(0);
  });
});

process.on("SIGINT", () => {
  console.log("SIGINT signal received: closing HTTP server");
  httpServer.close(() => {
    console.log("HTTP server closed");
    process.exit(0);
  });
});

