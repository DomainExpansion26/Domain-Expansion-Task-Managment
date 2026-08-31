const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const DEFAULT_DATABASE_URL =
  "postgresql://neondb_owner:npg_UqW4Otx6eaPs@ep-bold-feather-at6voxuk-pooler.c-9.us-east-1.aws.neon.tech/neondb?sslmode=require&connect_timeout=30&pool_timeout=30";

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || DEFAULT_DATABASE_URL,
    },
  },
});

const holidaysToAdd = [
  {
    name: "Ganesh Chaturthi",
    dateStr: "2026-09-14",
    day: "Monday",
    holidayType: "Gazetted / Public Holiday",
    year: 2026,
    description: "Ganesh Chaturthi Celebration",
  },
  {
    name: "Mahatma Gandhi Jayanti",
    dateStr: "2026-10-02",
    day: "Friday",
    holidayType: "National Holiday",
    year: 2026,
    description: "Mahatma Gandhi Jayanti Celebration",
  },
  {
    name: "Diwali / Laxmi Pujan",
    dateStr: "2026-11-08",
    day: "Sunday",
    holidayType: "Gazetted / Public Holiday",
    year: 2026,
    description: "Diwali / Laxmi Pujan Celebration",
  },
  {
    name: "Diwali / Bali Pratipada",
    dateStr: "2026-11-10",
    day: "Tuesday",
    holidayType: "Gazetted / Public Holiday",
    year: 2026,
    description: "Diwali / Bali Pratipada Celebration",
  },
  {
    name: "Christmas",
    dateStr: "2026-12-25",
    day: "Friday",
    holidayType: "Gazetted / Public Holiday",
    year: 2026,
    description: "Christmas Celebration",
  },
];

async function main() {

  // 1. Check existing Holiday records
  const existingHolidays = await prisma.holiday.findMany();
  existingHolidays.forEach((h) => console.log(` - [${h.id}] ${h.name} on ${h.date.toISOString()}`));

  for (const h of holidaysToAdd) {
    const targetDate = new Date(`${h.dateStr}T00:00:00.000Z`);

    // Check if holiday already exists on this date or with this name in Holiday table
    const existing = existingHolidays.find(
      (eh) => eh.name.toLowerCase() === h.name.toLowerCase() || eh.date.toISOString().split('T')[0] === h.dateStr
    );

    if (existing) {
      await prisma.holiday.update({
        where: { id: existing.id },
        data: {
          name: h.name,
          date: targetDate,
          holidayType: h.holidayType,
          year: h.year,
          description: h.description,
        },
      });
    } else {
      await prisma.holiday.create({
        data: {
          name: h.name,
          date: targetDate,
          holidayType: h.holidayType,
          year: h.year,
          description: h.description,
        },
      });
    }

    // Also add to audit logs for COMPANY_HOLIDAY if not present
    const existingLog = await prisma.auditLog.findFirst({
      where: {
        entityType: "COMPANY_HOLIDAY",
        detailsJson: {
          contains: h.dateStr,
        },
      },
    });

    if (!existingLog) {
      await prisma.auditLog.create({
        data: {
          action: "HOLIDAY_CREATED",
          entityType: "COMPANY_HOLIDAY",
          entityId: `holiday-${h.dateStr}`,
          detailsJson: JSON.stringify({
            name: h.name,
            date: h.dateStr,
            day: h.day,
            type: h.holidayType,
          }),
        },
      });
    }
  }

  const allHolidaysAfter = await prisma.holiday.findMany({
    orderBy: { date: "asc" },
  });

  allHolidaysAfter.forEach((h) => {
    console.log(` - ${h.name} | ${h.date.toISOString().split('T')[0]} (${h.holidayType})`);
  });

}

main()
  .catch((e) => {
    console.error("Error executing holiday script:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
