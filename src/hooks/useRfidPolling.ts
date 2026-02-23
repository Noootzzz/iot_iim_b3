"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function useRfidPolling(
  onScan?: (scan: any) => void,
  borne?: string | null,
) {
  const router = useRouter();

  useEffect(() => {
    const poll = async () => {
      try {
        const url = borne
          ? `/api/rfid?machineId=${encodeURIComponent(borne)}`
          : "/api/rfid";
        const res = await fetch(url, { cache: "no-store" });
        if (!res.ok) return;

        const data = await res.json();

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
        console.error("Polling error", err);
      }
    };

    const interval = setInterval(poll, 1500);

    return () => clearInterval(interval);
  }, [router, onScan, borne]);
}
