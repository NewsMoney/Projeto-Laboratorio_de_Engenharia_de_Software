import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { InferSelectModel } from "drizzle-orm";
import { users } from "../drizzle/schema";
import { COOKIE_NAME } from "@shared/const";
import { getUserById } from "./db";

type User = InferSelectModel<typeof users>;

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
};

/**
 * tRPC Context creation.
 * Extracts the user from the session cookie and prepares the context.
 */
export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  const { req, res } = opts;

  try {
    const cookie = req.cookies?.[COOKIE_NAME];

    // 1. Safe cookie check
    if (typeof cookie !== "string") {
      return { req, res, user: null };
    }

    // 2. Safe numeric parse
    const userId = Number(cookie);
    if (Number.isNaN(userId)) {
      return { req, res, user: null };
    }

    // 3. Database fetch with safe fallback
    const user = await getUserById(userId);

    return {
      req,
      res,
      user: user ?? null,
    };
  } catch (error) {
    // 4. Global catch to prevent request failure
    console.error("[Context] Error creating context:", error);
    return {
      req,
      res,
      user: null,
    };
  }
}
