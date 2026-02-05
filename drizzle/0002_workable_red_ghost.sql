CREATE TABLE "scans" (
	"id" serial PRIMARY KEY NOT NULL,
	"rfid_uuid" text NOT NULL,
	"scanned_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "email" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_username_unique" UNIQUE("username");