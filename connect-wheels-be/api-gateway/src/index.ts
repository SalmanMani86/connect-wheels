import express, { Express, Request, Response, NextFunction } from 'express';
import { createProxyMiddleware, Options } from 'http-proxy-middleware';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { Server } from 'http';

// Load environment variables
dotenv.config();

// Initialize Express app
const app: Express = express();
const PORT: number = parseInt(process.env.PORT || '8080', 10);

// ===== MIDDLEWARE SETUP =====

// Logging
app.use(morgan('dev'));

// CORS - Allow frontend to access API
app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Parse JSON bodies (but exclude proxy routes to avoid consuming request stream)
app.use((req: Request, res: Response, next: NextFunction) => {
  // Skip body parsing for proxy routes - let proxy middleware handle it
  if (req.path.startsWith('/api/') || req.path.startsWith('/socket.io')) {
    return next();
  }
  express.json()(req, res, next);
});

app.use((req: Request, res: Response, next: NextFunction) => {
  if (req.path.startsWith('/api/') || req.path.startsWith('/socket.io')) {
    return next();
  }
  express.urlencoded({ extended: true })(req, res, next);
});

// ===== HEALTH CHECK =====

app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    gateway: 'API Gateway',
    timestamp: new Date().toISOString(),
    services: {
      auth: process.env.AUTH_SERVICE_URL,
      chat: process.env.CHAT_SERVICE_URL,
      garage: process.env.GARAGE_SERVICE_URL,
    },
  });
});

// ===== SERVICE ROUTING =====

// Debug middleware to log all incoming requests
app.use((req: Request, _res: Response, next: NextFunction) => {
  if (req.path.startsWith('/api/')) {
    console.log(`[GATEWAY] Incoming: ${req.method} ${req.path}`);
  }
  next();
});

// Auth Service Proxy
const authProxyOptions: Options = {
  target: process.env.AUTH_SERVICE_URL || 'http://localhost:3000',
  changeOrigin: true,
  timeout: 30000, // 30 second timeout
  proxyTimeout: 30000,
  secure: false, // Allow self-signed certificates
  logLevel: 'debug',
  pathRewrite: {
    '^/api/auth': '/auth', // Replace /api/auth with /auth (auth service uses /auth prefix)
  },
  onProxyReq: (_proxyReq, req: Request) => {
    console.log(
      `[AUTH-SERVICE] ${req.method} ${req.url} → ${process.env.AUTH_SERVICE_URL}${req.url.replace('/api/auth', '/auth')}`
    );
  },
  onProxyRes: (proxyRes, req: Request) => {
    console.log(`[AUTH-SERVICE] Response: ${proxyRes.statusCode} for ${req.method} ${req.url}`);
  },
  onError: (err: Error, req: Request, res: Response) => {
    console.error('[AUTH-SERVICE] Proxy Error:', err.message);
    console.error('[AUTH-SERVICE] Request URL:', req.url);
    if (!res.headersSent) {
      res.status(503).json({
        success: false,
        message: 'Auth service is unavailable',
        error: err.message,
      });
    }
  },
};

app.use('/api/auth', createProxyMiddleware(authProxyOptions));

// User Service Proxy (part of Auth Service)
const userProxyOptions: Options = {
  target: process.env.AUTH_SERVICE_URL || 'http://localhost:3000',
  changeOrigin: true,
  timeout: 30000,
  proxyTimeout: 30000,
  secure: false,
  logLevel: 'debug',
  pathRewrite: {
    '^/api/user': '/user', // Replace /api/user with /user (auth service uses /user prefix)
  },
  onProxyReq: (_proxyReq, req: Request) => {
    console.log(
      `[USER-SERVICE] ${req.method} ${req.url} → ${process.env.AUTH_SERVICE_URL}${req.url.replace('/api/user', '/user')}`
    );
  },
  onProxyRes: (proxyRes, req: Request) => {
    console.log(`[USER-SERVICE] Response: ${proxyRes.statusCode} for ${req.method} ${req.url}`);
  },
  onError: (err: Error, req: Request, res: Response) => {
    console.error('[USER-SERVICE] Proxy Error:', err.message);
    console.error('[USER-SERVICE] Request URL:', req.url);
    if (!res.headersSent) {
      res.status(503).json({
        success: false,
        message: 'User service is unavailable',
        error: err.message,
      });
    }
  },
};

app.use('/api/user', createProxyMiddleware(userProxyOptions));

// Chat Service Proxy (REST API)
const chatProxyOptions: Options = {
  target: process.env.CHAT_SERVICE_URL || 'http://localhost:3001',
  changeOrigin: true,
  pathRewrite: {
    '^/api/chat': '/api', // Keep /api prefix for chat service
  },
  onProxyReq: (_proxyReq, req: Request) => {
    console.log(
      `[CHAT-SERVICE] ${req.method} ${req.url} → ${process.env.CHAT_SERVICE_URL}/api${req.url.replace('/api/chat', '')}`
    );
  },
  onProxyRes: (proxyRes) => {
    console.log(`[CHAT-SERVICE] Response: ${proxyRes.statusCode}`);
  },
  onError: (err: Error, _req: Request, res: Response) => {
    console.error('[CHAT-SERVICE] Proxy Error:', err.message);
    if (!res.headersSent) {
      res.status(503).json({
        success: false,
        message: 'Chat service is unavailable',
        error: err.message,
      });
    }
  },
};

app.use('/api/chat', createProxyMiddleware(chatProxyOptions));

// Socket.IO Proxy (WebSocket for real-time chat)
const socketProxyOptions: Options = {
  target: process.env.CHAT_SERVICE_URL || 'http://localhost:3001',
  changeOrigin: true,
  ws: true, // Enable WebSocket proxying
  logLevel: 'debug',
  onProxyReq: (_proxyReq, req: Request) => {
    console.log(`[SOCKET.IO] ${req.method} ${req.url}`);
  },
  onError: (err: Error, _req: Request, res: Response) => {
    console.error('[SOCKET.IO] Proxy Error:', err.message);
    if (!res.headersSent) {
      res.status(503).json({
        success: false,
        message: 'Socket.IO service is unavailable',
        error: err.message,
      });
    }
  },
};

app.use('/socket.io', createProxyMiddleware(socketProxyOptions));

// Garage Service Proxy
const garageProxyOptions: Options = {
  target: process.env.GARAGE_SERVICE_URL || 'http://localhost:3002',
  changeOrigin: true,
  pathRewrite: {
    '^/api/garage': '/api',
  },
  onProxyReq: (_proxyReq, req: Request) => {
    console.log(
      `[GARAGE-SERVICE] ${req.method} ${req.url} → ${process.env.GARAGE_SERVICE_URL}/api${req.url.replace('/api/garage', '')}`
    );
  },
  onProxyRes: (proxyRes) => {
    console.log(`[GARAGE-SERVICE] Response: ${proxyRes.statusCode}`);
  },
  onError: (err: Error, _req: Request, res: Response) => {
    console.error('[GARAGE-SERVICE] Proxy Error:', err.message);
    if (!res.headersSent) {
      res.status(503).json({
        success: false,
        message: 'Garage service is unavailable',
        error: err.message,
      });
    }
  },
};

app.use('/api/garage', createProxyMiddleware(garageProxyOptions));

// ===== 404 HANDLER =====

app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.url,
  });
});

// ===== ERROR HANDLER =====

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Gateway Error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal gateway error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

// ===== START SERVER =====

const server: Server = app.listen(PORT, () => {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║           🚀 API GATEWAY RUNNING                          ║');
  console.log('╠════════════════════════════════════════════════════════════╣');
  console.log(`║  Port:            ${PORT.toString().padEnd(40)} ║`);
  console.log(
    `║  Environment:     ${(process.env.NODE_ENV || 'development').padEnd(40)} ║`
  );
  console.log('╠════════════════════════════════════════════════════════════╣');
  console.log('║  ROUTES                                                    ║');
  console.log('╠════════════════════════════════════════════════════════════╣');
  console.log(
    `║  Gateway Health:  http://localhost:${PORT}/health`.padEnd(61) + '║'
  );
  console.log(
    `║  Auth API:        http://localhost:${PORT}/api/auth/*`.padEnd(61) + '║'
  );
  console.log(
    `║  User API:        http://localhost:${PORT}/api/user/*`.padEnd(61) + '║'
  );
  console.log(
    `║  Chat API:        http://localhost:${PORT}/api/chat/*`.padEnd(61) + '║'
  );
  console.log(
    `║  Garage API:      http://localhost:${PORT}/api/garage/*`.padEnd(61) + '║'
  );
  console.log(
    `║  Socket.IO:       http://localhost:${PORT}/socket.io`.padEnd(61) + '║'
  );
  console.log('╠════════════════════════════════════════════════════════════╣');
  console.log('║  SERVICES                                                  ║');
  console.log('╠════════════════════════════════════════════════════════════╣');
  console.log(
    `║  Auth Service:    ${(process.env.AUTH_SERVICE_URL || 'http://localhost:3000').padEnd(40)} ║`
  );
  console.log(
    `║  Chat Service:    ${(process.env.CHAT_SERVICE_URL || 'http://localhost:3001').padEnd(40)} ║`
  );
  console.log(
    `║  Garage Service:  ${(process.env.GARAGE_SERVICE_URL || 'http://localhost:3002').padEnd(40)} ║`
  );
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log('\n✅ API Gateway is ready and listening for requests...');
  console.log('💡 Press Ctrl+C to stop the server\n');
}).on('error', (err: NodeJS.ErrnoException) => {
  if (err.code === 'EACCES') {
    console.error('❌ ERROR: Permission denied to bind to port', PORT);
    console.error('💡 Port 80 requires root privileges.');
    console.error('💡 Solutions:');
    console.error('   1. Use a different port (set PORT=8080 in .env)');
    console.error('   2. Run with sudo: sudo npm start');
    console.error(
      "   3. Allow Node to use port 80: sudo setcap 'cap_net_bind_service=+ep' $(which node)"
    );
    process.exit(1);
  } else if (err.code === 'EADDRINUSE') {
    console.error(`❌ ERROR: Port ${PORT} is already in use`);
    console.error('💡 Solutions:');
    console.error('   1. Stop the process using port', PORT);
    console.error('   2. Use a different port (set PORT=8080 in .env)');
    process.exit(1);
  } else {
    console.error('❌ ERROR starting server:', err);
    process.exit(1);
  }
});

// Handle uncaught exceptions
process.on('uncaughtException', (err: Error) => {
  console.error('❌ Uncaught Exception:', err);
  console.error('Stack:', err.stack);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason: unknown, promise: Promise<unknown>) => {
  console.error('❌ Unhandled Rejection at:', promise);
  console.error('Reason:', reason);
  // Don't exit - log and continue
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('\n⚠️  SIGTERM received, shutting down gracefully...');
  server.close(() => {
    console.log('✅ API Gateway closed');
    process.exit(0);
  });

  // Force exit after 10 seconds
  setTimeout(() => {
    console.error('⚠️  Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
});

process.on('SIGINT', () => {
  console.log('\n⚠️  SIGINT received (Ctrl+C), shutting down gracefully...');
  server.close(() => {
    console.log('✅ API Gateway closed');
    process.exit(0);
  });

  // Force exit after 10 seconds
  setTimeout(() => {
    console.error('⚠️  Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
});

