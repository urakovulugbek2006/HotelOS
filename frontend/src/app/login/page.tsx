"use client";
import { useState } from "react";
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
        toast.error("Guest accounts are not permitted here.");
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
    <div className="min-h-screen bg-navy-900 flex">
      {/* Left panel — branding */}
      <div className="hidden lg:flex lg:w-1/2 relative flex-col justify-between p-12 overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-navy-800 via-navy-900 to-navy-900" />
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(245,158,11,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(245,158,11,0.8) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />
        <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-navy-900/80 to-transparent" />

        {/* Logo */}
        <div className="relative flex items-center gap-3">
          <div className="w-9 h-9 rounded bg-gold-500 flex items-center justify-center shrink-0">
            <span className="text-navy-900 font-bold text-base">H</span>
          </div>
          <span className="text-white font-semibold tracking-widest text-sm uppercase">
            Hotel<span className="text-gold-500">OS</span>
          </span>
        </div>

        {/* Center content */}
        <div className="relative">
          <div className="flex items-center gap-3 mb-8">
            <span className="h-px w-10 bg-gold-500/40" />
            <span className="text-gold-500/70 text-xs tracking-[0.3em] uppercase">Staff Portal</span>
          </div>
          <h1 className="text-4xl font-light text-white leading-snug mb-4">
            Operations,<br />
            <span className="text-gold-400">managed.</span>
          </h1>
          <p className="text-slate-500 text-sm leading-relaxed max-w-xs font-light">
            The central hub for reception, housekeeping, maintenance, kitchen, and management teams.
          </p>
        </div>

        {/* Role tags */}
        <div className="relative flex flex-wrap gap-2">
          {["Reception", "Housekeeping", "Maintenance", "Kitchen", "Manager"].map((role) => (
            <span
              key={role}
              className="text-xs text-slate-600 border border-slate-700/60 rounded-full px-3 py-1"
            >
              {role}
            </span>
          ))}
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="flex items-center gap-3 mb-10 lg:hidden">
            <div className="w-8 h-8 rounded bg-gold-500 flex items-center justify-center">
              <span className="text-navy-900 font-bold text-sm">H</span>
            </div>
            <span className="text-white font-semibold tracking-widest text-sm uppercase">
              Hotel<span className="text-gold-500">OS</span>
            </span>
          </div>

          <div className="mb-10">
            <h2 className="text-2xl font-semibold text-white mb-1">Staff sign in</h2>
            <p className="text-slate-500 text-sm">Enter your credentials to access the dashboard.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs text-slate-400 tracking-widest uppercase mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="staff@hotel.com"
                autoComplete="email"
                required
                className="w-full bg-navy-800 border border-navy-600 hover:border-navy-500 focus:border-gold-500 text-white text-sm rounded-lg px-4 py-3 placeholder-slate-600 outline-none transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs text-slate-400 tracking-widest uppercase mb-2">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                required
                className="w-full bg-navy-800 border border-navy-600 hover:border-navy-500 focus:border-gold-500 text-white text-sm rounded-lg px-4 py-3 placeholder-slate-600 outline-none transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gold-500 hover:bg-gold-400 disabled:opacity-50 disabled:cursor-not-allowed text-navy-900 font-bold text-sm tracking-widest uppercase py-3.5 rounded-lg transition-colors flex items-center justify-center gap-2 mt-2"
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

          <p className="text-slate-600 text-xs text-center mt-8">
            Staff accounts are managed by the hotel manager.
          </p>
        </div>
      </div>
    </div>
  );
}
