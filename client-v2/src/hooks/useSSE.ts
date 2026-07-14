import { useEffect, useRef, useCallback, useState } from "react";
import type { AgentEvent } from "../types";

const SSE_URL = "/api/v1/events/agent-status";

export function useSSE() {
  const [events, setEvents] = useState<AgentEvent[]>([]);
  const [connected, setConnected] = useState(false);
  const sourceRef = useRef<EventSource | null>(null);

  const connect = useCallback(() => {
    if (sourceRef.current) return;

    const source = new EventSource(SSE_URL);
    sourceRef.current = source;

    source.onopen = () => setConnected(true);

    source.onmessage = (event) => {
      try {
        const data: AgentEvent = JSON.parse(event.data);
        if (data.type === "heartbeat") return;
        setEvents((prev) => [...prev, data]);
      } catch {
        // ignore parse errors
      }
    };

    source.onerror = () => {
      setConnected(false);
      source.close();
      sourceRef.current = null;
      // Reconnect after 3s
      setTimeout(connect, 3000);
    };
  }, []);

  const disconnect = useCallback(() => {
    sourceRef.current?.close();
    sourceRef.current = null;
    setConnected(false);
  }, []);

  const clearEvents = useCallback(() => setEvents([]), []);

  useEffect(() => {
    return () => disconnect();
  }, [disconnect]);

  return { events, connected, connect, disconnect, clearEvents };
}
