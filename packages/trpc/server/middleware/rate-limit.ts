import { db, eq, sql } from "@repo/database";
import { rateLimitsTable } from "@repo/database/schema";

/**
 * Simple database-backed rate limiter.
 * @param identifier IP or User ID
 * @param endpoint Endpoint name
 * @param limit Max requests per window
 * @param windowMs Window size in milliseconds
 */
export async function checkRateLimit(
  identifier: string,
  endpoint: string,
  limit: number,
  windowMs: number
): Promise<boolean> {
  const now = new Date();
  const windowStart = new Date(now.getTime() - windowMs);

  // Clean up old limits
  await db
    .delete(rateLimitsTable)
    .where(
      sql`${rateLimitsTable.identifier} = ${identifier} AND ${rateLimitsTable.endpoint} = ${endpoint} AND ${rateLimitsTable.windowStart} < ${windowStart}`
    );

  // Get or create limit record
  const existing = await db
    .select()
    .from(rateLimitsTable)
    .where(
      sql`${rateLimitsTable.identifier} = ${identifier} AND ${rateLimitsTable.endpoint} = ${endpoint}`
    )
    .limit(1);

  if (existing.length === 0) {
    await db.insert(rateLimitsTable).values({
      identifier,
      endpoint,
      count: 1,
      windowStart: now,
    });
    return true;
  }

  const record = existing[0]!;

  if (record.count >= limit) {
    return false;
  }

  await db
    .update(rateLimitsTable)
    .set({
      count: record.count + 1,
    })
    .where(eq(rateLimitsTable.id, record.id));

  return true;
}
