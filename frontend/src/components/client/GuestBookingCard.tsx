"use client";
import Link from "next/link";
import type { BookingResponse } from "@/types";
import { bookingStatusBadge } from "@/components/ui/Badge";

function fmt(d: string) {
  return new Date(d).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function nights(a: string, b: string) {
  return Math.max(1, Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86_400_000));
}

export default function GuestBookingCard({ booking }: { booking: BookingResponse }) {
  const n = nights(booking.checkIn, booking.checkOut);
  return (
    <Link
      href={`/guest/bookings/${booking.id}`}
      className="group glass rounded-2xl p-5 shadow-card hover:border-white/15 hover:-translate-y-0.5 transition-all duration-300 flex items-center gap-5"
    >
      <div className="grid place-items-center w-16 h-16 rounded-xl bg-gold-500/10 text-gold-300 shrink-0">
        <span className="font-display text-2xl">{booking.roomNumber}</span>
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <h3 className="text-white font-semibold">Room {booking.roomNumber}</h3>
          {bookingStatusBadge(booking.status)}
        </div>
        <p className="text-sm text-slate-400 mt-1">
          {fmt(booking.checkIn)} → {fmt(booking.checkOut)} · {n} {n === 1 ? "night" : "nights"}
        </p>
      </div>
      <div className="text-right shrink-0">
        <p className="text-lg font-semibold text-white tabular-nums">${booking.totalPrice.toFixed(0)}</p>
        <span className="text-xs text-gold-300 inline-flex items-center gap-1 group-hover:gap-2 transition-all">
          Details
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </span>
      </div>
    </Link>
  );
}
