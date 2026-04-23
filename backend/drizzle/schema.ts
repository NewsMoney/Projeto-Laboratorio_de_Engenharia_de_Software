import {
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
  decimal,
  date,
  uniqueIndex,
  index,
} from "drizzle-orm/mysql-core";

/* ------------------------------------------------ */
/* USERS */
/* ------------------------------------------------ */

export const users = mysqlTable(
  "users",
  {
    id: int("id")
      .autoincrement()
      .primaryKey(),

    username: varchar("username", {
      length: 30,
    })
      .notNull(),

    name: varchar("name", {
      length: 120,
    })
      .notNull(),

    birthDate: date("birthDate")
      .notNull(),

    email: varchar("email", {
      length: 320,
    })
      .notNull(),

    passwordHash: varchar(
      "passwordHash",
      { length: 255 }
    ).notNull(),

    loginMethod: varchar(
      "loginMethod",
      { length: 64 }
    ).default("local"),

    bio: text("bio"),

    avatarUrl: text("avatarUrl"),

    role: mysqlEnum("role", [
      "user",
      "admin",
    ])
      .default("user")
      .notNull(),

    createdAt: timestamp(
      "createdAt"
    )
      .defaultNow()
      .notNull(),

    updatedAt: timestamp(
      "updatedAt"
    )
      .defaultNow()
      .onUpdateNow()
      .notNull(),

    lastSignedIn: timestamp(
      "lastSignedIn"
    )
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    usernameIdx:
      uniqueIndex(
        "users_username_unique"
      ).on(table.username),

    emailIdx:
      uniqueIndex(
        "users_email_unique"
      ).on(table.email),
  })
);

export type User =
  typeof users.$inferSelect;

export type InsertUser =
  typeof users.$inferInsert;

/* ------------------------------------------------ */
/* PLACES */
/* ------------------------------------------------ */

export const places = mysqlTable(
  "places",
  {
    id: int("id")
      .autoincrement()
      .primaryKey(),

    name: varchar("name", {
      length: 255,
    }).notNull(),

    address: varchar(
      "address",
      { length: 500 }
    ).notNull(),

    lat: decimal("lat", {
      precision: 10,
      scale: 7,
    }).notNull(),

    lng: decimal("lng", {
      precision: 10,
      scale: 7,
    }).notNull(),

    category: varchar(
      "category",
      { length: 100 }
    ).default("general"),

    description:
      text("description"),

    imageUrl:
      text("imageUrl"),

    createdById:
      int("createdById"),

    createdAt: timestamp(
      "createdAt"
    )
      .defaultNow()
      .notNull(),

    updatedAt: timestamp(
      "updatedAt"
    )
      .defaultNow()
      .onUpdateNow()
      .notNull(),
  },
  (table) => ({
    coordsIdx: index(
      "places_coords_idx"
    ).on(
      table.lat,
      table.lng
    ),
  })
);

export type Place =
  typeof places.$inferSelect;

export type InsertPlace =
  typeof places.$inferInsert;

/* ------------------------------------------------ */
/* CHECKINS */
/* ------------------------------------------------ */

export const checkins =
  mysqlTable(
    "checkins",
    {
      id: int("id")
        .autoincrement()
        .primaryKey(),

      userId: int("userId")
        .notNull(),

      placeId: int("placeId")
        .notNull(),

      rating: int("rating")
        .notNull(),

      comment:
        text("comment"),

      occupancy:
        mysqlEnum(
          "occupancy",
          [
            "empty",
            "moderate",
            "full",
          ]
        ),

      createdAt:
        timestamp(
          "createdAt"
        )
          .defaultNow()
          .notNull(),
    },
    (table) => ({
      userPlaceIdx:
        index(
          "checkins_user_place_idx"
        ).on(
          table.userId,
          table.placeId
        ),
    })
  );

export type Checkin =
  typeof checkins.$inferSelect;

export type InsertCheckin =
  typeof checkins.$inferInsert;