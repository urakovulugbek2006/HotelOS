"use client";
import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import toast from "react-hot-toast";
import { authApi } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import AuthShell from "@/components/client/AuthShell";

function GuestLoginInner() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || "/guest";
  const setUser = useAuthStore((s) => s.setUser);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await authApi.login({ email, password });
      if (user.role !== "Client") {
        toast.error("This is a staff account — please use the staff portal.");
        return;
      }
      setUser(user);
      toast.success("Welcome back");
      router.push(next);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell title="Sign in" subtitle="Access your bookings and room service.">
      <form onSubmit={submit} className="space-y-5">
        <div>
          <label>Email</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" required />
        </div>
        <div>
          <label>Password</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" autoComplete="current-password" required />
        </div>
        <button type="submit" disabled={loading}
          className="w-full bg-gold-sheen text-navy-950 font-semibold text-sm py-3.5 rounded-xl shadow-gold hover:brightness-105 disabled:opacity-50 transition-all flex items-center justify-center gap-2">
          {loading ? (
            <>
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              Signing in…
            </>
          ) : "Sign in"}
        </button>
      </form>

      <p className="text-sm text-slate-400 text-center mt-8">
        New to GrandStay?{" "}
        <Link href={`/guest/register?next=${encodeURIComponent(next)}`} className="text-gold-300 hover:text-gold-200 transition-colors">
          Create an account
        </Link>
      </p>
      <p className="text-xs text-slate-600 text-center mt-4">
        <Link href="/login" className="hover:text-slate-400 transition-colors">Staff member? Sign in here →</Link>
      </p>
    </AuthShell>
  );
}

export default function GuestLoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-ink-radial" />}>
      <GuestLoginInner />
    </Suspense>
  );
}
