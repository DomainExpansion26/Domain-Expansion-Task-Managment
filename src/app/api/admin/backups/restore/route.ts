import { NextRequest, NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const admin = await requireSuperAdmin(request);
    const body = await request.json().catch(() => ({}));
    const { filename } = body;

    if (!filename) {
      return NextResponse.json(
        { success: false, error: { code: "INVALID_INPUT", message: "Backup filename is required" } },
        { status: 400 }
      );
    }

    const { restoreBackup } = require("@/../scripts/restore-db.js");
    const result = await restoreBackup(filename);

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: admin.id,
        action: "DATABASE_RESTORED",
        entityType: "DATABASE",
        entityId: filename,
        detailsJson: JSON.stringify(result),
      },
    }).catch(console.warn);

    return NextResponse.json({
      success: true,
      message: `Database successfully restored from ${filename} (${result.restoredTotal} records restored).`,
      data: result,
    });
  } catch (err: any) {
    console.error("Backup restore error:", err);
    return NextResponse.json(
      { success: false, error: { code: "RESTORE_FAILED", message: err.message || "Failed to restore database from backup" } },
      { status: 500 }
    );
  }
}
