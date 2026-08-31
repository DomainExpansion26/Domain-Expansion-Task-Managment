const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {

  // 1. OpenRouter AI Configuration (Default System Config)
  await prisma.aIProviderConfig.upsert({
    where: { provider: "OPENROUTER" },
    create: {
      provider: "OPENROUTER",
      defaultModel: "meta-llama/llama-3.3-70b-instruct",
      isEnabled: true,
      monthlyBudget: 100.0,
      requestLimit: 5000,
      currentUsageCost: 0.0,
    },
    update: {
      isEnabled: true,
      defaultModel: "meta-llama/llama-3.3-70b-instruct",
    },
  });

}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
