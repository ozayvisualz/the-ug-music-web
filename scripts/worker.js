// Background worker for processing jobs
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const JOBS = {
  dailyRevenue: async () => {
    console.log("[Worker] Running daily revenue job...");
    const { RevenueEngine } = require("../src/lib/services/revenue-engine");
    const result = await RevenueEngine.runDailyRevenueJob();
    console.log(`[Worker] Revenue distributed to ${result.artists} artists. Total: ${result.totalDistributed}`);
  },
  cleanupOldStreams: async () => {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const count = await prisma.stream.deleteMany({
      where: { createdAt: { lt: thirtyDaysAgo }, revenueEligible: false },
    });
    console.log(`[Worker] Cleaned up ${count.count} old non-eligible streams`);
  },
};

async function run() {
  console.log("[Worker] Started");
  const job = process.argv[2] || "dailyRevenue";
  if (JOBS[job]) {
    await JOBS[job]();
  } else {
    console.log(`[Worker] Unknown job: ${job}`);
  }
  await prisma.$disconnect();
  process.exit(0);
}

run().catch(console.error);

// If running as daemon, poll every hour
if (process.argv.includes("--daemon")) {
  setInterval(async () => {
    for (const [name, fn] of Object.entries(JOBS)) {
      try { await fn(); } catch (e) { console.error(`[Worker] ${name} failed:`, e); }
    }
  }, 60 * 60 * 1000);
}
