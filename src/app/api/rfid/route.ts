import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users, scans } from "@/db/schema";
import { eq, desc, and, gt } from "drizzle-orm";

const IOT_SECRET = process.env.IOT_SECRET || "CHANGE_ME_IN_PROD";

// POST /api/rfid - Webhook appelé par le Raspberry Pi
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { rfidUuid, machineId } = body;

    if (!rfidUuid) {
      return NextResponse.json({ error: "Missing UUID" }, { status: 400 });
    }

    await db.insert(scans).values({
      rfidUuid,
      machineId: machineId || null,
      consumed: false,
    });

    const existingUser = await db.query.users.findFirst({
      where: eq(users.rfidUuid, rfidUuid),
    });

    return NextResponse.json({
      success: true,
      known: !!existingUser,
      message: "Scan logged securely",
    });
  } catch (error) {
    console.error("Erreur API RFID POST:", error);
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}

// GET /api/rfid - Polling Frontend
export async function GET(request: NextRequest) {
  try {
    const machineId = request.nextUrl.searchParams.get("machineId");
    const fiveSecondsAgo = new Date(Date.now() - 5000);

    const conditions = [
      eq(scans.consumed, false),
      gt(scans.scannedAt, fiveSecondsAgo),
    ];

    if (machineId) {
      conditions.push(eq(scans.machineId, machineId));
    }

    const latestScan = await db.query.scans.findFirst({
      where: and(...conditions),
      orderBy: [desc(scans.scannedAt)],
    });

    if (!latestScan) {
      return NextResponse.json({ scan: null });
    }

    await db
      .update(scans)
      .set({ consumed: true })
      .where(eq(scans.id, latestScan.id));

    const user = await db.query.users.findFirst({
      where: eq(users.rfidUuid, latestScan.rfidUuid),
    });

    return NextResponse.json({
      scan: {
        id: latestScan.id,
        rfidUuid: latestScan.rfidUuid,
        machineId: latestScan.machineId || null,
        known: !!user,
        user: user || null,
      },
    });
  } catch (error) {
    console.error("Erreur API RFID GET:", error);
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}
