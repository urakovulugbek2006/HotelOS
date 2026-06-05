"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuthStore } from "@/store/authStore";
import SiteHeader from "@/components/client/SiteHeader";
import SiteFooter from "@/components/client/SiteFooter";
import { PageLoader } from "@/components/ui/LoadingSkeleton";

const TABS = [
  { href: "/guest", label: "Overview" },
  { href: "/guest/bookings", label: "My Bookings" },
  { href: "/rooms", label: "Book Again" },
];

export default function GuestShell({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();

  const ok = !isLoading && user?.role === "Client";
  const redirect = !isLoading && !ok;

  useEffect(() => {
    if (redirect) router.push(`/guest/login?next=${encodeURIComponent(pathname)}`);
  }, [redirect, router, pathname]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-ink-radial grid place-items-center">
        <PageLoader />
      </div>
    );
  }
  if (!ok) return null;

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />

      <div className="pt-24 sm:pt-28 flex-1">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 w-full">
          {/* Secondary tab nav */}
          <div className="flex items-center gap-1 mb-8 overflow-x-auto scrollbar-hide">
            {TABS.map((t) => {
              const active = t.href === "/guest" ? pathname === t.href : pathname.startsWith(t.href);
              return (
                <Link
                  key={t.href}
                  href={t.href}
                  className={`px-4 py-2 text-sm rounded-full whitespace-nowrap transition-colors ${
                    active
                      ? "bg-gold-sheen text-navy-950 font-semibold"
                      : "text-slate-300 hover:text-white hover:bg-white/[0.05]"
                  }`}
                >
                  {t.label}
                </Link>
              );
            })}
          </div>

          <div className="animate-fade-in">{children}</div>
        </div>
      </div>

      <SiteFooter />
    </div>
  );
}
