require("dotenv").config({ path: ".env.local" });
require("dotenv").config({ path: ".env" });
const { PrismaClient } = require("@prisma/client");

async function testNeon() {
  const poolerUrl = process.env.DATABASE_URL || "";
  const directUrl = process.env.DIRECT_URL || "";

  try {
    const prismaPooler = new PrismaClient({ datasources: { db: { url: poolerUrl } } });
    const u1 = await prismaPooler.user.findMany({ take: 1 });
    await prismaPooler.$disconnect();
  } catch (err) {
    console.error("❌ Pooler failed:", err.message);
  }

  try {
    const prismaDirect = new PrismaClient({ datasources: { db: { url: directUrl } } });
    const u2 = await prismaDirect.user.findMany({ take: 1 });
    await prismaDirect.$disconnect();
  } catch (err) {
    console.error("❌ Direct failed:", err.message);
  }
}

testNeon();
