import { NextRequest } from "next/server";
import { buttonEmitter, type ButtonEvent } from "@/lib/button-emitter";

export const dynamic = "force-dynamic";

// GET /api/buttons/stream?machineId=ecran_1 — SSE stream for button events
export async function GET(request: NextRequest) {
  const machineId = request.nextUrl.searchParams.get("machineId");

  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();

      // Keep-alive every 15s
      const keepAlive = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(": keep-alive\n\n"));
        } catch {
          clearInterval(keepAlive);
        }
      }, 15_000);

      const onButton = (event: ButtonEvent) => {
        // Filter by machineId if specified
        if (machineId && event.machineId !== machineId) return;

        try {
          const data = JSON.stringify({ button: event });
          controller.enqueue(encoder.encode(`data: ${data}\n\n`));
        } catch {
          cleanup();
        }
      };

      const cleanup = () => {
        clearInterval(keepAlive);
        buttonEmitter.off("button", onButton);
        try {
          controller.close();
        } catch {
          // Already closed
        }
      };

      buttonEmitter.on("button", onButton);

      request.signal.addEventListener("abort", cleanup);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
