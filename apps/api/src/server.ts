import express from "express";
import { logger } from "@repo/logger";
import cors from "cors";

import * as trpcExpress from "@trpc/server/adapters/express";
import { generateOpenApiDocument, createOpenApiExpressMiddleware } from "trpc-to-openapi";
import { apiReference } from "@scalar/express-api-reference";

import { serverRouter, createContext } from "@repo/trpc/server";

import { env } from "./env";

export const app = express();
const openApiDocument = generateOpenApiDocument(serverRouter, {
  title: "Streamyst OpenAPI",
  version: "1.0.0",
  baseUrl: env.BASE_URL.concat("/api"),
});

if (env.NODE_ENV !== "prod") {
  app.use(
    cors({
      origin: ["http://localhost:3000", "http://127.0.0.1:3000", "http://192.168.1.58:3000"],
      credentials: true,
    }),
  );
}

import { clerkMiddleware } from "@clerk/express";

app.use(express.json({ limit: "200mb" }));
app.use(clerkMiddleware());

app.get("/", (req, res) => {
  return res.json({ message: "Streamyst is up and running..." });
});

app.get("/health", (req, res) => {
  return res.json({ message: "Streamyst server is healthy", healthy: true });
});

logger.debug(`openapi.json: ${env.BASE_URL}/openapi.json`);
app.get("/openapi.json", (req, res) => {
  return res.json(openApiDocument);
});

logger.debug(`docs: ${env.BASE_URL}/docs`);
app.use("/docs", apiReference({ url: "/openapi.json" }));

app.use(
  "/api",
  createOpenApiExpressMiddleware({
    router: serverRouter,
    createContext,
  }),
);

app.use(
  "/trpc",
  trpcExpress.createExpressMiddleware({
    router: serverRouter,
    createContext,
  }),
);

// ─── Proxy upload: browser → API → DO Spaces (bypasses CORS) ───
import { uploadBuffer } from "@repo/storage";

app.put("/upload-proxy/{*key}", express.raw({ type: "*/*", limit: "200mb" }), async (req, res) => {
  try {
    const rawKey = (req.params as any).key;
    const key = Array.isArray(rawKey) ? rawKey.join("/") : rawKey;
    const contentType = req.headers["content-type"] || "application/octet-stream";
    const buffer = Buffer.isBuffer(req.body) ? req.body : Buffer.from(req.body);

    await uploadBuffer(key, buffer, contentType);

    res.json({ success: true, key });
  } catch (err: any) {
    logger.error("Proxy upload failed:", err);
    res.status(500).json({ error: err.message || "Upload failed" });
  }
});

import { cleanupWorker } from "./jobs/cleanup";

// Start cleanup cron
cleanupWorker();

app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error(err);
  res.status(err.status || 500).json({
    error: {
      message: err.message || "Internal Server Error",
    },
  });
});

export default app;
