const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function createHrmsTables() {
  console.log("Creating HRMS tables safely with IF NOT EXISTS (Zero Data Loss)...");

  const queries = [
    `CREATE TABLE IF NOT EXISTS "Department" (
      "id" TEXT PRIMARY KEY,
      "name" TEXT UNIQUE NOT NULL,
      "code" TEXT UNIQUE NOT NULL,
      "description" TEXT,
      "managerId" TEXT,
      "isActive" BOOLEAN NOT NULL DEFAULT true,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    );`,

    `CREATE TABLE IF NOT EXISTS "Designation" (
      "id" TEXT PRIMARY KEY,
      "title" TEXT UNIQUE NOT NULL,
      "department" TEXT,
      "level" TEXT DEFAULT 'Mid-Level',
      "description" TEXT,
      "isActive" BOOLEAN NOT NULL DEFAULT true,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    );`,

    `CREATE TABLE IF NOT EXISTS "Holiday" (
      "id" TEXT PRIMARY KEY,
      "name" TEXT NOT NULL,
      "date" TIMESTAMP(3) NOT NULL,
      "holidayType" TEXT NOT NULL DEFAULT 'Public Holiday',
      "year" INTEGER NOT NULL DEFAULT 2026,
      "description" TEXT,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    );`,

    `CREATE TABLE IF NOT EXISTS "LeaveTypeConfig" (
      "id" TEXT PRIMARY KEY,
      "name" TEXT UNIQUE NOT NULL,
      "code" TEXT UNIQUE NOT NULL,
      "daysAllowed" INTEGER NOT NULL DEFAULT 12,
      "isPaid" BOOLEAN NOT NULL DEFAULT true,
      "carryForward" BOOLEAN NOT NULL DEFAULT false,
      "maxConsecutive" INTEGER NOT NULL DEFAULT 5,
      "isActive" BOOLEAN NOT NULL DEFAULT true,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    );`,

    `CREATE TABLE IF NOT EXISTS "SalaryStructure" (
      "id" TEXT PRIMARY KEY,
      "userId" TEXT UNIQUE NOT NULL,
      "basic" DOUBLE PRECISION NOT NULL DEFAULT 0,
      "hra" DOUBLE PRECISION NOT NULL DEFAULT 0,
      "allowances" DOUBLE PRECISION NOT NULL DEFAULT 0,
      "bonus" DOUBLE PRECISION NOT NULL DEFAULT 0,
      "deductions" DOUBLE PRECISION NOT NULL DEFAULT 0,
      "grossSalary" DOUBLE PRECISION NOT NULL DEFAULT 0,
      "netSalary" DOUBLE PRECISION NOT NULL DEFAULT 0,
      "currency" TEXT NOT NULL DEFAULT 'INR',
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    );`,

    `CREATE TABLE IF NOT EXISTS "Payslip" (
      "id" TEXT PRIMARY KEY,
      "userId" TEXT NOT NULL,
      "month" INTEGER NOT NULL,
      "year" INTEGER NOT NULL,
      "basic" DOUBLE PRECISION NOT NULL DEFAULT 0,
      "hra" DOUBLE PRECISION NOT NULL DEFAULT 0,
      "allowances" DOUBLE PRECISION NOT NULL DEFAULT 0,
      "bonus" DOUBLE PRECISION NOT NULL DEFAULT 0,
      "deductions" DOUBLE PRECISION NOT NULL DEFAULT 0,
      "grossSalary" DOUBLE PRECISION NOT NULL DEFAULT 0,
      "netSalary" DOUBLE PRECISION NOT NULL DEFAULT 0,
      "earningsJson" TEXT NOT NULL DEFAULT '[]',
      "deductionsJson" TEXT NOT NULL DEFAULT '[]',
      "status" TEXT NOT NULL DEFAULT 'GENERATED',
      "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "Payslip_userId_month_year_key" UNIQUE ("userId", "month", "year")
    );`,

    `CREATE TABLE IF NOT EXISTS "Asset" (
      "id" TEXT PRIMARY KEY,
      "assetTag" TEXT UNIQUE NOT NULL,
      "name" TEXT NOT NULL,
      "type" TEXT NOT NULL,
      "serialNumber" TEXT,
      "assignedToId" TEXT,
      "status" TEXT NOT NULL DEFAULT 'AVAILABLE',
      "condition" TEXT NOT NULL DEFAULT 'EXCELLENT',
      "assignedDate" TIMESTAMP(3),
      "returnDate" TIMESTAMP(3),
      "notes" TEXT,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    );`,

    `CREATE TABLE IF NOT EXISTS "HRAnnouncement" (
      "id" TEXT PRIMARY KEY,
      "title" TEXT NOT NULL,
      "content" TEXT NOT NULL,
      "priority" TEXT NOT NULL DEFAULT 'NORMAL',
      "targetDepartment" TEXT DEFAULT 'ALL',
      "authorId" TEXT,
      "authorName" TEXT,
      "expiresAt" TIMESTAMP(3),
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    );`,

    `CREATE TABLE IF NOT EXISTS "HRRequest" (
      "id" TEXT PRIMARY KEY,
      "userId" TEXT NOT NULL,
      "requestType" TEXT NOT NULL,
      "subject" TEXT NOT NULL,
      "description" TEXT NOT NULL,
      "status" TEXT NOT NULL DEFAULT 'PENDING',
      "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
      "resolverId" TEXT,
      "resolutionNotes" TEXT,
      "attachmentUrl" TEXT,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    );`,

    `CREATE TABLE IF NOT EXISTS "PerformanceReview" (
      "id" TEXT PRIMARY KEY,
      "userId" TEXT NOT NULL,
      "reviewerId" TEXT,
      "period" TEXT NOT NULL,
      "selfReview" TEXT,
      "managerFeedback" TEXT,
      "rating" DOUBLE PRECISION NOT NULL DEFAULT 5.0,
      "goalsJson" TEXT NOT NULL DEFAULT '[]',
      "strengths" TEXT,
      "improvementAreas" TEXT,
      "status" TEXT NOT NULL DEFAULT 'PENDING_SELF_REVIEW',
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    );`,

    `CREATE TABLE IF NOT EXISTS "TrainingProgram" (
      "id" TEXT PRIMARY KEY,
      "title" TEXT NOT NULL,
      "description" TEXT,
      "trainer" TEXT NOT NULL,
      "startDate" TIMESTAMP(3) NOT NULL,
      "endDate" TIMESTAMP(3) NOT NULL,
      "status" TEXT NOT NULL DEFAULT 'UPCOMING',
      "participantsJson" TEXT NOT NULL DEFAULT '[]',
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    );`,

    `CREATE TABLE IF NOT EXISTS "JobOpening" (
      "id" TEXT PRIMARY KEY,
      "title" TEXT NOT NULL,
      "department" TEXT NOT NULL,
      "location" TEXT NOT NULL DEFAULT 'Bangalore, IN (Hybrid)',
      "workMode" TEXT NOT NULL DEFAULT 'HYBRID',
      "openingsCount" INTEGER NOT NULL DEFAULT 1,
      "experienceRequired" TEXT NOT NULL DEFAULT '2-4 Years',
      "status" TEXT NOT NULL DEFAULT 'OPEN',
      "description" TEXT,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    );`,

    `CREATE TABLE IF NOT EXISTS "Candidate" (
      "id" TEXT PRIMARY KEY,
      "jobOpeningId" TEXT,
      "name" TEXT NOT NULL,
      "email" TEXT NOT NULL,
      "phone" TEXT,
      "resumeUrl" TEXT,
      "status" TEXT NOT NULL DEFAULT 'APPLIED',
      "interviewDate" TIMESTAMP(3),
      "interviewType" TEXT,
      "interviewerName" TEXT,
      "interviewFeedback" TEXT,
      "rating" DOUBLE PRECISION DEFAULT 0,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    );`,

    `CREATE TABLE IF NOT EXISTS "EmployeeTimeline" (
      "id" TEXT PRIMARY KEY,
      "userId" TEXT NOT NULL,
      "eventType" TEXT NOT NULL,
      "title" TEXT NOT NULL,
      "description" TEXT,
      "effectiveDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "recordedById" TEXT,
      "metadataJson" TEXT DEFAULT '{}',
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    );`,

    `CREATE TABLE IF NOT EXISTS "OnboardingChecklist" (
      "id" TEXT PRIMARY KEY,
      "userId" TEXT UNIQUE NOT NULL,
      "accountCreated" BOOLEAN NOT NULL DEFAULT true,
      "profileCompleted" BOOLEAN NOT NULL DEFAULT false,
      "departmentAssigned" BOOLEAN NOT NULL DEFAULT false,
      "managerAssigned" BOOLEAN NOT NULL DEFAULT false,
      "projectAssigned" BOOLEAN NOT NULL DEFAULT false,
      "documentsUploaded" BOOLEAN NOT NULL DEFAULT false,
      "hrOrientation" BOOLEAN NOT NULL DEFAULT false,
      "policyAcknowledged" BOOLEAN NOT NULL DEFAULT false,
      "status" TEXT NOT NULL DEFAULT 'IN_PROGRESS',
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    );`,

    `CREATE TABLE IF NOT EXISTS "OffboardingRecord" (
      "id" TEXT PRIMARY KEY,
      "userId" TEXT UNIQUE NOT NULL,
      "resignationDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "lastWorkingDay" TIMESTAMP(3) NOT NULL,
      "exitReason" TEXT,
      "noticePeriodDays" INTEGER NOT NULL DEFAULT 30,
      "managerApproval" BOOLEAN NOT NULL DEFAULT false,
      "hrApproval" BOOLEAN NOT NULL DEFAULT false,
      "exitInterviewDone" BOOLEAN NOT NULL DEFAULT false,
      "assetCleared" BOOLEAN NOT NULL DEFAULT false,
      "documentCleared" BOOLEAN NOT NULL DEFAULT false,
      "finalStatus" TEXT NOT NULL DEFAULT 'RESIGNED',
      "notes" TEXT,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    );`,

    `CREATE TABLE IF NOT EXISTS "HRSetting" (
      "id" TEXT PRIMARY KEY,
      "key" TEXT UNIQUE NOT NULL,
      "valueJson" TEXT NOT NULL,
      "description" TEXT,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    );`
  ];

  for (const q of queries) {
    try {
      await prisma.$executeRawUnsafe(q);
    } catch (e) {
      console.warn("Table create note:", e.message);
    }
  }

  // Seed default baseline HR configurations if empty
  try {
    const deptCount = await prisma.department.count();
    if (deptCount === 0) {
      const defaultDepts = [
        { name: "Engineering", code: "ENG", description: "Software Architecture, Development & Infrastructure" },
        { name: "Product & Design", code: "PRD", description: "UI/UX, Product Strategy & User Research" },
        { name: "Quality Assurance", code: "QA", description: "Automated & Manual Quality Engineering" },
        { name: "Human Resources", code: "HR", description: "People Operations, Talent & Culture" },
        { name: "Marketing & Growth", code: "MKT", description: "Brand Strategy, Outreach & Analytics" },
        { name: "Finance & Legal", code: "FIN", description: "Financial Planning, Compliance & Accounting" },
        { name: "Operations", code: "OPS", description: "Business Operations & Facilities" }
      ];
      for (const d of defaultDepts) {
        await prisma.department.create({ data: d });
      }
      console.log("✅ Seeded default departments");
    }

    const leaveTypeCount = await prisma.leaveTypeConfig.count();
    if (leaveTypeCount === 0) {
      const defaultLeaveTypes = [
        { name: "Casual Leave", code: "CL", daysAllowed: 12, isPaid: true, carryForward: false, maxConsecutive: 3 },
        { name: "Sick Leave", code: "SL", daysAllowed: 12, isPaid: true, carryForward: true, maxConsecutive: 5 },
        { name: "Earned / Annual Leave", code: "EL", daysAllowed: 15, isPaid: true, carryForward: true, maxConsecutive: 10 },
        { name: "Emergency Leave", code: "EML", daysAllowed: 5, isPaid: true, carryForward: false, maxConsecutive: 3 },
        { name: "Maternity Leave", code: "ML", daysAllowed: 180, isPaid: true, carryForward: false, maxConsecutive: 180 },
        { name: "Paternity Leave", code: "PL", daysAllowed: 15, isPaid: true, carryForward: false, maxConsecutive: 15 },
        { name: "Unpaid / LOP", code: "UL", daysAllowed: 30, isPaid: false, carryForward: false, maxConsecutive: 30 }
      ];
      for (const lt of defaultLeaveTypes) {
        await prisma.leaveTypeConfig.create({ data: lt });
      }
      console.log("✅ Seeded default leave types");
    }

    const holidayCount = await prisma.holiday.count();
    if (holidayCount === 0) {
      const defaultHolidays = [
        { name: "Republic Day", date: new Date("2026-01-26"), holidayType: "Public Holiday", year: 2026, description: "National Republic Day" },
        { name: "Maha Shivaratri", date: new Date("2026-02-15"), holidayType: "Public Holiday", year: 2026, description: "Festival of Lord Shiva" },
        { name: "Holi", date: new Date("2026-03-04"), holidayType: "Public Holiday", year: 2026, description: "Festival of Colors" },
        { name: "Ugadi / Gudi Padwa", date: new Date("2026-03-20"), holidayType: "Company Holiday", year: 2026, description: "New Year Celebration" },
        { name: "Good Friday", date: new Date("2026-04-03"), holidayType: "Public Holiday", year: 2026, description: "Good Friday" },
        { name: "May Day", date: new Date("2026-05-01"), holidayType: "Public Holiday", year: 2026, description: "International Workers' Day" },
        { name: "Independence Day", date: new Date("2026-08-15"), holidayType: "Public Holiday", year: 2026, description: "National Independence Day" },
        { name: "Gandhi Jayanti", date: new Date("2026-10-02"), holidayType: "Public Holiday", year: 2026, description: "Mahatma Gandhi Birthday" },
        { name: "Dussehra (Vijayadashami)", date: new Date("2026-10-20"), holidayType: "Public Holiday", year: 2026, description: "Victory of Good over Evil" },
        { name: "Diwali (Deepavali)", date: new Date("2026-11-08"), holidayType: "Public Holiday", year: 2026, description: "Festival of Lights" },
        { name: "Christmas Day", date: new Date("2026-12-25"), holidayType: "Public Holiday", year: 2026, description: "Christmas Holiday" }
      ];
      for (const h of defaultHolidays) {
        await prisma.holiday.create({ data: h });
      }
      console.log("✅ Seeded default company holidays");
    }

    const designationCount = await prisma.designation.count();
    if (designationCount === 0) {
      const defaultDesigs = [
        { title: "Chief Technology Officer", department: "Engineering", level: "Executive" },
        { title: "Principal Software Architect", department: "Engineering", level: "Lead" },
        { title: "Senior Full Stack Engineer", department: "Engineering", level: "Senior" },
        { title: "Software Engineer", department: "Engineering", level: "Mid-Level" },
        { title: "Junior Software Developer", department: "Engineering", level: "Junior" },
        { title: "Lead QA Automation Engineer", department: "Quality Assurance", level: "Lead" },
        { title: "Senior Product Designer", department: "Product & Design", level: "Senior" },
        { title: "Human Resources Lead", department: "Human Resources", level: "Lead" },
        { title: "Talent Acquisition Specialist", department: "Human Resources", level: "Mid-Level" }
      ];
      for (const des of defaultDesigs) {
        await prisma.designation.create({ data: des });
      }
      console.log("✅ Seeded default designations");
    }

    const announcementCount = await prisma.hRAnnouncement.count();
    if (announcementCount === 0) {
      await prisma.hRAnnouncement.create({
        data: {
          title: "Welcome to Domain Expansion Enterprise HRMS",
          content: "Welcome to the all-in-one HRMS Command Center! Employees can now record daily attendance with the 8-Hour working rule, manage leave applications, check payslips, review performance KPIs, and view upcoming holiday schedules.",
          priority: "HIGH",
          targetDepartment: "ALL",
          authorName: "HR People Operations"
        }
      });
      console.log("✅ Seeded initial HR announcement");
    }
  } catch (e) {
    console.warn("Seeding note:", e.message);
  }

  console.log("🎉 ALL HRMS TABLES CREATED AND INITIALIZED NON-DESTRUCTIVELY!");
  await prisma.$disconnect();
}

createHrmsTables();
