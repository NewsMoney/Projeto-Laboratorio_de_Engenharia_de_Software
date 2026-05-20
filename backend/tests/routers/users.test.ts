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
    req: { protocol: "https", headers: {} } as any,
    res: {} as any,
  };
}

function createAdminContext( ): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    username: "milton",
    name: "Admin User",
    role: "admin",
    createdAt: new Date(),
  } as any;

  return { user, req: { protocol: "https", headers: {} } as any, res: {} as any };
}

/* ------------------------------------------------ */
/* DB Mock */
/* ------------------------------------------------ */

// Criamos um mock que retorna a si mesmo para permitir encadeamento: .select( ).from().where()...
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
  // O segredo: o Drizzle é 'thenable', então simulamos o retorno final aqui
  then: vi.fn(),
};

vi.mock("./db", () => ({
  getDb: vi.fn(async () => dbMock),
}));

/* ------------------------------------------------ */
/* Reset */
/* ------------------------------------------------ */

beforeEach(() => {
  vi.clearAllMocks();
  // Configuração padrão: retorna um array vazio para não quebrar
  dbMock.then.mockImplementation((resolve: any) => resolve([]));
});

/* ------------------------------------------------ */
/* Tests */
/* ------------------------------------------------ */

describe("users.updateRole", () => {
  it("prevents removing the last admin", async () => {
    // 1ª chamada (busca usuário): retorna o admin
    // 2ª chamada (conta admins): retorna que só existe 1
    dbMock.then
      .mockImplementationOnce((resolve: any) => resolve([{ id: 1, role: "admin" }]))
      .mockImplementationOnce((resolve: any) => resolve([{ count: 1 }]));

    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.users.updateRole({ userId: 1, role: "user" })
    ).rejects.toThrow("Não é possível remover o último administrador");
  });

  it("updates role successfully", async () => {
    // 1ª chamada: retorna o usuário alvo
    // 2ª chamada: retorna que existem outros admins
    // 3ª chamada: update (retorna undefined ou sucesso)
    dbMock.then
      .mockImplementationOnce((resolve: any) => resolve([{ id: 2, role: "user" }]))
      .mockImplementationOnce((resolve: any) => resolve([{ count: 2 }]))
      .mockImplementationOnce((resolve: any) => resolve({ success: true }));

    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.users.updateRole({ userId: 2, role: "moderator" });
    expect(result.success).toBe(true);
  });
});

describe("users.timeline", () => {
  it("returns timeline entries", async () => {
    // O código do servidor mapeia 'actor' e 'actorRole'
    dbMock.then.mockImplementationOnce((resolve: any) => resolve([
      { id: 1, actor: "Admin", actorRole: "admin", createdAt: new Date().toISOString() }
    ]));

    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.users.timeline();

    // O servidor adiciona 'action: "Conta criada"' no .map()
    expect(result[0]?.action).toBe("Conta criada");
  });
});
