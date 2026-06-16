import jwt from "jsonwebtoken";
import { NextRequest } from "next/server";

const JWT_SECRET = process.env.JWT_SECRET || "fallback_secret_for_development_change_it_immediately";
const TOKEN_COOKIE_NAME = "auth_token";

export enum UserRole {
  MAIN_ADMIN = "MAIN_ADMIN",
  COLLEGE_ADMIN = "COLLEGE_ADMIN",
}

export interface JWTPayload {
  userId: string;
  email: string;
  role: UserRole;
  organizationId?: string;
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch {
    return null;
  }
}

export function getTokenFromRequest(req: NextRequest): string | null {
  // Check cookies
  const cookieToken = req.cookies.get(TOKEN_COOKIE_NAME)?.value;
  if (cookieToken) return cookieToken;

  // Check Authorization header (Bearer token)
  const authHeader = req.headers.get("authorization");
  if (authHeader && authHeader.startsWith("Bearer ")) {
    return authHeader.substring(7);
  }

  return null;
}
