CREATE TYPE "public"."registration_request_status" AS ENUM('pending', 'approved', 'rejected');--> statement-breakpoint
CREATE TABLE "registration_requests" (
	"id" serial PRIMARY KEY NOT NULL,
	"rfid_uuid" text NOT NULL,
	"scan_id" integer,
	"machine_id" text,
	"status" "registration_request_status" DEFAULT 'pending' NOT NULL,
	"created_user_id" uuid,
	"created_at" timestamp DEFAULT now(),
	"resolved_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "registration_requests" ADD CONSTRAINT "registration_requests_created_user_id_users_id_fk" FOREIGN KEY ("created_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
