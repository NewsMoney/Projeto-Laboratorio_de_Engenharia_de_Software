import { router, publicProcedure } from "./trpc";
import { z } from "zod";
import { getDb } from "./db";

import {
  checkins,
  places,
  users,
} from "../drizzle/schema";

import {
  eq,
  gte,
  lte,
  sql,
  desc,
  count,
  and,
} from "drizzle-orm";

/**
 * Helper para construir condições de data
 */
function buildDateConditions(
  startDate?: string,
  endDate?: string,
  dateField?: any
) {
  const conditions = [];

  if (startDate && dateField) {
    conditions.push(
      gte(dateField, new Date(startDate))
    );
  }

  if (endDate && dateField) {
    conditions.push(
      lte(dateField, new Date(endDate))
    );
  }

  return conditions.length > 0
    ? and(...conditions)
    : undefined;
}

/**
 * Normaliza números vindos do MySQL
 */
function toNumber(value: unknown): number {
  const parsed = Number(value ?? 0);

  return Number.isNaN(parsed)
    ? 0
    : parsed;
}

/**
 * Formata ratings
 */
function formatRating(value: unknown): string {
  return toNumber(value).toFixed(1);
}

/**
 * Calcula percentual seguro
 */
function calculatePercentage(
  value: number,
  total: number
): number {
  if (total <= 0) return 0;

  return (value / total) * 100;
}

export const analyticsRouter = router({
  /**
   * Summary Stats - Estatísticas resumidas
   */
  summaryStats: publicProcedure
    .input(
      z.object({
        startDate: z.string().optional(),
        endDate: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      const { startDate, endDate } = input;

      const db = await getDb();

      if (!db) {
        return {
          totalUsers: 0,
          totalCheckins: 0,
          totalPlaces: 0,
          activeUsers: 0,
          avgRating: "0.0",
        };
      }

      try {
        const dateCondition =
          buildDateConditions(
            startDate,
            endDate,
            checkins.createdAt
          );

        const totalUsersResult = await db
          .select({ count: count() })
          .from(users);

        const totalCheckinsResult = dateCondition
          ? await db
              .select({ count: count() })
              .from(checkins)
              .where(dateCondition)
          : await db
              .select({ count: count() })
              .from(checkins);

        const totalPlacesResult = await db
          .select({ count: count() })
          .from(places);

        const activeUsersResult = dateCondition
          ? await db
              .select({
                count: count(
                  sql`DISTINCT ${checkins.userId}`
                ),
              })
              .from(checkins)
              .where(dateCondition)
          : await db
              .select({
                count: count(
                  sql`DISTINCT ${checkins.userId}`
                ),
              })
              .from(checkins);

        const avgRatingResult = await db
          .select({
            avgRating:
              sql<number>`
                AVG(${checkins.rating})
              `,
          })
          .from(checkins);

        return {
          totalUsers: toNumber(
            totalUsersResult[0]?.count
          ),

          totalCheckins: toNumber(
            totalCheckinsResult[0]?.count
          ),

          totalPlaces: toNumber(
            totalPlacesResult[0]?.count
          ),

          activeUsers: toNumber(
            activeUsersResult[0]?.count
          ),

          avgRating: formatRating(
            avgRatingResult[0]?.avgRating
          ),
        };

      } catch (error) {
        console.error(
          "[analytics.summaryStats]",
          error
        );

        return {
          totalUsers: 0,
          totalCheckins: 0,
          totalPlaces: 0,
          activeUsers: 0,
          avgRating: "0.0",
        };
      }
    }),

  /**
   * Check-ins Timeline
   */
  checkinsTimeline: publicProcedure
    .input(
      z.object({
        startDate: z.string().optional(),
        endDate: z.string().optional(),
        days: z.number().default(7),
      })
    )
    .query(async ({ input }) => {
      const { startDate, endDate } = input;

      const db = await getDb();

      if (!db) return [];

      try {
        const dateCondition =
          buildDateConditions(
            startDate,
            endDate,
            checkins.createdAt
          );

        const data = dateCondition
          ? await db
              .select({
                date: sql<string>`
                  DATE(${checkins.createdAt})
                `,
                count: count(),
              })
              .from(checkins)
              .where(dateCondition)
              .groupBy(
                sql`
                  DATE(${checkins.createdAt})
                `
              )
              .orderBy(
                sql`
                  DATE(${checkins.createdAt})
                `
              )
          : await db
              .select({
                date: sql<string>`
                  DATE(${checkins.createdAt})
                `,
                count: count(),
              })
              .from(checkins)
              .groupBy(
                sql`
                  DATE(${checkins.createdAt})
                `
              )
              .orderBy(
                sql`
                  DATE(${checkins.createdAt})
                `
              );

        const maxCount = Math.max(
          ...data.map((d) =>
            toNumber(d.count)
          ),
          1
        );

        return data.map((item) => {
          const value =
            toNumber(item.count);

          const dateObj =
            typeof item.date === "string"
              ? new Date(item.date)
              : item.date;

          return {
            label:
              dateObj.toLocaleDateString(
                "pt-BR",
                {
                  month: "2-digit",
                  day: "2-digit",
                }
              ),

            value,

            percentage:
              calculatePercentage(
                value,
                maxCount
              ),
          };
        });

      } catch (error) {
        console.error(
          "[analytics.checkinsTimeline]",
          error
        );

        return [];
      }
    }),

  /**
   * Top Places
   */
  topPlaces: publicProcedure
    .input(
      z.object({
        startDate: z.string().optional(),
        endDate: z.string().optional(),
        limit: z.number().default(5),
      })
    )
    .query(async ({ input }) => {
      const {
        startDate,
        endDate,
        limit,
      } = input;

      const db = await getDb();

      if (!db) return [];

      try {
        const dateCondition =
          buildDateConditions(
            startDate,
            endDate,
            checkins.createdAt
          );

        const data = dateCondition
          ? await db
              .select({
                placeId:
                  checkins.placeId,

                placeName:
                  places.name,

                checkinsCount:
                  count(),

                avgRating:
                  sql<number>`
                    AVG(${checkins.rating})
                  `,
              })
              .from(checkins)
              .innerJoin(
                places,
                eq(
                  checkins.placeId,
                  places.id
                )
              )
              .where(dateCondition)
              .groupBy(
                checkins.placeId,
                places.name
              )
              .orderBy(desc(count()))
              .limit(limit)

          : await db
              .select({
                placeId:
                  checkins.placeId,

                placeName:
                  places.name,

                checkinsCount:
                  count(),

                avgRating:
                  sql<number>`
                    AVG(${checkins.rating})
                  `,
              })
              .from(checkins)
              .innerJoin(
                places,
                eq(
                  checkins.placeId,
                  places.id
                )
              )
              .groupBy(
                checkins.placeId,
                places.name
              )
              .orderBy(desc(count()))
              .limit(limit);

        const totalCheckins =
          data.reduce(
            (sum, item) =>
              sum +
              toNumber(
                item.checkinsCount
              ),
            0
          );

        return data.map((item) => {
          const checkinsValue =
            toNumber(
              item.checkinsCount
            );

          return {
            id: item.placeId,

            name: item.placeName,

            checkins:
              checkinsValue,

            avgRating:
              formatRating(
                item.avgRating
              ),

            percentage:
              calculatePercentage(
                checkinsValue,
                totalCheckins
              ),
          };
        });

      } catch (error) {
        console.error(
          "[analytics.topPlaces]",
          error
        );

        return [];
      }
    }),
});