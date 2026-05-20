import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import type {
  Request,
  Response,
} from "express";

import type {
  CreateExpressContextOptions,
} from "@trpc/server/adapters/express";

import {
  createContext,
} from "../../server/context";

import {
  getDb,
} from "../../server/db";

/* ------------------------------------------------ */
/* Mock DB */
/* ------------------------------------------------ */

vi.mock(
  "../../server/db",
  () => ({
    getDb: vi.fn(),
  })
);

/* ------------------------------------------------ */
/* Helpers */
/* ------------------------------------------------ */

function createRequest(
  cookie?: string
) {
  return {
    cookies: {
      session: cookie,
    },
  } as Request;
}

function createResponse() {
  return {} as Response;
}

function createContextOptions(
  cookie?: string
): CreateExpressContextOptions {
  return {
    req: createRequest(
      cookie
    ),

    res: createResponse(),

    info: {
      calls: [],

      isBatchCall: false,

      accept: null,

      type: "query",

      connectionParams:
        null,

      // Fix: AbortSignal cannot be undefined
      signal: new AbortController().signal,

      // Fix: url must be a URL object or null
      url: null,
    },
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
  "createContext",
  () => {
    it(
      "returns null user when cookie is missing",
      async () => {
        const result =
          await createContext(
            createContextOptions()
          );

        expect(
          result.user
        ).toBeNull();
      }
    );

    it(
      "returns null user when cookie is invalid",
      async () => {
        const result =
          await createContext(
            createContextOptions(
              "invalid"
            )
          );

        expect(
          result.user
        ).toBeNull();
      }
    );

    it(
      "returns null user when cookie is NaN",
      async () => {
        const result =
          await createContext(
            createContextOptions(
              "abc"
            )
          );

        expect(
          result.user
        ).toBeNull();
      }
    );

    it(
      "returns null when user does not exist",
      async () => {
        vi.mocked(
          getDb
        ).mockResolvedValue({
          select:
            vi.fn(() => ({
              from:
                vi.fn(() => ({
                  where:
                    vi.fn(() => ({
                      limit:
                        vi
                          .fn()
                          .mockResolvedValue(
                            []
                          ),
                    })),
                })),
            })),
        } as any);

        const result =
          await createContext(
            createContextOptions(
              "1"
            )
          );

        expect(
          result.user
        ).toBeNull();
      }
    );

    it(
      "hydrates authenticated user",
      async () => {
        vi.mocked(
          getDb
        ).mockResolvedValue({
          select:
            vi.fn(() => ({
              from:
                vi.fn(() => ({
                  where:
                    vi.fn(() => ({
                      limit:
                        vi
                          .fn()
                          .mockResolvedValue(
                            [
                              {
                                id: 1,

                                username:
                                  "milton",
                              },
                            ]
                          ),
                    })),
                })),
            })),
        } as any);

        const result =
          await createContext(
            createContextOptions(
              "1"
            )
          );

        expect(
          result.user
        ).toEqual({
          id: 1,

          username:
            "milton",
        });
      }
    );

    it(
      "returns null when db throws",
      async () => {
        vi.mocked(
          getDb
        ).mockRejectedValue(
          new Error(
            "DB Error"
          )
        );

        const result =
          await createContext(
            createContextOptions(
              "1"
            )
          );

        expect(
          result.user
        ).toBeNull();
      }
    );
  }
);
