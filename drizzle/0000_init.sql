CREATE TABLE "badges" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"image_url" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "game_sessions" (
	"id" serial PRIMARY KEY NOT NULL,
	"player1_id" uuid NOT NULL,
	"player2_id" uuid NOT NULL,
	"player1_score" integer DEFAULT 0 NOT NULL,
	"player2_score" integer DEFAULT 0 NOT NULL,
	"winner_id" uuid,
	"duration_seconds" integer DEFAULT 0 NOT NULL,
	"started_at" timestamp DEFAULT now(),
	"ended_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "games" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "games_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "scans" (
	"id" serial PRIMARY KEY NOT NULL,
	"rfid_uuid" text NOT NULL,
	"scanned_at" timestamp DEFAULT now(),
	"consumed" boolean DEFAULT false NOT NULL,
	"revoked" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "scores" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"game_id" integer NOT NULL,
	"score_value" integer NOT NULL,
	"played_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "user_badges" (
	"user_id" uuid NOT NULL,
	"badge_id" integer NOT NULL,
	"earned_at" timestamp DEFAULT now(),
	CONSTRAINT "user_badges_user_id_badge_id_pk" PRIMARY KEY("user_id","badge_id")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"username" text NOT NULL,
	"email" text,
	"rfid_uuid" text,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "users_username_unique" UNIQUE("username"),
	CONSTRAINT "users_email_unique" UNIQUE("email"),
	CONSTRAINT "users_rfid_uuid_unique" UNIQUE("rfid_uuid")
);
--> statement-breakpoint
ALTER TABLE "game_sessions" ADD CONSTRAINT "game_sessions_player1_id_users_id_fk" FOREIGN KEY ("player1_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "game_sessions" ADD CONSTRAINT "game_sessions_player2_id_users_id_fk" FOREIGN KEY ("player2_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "game_sessions" ADD CONSTRAINT "game_sessions_winner_id_users_id_fk" FOREIGN KEY ("winner_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scores" ADD CONSTRAINT "scores_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scores" ADD CONSTRAINT "scores_game_id_games_id_fk" FOREIGN KEY ("game_id") REFERENCES "public"."games"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_badges" ADD CONSTRAINT "user_badges_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_badges" ADD CONSTRAINT "user_badges_badge_id_badges_id_fk" FOREIGN KEY ("badge_id") REFERENCES "public"."badges"("id") ON DELETE cascade ON UPDATE no action;