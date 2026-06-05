"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuthStore } from "@/store/authStore";
import { bookingsApi } from "@/lib/api";
import type { BookingResponse } from "@/types";
import GuestShell from "@/components/client/GuestShell";
import GuestBookingCard from "@/components/client/GuestBookingCard";
import { StatCard } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { PageLoader } from "@/components/ui/LoadingSkeleton";

function GuestHome() {
  const user = useAuthStore((s) => s.user);
  const [bookings, setBookings] = useState<BookingResponse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    bookingsApi
      .getByGuest(user.id)
      .then(setBookings)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user]);

  if (loading) return <PageLoader />;

  const now = Date.now();
  const active = bookings.filter((b) => b.status === "Active");
  const upcoming = bookings
    .filter((b) => ["Confirmed", "PendingPayment"].includes(b.status) && new Date(b.checkIn).getTime() >= now)
    .sort((a, b) => new Date(a.checkIn).getTime() - new Date(b.checkIn).getTime());
  const needsPayment = bookings.filter((b) => b.status === "PendingPayment");
  const recent = [...bookings]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 4);

  const firstName = user?.email?.split("@")[0] ?? "Guest";

  return (
    <div className="space-y-8">
      {/* Greeting */}
      <div>
        <p className="eyebrow mb-2">Welcome back</p>
        <h1 className="font-display text-4xl text-white capitalize">Hello, {firstName}</h1>
        <p className="text-slate-400 mt-1.5">Here&apos;s everything happening with your stays.</p>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Active stay" value={active.length} color="green" />
        <StatCard label="Upcoming" value={upcoming.length} color="blue" />
        <StatCard label="Awaiting payment" value={needsPayment.length} color="gold" />
        <StatCard label="Total bookings" value={bookings.length} color="gold" />
      </div>

      {/* Payment reminder */}
      {needsPayment.length > 0 && (
        <div className="glass rounded-2xl p-5 flex flex-wrap items-center justify-between gap-4 ring-1 ring-inset ring-amber-500/20">
          <div className="flex items-center gap-3">
            <span className="grid place-items-center w-10 h-10 rounded-xl bg-amber-500/15 text-amber-300">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.7}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M10.3 3.9l-8 14A2 2 0 004 21h16a2 2 0 001.7-3l-8-14a2 2 0 00-3.4 0z" />
              </svg>
            </span>
            <div>
              <p className="text-white font-medium text-sm">
                {needsPayment.length} booking{needsPayment.length > 1 ? "s" : ""} awaiting payment
              </p>
              <p className="text-slate-400 text-xs">Complete payment before the hold expires.</p>
            </div>
          </div>
          <Link href={`/guest/bookings/${needsPayment[0].id}`}>
            <Button size="sm">Pay now</Button>
          </Link>
        </div>
      )}

      {/* Active / upcoming */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">Your stays</h2>
          <Link href="/guest/bookings" className="text-sm text-gold-300 hover:text-gold-200 transition-colors">
            View all
          </Link>
        </div>

        {bookings.length === 0 ? (
          <div className="glass rounded-2xl py-16 text-center">
            <div className="grid place-items-center w-14 h-14 mx-auto rounded-2xl bg-white/[0.04] text-slate-500 mb-4">
              <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.4}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3M3 11h18M5 5h14a2 2 0 012 2v12a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2z" />
              </svg>
            </div>
            <h3 className="text-white font-semibold">No bookings yet</h3>
            <p className="text-slate-400 text-sm mt-1.5 mb-5">Discover our rooms and book your first stay.</p>
            <Link href="/rooms"><Button>Browse rooms</Button></Link>
          </div>
        ) : (
          <div className="grid gap-4">
            {[...active, ...upcoming].slice(0, 3).map((b) => (
              <GuestBookingCard key={b.id} booking={b} />
            ))}
            {active.length === 0 && upcoming.length === 0 &&
              recent.slice(0, 3).map((b) => <GuestBookingCard key={b.id} booking={b} />)}
          </div>
        )}
      </div>
    </div>
  );
}

export default function GuestOverviewPage() {
  return (
    <GuestShell>
      <GuestHome />
    </GuestShell>
  );
}
