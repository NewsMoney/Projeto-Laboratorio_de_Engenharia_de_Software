import { eq, desc, sql, like, and } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";

import {
  users,
  places,
  checkins,
  InsertUser,
  InsertPlace,
  InsertCheckin,
} from "../drizzle/schema";

import bcrypt from "bcryptjs";

/* ------------------------------------------------ */
/* DB Connection */
/* ------------------------------------------------ */

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

/* ------------------------------------------------ */
/* Users */
/* ------------------------------------------------ */

export async function getUserById(id: number) {
  const db = await getDb();

  if (!db) return undefined;

  const result = await db
    .select()
    .from(users)
    .where(eq(users.id, id))
    .limit(1);

  return result[0];
}

export async function getUserByEmail(email: string) {
  const db = await getDb();

  if (!db) return undefined;

  const result = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  return result[0];
}

export async function upsertUser(user: InsertUser) {
  const db = await getDb();

  if (!db) {
    throw new Error("Database not available");
  }

  await db
    .insert(users)
    .values(user)
    .onDuplicateKeyUpdate({
      set: {
        updatedAt: new Date(),
      },
    });
}

export async function updateUserProfile(
  userId: number,
  data: {
    bio: string;
    avatarUrl: string | null;
  }
) {
  const db = await getDb();

  if (!db) {
    throw new Error("Database not available");
  }

  await db
    .update(users)
    .set({
      bio: data.bio,
      avatarUrl: data.avatarUrl,
      updatedAt: new Date(),
    })
    .where(
      eq(users.id, userId)
    );

  return {
    success: true,
  };
}

/* ------------------------------------------------ */
/* Auth */
/* ------------------------------------------------ */

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

  const emailExists = await db
    .select()
    .from(users)
    .where(eq(users.email, data.email))
    .limit(1);

  if (emailExists.length > 0) {
    throw new Error("Email já cadastrado");
  }

  const usernameExists = await db
    .select()
    .from(users)
    .where(eq(users.username, data.username))
    .limit(1);

  if (usernameExists.length > 0) {
    throw new Error("Nickname já está em uso");
  }

  const passwordHash = await bcrypt.hash(
    data.password,
    10
  );

  const result = await db
    .insert(users)
    .values({
      username: data.username,
      name: data.name,
      birthDate: new Date(data.birthDate),
      email: data.email,
      passwordHash,
      loginMethod: "local",
      role: "user",
      bio: "",
      avatarUrl: null,
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

/* ------------------------------------------------ */
/* Places */
/* ------------------------------------------------ */

export async function createPlace(
  place: InsertPlace
) {
  const db = await getDb();

  if (!db) {
    throw new Error("Database not available");
  }

  const result = await db
    .insert(places)
    .values(place);

  return {
    id: result[0].insertId,
  };
}

export async function getPlaceById(id: number) {
  const db = await getDb();

  if (!db) return undefined;

  const result = await db
    .select()
    .from(places)
    .where(eq(places.id, id))
    .limit(1);

  return result[0];
}

export async function listPlaces(
  limit = 50,
  offset = 0
) {
  const db = await getDb();

  if (!db) return [];

  return db
    .select()
    .from(places)
    .orderBy(desc(places.createdAt))
    .limit(limit)
    .offset(offset);
}

export async function searchPlaces(
  query: string
) {
  const db = await getDb();

  if (!db) return [];

  return db
    .select()
    .from(places)
    .where(
      like(
        places.name,
        `%${query}%`
      )
    )
    .limit(50);
}

export async function nearbyPlaces(
  lat: number,
  lng: number,
  radiusKm = 5,
  limit = 50
) {
  const db = await getDb();

  if (!db) return [];

  const latDelta =
    radiusKm / 111;

  const lngDelta =
    radiusKm /
    (111 *
      Math.cos(
        (lat * Math.PI) /
          180
      ));

  return db
    .select({
      id: places.id,
      name: places.name,
      address: places.address,
      lat: places.lat,
      lng: places.lng,
      category: places.category,

      distance: sql<number>`
        (
          6371 * ACOS(
            COS(RADIANS(${lat}))
            * COS(RADIANS(${places.lat}))
            * COS(RADIANS(${places.lng}) - RADIANS(${lng}))
            + SIN(RADIANS(${lat}))
            * SIN(RADIANS(${places.lat}))
          )
        )
      `.as("distance"),
    })
    .from(places)
    .where(
      and(
        sql`${places.lat}
          BETWEEN ${lat - latDelta}
          AND ${lat + latDelta}`,

        sql`${places.lng}
          BETWEEN ${lng - lngDelta}
          AND ${lng + lngDelta}`
      )
    )
    .orderBy(sql`distance ASC`)
    .limit(limit);
}

export async function getTopPlaces(
  limit = 10
) {
  const db = await getDb();

  if (!db) return [];

  return db
    .select({
      id: places.id,
      name: places.name,
      address: places.address,
      lat: places.lat,
      lng: places.lng,
      category: places.category,

      checkinCount: sql<number>`
        COUNT(${checkins.id})
      `.as("checkinCount"),

      avgRating: sql<number>`
        COALESCE(
          AVG(${checkins.rating}),
          0
        )
      `.as("avgRating"),
    })
    .from(places)
    .leftJoin(
      checkins,
      eq(
        places.id,
        checkins.placeId
      )
    )
    .groupBy(places.id)
    .orderBy(
      sql`checkinCount DESC`
    )
    .limit(limit);
}

/* ------------------------------------------------ */
/* Checkins */
/* ------------------------------------------------ */

export async function createCheckin(
  checkin: InsertCheckin
) {
  const db = await getDb();

  if (!db) {
    throw new Error("Database not available");
  }

  const result = await db
    .insert(checkins)
    .values(checkin);

  return {
    id: result[0].insertId,
  };
}

export async function getCheckinsByUser(
  userId: number,
  limit = 50
) {
  const db = await getDb();

  if (!db) return [];

  return db
    .select({
      id: checkins.id,
      rating: checkins.rating,
      comment: checkins.comment,
      createdAt: checkins.createdAt,

      placeId: places.id,
      placeName: places.name,
    })
    .from(checkins)
    .leftJoin(
      places,
      eq(
        checkins.placeId,
        places.id
      )
    )
    .where(
      eq(
        checkins.userId,
        userId
      )
    )
    .orderBy(
      desc(
        checkins.createdAt
      )
    )
    .limit(limit);
}

export async function getCheckinsByPlace(
  placeId: number,
  limit = 50
) {
  const db = await getDb();

  if (!db) return [];

  return db
    .select({
      id: checkins.id,
      rating: checkins.rating,
      comment: checkins.comment,
      createdAt: checkins.createdAt,

      userId: users.id,
      userName: users.name,
    })
    .from(checkins)
    .leftJoin(
      users,
      eq(
        checkins.userId,
        users.id
      )
    )
    .where(
      eq(
        checkins.placeId,
        placeId
      )
    )
    .orderBy(
      desc(
        checkins.createdAt
      )
    )
    .limit(limit);
}

/* ------------------------------------------------ */
/* Stats */
/* ------------------------------------------------ */

export async function getUserStats(
  userId: number
) {
  const db = await getDb();

  if (!db) {
    return {
      totalCheckins: 0,
      uniquePlaces: 0,
      avgRating: 0,
    };
  }

  const result = await db
    .select({
      totalCheckins: sql<number>`
        COUNT(*)
      `.as("totalCheckins"),

      uniquePlaces: sql<number>`
        COUNT(DISTINCT ${checkins.placeId})
      `.as("uniquePlaces"),

      avgRating: sql<number>`
        COALESCE(
          AVG(${checkins.rating}),
          0
        )
      `.as("avgRating"),
    })
    .from(checkins)
    .where(
      eq(
        checkins.userId,
        userId
      )
    );

  return result[0];
}

export async function getTopUsers(
  limit = 20
) {
  const db = await getDb();

  if (!db) return [];

  return db
    .select({
      id: users.id,
      name: users.name,
      username: users.username,
      avatarUrl: users.avatarUrl,

      checkinCount: sql<number>`
        COUNT(${checkins.id})
      `.as("checkinCount"),
    })
    .from(users)
    .leftJoin(
      checkins,
      eq(
        users.id,
        checkins.userId
      )
    )
    .groupBy(users.id)
    .orderBy(
      sql`checkinCount DESC`
    )
    .limit(limit);
}

export async function getPlaceStats(
  placeId: number
) {
  const db = await getDb();

  if (!db) {
    return {
      totalCheckins: 0,
      avgRating: 0,
    };
  }

  const result = await db
    .select({
      totalCheckins: sql<number>`
        COUNT(*)
      `.as("totalCheckins"),

      avgRating: sql<number>`
        COALESCE(
          AVG(${checkins.rating}),
          0
        )
      `.as("avgRating"),
    })
    .from(checkins)
    .where(
      eq(
        checkins.placeId,
        placeId
      )
    );

  return result[0];
}