const { PrismaClient } = require("@prisma/client");

async function testConnection() {
  console.log("Testing PostgreSQL connection string...");
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: "postgresql://neondb_owner:npg_UqW4Otx6eaPs@ep-bold-feather-at6voxuk-pooler.c-9.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require&connect_timeout=30&pool_timeout=30",
      },
    },
  });

  try {
    const userCount = await prisma.user.count();
    console.log("✓ Connected to PostgreSQL successfully!");
    console.log("Current total users in DB:", userCount);
    
    const users = await prisma.user.findMany({
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    });
    console.log("Users in database:", users);
  } catch (err) {
    console.error("❌ Database connection error:", err);
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();
