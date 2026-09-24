/**
 * Database Restore Utility
 * Safely restores database records from a snapshot backup file.
 */
const { PrismaClient } = require("@prisma/client");
const fs = require("fs");
const path = require("path");

const prisma = new PrismaClient();
const BACKUP_DIR = path.join(__dirname, "..", "backups");

async function restoreBackup(backupFileName) {
  const filePath = path.isAbsolute(backupFileName)
    ? backupFileName
    : path.join(BACKUP_DIR, backupFileName);

  if (!fs.existsSync(filePath)) {
    throw new Error(`Backup file not found: ${filePath}`);
  }

  const raw = fs.readFileSync(filePath, "utf8");
  const backup = JSON.parse(raw);

  console.log(`[Restore] Restoring from ${filePath} (timestamp: ${backup.timestamp})...`);

  // Models in dependency order
  const orderedModels = [
    "user",
    "hRProfile",
    "department",
    "designation",
    "holiday",
    "leaveTypeConfig",
    "salaryStructure",
    "asset",
    "project",
    "projectMember",
    "sprint",
    "task",
    "taskRelation",
    "taskAssignee",
    "taskWatcher",
    "taskShare",
    "subtask",
    "comment",
    "attachment",
    "label",
    "attendance",
    "leave",
    "payslip",
    "qATicket",
    "qABug",
    "notification",
    "notificationPreference",
    "activity",
    "auditLog",
    "docCategory",
    "docPhase",
    "organizationDocument",
    "employeeTimeline",
    "onboardingChecklist",
    "offboardingRecord",
    "hRSetting",
  ];

  let restoredTotal = 0;

  for (const model of orderedModels) {
    const records = backup.data[model];
    if (records && records.length > 0 && prisma[model]) {
      console.log(` - Restoring ${model} (${records.length} records)...`);
      for (const rec of records) {
        try {
          if (rec.id) {
            await prisma[model].upsert({
              where: { id: rec.id },
              update: rec,
              create: rec,
            });
            restoredTotal++;
          }
        } catch (e) {
          // If upsert fails on relations or unique constraints, log and continue
          console.warn(`   Notice on ${model} id=${rec.id}:`, e.message);
        }
      }
    }
  }

  console.log(`[Restore] Finished. Processed ${restoredTotal} records.`);
  await prisma.$disconnect();
  return { success: true, restoredTotal, backupFile: path.basename(filePath) };
}

if (require.main === module) {
  const targetFile = process.argv[2];
  if (!targetFile) {
    console.error("Usage: node scripts/restore-db.js <backup-file-name>");
    process.exit(1);
  }
  restoreBackup(targetFile).catch((e) => {
    console.error("[Restore Error]:", e);
    process.exit(1);
  });
}

module.exports = { restoreBackup };
