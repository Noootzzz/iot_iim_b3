import { NextRequest } from "next/server";
import { registrationEmitter } from "@/lib/registration-emitter";

export const dynamic = "force-dynamic";

// GET /api/registration-requests/admin-stream
// SSE pour l'admin — reçoit les nouvelles demandes d'inscription en temps réel
export async function GET(request: NextRequest) {
  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();

      const keepAlive = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(": keep-alive\n\n"));
        } catch {
          clearInterval(keepAlive);
        }
      }, 15_000);

      const onNewRequest = (data: unknown) => {
        try {
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ type: "new-request", request: data })}\n\n`,
            ),
          );
        } catch {
          cleanup();
        }
      };

      const cleanup = () => {
        clearInterval(keepAlive);
        registrationEmitter.off("new-request", onNewRequest);
        try {
          controller.close();
        } catch {}
      };

      registrationEmitter.on("new-request", onNewRequest);
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
