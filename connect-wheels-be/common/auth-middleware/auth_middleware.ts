import { NextFunction, Request, Response } from "express";
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-only-insecure-secret-change-me';

if (!process.env.JWT_SECRET) {
  console.warn('[auth-middleware] WARNING: JWT_SECRET env var is not set. Using insecure dev default.');
}

export interface AuthRequest extends Request {
  user?: any;
}

export const authenticateJWT = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (authHeader) {
    const token = authHeader.split(' ')[1];
    try {
      const user = jwt.verify(token, JWT_SECRET);
      req.user = user;
      next();
    } catch (err) {
      res.status(403).json({ message: 'Invalid or expired token' });
    }
  } else {
    res.status(401).json({ message: 'Authorization header missing' });
  }
};

// Middleware to check user roles
export const authorizeRoles = (roles: string[]) => (req: AuthRequest, res: Response, next: NextFunction) => {
  if (req.user && roles.includes(req.user.role)) {
    next();
  } else {
    return res.status(403).json({ message: 'Forbidden: insufficient permissions' });
  }
};

const middleware = {
  authenticateJWT,
  authorizeRoles
}

export default middleware