// ============================================
import { Request, Response, NextFunction } from "express";

/**
 * Global error handler middleware
 * Place this at the end of app.ts after all routes
 */
export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  console.error("Error:", err);
  res.status(500).json({
    success: false,
    message: err.message || "Internal Server Error",
    code: "INTERNAL_SERVER_ERROR",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
};
