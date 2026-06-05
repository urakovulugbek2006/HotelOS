"use client";
import { useEffect, useState, useCallback } from "react";
import { format } from "date-fns";
import toast from "react-hot-toast";
import { ticketsApi } from "@/lib/api";
import type { TicketResponse } from "@/types";
import { priorityBadge } from "@/components/ui/Badge";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import { SkeletonRow } from "@/components/ui/LoadingSkeleton";
import { startConnection } from "@/lib/signalr";
import { useAuthStore } from "@/store/authStore";

const PRIORITIES = ["Low", "Normal", "High", "Critical"];

function ticketStatusVariant(status: string): "yellow" | "blue" | "green" | "gray" | "red" {
  switch (status) {
    case "Open": return "yellow";
    case "InProgress": return "blue";
    case "Resolved": return "green";
    default: return "gray";
  }
}

export default function MaintenancePage() {
  const { user } = useAuthStore();
  const [tickets, setTickets] = useState<TicketResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [resolving, setResolving] = useState<string | null>(null);
  const [createModal, setCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createForm, setCreateForm] = useState({
    roomId: "",
    description: "",
    priority: "Normal",
    estimatedMins: 60,
  });

  const load = useCallback(() => {
    ticketsApi.getActive().then(setTickets).catch(() => toast.error("Failed to load tickets")).finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    let conn: Awaited<ReturnType<typeof startConnection>> | null = null;
    const setup = async () => {
      try {
        conn = await startConnection();
        conn.on("TicketCreated", load);
        conn.on("TicketResolved", load);
      } catch { /* SignalR unavailable */ }
    };
    setup();
    return () => {
      conn?.off("TicketCreated");
      conn?.off("TicketResolved");
    };
  }, [load]);

  const handleResolve = async (id: string) => {
    setResolving(id);
    try {
      const t = await ticketsApi.resolve(id);
      setTickets((prev) => prev.map((tk) => tk.id === id ? t : tk));
      toast.success("Ticket resolved");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Resolve failed");
    } finally {
      setResolving(null);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      await ticketsApi.create({
        roomId: createForm.roomId,
        description: createForm.description,
        priority: createForm.priority,
        estimatedMins: createForm.estimatedMins,
      });
      toast.success("Ticket created");
      setCreateModal(false);
      setCreateForm({ roomId: "", description: "", priority: "Normal", estimatedMins: 60 });
      load();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Create failed");
    } finally {
      setCreating(false);
    }
  };

  const isManager = user?.role === "Manager" || user?.role === "Receptionist";
  const isMaintenance = user?.role === "MaintenanceStaff";

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">Maintenance Tickets</h1>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Live
          </div>
          {(isManager || isMaintenance) && (
            <Button onClick={() => setCreateModal(true)}>+ New Ticket</Button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="bg-navy-800 border border-navy-700 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <tbody>{Array.from({ length: 4 }).map((_, i) => <SkeletonRow key={i} cols={6} />)}</tbody>
          </table>
        </div>
      ) : tickets.length === 0 ? (
        <div className="text-center py-20">
          <h2 className="text-base font-medium text-white mb-1">No open tickets</h2>
          <p className="text-slate-400 text-sm">All maintenance issues are resolved.</p>
        </div>
      ) : (
        <div className="bg-navy-800 border border-navy-700 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-navy-900/50">
              <tr>
                <th className="text-left px-4 py-3 text-slate-400 font-medium">Room</th>
                <th className="text-left px-4 py-3 text-slate-400 font-medium">Description</th>
                <th className="text-left px-4 py-3 text-slate-400 font-medium">Priority</th>
                <th className="text-left px-4 py-3 text-slate-400 font-medium">Status</th>
                <th className="text-left px-4 py-3 text-slate-400 font-medium">Created</th>
                <th className="text-left px-4 py-3 text-slate-400 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-navy-700">
              {tickets.map((ticket) => (
                <tr key={ticket.id} className="hover:bg-navy-700/30 transition-colors">
                  <td className="px-4 py-3 text-white font-mono text-xs">
                    {ticket.roomId.slice(0, 8)}…
                  </td>
                  <td className="px-4 py-3 text-slate-300 max-w-xs truncate">
                    {ticket.description}
                  </td>
                  <td className="px-4 py-3">{priorityBadge(ticket.priority)}</td>
                  <td className="px-4 py-3">
                    <Badge label={ticket.status} variant={ticketStatusVariant(ticket.status)} />
                  </td>
                  <td className="px-4 py-3 text-slate-400 text-xs">
                    {format(new Date(ticket.createdAt), "MMM d")}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      {ticket.status !== "Resolved" && (isMaintenance || isManager) && (
                        <Button
                          size="sm"
                          loading={resolving === ticket.id}
                          onClick={() => handleResolve(ticket.id)}
                        >
                          Resolve
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Ticket Modal */}
      <Modal open={createModal} onClose={() => setCreateModal(false)} title="Create Maintenance Ticket">
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label>Room ID (UUID)</label>
            <input
              value={createForm.roomId}
              onChange={(e) => setCreateForm((f) => ({ ...f, roomId: e.target.value }))}
              placeholder="Room UUID"
              required
            />
          </div>
          <div>
            <label>Description</label>
            <textarea
              value={createForm.description}
              onChange={(e) => setCreateForm((f) => ({ ...f, description: e.target.value }))}
              rows={3}
              placeholder="Describe the issue…"
              className="bg-navy-700 border border-navy-600 text-white rounded-md px-3 py-2 w-full placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-gold-500/50 focus:border-gold-500"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label>Priority</label>
              <select
                value={createForm.priority}
                onChange={(e) => setCreateForm((f) => ({ ...f, priority: e.target.value }))}
              >
                {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label>Est. Duration (mins)</label>
              <input
                type="number"
                value={createForm.estimatedMins}
                onChange={(e) => setCreateForm((f) => ({ ...f, estimatedMins: Number(e.target.value) }))}
                min={5}
                required
              />
            </div>
          </div>
          <div className="flex gap-3 justify-end">
            <Button variant="ghost" type="button" onClick={() => setCreateModal(false)}>Cancel</Button>
            <Button type="submit" loading={creating}>Create</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
