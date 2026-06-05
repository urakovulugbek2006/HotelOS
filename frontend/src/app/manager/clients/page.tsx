"use client";
import { useEffect, useState } from "react";
import { format } from "date-fns";
import toast from "react-hot-toast";
import { authApi } from "@/lib/api";
import type { Role, UserAccount } from "@/types";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import { SkeletonRow } from "@/components/ui/LoadingSkeleton";

const STAFF_ROLES: Role[] = [
  "Receptionist", "CleaningStaff", "MaintenanceStaff",
  "KitchenStaff", "Server", "Manager",
];

const DEPARTMENTS = [
  "Front Desk", "Housekeeping", "Maintenance", "Food & Beverage", "Management",
];

function accountStatusVariant(status: string): "green" | "red" | "gray" {
  if (status === "Active") return "green";
  if (status === "Inactive" || status === "Suspended") return "red";
  return "gray";
}

export default function ManagerStaffPage() {
  const [accounts, setAccounts] = useState<UserAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [createModal, setCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [deactivating, setDeactivating] = useState<string | null>(null);
  const [suspending, setSuspending] = useState<string | null>(null);

  const [form, setForm] = useState({
    email: "",
    password: "",
    role: "Receptionist" as Role,
    firstName: "",
    lastName: "",
    phone: "",
    department: "Front Desk",
    jobTitle: "",
    hireDate: new Date().toISOString().split("T")[0],
    emergencyContactName: "",
    emergencyContactPhone: "",
  });

  const loadClients = () => {
    setLoading(true);
  
    authApi
      .getAllUsers()
      .then(users => setAccounts(users.filter(user => user.role === "Client")))
      .catch(() => toast.error("Failed to load staff"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadClients(); }, []);

  const set = (k: keyof typeof form) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => setForm((f) => ({ ...f, [k]: e.target.value }));


  const handleDeactivate = async (id: string, email: string) => {
    if (!confirm(`Permanently deactivate account for ${email}? This action cannot be undone.`)) return;
    setDeactivating(id);
    try {
      await authApi.deactivateUser(id);
      toast.success("Account permanently deactivated");
      loadClients();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Deactivate failed");
    } finally {
      setDeactivating(null);
    }
  };

  const handleSuspend = async (id: string, currentStatus: string, email: string) => {
    const action = currentStatus === "Suspended" ? "unsuspend" : "suspend";
    if (!confirm(`${action.charAt(0).toUpperCase() + action.slice(1)} account for ${email}?`)) return;
    setSuspending(id);
    try {
      await authApi.suspendAccount(id);
      toast.success(`Account ${action}ed`);
      loadClients();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : `${action} failed`);
    } finally {
      setSuspending(null);
    }
  };
  console.log(accounts);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">Client Management</h1>
      </div>

      <div className="bg-navy-800 border border-navy-700 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-navy-900/50">
            <tr>
              <th className="text-left px-4 py-3 text-slate-400 font-medium">Email</th>
              <th className="text-left px-4 py-3 text-slate-400 font-medium">Role</th>
              <th className="text-left px-4 py-3 text-slate-400 font-medium">Status</th>
              <th className="text-left px-4 py-3 text-slate-400 font-medium">Created</th>
              <th className="text-left px-4 py-3 text-slate-400 font-medium">Last Login</th>
              <th className="text-left px-4 py-3 text-slate-400 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-navy-700">
            {loading
              ? Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} cols={6} />)
              : accounts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-400">No accounts found</td>
                </tr>
              ) : (
                accounts.map((acc) => (
                  <tr key={acc.id} className="hover:bg-navy-700/30 transition-colors">
                    <td className="px-4 py-3 text-white">{acc.email}</td>
                    <td className="px-4 py-3 text-gold-400">{acc.role}</td>
                    <td className="px-4 py-3">
                      <Badge label={acc.status} variant={accountStatusVariant(acc.status)} />
                    </td>
                    <td className="px-4 py-3 text-slate-400 text-xs">
                      {format(new Date(acc.createdAt), "MMM d, yyyy")}
                    </td>
                    <td className="px-4 py-3 text-slate-400 text-xs">
                      {acc.lastLoginAt ? format(new Date(acc.lastLoginAt), "MMM d, h:mm a") : "—"}
                    </td>
                    <td className="px-4 py-3">
                      {acc.role !== "Manager" && acc.status !== "Deleted" && (
                        <div className="flex gap-2">
                          {(acc.status === "Active" || acc.status === "Suspended") && (
                            <Button
                              size="sm"
                              variant="secondary"
                              loading={suspending === acc.id}
                              onClick={() => handleSuspend(acc.id, acc.status, acc.email)}
                            >
                              {acc.status === "Suspended" ? "Unsuspend" : "Suspend"}
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="danger"
                            loading={deactivating === acc.id}
                            onClick={() => handleDeactivate(acc.id, acc.email)}
                          >
                            Deactivate
                          </Button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
