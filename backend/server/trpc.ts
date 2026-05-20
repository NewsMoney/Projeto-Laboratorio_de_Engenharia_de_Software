import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import type { Request, Response } from "express";

/**
 * Context type definition for tRPC.
 * Includes Express request/response and the authenticated user.
 */
export type Context = {
  req: Request;
  res: Response;
  user: any | null; // Replace 'any' with your User type if available
};

const t = initTRPC.context<Context>().create({
  transformer: superjson,
});

export const router = t.router;

/**
 * Public procedure that anyone can access.
 */
export const publicProcedure = t.procedure;

/**
 * Protected procedure that requires authentication.
 * Throws UNAUTHORIZED if no user is present in context.
 */
export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Não autenticado",
    });
  }

  // Narrowing the context to ensure 'user' is non-nullable in protected procedures
  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
    },
  });
});
