import {
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
  decimal,
} from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),

  name: text("name"),

  email: varchar("email", { length: 320 }),

  passwordHash: varchar("passwordHash", { length: 255 }),

  loginMethod: varchar("loginMethod", { length: 64 }),

  role: mysqlEnum("role", ["user", "admin"])
    .default("user")
    .notNull(),

  avatarUrl: text("avatarUrl"),

  createdAt: timestamp("createdAt")
    .defaultNow()
    .notNull(),

  updatedAt: timestamp("updatedAt")
    .defaultNow()
    .onUpdateNow()
    .notNull(),

  lastSignedIn: timestamp("lastSignedIn")
    .defaultNow()
    .notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Places table — stores locations where users can check in.
 */
export const places = mysqlTable("places", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  address: varchar("address", { length: 500 }).notNull(),
  lat: decimal("lat", { precision: 10, scale: 7 }).notNull(),
  lng: decimal("lng", { precision: 10, scale: 7 }).notNull(),
  category: varchar("category", { length: 100 }).default("general"),
  description: text("description"),
  imageUrl: text("imageUrl"),
  createdById: int("createdById"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Place = typeof places.$inferSelect;
export type InsertPlace = typeof places.$inferInsert;

/**
 * Check-ins table — records user visits to places.
 */
export const checkins = mysqlTable("checkins", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  placeId: int("placeId").notNull(),
  rating: int("rating").notNull(),
  comment: text("comment"),
  occupancy: mysqlEnum("occupancy", ["empty", "moderate", "full"]),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Checkin = typeof checkins.$inferSelect;
export type InsertCheckin = typeof checkins.$inferInsert;