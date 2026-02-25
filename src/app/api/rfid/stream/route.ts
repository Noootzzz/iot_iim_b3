import { NextRequest } from "next/server";
import { scanEmitter } from "@/lib/scan-emitter";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const machineId = request.nextUrl.searchParams.get("machineId");

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

      const onScan = (scan: {
        id: number;
        rfidUuid: string;
        machineId: string | null;
        known: boolean;
        user: unknown | null;
      }) => {
        if (machineId && scan.machineId !== machineId) return;

        try {
          const data = JSON.stringify({ scan });
          controller.enqueue(encoder.encode(`data: ${data}\n\n`));
        } catch {
          cleanup();
        }
      };

      const cleanup = () => {
        clearInterval(keepAlive);
        scanEmitter.off("scan", onScan);
        try {
          controller.close();
        } catch {
        }
      };

      scanEmitter.on("scan", onScan);

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
