import "dotenv/config";
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);

async function resetDb() {
  console.log("Dropping all tables...");
  await sql`DROP SCHEMA public CASCADE`;
  await sql`CREATE SCHEMA public`;
  console.log("✅ Database cleared. Schema public recreated.");
}

resetDb().catch((e) => {
  console.error("Error:", e.message);
  process.exit(1);
});
