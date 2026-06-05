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

export default function DashboardLayout({
  title,
  navItems,
  allowedRoles,
  children,
}: Props) {
  const { user, isLoading, clearUser } = useAuthStore();
  const pathname = usePathname();
  const router   = useRouter();

  // Derive a primitive boolean — avoids re-running the effect on every render
  // because `allowedRoles` is a new array reference on every parent render.
  const isAllowed = !isLoading && !!user && allowedRoles.includes(user.role as Role);
  const needsRedirect = !isLoading && !isAllowed;

  useEffect(() => {
    if (needsRedirect) router.push("/login");
  }, [needsRedirect, router]);

  // Change-password modal
  const [showChangePw, setShowChangePw] = useState(false);
  const [changePwForm, setChangePwForm] = useState({
    currentPassword: "",
    newPassword:     "",
    confirmPassword: "",
  });
  const [changePwLoading, setChangePwLoading] = useState(false);

  if (isLoading || !user) return null;

  const logout = () => {
    clearUser();
    router.push("/login");
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (changePwForm.newPassword !== changePwForm.confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }
    if (changePwForm.newPassword.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    setChangePwLoading(true);
    try {
      await authApi.changePassword(
        user.id,
        changePwForm.currentPassword,
        changePwForm.newPassword
      );
      toast.success("Password changed successfully");
      setShowChangePw(false);
      setChangePwForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to change password");
    } finally {
      setChangePwLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-navy-900 overflow-hidden">
      <aside className="w-56 shrink-0 bg-navy-800 border-r border-navy-700 flex flex-col">
        <div className="px-5 py-5 border-b border-navy-700">
          <Link href="/" className="text-gold-500 font-bold text-lg tracking-tight">
            Grand<span className="text-white">Stay</span>
          </Link>
          <p className="text-xs text-slate-500 mt-0.5 font-medium uppercase tracking-wider">{title}</p>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {navItems.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center px-3 py-2.5 rounded-md text-sm transition-colors ${
                  active
                    ? "bg-navy-700 text-white font-medium"
                    : "text-slate-400 hover:text-slate-200 hover:bg-navy-700/50"
                }`}
              >
                <span
                  className={`w-1 h-1 rounded-full mr-2.5 shrink-0 ${
                    active ? "bg-gold-500" : ""
                  }`}
                />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="px-4 py-4 border-t border-navy-700 space-y-2">
          <div>
            <div className="text-xs text-slate-400 truncate">{user.email}</div>
            <div className="text-xs text-gold-500 mt-0.5">{user.role}</div>
          </div>
          <button
            onClick={() => setShowChangePw(true)}
            className="text-xs text-slate-500 hover:text-slate-300 transition-colors block"
          >
            Change password
          </button>
          <button
            onClick={logout}
            className="text-xs text-slate-500 hover:text-red-400 transition-colors block"
          >
            Sign out
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto">
        <div className="p-6 max-w-screen-xl">{children}</div>
      </main>

      <Modal open={showChangePw} onClose={() => setShowChangePw(false)} title="Change Password">
        <form onSubmit={handleChangePassword} className="space-y-4">
          <div>
            <label>Current Password</label>
            <input
              type="password"
              value={changePwForm.currentPassword}
              onChange={(e) => setChangePwForm((f) => ({ ...f, currentPassword: e.target.value }))}
              required
            />
          </div>
          <div>
            <label>New Password</label>
            <input
              type="password"
              value={changePwForm.newPassword}
              onChange={(e) => setChangePwForm((f) => ({ ...f, newPassword: e.target.value }))}
              minLength={8}
              required
            />
          </div>
          <div>
            <label>Confirm New Password</label>
            <input
              type="password"
              value={changePwForm.confirmPassword}
              onChange={(e) => setChangePwForm((f) => ({ ...f, confirmPassword: e.target.value }))}
              minLength={8}
              required
            />
          </div>
          <div className="flex gap-3 justify-end">
            <Button variant="ghost" type="button" onClick={() => setShowChangePw(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={changePwLoading}>
              Change Password
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
