"use client";
import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import toast from "react-hot-toast";
import { authApi } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import AuthShell from "@/components/client/AuthShell";

function RegisterInner() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || "/guest";
  const setUser = useAuthStore((s) => s.setUser);

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    confirm: "",
  });
  const [loading, setLoading] = useState(false);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    if (form.password !== form.confirm) {
      toast.error("Passwords do not match");
      return;
    }
    setLoading(true);
    try {
      await authApi.registerClient({
        email: form.email.trim().toLowerCase(),
        password: form.password,
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        phone: form.phone.trim(),
      });
      // Immediately sign in to obtain a token
      const user = await authApi.login({ email: form.email.trim().toLowerCase(), password: form.password });
      setUser(user);
      toast.success("Account created — welcome to GrandStay");
      router.push(next);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Create your account"
      subtitle="It only takes a moment."
      headline={<>Welcome to<br /><span className="text-gradient-gold italic">GrandStay.</span></>}
      blurb="Create an account to book rooms, order room service, and keep every reservation in one place."
    >
      <form onSubmit={submit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label>First name</label>
            <input value={form.firstName} onChange={set("firstName")} placeholder="Jane" required />
          </div>
          <div>
            <label>Last name</label>
            <input value={form.lastName} onChange={set("lastName")} placeholder="Smith" required />
          </div>
        </div>
        <div>
          <label>Email</label>
          <input type="email" value={form.email} onChange={set("email")} placeholder="you@example.com" autoComplete="email" required />
        </div>
        <div>
          <label>Phone</label>
          <input value={form.phone} onChange={set("phone")} placeholder="+1 555 0100" required />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label>Password</label>
            <input type="password" value={form.password} onChange={set("password")} placeholder="••••••••" minLength={8} required />
          </div>
          <div>
            <label>Confirm</label>
            <input type="password" value={form.confirm} onChange={set("confirm")} placeholder="••••••••" minLength={8} required />
          </div>
        </div>
        <button type="submit" disabled={loading}
          className="w-full bg-gold-sheen text-navy-950 font-semibold text-sm py-3.5 rounded-xl shadow-gold hover:brightness-105 disabled:opacity-50 transition-all flex items-center justify-center gap-2 mt-2">
          {loading ? (
            <>
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              Creating account…
            </>
          ) : "Create account"}
        </button>
      </form>

      <p className="text-sm text-slate-400 text-center mt-7">
        Already have an account?{" "}
        <Link href={`/guest/login?next=${encodeURIComponent(next)}`} className="text-gold-300 hover:text-gold-200 transition-colors">
          Sign in
        </Link>
      </p>
    </AuthShell>
  );
}

export default function GuestRegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-ink-radial" />}>
      <RegisterInner />
    </Suspense>
  );
}
