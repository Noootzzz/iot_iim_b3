ALTER TABLE "users" ADD COLUMN "rfid_uuid" text;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_rfid_uuid_unique" UNIQUE("rfid_uuid");