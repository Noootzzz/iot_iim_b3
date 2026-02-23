import { NextRequest } from "next/server";
import { scanEmitter } from "@/lib/scan-emitter";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const machineId = request.nextUrl.searchParams.get("machineId");

  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();

      // Send a keep-alive comment every 15s to prevent proxy/browser timeout
      const keepAlive = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(": keep-alive\n\n"));
        } catch {
          clearInterval(keepAlive);
        }
      }, 15_000);

      const onScan = (scan: {
        id: number;
        rfidUuid: string;
        machineId: string | null;
        known: boolean;
        user: unknown | null;
      }) => {
        // Filter by machineId if specified
        if (machineId && scan.machineId !== machineId) return;

        try {
          const data = JSON.stringify({ scan });
          controller.enqueue(encoder.encode(`data: ${data}\n\n`));
        } catch {
          // Client disconnected
          cleanup();
        }
      };

      const cleanup = () => {
        clearInterval(keepAlive);
        scanEmitter.off("scan", onScan);
        try {
          controller.close();
        } catch {
          // Already closed
        }
      };

      scanEmitter.on("scan", onScan);

      // Clean up when the client disconnects
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
