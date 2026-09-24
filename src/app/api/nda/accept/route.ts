import { NextRequest, NextResponse } from "next/server";
import { prisma, withDbRetry } from "@/lib/prisma";
import { requireAuth, signSessionToken, createAuthCookieResponse } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request, { allowPendingNDA: true });

    let body: any = {};
    try {
      body = await request.json();
    } catch {
      body = {};
    }

    const { checkboxConfirmed } = body;

    if (!checkboxConfirmed) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "CHECKBOX_REQUIRED",
            message: "You must confirm that you have read, understood, and agreed to the Terms & Conditions and NDA.",
          },
        },
        { status: 400 }
      );
    }

    // Find active NDA template
    const activeTemplate = await withDbRetry(() =>
      prisma.nDATemplate.findFirst({
        where: { isActive: true },
        orderBy: { publishedAt: "desc" },
      })
    );

    if (!activeTemplate) {
      return NextResponse.json(
        { success: false, error: { code: "NO_ACTIVE_NDA", message: "No active NDA template found in system" } },
        { status: 404 }
      );
    }

    const ipAddress =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      "127.0.0.1";
    const userAgent = request.headers.get("user-agent") || "Browser Client";

    const acceptanceDate = new Date();

    // Upsert acceptance record
    await withDbRetry(() =>
      prisma.nDAAcceptance.upsert({
        where: {
          userId_version: {
            userId: user.id,
            version: activeTemplate.version,
          },
        },
        update: {
          acceptedAt: acceptanceDate,
          ipAddress,
          userAgent,
          checkboxText: "I have read, understood, and agree to the above Terms & Conditions and NDA.",
        },
        create: {
          userId: user.id,
          templateId: activeTemplate.id,
          version: activeTemplate.version,
          acceptedAt: acceptanceDate,
          ipAddress,
          userAgent,
          checkboxText: "I have read, understood, and agree to the above Terms & Conditions and NDA.",
        },
      })
    );

    // Update User record
    const updatedUser = await withDbRetry(() =>
      prisma.user.update({
        where: { id: user.id },
        data: {
          ndaAccepted: true,
          ndaAcceptedAt: acceptanceDate,
          ndaVersionAccepted: activeTemplate.version,
        },
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
          managerId: true,
          teamLeadId: true,
          manager: { select: { id: true, name: true, email: true } },
          teamLead: { select: { id: true, name: true, email: true } },
        },
      })
    );

    // Update onboarding checklist if exists
    await prisma.onboardingChecklist.updateMany({
      where: { userId: user.id },
      data: { policyAcknowledged: true },
    }).catch(() => {});

    // Record audit log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: "NDA_ACCEPTED",
        entityType: "NDA",
        entityId: activeTemplate.id,
        detailsJson: JSON.stringify({
          version: activeTemplate.version,
          acceptedAt: acceptanceDate.toISOString(),
          ipAddress,
        }),
      },
    }).catch(console.warn);

    // Issue refreshed token with ndaAccepted = true
    const newToken = signSessionToken({
      id: updatedUser.id,
      email: updatedUser.email,
      name: updatedUser.name,
      role: updatedUser.role,
      ndaAccepted: true,
    });

    const response = NextResponse.json({
      success: true,
      message: "Terms & Conditions and NDA accepted successfully. Portal access granted.",
      data: {
        user: updatedUser,
        token: newToken,
        versionAccepted: activeTemplate.version,
        acceptedAt: acceptanceDate.toISOString(),
      },
    });

    return createAuthCookieResponse(response, newToken);
  } catch (err: any) {
    console.error("NDA Accept error:", err);
    if (err.message === "UNAUTHORIZED") {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "Please sign in to complete NDA" } },
        { status: 401 }
      );
    }
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: err.message || "Failed to record NDA acceptance" } },
      { status: 500 }
    );
  }
}
