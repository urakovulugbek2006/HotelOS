"use client";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import toast from "react-hot-toast";
import SiteHeader from "@/components/client/SiteHeader";
import SiteFooter from "@/components/client/SiteFooter";
import RoomCard from "@/components/client/RoomCard";
import { SkeletonGrid } from "@/components/ui/LoadingSkeleton";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import { roomsApi, bookingsApi } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { ROOM_STYLES } from "@/lib/roomStyle";
import type { RoomResponse, RoomStyle } from "@/types";

function nightsBetween(a: string, b: string): number {
  const ms = new Date(b).getTime() - new Date(a).getTime();
  return Math.max(0, Math.round(ms / 86_400_000));
}

function RoomsInner() {
  const router = useRouter();
  const params = useSearchParams();
  const user = useAuthStore((s) => s.user);

  const today = new Date().toISOString().split("T")[0];
  const tomorrow = new Date(Date.now() + 86_400_000).toISOString().split("T")[0];

  const [checkIn, setCheckIn] = useState(params.get("checkIn") || today);
  const [checkOut, setCheckOut] = useState(params.get("checkOut") || tomorrow);
  const [style, setStyle] = useState<string>(params.get("style") || "");

  const [rooms, setRooms] = useState<RoomResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [searched, setSearched] = useState(false);

  const [selected, setSelected] = useState<RoomResponse | null>(null);
  const [booking, setBooking] = useState(false);

  const nights = useMemo(() => nightsBetween(checkIn, checkOut), [checkIn, checkOut]);

  const runSearch = useCallback(async () => {
    if (!checkIn || !checkOut || nightsBetween(checkIn, checkOut) < 1) {
      toast.error("Please choose a valid date range");
      return;
    }
    setLoading(true);
    setSearched(true);
    try {
      const ci = new Date(checkIn).toISOString();
      const co = new Date(checkOut).toISOString();
      const results = await roomsApi.search(ci, co, (style || undefined) as RoomStyle | undefined);
      setRooms(results);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Could not load availability");
      setRooms([]);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checkIn, checkOut, style]);

  useEffect(() => { runSearch(); /* initial */ }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const onReserve = (room: RoomResponse) => {
    if (!user || user.role !== "Client") {
      const next = `/rooms?checkIn=${checkIn}&checkOut=${checkOut}${style ? `&style=${style}` : ""}`;
      toast("Please sign in to complete your booking");
      router.push(`/guest/login?next=${encodeURIComponent(next)}`);
      return;
    }
    setSelected(room);
  };

  const confirmReservation = async () => {
    if (!selected) return;
    setBooking(true);
    try {
      const created = await bookingsApi.create({
        roomId: selected.id,
        checkIn: new Date(checkIn).toISOString(),
        checkOut: new Date(checkOut).toISOString(),
      });
      toast.success("Room reserved — complete payment to confirm");
      setSelected(null);
      router.push(`/guest/bookings/${created.id}`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Reservation failed");
    } finally {
      setBooking(false);
    }
  };

  return (
    <div className="min-h-screen">
      <SiteHeader />

      {/* Page hero / search */}
      <section className="relative pt-28 pb-8">
        <div className="absolute inset-0 bg-ink-radial" />
        <div className="absolute inset-0 bg-hero-glow" />
        <div className="relative max-w-7xl mx-auto px-5 sm:px-8">
          <p className="eyebrow mb-3">Accommodation</p>
          <h1 className="font-display text-4xl sm:text-5xl text-white">Find your room</h1>
          <p className="text-slate-400 mt-2">Live availability across all of GrandStay.</p>

          <div className="mt-7 glass-strong rounded-2xl p-3 sm:p-4 shadow-glow grid grid-cols-1 sm:grid-cols-[1fr_1fr_1fr_auto] gap-3">
            <div>
              <label>Check-in</label>
              <input type="date" min={today} value={checkIn} onChange={(e) => setCheckIn(e.target.value)} />
            </div>
            <div>
              <label>Check-out</label>
              <input type="date" min={checkIn} value={checkOut} onChange={(e) => setCheckOut(e.target.value)} />
            </div>
            <div>
              <label>Room type</label>
              <select value={style} onChange={(e) => setStyle(e.target.value)}>
                <option value="">Any type</option>
                {ROOM_STYLES.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <Button onClick={runSearch} size="lg" className="w-full sm:w-auto">Search</Button>
            </div>
          </div>
        </div>
      </section>

      {/* Results */}
      <section className="max-w-7xl mx-auto px-5 sm:px-8 pb-10">
        <div className="flex items-center justify-between mb-6">
          <p className="text-sm text-slate-400">
            {loading ? "Searching…" : `${rooms.length} ${rooms.length === 1 ? "room" : "rooms"} available`}
            {nights > 0 && !loading ? ` · ${nights} ${nights === 1 ? "night" : "nights"}` : ""}
          </p>
        </div>

        {loading ? (
          <SkeletonGrid count={6} />
        ) : rooms.length === 0 ? (
          <div className="glass rounded-2xl py-20 text-center">
            <div className="grid place-items-center w-14 h-14 mx-auto rounded-2xl bg-white/[0.04] text-slate-500 mb-4">
              <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.3-4.3M11 19a8 8 0 110-16 8 8 0 010 16z" />
              </svg>
            </div>
            <h3 className="text-white font-semibold text-lg">No rooms for these dates</h3>
            <p className="text-slate-400 text-sm mt-1.5 max-w-sm mx-auto">
              {searched ? "Try adjusting your dates or choosing a different room type." : "Search to see live availability."}
            </p>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {rooms.map((room) => (
              <RoomCard key={room.id} room={room} nights={nights} onReserve={onReserve} />
            ))}
          </div>
        )}
      </section>

      <SiteFooter />

      {/* Reservation confirm modal */}
      <Modal open={!!selected} onClose={() => setSelected(null)} title="Confirm your reservation">
        {selected && (
          <div className="space-y-5">
            <div className="glass rounded-xl p-4 space-y-2.5 text-sm">
              <Row label="Room" value={`Room ${selected.roomNumber} · ${selected.style}`} />
              <Row label="Guests" value={`Up to ${selected.capacity}`} />
              <Row label="Check-in" value={new Date(checkIn).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })} />
              <Row label="Check-out" value={new Date(checkOut).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })} />
              <Row label="Rate" value={`$${selected.pricePerNight} × ${nights} ${nights === 1 ? "night" : "nights"}`} />
              <div className="hairline my-1" />
              <Row label="Total" value={`$${(selected.pricePerNight * nights).toFixed(2)}`} highlight />
            </div>
            <p className="text-xs text-slate-500">
              Your room is held for 10 minutes while you complete payment.
            </p>
            <div className="flex gap-3 justify-end">
              <Button variant="ghost" onClick={() => setSelected(null)}>Cancel</Button>
              <Button onClick={confirmReservation} loading={booking}>Reserve &amp; continue</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

function Row({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-slate-400">{label}</span>
      <span className={highlight ? "text-gold-300 font-semibold text-base" : "text-white text-right"}>{value}</span>
    </div>
  );
}

export default function RoomsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-ink-radial" />}>
      <RoomsInner />
    </Suspense>
  );
}
