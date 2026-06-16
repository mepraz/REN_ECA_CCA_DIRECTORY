import { NextRequest, NextResponse } from "next/server";
import { getTokenFromRequest, verifyToken, JWTPayload, UserRole } from "./auth";

/**
 * Retrieves the authenticated user payload from the request.
 * Returns null if not authenticated or token is invalid.
 */
export function getSession(req: NextRequest): JWTPayload | null {
  const token = getTokenFromRequest(req);
  if (!token) return null;
  return verifyToken(token);
}

/**
 * Asserts that the request has a valid session.
 * Returns the session or throws a NextResponse.
 */
export function checkAuth(req: NextRequest): JWTPayload {
  const session = getSession(req);
  if (!session) {
    throw NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return session;
}

/**
 * Checks if the user in the session has one of the required roles.
 * Returns the session or throws a NextResponse.
 */
export function checkRole(req: NextRequest, allowedRoles: UserRole[]): JWTPayload {
  const session = checkAuth(req);
  if (!allowedRoles.includes(session.role as UserRole)) {
    throw NextResponse.json(
      { error: "Forbidden: Access denied" },
      { status: 403 }
    );
  }
  return session;
}

/**
 * Checks if a session has a specific role.
 */
export function isMainAdmin(session: JWTPayload): boolean {
  return session.role === UserRole.MAIN_ADMIN;
}

export function isCollegeAdmin(session: JWTPayload): boolean {
  return session.role === UserRole.COLLEGE_ADMIN;
}

/**
 * Checks if the user is authorized for a specific organization.
 * MAIN_ADMIN can manage all; COLLEGE_ADMIN can only manage their own organization.
 */
export function checkOrganizationAccess(session: JWTPayload, organizationId: string): boolean {
  if (session.role === UserRole.MAIN_ADMIN) return true;
  return session.organizationId === organizationId;
}
