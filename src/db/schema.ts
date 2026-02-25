import {
  pgTable,
  serial,
  text,
  integer,
  timestamp,
  boolean,
  uuid,
  pgEnum,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const userRoleEnum = pgEnum("user_role", ["user", "admin"]);

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email").unique(),
  rfidUuid: text("rfid_uuid").unique(),
  role: userRoleEnum("role").notNull().default("user"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const scans = pgTable("scans", {
  id: serial("id").primaryKey(),
  rfidUuid: text("rfid_uuid").notNull(),
  machineId: text("machine_id"),
  scannedAt: timestamp("scanned_at").defaultNow(),
  consumed: boolean("consumed").default(false).notNull(),
  revoked: boolean("revoked").default(false).notNull(),
});

export const registrationRequestStatusEnum = pgEnum(
  "registration_request_status",
  ["pending", "approved", "rejected"],
);

export const registrationRequests = pgTable("registration_requests", {
  id: serial("id").primaryKey(),
  rfidUuid: text("rfid_uuid").notNull(),
  scanId: integer("scan_id"),
  machineId: text("machine_id"),
  status: registrationRequestStatusEnum("status").notNull().default("pending"),
  createdUserId: uuid("created_user_id").references(() => users.id, {
    onDelete: "set null",
  }),
  createdAt: timestamp("created_at").defaultNow(),
  resolvedAt: timestamp("resolved_at"),
});

export const gameSessions = pgTable("game_sessions", {
  id: serial("id").primaryKey(),
  player1Id: uuid("player1_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  player2Id: uuid("player2_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  player1Score: integer("player1_score").notNull().default(0),
  player2Score: integer("player2_score").notNull().default(0),
  winnerId: uuid("winner_id").references(() => users.id),
  durationSeconds: integer("duration_seconds").notNull().default(0),
  startedAt: timestamp("started_at").defaultNow(),
  endedAt: timestamp("ended_at"),
});

export const usersRelations = relations(users, ({ many }) => ({
  sessionsAsPlayer1: many(gameSessions, { relationName: "player1" }),
  sessionsAsPlayer2: many(gameSessions, { relationName: "player2" }),
}));

export const gameSessionsRelations = relations(gameSessions, ({ one }) => ({
  player1: one(users, {
    fields: [gameSessions.player1Id],
    references: [users.id],
    relationName: "player1",
  }),
  player2: one(users, {
    fields: [gameSessions.player2Id],
    references: [users.id],
    relationName: "player2",
  }),
  winner: one(users, {
    fields: [gameSessions.winnerId],
    references: [users.id],
  }),
}));
