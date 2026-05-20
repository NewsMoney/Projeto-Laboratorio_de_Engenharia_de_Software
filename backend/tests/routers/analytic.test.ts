import {
  describe,
  expect,
  it,
  vi,
  beforeEach,
} from "vitest";

import { appRouter } from "../../server/routers";
import type { TrpcContext } from "../../server/context";

/* ------------------------------------------------ */
/* Mock DB */
/* ------------------------------------------------ */

const mockDb = {
  select: vi.fn(),
};

vi.mock("../../server/db", () => ({
  getDb: vi.fn(async () => mockDb),
}));

/* ------------------------------------------------ */
/* Helpers */
/* ------------------------------------------------ */

function createContext(): TrpcContext {
  return {
    user: null,

    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],

    res: {} as TrpcContext["res"],
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
  "analytics.summaryStats",
  () => {
    it(
      "returns formatted stats",
      async () => {
        mockDb.select

          .mockReturnValueOnce({
            from: vi
              .fn()
              .mockResolvedValue([
                {
                  count: "10",
                },
              ]),
          })

          .mockReturnValueOnce({
            from: vi
              .fn()
              .mockResolvedValue([
                {
                  count: "25",
                },
              ]),
          })

          .mockReturnValueOnce({
            from: vi
              .fn()
              .mockResolvedValue([
                {
                  count: "5",
                },
              ]),
          })

          .mockReturnValueOnce({
            from: vi
              .fn()
              .mockResolvedValue([
                {
                  count: "7",
                },
              ]),
          })

          .mockReturnValueOnce({
            from: vi
              .fn()
              .mockResolvedValue([
                {
                  avgRating:
                    "4.456",
                },
              ]),
          });

        const caller =
          appRouter.createCaller(
            createContext()
          );

        const result =
          await caller.analytics.summaryStats(
            {}
          );

        expect(result).toEqual({
          totalUsers: 10,
          totalCheckins: 25,
          totalPlaces: 5,
          activeUsers: 7,
          avgRating: "4.5",
        });
      }
    );

    it(
      "returns fallback values on error",
      async () => {
        mockDb.select.mockImplementation(
          () => {
            throw new Error(
              "db error"
            );
          }
        );

        const caller =
          appRouter.createCaller(
            createContext()
          );

        const result =
          await caller.analytics.summaryStats(
            {}
          );

        expect(result).toEqual({
          totalUsers: 0,
          totalCheckins: 0,
          totalPlaces: 0,
          activeUsers: 0,
          avgRating: "0.0",
        });
      }
    );
  }
);

describe(
  "analytics.checkinsTimeline",
  () => {
    it(
      "formats timeline correctly",
      async () => {
        mockDb.select.mockReturnValue({
          from: vi.fn(() => ({
            groupBy:
              vi.fn(() => ({
                orderBy:
                  vi
                    .fn()
                    .mockResolvedValue(
                      [
                        {
                          date:
                            "2025-01-01",
                          count:
                            "10",
                        },

                        {
                          date:
                            "2025-01-02",
                          count:
                            "5",
                        },
                      ]
                    ),
              })),
          })),
        });

        const caller =
          appRouter.createCaller(
            createContext()
          );

        const result =
          await caller.analytics.checkinsTimeline(
            {}
          );

        expect(result).toHaveLength(
          2
        );

        expect(
          result[0]
        ).toMatchObject({
          label: "01/01",
          value: 10,
          percentage: 100,
        });

        expect(
          result[1]
            ?.percentage
        ).toBe(50);
      }
    );

    it(
      "returns empty array on error",
      async () => {
        mockDb.select.mockImplementation(
          () => {
            throw new Error(
              "timeline error"
            );
          }
        );

        const caller =
          appRouter.createCaller(
            createContext()
          );

        const result =
          await caller.analytics.checkinsTimeline(
            {}
          );

        expect(result).toEqual(
          []
        );
      }
    );
  }
);

describe(
  "analytics.topPlaces",
  () => {
    it(
      "formats places correctly",
      async () => {
        mockDb.select.mockReturnValue({
          from: vi.fn(() => ({
            innerJoin:
              vi.fn(() => ({
                groupBy:
                  vi.fn(() => ({
                    orderBy:
                      vi.fn(() => ({
                        limit:
                          vi
                            .fn()
                            .mockResolvedValue(
                              [
                                {
                                  placeId: 1,
                                  placeName:
                                    "Café",

                                  checkinsCount:
                                    "20",

                                  avgRating:
                                    "4.8",
                                },

                                {
                                  placeId: 2,
                                  placeName:
                                    "Bar",

                                  checkinsCount:
                                    "10",

                                  avgRating:
                                    "3.5",
                                },
                              ]
                            ),
                      })),
                  })),
              })),
          })),
        });

        const caller =
          appRouter.createCaller(
            createContext()
          );

        const result =
          await caller.analytics.topPlaces(
            {
              limit: 5,
            }
          );

        expect(result).toHaveLength(
          2
        );

        expect(
          result[0]
        ).toMatchObject({
          id: 1,
          name: "Café",
          checkins: 20,
          avgRating: "4.8",
        });

        expect(
          result[0]
            ?.percentage
        ).toBeCloseTo(
          66.66,
          1
        );

        expect(
          result[1]
            ?.percentage
        ).toBeCloseTo(
          33.33,
          1
        );
      }
    );

    it(
      "returns empty array on error",
      async () => {
        mockDb.select.mockImplementation(
          () => {
            throw new Error(
              "top places error"
            );
          }
        );

        const caller =
          appRouter.createCaller(
            createContext()
          );

        const result =
          await caller.analytics.topPlaces(
            {
              limit: 5,
            }
          );

        expect(result).toEqual(
          []
        );
      }
    );
  }
);