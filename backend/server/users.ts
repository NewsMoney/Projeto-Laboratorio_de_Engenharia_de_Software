import { router, publicProcedure, protectedProcedure } from "./trpc";

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
   *
   * Endpoint público utilizado pelo painel administrativo.
   * Retorna usuários com quantidade de ações/check-ins.
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
        console.error(
          "[users.getAll]",
          error
        );

        return [];
      }
    }
  ),

  /**
   * Alterar role do usuário
   *
   * Regras:
   * - Apenas admins podem alterar roles
   * - Não permite remover o último admin do sistema
   * - Mantém compatibilidade com o frontend atual
   */
  updateRole: protectedProcedure
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
      async ({ ctx, input }) => {
        const db =
          await getDb();

        if (!db) {
          throw new Error(
            "Database unavailable"
          );
        }

        /**
         * Verifica permissão administrativa
         */
        if (
          ctx.user.role !==
          "admin"
        ) {
          throw new Error(
            "Apenas administradores podem alterar roles"
          );
        }

        /**
         * Busca usuário alvo
         */
        const targetUser =
          await db
            .select({
              id: users.id,
              role: users.role,
            })
            .from(users)
            .where(
              eq(
                users.id,
                input.userId
              )
            )
            .limit(1);

        const foundUser =
          targetUser[0];

        if (!foundUser) {
          throw new Error(
            "Usuário não encontrado"
          );
        }

        /**
         * Impede remover o último admin
         */
        if (
          foundUser.role ===
            "admin" &&
          input.role !== "admin"
        ) {
          const admins =
            await db
              .select({
                count:
                  count(),
              })
              .from(users)
              .where(
                eq(
                  users.role,
                  "admin"
                )
              );

          const totalAdmins =
            Number(
              admins[0]?.count ??
                0
            );

          if (
            totalAdmins <= 1
          ) {
            throw new Error(
              "Não é possível remover o último administrador"
            );
          }
        }

        /**
         * Atualiza role
         */
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
   * Timeline administrativa
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
        console.error(
          "[users.timeline]",
          error
        );

        return [];
      }
    }
  ),
});