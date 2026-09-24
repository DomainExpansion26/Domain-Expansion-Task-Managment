import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { prisma, withDbRetry } from "./prisma";
import { hasPermission, normalizeRole, Permission, Role, isSuperAdmin, isHRAdmin, isManager, isTeamLead, isQA } from "./permissions";

const JWT_SECRET = process.env.JWT_SECRET || "domain-expansion-super-secret-jwt-key-2026-production";
const COOKIE_NAME = "dx_session_token";

export interface UserSession {
  userId: string;
  email: string;
  name: string;
  role: string;
  ndaAccepted?: boolean;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function signSessionToken(user: { id: string; email: string; name: string; role: string; ndaAccepted?: boolean }): string {
  return jwt.sign(
    {
      userId: user.id,
      email: user.email,
      name: user.name,
      role: normalizeRole(user.role),
      ndaAccepted: Boolean(user.ndaAccepted),
    },
    JWT_SECRET,
    { expiresIn: "7d" }
  );
}

export function verifySessionToken(token: string): UserSession | null {
  try {
    return jwt.verify(token, JWT_SECRET) as UserSession;
  } catch {
    return null;
  }
}

export function signPasswordResetToken(user: { id: string; email: string; passwordHash: string }): string {
  // Signs a token with 1 hour expiration using a dynamic secret that incorporates the user's current passwordHash
  // This automatically invalidates the token once the password is reset!
  const secret = `${JWT_SECRET}:${user.passwordHash}`;
  return jwt.sign(
    {
      userId: user.id,
      email: user.email,
      type: "PASSWORD_RESET",
    },
    secret,
    { expiresIn: "1h" }
  );
}

export function decodePasswordResetToken(token: string): { userId: string; email: string } | null {
  try {
    const decoded = jwt.decode(token) as any;
    if (decoded && decoded.userId && decoded.email) {
      return { userId: decoded.userId, email: decoded.email };
    }
    return null;
  } catch {
    return null;
  }
}

export function verifyPasswordResetToken(token: string, passwordHash: string): { userId: string; email: string } | null {
  try {
    const secret = `${JWT_SECRET}:${passwordHash}`;
    const payload = jwt.verify(token, secret) as any;
    if (payload && payload.type === "PASSWORD_RESET") {
      return { userId: payload.userId, email: payload.email };
    }
    return null;
  } catch {
    return null;
  }
}

export async function getCurrentUserFromRequest(request?: NextRequest) {
  let token: string | undefined;

  if (request) {
    token = request.cookies.get(COOKIE_NAME)?.value;
    if (!token) {
      const authHeader = request.headers.get("authorization");
      if (authHeader?.startsWith("Bearer ")) {
        token = authHeader.substring(7);
      }
    }
  } else {
    try {
      const cookieStore = await cookies();
      token = cookieStore.get(COOKIE_NAME)?.value;
    } catch {
      // Ignore if called outside request context
    }
  }

  if (!token) return null;
  const session = verifySessionToken(token);
  if (!session) return null;

  try {
    const user: any = await withDbRetry(() =>
      (prisma.user as any).findUnique({
        where: { id: session.userId },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          jobTitle: true,
          department: true,
          avatarUrl: true,
          isActive: true,
          accountStatus: true,
          joiningDate: true,
          ndaAccepted: true,
          ndaAcceptedAt: true,
          ndaVersionAccepted: true,
          isEmailVerified: true,
          managerId: true,
          teamLeadId: true,
          manager: { select: { id: true, name: true, email: true } },
          teamLead: { select: { id: true, name: true, email: true } },
          hrProfile: true,
          createdAt: true,
        },
      })
    );

    if (!user || !user.isActive || user.accountStatus === "SUSPENDED" || user.accountStatus === "DISABLED") {
      return null;
    }

    return {
      ...user,
      role: normalizeRole(user.role),
    };
  } catch (err) {
    console.error("getCurrentUserFromRequest error:", err);
    return null;
  }
}

export async function requireAuth(request?: NextRequest, options?: { allowPendingNDA?: boolean }) {
  const user = await getCurrentUserFromRequest(request);
  if (!user) {
    throw new Error("UNAUTHORIZED");
  }
  if (!options?.allowPendingNDA && !user.ndaAccepted && user.role !== "SUPER_ADMIN") {
    const error: any = new Error("NDA_REQUIRED");
    error.code = "NDA_REQUIRED";
    throw error;
  }
  return user;
}

export async function requireUserPermission(permission: Permission, request?: NextRequest) {
  const user = await requireAuth(request);
  if (!hasPermission(user.role, permission)) {
    throw new Error("FORBIDDEN");
  }
  return user;
}

export async function requireRole(allowedRoles: Role[], request?: NextRequest) {
  const user = await requireAuth(request);
  const normalized = normalizeRole(user.role);
  if (normalized === "SUPER_ADMIN") return user; // Super admin has global bypass
  if (!allowedRoles.includes(normalized)) {
    throw new Error("FORBIDDEN");
  }
  return user;
}

export async function requireSuperAdmin(request?: NextRequest) {
  const user = await requireAuth(request);
  if (!isSuperAdmin(user.role)) {
    throw new Error("FORBIDDEN");
  }
  return user;
}

export async function requireHRAdmin(request?: NextRequest) {
  const user = await requireAuth(request);
  if (!isHRAdmin(user.role)) {
    throw new Error("FORBIDDEN");
  }
  return user;
}

export async function requireHRMSActive(request?: NextRequest) {
  const user = await requireAuth(request);
  if (isSuperAdmin(user.role) || isHRAdmin(user.role)) {
    return user;
  }
  const hrmsStatus = user.hrProfile?.status?.toUpperCase();
  if (hrmsStatus !== "ACTIVE" && hrmsStatus !== "PROBATION") {
    throw new Error("HRMS_NOT_ACTIVATED");
  }
  return user;
}

export function createAuthCookieResponse(response: NextResponse, token: string) {
  response.cookies.set({
    name: COOKIE_NAME,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
  return response;
}

export function clearAuthCookieResponse(response: NextResponse) {
  response.cookies.set({
    name: COOKIE_NAME,
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return response;
}
