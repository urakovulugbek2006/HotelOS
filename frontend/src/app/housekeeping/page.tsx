"use client";
import { useEffect, useState, useCallback } from "react";
import { format } from "date-fns";
import toast from "react-hot-toast";
import { cleaningApi, roomsApi } from "@/lib/api";
import type { CleaningLogResponse, RoomResponse } from "@/types";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import { SkeletonRow } from "@/components/ui/LoadingSkeleton";
import { startConnection } from "@/lib/signalr";
import { useAuthStore } from "@/store/authStore";

function cleanStatusVariant(status: string): "yellow" | "blue" | "green" | "gray" {
  switch (status) {
    case "BeingCleaned": return "yellow";
    case "Clean": return "blue";
    case "Completed": return "green";
    default: return "gray";
  }
}

export default function HousekeepingPage() {
  const { user } = useAuthStore();
  const isManager = user?.role === "Manager" || user?.role === "Receptionist";

  const [logs, setLogs] = useState<CleaningLogResponse[]>([]);
  const [cleaningRooms, setCleaningRooms] = useState<RoomResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [assignModal, setAssignModal] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [assignForm, setAssignForm] = useState({ roomId: "", staffId: "" });

  const load = useCallback(() => {
    // roomsApi.getAll() requires Manager/Receptionist; CleaningStaff cannot call it
    const roomsCall = isManager
      ? roomsApi.getAll("Cleaning").catch(() => [] as RoomResponse[])
      : Promise.resolve([] as RoomResponse[]);

    Promise.all([cleaningApi.getActive(), roomsCall])
      .then(([active, rooms]) => {
        setLogs(active);
        setCleaningRooms(rooms);
      })
      .catch(() => toast.error("Failed to load assignments"))
      .finally(() => setLoading(false));
  }, [isManager]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    let conn: Awaited<ReturnType<typeof startConnection>> | null = null;
    const setup = async () => {
      try {
        conn = await startConnection();
        conn.on("RoomStatusUpdated", load);
        conn.on("CleaningStarted", load);
        conn.on("CleaningCompleted", load);
      } catch { /* SignalR unavailable */ }
    };
    setup();
    return () => {
      conn?.off("RoomStatusUpdated");
      conn?.off("CleaningStarted");
      conn?.off("CleaningCompleted");
    };
  }, [load]);

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    setAssigning(true);
    try {
      await cleaningApi.assign(assignForm.roomId, assignForm.staffId || user!.id);
      toast.success("Assignment created");
      setAssignModal(false);
      setAssignForm({ roomId: "", staffId: "" });
      load();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Assign failed");
    } finally {
      setAssigning(false);
    }
  };

  const handleStart = async (id: string) => {
    setActionLoading(`start-${id}`);
    try {
      const updated = await cleaningApi.start(id);
      setLogs((prev) => prev.map((l) => l.id === id ? updated : l));
      toast.success("Cleaning started");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Start failed");
    } finally {
      setActionLoading(null);
    }
  };

  const handleComplete = async (id: string) => {
    setActionLoading(`complete-${id}`);
    try {
      const updated = await cleaningApi.complete(id);
      setLogs((prev) => prev.map((l) => l.id === id ? updated : l));
      toast.success("Room marked clean");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Complete failed");
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">Cleaning Assignments</h1>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Live
          </div>
          {isManager && (
            <Button onClick={() => setAssignModal(true)}>+ Assign</Button>
          )}
        </div>
      </div>

      {/* Rooms needing cleaning */}
      {cleaningRooms.length > 0 && (
        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4 mb-6">
          <p className="text-yellow-400 text-sm font-medium mb-2">
            {cleaningRooms.length} room{cleaningRooms.length !== 1 ? "s" : ""} need cleaning
          </p>
          <div className="flex flex-wrap gap-2">
            {cleaningRooms.map((r) => (
              <span key={r.id} className="text-xs bg-navy-800 text-slate-300 px-2 py-1 rounded">
                Room {r.roomNumber}
              </span>
            ))}
          </div>
        </div>
      )}

      {loading ? (
        <div className="bg-navy-800 border border-navy-700 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <tbody>{Array.from({ length: 4 }).map((_, i) => <SkeletonRow key={i} cols={5} />)}</tbody>
          </table>
        </div>
      ) : logs.length === 0 ? (
        <div className="text-center py-20">
          <h2 className="text-base font-medium text-white mb-1">All clean</h2>
          <p className="text-slate-400 text-sm">No active cleaning assignments.</p>
        </div>
      ) : (
        <div className="bg-navy-800 border border-navy-700 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-navy-900/50">
              <tr>
                <th className="text-left px-4 py-3 text-slate-400 font-medium">ID</th>
                <th className="text-left px-4 py-3 text-slate-400 font-medium">Room</th>
                <th className="text-left px-4 py-3 text-slate-400 font-medium">Status</th>
                <th className="text-left px-4 py-3 text-slate-400 font-medium">Started</th>
                <th className="text-left px-4 py-3 text-slate-400 font-medium">Duration</th>
                <th className="text-left px-4 py-3 text-slate-400 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-navy-700">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-navy-700/30 transition-colors">
                  <td className="px-4 py-3 text-slate-400 font-mono text-xs">{log.id.slice(0, 8)}…</td>
                  <td className="px-4 py-3 text-white font-mono text-xs">{log.roomId.slice(0, 8)}…</td>
                  <td className="px-4 py-3">
                    <Badge label={log.status} variant={cleanStatusVariant(log.status)} />
                  </td>
                  <td className="px-4 py-3 text-slate-300">
                    {format(new Date(log.startedAt), "h:mm a")}
                  </td>
                  <td className="px-4 py-3 text-slate-300">
                    {log.durationMins > 0 ? `${log.durationMins} min` : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      {log.status === "BeingCleaned" && (
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => handleStart(log.id)}
                          loading={actionLoading === `start-${log.id}`}
                        >
                          Start
                        </Button>
                      )}
                      {log.status !== "Completed" && (
                        <Button
                          size="sm"
                          onClick={() => handleComplete(log.id)}
                          loading={actionLoading === `complete-${log.id}`}
                        >
                          Complete
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

      {/* Assign Modal */}
      <Modal open={assignModal} onClose={() => setAssignModal(false)} title="Assign Cleaning">
        <form onSubmit={handleAssign} className="space-y-4">
          <div>
            <label>Room ID</label>
            <select
              value={assignForm.roomId}
              onChange={(e) => setAssignForm((f) => ({ ...f, roomId: e.target.value }))}
              required
            >
              <option value="">— Select room —</option>
              {cleaningRooms.map((r) => (
                <option key={r.id} value={r.id}>Room {r.roomNumber}</option>
              ))}
            </select>
          </div>
          <div>
            <label>Staff ID (optional — defaults to you)</label>
            <input
              value={assignForm.staffId}
              onChange={(e) => setAssignForm((f) => ({ ...f, staffId: e.target.value }))}
              placeholder="Leave blank to assign yourself"
            />
          </div>
          <div className="flex gap-3 justify-end">
            <Button variant="ghost" type="button" onClick={() => setAssignModal(false)}>Cancel</Button>
            <Button type="submit" loading={assigning}>Assign</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
