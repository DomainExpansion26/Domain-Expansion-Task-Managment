const { PrismaClient } = require("@prisma/client");

async function testEndpoints() {
  const directUrl = "postgresql://neondb_owner:npg_UqW4Otx6eaPs@ep-bold-feather-at6voxuk.c-9.us-east-1.aws.neon.tech/neondb?sslmode=require";
  const poolerUrl = "postgresql://neondb_owner:npg_UqW4Otx6eaPs@ep-bold-feather-at6voxuk-pooler.c-9.us-east-1.aws.neon.tech/neondb?sslmode=require";

  const prismaDirect = new PrismaClient({ datasources: { db: { url: directUrl } } });
  try {
    const c1 = await prismaDirect.user.count();
  } catch (err) {
    console.error("❌ Direct endpoint failed:", err.message);
  } finally {
    await prismaDirect.$disconnect();
  }

  const prismaPooler = new PrismaClient({ datasources: { db: { url: poolerUrl } } });
  try {
    const c2 = await prismaPooler.user.count();
  } catch (err) {
    console.error("❌ Pooler endpoint failed:", err.message);
  } finally {
    await prismaPooler.$disconnect();
  }
}

testEndpoints();
