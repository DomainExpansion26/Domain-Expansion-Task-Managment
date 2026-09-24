/**
 * Database Backup Utility
 * Exports a complete snapshot of all database models to timestamped JSON files.
 */
const { PrismaClient } = require("@prisma/client");
const fs = require("fs");
const path = require("path");

const prisma = new PrismaClient();

const BACKUP_DIR = path.join(__dirname, "..", "backups");

async function runBackup(tag = "manual") {
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backupFileName = `backup-${timestamp}-${tag}.json`;
  const backupFilePath = path.join(BACKUP_DIR, backupFileName);

  console.log(`[Backup] Starting database snapshot: ${backupFileName}...`);

  const models = [
    "user",
    "hRProfile",
    "attendance",
    "leave",
    "invitation",
    "passwordResetToken",
    "project",
    "projectMember",
    "sprint",
    "task",
    "taskRelation",
    "qATicket",
    "qABug",
    "taskAssignee",
    "taskWatcher",
    "taskShare",
    "subtask",
    "comment",
    "attachment",
    "label",
    "notification",
    "notificationPreference",
    "activity",
    "auditLog",
    "aIProviderConfig",
    "aIConversation",
    "aIMessage",
    "aIUsage",
    "automationRule",
    "sentEmailLog",
    "organizationDocument",
    "docCategory",
    "docPhase",
    "department",
    "designation",
    "holiday",
    "leaveTypeConfig",
    "salaryStructure",
    "payslip",
    "asset",
    "hRAnnouncement",
    "hRRequest",
    "performanceReview",
    "trainingProgram",
    "jobOpening",
    "candidate",
    "employeeTimeline",
    "onboardingChecklist",
    "offboardingRecord",
    "hRSetting",
  ];

  const backupData = {
    version: "1.0",
    timestamp: new Date().toISOString(),
    tag,
    counts: {},
    data: {},
  };

  let totalRecords = 0;

  for (const modelName of models) {
    if (prisma[modelName] && typeof prisma[modelName].findMany === "function") {
      try {
        const records = await prisma[modelName].findMany();
        backupData.data[modelName] = records;
        backupData.counts[modelName] = records.length;
        totalRecords += records.length;
        console.log(` - ${modelName}: ${records.length} records`);
      } catch (err) {
        console.warn(` - Warning reading ${modelName}:`, err.message);
      }
    }
  }

  fs.writeFileSync(backupFilePath, JSON.stringify(backupData, null, 2), "utf8");

  // Update backup index
  const indexFilePath = path.join(BACKUP_DIR, "index.json");
  let backupHistory = [];
  if (fs.existsSync(indexFilePath)) {
    try {
      backupHistory = JSON.parse(fs.readFileSync(indexFilePath, "utf8"));
    } catch {}
  }

  const meta = {
    id: `bk_${Date.now()}`,
    filename: backupFileName,
    timestamp: backupData.timestamp,
    tag,
    totalRecords,
    modelsCount: Object.keys(backupData.data).length,
    sizeBytes: fs.statSync(backupFilePath).size,
  };

  backupHistory.unshift(meta);
  fs.writeFileSync(indexFilePath, JSON.stringify(backupHistory, null, 2), "utf8");

  console.log(`[Backup] Completed successfully. Total records: ${totalRecords}. File: ${backupFilePath}`);
  await prisma.$disconnect();
  return meta;
}

if (require.main === module) {
  const tag = process.argv[2] || "pre-migration";
  runBackup(tag).catch((err) => {
    console.error("[Backup Error]:", err);
    process.exit(1);
  });
}

module.exports = { runBackup, BACKUP_DIR };
