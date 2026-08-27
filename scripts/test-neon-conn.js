require("dotenv").config({ path: ".env.local" });
require("dotenv").config({ path: ".env" });
const { PrismaClient } = require("@prisma/client");

async function testNeon() {
  const poolerUrl = "postgresql://neondb_owner:npg_UqW4Otx6eaPs@ep-bold-feather-at6voxuk-pooler.c-9.us-east-1.aws.neon.tech/neondb?sslmode=require";
  const directUrl = "postgresql://neondb_owner:npg_UqW4Otx6eaPs@ep-bold-feather-at6voxuk.c-9.us-east-1.aws.neon.tech/neondb?sslmode=require";

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
