import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import { getAuth } from "@clerk/express";
import { db } from "@repo/database";

export async function createContext({ req, res }: CreateExpressContextOptions) {
  const auth = getAuth(req);
  return {
    req,
    res,
    db,
    userId: auth.userId ?? null,
  };
}

export type Context = Awaited<ReturnType<typeof createContext>>;
