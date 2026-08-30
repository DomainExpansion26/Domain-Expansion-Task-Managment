const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  console.log("Updating LeaveTypeConfig to 24-day policy with monthly accrual and benefits...");

  // 1. Casual & Sick Leave (12 days/yr, 1 day/mo accrued on 1st, carry-forward enabled)
  await prisma.leaveTypeConfig.upsert({
    where: { code: "CL" },
    create: {
      name: "Casual / Sick Leave (CL/SL)",
      code: "CL",
      daysAllowed: 12,
      isPaid: true,
      carryForward: true,
      maxConsecutive: 5,
      isActive: true,
    },
    update: {
      name: "Casual / Sick Leave (CL/SL)",
      daysAllowed: 12,
      isPaid: true,
      carryForward: true,
      maxConsecutive: 5,
      isActive: true,
    },
  });

  // 2. Privilege / Earned Leave (12 days/yr, 1 day/mo accrued on 1st, carry-forward enabled)
  await prisma.leaveTypeConfig.upsert({
    where: { code: "PL" },
    create: {
      name: "Privilege / Earned Leave (PL/EL)",
      code: "PL",
      daysAllowed: 12,
      isPaid: true,
      carryForward: true,
      maxConsecutive: 10,
      isActive: true,
    },
    update: {
      name: "Privilege / Earned Leave (PL/EL)",
      daysAllowed: 12,
      isPaid: true,
      carryForward: true,
      maxConsecutive: 10,
      isActive: true,
    },
  });

  // 3. Maternity Leave (26 weeks / 182 days paid under Maternity Benefit Act 2017)
  await prisma.leaveTypeConfig.upsert({
    where: { code: "ML" },
    create: {
      name: "Maternity Leave (26 Weeks)",
      code: "ML",
      daysAllowed: 182,
      isPaid: true,
      carryForward: false,
      maxConsecutive: 182,
      isActive: true,
    },
    update: {
      name: "Maternity Leave (26 Weeks)",
      daysAllowed: 182,
      isPaid: true,
      carryForward: false,
      maxConsecutive: 182,
      isActive: true,
    },
  });

  // 4. Paternity Leave (10 working days paid under Company Paternity Policy)
  await prisma.leaveTypeConfig.upsert({
    where: { code: "PTL" },
    create: {
      name: "Paternity Leave (10 Days)",
      code: "PTL",
      daysAllowed: 10,
      isPaid: true,
      carryForward: false,
      maxConsecutive: 10,
      isActive: true,
    },
    update: {
      name: "Paternity Leave (10 Days)",
      daysAllowed: 10,
      isPaid: true,
      carryForward: false,
      maxConsecutive: 10,
      isActive: true,
    },
  });

  // 5. Unpaid / Loss of Pay (LOP)
  await prisma.leaveTypeConfig.upsert({
    where: { code: "UL" },
    create: {
      name: "Loss of Pay (LOP / Unpaid)",
      code: "UL",
      daysAllowed: 30,
      isPaid: false,
      carryForward: false,
      maxConsecutive: 30,
      isActive: true,
    },
    update: {
      name: "Loss of Pay (LOP / Unpaid)",
      daysAllowed: 30,
      isPaid: false,
      carryForward: false,
      maxConsecutive: 30,
      isActive: true,
    },
  });

  // Clean up any duplicate legacy codes like standalone SL or EML if needed
  try {
    await prisma.leaveTypeConfig.updateMany({
      where: { code: { in: ["SL", "EL", "EML"] } },
      data: { isActive: false },
    });
  } catch (e) {
    // ignore
  }

  const allConfigs = await prisma.leaveTypeConfig.findMany({ where: { isActive: true } });
  console.log("Updated active leave configs:", JSON.stringify(allConfigs, null, 2));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
