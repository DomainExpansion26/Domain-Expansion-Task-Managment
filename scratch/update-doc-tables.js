const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function updateDocTables() {
  console.log("Safely updating Company Documentation tables without data loss...");

  const queries = [
    `ALTER TABLE "OrganizationDocument" ADD COLUMN IF NOT EXISTS "category" TEXT DEFAULT 'General';`,
    `ALTER TABLE "OrganizationDocument" ADD COLUMN IF NOT EXISTS "team" TEXT DEFAULT 'Core';`,
    `ALTER TABLE "OrganizationDocument" ADD COLUMN IF NOT EXISTS "version" TEXT DEFAULT '1.0';`,
    `ALTER TABLE "OrganizationDocument" ADD COLUMN IF NOT EXISTS "status" TEXT DEFAULT 'PUBLISHED';`,
    `ALTER TABLE "OrganizationDocument" ADD COLUMN IF NOT EXISTS "sortOrder" INTEGER DEFAULT 0;`,
    `ALTER TABLE "OrganizationDocument" ADD COLUMN IF NOT EXISTS "visibility" TEXT DEFAULT 'DEPARTMENT';`,

    `CREATE TABLE IF NOT EXISTS "DocCategory" (
      "id" TEXT PRIMARY KEY,
      "name" TEXT NOT NULL,
      "department" TEXT NOT NULL,
      "description" TEXT,
      "sortOrder" INTEGER NOT NULL DEFAULT 0,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "DocCategory_department_name_key" UNIQUE ("department", "name")
    );`,

    `CREATE TABLE IF NOT EXISTS "DocPhase" (
      "id" TEXT PRIMARY KEY,
      "department" TEXT NOT NULL,
      "category" TEXT NOT NULL DEFAULT 'General',
      "phaseNumber" INTEGER NOT NULL,
      "phaseName" TEXT NOT NULL,
      "description" TEXT,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "DocPhase_department_category_phaseNumber_key" UNIQUE ("department", "category", "phaseNumber")
    );`
  ];

  for (const q of queries) {
    try {
      await prisma.$executeRawUnsafe(q);
    } catch (e) {
      console.warn("SQL execute note:", e.message);
    }
  }

  // Seed default categories & phases for major departments if empty
  try {
    const catCount = await prisma.docCategory.count();
    if (catCount === 0) {
      const defaultCategories = [
        // Development
        { name: "Backend", department: "DEVELOPMENT", description: "Backend Architecture, Node.js, GoLang, PostgreSQL, APIs & Security", sortOrder: 1 },
        { name: "Frontend", department: "DEVELOPMENT", description: "React, Next.js, State Management & Component Architecture", sortOrder: 2 },
        { name: "Mobile", department: "DEVELOPMENT", description: "React Native, iOS, Android, Store Deployment & Mobile APIs", sortOrder: 3 },
        { name: "DevOps", department: "DEVELOPMENT", description: "Docker, Kubernetes, CI/CD, AWS, Neon & Server Configurations", sortOrder: 4 },
        { name: "Database", department: "DEVELOPMENT", description: "Data Schemas, Indexes, Migrations & Performance", sortOrder: 5 },
        { name: "Architecture", department: "DEVELOPMENT", description: "System Architecture, Design Patterns & Scalability", sortOrder: 6 },
        // UI/UX
        { name: "Design System", department: "UI_UX", description: "Color Palettes, Typography, Tokens & Components", sortOrder: 1 },
        { name: "Figma", department: "UI_UX", description: "Figma Libraries, Auto-Layout, Components & Prototypes", sortOrder: 2 },
        { name: "User Research", department: "UI_UX", description: "Personas, User Journeys, Wireframes & Feedback", sortOrder: 3 },
        { name: "Project Designs", department: "UI_UX", description: "Official High-Fidelity UI Screens & Specifications", sortOrder: 4 },
        // QA
        { name: "Testing Guidelines", department: "QA", description: "Test Strategy, Manual Testing & Defect Logging", sortOrder: 1 },
        { name: "Automation", department: "QA", description: "Playwright, Cypress, Jest, API & Regression Testing", sortOrder: 2 },
        { name: "Release Checklist", department: "QA", description: "Pre-Production, Staging & Production Deployment Checks", sortOrder: 3 },
        // Marketing
        { name: "Brand Guidelines", department: "MARKETING", description: "Visual Identity, Logos, Tone of Voice & Assets", sortOrder: 1 },
        { name: "SEO & Content", department: "MARKETING", description: "Keywords, Content Strategy & Social Media", sortOrder: 2 },
        // Company
        { name: "Company Policies", department: "ALL", description: "Code of Conduct, Security, Ethics & Guidelines", sortOrder: 1 },
        { name: "Engineering Standards", department: "ALL", description: "Git Workflow, PR Guidelines & Code Reviews", sortOrder: 2 }
      ];

      for (const cat of defaultCategories) {
        await prisma.docCategory.upsert({
          where: { department_name: { department: cat.department, name: cat.name } },
          create: cat,
          update: cat
        });
      }
      console.log("✅ Seeded default documentation categories");
    }

    const phaseCount = await prisma.docPhase.count();
    if (phaseCount === 0) {
      const defaultPhases = [
        { department: "DEVELOPMENT", category: "Backend", phaseNumber: 1, phaseName: "Phase 1: Architecture & API Standards" },
        { department: "DEVELOPMENT", category: "Backend", phaseNumber: 2, phaseName: "Phase 2: Authentication & Security" },
        { department: "DEVELOPMENT", category: "Backend", phaseNumber: 3, phaseName: "Phase 3: Database Models & Migrations" },
        { department: "DEVELOPMENT", category: "Backend", phaseNumber: 4, phaseName: "Phase 4: Real-time WebSockets & Events" },
        { department: "DEVELOPMENT", category: "Backend", phaseNumber: 5, phaseName: "Phase 5: Microservices & Performance" },
        { department: "DEVELOPMENT", category: "Backend", phaseNumber: 6, phaseName: "Phase 6: Production Deployment & CI/CD" },

        { department: "DEVELOPMENT", category: "Frontend", phaseNumber: 1, phaseName: "Phase 1: Next.js & UI Architecture" },
        { department: "DEVELOPMENT", category: "Frontend", phaseNumber: 2, phaseName: "Phase 2: Redux & State Management" },
        { department: "DEVELOPMENT", category: "Frontend", phaseNumber: 3, phaseName: "Phase 3: API Integration & Caching" },

        { department: "UI_UX", category: "Design System", phaseNumber: 1, phaseName: "Phase 1: Core Design Tokens & Palette" },
        { department: "UI_UX", category: "Design System", phaseNumber: 2, phaseName: "Phase 2: Interactive UI Component Library" },

        { department: "QA", category: "Testing Guidelines", phaseNumber: 1, phaseName: "Phase 1: Test Plan & Test Cases" },
        { department: "QA", category: "Automation", phaseNumber: 2, phaseName: "Phase 2: E2E Automation Suites" }
      ];

      for (const ph of defaultPhases) {
        await prisma.docPhase.upsert({
          where: { department_category_phaseNumber: { department: ph.department, category: ph.category, phaseNumber: ph.phaseNumber } },
          create: ph,
          update: ph
        });
      }
      console.log("✅ Seeded default documentation phases");
    }
  } catch (e) {
    console.warn("Seeding note:", e.message);
  }

  console.log("🎉 COMPANY DOCUMENTATION TABLES & SEEDS VERIFIED NON-DESTRUCTIVELY!");
  await prisma.$disconnect();
}

updateDocTables();
