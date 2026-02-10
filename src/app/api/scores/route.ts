import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { scores, users, games } from "@/db/schema";
import { eq, desc, and } from "drizzle-orm";

// GET /api/scores - Récupérer les scores (avec filtres optionnels)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const gameId = searchParams.get("gameId");
    const limit = parseInt(searchParams.get("limit") || "10");

    // Construire les conditions de filtrage
    const conditions = [];
    if (userId) {
      conditions.push(eq(scores.userId, userId));
    }
    if (gameId) {
      conditions.push(eq(scores.gameId, parseInt(gameId)));
    }

    const allScores = await db
      .select({
        id: scores.id,
        scoreValue: scores.scoreValue,
        playedAt: scores.playedAt,
        user: {
          id: users.id,
          username: users.username,
        },
        game: {
          id: games.id,
          name: games.name,
        },
      })
      .from(scores)
      .leftJoin(users, eq(scores.userId, users.id))
      .leftJoin(games, eq(scores.gameId, games.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(scores.scoreValue))
      .limit(limit);

    return NextResponse.json({ scores: allScores });
  } catch (error) {
    console.error("Erreur GET scores:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// POST /api/scores - Enregistrer un nouveau score
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, gameId, scoreValue } = body;

    if (!userId || !gameId || scoreValue === undefined) {
      return NextResponse.json(
        { error: "userId, gameId et scoreValue sont requis" },
        { status: 400 }
      );
    }

    const newScore = await db
      .insert(scores)
      .values({
        userId: userId,
        gameId: parseInt(gameId),
        scoreValue: parseInt(scoreValue),
      })
      .returning();

    return NextResponse.json(
      {
        success: true,
        score: newScore[0],
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Erreur POST scores:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
