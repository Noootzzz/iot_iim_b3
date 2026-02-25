import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (id) {
      const result = await db
        .select()
        .from(users)
        .where(eq(users.id, id))
        .limit(1);

      if (result.length === 0) {
        return NextResponse.json(
          { error: "Utilisateur introuvable" },
          { status: 404 }
        );
      }

      return NextResponse.json({ user: result[0] });
    }

    const allUsers = await db.select().from(users);
    return NextResponse.json({ users: allUsers });
  } catch (error) {
    console.error("Erreur GET users:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, email, rfidUuid } = body;

    if (!username) {
      return NextResponse.json(
        { error: "Le pseudo est requis" },
        { status: 400 }
      );
    }

    const existingName = await db
      .select()
      .from(users)
      .where(eq(users.username, username))
      .limit(1);

    if (existingName.length > 0) {
      return NextResponse.json(
        { error: "Ce pseudo est déjà pris" },
        { status: 409 }
      );
    }

    if (email) {
      const existingEmail = await db
        .select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1);

      if (existingEmail.length > 0) {
        return NextResponse.json(
          { error: "Cet email est déjà utilisé" },
          { status: 409 }
        );
      }
    }

    if (rfidUuid) {
      const existingRfid = await db
        .select()
        .from(users)
        .where(eq(users.rfidUuid, rfidUuid))
        .limit(1);

      if (existingRfid.length > 0) {
        return NextResponse.json(
          { error: "Ce badge est déjà associé à un compte" },
          { status: 409 }
        );
      }
    }

    const newUser = await db
      .insert(users)
      .values({
        username,
        email: email || null,
        rfidUuid: rfidUuid || null,
      })
      .returning();

    return NextResponse.json(
      {
        success: true,
        user: newUser[0],
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Erreur POST users:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, username, email } = body;

    if (!id) {
      return NextResponse.json({ error: "id est requis" }, { status: 400 });
    }

    const updatedUser = await db
      .update(users)
      .set({
        ...(username && { username }),
        ...(email && { email }),
      })
      .where(eq(users.id, id))
      .returning();

    if (updatedUser.length === 0) {
      return NextResponse.json(
        { error: "Utilisateur non trouvé" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      user: updatedUser[0],
    });
  } catch (error) {
    console.error("Erreur PUT users:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
