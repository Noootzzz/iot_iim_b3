import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users, scans } from "@/db/schema";
import { eq, desc, and, gt } from "drizzle-orm";

const IOT_SECRET = process.env.IOT_SECRET || "CHANGE_ME_IN_PROD";

// POST /api/rfid - Webhook appelé par le Raspberry Pi
export async function POST(request: NextRequest) {
  try {
    // Méthode 2 : User-Agent ESP32 (pour le vrai Raspberry)
    const userAgent = request.headers.get("user-agent") || "";
    const isFromESP32 = userAgent.includes("ESP32");

    // Autoriser si l'un des deux est valide
    if (!isFromESP32) {
      console.log(
        "RFID Unauthorized - UA:",
        "UA:",
        userAgent
      );
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { rfidUuid } = body;

    if (!rfidUuid) {
      return NextResponse.json({ error: "Missing UUID" }, { status: 400 });
    }

    await db.insert(scans).values({
      rfidUuid,
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
export async function GET() {
  try {
    const fiveSecondsAgo = new Date(Date.now() - 5000);

    const latestScan = await db.query.scans.findFirst({
      where: and(
        eq(scans.consumed, false),
        gt(scans.scannedAt, fiveSecondsAgo)
      ),
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
        id: latestScan.id, // Ajout de l'ID du scan pour la vérification
        rfidUuid: latestScan.rfidUuid,
        known: !!user,
        user: user || null,
      },
    });
  } catch (error) {
    console.error("Erreur API RFID GET:", error);
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}
