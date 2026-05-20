import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import type { Request, Response } from "express";

export type Context = {
  req: Request;
  res: Response;
  user: any | null; 
};

const t = initTRPC.context<Context>().create({
  transformer: superjson,
});

export const router = t.router;
export const publicProcedure = t.procedure;

/**
 * Requer apenas autenticação (qualquer usuário logado)
 */
export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Não autenticado",
    });
  }
  return next({ ctx: { ...ctx, user: ctx.user } });
});

/**
 * Requer ser Moderador OU Administrador
 * Bloqueia usuários comuns ('user')
 */
export const staffProcedure = protectedProcedure.use(({ ctx, next }) => {
  const role = ctx.user.role;
  
  if (role !== "admin" && role !== "moderator") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Acesso negado: Requer nível de Moderador ou superior",
    });
  }

  return next({ ctx });
});

/**
 * Requer ser estritamente Administrador
 */
export const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Acesso negado: Requer nível de Administrador",
    });
  }

  return next({ ctx });
});
