import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    // Look up if any HR_ADMIN exists in database, or read from env
    const existingHrAdmin = await prisma.user.findFirst({
      where: { role: "HR_ADMIN" },
      select: { email: true },
    });

    const defaultHrmsEmail =
      existingHrAdmin?.email ||
      process.env.HRMS_SUPERADMIN_EMAIL ||
      "";

    const existingSuperAdmin = await prisma.user.findFirst({
      where: { role: "SUPER_ADMIN" },
      select: { email: true },
    });

    return NextResponse.json({
      success: true,
      data: {
        appName: process.env.NEXT_PUBLIC_APP_NAME || "Domain Expansion",
        hrmsSuperAdminEmail: defaultHrmsEmail,
        hasSuperAdmin: !!existingSuperAdmin,
      },
    });
  } catch (error: any) {
    return NextResponse.json({
      success: true,
      data: {
        appName: "Domain Expansion",
        hrmsSuperAdminEmail: "",
        hasSuperAdmin: false,
      },
    });
  }
}
