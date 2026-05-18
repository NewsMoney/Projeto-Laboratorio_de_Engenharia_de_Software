import { 
	mysqlTable, 
	index, 
	primaryKey, 
	int, 
	text, 
	mysqlEnum, 
	timestamp, 
	varchar, 
	decimal, 
	unique, 
	date,
	foreignKey,
} from "drizzle-orm/mysql-core"
import { sql } from "drizzle-orm"

export const checkins = mysqlTable("checkins", {
	id: int().autoincrement().notNull(),
	userId: int().notNull(),
	placeId: int().notNull(),
	rating: int().notNull(),
	comment: text(),
	occupancy: mysqlEnum(['empty','moderate','full']),
	createdAt: timestamp({ mode: 'date' }).default(sql`(now())`).notNull(),
},
(table) => [
	index("checkins_user_place_idx").on(table.userId, table.placeId),
	primaryKey({ columns: [table.id], name: "checkins_id"}),
]);

export const places = mysqlTable("places", {
	id: int().autoincrement().notNull(),
	type: mysqlEnum("type", ["place", "party"])
		.default("place")
		.notNull(),
	name: varchar({ length: 255 }).notNull(),
	address: varchar({ length: 500 }).notNull(),
	lat: decimal({ precision: 10, scale: 7 }).notNull(),
	lng: decimal({ precision: 10, scale: 7 }).notNull(),
	category: varchar({ length: 100 }).default('general'),
	description: text(),
	imageUrl: text(),
	createdById: int(),
	createdAt: timestamp({ mode: 'date' }).default(sql`(now())`).notNull(),
	updatedAt: timestamp({ mode: 'date' }).default(sql`(now())`).onUpdateNow().notNull(),
},
(table) => [
	index("places_coords_idx").on(table.lat, table.lng),
	primaryKey({ columns: [table.id], name: "places_id"}),
	foreignKey({
		columns: [table.createdById],
		foreignColumns: [users.id],
		name: "fk_places_user",
	})
		.onDelete("set null"),
]);
export const users = mysqlTable("users", {
	id: int().autoincrement().notNull(),
	name: varchar({ length: 120 }).notNull(),
	email: varchar({ length: 320 }).notNull(),
	passwordHash: varchar({ length: 255 }).notNull(),
	loginMethod: varchar({ length: 64 }).default('local'),
	role: mysqlEnum(['user','moderator','admin']).default('user').notNull(),
	avatarUrl: text(),
	createdAt: timestamp({ mode: 'date' }).default(sql`(now())`).notNull(),
	updatedAt: timestamp({ mode: 'date' }).default(sql`(now())`).onUpdateNow().notNull(),
	lastSignedIn: timestamp({ mode: 'date' }).default(sql`(now())`).notNull(),
	username: varchar({ length: 30 }).notNull(),
	birthDate: date({ mode: 'date' }).notNull(),
	bio: text(),
},
(table) => [
	primaryKey({ columns: [table.id], name: "users_id"}),
	unique("users_email_unique").on(table.email),
	unique("users_username_unique").on(table.username),
]);
import type {
  InferInsertModel,
  InferSelectModel,
} from "drizzle-orm";

export type User =
  InferSelectModel<
    typeof users
  >;

export type InsertUser =
  InferInsertModel<
    typeof users
  >;

export type Place =
  InferSelectModel<
    typeof places
  >;

export type InsertPlace =
  InferInsertModel<
    typeof places
  >;

export type Checkin =
  InferSelectModel<
    typeof checkins
  >;

export type InsertCheckin =
  InferInsertModel<
    typeof checkins
  >;
