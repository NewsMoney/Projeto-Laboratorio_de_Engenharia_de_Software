import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./cookies";
import { systemRouter } from "./systemRouter";
import { publicProcedure, protectedProcedure, router } from "./trpc";
import {
  createPlace,
  getPlaceById,
  listPlaces,
  searchPlaces,
  nearbyPlaces,
  getTopPlaces,
  createCheckin,
  getCheckinsByPlace,
  getCheckinsByUser,
  getUserStats,
  getPlaceStats,
  getTopUsers,
  getUserById,
  registerUser,
  loginUser,
} from "./db";

import { z } from "zod";

geocode: publicProcedure
  .input(
    z.object({
      address: z.string().min(3),
    })
  )
  .query(async ({ input }) => {
    const url =
      `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(input.address)}`;

    const res = await fetch(url, {
      headers: {
        "User-Agent": "JoinMeApp/1.0",
      },
    });

    const data = await res.json();

    if (!data.length) {
      throw new Error("Endereço não encontrado");
    }

    return {
      lat: Number(data[0].lat),
      lng: Number(data[0].lon),
      displayName: data[0].display_name,
    };
}),

export const appRouter = router({
  system: systemRouter,

    auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),

    register: publicProcedure
      .input(
        z.object({
          name: z.string().min(2),
          email: z.string().email(),
          password: z.string().min(4),
        })
      )
      .mutation(async ({ input }) => {
        return registerUser({
          name: input.name,
          email: input.email,
          password: input.password,
        });
      }),

    login: publicProcedure
      .input(
        z.object({
          email: z.string().email(),
          password: z.string(),
          location: z
            .object({
              lat: z.number(),
              lng: z.number(),
            })
            .nullable()
            .optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const user = await loginUser({
          email: input.email,
          password: input.password,
        });
      
        const cookieOptions = getSessionCookieOptions(ctx.req);
      
        ctx.res.cookie(
          COOKIE_NAME,
          String(user.id),
          cookieOptions
        );
      
        return user;
      }),

    logout: publicProcedure.mutation(({ ctx }) => {
      ctx.res.clearCookie(COOKIE_NAME, {
        path: "/",
        httpOnly: true,
        sameSite: "lax",
        secure: false, // localhost
        expires: new Date(0),
      });
    
      return { success: true };
    }),
  }),

  places: router({
    list: publicProcedure
      .input(z.object({ limit: z.number().min(1).max(100).default(50), offset: z.number().min(0).default(0) }).optional())
      .query(async ({ input }) => {
        const { limit = 50, offset = 0 } = input ?? {};
        return listPlaces(limit, offset);
      }),

    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const place = await getPlaceById(input.id);
        if (!place) throw new Error("Local não encontrado");
        const stats = await getPlaceStats(input.id);
        return { ...place, ...stats };
      }),

    search: publicProcedure
      .input(z.object({ query: z.string().min(1) }))
      .query(async ({ input }) => {
        return searchPlaces(input.query);
      }),

    nearby: publicProcedure
      .input(z.object({ lat: z.number(), lng: z.number(), radiusKm: z.number().min(0.1).max(50).default(5), limit: z.number().min(1).max(100).default(50) }))
      .query(async ({ input }) => {
        return nearbyPlaces(input.lat, input.lng, input.radiusKm, input.limit);
      }),

    topPlaces: publicProcedure
      .input(z.object({ limit: z.number().min(1).max(50).default(10) }).optional())
      .query(async ({ input }) => {
        return getTopPlaces(input?.limit ?? 10);
      }),

    create: protectedProcedure
      .input(
        z.object({
          name: z.string().min(1).max(255),
          address: z.string().min(1).max(500),
          lat: z.string(),
          lng: z.string(),
          category: z.string().max(100).optional(),
          description: z.string().optional(),
          imageUrl: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        return createPlace({
          ...input,
          createdById: ctx.user.id,
        });
      }),
  }),

  checkins: router({
    create: protectedProcedure
      .input(
        z.object({
          placeId: z.number(),
          rating: z.number().min(1).max(5),
          comment: z.string().optional(),
          occupancy: z.enum(["empty", "moderate", "full"]).optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        return createCheckin({
          userId: ctx.user.id,
          ...input,
        });
      }),

    byPlace: publicProcedure
      .input(z.object({ placeId: z.number(), limit: z.number().min(1).max(100).default(50) }))
      .query(async ({ input }) => {
        return getCheckinsByPlace(input.placeId, input.limit);
      }),

    byUser: protectedProcedure
      .input(z.object({ limit: z.number().min(1).max(100).default(50) }).optional())
      .query(async ({ ctx, input }) => {
        return getCheckinsByUser(ctx.user.id, input?.limit ?? 50);
      }),

    userStats: protectedProcedure.query(async ({ ctx }) => {
      return getUserStats(ctx.user.id);
    }),
  }),

  ranking: router({
    topUsers: publicProcedure
      .input(z.object({ limit: z.number().min(1).max(50).default(20) }).optional())
      .query(async ({ input }) => {
        return getTopUsers(input?.limit ?? 20);
      }),

    topPlaces: publicProcedure
      .input(z.object({ limit: z.number().min(1).max(50).default(10) }).optional())
      .query(async ({ input }) => {
        return getTopPlaces(input?.limit ?? 10);
      }),
  }),

  user: router({
    profile: protectedProcedure.query(async ({ ctx }) => {
      const user = await getUserById(ctx.user.id);
      const stats = await getUserStats(ctx.user.id);
      const recentCheckins = await getCheckinsByUser(ctx.user.id, 5);
      return { user, stats, recentCheckins };
    }),
  }),
});

export type AppRouter = typeof appRouter;
