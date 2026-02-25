import { NextRequest } from "next/server";
import { registrationEmitter } from "@/lib/registration-emitter";

export const dynamic = "force-dynamic";

// GET /api/registration-requests/stream?requestId=123
// SSE pour la borne — attend la résolution d'une demande spécifique
export async function GET(request: NextRequest) {
  const requestId = request.nextUrl.searchParams.get("requestId");

  if (!requestId) {
    return new Response("requestId required", { status: 400 });
  }

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

      const eventName = `request-resolved:${requestId}`;

      const onResolved = (data: unknown) => {
        try {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(data)}\n\n`),
          );
        } catch {
          /* noop */
        }
        // Fermer la connexion après résolution
        setTimeout(() => cleanup(), 100);
      };

      const cleanup = () => {
        clearInterval(keepAlive);
        registrationEmitter.off(eventName, onResolved);
        try {
          controller.close();
        } catch {}
      };

      registrationEmitter.on(eventName, onResolved);
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
