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

function createUserContext(): TrpcContext {
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

function createAdminContext(): TrpcContext {
  const user: AuthenticatedUser =
    {
      id: 1,
      username: "admin",
      name: "Admin",
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

const mockWhere = vi.fn();
const mockLimit = vi.fn();
const mockSet = vi.fn();

const mockDb = {
  select: vi.fn(() => ({
    from: vi.fn(() => ({
      leftJoin: vi.fn(() => ({
        groupBy: vi.fn(() => ({
          orderBy: vi.fn().mockResolvedValue(
            [
              {
                id: 1,
                actor:
                  "Admin",
                actorRole:
                  "admin",
                createdAt:
                  new Date(),
                actionsCount: 10,
              },
            ]
          ),
        })),
      })),

      where: mockWhere,

      orderBy: vi.fn(() => ({
        limit:
          vi.fn().mockResolvedValue(
            [
              {
                id: 1,
                actor:
                  "Admin",
                actorRole:
                  "admin",
                createdAt:
                  new Date(),
              },
            ]
          ),
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
        mockWhere
          .mockReturnValueOnce({
            limit: vi
              .fn()
              .mockResolvedValue(
                [
                  {
                    id: 1,
                    role:
                      "admin",
                  },
                ]
              ),
          })

          .mockReturnValueOnce(
            vi.fn()
              .mockResolvedValue(
                [
                  {
                    count: 1,
                  },
                ]
              )
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
        mockWhere
          .mockReturnValueOnce({
            limit: vi
              .fn()
              .mockResolvedValue(
                [
                  {
                    id: 2,
                    role:
                      "user",
                  },
                ]
              ),
          })

          .mockReturnValueOnce(
            vi.fn()
              .mockResolvedValue(
                [
                  {
                    count: 2,
                  },
                ]
              )
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