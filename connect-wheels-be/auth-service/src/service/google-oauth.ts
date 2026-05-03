import { googleAuthConfig } from "../config/google-oauth-config";
import { User } from "../entity/user";
import { AppDataSource } from "../data-source";
import https from "https";
import { URLSearchParams } from "url";
import dns from "dns";

// Force IPv4
dns.setDefaultResultOrder("ipv4first");

// Step 1: Generate Google OAuth URL
export const getGoogleAuthUrl = () => {
  const params = new URLSearchParams({
    client_id: googleAuthConfig.clientId!,
    redirect_uri: googleAuthConfig.redirectUri!,
    response_type: "code",
    scope: "profile email",
    access_type: "offline",
  });

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
};

// Direct HTTPS request function
const httpsRequest = (options: any, postData?: string): Promise<any> => {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        console.log("Response status:", res.statusCode);
        console.log("Response data:", data);

        try {
          const result = JSON.parse(data);
          if (res.statusCode! >= 400) {
            reject(
              new Error(
                `HTTP ${res.statusCode}: ${
                  result.error_description || result.error || "Unknown error"
                }`
              )
            );
          } else {
            resolve(result);
          }
        } catch (error) {
          reject(new Error(`Invalid JSON response: ${data}`));
        }
      });
    });

    req.on("error", (err) => {
      console.log("Request error:", err);
      reject(err);
    });
    req.on("timeout", () => {
      console.log("Request timed out");
      reject(new Error("Request timeout"));
    });
    req.setTimeout(20000); // 20 second timeout

    if (postData) {
      req.write(postData);
    }
    req.end();
  });
};

export const handleGoogleCallback = async (code: string) => {
  try {
    const tokenData = new URLSearchParams({
      client_id: googleAuthConfig.clientId!,
      client_secret: googleAuthConfig.clientSecret!,
      code: code,
      grant_type: "authorization_code",
      redirect_uri: googleAuthConfig.redirectUri!,
    }).toString();

    const tokenOptions = {
      hostname: "oauth2.googleapis.com",
      port: 443,
      path: "/token",
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Content-Length": Buffer.byteLength(tokenData),
        "User-Agent": "Connect-Wheels-Auth/1.0.0",
      },
      family: 4, // Force IPv4
    };

    const tokens = await httpsRequest(tokenOptions, tokenData);
    console.log("Token exchange successful");

    // Get user info using access token
    const userInfoOptions = {
      hostname: "www.googleapis.com",
      port: 443,
      path: "/oauth2/v2/userinfo",
      method: "GET",
      headers: {
        Authorization: `Bearer ${tokens.access_token}`,
        "User-Agent": "Connect-Wheels-Auth/1.0.0",
      },
      family: 4,
    };

    const userInfo = await httpsRequest(userInfoOptions);
    console.log("User info retrieved:", userInfo.email);

    const userRepo = AppDataSource.getRepository(User);
    let user = await userRepo.findOne({ where: { googleId: userInfo.id } });

    if (!user) {
      console.log("Creating new user...");
      user = userRepo.create({
        googleId: userInfo.id,
        email: userInfo.email,
        googleRefreshToken: tokens.refresh_token,
        firstName: userInfo.given_name,
        lastName: userInfo.family_name,
        isEmailVerified: true,
      });
      await userRepo.save(user);
      console.log("New user created:", user.email);
    } else {
      console.log("Existing user found:", user.email);
      // Also update refresh token for existing users
      user.googleRefreshToken = tokens.refresh_token;
      user.isEmailVerified = true;
      await userRepo.save(user);
    }

    return { user, tokens };
  } catch (error: any) {
    console.error("Google callback error:", {
      message: error.message,
      code: error.code,
    });
    throw new Error("Failed to process Google authentication");
  }
};
