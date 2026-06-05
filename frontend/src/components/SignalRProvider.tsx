"use client";
import { useEffect, useRef } from "react";
import { useAuthStore } from "@/store/authStore";
import { useRoomStore } from "@/store/roomStore";
import { useBookingStore } from "@/store/bookingStore";
import { startConnection } from "@/lib/signalr";
import type { RoomStatus, BookingStatus } from "@/types";

const POLL_INTERVAL_MS = 20_000; // refresh every 20 s as fallback

export default function SignalRProvider({ children }: { children: React.ReactNode }) {
  const user                       = useAuthStore((s) => s.user);
  const updateRoomStatus           = useRoomStore((s) => s.updateRoomStatus);
  const handleBookingStatusUpdated = useBookingStore((s) => s.handleBookingStatusUpdated);
  const fetchBookings              = useBookingStore((s) => s.fetchBookings);
  const bookingFilter              = useBookingStore((s) => s.filter);

  const filterRef   = useRef(bookingFilter);
  const wsLive      = useRef(false); // true once SignalR push is confirmed working
  useEffect(() => { filterRef.current = bookingFilter; }, [bookingFilter]);

  useEffect(() => {
    if (!user) return;
    let mounted = true;

    // ── Polling fallback ───────────────────────────────────────
    // Runs regardless of WebSocket state. When WS is live each push
    // already calls fetchBookings, so the poll is usually a no-op.
    const pollTimer = setInterval(() => {
      fetchBookings(filterRef.current as BookingStatus | undefined);
    }, POLL_INTERVAL_MS);

    // Refresh when the tab becomes visible again (user switched away and back)
    const onVisible = () => {
      if (document.visibilityState === "visible") {
        fetchBookings(filterRef.current as BookingStatus | undefined);
      }
    };
    document.addEventListener("visibilitychange", onVisible);

    // ── SignalR ────────────────────────────────────────────────
    const setup = async (attempt = 0) => {
      if (!mounted) return;
      try {
        const conn = await startConnection();
        if (!mounted) return;

        const channels = ["rooms", "bookings"];
        if (["CleaningStaff", "Manager", "Receptionist"].includes(user.role)) {
          channels.push("housekeeping");
        }
        for (const ch of channels) {
          await conn.invoke("JoinChannel", ch);
        }

        wsLive.current = true;

        conn.on("RoomStatusUpdated", (data: unknown) => {
          const ev = data as { RoomId?: string; roomId?: string; NewStatus?: string; newStatus?: string };
          const roomId    = ev?.RoomId    ?? ev?.roomId;
          const newStatus = ev?.NewStatus ?? ev?.newStatus;
          if (roomId && newStatus) updateRoomStatus(roomId, newStatus as RoomStatus);
        });

        conn.on("BookingStatusUpdated", (data: unknown) => {
          const ev = data as {
            BookingId?: string; bookingId?: string;
            NewBookingStatus?: string; newBookingStatus?: string;
            NewStatus?: string; newStatus?: string;
          };
          const bookingId = ev?.BookingId ?? ev?.bookingId;
          const newStatus = ev?.NewBookingStatus ?? ev?.newBookingStatus ?? ev?.NewStatus ?? ev?.newStatus;
          if (bookingId && newStatus) handleBookingStatusUpdated(bookingId, newStatus);
        });

        const refresh = () =>
          fetchBookings(filterRef.current as BookingStatus | undefined);

        conn.on("ReservationCreated", refresh);
        conn.on("ReservationExpired", refresh);
        conn.on("PaymentConfirmed",   refresh);

        conn.onreconnected(() => {
          // Re-join channels after reconnect — SignalR loses group membership on reconnect
          channels.forEach((ch) => conn.invoke("JoinChannel", ch).catch(() => {}));
          refresh();
        });

      } catch (err) {
        // Retry with backoff — hub may be cold-starting on Azure
        if (mounted && attempt < 5) {
          const delay = Math.min(2000 * 2 ** attempt, 30_000);
          setTimeout(() => setup(attempt + 1), delay);
        }
      }
    };

    setup();

    return () => {
      mounted = false;
      wsLive.current = false;
      clearInterval(pollTimer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [user, updateRoomStatus, handleBookingStatusUpdated, fetchBookings]);

  return <>{children}</>;
}
