import { router, publicProcedure } from "./trpc";

import { z } from "zod";

import { getDb } from "./db";

import {
  users,
  checkins,
} from "../drizzle/schema";

import {
  eq,
  desc,
  count,
} from "drizzle-orm";

export const usersRouter = router({
  /**
   * Buscar usuários
   */
  getAll: publicProcedure.query(
    async () => {
      const db = await getDb();

      if (!db) return [];

      try {
        const data = await db
          .select({
            id: users.id,

            name: users.name,

            email: users.email,

            username:
              users.username,

            role: users.role,

            gender: users.gender,

            createdAt:
              users.createdAt,

            updatedAt:
              users.updatedAt,

            actionsCount:
              count(
                checkins.id
              ),
          })
          .from(users)
          .leftJoin(
            checkins,
            eq(
              checkins.userId,
              users.id
            )
          )
          .groupBy(users.id)
          .orderBy(
            desc(
              users.createdAt
            )
          );

        return data;
      } catch (error) {
        console.error(error);

        return [];
      }
    }
  ),

  /**
   * Alterar role
   */
  updateRole: publicProcedure
    .input(
      z.object({
        userId: z.number(),

        role: z.enum([
          "user",
          "moderator",
          "admin",
        ]),
      })
    )
    .mutation(
      async ({ input }) => {
        const db =
          await getDb();

        if (!db) {
          throw new Error(
            "Database unavailable"
          );
        }

        await db
          .update(users)
          .set({
            role: input.role,

            updatedAt:
              new Date(),
          })
          .where(
            eq(
              users.id,
              input.userId
            )
          );

        return {
          success: true,
        };
      }
    ),

  /**
   * Timeline
   */
  timeline: publicProcedure.query(
    async () => {
      const db =
        await getDb();

      if (!db) return [];

      try {
        const data =
          await db
            .select({
              id: users.id,

              actor:
                users.name,

              actorRole:
                users.role,

              createdAt:
                users.createdAt,
            })
            .from(users)
            .orderBy(
              desc(
                users.createdAt
              )
            )
            .limit(10);

        return data.map(
          (item) => ({
            id: item.id,

            actor:
              item.actor,

            actorRole:
              item.actorRole,

            action:
              "Conta criada",

            target:
              item.actor,

            description: `Conta ${item.actorRole} criada.`,

            date:
              new Date(
                item.createdAt
              ).toLocaleDateString(
                "pt-BR"
              ),

            severity:
              item.actorRole ===
              "admin"
                ? "success"
                : "info",
          })
        );
      } catch (error) {
        console.error(error);

        return [];
      }
    }
  ),
});