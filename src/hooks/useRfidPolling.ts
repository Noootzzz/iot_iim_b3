"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function useRfidPolling(
  onScan?: (scan: any) => void,
  borne?: string | null,
) {
  const router = useRouter();

  useEffect(() => {
    const url = borne
      ? `/api/rfid/stream?machineId=${encodeURIComponent(borne)}`
      : "/api/rfid/stream";

    const eventSource = new EventSource(url);

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.scan) {
          if (onScan) {
            onScan(data.scan);
            return;
          }

          if (data.scan.known && data.scan.user) {
            router.push(
              `/game?userId=${data.scan.user.id}&scanId=${data.scan.id}`,
            );
          } else {
            router.push(
              `/register?rfid=${data.scan.rfidUuid}&scanId=${data.scan.id}`,
            );
          }
        }
      } catch (err) {
        console.error("SSE parse error", err);
      }
    };

    eventSource.onerror = () => {
      // EventSource reconnects automatically after a short delay
      console.warn("SSE connection lost, reconnecting...");
    };

    return () => eventSource.close();
  }, [router, onScan, borne]);
}
