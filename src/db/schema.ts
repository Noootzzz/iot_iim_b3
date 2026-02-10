import {
  pgTable,
  serial,
  text,
  integer,
  timestamp,
  primaryKey,
  boolean,
  uuid,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// --- TABLE UTILISATEURS ---
export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  username: text("username").notNull().unique(), // Pseudo unique requis
  email: text("email").unique(), // Email optionnel
  rfidUuid: text("rfid_uuid").unique(),
  createdAt: timestamp("created_at").defaultNow(),
});

// --- TABLE SCANS (Historique des scans RFID) ---
export const scans = pgTable("scans", {
  id: serial("id").primaryKey(),
  rfidUuid: text("rfid_uuid").notNull(),
  scannedAt: timestamp("scanned_at").defaultNow(),
  consumed: boolean("consumed").default(false).notNull(),
  revoked: boolean("revoked").default(false).notNull(),
});

// --- TABLE JEUX (ex: Riotgames Reborn) ---
export const games = pgTable("games", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
});

// --- TABLE SCORES (Lien User <-> Jeu) ---
export const scores = pgTable("scores", {
  id: serial("id").primaryKey(),
  userId: uuid("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  gameId: integer("game_id")
    .references(() => games.id, { onDelete: "cascade" })
    .notNull(),
  scoreValue: integer("score_value").notNull(), // Le score numérique
  playedAt: timestamp("played_at").defaultNow(),
});

// --- TABLE BADGES ---
export const badges = pgTable("badges", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  imageUrl: text("image_url"),
  createdAt: timestamp("created_at").defaultNow(),
});

// --- TABLE DE LIAISON (User <-> Badges) ---
// Un user peut avoir plusieurs badges, un badge peut être possédé par plusieurs users
export const userBadges = pgTable(
  "user_badges",
  {
    userId: integer("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    badgeId: integer("badge_id")
      .references(() => badges.id, { onDelete: "cascade" })
      .notNull(),
    earnedAt: timestamp("earned_at").defaultNow(),
  },
  (t) => ({
    // Clé primaire composite : on ne peut pas donner le même badge 2x au même user
    pk: primaryKey({ columns: [t.userId, t.badgeId] }),
  })
);

// --- RELATIONS (Pour les requêtes intelligentes "query") ---
// Relations pour Users : un user a plusieurs scores et plusieurs badges
export const usersRelations = relations(users, ({ many }) => ({
  scores: many(scores),
  userBadges: many(userBadges),
}));

// Relations pour Scores : un score appartient à 1 user et 1 jeu
export const scoresRelations = relations(scores, ({ one }) => ({
  user: one(users, {
    fields: [scores.userId],
    references: [users.id],
  }),
  game: one(games, {
    fields: [scores.gameId],
    references: [games.id],
  }),
}));

// Relations pour UserBadges : lien vers User et vers Badge
export const userBadgesRelations = relations(userBadges, ({ one }) => ({
  user: one(users, {
    fields: [userBadges.userId],
    references: [users.id],
  }),
  badge: one(badges, {
    fields: [userBadges.badgeId],
    references: [badges.id],
  }),
}));

// Relations pour Badges : un badge est possédé par plusieurs users (via userBadges)
export const badgesRelations = relations(badges, ({ many }) => ({
  userBadges: many(userBadges),
}));

// Relations pour Games : un jeu a plusieurs scores
export const gamesRelations = relations(games, ({ many }) => ({
  scores: many(scores),
}));
