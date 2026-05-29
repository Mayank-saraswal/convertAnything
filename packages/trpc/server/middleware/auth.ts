import { TRPCError } from "@trpc/server";
import { middleware } from "../trpc";
import { checkRateLimit } from "./rate-limit";

export const rateLimitMiddleware = (
  endpoint: string,
  maxAnonymous: number,
  maxPremium: number
) =>
  middleware(async ({ ctx, next }) => {
    // Determine identifier (user ID or IP)
    const identifier =
      ctx.userId ||
      ctx.req.headers["x-forwarded-for"]?.toString() ||
      ctx.req.socket.remoteAddress ||
      ctx.sessionId ||
      "unknown-ip";

    const limit = ctx.userId ? maxPremium : maxAnonymous;
    const windowMs = 60 * 60 * 1000; // 1 hour

    const allowed = await checkRateLimit(identifier, endpoint, limit, windowMs);

    if (!allowed) {
      throw new TRPCError({
        code: "TOO_MANY_REQUESTS",
        message: `Rate limit exceeded. Please wait or upgrade to a premium plan for higher limits.`,
      });
    }

    return next({ ctx });
  });
