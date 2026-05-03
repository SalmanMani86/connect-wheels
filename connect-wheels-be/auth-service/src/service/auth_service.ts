import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "crypto";

import { AppDataSource } from "../data-source";
import { User } from "../entity/user";
import { CreateUserDTO } from "../dtos/createUserDto";
import { LoginUserDTO } from "../dtos/loginUserDto";
import { publishEvent } from "../../../common/messaging/kafka/producer";
import { AUTH_EMAIL_VERIFICATION } from "../../../common/messaging/kafka/topics";
import { sendPasswordResetEmail, sendVerificationEmail } from "./email-service";

const JWT_SECRET: string = process.env.JWT_SECRET || "dev-only-insecure-secret-change-me";

if (!process.env.JWT_SECRET) {
  console.warn("[auth-service] WARNING: JWT_SECRET env var is not set. Using insecure dev default.");
}

export const registerUser = async (user: CreateUserDTO) => {
  const registerStarted = Date.now();
  const emailNormalized = user.email?.trim().toLowerCase();
  console.log("[auth] registerUser start", {
    email: emailNormalized,
    kafkaEnabled: process.env.ENABLE_KAFKA === "true" || process.env.ENABLE_KAFKA === "1",
  });
  try {
    const userRepo = AppDataSource.getRepository(User);

    const hashStarted = Date.now();
    user.password = await bcrypt.hash(user.password, 10);
    console.log("[auth] password hashed", { durationMs: Date.now() - hashStarted });

    const verificationToken = crypto.randomBytes(32).toString("hex");
    const tokenExpiresAt = new Date(Date.now() + 1000 * 60 * 60); // 1 hour

    const newUser = userRepo.create({
      ...user,
      isEmailVerified: false,
      emailVerificationToken: verificationToken,
      emailVerificationTokenExpiresAt: tokenExpiresAt,
    });
    const saveStarted = Date.now();
    await userRepo.save(newUser);
    console.log("[auth] user row saved", {
      userId: newUser.id,
      email: newUser.email,
      durationMs: Date.now() - saveStarted,
    });

    const baseUrl = process.env.FRONTEND_VERIFY_EMAIL_URL || "http://localhost:5173/verify-email";
    const verifyLink = `${baseUrl}?token=${verificationToken}`;

    if (process.env.ENABLE_KAFKA === "true" || process.env.ENABLE_KAFKA === "1") {
      // With Kafka: publish event; the email-verification-consumer sends the email.
      const kafkaStarted = Date.now();
      await publishEvent(AUTH_EMAIL_VERIFICATION, {
        userId: newUser.id,
        email: newUser.email,
        token: verificationToken,
      });
      console.log("[auth] Kafka publish AUTH_EMAIL_VERIFICATION", {
        userId: newUser.id,
        durationMs: Date.now() - kafkaStarted,
      });
    } else {
      // Without Kafka: send the email directly so registration still works.
      console.log("[auth] Kafka disabled – sending verification email directly", {
        userId: newUser.id,
        email: newUser.email,
      });
      const mailStarted = Date.now();
      try {
        await sendVerificationEmail(newUser.email, verifyLink);
        console.log("[auth] sendVerificationEmail finished ok", {
          userId: newUser.id,
          durationMs: Date.now() - mailStarted,
        });
      } catch (mailErr: any) {
        console.error("[auth] sendVerificationEmail failed after direct send attempt", {
          userId: newUser.id,
          email: newUser.email,
          durationMs: Date.now() - mailStarted,
          message: mailErr?.message,
          code: mailErr?.code,
        });
        console.log("[auth] Verification link (manual fallback — use if email did not arrive):", verifyLink);
      }
    }

    console.log("[auth] registerUser complete", {
      userId: newUser.id,
      totalDurationMs: Date.now() - registerStarted,
    });
    return { message: "Registered Successfully. Please verify your email." };
  } catch (error: any) {
    console.error("registerUser error:", error);
    // Re-throw with a structured shape so the controller can map to a proper HTTP status.
    if (error?.code === "23505") {
      // Postgres unique_violation
      const dupErr: any = new Error("An account with this email already exists.");
      dupErr.status = 409;
      dupErr.code = "EMAIL_TAKEN";
      throw dupErr;
    }
    throw error;
  }
};

export const verifyEmail = async (token: string) => {
  const userRepo = AppDataSource.getRepository(User);

  const user = await userRepo.findOne({
    where: { emailVerificationToken: token },
  });

  if (!user) {
    return { success: false, message: "Invalid verification token" };
  }

  if (
    user.emailVerificationTokenExpiresAt &&
    user.emailVerificationTokenExpiresAt < new Date()
  ) {
    return { success: false, message: "Verification token has expired" };
  }

  user.isEmailVerified = true;
  user.emailVerificationToken = null;
  user.emailVerificationTokenExpiresAt = null;
  await userRepo.save(user);

  return { success: true, message: "Email verified successfully" };
};

export const requestPasswordReset = async (email: string) => {
  const normalizedEmail = email.trim().toLowerCase();
  const userRepo = AppDataSource.getRepository(User);
  const user = await userRepo.findOne({ where: { email: normalizedEmail } });
  const genericMessage = "If an account exists for this email, a password reset link has been sent.";

  // Avoid revealing whether the email exists.
  if (!user || !user.password) {
    return { message: genericMessage };
  }

  const resetToken = crypto.randomBytes(32).toString("hex");
  user.resetPasswordToken = resetToken;
  user.resetPasswordTokenExpiresAt = new Date(Date.now() + 1000 * 60 * 15); // 15 minutes
  await userRepo.save(user);

  const baseUrl = process.env.FRONTEND_RESET_PASSWORD_URL || "http://localhost:5173/reset-password";
  const resetLink = `${baseUrl}?token=${resetToken}`;

  try {
    await sendPasswordResetEmail(user.email, resetLink);
  } catch (mailErr: any) {
    console.error("[auth] sendPasswordResetEmail failed:", mailErr?.message || mailErr);
    console.log("[auth] Password reset link (manual):", resetLink);
  }

  return { message: genericMessage };
};

export const resetPassword = async (token: string, password: string) => {
  const userRepo = AppDataSource.getRepository(User);
  const user = await userRepo.findOne({ where: { resetPasswordToken: token } });

  if (!user) {
    return { success: false, message: "Invalid or expired reset token." };
  }

  if (user.resetPasswordTokenExpiresAt && user.resetPasswordTokenExpiresAt < new Date()) {
    user.resetPasswordToken = null;
    user.resetPasswordTokenExpiresAt = null;
    await userRepo.save(user);
    return { success: false, message: "Password reset link has expired." };
  }

  user.password = await bcrypt.hash(password, 10);
  user.resetPasswordToken = null;
  user.resetPasswordTokenExpiresAt = null;
  await userRepo.save(user);

  return { success: true, message: "Password reset successfully. You can now log in." };
};

export const loginUser = async (userDto: LoginUserDTO) => {
  const userRepository = AppDataSource.getRepository(User);

  const existingUser = await userRepository.findOne({
    where: { email: userDto.email },
  });
  if (!existingUser?.password) {
    const error = new Error("Invalid email or password") as Error & { status?: number; code?: string };
    error.status = 401;
    error.code = "INVALID_CREDENTIALS";
    throw error;
  }

  const isPasswordValid = await bcrypt.compare(
    userDto.password,
    existingUser.password
  );
  if (!isPasswordValid) {
    const error = new Error("Invalid email or password") as Error & { status?: number; code?: string };
    error.status = 401;
    error.code = "INVALID_CREDENTIALS";
    throw error;
  }

  if (!existingUser.isEmailVerified && !existingUser.googleId) {
    const error = new Error("Email not verified") as Error & { status?: number; code?: string };
    error.status = 403;
    error.code = "EMAIL_NOT_VERIFIED";
    throw error;
  }

  const token = jwt.sign(
    { userId: existingUser.id, email: existingUser.email },
    JWT_SECRET,
    { expiresIn: "1h" }
  );

  return {
    message: "Login successful",
    token,
    userId: existingUser.id,
    email: existingUser.email,
  };
};

const generateJWT = (user: User) => {
  return jwt.sign(
    { userId: user.id, role: user.role },
    JWT_SECRET,
    { expiresIn: "1h" }
  );
};

const authService = {
  registerUser,
  loginUser,
  verifyEmail,
  requestPasswordReset,
  resetPassword,
  generateJWT,
};

export default authService;
