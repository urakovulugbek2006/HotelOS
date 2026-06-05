"use client";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { roomsApi, cleaningApi, ticketsApi, ordersApi } from "@/lib/api";
import type { RoomResponse, CleaningLogResponse, TicketResponse, OrderResponse } from "@/types";
import { StatCard } from "@/components/ui/Card";
import { PageLoader } from "@/components/ui/LoadingSkeleton";

export default function ManagerOverviewPage() {
  const [rooms, setRooms] = useState<RoomResponse[]>([]);
  const [cleaning, setCleaning] = useState<CleaningLogResponse[]>([]);
  const [tickets, setTickets] = useState<TicketResponse[]>([]);
  const [orders, setOrders] = useState<OrderResponse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      roomsApi.getAll().then(setRooms).catch(() => {}),
      cleaningApi.getActive().then(setCleaning).catch(() => {}),
      ticketsApi.getActive().then(setTickets).catch(() => {}),
      ordersApi.getActive().then(setOrders).catch(() => {}),
    ]).finally(() => setLoading(false));
  }, []);

  if (loading) return <PageLoader />;

  const available = rooms.filter((r) => r.status === "Available").length;
  const activeRooms = rooms.filter((r) => r.status === "Active").length;
  const openTickets = tickets.filter((t) => t.status !== "Resolved").length;
  const activeOrders = orders.filter((o) => o.status !== "Delivered").length;

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-2">Manager Dashboard</h1>
      <p className="text-slate-400 text-sm mb-8">Hotel operations at a glance</p>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        <StatCard label="Available Rooms" value={available} color="green" />
        <StatCard label="Active Stays" value={activeRooms} color="blue" />
        <StatCard label="Cleaning Jobs" value={cleaning.length} color="gold" />
        <StatCard label="Open Tickets" value={openTickets} color="red" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Room breakdown */}
        <div className="bg-navy-800 border border-navy-700 rounded-xl p-5">
          <h2 className="font-semibold text-white mb-4">Room Status Breakdown</h2>
          {["Available", "Active", "Cleaning", "OOS", "Archived"].map((status) => {
            const count = rooms.filter((r) => r.status === status).length;
            const pct = rooms.length > 0 ? Math.round((count / rooms.length) * 100) : 0;
            return (
              <div key={status} className="mb-3">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-300">{status}</span>
                  <span className="text-slate-400">{count} ({pct}%)</span>
                </div>
                <div className="h-1.5 bg-navy-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gold-500 rounded-full transition-all"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Active orders */}
        <div className="bg-navy-800 border border-navy-700 rounded-xl p-5">
          <h2 className="font-semibold text-white mb-4">Kitchen Orders</h2>
          {["Received", "Preparing", "OutForDelivery", "Delivered"].map((status) => {
            const count = orders.filter((o) => o.status === status).length;
            return (
              <div key={status} className="flex justify-between items-center py-2 border-b border-navy-700 last:border-0">
                <span className="text-slate-300 text-sm">{status}</span>
                <span className="text-white font-semibold">{count}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
