import "dotenv/config";
import { logger } from "@repo/logger";
import { initR2 } from "@repo/storage";
import { startWorker } from "./worker";

async function main() {
  logger.info("[Worker] Starting ConvertAnything PDF Worker...");

  // Initialize R2 storage
  initR2({
    endpoint: process.env.R2_ENDPOINT!,
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    bucket: process.env.R2_BUCKET || "convertanything",
  });

  const concurrency = parseInt(process.env.WORKER_CONCURRENCY || "5", 10);
  const worker = startWorker(concurrency);

  // Graceful shutdown
  const shutdown = async () => {
    logger.info("[Worker] Shutting down...");
    await worker.close();
    process.exit(0);
  };

  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);

  logger.info("[Worker] Worker is running. Waiting for jobs...");
}

main().catch((err) => {
  console.error("[Worker] Fatal error:", err);
  process.exit(1);
});
