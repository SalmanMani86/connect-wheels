import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "crypto";

import { AppDataSource } from "../data-source";
import { User } from "../entity/user";
import { CreateUserDTO } from "../dtos/createUserDto";
import { LoginUserDTO } from "../dtos/loginUserDto";
import { publishEvent } from "../../../common/messaging/kafka/producer";
import { AUTH_EMAIL_VERIFICATION } from "../../../common/messaging/kafka/topics";

const JWT_SECRET = "your-jwt-secret";

export const registerUser = async (user: CreateUserDTO) => {
  try {
    const userRepo = AppDataSource.getRepository(User);

    user.password = await bcrypt.hash(user.password, 10);

    const verificationToken = crypto.randomBytes(32).toString("hex");
    const tokenExpiresAt = new Date(Date.now() + 1000 * 60 * 60); // 1 hour

    const newUser = userRepo.create({
      ...user,
      isEmailVerified: false,
      emailVerificationToken: verificationToken,
      emailVerificationTokenExpiresAt: tokenExpiresAt,
    });
    await userRepo.save(newUser);

    if (process.env.ENABLE_KAFKA === "true" || process.env.ENABLE_KAFKA === "1") {
      await publishEvent(AUTH_EMAIL_VERIFICATION, {
        userId: newUser.id,
        email: newUser.email,
        token: verificationToken,
      });
    } else {
      const baseUrl = process.env.FRONTEND_VERIFY_EMAIL_URL || "http://localhost:5173/verify-email";
      console.log("[auth] Kafka disabled – verification link:", `${baseUrl}?token=${verificationToken}`);
    }

    return { message: "Registered Successfully. Please verify your email." };
  } catch (error: any) {
    console.error("registerUser error:", error);
    return { message: "Error registering user", error: error.message };
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

export const loginUser = async (userDto: LoginUserDTO) => {
  try {
    const userRepository = AppDataSource.getRepository(User);

    const existingUser = await userRepository.findOne({
      where: { email: userDto.email },
    });
    if (!existingUser) {
      throw new Error("Invalid credentials");
    }

    const isPasswordValid = await bcrypt.compare(
      userDto.password,
      existingUser.password
    );
    if (!isPasswordValid) {
      throw new Error("Invalid credentials");
    }

    if (!existingUser.isEmailVerified) {
      throw new Error("Email not verified");
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
  } catch (error: any) {
    console.error("loginUser error:", error);
    return { message: "Login failed", error: error.message || error };
  }
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
  generateJWT,
};

export default authService;
