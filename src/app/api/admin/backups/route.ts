import { NextRequest, NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import fs from "fs";
import path from "path";

// Execute backup utility
const BACKUP_DIR = path.join(process.cwd(), "backups");

export async function GET(request: NextRequest) {
  try {
    await requireSuperAdmin(request);

    if (!fs.existsSync(BACKUP_DIR)) {
      fs.mkdirSync(BACKUP_DIR, { recursive: true });
    }

    const indexFilePath = path.join(BACKUP_DIR, "index.json");
    let history: any[] = [];
    if (fs.existsSync(indexFilePath)) {
      try {
        history = JSON.parse(fs.readFileSync(indexFilePath, "utf8"));
      } catch {}
    }

    return NextResponse.json({
      success: true,
      data: {
        totalBackups: history.length,
        backups: history,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: { code: "FORBIDDEN", message: err.message || "Failed to load backup list" } },
      { status: 403 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await requireSuperAdmin(request);
    const body = await request.json().catch(() => ({}));
    const tag = body.tag || "manual-admin";

    // Run backup script
    const { runBackup } = require("@/../scripts/backup-db.js");
    const meta = await runBackup(tag);

    // Save record to DB
    await prisma.databaseBackupRecord.create({
      data: {
        filename: meta.filename,
        tag: meta.tag,
        totalRecords: meta.totalRecords,
        sizeBytes: meta.sizeBytes,
        createdById: admin.id,
        status: "COMPLETED",
        notes: `Created by ${admin.name} (${admin.email})`,
      },
    }).catch(console.warn);

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: admin.id,
        action: "DATABASE_BACKUP_CREATED",
        entityType: "DATABASE",
        entityId: meta.filename,
        detailsJson: JSON.stringify(meta),
      },
    }).catch(console.warn);

    return NextResponse.json({
      success: true,
      message: `Database backup created successfully (${meta.totalRecords} records).`,
      data: meta,
    });
  } catch (err: any) {
    console.error("Backup creation error:", err);
    return NextResponse.json(
      { success: false, error: { code: "BACKUP_FAILED", message: err.message || "Database backup execution failed" } },
      { status: 500 }
    );
  }
}
