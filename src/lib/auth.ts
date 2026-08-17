import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "./prisma";
import { hasPermission, normalizeRole, Permission, Role, isSuperAdmin, isHRAdmin, isManager, isTeamLead, isQA } from "./permissions";

const JWT_SECRET = process.env.JWT_SECRET || "domain-expansion-super-secret-jwt-key-2026-production";
const COOKIE_NAME = "dx_session_token";

export interface UserSession {
  userId: string;
  email: string;
  name: string;
  role: string;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function signSessionToken(user: { id: string; email: string; name: string; role: string }): string {
  return jwt.sign(
    {
      userId: user.id,
      email: user.email,
      name: user.name,
      role: normalizeRole(user.role),
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

  const user = await prisma.user.findUnique({
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
      isEmailVerified: true,
      managerId: true,
      teamLeadId: true,
      manager: { select: { id: true, name: true, email: true } },
      teamLead: { select: { id: true, name: true, email: true } },
      hrProfile: true,
      createdAt: true,
    },
  });

  if (!user || !user.isActive) return null;
  return {
    ...user,
    role: normalizeRole(user.role),
  };
}

export async function requireAuth(request?: NextRequest) {
  const user = await getCurrentUserFromRequest(request);
  if (!user) {
    throw new Error("UNAUTHORIZED");
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
