import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users, scans } from "@/db/schema";
import { eq } from "drizzle-orm";
import { scanEmitter } from "@/lib/scan-emitter";

const IOT_SECRET = process.env.IOT_SECRET || "CHANGE_ME_IN_PROD";

// POST /api/rfid - Webhook appelé par le Raspberry Pi
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { rfidUuid, machineId } = body;

    if (!rfidUuid) {
      return NextResponse.json({ error: "Missing UUID" }, { status: 400 });
    }

    const [inserted] = await db
      .insert(scans)
      .values({
        rfidUuid,
        machineId: machineId || null,
        consumed: false,
      })
      .returning();

    const existingUser = await db.query.users.findFirst({
      where: eq(users.rfidUuid, rfidUuid),
    });

    // Notify all SSE clients instantly
    scanEmitter.emit("scan", {
      id: inserted.id,
      rfidUuid: inserted.rfidUuid,
      machineId: inserted.machineId || null,
      known: !!existingUser,
      user: existingUser || null,
    });

    // Mark as consumed immediately (SSE already delivered it)
    await db
      .update(scans)
      .set({ consumed: true })
      .where(eq(scans.id, inserted.id));

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
