import "dotenv/config";
import { db } from "./index";
import { games } from "./schema";
import { eq } from "drizzle-orm";

async function main() {
  console.log("Début du seeding");

  const gameName = "Riftbound";

  const existingGame = await db
    .select()
    .from(games)
    .where(eq(games.name, gameName));

  if (existingGame.length === 0) {
    await db.insert(games).values({
      name: gameName,
      description:
        "Le jeu de cartes à collectionner officiel de League of Legends",
    });
    console.log(`Jeu "${gameName}" créé avec succès !`);
  } else {
    console.log(`Le jeu "${gameName}" est déjà prêt dans la base.`);
  }

  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
