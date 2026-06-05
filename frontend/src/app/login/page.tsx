"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { authApi } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";

const ROLE_DESTINATIONS: Record<string, string> = {
  Receptionist: "/reception",
  Manager: "/manager",
  CleaningStaff: "/housekeeping",
  MaintenanceStaff: "/maintenance",
  KitchenStaff: "/kitchen",
  Server: "/kitchen",
};

export default function LoginPage() {
  const router = useRouter();
  const setUser = useAuthStore((s) => s.setUser);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await authApi.login({ email, password });
      if (user.role === "Client") {
        setUser(user);
        toast.success("Welcome back");
        router.push("/guest");
        return;
      }
      setUser(user);
      toast.success(`Welcome, ${user.role}`);
      router.push(ROLE_DESTINATIONS[user.role] ?? "/manager");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* ── Left brand panel ─────────────────────────────────────────── */}
      <div className="hidden lg:flex lg:w-1/2 relative flex-col justify-between p-14 overflow-hidden">
        <div className="absolute inset-0 bg-ink-radial" />
        <div className="absolute inset-0 bg-dot-grid opacity-60" />
        <div className="absolute inset-0 bg-hero-glow" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 rounded-full bg-gold-500/10 blur-3xl" />

        <Link href="/" className="relative flex items-center gap-3">
          <span className="grid place-items-center w-10 h-10 rounded-xl bg-gold-sheen text-navy-950 font-display text-2xl font-bold shadow-gold">
            G
          </span>
          <span className="font-display text-xl text-white tracking-wide">
            Grand<span className="text-gold-400">Stay</span>
          </span>
        </Link>

        <div className="relative">
          <p className="eyebrow mb-6">
            <span className="h-px w-8 bg-gold-500/50" /> Staff Portal
          </p>
          <h1 className="font-display text-5xl xl:text-6xl text-white leading-[1.05] mb-5">
            Operations,
            <br />
            <span className="text-gradient-gold italic">beautifully managed.</span>
          </h1>
          <p className="text-slate-400 text-[15px] leading-relaxed max-w-sm">
            The central command for reception, housekeeping, maintenance, kitchen,
            and management — connected in real time.
          </p>
        </div>

        <div className="relative flex flex-wrap gap-2">
          {["Reception", "Housekeeping", "Maintenance", "Kitchen", "Manager"].map((role) => (
            <span
              key={role}
              className="text-xs text-slate-400 glass rounded-full px-3.5 py-1.5"
            >
              {role}
            </span>
          ))}
        </div>
      </div>

      {/* ── Right form panel ─────────────────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-10 relative">
        <div className="absolute inset-0 lg:hidden bg-ink-radial" />
        <div className="w-full max-w-sm relative animate-fade-up">
          <div className="flex items-center gap-3 mb-10 lg:hidden">
            <span className="grid place-items-center w-9 h-9 rounded-xl bg-gold-sheen text-navy-950 font-display text-xl font-bold">
              G
            </span>
            <span className="font-display text-lg text-white tracking-wide">
              Grand<span className="text-gold-400">Stay</span>
            </span>
          </div>

          <div className="mb-9">
            <h2 className="font-display text-3xl text-white mb-1.5">Staff sign in</h2>
            <p className="text-slate-400 text-sm">Enter your credentials to access the console.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label>Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="staff@grandstay.com"
                autoComplete="email"
                required
              />
            </div>
            <div>
              <label>Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gold-sheen text-navy-950 font-semibold text-sm tracking-wide py-3.5 rounded-xl shadow-gold hover:brightness-105 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  Signing in…
                </>
              ) : (
                "Sign in"
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-white/[0.06] text-center">
            <p className="text-slate-500 text-xs mb-3">Are you a guest?</p>
            <Link
              href="/guest/login"
              className="inline-flex items-center gap-1.5 text-sm text-gold-300 hover:text-gold-200 transition-colors"
            >
              Go to the guest portal
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
