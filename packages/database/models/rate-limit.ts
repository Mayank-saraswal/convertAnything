import {
  pgTable,
  uuid,
  text,
  timestamp,
  integer,
  index,
} from "drizzle-orm/pg-core";

export const rateLimitsTable = pgTable(
  "rate_limits",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    // IP address or userId
    identifier: text("identifier").notNull(),

    // Which endpoint / action
    endpoint: text("endpoint").notNull(),

    // Counter
    count: integer("count").default(0).notNull(),

    // Sliding window start
    windowStart: timestamp("window_start").defaultNow().notNull(),
  },
  (table) => [
    index("idx_rate_limits_identifier_endpoint").on(
      table.identifier,
      table.endpoint
    ),
  ]
);

export type SelectRateLimit = typeof rateLimitsTable.$inferSelect;
export type InsertRateLimit = typeof rateLimitsTable.$inferInsert;
