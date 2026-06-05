"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import SiteHeader from "@/components/client/SiteHeader";
import SiteFooter from "@/components/client/SiteFooter";
import { ROOM_STYLES } from "@/lib/roomStyle";

const AMENITIES = [
  { title: "Fine Dining", desc: "A seasonal restaurant and 24-hour in-room service.", d: "M3 3h18M4 3v8a4 4 0 004 4h0a4 4 0 004-4V3M16 3v18M20 3v7a3 3 0 01-3 3" },
  { title: "Wellness Spa", desc: "Heated pool, sauna, and treatment rooms.", d: "M12 2v6m0 0a4 4 0 100 8 4 4 0 000-8zM5 20c2-2 12-2 14 0" },
  { title: "Fast Wi-Fi", desc: "Complimentary high-speed internet throughout.", d: "M5 12.5a10 10 0 0114 0M8.5 16a5 5 0 017 0M12 19.5h.01" },
  { title: "24/7 Concierge", desc: "Real-time requests answered the moment you ask.", d: "M18 8a6 6 0 00-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 01-3.4 0" },
  { title: "Valet Parking", desc: "Secure on-site parking with valet service.", d: "M9 17a2 2 0 11-4 0 2 2 0 014 0zm10 0a2 2 0 11-4 0 2 2 0 014 0zM5 17H3v-6l2-5h11l4 5v6h-2M5 11h14" },
  { title: "Live Room Service", desc: "Order from your room and track it in real time.", d: "M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2 4h12" },
];

const STATS = [
  { value: "120", label: "Elegant rooms" },
  { value: "6", label: "Floors" },
  { value: "4.8", label: "Guest rating" },
  { value: "24/7", label: "Concierge" },
];

export default function LandingPage() {
  const router = useRouter();
  const today = new Date().toISOString().split("T")[0];
  const tomorrow = new Date(Date.now() + 86_400_000).toISOString().split("T")[0];

  const [checkIn, setCheckIn] = useState(today);
  const [checkOut, setCheckOut] = useState(tomorrow);
  const [style, setStyle] = useState("");

  const search = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams({ checkIn, checkOut });
    if (style) params.set("style", style);
    router.push(`/rooms?${params.toString()}`);
  };

  return (
    <div className="min-h-screen">
      <SiteHeader />

      {/* ── Hero ───────────────────────────────────────────────────── */}
      <section className="relative min-h-[100svh] flex items-center overflow-hidden">
        <div className="absolute inset-0 bg-ink-radial" />
        <div className="absolute inset-0 bg-dot-grid opacity-50" />
        <div className="absolute inset-0 bg-hero-glow" />
        <div className="absolute -top-32 right-0 w-[40rem] h-[40rem] rounded-full bg-gold-500/10 blur-3xl" />

        <div className="relative max-w-7xl mx-auto px-5 sm:px-8 pt-32 pb-16 w-full">
          <div className="max-w-3xl animate-fade-up">
            <p className="eyebrow mb-6">
              <span className="h-px w-8 bg-gold-500/50" /> Four-Star Riverside Hotel
            </p>
            <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl text-white leading-[1.02]">
              Stay where every
              <br />
              detail is <span className="text-gradient-gold italic">connected.</span>
            </h1>
            <p className="text-slate-300/90 text-lg mt-6 max-w-xl leading-relaxed">
              Reserve a room in seconds, order room service from your bed, and
              breeze through checkout — all in one beautifully simple experience.
            </p>
          </div>

          {/* Availability search */}
          <form
            onSubmit={search}
            className="relative mt-10 glass-strong rounded-2xl p-3 sm:p-4 shadow-glow max-w-3xl grid grid-cols-1 sm:grid-cols-[1fr_1fr_1fr_auto] gap-3 animate-fade-up animate-delay-100"
          >
            <div>
              <label>Check-in</label>
              <input type="date" min={today} value={checkIn}
                onChange={(e) => setCheckIn(e.target.value)} />
            </div>
            <div>
              <label>Check-out</label>
              <input type="date" min={checkIn} value={checkOut}
                onChange={(e) => setCheckOut(e.target.value)} />
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
              <button
                type="submit"
                className="w-full sm:w-auto h-[46px] px-7 bg-gold-sheen text-navy-950 font-semibold rounded-xl shadow-gold hover:brightness-105 transition-all"
              >
                Search
              </button>
            </div>
          </form>

          {/* Stats */}
          <div className="relative mt-14 grid grid-cols-2 sm:grid-cols-4 gap-6 max-w-3xl animate-fade-up animate-delay-200">
            {STATS.map((s) => (
              <div key={s.label}>
                <p className="font-display text-4xl text-gradient-gold">{s.value}</p>
                <p className="text-sm text-slate-400 mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Featured room styles ───────────────────────────────────── */}
      <section className="relative max-w-7xl mx-auto px-5 sm:px-8 py-20">
        <div className="flex items-end justify-between gap-6 mb-10">
          <div>
            <p className="eyebrow mb-3">Accommodation</p>
            <h2 className="font-display text-4xl text-white">Rooms &amp; Suites</h2>
          </div>
          <Link href="/rooms" className="hidden sm:inline-flex items-center gap-1.5 text-sm text-gold-300 hover:text-gold-200 transition-colors">
            View all availability
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {ROOM_STYLES.map((s, i) => (
            <Link
              key={s.value}
              href={`/rooms?style=${s.value}`}
              className="group glass rounded-2xl overflow-hidden shadow-card hover:border-white/15 hover:-translate-y-1 transition-all duration-300 animate-fade-up"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <div className={`relative h-40 bg-gradient-to-br ${
                ["from-slate-700 via-slate-800 to-navy-900",
                 "from-amber-700/70 via-navy-800 to-navy-900",
                 "from-emerald-700/70 via-navy-800 to-navy-900",
                 "from-indigo-700/70 via-navy-800 to-navy-900"][i]
              }`}>
                <div className="absolute inset-0 bg-dot-grid opacity-30" />
                <div className="absolute inset-0 bg-gradient-to-t from-navy-900/70 to-transparent" />
              </div>
              <div className="p-5">
                <h3 className="font-display text-xl text-white">{s.label}</h3>
                <p className="text-sm text-slate-400 mt-1.5 flex items-center gap-1.5 group-hover:text-gold-300 transition-colors">
                  Explore
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ── Amenities ──────────────────────────────────────────────── */}
      <section id="amenities" className="relative max-w-7xl mx-auto px-5 sm:px-8 py-20">
        <div className="text-center mb-12">
          <p className="eyebrow justify-center mb-3">The Experience</p>
          <h2 className="font-display text-4xl text-white">Everything, taken care of</h2>
          <p className="text-slate-400 mt-3 max-w-xl mx-auto">
            From arrival to departure, GrandStay anticipates what you need — and
            our connected platform makes it effortless.
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {AMENITIES.map((a) => (
            <div key={a.title} className="glass rounded-2xl p-6 shadow-card hover:border-white/15 transition-all duration-300">
              <span className="grid place-items-center w-12 h-12 rounded-xl bg-gold-500/10 text-gold-300 mb-4">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d={a.d} />
                </svg>
              </span>
              <h3 className="text-white font-semibold text-lg">{a.title}</h3>
              <p className="text-sm text-slate-400 mt-1.5 leading-relaxed">{a.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA band ───────────────────────────────────────────────── */}
      <section className="relative max-w-7xl mx-auto px-5 sm:px-8 py-10">
        <div className="relative overflow-hidden glass-strong rounded-3xl p-10 sm:p-14 text-center shadow-glow">
          <div className="absolute inset-0 bg-hero-glow" />
          <div className="absolute -bottom-20 -right-10 w-72 h-72 rounded-full bg-gold-500/10 blur-3xl" />
          <p className="eyebrow justify-center mb-4">Reserve your stay</p>
          <h2 className="relative font-display text-4xl sm:text-5xl text-white max-w-2xl mx-auto leading-tight">
            Your room is ready when you are.
          </h2>
          <p className="relative text-slate-300 mt-4 max-w-lg mx-auto">
            Check live availability and book in under a minute.
          </p>
          <div className="relative mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link href="/rooms" className="px-7 py-3.5 bg-gold-sheen text-navy-950 font-semibold rounded-xl shadow-gold hover:brightness-105 transition-all">
              Browse Rooms
            </Link>
            <Link href="/guest/register" className="px-7 py-3.5 text-slate-200 border border-white/15 rounded-xl hover:bg-white/[0.05] transition-colors">
              Create an account
            </Link>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
