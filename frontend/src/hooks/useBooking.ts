import { useState, useCallback } from "react";
import { bookingsApi } from "@/lib/api";
import type { BookingResponse } from "@/types";

export function useBooking(id: string) {
  const [booking, setBooking] = useState<BookingResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const b = await bookingsApi.getById(id);
      setBooking(b);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load booking");
    } finally {
      setLoading(false);
    }
  }, [id]);

  return { booking, loading, error, refetch: fetch };
}
