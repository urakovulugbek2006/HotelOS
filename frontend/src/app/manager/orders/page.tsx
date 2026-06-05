"use client";
import { useEffect, useState, useCallback } from "react";
import { format } from "date-fns";
import toast from "react-hot-toast";
import { ordersApi } from "@/lib/api";
import type { OrderResponse } from "@/types";
import { orderStatusBadge } from "@/components/ui/Badge";
import { SkeletonRow } from "@/components/ui/LoadingSkeleton";
import { startConnection } from "@/lib/signalr";

export default function ManagerOrdersPage() {
  const [orders, setOrders] = useState<OrderResponse[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    ordersApi.getActive().then(setOrders).catch(() => toast.error("Failed to load orders")).finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    let conn: Awaited<ReturnType<typeof startConnection>> | null = null;
    const setup = async () => {
      try {
        conn = await startConnection();
        conn.on("OrderCreated", load);
        conn.on("OrderUpdated", load);
      } catch { /* SignalR unavailable */ }
    };
    setup();
    return () => {
      conn?.off("OrderCreated");
      conn?.off("OrderUpdated");
    };
  }, [load]);

  const totalRevenue = orders.reduce((s, o) => s + o.totalPrice, 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">Live Orders</h1>
        <div className="text-right">
          <div className="flex items-center gap-2 text-xs text-emerald-400 mb-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Live updates
          </div>
          <p className="text-gold-400 font-semibold">${totalRevenue.toFixed(2)} today</p>
        </div>
      </div>

      <div className="bg-navy-800 border border-navy-700 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-navy-900/50">
            <tr>
              <th className="text-left px-4 py-3 text-slate-400 font-medium">Order ID</th>
              <th className="text-left px-4 py-3 text-slate-400 font-medium">Booking</th>
              <th className="text-left px-4 py-3 text-slate-400 font-medium">Items</th>
              <th className="text-left px-4 py-3 text-slate-400 font-medium">Total</th>
              <th className="text-left px-4 py-3 text-slate-400 font-medium">Status</th>
              <th className="text-left px-4 py-3 text-slate-400 font-medium">Time</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-navy-700">
            {loading
              ? Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} cols={6} />)
              : orders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-400">No active orders</td>
                </tr>
              ) : (
                orders.map((o) => (
                  <tr key={o.id} className="hover:bg-navy-700/30 transition-colors">
                    <td className="px-4 py-3 text-white font-mono text-xs">#{o.id.slice(0, 6).toUpperCase()}</td>
                    <td className="px-4 py-3 text-slate-400 font-mono text-xs">{o.bookingId.slice(0, 8)}…</td>
                    <td className="px-4 py-3 text-slate-300">
                      {o.items.map((it) => `${it.quantity}× ${it.menuItemName}`).join(", ")}
                    </td>
                    <td className="px-4 py-3 text-gold-400">${o.totalPrice.toFixed(2)}</td>
                    <td className="px-4 py-3">{orderStatusBadge(o.status)}</td>
                    <td className="px-4 py-3 text-slate-400 text-xs">{format(new Date(o.createdAt), "h:mm a")}</td>
                  </tr>
                ))
              )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
