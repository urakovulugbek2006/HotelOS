"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { useEffect, useState } from "react";
import type { Role } from "@/types";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import { authApi } from "@/lib/api";
import toast from "react-hot-toast";

interface NavItem {
  href: string;
  label: string;
}

interface Props {
  title: string;
  navItems: NavItem[];
  allowedRoles: Role[];
  children: React.ReactNode;
}

/* Minimal inline icon set keyed by nav label — keeps the NavItem API unchanged */
function NavIcon({ label }: { label: string }) {
  const k = label.toLowerCase();
  const p = (d: string) => (
    <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.7}>
      <path strokeLinecap="round" strokeLinejoin="round" d={d} />
    </svg>
  );
  if (k.includes("overview") || k.includes("dashboard")) return p("M3 12l9-9 9 9M5 10v10h14V10");
  if (k.includes("staff")) return p("M17 20h5v-1a4 4 0 00-4-4M9 20H4v-1a4 4 0 014-4h2m4-4a4 4 0 11-8 0 4 4 0 018 0zm6 0a3 3 0 11-6 0 3 3 0 016 0z");
  if (k.includes("client") || k.includes("guest")) return p("M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z");
  if (k.includes("room")) return p("M3 21h18M5 21V5a2 2 0 012-2h10a2 2 0 012 2v16M9 9h.01M9 13h.01");
  if (k.includes("booking")) return p("M8 7V3m8 4V3M3 11h18M5 5h14a2 2 0 012 2v12a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2z");
  if (k.includes("payment")) return p("M3 10h18M3 7a2 2 0 012-2h14a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V7z");
  if (k.includes("menu")) return p("M4 6h16M4 12h16M4 18h10");
  if (k.includes("order") || k.includes("kitchen")) return p("M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.3 4.6A1 1 0 005.6 19H17M9 22a1 1 0 100-2 1 1 0 000 2zm8 0a1 1 0 100-2 1 1 0 000 2z");
  if (k.includes("clean") || k.includes("housekeep")) return p("M19 11l-7 7-4-4M3 3l6 6");
  if (k.includes("maintenance") || k.includes("ticket")) return p("M11 4a4 4 0 014 4 4 4 0 01-.5 2l5 5-2 2-5-5a4 4 0 01-6-4 4 4 0 014-4z");
  return p("M9 5l7 7-7 7");
}

export default function DashboardLayout({ title, navItems, allowedRoles, children }: Props) {
  const { user, isLoading, clearUser } = useAuthStore();
  const pathname = usePathname();
  const router = useRouter();

  const isAllowed = !isLoading && !!user && allowedRoles.includes(user.role as Role);
  const needsRedirect = !isLoading && !isAllowed;

  useEffect(() => {
    if (needsRedirect) router.push("/login");
  }, [needsRedirect, router]);

  const [mobileOpen, setMobileOpen] = useState(false);
  const [showChangePw, setShowChangePw] = useState(false);
  const [changePwForm, setChangePwForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [changePwLoading, setChangePwLoading] = useState(false);

  useEffect(() => { setMobileOpen(false); }, [pathname]);

  if (isLoading || !user) return null;

  const logout = () => { clearUser(); router.push("/login"); };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (changePwForm.newPassword !== changePwForm.confirmPassword) {
      toast.error("New passwords do not match"); return;
    }
    if (changePwForm.newPassword.length < 8) {
      toast.error("Password must be at least 8 characters"); return;
    }
    setChangePwLoading(true);
    try {
      await authApi.changePassword(user.id, changePwForm.currentPassword, changePwForm.newPassword);
      toast.success("Password changed successfully");
      setShowChangePw(false);
      setChangePwForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to change password");
    } finally {
      setChangePwLoading(false);
    }
  };

  const SidebarInner = (
    <>
      <div className="px-6 py-6">
        <Link href="/" className="flex items-center gap-2.5 group">
          <span className="grid place-items-center w-9 h-9 rounded-xl bg-gold-sheen text-navy-950 font-display text-xl font-bold shadow-gold">
            G
          </span>
          <span className="leading-tight">
            <span className="block font-display text-lg text-white tracking-wide">
              Grand<span className="text-gold-400">Stay</span>
            </span>
            <span className="block text-[10px] text-slate-500 font-semibold uppercase tracking-[0.25em]">
              {title}
            </span>
          </span>
        </Link>
      </div>

      <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`relative flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm transition-all duration-200 ${
                active
                  ? "bg-white/[0.06] text-white"
                  : "text-slate-400 hover:text-white hover:bg-white/[0.03]"
              }`}
            >
              {active && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-[3px] rounded-full bg-gold-sheen" />
              )}
              <span className={active ? "text-gold-400" : "text-slate-500"}>
                <NavIcon label={item.label} />
              </span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="px-4 py-4 mt-2 mx-3 mb-3 rounded-xl bg-white/[0.03] border border-white/[0.05]">
        <div className="flex items-center gap-3">
          <span className="grid place-items-center w-9 h-9 rounded-full bg-navy-700 text-gold-300 text-sm font-semibold uppercase">
            {user.email.charAt(0)}
          </span>
          <div className="min-w-0">
            <div className="text-xs text-slate-300 truncate">{user.email}</div>
            <div className="text-[11px] text-gold-400 font-medium">{user.role}</div>
          </div>
        </div>
        <div className="flex gap-4 mt-3 pt-3 border-t border-white/[0.05]">
          <button onClick={() => setShowChangePw(true)} className="text-[11px] text-slate-500 hover:text-slate-200 transition-colors">
            Password
          </button>
          <button onClick={logout} className="text-[11px] text-slate-500 hover:text-rose-400 transition-colors">
            Sign out
          </button>
        </div>
      </div>
    </>
  );

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-64 shrink-0 flex-col glass border-r border-white/[0.06]">
        {SidebarInner}
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-40">
          <div className="absolute inset-0 bg-navy-950/70 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 top-0 h-full w-64 flex flex-col glass-strong border-r border-white/[0.08] animate-fade-up">
            {SidebarInner}
          </aside>
        </div>
      )}

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="md:hidden flex items-center justify-between px-4 h-14 glass border-b border-white/[0.06]">
          <button onClick={() => setMobileOpen(true)} className="text-slate-300 p-2 -ml-2" aria-label="Open menu">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <span className="font-display text-white">Grand<span className="text-gold-400">Stay</span></span>
          <span className="w-8" />
        </header>

        <main className="flex-1 overflow-y-auto">
          <div className="p-5 sm:p-8 max-w-screen-2xl mx-auto w-full animate-fade-in">{children}</div>
        </main>
      </div>

      <Modal open={showChangePw} onClose={() => setShowChangePw(false)} title="Change Password">
        <form onSubmit={handleChangePassword} className="space-y-4">
          <div>
            <label>Current Password</label>
            <input type="password" value={changePwForm.currentPassword}
              onChange={(e) => setChangePwForm((f) => ({ ...f, currentPassword: e.target.value }))} required />
          </div>
          <div>
            <label>New Password</label>
            <input type="password" value={changePwForm.newPassword}
              onChange={(e) => setChangePwForm((f) => ({ ...f, newPassword: e.target.value }))} minLength={8} required />
          </div>
          <div>
            <label>Confirm New Password</label>
            <input type="password" value={changePwForm.confirmPassword}
              onChange={(e) => setChangePwForm((f) => ({ ...f, confirmPassword: e.target.value }))} minLength={8} required />
          </div>
          <div className="flex gap-3 justify-end">
            <Button variant="ghost" type="button" onClick={() => setShowChangePw(false)}>Cancel</Button>
            <Button type="submit" loading={changePwLoading}>Change Password</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
