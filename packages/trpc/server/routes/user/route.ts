import { z } from "../../schema";
import { protectedProcedure, router } from "../../trpc";
import { db, eq } from "@repo/database";
import { usersTable } from "@repo/database/schema";
import { TRPCError } from "@trpc/server";

export const userRouter = router({
  /** Get current authenticated user profile */
  me: protectedProcedure.query(async ({ ctx }) => {
    const users = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.clerkId, ctx.userId))
      .limit(1);

    const user = users[0];
    if (!user) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "User profile not found",
      });
    }

    return user;
  }),
});
