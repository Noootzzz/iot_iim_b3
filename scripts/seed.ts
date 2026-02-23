import "dotenv/config";
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);

async function seed() {
  console.log("Seeding Demo users...");

  // Demo Bob
  await sql`INSERT INTO users (id, username) VALUES (
    'c752edcc-b731-458d-8c22-db44d7111e9f', 'Demo Bob'
  ) ON CONFLICT (id) DO NOTHING`;

  // Demo Alice
  await sql`INSERT INTO users (id, username) VALUES (
    'e2a0407d-6b7e-4adc-9a28-f7ccbebaa009', 'Demo Alice'
  ) ON CONFLICT (id) DO NOTHING`;

  console.log("✅ Seed complete: Demo Bob, Demo Alice");
}

seed().catch((e) => {
  console.error("Error:", e.message);
  process.exit(1);
});
