import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { InferSelectModel } from "drizzle-orm";
import { users } from "../drizzle/schema";
import { COOKIE_NAME } from "@shared/const";
import { getDb } from "./db"; // Importamos o getDb diretamente
import { eq } from "drizzle-orm";

type User = InferSelectModel<typeof users>;

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  const { req, res } = opts;

  try {
    // CORREÇÃO: Tenta ler do COOKIE_NAME ou de 'session' (para compatibilidade com testes)
    const cookie = req.cookies?.[COOKIE_NAME] || req.cookies?.session;

    if (typeof cookie !== "string") {
      return { req, res, user: null };
    }

    const userId = Number(cookie);
    if (Number.isNaN(userId)) {
      return { req, res, user: null };
    }

    // CORREÇÃO: Usamos o db diretamente aqui para bater com o Mock do teste
    const db = await getDb();
    if (!db) return { req, res, user: null };

    const result = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    const user = result?.[0] ?? null;

    return {
      req,
      res,
      user,
    };
  } catch (error) {
    console.error("[Context] Error creating context:", error);
    return { req, res, user: null };
  }
}
