/**
 * tRPC initialization with SuperJSON transformer
 * Handles type serialization and context management
 */

import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";

/**
 * Context type definition
 * Contains request, response, and authenticated user information
 */
type Context = {
  req: any;
  res: any;
  user: any | null;
};

/**
 * Initialize tRPC with context and SuperJSON transformer
 * SuperJSON handles serialization of Date, Map, Set, and other complex types
 */
const t = initTRPC.context<Context>().create({
  transformer: superjson,
  isDev: process.env.NODE_ENV === "development",
});

/**
 * Export base router for creating routes
 */
export const router = t.router;

/**
 * Public procedure - accessible without authentication
 */
export const publicProcedure = t.procedure;

/**
 * Protected procedure - requires authentication
 * Throws UNAUTHORIZED error if user is not authenticated
 */
export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "You must be logged in to access this resource",
    });
  }

  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
    },
  });
});

/**
 * Export tRPC instance for use in other files
 */
export const { middleware } = t;
