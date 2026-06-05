"use client";
import { useEffect, useState } from "react";
import { format } from "date-fns";
import toast from "react-hot-toast";
import { paymentsApi } from "@/lib/api";
import type { PaymentResponse } from "@/types";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { SkeletonRow } from "@/components/ui/LoadingSkeleton";

function paymentStatusVariant(status: string): "green" | "yellow" | "red" | "gray" | "blue" | "orange" {
  switch (status) {
    case "Completed": return "green";
    case "Pending":   return "yellow";
    case "Failed":    return "red";
    case "Refunded":  return "blue";
    default:          return "gray";
  }
}

export default function ManagerPaymentsPage() {
  const [payments, setPayments]   = useState<PaymentResponse[]>([]);
  const [loading, setLoading]     = useState(true);
  const [confirming, setConfirming] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    paymentsApi.getAll()
      .then(setPayments)
      .catch(() => toast.error("Failed to load payments"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleConfirmManual = async (id: string) => {
    setConfirming(id);
    try {
      const updated = await paymentsApi.confirmManual(id);
      setPayments((prev) => prev.map((p) => p.id === id ? updated : p));
      toast.success("Payment confirmed");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Confirm failed");
    } finally {
      setConfirming(null);
    }
  };

  const total   = payments.reduce((s, p) => p.status === "Completed" ? s + p.amount : s, 0);
  const pending = payments.filter((p) => p.status === "Pending").length;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">Payments</h1>
        <div className="text-right">
          <p className="text-slate-400 text-sm">{pending} pending</p>
          <p className="text-gold-400 font-semibold">${total.toFixed(2)} collected</p>
        </div>
      </div>

      <div className="bg-navy-800 border border-navy-700 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-navy-900/50">
            <tr>
              <th className="text-left px-4 py-3 text-slate-400 font-medium">Type</th>
              <th className="text-left px-4 py-3 text-slate-400 font-medium">Amount</th>
              <th className="text-left px-4 py-3 text-slate-400 font-medium">Status</th>
              <th className="text-left px-4 py-3 text-slate-400 font-medium">Created</th>
              <th className="text-left px-4 py-3 text-slate-400 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-navy-700">
            {loading
              ? Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} cols={5} />)
              : payments.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-slate-400">No payments</td>
                </tr>
              ) : payments.map((p) => (
                <tr key={p.id} className="hover:bg-navy-700/30 transition-colors">
                  <td className="px-4 py-3 text-slate-300">
                    {p.gatewayRef ? "Online" : "Manual"}
                  </td>
                  <td className="px-4 py-3 text-gold-400 font-semibold">
                    {p.amount.toFixed(2)} {p.currency}
                  </td>
                  <td className="px-4 py-3">
                    <Badge label={p.status} variant={paymentStatusVariant(p.status)} />
                  </td>
                  <td className="px-4 py-3 text-slate-400 text-xs">
                    {format(new Date(p.createdAt), "MMM d, h:mm a")}
                  </td>
                  <td className="px-4 py-3">
                    {p.status === "Pending" && (
                      <Button size="sm" loading={confirming === p.id}
                        onClick={() => handleConfirmManual(p.id)}>
                        Confirm
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
