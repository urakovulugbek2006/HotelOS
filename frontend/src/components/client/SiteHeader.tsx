"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuthStore } from "@/store/authStore";

const LINKS = [
  { href: "/", label: "Home" },
  { href: "/rooms", label: "Rooms & Suites" },
  { href: "/#amenities", label: "Amenities" },
  { href: "/#contact", label: "Contact" },
];

export default function SiteHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, clearUser } = useAuthStore();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  const isClient = user?.role === "Client";

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => { setOpen(false); }, [pathname]);

  return (
    <header
      className={`fixed top-0 inset-x-0 z-40 transition-all duration-300 ${
        scrolled ? "glass-strong border-b border-white/[0.06] py-2.5" : "py-4 bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-5 sm:px-8 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="grid place-items-center w-9 h-9 rounded-xl bg-gold-sheen text-navy-950 font-display text-xl font-bold shadow-gold">
            G
          </span>
          <span className="font-display text-xl text-white tracking-wide">
            Grand<span className="text-gold-400">Stay</span>
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="px-4 py-2 text-sm text-slate-300 hover:text-white rounded-lg hover:bg-white/[0.05] transition-colors"
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-3">
          {isClient ? (
            <>
              <Link
                href="/guest"
                className="text-sm text-slate-300 hover:text-white px-4 py-2 rounded-lg hover:bg-white/[0.05] transition-colors"
              >
                My Stay
              </Link>
              <button
                onClick={() => { clearUser(); router.push("/"); }}
                className="text-sm text-slate-400 hover:text-rose-400 transition-colors"
              >
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link
                href="/guest/login"
                className="text-sm text-slate-300 hover:text-white px-4 py-2 rounded-lg hover:bg-white/[0.05] transition-colors"
              >
                Sign in
              </Link>
              <Link
                href="/rooms"
                className="text-sm font-semibold text-navy-950 bg-gold-sheen px-5 py-2.5 rounded-xl shadow-gold hover:brightness-105 transition-all"
              >
                Book a Room
              </Link>
            </>
          )}
        </div>

        {/* Mobile toggle */}
        <button
          className="md:hidden text-slate-200 p-2 -mr-2"
          onClick={() => setOpen((o) => !o)}
          aria-label="Toggle menu"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            {open ? (
              <path strokeLinecap="round" d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden mt-2.5 mx-4 glass-strong rounded-2xl p-3 animate-fade-up">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="block px-4 py-3 text-sm text-slate-300 hover:text-white hover:bg-white/[0.05] rounded-xl transition-colors"
            >
              {l.label}
            </Link>
          ))}
          <div className="hairline my-2" />
          {isClient ? (
            <>
              <Link href="/guest" className="block px-4 py-3 text-sm text-white">My Stay</Link>
              <button
                onClick={() => { clearUser(); router.push("/"); }}
                className="block w-full text-left px-4 py-3 text-sm text-rose-400"
              >
                Sign out
              </button>
            </>
          ) : (
            <div className="flex gap-2 p-1">
              <Link href="/guest/login" className="flex-1 text-center px-4 py-2.5 text-sm text-slate-200 bg-white/[0.05] rounded-xl">
                Sign in
              </Link>
              <Link href="/rooms" className="flex-1 text-center px-4 py-2.5 text-sm font-semibold text-navy-950 bg-gold-sheen rounded-xl">
                Book
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
