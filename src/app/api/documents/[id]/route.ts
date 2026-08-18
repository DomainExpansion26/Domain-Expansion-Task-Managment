import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserFromRequest } from "@/lib/auth";
import { isSuperAdmin } from "@/lib/permissions";

function normalizeDepartment(dept?: string | null): string {
  if (!dept) return "GENERAL";
  const clean = dept.trim().toUpperCase().replace(/[^A-Z0-9]/g, "_");
  if (clean.includes("FRONTEND") || clean.includes("FRONT_END") || clean.includes("REACT") || clean.includes("WEB")) return "FRONTEND";
  if (clean.includes("UI") || clean.includes("UX") || clean.includes("DESIGN") || clean.includes("FIGMA")) return "UI_UX";
  if (clean.includes("BACKEND") || clean.includes("BACK_END") || clean.includes("NODE") || clean.includes("API") || clean.includes("DATABASE")) return "BACKEND";
  if (clean.includes("MARKET") || clean.includes("SEO") || clean.includes("GROWTH") || clean.includes("SALES")) return "MARKETING";
  return clean;
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const currentUser = await getCurrentUserFromRequest(request);
    if (!currentUser) {
      return NextResponse.json({ success: false, error: { code: "UNAUTHORIZED", message: "Not authenticated" } }, { status: 401 });
    }

    const { id } = await params;
    let doc: any = null;

    if ((prisma as any).organizationDocument?.findUnique) {
      doc = await (prisma as any).organizationDocument.findUnique({
        where: { id },
        include: {
          uploadedBy: {
            select: { id: true, name: true, email: true, role: true, avatarUrl: true },
          },
        },
      });
    } else {
      const rows: any[] = await prisma.$queryRawUnsafe(
        `SELECT d.*, 
                json_build_object('id', u.id, 'name', u.name, 'email', u.email, 'role', u.role, 'avatarUrl', u."avatarUrl") AS "uploadedBy"
         FROM "OrganizationDocument" d
         LEFT JOIN "User" u ON d."uploadedById" = u.id
         WHERE d.id = $1 LIMIT 1`,
        id
      );
      doc = rows[0] || null;
    }

    if (!doc) {
      return NextResponse.json({ success: false, error: { code: "NOT_FOUND", message: "Document not found" } }, { status: 404 });
    }

    const superAdmin = isSuperAdmin(currentUser);
    const userDept = normalizeDepartment(currentUser.department || currentUser.jobTitle);

    // Verify department access
    if (!superAdmin) {
      const allowed = ["ALL", "GENERAL", userDept];
      if (!allowed.includes(doc.department)) {
        return NextResponse.json(
          { success: false, error: { code: "FORBIDDEN", message: "You do not have permission to view this document." } },
          { status: 403 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      data: doc,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: { code: "SERVER_ERROR", message: error.message } }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const currentUser = await getCurrentUserFromRequest(request);
    if (!currentUser) {
      return NextResponse.json({ success: false, error: { code: "UNAUTHORIZED", message: "Not authenticated" } }, { status: 401 });
    }

    if (!isSuperAdmin(currentUser)) {
      return NextResponse.json({ success: false, error: { code: "FORBIDDEN", message: "Only Super Admin can delete documents" } }, { status: 403 });
    }

    const { id } = await params;
    let existing: any = null;

    if ((prisma as any).organizationDocument?.findUnique) {
      existing = await (prisma as any).organizationDocument.findUnique({ where: { id } });
    } else {
      const rows: any[] = await prisma.$queryRawUnsafe(`SELECT * FROM "OrganizationDocument" WHERE id = $1 LIMIT 1`, id);
      existing = rows[0] || null;
    }

    if (!existing) {
      return NextResponse.json({ success: false, error: { code: "NOT_FOUND", message: "Document not found" } }, { status: 404 });
    }

    if ((prisma as any).organizationDocument?.delete) {
      await (prisma as any).organizationDocument.delete({ where: { id } });
    } else {
      await prisma.$executeRawUnsafe(`DELETE FROM "OrganizationDocument" WHERE id = $1`, id);
    }

    try {
      await prisma.auditLog.create({
        data: {
          userId: currentUser.id,
          action: "DOCUMENT_DELETED",
          entityType: "ORGANIZATION_DOCUMENT",
          entityId: id,
          detailsJson: JSON.stringify({ title: existing.title, department: existing.department }),
        },
      });
    } catch {}

    return NextResponse.json({
      success: true,
      message: "Document deleted successfully",
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: { code: "SERVER_ERROR", message: error.message } }, { status: 500 });
  }
}
