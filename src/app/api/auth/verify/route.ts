import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users, scans } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const scanId = searchParams.get("scanId");

    if (!userId || !scanId) {
      return NextResponse.json(
        { error: "Missing parameters" },
        { status: 400 }
      );
    }

    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const scan = await db.query.scans.findFirst({
      where: eq(scans.id, Number(scanId)),
    });

    if (!scan) {
      return NextResponse.json({ error: "Scan not found" }, { status: 404 });
    }

    if (scan.rfidUuid !== user.rfidUuid) {
      return NextResponse.json({ error: "Scan mismatch" }, { status: 403 });
    }

    if (scan.revoked) {
      return NextResponse.json({ error: "Session revoked" }, { status: 401 });
    }

    const scanTime = new Date(scan.scannedAt || 0).getTime();
    const now = Date.now();
    const fiveMinutes = 5 * 60 * 1000;

    if (now - scanTime > fiveMinutes) {
      return NextResponse.json({ error: "Session expired" }, { status: 401 });
    }

    return NextResponse.json({ valid: true, user });
  } catch (error) {
    console.error("Auth Verify Error:", error);
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}
