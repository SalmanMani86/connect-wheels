import { Socket } from 'socket.io';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-jwt-secret';

if (!process.env.JWT_SECRET) {
  console.warn('⚠️  WARNING: JWT_SECRET not set in environment variables. Using default (insecure for production!)');
}

/**
 * Extended Socket interface with userId
 */
export interface AuthSocket extends Socket {
  userId?: string;
}

/**
 * Socket.IO authentication middleware
 * Verifies JWT token before allowing socket connection
 */
export const socketAuthMiddleware = (
  socket: AuthSocket,
  next: (err?: Error) => void
) => {
  try {
    // Get token from handshake auth or headers
    const token = 
      socket.handshake.auth.token || 
      socket.handshake.headers.authorization?.split(' ')[1];

    if (!token) {
      return next(new Error('Authentication error: Token missing'));
    }

    // Verify JWT token
    const decoded: any = jwt.verify(token, JWT_SECRET);

    if (!decoded.userId) {
      return next(new Error('Authentication error: Invalid token'));
    }

    // Attach userId to socket
    socket.userId = decoded.userId;
    next();
  } catch (err) {
    console.error('Socket authentication error:', err);
    next(new Error('Authentication error: Invalid token'));
  }
};