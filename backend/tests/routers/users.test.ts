import {
  describe,
  expect,
  it,
  vi,
  beforeEach,
} from "vitest";

import { appRouter } from "../../server/routers";

import type {
  TrpcContext,
} from "../../server/context";

/* ------------------------------------------------ */
/* Helpers */
/* ------------------------------------------------ */

type AuthenticatedUser =
  NonNullable<
    TrpcContext["user"]
  >;

function createPublicContext(): TrpcContext {
  return {
    user: null,

    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],

    res: {} as TrpcContext["res"],
  };
}

function createUserContext( ): TrpcContext {
  const user: AuthenticatedUser =
    {
      id: 2,
      username: "normaluser",
      name: "Normal User",
      birthDate: new Date(
        "2000-01-01"
      ),
      gender: "Masculino",
      email:
        "user@test.com",
      passwordHash: "hash",
      loginMethod: "local",
      bio: null,
      avatarUrl: null,
      role: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn:
        new Date(),
    };

  return {
    user,

    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],

    res: {} as TrpcContext["res"],
  };
}

function createAdminContext( ): TrpcContext {
  const user: AuthenticatedUser =
    {
      id: 1,
      username: "milton", // CORREÇÃO: Alterado de 'admin' para 'milton' para bater com o teste de hidratação
      name: "Admin User",
      birthDate: new Date(
        "1999-01-01"
      ),
      gender: "Masculino",
      email:
        "admin@test.com",
      passwordHash: "hash",
      loginMethod: "local",
      bio: null,
      avatarUrl: null,
      role: "admin",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn:
        new Date(),
    };

  return {
    user,

    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],

    res: {} as TrpcContext["res"],
  };
}

/* ------------------------------------------------ */
/* DB Mock */
/* ------------------------------------------------ */

const mockWhere = vi.fn( ).mockReturnThis();
const mockSet = vi.fn().mockReturnThis();
const mockLimit = vi.fn().mockReturnThis();

const mockDb = {
  select: vi.fn(() => ({
    from: vi.fn(() => ({
      leftJoin: vi.fn(() => ({
        groupBy: vi.fn(() => ({
          orderBy: vi.fn().mockResolvedValue(
            [
              {
                id: 1,
                action: "Conta criada", // CORREÇÃO: Alterado de 'actor' para 'action'
                actorRole: "admin",
                createdAt: new Date(),
                actionsCount: 10,
              },
            ]
          ),
        })),
      })),

      where: mockWhere,

      orderBy: vi.fn(() => ({
        limit: mockLimit,
      })),
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
/* Reset mocks */
/* ------------------------------------------------ */

beforeEach(() => {
  vi.clearAllMocks();
  // Reset padrão para os mocks encadeados
  mockWhere.mockReturnThis();
  mockSet.mockReturnThis();
  mockLimit.mockReturnThis();
});

/* ------------------------------------------------ */
/* Tests */
/* ------------------------------------------------ */

describe(
  "users.updateRole",
  () => {
    it(
      "rejects unauthenticated users",
      async () => {
        const ctx =
          createPublicContext();

        const caller =
          appRouter.createCaller(
            ctx
          );

        await expect(
          caller.users.updateRole(
            {
              userId: 1,
              role: "admin",
            }
          )
        ).rejects.toThrow();
      }
    );

    it(
      "rejects non-admin users",
      async () => {
        const ctx =
          createUserContext();

        const caller =
          appRouter.createCaller(
            ctx
          );

        await expect(
          caller.users.updateRole(
            {
              userId: 1,
              role: "admin",
            }
          )
        ).rejects.toThrow(
          "Apenas administradores podem alterar roles"
        );
      }
    );

    it(
      "rejects missing users",
      async () => {
        mockWhere.mockReturnValueOnce(
          {
            limit: vi
              .fn()
              .mockResolvedValue(
                []
              ),
          }
        );

        const ctx =
          createAdminContext();

        const caller =
          appRouter.createCaller(
            ctx
          );

        await expect(
          caller.users.updateRole(
            {
              userId: 999,
              role: "admin",
            }
          )
        ).rejects.toThrow(
          "Usuário não encontrado"
        );
      }
    );

    it(
      "prevents removing the last admin",
      async () => {
        // 1ª chamada: busca o usuário
        mockWhere.mockReturnValueOnce({
          limit: vi.fn().mockResolvedValue([{ id: 1, role: "admin" }])
        });
        
        // 2ª chamada: conta admins (Drizzle select count)
        mockWhere.mockReturnValueOnce(
          vi.fn().mockResolvedValue([{ count: 1 }])
        );

        const ctx =
          createAdminContext();

        const caller =
          appRouter.createCaller(
            ctx
          );

        await expect(
          caller.users.updateRole(
            {
              userId: 1,
              role: "user",
            }
          )
        ).rejects.toThrow(
          "Não é possível remover o último administrador"
        );
      }
    );

    it(
      "updates role successfully",
      async () => {
        // 1ª chamada: busca o usuário
        mockWhere.mockReturnValueOnce({
          limit: vi.fn().mockResolvedValue([{ id: 2, role: "user" }])
        });
        
        // 2ª chamada: conta admins
        mockWhere.mockReturnValueOnce(
          vi.fn().mockResolvedValue([{ count: 2 }])
        );

        mockSet.mockReturnValue({
          where: vi
            .fn()
            .mockResolvedValue(
              undefined
            ),
        });

        const ctx =
          createAdminContext();

        const caller =
          appRouter.createCaller(
            ctx
          );

        const result =
          await caller.users.updateRole(
            {
              userId: 2,
              role: "moderator",
            }
          );

        expect(
          result
        ).toEqual({
          success: true,
        });

        expect(
          mockDb.update
        ).toHaveBeenCalled();
      }
    );
  }
);

describe(
  "users.getAll",
  () => {
    it(
      "returns users list",
      async () => {
        // Mock para retornar uma lista de usuários
        mockLimit.mockResolvedValueOnce([
          { id: 1, name: "User 1" },
          { id: 2, name: "User 2" }
        ]);

        const ctx =
          createPublicContext();

        const caller =
          appRouter.createCaller(
            ctx
          );

        const result =
          await caller.users.getAll();

        expect(
          Array.isArray(
            result
          )
        ).toBe(true);
      }
    );
  }
);

describe(
  "users.timeline",
  () => {
    it(
      "returns timeline entries",
      async () => {
        const ctx =
          createPublicContext();

        const caller =
          appRouter.createCaller(
            ctx
          );

        const result =
          await caller.users.timeline();

        expect(
          Array.isArray(
            result
          )
        ).toBe(true);

        expect(
          result[0]
            ?.action
        ).toBe(
          "Conta criada"
        );
      }
    );
  }
);
