import { NextRequest, NextResponse } from "next/server";
import { prisma, withDbRetry } from "@/lib/prisma";
import { requireAuth, requireSuperAdmin } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    // Anyone logged in can fetch the active template
    await requireAuth(request, { allowPendingNDA: true });

    let activeTemplate = await withDbRetry(() =>
      prisma.nDATemplate.findFirst({
        where: { isActive: true },
        orderBy: { publishedAt: "desc" },
      })
    );

    if (!activeTemplate) {
      activeTemplate = await withDbRetry(() =>
        prisma.nDATemplate.findFirst({
          orderBy: { createdAt: "desc" },
        })
      );
    }

    return NextResponse.json({
      success: true,
      data: activeTemplate,
    });
  } catch (err: any) {
    if (err.message === "UNAUTHORIZED") {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "Please sign in to view agreement" } },
        { status: 401 }
      );
    }
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: err.message || "Failed to load agreement template" } },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await requireSuperAdmin(request);
    const body = await request.json();

    const { version, title, content, summary, makeActive = true } = body;

    if (!version || !content) {
      return NextResponse.json(
        { success: false, error: { code: "INVALID_INPUT", message: "Version and NDA content are required" } },
        { status: 400 }
      );
    }

    const cleanVersion = version.trim();

    // If making active, deactivate other versions
    if (makeActive) {
      await withDbRetry(() =>
        prisma.nDATemplate.updateMany({
          where: { isActive: true },
          data: { isActive: false },
        })
      );
    }

    const template = await withDbRetry(() =>
      prisma.nDATemplate.upsert({
        where: { version: cleanVersion },
        update: {
          title: title?.trim() || "Domain Expansion Non-Disclosure & Confidentiality Agreement",
          content,
          summary: summary?.trim() || null,
          isActive: Boolean(makeActive),
          publishedAt: new Date(),
          createdById: admin.id,
        },
        create: {
          version: cleanVersion,
          title: title?.trim() || "Domain Expansion Non-Disclosure & Confidentiality Agreement",
          content,
          summary: summary?.trim() || null,
          isActive: Boolean(makeActive),
          publishedAt: new Date(),
          createdById: admin.id,
        },
      })
    );

    // Record audit log
    await prisma.auditLog.create({
      data: {
        userId: admin.id,
        action: "NDA_VERSION_PUBLISHED",
        entityType: "NDA_TEMPLATE",
        entityId: template.id,
        detailsJson: JSON.stringify({
          version: cleanVersion,
          title: template.title,
          isActive: template.isActive,
        }),
      },
    }).catch(console.warn);

    return NextResponse.json({
      success: true,
      data: template,
      message: `NDA ${cleanVersion} published successfully.`,
    });
  } catch (err: any) {
    if (err.message === "UNAUTHORIZED" || err.message === "FORBIDDEN") {
      return NextResponse.json(
        { success: false, error: { code: "FORBIDDEN", message: "Super Admin authorization required" } },
        { status: 403 }
      );
    }
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: err.message || "Failed to update NDA template" } },
      { status: 500 }
    );
  }
}
