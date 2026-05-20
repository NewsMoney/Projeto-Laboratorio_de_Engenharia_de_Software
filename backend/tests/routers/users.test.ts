import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "../../server/routers";
import type { TrpcContext } from "../../server/context";

/* ------------------------------------------------ */
/* Mock DB */
/* ------------------------------------------------ */

const mockDb = {
  select: vi.fn(),
  update: vi.fn(),
};

vi.mock("../../server/db", () => ({
  getDb: vi.fn(async () => mockDb),
}));

/* ------------------------------------------------ */
/* Helpers */
/* ------------------------------------------------ */

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as any,
    res: {} as any,
  };
}

function createAdminContext( ): TrpcContext {
  return {
    user: {
      id: 1,
      username: "milton",
      name: "Admin User",
      role: "admin",
      createdAt: new Date(),
    } as any,
    req: { protocol: "https", headers: {} } as any,
    res: {} as any,
  };
}

/* ------------------------------------------------ */
/* Reset */
/* ------------------------------------------------ */

beforeEach(( ) => {
  vi.clearAllMocks();
});

/* ------------------------------------------------ */
/* Tests */
/* ------------------------------------------------ */

describe("users.updateRole", () => {
  it("prevents removing the last admin", async () => {
    // Mock para buscar o usuário alvo e depois contar admins
    mockDb.select
      // Primeira chamada: busca o usuário alvo
      .mockReturnValueOnce({
        from: vi.fn(() => ({
          where: vi.fn(() => ({
            limit: vi.fn().mockResolvedValue([{ id: 1, role: "admin" }]),
          })),
        })),
      })
      // Segunda chamada: conta quantos admins existem
      .mockReturnValueOnce({
        from: vi.fn(() => ({
          where: vi.fn().mockResolvedValue([{ count: 1 }]),
        })),
      });

    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.users.updateRole({ userId: 1, role: "user" })
    ).rejects.toThrow("Não é possível remover o último administrador");
  });

  it("updates role successfully", async () => {
    // Mock para buscar o usuário alvo
    mockDb.select.mockReturnValueOnce({
      from: vi.fn(() => ({
        where: vi.fn(() => ({
          limit: vi.fn().mockResolvedValue([{ id: 2, role: "user" }]),
        })),
      })),
    });

    // Mock para a operação de update
    mockDb.update.mockReturnValueOnce({
      set: vi.fn(() => ({
        where: vi.fn().mockResolvedValue({ success: true }),
      })),
    });

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
    // Mock para a query da timeline
    mockDb.select.mockReturnValueOnce({
      from: vi.fn(() => ({
        orderBy: vi.fn(() => ({
          limit: vi.fn().mockResolvedValue([
            {
              id: 1,
              actor: "Admin",
              actorRole: "admin",
              createdAt: new Date(),
            },
          ]),
        })),
      })),
    });

    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.users.timeline();

    expect(result).toHaveLength(1);
    expect(result[0]?.action).toBe("Conta criada");
  });
});
