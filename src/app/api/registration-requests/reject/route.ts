import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { registrationRequests } from "@/db/schema";
import { eq } from "drizzle-orm";
import { registrationEmitter } from "@/lib/registration-emitter";

export async function POST(request: NextRequest) {
  try {
    const { requestId } = await request.json();

    if (!requestId) {
      return NextResponse.json({ error: "requestId requis" }, { status: 400 });
    }

    const [regRequest] = await db
      .select()
      .from(registrationRequests)
      .where(eq(registrationRequests.id, Number(requestId)))
      .limit(1);

    if (!regRequest) {
      return NextResponse.json(
        { error: "Demande introuvable" },
        { status: 404 },
      );
    }

    if (regRequest.status !== "pending") {
      return NextResponse.json(
        { error: "Demande déjà traitée" },
        { status: 400 },
      );
    }

    await db
      .update(registrationRequests)
      .set({
        status: "rejected",
        resolvedAt: new Date(),
      })
      .where(eq(registrationRequests.id, Number(requestId)));

    registrationEmitter.emit(`request-resolved:${requestId}`, {
      status: "rejected",
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erreur rejet inscription:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
