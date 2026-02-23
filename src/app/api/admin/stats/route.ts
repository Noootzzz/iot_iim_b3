import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { gameSessions, users } from "@/db/schema";
import { eq, desc, count, sql, and, gte } from "drizzle-orm";
import { verifyToken, COOKIE_NAME } from "@/lib/admin-auth";

async function requireAdmin(request: NextRequest) {
  const token = request.cookies.get(COOKIE_NAME)?.value;
  if (!token) return false;
  const payload = await verifyToken(token);
  return payload?.role === "admin";
}

export async function GET(request: NextRequest) {
  if (!(await requireAdmin(request))) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  try {
    // --- KPIs globaux ---
    const [usersCount] = await db
      .select({ count: count() })
      .from(users)
      .where(eq(users.role, "user"));

    const [sessionsCount] = await db
      .select({ count: count() })
      .from(gameSessions);

    const [avgDuration] = await db
      .select({ avg: sql<number>`COALESCE(ROUND(AVG(duration_seconds)), 0)` })
      .from(gameSessions);

    const [totalPoints] = await db
      .select({
        total: sql<number>`COALESCE(SUM(player1_score) + SUM(player2_score), 0)`,
      })
      .from(gameSessions);

    const [avgScore] = await db
      .select({
        avg: sql<number>`COALESCE(ROUND((AVG(player1_score) + AVG(player2_score)) / 2, 1), 0)`,
      })
      .from(gameSessions);

    const [longestGame] = await db
      .select({ max: sql<number>`COALESCE(MAX(duration_seconds), 0)` })
      .from(gameSessions);

    const [shortestGame] = await db
      .select({ min: sql<number>`COALESCE(MIN(duration_seconds), 0)` })
      .from(gameSessions);

    const [highestScore] = await db
      .select({
        max: sql<number>`GREATEST(COALESCE(MAX(player1_score), 0), COALESCE(MAX(player2_score), 0))`,
      })
      .from(gameSessions);

    const [closestGame] = await db
      .select({
        minDiff: sql<number>`COALESCE(MIN(ABS(player1_score - player2_score)), 0)`,
      })
      .from(gameSessions);

    // --- Parties aujourd'hui ---
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [todaySessions] = await db
      .select({ count: count() })
      .from(gameSessions)
      .where(gte(gameSessions.endedAt, todayStart));

    // --- Parties cette semaine ---
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    weekStart.setHours(0, 0, 0, 0);

    const [weekSessions] = await db
      .select({ count: count() })
      .from(gameSessions)
      .where(gte(gameSessions.endedAt, weekStart));

    // --- Nouveaux joueurs cette semaine ---
    const [newUsersWeek] = await db
      .select({ count: count() })
      .from(users)
      .where(and(eq(users.role, "user"), gte(users.createdAt, weekStart)));

    // --- Parties par jour (7 derniers jours) ---
    const sessionsPerDay = await db
      .select({
        day: sql<string>`TO_CHAR(ended_at, 'YYYY-MM-DD')`,
        count: count(),
      })
      .from(gameSessions)
      .where(
        gte(
          gameSessions.endedAt,
          new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        ),
      )
      .groupBy(sql`TO_CHAR(ended_at, 'YYYY-MM-DD')`)
      .orderBy(sql`TO_CHAR(ended_at, 'YYYY-MM-DD')`);

    // --- Score moyen par partie ---
    const avgScorePerGame = await db
      .select({
        avg: sql<number>`ROUND(AVG(player1_score + player2_score), 1)`,
      })
      .from(gameSessions);

    return NextResponse.json({
      stats: {
        totalUsers: usersCount.count,
        totalSessions: sessionsCount.count,
        avgDurationSeconds: avgDuration.avg ?? 0,
        totalPoints: Number(totalPoints.total) || 0,
        avgScorePerPlayer: Number(avgScore.avg) || 0,
        longestGameSeconds: Number(longestGame.max) || 0,
        shortestGameSeconds: Number(shortestGame.min) || 0,
        highestScore: Number(highestScore.max) || 0,
        closestGameDiff: Number(closestGame.minDiff) || 0,
        todaySessions: todaySessions.count,
        weekSessions: weekSessions.count,
        newUsersThisWeek: newUsersWeek.count,
        sessionsPerDay,
      },
    });
  } catch (error) {
    console.error("Erreur GET admin/stats:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
