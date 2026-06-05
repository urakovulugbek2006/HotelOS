import { useEffect, useRef } from "react";
import type { HubConnection } from "@microsoft/signalr";
import { startConnection, joinChannel, leaveChannel } from "@/lib/signalr";

export function useSignalR(
  channel: string,
  handlers: Record<string, (...args: unknown[]) => void>
) {
  const connRef = useRef<HubConnection | null>(null);

  useEffect(() => {
    let mounted = true;

    const setup = async () => {
      try {
        const conn = await startConnection();
        if (!mounted) return;
        connRef.current = conn;
        await joinChannel(channel);
        Object.entries(handlers).forEach(([event, handler]) => {
          conn.on(event, handler);
        });
      } catch {
        // SignalR unavailable — degrade gracefully
      }
    };

    setup();

    return () => {
      mounted = false;
      const conn = connRef.current;
      if (conn) {
        Object.keys(handlers).forEach((event) => conn.off(event));
        leaveChannel(channel).catch(() => {});
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channel]);
}
