import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import { appRouter } from "../../server/routers";

import type {
  TrpcContext,
} from "../../server/context";

import * as dbModule from "../../server/db";

/* ------------------------------------------------ */
/* Mock DB */
/* ------------------------------------------------ */

vi.mock(
  "../../server/db",
  async () => {
    const actual =
      await vi.importActual(
        "../../server/db"
      );

    return {
      ...actual,

      getUserById:
        vi.fn(),

      getUserStats:
        vi.fn(),

      getCheckinsByUser:
        vi.fn(),

      loginUser:
        vi.fn(),
    };
  }
);

/* ------------------------------------------------ */
/* Helpers */
/* ------------------------------------------------ */

function createContext(
  user: any = null
): TrpcContext {
  return {
    user,

    req: {
      secure: false,
    } as any,

    res: {
      cookie: vi.fn(),

      clearCookie:
        vi.fn(),
    } as any,
  };
}

/* ------------------------------------------------ */
/* Reset */
/* ------------------------------------------------ */

beforeEach(() => {
  vi.clearAllMocks();
});

/* ------------------------------------------------ */
/* Tests */
/* ------------------------------------------------ */

describe(
  "app integration",
  () => {
    it(
      "allows public routes without auth",
      async () => {
        const caller =
          appRouter.createCaller(
            createContext()
          );

        const result =
          await caller.auth.me();

        expect(result).toBeNull();
      }
    );

    it(
      "blocks protected routes without auth",
      async () => {
        const caller =
          appRouter.createCaller(
            createContext()
          );

        await expect(
          caller.user.profile()
        ).rejects.toThrow();
      }
    );

    it(
      "hydrates protected routes with authenticated user",
      async () => {
        vi.mocked(
          dbModule.getUserById
        ).mockResolvedValue({
          id: 1,
          username:
            "milton",
        } as any);

        vi.mocked(
          dbModule.getUserStats
        ).mockResolvedValue({
          totalCheckins: 10,
          uniquePlaces: 5,
          avgRating: 4.8,
        });

        vi.mocked(
          dbModule.getCheckinsByUser
        ).mockResolvedValue(
          []
        );

        const caller =
          appRouter.createCaller(
            createContext({
              id: 1,
            })
          );

        const result =
          await caller.user.profile();

        expect(
          result.user
        ).toEqual({
          id: 1,
          username:
            "milton",
        });

        expect(
          result.stats
            .totalCheckins
        ).toBe(10);
      }
    );

    it(
      "sets auth cookie on login",
      async () => {
        vi.mocked(
          dbModule.loginUser
        ).mockResolvedValue({
          id: 123,
          username:
            "milton",
        } as any);

        const ctx =
          createContext();

        const caller =
          appRouter.createCaller(
            ctx
          );

        await caller.auth.login(
          {
            email:
              "test@test.com",

            password:
              "123456",
          }
        );

        expect(
          ctx.res.cookie
        ).toHaveBeenCalled();
      }
    );

    it(
      "clears cookie on logout",
      async () => {
        const ctx =
          createContext();

        const caller =
          appRouter.createCaller(
            ctx
          );

        const result =
          await caller.auth.logout();

        expect(
          result.success
        ).toBe(true);

        expect(
          ctx.res
            .clearCookie
        ).toHaveBeenCalled();
      }
    );

    it(
      "allows protected routes with authenticated user",
      async () => {
        vi.mocked(
          dbModule.getUserById
        ).mockResolvedValue({
          id: 99,
          username:
            "admin",
        } as any);

        vi.mocked(
          dbModule.getUserStats
        ).mockResolvedValue({
          totalCheckins: 1,
          uniquePlaces: 1,
          avgRating: 5,
        });

        vi.mocked(
          dbModule.getCheckinsByUser
        ).mockResolvedValue(
          []
        );

        const caller =
          appRouter.createCaller(
            createContext({
              id: 99,
              role: "admin",
            })
          );

        const result =
          await caller.user.profile();

        expect(
          result.user?.id
        ).toBe(99);
      }
    );
  }
);