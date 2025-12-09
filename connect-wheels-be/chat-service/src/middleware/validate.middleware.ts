// ============================================
// 1. src/middleware/validate.middleware.ts
// ============================================
import { Request, Response, NextFunction } from "express";
import { validationResult, FieldValidationError } from "express-validator";

export const validateRequest = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const errors = validationResult(req);

  // If no errors, continue to controller
  if (errors.isEmpty()) {
    next();
    return;
  }

  // If errors found, reject the request
  const formattedErrors = errors.array().map((error) => {
    const fieldError = error as FieldValidationError;
    return {
      field: fieldError.path,
      message: fieldError.msg,
    };
  });

  res.status(400).json({
    success: false,
    message: "Validation failed",
    errors: formattedErrors,
  });
};
