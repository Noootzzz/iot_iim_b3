import { NextRequest, NextResponse } from "next/server";
import {
  buttonEmitter,
  type ButtonAction,
  type ButtonEvent,
} from "@/lib/button-emitter";

const VALID_ACTIONS: ButtonAction[] = [
  "increment_p1",
  "increment_p2",
  "decrement_p1",
  "decrement_p2",
  "back",
];

// POST /api/buttons — Called by the Raspberry Pi when a physical button is pressed
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { machineId, action } = body;

    if (!machineId || !action) {
      return NextResponse.json(
        { error: "machineId et action sont requis" },
        { status: 400 },
      );
    }

    if (!VALID_ACTIONS.includes(action)) {
      return NextResponse.json(
        {
          error: `Action invalide. Actions valides: ${VALID_ACTIONS.join(", ")}`,
        },
        { status: 400 },
      );
    }

    const event: ButtonEvent = {
      machineId,
      action,
      timestamp: Date.now(),
    };

    // Broadcast to all SSE clients listening for this machineId
    buttonEmitter.emit("button", event);

    return NextResponse.json({ success: true, event });
  } catch (error) {
    console.error("Erreur API buttons POST:", error);
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}
