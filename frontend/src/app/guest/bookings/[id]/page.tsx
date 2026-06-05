"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import toast from "react-hot-toast";
import { bookingsApi, roomsApi, paymentsApi } from "@/lib/api";
import type { BookingResponse, RoomResponse, PaymentResponse } from "@/types";
import GuestShell from "@/components/client/GuestShell";
import RoomServicePanel from "@/components/client/RoomServicePanel";
import { roomStyleMeta } from "@/lib/roomStyle";
import { bookingStatusBadge } from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import { PageLoader } from "@/components/ui/LoadingSkeleton";

function fmt(d: string) {
  return new Date(d).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric", year: "numeric" });
}
function nights(a: string, b: string) {
  return Math.max(1, Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86_400_000));
}

function Countdown({ expiresAt }: { expiresAt: string }) {
  const [left, setLeft] = useState(() => new Date(expiresAt).getTime() - Date.now());
  useEffect(() => {
    const t = setInterval(() => setLeft(new Date(expiresAt).getTime() - Date.now()), 1000);
    return () => clearInterval(t);
  }, [expiresAt]);
  if (left <= 0) return <span className="text-rose-400">Hold expired</span>;
  const m = Math.floor(left / 60000);
  const s = Math.floor((left % 60000) / 1000);
  return <span className="tabular-nums text-amber-300">{m}:{s.toString().padStart(2, "0")}</span>;
}

function BookingDetail() {
  const { id } = useParams<{ id: string }>();

  const [booking, setBooking] = useState<BookingResponse | null>(null);
  const [room, setRoom] = useState<RoomResponse | null>(null);
  const [payment, setPayment] = useState<PaymentResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const load = useCallback(async () => {
    try {
      const b = await bookingsApi.getById(id);
      setBooking(b);
      roomsApi.getById(b.roomId).then(setRoom).catch(() => {});
      paymentsApi.getByBooking(id).then(setPayment).catch(() => {});
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Could not load booking");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const pay = async () => {
    if (!booking) return;
    setPaying(true);
    try {
      const p = await paymentsApi.initiate({ bookingId: booking.id, amount: booking.totalPrice, currency: "USD" });
      setPayment(p);
      toast.success("Payment initiated securely");
      // Reflect any server-side status change
      setTimeout(load, 1200);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Payment could not be started");
    } finally {
      setPaying(false);
    }
  };

  const cancel = async () => {
    if (!booking) return;
    setCancelling(true);
    try {
      await bookingsApi.cancel(booking.id);
      toast.success("Booking cancelled");
      setCancelOpen(false);
      load();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Could not cancel");
    } finally {
      setCancelling(false);
    }
  };

  if (loading) return <PageLoader />;
  if (!booking) {
    return (
      <div className="glass rounded-2xl py-16 text-center">
        <h3 className="text-white font-semibold">Booking not found</h3>
        <Link href="/guest/bookings" className="text-gold-300 text-sm mt-3 inline-block">← Back to bookings</Link>
      </div>
    );
  }

  const meta = room ? roomStyleMeta(room.style) : null;
  const n = nights(booking.checkIn, booking.checkOut);
  const canOrder = ["Active", "Confirmed"].includes(booking.status);
  const needsPayment = booking.status === "PendingPayment";
  const canCancel = ["PendingPayment", "Confirmed"].includes(booking.status);

  return (
    <div className="space-y-7">
      <Link href="/guest/bookings" className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition-colors">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        Back to bookings
      </Link>

      {/* Hero */}
      <div className="glass rounded-2xl overflow-hidden shadow-card">
        <div className={`relative h-40 bg-gradient-to-br ${meta?.gradient ?? "from-slate-700 via-slate-800 to-navy-900"}`}>
          <div className="absolute inset-0 bg-dot-grid opacity-30" />
          <div className="absolute inset-0 bg-gradient-to-t from-navy-900/80 to-transparent" />
          <div className="absolute left-6 bottom-4">
            <div className="flex items-center gap-3 mb-1">
              <span className="text-[11px] uppercase tracking-[0.2em] text-gold-300/90 font-semibold">
                {meta?.label ?? "Room"}
              </span>
              {bookingStatusBadge(booking.status)}
            </div>
            <h1 className="font-display text-4xl text-white leading-none">Room {booking.roomNumber}</h1>
          </div>
        </div>

        <div className="p-6 grid sm:grid-cols-3 gap-5">
          <Detail label="Check-in" value={fmt(booking.checkIn)} />
          <Detail label="Check-out" value={fmt(booking.checkOut)} />
          <Detail label="Nights" value={`${n}`} />
          {room && <Detail label="Guests" value={`Up to ${room.capacity}`} />}
          {room && <Detail label="Floor" value={`${room.floor}`} />}
          <Detail label="Total" value={`$${booking.totalPrice.toFixed(2)}`} highlight />
        </div>
      </div>

      {/* Payment panel */}
      {needsPayment && (
        <div className="glass rounded-2xl p-6 ring-1 ring-inset ring-amber-500/20">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-white font-semibold">Complete your payment</h2>
              <p className="text-slate-400 text-sm mt-1">
                Room held for <Countdown expiresAt={booking.expiresAt} /> — pay now to confirm your stay.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-2xl font-semibold text-white tabular-nums">${booking.totalPrice.toFixed(2)}</span>
              <Button onClick={pay} loading={paying}>Pay securely</Button>
            </div>
          </div>
          {payment && (
            <p className="text-xs text-slate-500 mt-4">
              Payment status: <span className="text-slate-300">{payment.status}</span>
              {payment.gatewayRef ? ` · Ref ${payment.gatewayRef}` : ""}
            </p>
          )}
        </div>
      )}

      {/* Room service */}
      {canOrder ? (
        <div className="glass rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-5">
            <span className="grid place-items-center w-9 h-9 rounded-xl bg-gold-500/10 text-gold-300">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2 4h12" />
              </svg>
            </span>
            <div>
              <h2 className="text-white font-semibold">Room Service</h2>
              <p className="text-slate-400 text-xs">Order to Room {booking.roomNumber} — tracked live.</p>
            </div>
          </div>
          <RoomServicePanel bookingId={booking.id} roomId={booking.roomId} />
        </div>
      ) : (
        <div className="glass rounded-2xl p-6 text-center">
          <p className="text-slate-400 text-sm">
            Room service becomes available once your booking is confirmed.
          </p>
        </div>
      )}

      {/* Actions */}
      {canCancel && (
        <div className="flex justify-end">
          <Button variant="ghost" onClick={() => setCancelOpen(true)} className="text-rose-400 hover:text-rose-300">
            Cancel booking
          </Button>
        </div>
      )}

      <Modal open={cancelOpen} onClose={() => setCancelOpen(false)} title="Cancel booking?">
        <p className="text-slate-300 text-sm">
          This will release Room {booking.roomNumber} for {fmt(booking.checkIn)}. This cannot be undone.
        </p>
        <div className="flex gap-3 justify-end mt-6">
          <Button variant="ghost" onClick={() => setCancelOpen(false)}>Keep booking</Button>
          <Button variant="danger" onClick={cancel} loading={cancelling}>Cancel booking</Button>
        </div>
      </Modal>
    </div>
  );
}

function Detail({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div>
      <p className="text-[11px] text-slate-500 uppercase tracking-[0.12em] font-semibold">{label}</p>
      <p className={`mt-1 ${highlight ? "text-gold-300 text-xl font-semibold" : "text-white"}`}>{value}</p>
    </div>
  );
}

export default function BookingDetailPage() {
  return (
    <GuestShell>
      <BookingDetail />
    </GuestShell>
  );
}
