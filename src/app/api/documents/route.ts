import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserFromRequest } from "@/lib/auth";
import { isSuperAdmin } from "@/lib/permissions";
import { uploadFileToStorage } from "@/lib/storage";

// Department normalizer helper
function normalizeDepartment(dept?: string | null): string {
  if (!dept) return "GENERAL";
  const clean = dept.trim().toUpperCase().replace(/[^A-Z0-9]/g, "_");
  if (clean.includes("FRONTEND") || clean.includes("FRONT_END") || clean.includes("REACT") || clean.includes("WEB")) return "FRONTEND";
  if (clean.includes("UI") || clean.includes("UX") || clean.includes("DESIGN") || clean.includes("FIGMA")) return "UI_UX";
  if (clean.includes("BACKEND") || clean.includes("BACK_END") || clean.includes("NODE") || clean.includes("API") || clean.includes("DATABASE")) return "BACKEND";
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
    const searchParam = searchParams.get("search");

    const superAdmin = isSuperAdmin(currentUser);
    const userDept = normalizeDepartment(currentUser.department || currentUser.jobTitle);

    // Build department access filter
    let departmentFilter: any = undefined;

    if (superAdmin) {
      if (deptParam && deptParam !== "ALL_DEPTS") {
        departmentFilter = deptParam;
      }
    } else {
      // Normal member is restricted to their department and "ALL"
      const allowed = ["ALL", "GENERAL", userDept];
      if (deptParam && deptParam !== "ALL_DEPTS") {
        if (!allowed.includes(deptParam)) {
          return NextResponse.json({
            success: false,
            error: { code: "FORBIDDEN", message: "You do not have permission to view documents from other departments." },
          }, { status: 403 });
        }
        departmentFilter = deptParam;
      } else {
        departmentFilter = { in: allowed };
      }
    }

    const whereClause: any = {};
    if (departmentFilter) {
      whereClause.department = departmentFilter;
    }
    if (phaseParam && phaseParam !== "ALL_PHASES") {
      const phaseNum = parseInt(phaseParam);
      if (!isNaN(phaseNum)) {
        whereClause.phaseNumber = phaseNum;
      }
    }

    let docs: any[] = [];
    if ((prisma as any).organizationDocument?.findMany) {
      if (searchParam && searchParam.trim()) {
        whereClause.OR = [
          { title: { contains: searchParam.trim(), mode: "insensitive" } },
          { description: { contains: searchParam.trim(), mode: "insensitive" } },
          { fileName: { contains: searchParam.trim(), mode: "insensitive" } },
          { phaseName: { contains: searchParam.trim(), mode: "insensitive" } },
        ];
      }
      docs = await (prisma as any).organizationDocument.findMany({
        where: whereClause,
        include: {
          uploadedBy: {
            select: { id: true, name: true, email: true, role: true, avatarUrl: true },
          },
        },
        orderBy: [{ phaseNumber: "asc" }, { createdAt: "desc" }],
      });
    } else {
      let query = `
        SELECT d.*, 
               json_build_object('id', u.id, 'name', u.name, 'email', u.email, 'role', u.role, 'avatarUrl', u."avatarUrl") AS "uploadedBy"
        FROM "OrganizationDocument" d
        LEFT JOIN "User" u ON d."uploadedById" = u.id
        WHERE 1=1
      `;
      const params: any[] = [];
      if (departmentFilter) {
        if (typeof departmentFilter === "string") {
          params.push(departmentFilter);
          query += ` AND d.department = $${params.length}`;
        } else if (departmentFilter.in) {
          const placeholders = departmentFilter.in.map((_: any, i: number) => `$${params.length + i + 1}`).join(",");
          params.push(...departmentFilter.in);
          query += ` AND d.department IN (${placeholders})`;
        }
      }
      if (whereClause.phaseNumber) {
        params.push(whereClause.phaseNumber);
        query += ` AND d."phaseNumber" = $${params.length}`;
      }
      if (searchParam && searchParam.trim()) {
        params.push(`%${searchParam.trim()}%`);
        query += ` AND (d.title ILIKE $${params.length} OR d.description ILIKE $${params.length} OR d."fileName" ILIKE $${params.length})`;
      }
      query += ` ORDER BY d."phaseNumber" ASC, d."createdAt" DESC`;
      docs = await prisma.$queryRawUnsafe(query, ...params);
    }

    let allPhases: any[] = [];
    try {
      allPhases = await prisma.$queryRawUnsafe(
        `SELECT DISTINCT "phaseNumber", "phaseName" FROM "OrganizationDocument" ORDER BY "phaseNumber" ASC`
      );
    } catch {
      allPhases = [];
    }

    return NextResponse.json({
      success: true,
      data: {
        documents: docs,
        phases: allPhases,
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

    // Strictly check Super Admin permission
    if (!isSuperAdmin(currentUser)) {
      return NextResponse.json(
        { success: false, error: { code: "FORBIDDEN", message: "Only Super Administrators can upload and manage organization documents." } },
        { status: 403 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const title = formData.get("title") as string | null;
    const description = formData.get("description") as string | null;
    const department = formData.get("department") as string | null;
    const phaseNumber = parseInt(formData.get("phaseNumber") as string) || 1;
    const phaseName = formData.get("phaseName") as string | null;

    if (!file || !title || !department) {
      return NextResponse.json(
        { success: false, error: { code: "INVALID_INPUT", message: "File, Title, and Department are required." } },
        { status: 400 }
      );
    }

    // Upload to Supabase Storage (with fallback to local storage)
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const uploaded = await uploadFileToStorage(
      buffer,
      file.name,
      file.type || "application/octet-stream",
      "documents"
    );

    let doc: any = null;
    if ((prisma as any).organizationDocument?.create) {
      doc = await (prisma as any).organizationDocument.create({
        data: {
          title: title.trim(),
          description: description?.trim() || null,
          department: department.trim().toUpperCase(),
          phaseNumber,
          phaseName: phaseName?.trim() || `Phase ${phaseNumber}`,
          fileName: file.name,
          fileUrl: uploaded.fileUrl,
          storagePath: uploaded.storagePath,
          fileSize: uploaded.fileSize || file.size,
          fileType: file.type || "application/octet-stream",
          uploadedById: currentUser.id,
        },
        include: {
          uploadedBy: {
            select: { id: true, name: true, email: true, role: true, avatarUrl: true },
          },
        },
      });
    } else {
      const id = `doc_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      const now = new Date();
      await prisma.$executeRawUnsafe(
        `INSERT INTO "OrganizationDocument" ("id", "title", "description", "department", "phaseNumber", "phaseName", "fileName", "fileUrl", "storagePath", "fileSize", "fileType", "uploadedById", "createdAt", "updatedAt")
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
        id,
        title.trim(),
        description?.trim() || null,
        department.trim().toUpperCase(),
        phaseNumber,
        phaseName?.trim() || `Phase ${phaseNumber}`,
        file.name,
        uploaded.fileUrl,
        uploaded.storagePath,
        uploaded.fileSize || file.size,
        file.type || "application/octet-stream",
        currentUser.id,
        now,
        now
      );
      doc = {
        id,
        title: title.trim(),
        description: description?.trim() || null,
        department: department.trim().toUpperCase(),
        phaseNumber,
        phaseName: phaseName?.trim() || `Phase ${phaseNumber}`,
        fileName: file.name,
        fileUrl: uploaded.fileUrl,
        storagePath: uploaded.storagePath,
        fileSize: uploaded.fileSize || file.size,
        fileType: file.type || "application/octet-stream",
        uploadedById: currentUser.id,
        uploadedBy: {
          id: currentUser.id,
          name: currentUser.name,
          email: currentUser.email,
          role: currentUser.role,
          avatarUrl: currentUser.avatarUrl,
        },
        createdAt: now,
        updatedAt: now,
      };
    }

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
            phaseNumber: doc.phaseNumber,
            fileName: doc.fileName,
            storagePath: doc.storagePath,
          }),
        },
      });
    } catch (auditErr) {
      console.warn("Audit log creation notice:", auditErr);
    }

    return NextResponse.json({
      success: true,
      data: doc,
      message: "Document uploaded successfully to organization vault.",
    });
  } catch (error: any) {
    console.error("POST /api/documents error:", error);
    return NextResponse.json({ success: false, error: { code: "SERVER_ERROR", message: error.message || "Failed to upload document" } }, { status: 500 });
  }
}
