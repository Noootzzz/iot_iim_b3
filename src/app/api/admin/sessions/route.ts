import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { gameSessions, users } from "@/db/schema";
import { eq, desc, inArray } from "drizzle-orm";
import { verifyToken, COOKIE_NAME } from "@/lib/admin-auth";

async function requireAdmin(request: NextRequest) {
  const token = request.cookies.get(COOKIE_NAME)?.value;
  if (!token) return false;
  const payload = await verifyToken(token);
  return payload?.role === "admin";
}

// GET /api/admin/sessions — Toutes les sessions avec noms des joueurs
export async function GET(request: NextRequest) {
  if (!(await requireAdmin(request))) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  try {
    const allSessions = await db
      .select()
      .from(gameSessions)
      .orderBy(desc(gameSessions.endedAt));

    const allUserIds = [
      ...new Set(
        allSessions.flatMap(
          (s) =>
            [s.player1Id, s.player2Id, s.winnerId].filter(Boolean) as string[],
        ),
      ),
    ];

    const sessionUsers =
      allUserIds.length > 0
        ? await db
            .select({ id: users.id, username: users.username })
            .from(users)
            .where(inArray(users.id, allUserIds))
        : [];

    const userMap = Object.fromEntries(
      sessionUsers.map((u) => [u.id, u.username]),
    );

    const enriched = allSessions.map((s) => ({
      ...s,
      player1Username: userMap[s.player1Id] ?? "?",
      player2Username: userMap[s.player2Id] ?? "?",
      winnerUsername: s.winnerId ? (userMap[s.winnerId] ?? "?") : null,
    }));

    return NextResponse.json({ sessions: enriched });
  } catch (error) {
    console.error("Erreur GET admin/sessions:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// PUT /api/admin/sessions — Modifier une session (scores, gagnant)
export async function PUT(request: NextRequest) {
  if (!(await requireAdmin(request))) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { id, player1Score, player2Score, winnerId, durationSeconds } = body;

    if (!id) {
      return NextResponse.json({ error: "id requis" }, { status: 400 });
    }

    const updateData: Record<string, unknown> = {};
    if (player1Score !== undefined)
      updateData.player1Score = parseInt(player1Score);
    if (player2Score !== undefined)
      updateData.player2Score = parseInt(player2Score);
    if (winnerId !== undefined) updateData.winnerId = winnerId || null;
    if (durationSeconds !== undefined)
      updateData.durationSeconds = parseInt(durationSeconds);

    const updated = await db
      .update(gameSessions)
      .set(updateData)
      .where(eq(gameSessions.id, id))
      .returning();

    if (updated.length === 0) {
      return NextResponse.json(
        { error: "Session non trouvée" },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true, session: updated[0] });
  } catch (error) {
    console.error("Erreur PUT admin/sessions:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// DELETE /api/admin/sessions — Supprimer une session
export async function DELETE(request: NextRequest) {
  if (!(await requireAdmin(request))) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "id requis" }, { status: 400 });
    }

    const deleted = await db
      .delete(gameSessions)
      .where(eq(gameSessions.id, parseInt(id)))
      .returning();

    if (deleted.length === 0) {
      return NextResponse.json(
        { error: "Session non trouvée" },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erreur DELETE admin/sessions:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
