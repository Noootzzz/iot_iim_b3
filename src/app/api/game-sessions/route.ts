import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { gameSessions, users } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

// POST /api/game-sessions — Enregistrer une session de jeu terminée
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      player1Id,
      player2Id,
      player1Score,
      player2Score,
      winnerId,
      durationSeconds,
    } = body;

    if (!player1Id || !player2Id || player1Score === undefined || player2Score === undefined) {
      return NextResponse.json(
        { error: "player1Id, player2Id, player1Score et player2Score sont requis" },
        { status: 400 }
      );
    }

    const newSession = await db
      .insert(gameSessions)
      .values({
        player1Id,
        player2Id,
        player1Score: parseInt(player1Score),
        player2Score: parseInt(player2Score),
        winnerId: winnerId || null,
        durationSeconds: parseInt(durationSeconds) || 0,
        endedAt: new Date(),
      })
      .returning();

    return NextResponse.json(
      { success: true, session: newSession[0] },
      { status: 201 }
    );
  } catch (error) {
    console.error("Erreur POST game-sessions:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// GET /api/game-sessions — Récupérer les sessions récentes
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "10");

    const sessions = await db
      .select({
        id: gameSessions.id,
        player1Score: gameSessions.player1Score,
        player2Score: gameSessions.player2Score,
        durationSeconds: gameSessions.durationSeconds,
        startedAt: gameSessions.startedAt,
        endedAt: gameSessions.endedAt,
        player1: {
          id: users.id,
          username: users.username,
        },
      })
      .from(gameSessions)
      .leftJoin(users, eq(gameSessions.player1Id, users.id))
      .orderBy(desc(gameSessions.endedAt))
      .limit(limit);

    return NextResponse.json({ sessions });
  } catch (error) {
    console.error("Erreur GET game-sessions:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
