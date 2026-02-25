import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { scans } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { scanId } = body;

    if (!scanId) {
      return NextResponse.json({ error: "Missing scanId" }, { status: 400 });
    }

    await db
      .update(scans)
      .set({ revoked: true })
      .where(eq(scans.id, Number(scanId)));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Logout Error:", error);
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}
