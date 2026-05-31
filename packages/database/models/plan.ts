import {
  pgTable,
  uuid,
  text,
  timestamp,
  integer,
} from "drizzle-orm/pg-core";
import { usersTable } from "./user";

export const userPlansTable = pgTable("user_plans", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => usersTable.id, {
    onDelete: "cascade",
  }).notNull().unique(),
  plan: text("plan").notNull().default("free"), // 'free' | 'pro'
  jobsThisMonth: integer("jobs_this_month").default(0),
  resetAt: timestamp("reset_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export type SelectUserPlan = typeof userPlansTable.$inferSelect;
export type InsertUserPlan = typeof userPlansTable.$inferInsert;
