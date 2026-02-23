import "dotenv/config";
import { neon } from "@neondatabase/serverless";
import { createHash } from "crypto";
import { readFileSync } from "fs";
import { join } from "path";

const sql = neon(process.env.DATABASE_URL!);

async function markMigration() {
  // Create the drizzle migrations tracking table if it doesn't exist
  await sql`
    CREATE TABLE IF NOT EXISTS "__drizzle_migrations" (
      id SERIAL PRIMARY KEY,
      hash text NOT NULL,
      created_at bigint
    )
  `;

  // Hash of 0000_init.sql (same algo drizzle uses: sha256 of file content)
  const content = readFileSync(
    join(process.cwd(), "drizzle", "0000_init.sql"),
    "utf-8",
  );
  const hash = createHash("sha256").update(content).digest("hex");

  // Check if already recorded
  const existing =
    await sql`SELECT id FROM "__drizzle_migrations" WHERE hash = ${hash}`;
  if (existing.length > 0) {
    console.log("✅ Migration 0000 already marked as applied.");
    return;
  }

  await sql`
    INSERT INTO "__drizzle_migrations" (hash, created_at)
    VALUES (${hash}, ${Date.now()})
  `;
  console.log(
    "✅ Migration 0000_init marked as applied in __drizzle_migrations.",
  );
}

markMigration().catch((e) => {
  console.error("Error:", e.message);
  process.exit(1);
});
