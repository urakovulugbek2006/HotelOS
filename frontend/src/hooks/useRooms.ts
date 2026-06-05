import { useState, useCallback } from "react";
import { roomsApi } from "@/lib/api";
import type { RoomResponse, RoomStyle } from "@/types";

export function useRoomSearch(checkIn: string, checkOut: string, style?: RoomStyle) {
  const [rooms, setRooms] = useState<RoomResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const search = useCallback(async () => {
    if (!checkIn || !checkOut) return;
    setLoading(true);
    setError(null);
    try {
      const results = await roomsApi.search(checkIn, checkOut, style);
      setRooms(results);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Search failed");
    } finally {
      setLoading(false);
    }
  }, [checkIn, checkOut, style]);

  return { rooms, loading, error, search };
}
