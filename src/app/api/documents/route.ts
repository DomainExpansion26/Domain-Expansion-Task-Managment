import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserFromRequest } from "@/lib/auth";
import { isSuperAdmin, isManager, isTeamLead } from "@/lib/permissions";
import { uploadFileToStorage } from "@/lib/storage";

export const dynamic = "force-dynamic";

// Department normalizer helper
function normalizeDepartment(dept?: string | null): string {
  if (!dept) return "GENERAL";
  const clean = dept.trim().toUpperCase().replace(/[^A-Z0-9]/g, "_");
  if (clean.includes("FRONTEND") || clean.includes("FRONT_END") || clean.includes("REACT") || clean.includes("WEB") || clean.includes("CLIENT")) return "DEVELOPMENT";
  if (clean.includes("BACKEND") || clean.includes("BACK_END") || clean.includes("NODE") || clean.includes("API") || clean.includes("DATABASE") || clean.includes("SERVER")) return "DEVELOPMENT";
  if (clean.includes("DEVELOP") || clean.includes("ENGINEER") || clean.includes("DEV")) return "DEVELOPMENT";
  if (clean.includes("UI") || clean.includes("UX") || clean.includes("DESIGN") || clean.includes("FIGMA")) return "UI_UX";
  if (clean.includes("QA") || clean.includes("TEST") || clean.includes("QUALITY") || clean.includes("DEFECT")) return "QA";
  if (clean.includes("MARKET") || clean.includes("SEO") || clean.includes("GROWTH") || clean.includes("SALES")) return "MARKETING";
  return clean;
}

export async function GET(request: NextRequest) {
  try {
    const currentUser = await getCurrentUserFromRequest(request);
    if (!currentUser) {
      return NextResponse.json({ success: false, error: { code: "UNAUTHORIZED", message: "Not authenticated" } }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const phaseParam = searchParams.get("phase");
    const deptParam = searchParams.get("department");
    const categoryParam = searchParams.get("category") || searchParams.get("team");
    const searchParam = searchParams.get("search");
    const statusParam = searchParams.get("status");

    const superAdmin = isSuperAdmin(currentUser);
    const userDept = normalizeDepartment(currentUser.department || currentUser.jobTitle);

    // Build department access filter
    let departmentFilter: any = undefined;
    if (deptParam && deptParam !== "ALL_DEPTS") {
      departmentFilter = deptParam.toUpperCase();
    }

    const whereClause: any = {};
    if (departmentFilter) {
      whereClause.OR = [
        { department: departmentFilter },
        { department: "ALL" },
        { department: "GENERAL" },
        { visibility: "COMPANY_WIDE" },
      ];
    }
    if (categoryParam && categoryParam !== "ALL_CATEGORIES") {
      whereClause.category = { equals: categoryParam, mode: "insensitive" };
    }
    if (phaseParam && phaseParam !== "ALL_PHASES") {
      const phaseNum = parseInt(phaseParam);
      if (!isNaN(phaseNum)) {
        whereClause.phaseNumber = phaseNum;
      }
    }

    // Role-based visibility scoping: Show all non-archived documents to all users
    if (!superAdmin) {
      whereClause.status = { not: "ARCHIVED" };
      whereClause.visibility = { not: "ADMIN_ONLY" };
    } else if (statusParam && statusParam !== "ALL_STATUSES") {
      whereClause.status = statusParam;
    }

    if (searchParam && searchParam.trim()) {
      whereClause.OR = [
        { title: { contains: searchParam.trim(), mode: "insensitive" } },
        { description: { contains: searchParam.trim(), mode: "insensitive" } },
        { fileName: { contains: searchParam.trim(), mode: "insensitive" } },
        { phaseName: { contains: searchParam.trim(), mode: "insensitive" } },
        { category: { contains: searchParam.trim(), mode: "insensitive" } },
      ];
    }

    const docs = await prisma.organizationDocument.findMany({
      where: whereClause,
      include: {
        uploadedBy: {
          select: { id: true, name: true, email: true, role: true, avatarUrl: true },
        },
      },
      orderBy: [{ sortOrder: "asc" }, { phaseNumber: "asc" }, { createdAt: "desc" }],
    });

    // Distinct metadata for filters
    const [allPhases, allCategories, allDepts] = await Promise.all([
      prisma.docPhase.findMany({ orderBy: { phaseNumber: "asc" } }),
      prisma.docCategory.findMany({ orderBy: { sortOrder: "asc" } }),
      prisma.department.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        documents: docs,
        phases: allPhases,
        categories: allCategories,
        departments: allDepts,
        userDepartment: userDept,
        isSuperAdmin: superAdmin,
      },
    });
  } catch (error: any) {
    console.error("GET /api/documents error:", error);
    return NextResponse.json({ success: false, error: { code: "SERVER_ERROR", message: error.message || "Failed to fetch documents" } }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUserFromRequest(request);
    if (!currentUser) {
      return NextResponse.json({ success: false, error: { code: "UNAUTHORIZED", message: "Not authenticated" } }, { status: 401 });
    }

    // Allow Super Admins, Managers, and Team Leads to upload and publish documentation
    const canUpload = isSuperAdmin(currentUser) || isManager(currentUser) || isTeamLead(currentUser?.role);
    if (!canUpload) {
      return NextResponse.json(
        { success: false, error: { code: "FORBIDDEN", message: "Only Managers, Team Leads, and Administrators can upload organization documents." } },
        { status: 403 }
      );
    }

    const formData = await request.formData();
    const title = formData.get("title") as string | null;
    const description = formData.get("description") as string | null;
    const department = formData.get("department") as string | null;
    const category = (formData.get("category") as string) || (formData.get("team") as string) || "General";
    const team = (formData.get("team") as string) || category || "Core";
    const phaseNumber = parseInt(formData.get("phaseNumber") as string) || 1;
    const phaseName = formData.get("phaseName") as string | null;
    const version = (formData.get("version") as string) || "1.0";
    const status = (formData.get("status") as string) || "PUBLISHED";
    const sortOrder = parseInt(formData.get("sortOrder") as string) || 0;
    const visibility = (formData.get("visibility") as string) || "DEPARTMENT";

    const rawFiles: (File | null)[] = [
      ...formData.getAll("files"),
      ...formData.getAll("file"),
    ] as (File | null)[];

    const files = rawFiles.filter((f): f is File => f !== null && typeof f === "object" && typeof f.name === "string" && f.size > 0);

    if (files.length === 0 || !title || !department) {
      return NextResponse.json(
        { success: false, error: { code: "INVALID_INPUT", message: "At least one File, Title, and Department are required." } },
        { status: 400 }
      );
    }

    const createdDocs = await Promise.all(
      files.map(async (file, idx) => {
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        const uploaded = await uploadFileToStorage(
          buffer,
          file.name,
          file.type || "application/octet-stream",
          `documents/${department.toLowerCase()}/${category.toLowerCase()}`
        );

        const docTitle = files.length > 1 && title
          ? `${title.trim()} (${file.name.replace(/\.[^/.]+$/, "")})`
          : title.trim();

        const doc = await prisma.organizationDocument.create({
          data: {
            title: docTitle,
            description: description?.trim() || null,
            department: department.trim().toUpperCase(),
            category: category.trim(),
            team: team.trim(),
            phaseNumber,
            phaseName: phaseName?.trim() || `Phase ${phaseNumber}`,
            fileName: file.name,
            fileUrl: uploaded.fileUrl,
            storagePath: uploaded.storagePath,
            fileSize: uploaded.fileSize || file.size,
            fileType: file.type || "application/octet-stream",
            version: version.trim(),
            status: status.trim().toUpperCase(),
            sortOrder: sortOrder + idx,
            visibility: visibility.trim().toUpperCase(),
            uploadedById: currentUser.id,
          },
          include: {
            uploadedBy: {
              select: { id: true, name: true, email: true, role: true, avatarUrl: true },
            },
          },
        });

        // Record audit log
        try {
          await prisma.auditLog.create({
            data: {
              userId: currentUser.id,
              action: "DOCUMENT_UPLOADED",
              entityType: "ORGANIZATION_DOCUMENT",
              entityId: doc.id,
              detailsJson: JSON.stringify({
                title: doc.title,
                department: doc.department,
                category: doc.category,
                phaseNumber: doc.phaseNumber,
                version: doc.version,
                fileName: doc.fileName,
              }),
            },
          });
        } catch (auditErr) {
          console.warn("Audit log notice:", auditErr);
        }

        return doc;
      })
    );

    return NextResponse.json({
      success: true,
      data: createdDocs.length === 1 ? createdDocs[0] : createdDocs,
      count: createdDocs.length,
      message: `${createdDocs.length} document(s) published successfully to ${department.toUpperCase()} / ${category}.`,
    });
  } catch (error: any) {
    console.error("POST /api/documents error:", error);
    return NextResponse.json({ success: false, error: { code: "SERVER_ERROR", message: error.message || "Failed to upload document(s)" } }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const currentUser = await getCurrentUserFromRequest(request);
    if (!currentUser || !isSuperAdmin(currentUser)) {
      return NextResponse.json({ success: false, error: { code: "FORBIDDEN", message: "Super Admin permission required" } }, { status: 403 });
    }

    const body = await request.json();
    const { id, title, description, department, category, team, phaseNumber, phaseName, version, status, sortOrder, visibility } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: { code: "INVALID_INPUT", message: "Document ID is required" } }, { status: 400 });
    }

    const updated = await prisma.organizationDocument.update({
      where: { id },
      data: {
        ...(title ? { title: title.trim() } : {}),
        ...(description !== undefined ? { description: description?.trim() || null } : {}),
        ...(department ? { department: department.trim().toUpperCase() } : {}),
        ...(category ? { category: category.trim() } : {}),
        ...(team ? { team: team.trim() } : {}),
        ...(phaseNumber ? { phaseNumber: Number(phaseNumber) } : {}),
        ...(phaseName ? { phaseName: phaseName.trim() } : {}),
        ...(version ? { version: version.trim() } : {}),
        ...(status ? { status: status.trim().toUpperCase() } : {}),
        ...(sortOrder !== undefined ? { sortOrder: Number(sortOrder) } : {}),
        ...(visibility ? { visibility: visibility.trim().toUpperCase() } : {}),
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: currentUser.id,
        action: "DOCUMENT_UPDATED",
        entityType: "ORGANIZATION_DOCUMENT",
        entityId: id,
        detailsJson: JSON.stringify({ title: updated.title, status: updated.status, version: updated.version }),
      },
    });

    return NextResponse.json({
      success: true,
      data: updated,
      message: `Document "${updated.title}" updated successfully`,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: { code: "SERVER_ERROR", message: error.message || "Failed to update document" } }, { status: 500 });
  }
}
