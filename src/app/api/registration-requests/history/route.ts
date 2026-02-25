import { NextResponse } from "next/server";
import { db } from "@/db";
import { registrationRequests } from "@/db/schema";
import { not, eq, desc } from "drizzle-orm";

export async function GET() {
  try {
    const requests = await db
      .select()
      .from(registrationRequests)
      .where(not(eq(registrationRequests.status, "pending")))
      .orderBy(desc(registrationRequests.resolvedAt));

    return NextResponse.json({ requests });
  } catch (error) {
    console.error("Erreur GET registration-requests history:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
