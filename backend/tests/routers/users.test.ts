import { describe, expect, it, vi, beforeEach } from "vitest";
import type { TrpcContext } from "../../server/context";

/* ------------------------------------------------ */
/* DB Mock */
/* ------------------------------------------------ */

const dbMock: any = {
  select: vi.fn().mockReturnThis(),
  from: vi.fn().mockReturnThis(),
  leftJoin: vi.fn().mockReturnThis(),
  groupBy: vi.fn().mockReturnThis(),
  where: vi.fn().mockReturnThis(),
  orderBy: vi.fn().mockReturnThis(),
  limit: vi.fn().mockReturnThis(),
  update: vi.fn().mockReturnThis(),
  set: vi.fn().mockReturnThis(),
  then: vi.fn(),
};

vi.doMock("../../server/db", () => ({
  getDb: async () => dbMock,
}));

/* ------------------------------------------------ */
/* IMPORT DINÂMICO */
/* ------------------------------------------------ */

const { appRouter } = await import("../../server/routers");

/* ------------------------------------------------ */
/* Helpers */
/* ------------------------------------------------ */

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as any,
    res: {} as any,
  };
}

function createAdminContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    username: "milton",
    name: "Admin User",
    role: "admin",
    createdAt: new Date(),
  } as any;

  return {
    user,
    req: { protocol: "https", headers: {} } as any,
    res: {} as any,
  };
}

/* ------------------------------------------------ */
/* Reset */
/* ------------------------------------------------ */

beforeEach(() => {
  vi.clearAllMocks();

  dbMock.select.mockReturnThis();
  dbMock.from.mockReturnThis();
  dbMock.leftJoin.mockReturnThis();
  dbMock.groupBy.mockReturnThis();
  dbMock.where.mockReturnThis();
  dbMock.orderBy.mockReturnThis();
  dbMock.limit.mockReturnThis();
  dbMock.update.mockReturnThis();
  dbMock.set.mockReturnThis();

  dbMock.then.mockImplementation((resolve: any) => resolve([]));
});

/* ------------------------------------------------ */
/* Tests */
/* ------------------------------------------------ */

describe("users.updateRole", () => {
  it("prevents removing the last admin", async () => {
    dbMock.then
      .mockImplementationOnce((resolve: any) =>
        resolve([{ id: 1, role: "admin" }])
      )
      .mockImplementationOnce((resolve: any) =>
        resolve([{ count: 1 }])
      );

    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.users.updateRole({ userId: 1, role: "user" })
    ).rejects.toThrow("Não é possível remover o último administrador");
  });

  it("updates role successfully", async () => {
    dbMock.then.mockImplementationOnce((resolve: any) =>
      resolve([{ id: 2, role: "user" }])
    );

    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.users.updateRole({
      userId: 2,
      role: "moderator",
    });

    expect(result.success).toBe(true);
  });
});

describe("users.timeline", () => {
  it("returns timeline entries", async () => {
    dbMock.then.mockImplementationOnce((resolve: any) =>
      resolve([
        {
          id: 1,
          actor: "Admin",
          actorRole: "admin",
          createdAt: new Date().toISOString(),
        },
      ])
    );

    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.users.timeline();

    expect(result[0]?.action).toBe("Conta criada");
  });
});