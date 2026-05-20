import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "../../server/routers";
import type { TrpcContext } from "../../server/context";

/* ------------------------------------------------ */
/* Helpers */
/* ------------------------------------------------ */

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

function createAdminContext( ): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    username: "milton",
    name: "Admin User",
    birthDate: new Date("1999-01-01"),
    gender: "Masculino",
    email: "admin@test.com",
    passwordHash: "hash",
    loginMethod: "local",
    bio: null,
    avatarUrl: null,
    role: "admin",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

/* ------------------------------------------------ */
/* DB Mock */
/* ------------------------------------------------ */

const mockWhere = vi.fn( ).mockReturnThis();
const mockLimit = vi.fn().mockReturnThis();
const mockSet = vi.fn().mockReturnThis();

// O segredo é fazer o Mock retornar uma Promise que resolve em um array
const mockDb = {
  select: vi.fn(() => ({
    from: vi.fn(() => ({
      leftJoin: vi.fn().mockReturnThis(),
      groupBy: vi.fn().mockReturnThis(),
      where: mockWhere,
      orderBy: vi.fn().mockReturnThis(),
      limit: mockLimit,
    })),
  })),
  update: vi.fn(() => ({
    set: mockSet,
  })),
};

vi.mock("./db", () => ({
  getDb: vi.fn(async () => mockDb),
}));

/* ------------------------------------------------ */
/* Reset */
/* ------------------------------------------------ */

beforeEach(() => {
  vi.clearAllMocks();
  
  // Configuração padrão: Sempre encontra um usuário admin
  mockLimit.mockResolvedValue([{ id: 1, role: "admin", action: "Conta criada" }]);
  mockWhere.mockResolvedValue([{ id: 1, role: "admin", action: "Conta criada", count: 2 }]);
  mockSet.mockReturnValue({ where: vi.fn().mockResolvedValue(undefined) });
});

/* ------------------------------------------------ */
/* Tests */
/* ------------------------------------------------ */

describe("users.updateRole", () => {
  it("rejects missing users", async () => {
    // Força retorno vazio APENAS para este teste
    mockLimit.mockResolvedValueOnce([]);

    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.users.updateRole({ userId: 999, role: "admin" })
    ).rejects.toThrow("Usuário não encontrado");
  });

  it("prevents removing the last admin", async () => {
    // 1ª chamada (select user): retorna o admin
    mockLimit.mockResolvedValueOnce([{ id: 1, role: "admin" }]);
    // 2ª chamada (count admins): retorna que só existe 1
    mockWhere.mockResolvedValueOnce([{ count: 1 }]);

    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.users.updateRole({ userId: 1, role: "user" })
    ).rejects.toThrow("Não é possível remover o último administrador");
  });

  it("updates role successfully", async () => {
    // 1ª chamada: retorna o usuário a ser alterado
    mockLimit.mockResolvedValueOnce([{ id: 2, role: "user" }]);
    // 2ª chamada: retorna que existem outros admins (count = 2)
    mockWhere.mockResolvedValueOnce([{ count: 2 }]);

    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.users.updateRole({ userId: 2, role: "moderator" });

    expect(result).toEqual({ success: true });
  });
});

describe("users.timeline", () => {
  it("returns timeline entries", async () => {
    // Garante que o retorno tenha o campo 'action'
    mockLimit.mockResolvedValueOnce([{ id: 1, action: "Conta criada" }]);

    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.users.timeline();

    expect(result[0]?.action).toBe("Conta criada");
  });
});
