"use client";

import { useEffect } from "react";

export function useRfidPolling(
  onScan: (scan: any) => void,
  borne?: string | null,
) {
  useEffect(() => {
    const url = borne
      ? `/api/rfid/stream?machineId=${encodeURIComponent(borne)}`
      : "/api/rfid/stream";

    const eventSource = new EventSource(url);

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.scan) {
          onScan(data.scan);
        }
      } catch (err) {
        console.error("SSE parse error", err);
      }
    };

    eventSource.onerror = () => {
      console.warn("SSE connection lost, reconnecting...");
    };

    return () => eventSource.close();
  }, [onScan, borne]);
}
