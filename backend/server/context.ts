import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";

import type { InferSelectModel } from "drizzle-orm";

import { users } from "../drizzle/schema";

type User = InferSelectModel<
  typeof users
>;

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  return {
    req: opts.req,
    res: opts.res,
    user: null,
  };
}