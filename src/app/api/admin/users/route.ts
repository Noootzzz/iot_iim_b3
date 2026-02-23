import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users, gameSessions } from "@/db/schema";
import { eq, count, sql, desc, and, ne } from "drizzle-orm";
import { verifyToken, COOKIE_NAME } from "@/lib/admin-auth";

async function requireAdmin(request: NextRequest) {
  const token = request.cookies.get(COOKIE_NAME)?.value;
  if (!token) return false;
  const payload = await verifyToken(token);
  return payload?.role === "admin";
}

// GET /api/admin/users — Liste complète des joueurs avec stats
export async function GET(request: NextRequest) {
  if (!(await requireAdmin(request))) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  try {
    // All users
    const allUsers = await db
      .select({
        id: users.id,
        username: users.username,
        email: users.email,
        rfidUuid: users.rfidUuid,
        role: users.role,
        createdAt: users.createdAt,
      })
      .from(users)
      .orderBy(desc(users.createdAt));

    // Wins per user
    const winsData = await db
      .select({
        userId: gameSessions.winnerId,
        wins: count(gameSessions.id),
      })
      .from(gameSessions)
      .groupBy(gameSessions.winnerId);

    const winsMap = Object.fromEntries(
      winsData.filter((w) => w.userId).map((w) => [w.userId!, w.wins]),
    );

    // Games played per user (as player1 or player2)
    const gamesAsP1 = await db
      .select({
        userId: gameSessions.player1Id,
        games: count(gameSessions.id),
      })
      .from(gameSessions)
      .groupBy(gameSessions.player1Id);

    const gamesAsP2 = await db
      .select({
        userId: gameSessions.player2Id,
        games: count(gameSessions.id),
      })
      .from(gameSessions)
      .groupBy(gameSessions.player2Id);

    const gamesMap: Record<string, number> = {};
    for (const g of gamesAsP1) {
      gamesMap[g.userId] = (gamesMap[g.userId] || 0) + g.games;
    }
    for (const g of gamesAsP2) {
      gamesMap[g.userId] = (gamesMap[g.userId] || 0) + g.games;
    }

    // Total points per user
    const pointsAsP1 = await db
      .select({
        userId: gameSessions.player1Id,
        points: sql<number>`COALESCE(SUM(player1_score), 0)`,
      })
      .from(gameSessions)
      .groupBy(gameSessions.player1Id);

    const pointsAsP2 = await db
      .select({
        userId: gameSessions.player2Id,
        points: sql<number>`COALESCE(SUM(player2_score), 0)`,
      })
      .from(gameSessions)
      .groupBy(gameSessions.player2Id);

    const pointsMap: Record<string, number> = {};
    for (const p of pointsAsP1) {
      pointsMap[p.userId] = (pointsMap[p.userId] || 0) + Number(p.points);
    }
    for (const p of pointsAsP2) {
      pointsMap[p.userId] = (pointsMap[p.userId] || 0) + Number(p.points);
    }

    const enrichedUsers = allUsers.map((u) => ({
      ...u,
      wins: winsMap[u.id] || 0,
      gamesPlayed: gamesMap[u.id] || 0,
      totalPoints: pointsMap[u.id] || 0,
      winRate:
        gamesMap[u.id] && gamesMap[u.id] > 0
          ? Math.round(((winsMap[u.id] || 0) / gamesMap[u.id]) * 100)
          : 0,
    }));

    return NextResponse.json({ users: enrichedUsers });
  } catch (error) {
    console.error("Erreur GET admin/users:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// PUT /api/admin/users — Modifier un utilisateur
export async function PUT(request: NextRequest) {
  if (!(await requireAdmin(request))) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { id, username, email, role } = body;

    if (!id) {
      return NextResponse.json({ error: "id requis" }, { status: 400 });
    }

    const updateData: Record<string, unknown> = {};
    if (username !== undefined) updateData.username = username;
    if (email !== undefined) updateData.email = email || null;
    if (role !== undefined) updateData.role = role;

    const updated = await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, id))
      .returning();

    if (updated.length === 0) {
      return NextResponse.json(
        { error: "Utilisateur non trouvé" },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true, user: updated[0] });
  } catch (error) {
    console.error("Erreur PUT admin/users:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// DELETE /api/admin/users — Supprimer un utilisateur
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

    const deleted = await db.delete(users).where(eq(users.id, id)).returning();

    if (deleted.length === 0) {
      return NextResponse.json(
        { error: "Utilisateur non trouvé" },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erreur DELETE admin/users:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
