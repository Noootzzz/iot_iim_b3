import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { registrationRequests, users, scans } from "@/db/schema";
import { eq } from "drizzle-orm";
import { registrationEmitter } from "@/lib/registration-emitter";

// POST — L'admin approuve une demande et crée le compte utilisateur
export async function POST(request: NextRequest) {
  try {
    const { requestId, username, email } = await request.json();

    if (!requestId || !username) {
      return NextResponse.json(
        { error: "requestId et username sont requis" },
        { status: 400 },
      );
    }

    // Récupérer la demande
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

    // Vérifier que le pseudo n'est pas déjà pris
    const existingName = await db
      .select()
      .from(users)
      .where(eq(users.username, username))
      .limit(1);

    if (existingName.length > 0) {
      return NextResponse.json(
        { error: "Ce pseudo est déjà pris" },
        { status: 409 },
      );
    }

    // Vérifier que le badge n'est pas déjà associé
    const existingRfid = await db
      .select()
      .from(users)
      .where(eq(users.rfidUuid, regRequest.rfidUuid))
      .limit(1);

    if (existingRfid.length > 0) {
      return NextResponse.json(
        { error: "Ce badge est déjà associé à un compte" },
        { status: 409 },
      );
    }

    // Vérifier l'email si fourni
    if (email) {
      const existingEmail = await db
        .select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1);

      if (existingEmail.length > 0) {
        return NextResponse.json(
          { error: "Cet email est déjà utilisé" },
          { status: 409 },
        );
      }
    }

    // Créer l'utilisateur
    const [newUser] = await db
      .insert(users)
      .values({
        username,
        email: email || null,
        rfidUuid: regRequest.rfidUuid,
      })
      .returning();

    // Créer un nouveau scan frais pour la borne (TTL 5 min)
    const [newScan] = await db
      .insert(scans)
      .values({
        rfidUuid: regRequest.rfidUuid,
        machineId: regRequest.machineId,
        consumed: false,
        revoked: false,
      })
      .returning();

    // Mettre à jour la demande
    await db
      .update(registrationRequests)
      .set({
        status: "approved",
        createdUserId: newUser.id,
        resolvedAt: new Date(),
      })
      .where(eq(registrationRequests.id, Number(requestId)));

    // Notifier la borne via SSE
    registrationEmitter.emit(`request-resolved:${requestId}`, {
      status: "approved",
      user: { id: newUser.id, username: newUser.username },
      scanId: newScan.id,
    });

    return NextResponse.json({
      success: true,
      user: newUser,
      scanId: newScan.id,
    });
  } catch (error) {
    console.error("Erreur approbation inscription:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
