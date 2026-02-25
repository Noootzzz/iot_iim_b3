import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { registrationRequests } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { registrationEmitter } from "@/lib/registration-emitter";

// GET — Lister les demandes d'inscription en attente
export async function GET() {
  try {
    const requests = await db
      .select()
      .from(registrationRequests)
      .where(eq(registrationRequests.status, "pending"));

    return NextResponse.json({ requests });
  } catch (error) {
    console.error("Erreur GET registration-requests:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// POST — Créer une demande d'inscription (appelé par la borne)
export async function POST(request: NextRequest) {
  try {
    const { rfidUuid, scanId, machineId } = await request.json();

    if (!rfidUuid) {
      return NextResponse.json(
        { error: "rfidUuid requis" },
        { status: 400 },
      );
    }

    // Vérifier s'il y a déjà une demande en attente pour ce badge
    const existing = await db
      .select()
      .from(registrationRequests)
      .where(
        and(
          eq(registrationRequests.rfidUuid, rfidUuid),
          eq(registrationRequests.status, "pending"),
        ),
      )
      .limit(1);

    if (existing.length > 0) {
      // Réémettre pour notifier l'admin au cas où
      registrationEmitter.emit("new-request", existing[0]);
      return NextResponse.json({ request: existing[0] });
    }

    const [inserted] = await db
      .insert(registrationRequests)
      .values({
        rfidUuid,
        scanId: scanId ? Number(scanId) : null,
        machineId: machineId || null,
      })
      .returning();

    // Notifier l'admin via SSE
    registrationEmitter.emit("new-request", inserted);

    return NextResponse.json({ request: inserted }, { status: 201 });
  } catch (error) {
    console.error("Erreur POST registration-requests:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
