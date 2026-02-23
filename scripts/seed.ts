import "dotenv/config";
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);

async function seed() {
  console.log("Seeding users...");

  // Demo Bob (role: user)
  await sql`INSERT INTO users (id, username, role) VALUES (
    'c752edcc-b731-458d-8c22-db44d7111e9f', 'Noot', 'user'
  ) ON CONFLICT (id) DO UPDATE SET role = 'user'`;

  // Demo Alice (role: user)
  await sql`INSERT INTO users (id, username, role) VALUES (
    'e2a0407d-6b7e-4adc-9a28-f7ccbebaa009', 'SxLaDrill', 'user'
  ) ON CONFLICT (id) DO UPDATE SET role = 'user'`;

  // Admin (role: admin)
  await sql`INSERT INTO users (id, username, role) VALUES (
    'a1b2c3d4-0000-4000-8000-aabbccddeeff', 'Admin', 'admin'
  ) ON CONFLICT (id) DO UPDATE SET role = 'admin'`;

  console.log("✅ Seed complete: Noot, SxLaDrill, Admin");
}

seed().catch((e) => {
  console.error("Error:", e.message);
  process.exit(1);
});
