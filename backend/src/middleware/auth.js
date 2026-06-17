import jwt from "jsonwebtoken";
import User from "../models/User.js";

const JWT_SECRET = process.env.JWT_SECRET || "fallback_secret_for_development_change_it_immediately";
const TOKEN_COOKIE_NAME = "auth_token";

const authenticateUser = async (req, res, next) => {
  try {
    let token = req.cookies[TOKEN_COOKIE_NAME];
    if (!token && req.headers.authorization && req.headers.authorization.startsWith("Bearer ")) {
      token = req.headers.authorization.split(" ")[1];
    }
    if (!token) {
      res.status(401).json({ error: "Access denied. No token provided." });
      return;
    }
    const decoded = jwt.verify(token, JWT_SECRET);
    const userId = decoded.userId || decoded.id || decoded.sub;

    if (!userId) {
      res.status(401).json({ error: "Invalid token: missing user id." });
      return;
    }

    const user = await User.findById(userId).select("email role organizationId isActive isDeleted");
    if (!user || user.isDeleted) {
      res.status(401).json({ error: "User account was not found." });
      return;
    }

    if (!user.isActive) {
      res.status(403).json({ error: "Your account is deactivated. Please contact the administrator." });
      return;
    }

    req.user = {
      userId: String(user._id),
      email: user.email,
      role: user.role,
      organizationId: user.organizationId ? String(user.organizationId) : void 0
    };
    next();
  } catch (error) {
    console.error("Token verification failed:", error);
    res.status(401).json({ error: "Invalid or expired token." });
  }
};
const requireRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      res.status(401).json({ error: "Access denied. User not authenticated." });
      return;
    }
    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        error: "Forbidden: You do not have permission to access this resource.",
        requiredRoles: allowedRoles,
        currentRole: req.user.role
      });
      return;
    }
    next();
  };
};
export {
  authenticateUser,
  requireRole
};
