"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useAuthStore } from "@/store/authStore";
import { bookingsApi } from "@/lib/api";
import type { BookingResponse, BookingStatus } from "@/types";
import GuestShell from "@/components/client/GuestShell";
import GuestBookingCard from "@/components/client/GuestBookingCard";
import Button from "@/components/ui/Button";
import { PageLoader } from "@/components/ui/LoadingSkeleton";

const FILTERS: { value: BookingStatus | ""; label: string }[] = [
  { value: "", label: "All" },
  { value: "Active", label: "Active" },
  { value: "Confirmed", label: "Upcoming" },
  { value: "PendingPayment", label: "Awaiting payment" },
  { value: "Completed", label: "Past" },
  { value: "Cancelled", label: "Cancelled" },
];

function BookingsList() {
  const user = useAuthStore((s) => s.user);
  const [bookings, setBookings] = useState<BookingResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<BookingStatus | "">("");

  useEffect(() => {
    if (!user) return;
    bookingsApi.getByGuest(user.id).then(setBookings).catch(() => {}).finally(() => setLoading(false));
  }, [user]);

  const shown = useMemo(() => {
    const list = filter ? bookings.filter((b) => b.status === filter) : bookings;
    return [...list].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [bookings, filter]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow mb-2">Reservations</p>
          <h1 className="font-display text-4xl text-white">My Bookings</h1>
        </div>
        <Link href="/rooms"><Button variant="outline">+ New booking</Button></Link>
      </div>

      <div className="flex gap-2 flex-wrap">
        {FILTERS.map((f) => (
          <button
            key={f.value || "all"}
            onClick={() => setFilter(f.value)}
            className={`px-4 py-1.5 rounded-full text-sm transition-colors ${
              filter === f.value
                ? "bg-gold-sheen text-navy-950 font-semibold"
                : "bg-white/[0.04] text-slate-300 hover:text-white hover:bg-white/[0.08]"
            }`}
          >
            {f.label}
            <span className="ml-1.5 opacity-70">
              {f.value ? bookings.filter((b) => b.status === f.value).length : bookings.length}
            </span>
          </button>
        ))}
      </div>

      {loading ? (
        <PageLoader />
      ) : shown.length === 0 ? (
        <div className="glass rounded-2xl py-16 text-center">
          <h3 className="text-white font-semibold">Nothing here yet</h3>
          <p className="text-slate-400 text-sm mt-1.5 mb-5">No bookings match this filter.</p>
          <Link href="/rooms"><Button>Browse rooms</Button></Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {shown.map((b) => (
            <GuestBookingCard key={b.id} booking={b} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function GuestBookingsPage() {
  return (
    <GuestShell>
      <BookingsList />
    </GuestShell>
  );
}
