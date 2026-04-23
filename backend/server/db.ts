import { eq, desc, sql, like, and } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, places, checkins, InsertPlace, InsertCheckin } from "../drizzle/schema";
import bcrypt from "bcryptjs";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ─── User helpers ───────────────────────────────────────────────

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.email) {
    throw new Error("User email is required for upsert");
  }

  const db = await getDb();

  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      email: user.email,
    };

    const updateSet: Record<string, unknown> = {};

    const textFields = [
      "name",
      "loginMethod",
      "avatarUrl",
      "passwordHash",
    ] as const;

    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];

      if (value === undefined) return;

      const normalized = value ?? null;

      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }

    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db
      .insert(users)
      .values(values)
      .onDuplicateKeyUpdate({
        set: updateSet,
      });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ─── Place helpers ──────────────────────────────────────────────

export async function createPlace(place: InsertPlace) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(places).values(place);
  return { id: result[0].insertId };
}

export async function getPlaceById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(places).where(eq(places.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function listPlaces(limit = 50, offset = 0) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(places).orderBy(desc(places.createdAt)).limit(limit).offset(offset);
}

export async function nearbyPlaces(lat: number, lng: number, radiusKm = 5, limit = 50) {
  const db = await getDb();
  if (!db) return [];
  // Bounding box approximation for performance
  const latDelta = radiusKm / 111.0;
  const lngDelta = radiusKm / (111.0 * Math.cos((lat * Math.PI) / 180));
  const result = await db
    .select({
      id: places.id,
      name: places.name,
      address: places.address,
      lat: places.lat,
      lng: places.lng,
      category: places.category,
      imageUrl: places.imageUrl,
      description: places.description,
      distance: sql<number>`(
        6371 * ACOS(
          COS(RADIANS(${lat})) * COS(RADIANS(${places.lat})) *
          COS(RADIANS(${places.lng}) - RADIANS(${lng})) +
          SIN(RADIANS(${lat})) * SIN(RADIANS(${places.lat}))
        )
      )`.as("distance"),
    })
    .from(places)
    .where(
      and(
        sql`${places.lat} BETWEEN ${lat - latDelta} AND ${lat + latDelta}`,
        sql`${places.lng} BETWEEN ${lng - lngDelta} AND ${lng + lngDelta}`
      )
    )
    .orderBy(sql`distance ASC`)
    .limit(limit);
  return result;
}

export async function searchPlaces(query: string) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(places)
    .where(like(places.name, `%${query}%`))
    .orderBy(desc(places.createdAt))
    .limit(50);
}

export async function getTopPlaces(limit = 10) {
  const db = await getDb();
  if (!db) return [];
  const result = await db
    .select({
      id: places.id,
      name: places.name,
      address: places.address,
      lat: places.lat,
      lng: places.lng,
      category: places.category,
      imageUrl: places.imageUrl,
      description: places.description,
      checkinCount: sql<number>`COUNT(${checkins.id})`.as("checkinCount"),
      avgRating: sql<number>`COALESCE(AVG(${checkins.rating}), 0)`.as("avgRating"),
    })
    .from(places)
    .leftJoin(checkins, eq(places.id, checkins.placeId))
    .groupBy(places.id)
    .orderBy(sql`checkinCount DESC`)
    .limit(limit);
  return result;
}

// ─── Checkin helpers ────────────────────────────────────────────

export async function createCheckin(checkin: InsertCheckin) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(checkins).values(checkin);
  return { id: result[0].insertId };
}

export async function getCheckinsByPlace(placeId: number, limit = 50) {
  const db = await getDb();
  if (!db) return [];
  const result = await db
    .select({
      id: checkins.id,
      userId: checkins.userId,
      placeId: checkins.placeId,
      rating: checkins.rating,
      comment: checkins.comment,
      occupancy: checkins.occupancy,
      createdAt: checkins.createdAt,
      userName: users.name,
    })
    .from(checkins)
    .leftJoin(users, eq(checkins.userId, users.id))
    .where(eq(checkins.placeId, placeId))
    .orderBy(desc(checkins.createdAt))
    .limit(limit);
  return result;
}

export async function getCheckinsByUser(userId: number, limit = 50) {
  const db = await getDb();
  if (!db) return [];
  const result = await db
    .select({
      id: checkins.id,
      userId: checkins.userId,
      placeId: checkins.placeId,
      rating: checkins.rating,
      comment: checkins.comment,
      occupancy: checkins.occupancy,
      createdAt: checkins.createdAt,
      placeName: places.name,
      placeAddress: places.address,
    })
    .from(checkins)
    .leftJoin(places, eq(checkins.placeId, places.id))
    .where(eq(checkins.userId, userId))
    .orderBy(desc(checkins.createdAt))
    .limit(limit);
  return result;
}

export async function getUserStats(userId: number) {
  const db = await getDb();
  if (!db) return { totalCheckins: 0, uniquePlaces: 0, avgRating: 0, totalReviews: 0 };
  const result = await db
    .select({
      totalCheckins: sql<number>`COUNT(*)`.as("totalCheckins"),
      uniquePlaces: sql<number>`COUNT(DISTINCT ${checkins.placeId})`.as("uniquePlaces"),
      avgRating: sql<number>`COALESCE(AVG(${checkins.rating}), 0)`.as("avgRating"),
      totalReviews: sql<number>`SUM(CASE WHEN ${checkins.comment} IS NOT NULL AND ${checkins.comment} != '' THEN 1 ELSE 0 END)`.as("totalReviews"),
    })
    .from(checkins)
    .where(eq(checkins.userId, userId));
  return result[0] ?? { totalCheckins: 0, uniquePlaces: 0, avgRating: 0, totalReviews: 0 };
}

export async function getPlaceStats(placeId: number) {
  const db = await getDb();
  if (!db) return { totalCheckins: 0, avgRating: 0 };
  const result = await db
    .select({
      totalCheckins: sql<number>`COUNT(*)`.as("totalCheckins"),
      avgRating: sql<number>`COALESCE(AVG(${checkins.rating}), 0)`.as("avgRating"),
    })
    .from(checkins)
    .where(eq(checkins.placeId, placeId));
  return result[0] ?? { totalCheckins: 0, avgRating: 0 };
}

// ─── Ranking helpers ────────────────────────────────────────────

export async function getTopUsers(limit = 20) {
  const db = await getDb();
  if (!db) return [];
  const result = await db
    .select({
      id: users.id,
      name: users.name,
      avatarUrl: users.avatarUrl,
      checkinCount: sql<number>`COUNT(${checkins.id})`.as("checkinCount"),
      avgRating: sql<number>`COALESCE(AVG(${checkins.rating}), 0)`.as("avgRating"),
    })
    .from(users)
    .leftJoin(checkins, eq(users.id, checkins.userId))
    .groupBy(users.id)
    .having(sql`COUNT(${checkins.id}) > 0`)
    .orderBy(sql`checkinCount DESC`)
    .limit(limit);
  return result;
}

// ─── Auth helpers ───────────────────────────────────────────────

export async function registerUser(data: {
  name: string;
  username: string;
  email: string;
  password: string;
  birthDate: string;
}) {
  const db = await getDb();

  if (!db) {
    throw new Error("Database not available");
  }

  const exists = await db
    .select()
    .from(users)
    .where(eq(users.email, data.email))
    .limit(1);

  if (exists.length > 0) {
    throw new Error("Email já cadastrado");
  }

  const passwordHash = await bcrypt.hash(data.password, 10);

  const result = await db.insert(users).values({
    name: data.name,
    email: data.email,
    passwordHash,
    loginMethod: "local",
    role: "user",
    lastSignedIn: new Date(),
  });

  return {
    id: result[0].insertId,
  };
}

export async function loginUser(data: {
  email: string;
  password: string;
}) {
  const db = await getDb();

  if (!db) {
    throw new Error("Database not available");
  }

  const result = await db
    .select()
    .from(users)
    .where(eq(users.email, data.email))
    .limit(1);

  const user = result[0];

  if (!user || !user.passwordHash) {
    throw new Error("Usuário inválido");
  }

  const validPassword = await bcrypt.compare(
    data.password,
    user.passwordHash
  );

  if (!validPassword) {
    throw new Error("Senha incorreta");
  }

  await db
    .update(users)
    .set({
      lastSignedIn: new Date(),
    })
    .where(eq(users.id, user.id));

  return user;
}