import {
  describe,
  expect,
  it,
} from "vitest";

import { TRPCError } from "@trpc/server";

import {
  publicProcedure,
  protectedProcedure,
  router,
} from "../../server/trpc";

/* ------------------------------------------------ */
/* Helpers */
/* ------------------------------------------------ */

const createCaller = (
  user: any = null
) => {
  const testRouter = router({
    publicRoute:
      publicProcedure.query(
        () => {
          return {
            ok: true,
          };
        }
      ),

    protectedRoute:
      protectedProcedure.query(
        ({ ctx }) => {
          return {
            userId:
              ctx.user.id,
          };
        }
      ),
  });

  return testRouter.createCaller({
    user,

    req: {} as any,

    res: {} as any,
  });
};

/* ------------------------------------------------ */
/* Tests */
/* ------------------------------------------------ */

describe(
  "publicProcedure",
  () => {
    it(
      "works without authentication",
      async () => {
        const caller =
          createCaller();

        const result =
          await caller.publicRoute();

        expect(result).toEqual({
          ok: true,
        });
      }
    );
  }
);

describe(
  "protectedProcedure",
  () => {
    it(
      "throws when user is not authenticated",
      async () => {
        const caller =
          createCaller();

        await expect(
          caller.protectedRoute()
        ).rejects.toThrow(
          TRPCError
        );
      }
    );

    it(
      "throws UNAUTHORIZED error code",
      async () => {
        const caller =
          createCaller();

        try {
          await caller.protectedRoute();

        } catch (error) {
          expect(error).toBeInstanceOf(
            TRPCError
          );

          expect(
            (
              error as TRPCError
            ).code
          ).toBe(
            "UNAUTHORIZED"
          );
        }
      }
    );

    it(
      "allows authenticated users",
      async () => {
        const caller =
          createCaller({
            id: 123,
            username:
              "milton",
          });

        const result =
          await caller.protectedRoute();

        expect(result).toEqual({
          userId: 123,
        });
      }
    );

    it(
      "preserves ctx.user properties",
      async () => {
        const caller =
          createCaller({
            id: 1,

            username:
              "milton",

            role:
              "admin",
          });

        const result =
          await caller.protectedRoute();

        expect(
          result.userId
        ).toBe(1);
      }
    );
  }
);