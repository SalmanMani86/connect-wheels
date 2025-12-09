// 4. src/middleware/auth.middleware.ts
// ============================================
import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || 'your-jwt-secret';

if (!process.env.JWT_SECRET) {
  console.warn('⚠️  WARNING: JWT_SECRET not set in environment variables. Using default (insecure for production!)');
}

/**
 * Extended Request interface with userId
 */
export interface AuthRequest extends Request {
  userId?: string;
}

/**
 * Authentication middleware
 * Verifies JWT token from Authorization header
 * Used with external auth microservice
 */
export const authenticateJWT = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers.authorization;

  // Check if Authorization header exists
  if (!authHeader) {
    res.status(401).json({
      success: false,
      message: "Authorization header missing",
      code: "MISSING_AUTH_HEADER",
    });
    return;
  }

  // Extract token from "Bearer <token>"
  const token = authHeader.split(" ")[1];
  if (!token) {
    res.status(401).json({
      success: false,
      message: "Token is missing from Authorization header",
      code: "MISSING_TOKEN",
    });
    return;
  }

  try {
    // Verify token using same secret as auth service
    const decoded: any = jwt.verify(token, JWT_SECRET);

    // Extract userId from token payload
    if (!decoded.userId) {
      res.status(401).json({
        success: false,
        message: "Invalid token: userId not found",
        code: "INVALID_TOKEN",
      });
      return;
    }

    // Store userId in request for controller access
    req.userId = decoded.userId;
    next();
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      res.status(401).json({
        success: false,
        message: "Token has expired",
        code: "TOKEN_EXPIRED",
      });
    } else if (err instanceof jwt.JsonWebTokenError) {
      res.status(403).json({
        success: false,
        message: "Invalid token",
        code: "INVALID_TOKEN",
      });
    } else {
      res.status(403).json({
        success: false,
        message: "Authentication failed",
        code: "AUTH_FAILED",
      });
    }
  }
};
