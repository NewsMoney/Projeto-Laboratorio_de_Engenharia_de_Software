import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import { COOKIE_NAME } from "../shared/const";
import type { TrpcContext } from "./context";

// ─── Helpers ────────────────────────────────────────────────────

type CookieCall = { name: string; options: Record<string, unknown> };
type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

function createAuthContext(): { ctx: TrpcContext; clearedCookies: CookieCall[] } {
  const clearedCookies: CookieCall[] = [];

  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user-123",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "google",
    role: "user",
    avatarUrl: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {
      clearCookie: (name: string, options: Record<string, unknown>) => {
        clearedCookies.push({ name, options });
      },
    } as TrpcContext["res"],
  };

  return { ctx, clearedCookies };
}

// ─── Mock db module ─────────────────────────────────────────────

vi.mock("./db", () => ({
  createPlace: vi.fn().mockResolvedValue({ id: 1 }),
  getPlaceById: vi.fn().mockResolvedValue({
    id: 1,
    name: "Café Central",
    address: "Rua Principal, 123",
    lat: "-23.5505000",
    lng: "-46.6333000",
    category: "cafe",
    description: "Um café aconchegante",
    imageUrl: null,
    createdById: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
  }),
  listPlaces: vi.fn().mockResolvedValue([
    {
      id: 1,
      name: "Café Central",
      address: "Rua Principal, 123",
      lat: "-23.5505000",
      lng: "-46.6333000",
      category: "cafe",
      description: null,
      imageUrl: null,
      createdById: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ]),
  searchPlaces: vi.fn().mockResolvedValue([]),
  nearbyPlaces: vi.fn().mockResolvedValue([]),
  getTopPlaces: vi.fn().mockResolvedValue([
    { id: 1, name: "Café Central", address: "Rua Principal, 123", lat: "-23.55", lng: "-46.63", category: "cafe", imageUrl: null, description: null, checkinCount: 10, avgRating: 4.5 },
  ]),
  createCheckin: vi.fn().mockResolvedValue({ id: 1 }),
  getCheckinsByPlace: vi.fn().mockResolvedValue([]),
  getCheckinsByUser: vi.fn().mockResolvedValue([]),
  getUserStats: vi.fn().mockResolvedValue({ totalCheckins: 5, uniquePlaces: 3, avgRating: 4.2, totalReviews: 2 }),
  getPlaceStats: vi.fn().mockResolvedValue({ totalCheckins: 10, avgRating: 4.5 }),
  getTopUsers: vi.fn().mockResolvedValue([
    { id: 1, name: "Test User", avatarUrl: null, checkinCount: 5, avgRating: 4.2 },
  ]),
  getUserById: vi.fn().mockResolvedValue({
    id: 1,
    openId: "test-user-123",
    name: "Test User",
    email: "test@example.com",
    loginMethod: "google",
    role: "user",
    avatarUrl: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  }),
  upsertUser: vi.fn(),
  getUserByOpenId: vi.fn(),
}));

// ─── Tests ──────────────────────────────────────────────────────

describe("auth.logout", () => {
  it("clears the session cookie and reports success", async () => {
    const { ctx, clearedCookies } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.logout();

    expect(result).toEqual({ success: true });
    expect(clearedCookies).toHaveLength(1);
    expect(clearedCookies[0]?.name).toBe(COOKIE_NAME);
  });
});

describe("auth.me", () => {
  it("returns null for unauthenticated user", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.me();
    expect(result).toBeNull();
  });

  it("returns user for authenticated user", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.me();
    expect(result).toBeDefined();
    expect(result?.name).toBe("Test User");
  });
});

describe("places", () => {
  it("lists places", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.places.list({ limit: 10, offset: 0 });
    expect(Array.isArray(result)).toBe(true);
  });

  it("gets place by id with stats", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.places.getById({ id: 1 });
    expect(result.name).toBe("Café Central");
    expect(result.totalCheckins).toBe(10);
    expect(result.avgRating).toBe(4.5);
  });

  it("searches places", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.places.search({ query: "café" });
    expect(Array.isArray(result)).toBe(true);
  });

  it("gets nearby places", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.places.nearby({ lat: -23.55, lng: -46.63, radiusKm: 5, limit: 10 });
    expect(Array.isArray(result)).toBe(true);
  });

  it("gets top places", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.places.topPlaces({ limit: 5 });
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
  });

  it("creates a place (authenticated)", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.places.create({
      name: "Novo Local",
      address: "Rua Nova, 456",
      lat: "-23.5505",
      lng: "-46.6333",
      category: "restaurant",
    });
    expect(result.id).toBe(1);
  });

  it("rejects place creation for unauthenticated user", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.places.create({
        name: "Novo Local",
        address: "Rua Nova, 456",
        lat: "-23.5505",
        lng: "-46.6333",
      })
    ).rejects.toThrow();
  });
});

describe("checkins", () => {
  it("creates a checkin (authenticated)", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.checkins.create({
      placeId: 1,
      rating: 4,
      comment: "Ótimo lugar!",
      occupancy: "moderate",
    });
    expect(result.id).toBe(1);
  });

  it("rejects checkin for unauthenticated user", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.checkins.create({ placeId: 1, rating: 4 })
    ).rejects.toThrow();
  });

  it("gets checkins by place", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.checkins.byPlace({ placeId: 1, limit: 10 });
    expect(Array.isArray(result)).toBe(true);
  });

  it("gets user stats (authenticated)", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.checkins.userStats();
    expect(result.totalCheckins).toBe(5);
    expect(result.uniquePlaces).toBe(3);
  });
});

describe("ranking", () => {
  it("gets top users", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.ranking.topUsers({ limit: 10 });
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
  });

  it("gets top places", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.ranking.topPlaces({ limit: 5 });
    expect(Array.isArray(result)).toBe(true);
  });
});

describe("user.profile", () => {
  it("returns profile with stats and recent checkins", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.user.profile();
    expect(result.user).toBeDefined();
    expect(result.user?.name).toBe("Test User");
    expect(result.stats.totalCheckins).toBe(5);
    expect(Array.isArray(result.recentCheckins)).toBe(true);
  });

  it("rejects profile for unauthenticated user", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.user.profile()).rejects.toThrow();
  });
});
