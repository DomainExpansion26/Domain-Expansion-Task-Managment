import { NextRequest, NextResponse } from "next/server";
import { prisma, withDbRetry } from "@/lib/prisma";
import { requireAuth, requireSuperAdmin } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request, { allowPendingNDA: true });

    const policies = await withDbRetry(() =>
      prisma.companyPolicy.findMany({
        where: user.role === "SUPER_ADMIN" ? {} : { isPublished: true },
        orderBy: [{ category: "asc" }, { updatedAt: "desc" }],
      })
    );

    return NextResponse.json({
      success: true,
      data: policies,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: err.message || "Failed to load policies" } },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await requireSuperAdmin(request);
    const body = await request.json();

    const { id, title, category = "GENERAL", version = "v1.0", content, summary, isPublished = true } = body;

    if (!title?.trim() || !content?.trim()) {
      return NextResponse.json(
        { success: false, error: { code: "INVALID_INPUT", message: "Policy title and content are required" } },
        { status: 400 }
      );
    }

    let policy;
    if (id) {
      policy = await withDbRetry(() =>
        prisma.companyPolicy.update({
          where: { id },
          data: {
            title: title.trim(),
            category: category.trim(),
            version: version.trim(),
            content,
            summary: summary?.trim() || null,
            isPublished: Boolean(isPublished),
          },
        })
      );
    } else {
      policy = await withDbRetry(() =>
        prisma.companyPolicy.create({
          data: {
            title: title.trim(),
            category: category.trim(),
            version: version.trim(),
            content,
            summary: summary?.trim() || null,
            isPublished: Boolean(isPublished),
            createdById: admin.id,
          },
        })
      );
    }

    await prisma.auditLog.create({
      data: {
        userId: admin.id,
        action: id ? "POLICY_UPDATED" : "POLICY_CREATED",
        entityType: "POLICY",
        entityId: policy.id,
        detailsJson: JSON.stringify({ title: policy.title, category: policy.category, version: policy.version }),
      },
    }).catch(console.warn);

    return NextResponse.json({
      success: true,
      data: policy,
      message: "Company policy saved successfully.",
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: { code: "FORBIDDEN", message: err.message || "Failed to save company policy" } },
      { status: 403 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const admin = await requireSuperAdmin(request);
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, error: { code: "INVALID_INPUT", message: "Policy ID is required" } },
        { status: 400 }
      );
    }

    await withDbRetry(() =>
      prisma.companyPolicy.delete({
        where: { id },
      })
    );

    await prisma.auditLog.create({
      data: {
        userId: admin.id,
        action: "POLICY_DELETED",
        entityType: "POLICY",
        entityId: id,
      },
    }).catch(console.warn);

    return NextResponse.json({
      success: true,
      message: "Policy deleted successfully.",
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: { code: "FORBIDDEN", message: err.message || "Failed to delete policy" } },
      { status: 403 }
    );
  }
}
