"use client";

import { useEffect } from "react";
import type { ButtonAction } from "@/lib/button-emitter";

export function useButtonEvents(
  onButtonPress: (action: ButtonAction) => void,
  machineId?: string | null,
) {
  useEffect(() => {
    if (!machineId) return;

    const url = `/api/buttons/stream?machineId=${encodeURIComponent(machineId)}`;
    const eventSource = new EventSource(url);

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.button?.action) {
          onButtonPress(data.button.action as ButtonAction);
        }
      } catch (err) {
        console.error("Button SSE parse error", err);
      }
    };

    eventSource.onerror = () => {
      console.warn("Button SSE connection lost, reconnecting...");
    };

    return () => eventSource.close();
  }, [onButtonPress, machineId]);
}
