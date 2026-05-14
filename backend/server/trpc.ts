/**
 * tRPC initialization stub.
 * Implement your own tRPC router, procedures, and context here.
 *
 * Example:
 *   import { initTRPC } from "@trpc/server";
 *   const t = initTRPC.context<YourContext>().create({ transformer: superjson });
 *   export const router = t.router;
 *   export const publicProcedure = t.procedure;
 *   export const protectedProcedure = t.procedure.use(authMiddleware);
 */
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";

type Context = {
  req: any;
  res: any;
  user: any | null;
};

const t = initTRPC.context<Context>().create({ transformer: superjson });

export const router = t.router;
export const publicProcedure = t.procedure;
export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Please login" });
  }
  return next({ ctx: { ...ctx, user: ctx.user } });
});
