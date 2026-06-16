import { Router, Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || "fallback_secret_for_development_change_it_immediately";
const TOKEN_COOKIE_NAME = "auth_token";

const getCookieOptions = () => {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds (Express cookie maxAge is in ms)
    path: "/",
  };
};

// POST /api/auth/login
router.post("/login", async (req: Request, res: Response): Promise<any> => {
  try {
    const { email, password } = req.body;
    console.log("[auth/login] request received", {
      hasEmail: Boolean(email),
      hasPassword: Boolean(password),
      origin: req.headers.origin,
      host: req.headers.host,
      cookieHeaderPresent: Boolean(req.headers.cookie),
      nodeEnv: process.env.NODE_ENV || "development",
    });

    if (!email || !password) {
      console.warn("[auth/login] missing credentials", {
        hasEmail: Boolean(email),
        hasPassword: Boolean(password),
      });
      return res.status(400).json({ error: "Email and password are required" });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      console.warn("[auth/login] user not found", { email: email.toLowerCase() });
      return res.status(401).json({ error: "Invalid email or password" });
    }

    if (!user.isActive) {
      console.warn("[auth/login] inactive user", {
        userId: String(user._id),
        email: user.email,
      });
      return res.status(403).json({
        error: "Your account is deactivated. Please contact the administrator.",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password || "");
    if (!isMatch) {
      console.warn("[auth/login] invalid password", {
        userId: String(user._id),
        email: user.email,
      });
      return res.status(401).json({ error: "Invalid email or password" });
    }

    // Create token
    const token = jwt.sign(
      {
        userId: String(user._id),
        email: user.email,
        role: user.role,
        organizationId: user.organizationId,
      },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    // Set cookie and return user info
    const cookieOptions = getCookieOptions();
    res.cookie(TOKEN_COOKIE_NAME, token, cookieOptions);
    console.log("[auth/login] success, cookie queued", {
      userId: String(user._id),
      email: user.email,
      role: user.role,
      cookieName: TOKEN_COOKIE_NAME,
      cookieOptions,
    });

    return res.status(200).json({
      message: "Login successful",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        organizationId: user.organizationId,
      },
    });
  } catch (error) {
    console.error("Login API Error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/auth/logout
router.post("/logout", (req: Request, res: Response) => {
  try {
    res.clearCookie(TOKEN_COOKIE_NAME, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax" as const,
      path: "/",
    });
    return res.status(200).json({ message: "Logout successful" });
  } catch (error) {
    console.error("Logout API Error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
