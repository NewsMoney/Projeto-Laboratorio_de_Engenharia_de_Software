import { router, publicProcedure } from "./trpc";
import { z } from "zod";
import { getDb } from "./db";
import { checkins, places, users } from "../drizzle/schema";
import { eq, gte, lte, sql, desc, count, and } from "drizzle-orm";

/**
 * Helper para formatar ratings
 */
function formatRating(
  value: unknown
) {
  const rating =
    Number(value ?? 0);

  return rating.toFixed(1);
}

/**
 * Helper para construir condições de data
 */
function buildDateConditions(
  startDate?: string,
  endDate?: string,
  dateField?: any
) {
  const conditions: any[] = []; // Alteração 1: Tipar conditions
  if (startDate && dateField) {
    conditions.push(gte(dateField, new Date(startDate)));
  }
  if (endDate && dateField) {
    conditions.push(lte(dateField, new Date(endDate)));
  }
  return conditions.length > 0 ? and(...conditions) : undefined;
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
          avgRating: "0",
        };
      }

      try {
        // Total de usuários
        const totalUsersResult = await db
          .select({ count: count() })
          .from(users);

        // Total de check-ins no período
        const dateCondition = buildDateConditions(
          startDate,
          endDate,
          checkins.createdAt
        );

        const totalCheckinsResult = dateCondition
          ? await db
              .select({ count: count() })
              .from(checkins)
              .where(dateCondition)
          : await db
              .select({ count: count() })
              .from(checkins);

        // Total de locais
        const totalPlacesResult = await db
          .select({ count: count() })
          .from(places);

        // Usuários ativos (com check-ins no período)
        const activeUsersResult = dateCondition
          ? await db
              .select({ count: count(sql`DISTINCT ${checkins.userId}`) })
              .from(checkins)
              .where(dateCondition)
          : await db
              .select({ count: count(sql`DISTINCT ${checkins.userId}`) })
              .from(checkins);

        // Rating médio
        const avgRatingResult = await db
          .select({
            avgRating: sql<number>`AVG(${checkins.rating})`,
          })
          .from(checkins);

        // Alteração 2 e 3: Usar optional chaining e helper formatRating
        return {
          totalUsers: Number(totalUsersResult?.[0]?.count ?? 0),
          totalCheckins: Number(totalCheckinsResult?.[0]?.count ?? 0),
          totalPlaces: Number(totalPlacesResult?.[0]?.count ?? 0),
          activeUsers: Number(activeUsersResult?.[0]?.count ?? 0),
          avgRating: formatRating(avgRatingResult?.[0]?.avgRating),
        };
      } catch (error) {
        console.error("Error fetching summary stats:", error);
        return {
          totalUsers: 0,
          totalCheckins: 0,
          totalPlaces: 0,
          activeUsers: 0,
          avgRating: "0",
        };
      }
    }),

  /**
   * Check-ins Timeline - Gráfico de check-ins ao longo do tempo
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
        const dateCondition = buildDateConditions(
          startDate,
          endDate,
          checkins.createdAt
        );

        const data = dateCondition
          ? await db
              .select({
                date: sql<string>`DATE(${checkins.createdAt})`,
                count: count(),
              })
              .from(checkins)
              .where(dateCondition)
              .groupBy(sql`DATE(${checkins.createdAt})`)
              .orderBy(sql`DATE(${checkins.createdAt})`)
          : await db
              .select({
                date: sql<string>`DATE(${checkins.createdAt})`,
                count: count(),
              })
              .from(checkins)
              .groupBy(sql`DATE(${checkins.createdAt})`)
              .orderBy(sql`DATE(${checkins.createdAt})`);

        // Alteração 5: Proteger Math.max com Number()
        const counts = data.map((d) => Number(d.count));
        const maxCount = Math.max(...counts, 1);

        return data.map((item) => {
          const dateStr = item.date;
          const dateObj = typeof dateStr === "string" ? new Date(dateStr) : dateStr;
          
          // Alteração 4: Number(...) nos counts
          const itemCount = Number(item.count);
          return {
            label: dateObj.toLocaleDateString("pt-BR", {
              month: "2-digit",
              day: "2-digit",
            }),
            value: itemCount,
            percentage: (itemCount / maxCount) * 100,
          };
        });
      } catch (error) {
        console.error("Error fetching checkins timeline:", error);
        return [];
      }
    }),

  /**
   * Top Places - Locais mais visitados
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
      const { startDate, endDate, limit } = input;
      const db = await getDb();

      if (!db) return [];

      try {
        const dateCondition = buildDateConditions(
          startDate,
          endDate,
          checkins.createdAt
        );

        const data = dateCondition
          ? await db
              .select({
                placeId: checkins.placeId,
                placeName: places.name,
                checkinsCount: count(),
                avgRating: sql<number>`AVG(${checkins.rating})`,
              })
              .from(checkins)
              .innerJoin(places, eq(checkins.placeId, places.id))
              .where(dateCondition)
              .groupBy(checkins.placeId, places.name)
              .orderBy(desc(count()))
              .limit(limit)
          : await db
              .select({
                placeId: checkins.placeId,
                placeName: places.name,
                checkinsCount: count(),
                avgRating: sql<number>`AVG(${checkins.rating})`,
              })
              .from(checkins)
              .innerJoin(places, eq(checkins.placeId, places.id))
              .groupBy(checkins.placeId, places.name)
              .orderBy(desc(count()))
              .limit(limit);

        // Alteração 4: Number(...) nos counts
        const totalCheckins = data.reduce((sum, d) => sum + Number(d.checkinsCount), 0);

        return data.map((item) => {
          // Alteração 3: Usar helper formatRating
          const checkinsCount = Number(item.checkinsCount);
          return {
            id: item.placeId,
            name: item.placeName,
            checkins: checkinsCount,
            avgRating: formatRating(item.avgRating),
            percentage: totalCheckins > 0 ? (checkinsCount / totalCheckins) * 100 : 0,
          };
        });
      } catch (error) {
        console.error("Error fetching top places:", error);
        return [];
      }
    }),

  /**
   * Occupancy Distribution - Distribuição de ocupação
   */
  occupancyDistribution: publicProcedure
    .input(
      z.object({
        startDate: z.string().optional(),
        endDate: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      const { startDate, endDate } = input;
      const db = await getDb();

      if (!db) return [];

      try {
        const dateCondition = buildDateConditions(
          startDate,
          endDate,
          checkins.createdAt
        );

        const data = dateCondition
          ? await db
              .select({
                occupancy: checkins.occupancy,
                count: count(),
              })
              .from(checkins)
              .where(dateCondition)
              .groupBy(checkins.occupancy)
          : await db
              .select({
                occupancy: checkins.occupancy,
                count: count(),
              })
              .from(checkins)
              .groupBy(checkins.occupancy);

        // Alteração 4: Number(...) nos counts
        const total = data.reduce((sum, d) => sum + Number(d.count), 0);

        return data.map((item) => ({
          occupancy: item.occupancy || "unknown",
          count: Number(item.count),
          percentage: total > 0 ? (Number(item.count) / total) * 100 : 0,
        }));
      } catch (error) {
        console.error("Error fetching occupancy distribution:", error);
        return [];
      }
    }),

  /**
   * Top Rated Places - Locais melhor avaliados
   */
  topRatedPlaces: publicProcedure
    .input(
      z.object({
        startDate: z.string().optional(),
        endDate: z.string().optional(),
        limit: z.number().default(5),
      })
    )
    .query(async ({ input }) => {
      const { startDate, endDate, limit } = input;
      const db = await getDb();

      if (!db) return [];

      try {
        const dateCondition = buildDateConditions(
          startDate,
          endDate,
          checkins.createdAt
        );

        const data = dateCondition
          ? await db
              .select({
                placeId: checkins.placeId,
                placeName: places.name,
                avgRating: sql<number>`AVG(${checkins.rating})`,
                checkinsCount: count(),
              })
              .from(checkins)
              .innerJoin(places, eq(checkins.placeId, places.id))
              .where(dateCondition)
              .groupBy(checkins.placeId, places.name)
              .having(sql`COUNT(*) >= 2`)
              .orderBy(desc(sql`AVG(${checkins.rating})`))
              .limit(limit)
          : await db
              .select({
                placeId: checkins.placeId,
                placeName: places.name,
                avgRating: sql<number>`AVG(${checkins.rating})`,
                checkinsCount: count(),
              })
              .from(checkins)
              .innerJoin(places, eq(checkins.placeId, places.id))
              .groupBy(checkins.placeId, places.name)
              .having(sql`COUNT(*) >= 2`)
              .orderBy(desc(sql`AVG(${checkins.rating})`))
              .limit(limit);

        return data.map((item) => {
          // Alteração 3: Usar helper formatRating
          return {
            id: item.placeId,
            name: item.placeName,
            avgRating: formatRating(item.avgRating),
            checkinsCount: Number(item.checkinsCount), // Alteração 4: Number(...) nos counts
          };
        });
      } catch (error) {
        console.error("Error fetching top rated places:", error);
        return [];
      }
    }),

  /**
   * Most Active Users - Usuários mais ativos
   */
  mostActiveUsers: publicProcedure
    .input(
      z.object({
        startDate: z.string().optional(),
        endDate: z.string().optional(),
        limit: z.number().default(5),
      })
    )
    .query(async ({ input }) => {
      const { startDate, endDate, limit } = input;
      const db = await getDb();

      if (!db) return [];

      try {
        const dateCondition = buildDateConditions(
          startDate,
          endDate,
          checkins.createdAt
        );

        const data = dateCondition
          ? await db
              .select({
                userId: checkins.userId,
                userName: users.name,
                checkinsCount: count(),
                avgRating: sql<number>`AVG(${checkins.rating})`,
              })
              .from(checkins)
              .innerJoin(users, eq(checkins.userId, users.id))
              .where(dateCondition)
              .groupBy(checkins.userId, users.name)
              .orderBy(desc(count()))
              .limit(limit)
          : await db
              .select({
                userId: checkins.userId,
                userName: users.name,
                checkinsCount: count(),
                avgRating: sql<number>`AVG(${checkins.rating})`,
              })
              .from(checkins)
              .innerJoin(users, eq(checkins.userId, users.id))
              .groupBy(checkins.userId, users.name)
              .orderBy(desc(count()))
              .limit(limit);

        return data.map((item) => {
          // Alteração 3: Usar helper formatRating
          return {
            id: item.userId,
            name: item.userName,
            checkins: Number(item.checkinsCount), // Alteração 4: Number(...) nos counts
            avgRating: formatRating(item.avgRating),
          };
        });
      } catch (error) {
        console.error("Error fetching most active users:", error);
        return [];
      }
    }),

  /**
   * Rating Distribution - Distribuição de ratings
   */
  ratingDistribution: publicProcedure
    .input(
      z.object({
        startDate: z.string().optional(),
        endDate: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      const { startDate, endDate } = input;
      const db = await getDb();

      if (!db) return [];

      try {
        const dateCondition = buildDateConditions(
          startDate,
          endDate,
          checkins.createdAt
        );

        const data = dateCondition
          ? await db
              .select({
                rating: checkins.rating,
                count: count(),
              })
              .from(checkins)
              .where(dateCondition)
              .groupBy(checkins.rating)
              .orderBy(checkins.rating)
          : await db
              .select({
                rating: checkins.rating,
                count: count(),
              })
              .from(checkins)
              .groupBy(checkins.rating)
              .orderBy(checkins.rating);

        // Alteração 4: Number(...) nos counts
        const total = data.reduce((sum, d) => sum + Number(d.count), 0);

        return data.map((item) => ({
          rating: Number(item.rating),
          count: Number(item.count),
          percentage: total > 0 ? (Number(item.count) / total) * 100 : 0,
        }));
      } catch (error) {
        console.error("Error fetching rating distribution:", error);
        return [];
      }
    }),

  /**
   * User Growth - Crescimento de usuários
   */
  userGrowth: publicProcedure
    .input(
      z.object({
        startDate: z.string().optional(),
        endDate: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      const { startDate, endDate } = input;
      const db = await getDb();

      if (!db) return [];

      try {
        const dateCondition = buildDateConditions(
          startDate,
          endDate,
          users.createdAt
        );

        const data = dateCondition
          ? await db
              .select({
                date: sql<string>`DATE(${users.createdAt})`,
                count: count(),
              })
              .from(users)
              .where(dateCondition)
              .groupBy(sql`DATE(${users.createdAt})`)
              .orderBy(sql`DATE(${users.createdAt})`)
          : await db
              .select({
                date: sql<string>`DATE(${users.createdAt})`,
                count: count(),
              })
              .from(users)
              .groupBy(sql`DATE(${users.createdAt})`)
              .orderBy(sql`DATE(${users.createdAt})`);

        return data.map((item) => {
          const dateStr = item.date;
          const dateObj = typeof dateStr === "string" ? new Date(dateStr) : dateStr;

          return {
            date: dateObj.toLocaleDateString("pt-BR", {
              month: "2-digit",
              day: "2-digit",
            }),
            newUsers: Number(item.count), // Alteração 4: Number(...) nos counts
          };
        });
      } catch (error) {
        console.error("Error fetching user growth:", error);
        return [];
      }
    }),
});
