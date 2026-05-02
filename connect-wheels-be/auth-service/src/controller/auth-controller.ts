import { Request, Response } from "express";
import { validationResult } from "express-validator";

import authService from "../service/auth_service";
import { CreateUserDTO, toCreateUserDTO } from "../dtos/createUserDto";
import { LoginUserDTO, toLoginUserDTO } from "../dtos/loginUserDto";
import {
  handleGoogleCallback as processGoogleCallback,
  getGoogleAuthUrl as generateGoogleAuthUrl,
} from "../service/google-oauth";

const registerUser = async (req: Request, res: Response) => {
  // Validation request inputs
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const user: CreateUserDTO = toCreateUserDTO(req.body);
  try {
    const result = await authService.registerUser(user);
    return res.status(201).json({ message: result.message });
  } catch (error: any) {
    console.error("register user", error);
    const status = typeof error?.status === "number" ? error.status : 500;
    return res.status(status).json({
      message: error?.message || "Error registering user",
      code: error?.code,
    });
  }
};

const loginUser = async (req: Request, res: Response) => {
  // Validation request inputs
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const user: LoginUserDTO = toLoginUserDTO(req.body);

  try {
    const result = await authService.loginUser(user);
    return res.status(200).json({ 
      message: result.message, 
      token: result.token,
      userId: result.userId,
      email: result.email
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ message: "error login user", error: error });
  }
};

const verifyEmail = async (req: Request, res: Response) => {
  try {
    const { token } = req.query;
    console.log("[verifyEmail] incoming request", {
      path: req.path,
      query: req.query,
      token,
    });

    if (!token || typeof token !== "string") {
      console.log("[verifyEmail] missing or invalid token param");
      return res
        .status(400)
        .json({ message: "Verification token is required" });
    }

    const result = await authService.verifyEmail(token);
    console.log("[verifyEmail] service result", result);

    if (!result.success) {
      return res.status(400).json({ message: result.message });
    }

    return res.status(200).json({ message: result.message });
  } catch (error) {
    console.error("[verifyEmail] unexpected error:", error);
    return res.status(500).json({ message: "Error verifying email" });
  }
};

const forgotPassword = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    if (!email || typeof email !== "string") {
      return res.status(400).json({ message: "Email is required" });
    }

    const result = await authService.requestPasswordReset(email);
    return res.status(200).json({ message: result.message });
  } catch (error) {
    console.error("[forgotPassword] unexpected error:", error);
    return res.status(500).json({ message: "Error requesting password reset" });
  }
};

const resetPassword = async (req: Request, res: Response) => {
  try {
    const { token, password } = req.body;
    if (!token || typeof token !== "string") {
      return res.status(400).json({ message: "Reset token is required" });
    }
    if (!password || typeof password !== "string" || password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    const result = await authService.resetPassword(token, password);
    if (!result.success) {
      return res.status(400).json({ message: result.message });
    }
    return res.status(200).json({ message: result.message });
  } catch (error) {
    console.error("[resetPassword] unexpected error:", error);
    return res.status(500).json({ message: "Error resetting password" });
  }
};

// Google OAuth - Get authorization URL
const getGoogleAuthUrl = async (req: Request, res: Response) => {
  try {
    const authUrl = generateGoogleAuthUrl();
    res.json({ authUrl });
  } catch (error) {
    console.error("Google auth URL error:", error);
    res.status(500).json({ error: "Failed to generate Google auth URL" });
  }
};

// Google OAuth - Handle callback
const handleGoogleCallback = async (req: Request, res: Response) => {
  try {
    const { code } = req.query;
    if (!code) {
      return res.status(400).json({ error: "Authorization code is required" });
    }

    const result = await processGoogleCallback(code as string);
    const jwt = authService.generateJWT(result.user);

    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    res.redirect(
      `${frontendUrl}/?token=${jwt}&userId=${result.user.id}&email=${result.user.email}`
    );
  } catch (error) {
    console.error("Google callback error:", error);
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    res.redirect(
      `${frontendUrl}/?message=${encodeURIComponent(
        "Google authentication failed"
      )}`
    );
  }
};

const Authcontroller = {
  registerUser,
  loginUser,
  getGoogleAuthUrl,
  handleGoogleCallback,
  verifyEmail,
  forgotPassword,
  resetPassword,
};

export default Authcontroller;
