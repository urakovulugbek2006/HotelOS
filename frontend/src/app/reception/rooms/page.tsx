"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { roomsApi, authApi, cleaningApi, ticketsApi, bookingsApi } from "@/lib/api";
import type { RoomResponse, RoomStatus, UserAccount, BookingResponse, CleaningLogResponse, TicketResponse } from "@/types";
import { roomStatusBadge } from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { SkeletonRow } from "@/components/ui/LoadingSkeleton";
import Modal from "@/components/ui/Modal";
import { useRoomStore } from "@/store/roomStore";
import { useAuthStore } from "@/store/authStore";

const FILTER_STATUSES: RoomStatus[] = ["Available", "Reserved", "Cleaning", "Active", "OOS"];
const ALL_UPDATE_STATUSES: RoomStatus[] = ["Available", "OOS", "Cleaning", "Archived"];

type ResolvedUser = { email: string; firstName: string | null; lastName: string | null };

type InfoData =
  | { kind: "booking";  booking: BookingResponse; guest: ResolvedUser | null }
  | { kind: "cleaning"; logs: CleaningLogResponse[]; staffMap: Record<string, ResolvedUser> }
  | { kind: "ticket";   tickets: TicketResponse[];  staffMap: Record<string, ResolvedUser> };

async function resolveUsers(ids: string[]): Promise<Record<string, ResolvedUser>> {
  const unique = Array.from(new Set(ids.filter(Boolean)));
  const results = await Promise.allSettled(unique.map((id) => authApi.getUserById(id)));
  const map: Record<string, ResolvedUser> = {};
  results.forEach((r, i) => {
    if (r.status === "fulfilled") {
      map[unique[i]] = { email: r.value.email, firstName: r.value.firstName, lastName: r.value.lastName };
    }
  });
  return map;
}

function displayName(u: ResolvedUser | null | undefined): string {
  if (!u) return "Unknown";
  if (u.firstName || u.lastName) return `${u.firstName ?? ""} ${u.lastName ?? ""}`.trim();
  return u.email;
}

export default function ReceptionRoomsPage() {
  const router    = useRouter();
  const user      = useAuthStore((s) => s.user);
  const isManager = user?.role === "Manager";

  const { rooms, loading, fetchRooms, updateRoomStatus } = useRoomStore();
  const [filter, setFilter] = useState<RoomStatus | "">("");

  // Status-update modal
  const [actionRoom, setActionRoom]           = useState<RoomResponse | null>(null);
  const [selectedStatus, setSelectedStatus]   = useState<RoomStatus>("Available");
  const [staffList, setStaffList]             = useState<UserAccount[]>([]);
  const [staffLoading, setStaffLoading]       = useState(false);
  const [selectedStaffId, setSelectedStaffId] = useState("");
  const [ticketDesc, setTicketDesc]           = useState("");
  const [updating, setUpdating]               = useState(false);

  // Info modal
  const [infoRoom, setInfoRoom]       = useState<RoomResponse | null>(null);
  const [infoData, setInfoData]       = useState<InfoData | null>(null);
  const [infoLoading, setInfoLoading] = useState(false);

  useEffect(() => { fetchRooms(); }, [fetchRooms]);

  // Load staff when modal status changes
  useEffect(() => {
    if (!actionRoom) return;
    if (selectedStatus === "OOS") {
      setStaffLoading(true); setStaffList([]); setSelectedStaffId("");
      authApi.getAllUsers("MaintenanceStaff")
        .then(setStaffList)
        .catch(() => toast.error("Failed to load maintenance staff"))
        .finally(() => setStaffLoading(false));
    } else if (selectedStatus === "Cleaning") {
      setStaffLoading(true); setStaffList([]); setSelectedStaffId("");
      authApi.getAllUsers("CleaningStaff")
        .then(setStaffList)
        .catch(() => toast.error("Failed to load cleaning staff"))
        .finally(() => setStaffLoading(false));
    } else {
      setStaffList([]); setSelectedStaffId("");
    }
  }, [selectedStatus, actionRoom]);

  const getUpdateOptions = (room: RoomResponse): RoomStatus[] =>
    ALL_UPDATE_STATUSES.filter(
      (s) => s !== room.status && (s !== "Archived" || isManager)
    );

  const openUpdateModal = (room: RoomResponse) => {
    const opts = getUpdateOptions(room);
    setActionRoom(room);
    setSelectedStatus(opts[0] ?? "Available");
    setTicketDesc(""); setSelectedStaffId("");
  };

  const handleUpdateStatus = async () => {
    if (!actionRoom) return;
    if ((selectedStatus === "OOS" || selectedStatus === "Cleaning") && !selectedStaffId) {
      toast.error("Please select a staff member"); return;
    }
    setUpdating(true);
    try {
      if (selectedStatus === "OOS") {
        const ticket = await ticketsApi.create({
          roomId: actionRoom.id,
          description: ticketDesc || `Out of service — Room ${actionRoom.roomNumber}`,
          priority: "Normal",
        });
        await ticketsApi.assign(ticket.id, selectedStaffId);
        await roomsApi.updateStatus(actionRoom.id, "OOS");
        updateRoomStatus(actionRoom.id, "OOS");
        toast.success("Room set OOS — maintenance ticket created");
      } else if (selectedStatus === "Cleaning") {
        await cleaningApi.assign(actionRoom.id, selectedStaffId);
        await roomsApi.updateStatus(actionRoom.id, "Cleaning");
        updateRoomStatus(actionRoom.id, "Cleaning");
        toast.success("Cleaning assignment created");
      } else {
        await roomsApi.updateStatus(actionRoom.id, selectedStatus);
        updateRoomStatus(actionRoom.id, selectedStatus);
        toast.success("Room status updated");
      }
      setActionRoom(null);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Update failed");
    } finally {
      setUpdating(false);
    }
  };

  const openInfoModal = async (room: RoomResponse) => {
    setInfoRoom(room); setInfoData(null); setInfoLoading(true);
    try {
      if (room.status === "Active") {
        const allActive = await bookingsApi.getAll("Active");
        const booking   = allActive.find((b) => b.roomId === room.id) ?? null;
        let guest: ResolvedUser | null = null;
        if (booking) {
          const map = await resolveUsers([booking.guestId]);
          guest = map[booking.guestId] ?? null;
        }
        setInfoData({ kind: "booking", booking: booking!, guest });
      } else if (room.status === "Cleaning") {
        const logs    = await cleaningApi.getByRoom(room.id);
        const staffMap = await resolveUsers(logs.map((l) => l.staffId));
        setInfoData({ kind: "cleaning", logs, staffMap });
      } else if (room.status === "OOS") {
        const tickets  = await ticketsApi.getByRoom(room.id);
        const ids      = tickets.map((t) => t.assignedStaffId).filter(Boolean) as string[];
        const staffMap = await resolveUsers(ids);
        setInfoData({ kind: "ticket", tickets, staffMap });
      }
    } catch { toast.error("Failed to load room info"); }
    finally { setInfoLoading(false); }
  };

  const filtered = filter ? rooms.filter((r) => r.status === filter) : rooms;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">Rooms</h1>
        <div className="flex items-center gap-2 text-xs text-emerald-400">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          Live
        </div>
      </div>

      <div className="flex gap-2 mb-4 flex-wrap">
        <button onClick={() => setFilter("")}
          className={`px-3 py-1.5 rounded-full text-sm transition-colors ${filter === "" ? "bg-gold-500 text-navy-900 font-semibold" : "bg-navy-700 text-slate-300 hover:text-white"}`}>
          All ({rooms.length})
        </button>
        {FILTER_STATUSES.map((s) => (
          <button key={s} onClick={() => setFilter(s)}
            className={`px-3 py-1.5 rounded-full text-sm transition-colors ${filter === s ? "bg-gold-500 text-navy-900 font-semibold" : "bg-navy-700 text-slate-300 hover:text-white"}`}>
            {s} ({rooms.filter((r) => r.status === s).length})
          </button>
        ))}
      </div>

      <div className="bg-navy-800 border border-navy-700 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-navy-900/50">
            <tr>
              <th className="text-left px-4 py-3 text-slate-400 font-medium">Room</th>
              <th className="text-left px-4 py-3 text-slate-400 font-medium">Style</th>
              <th className="text-left px-4 py-3 text-slate-400 font-medium">Floor</th>
              <th className="text-left px-4 py-3 text-slate-400 font-medium">Capacity</th>
              <th className="text-left px-4 py-3 text-slate-400 font-medium">Price</th>
              <th className="text-left px-4 py-3 text-slate-400 font-medium">Status</th>
              <th className="text-left px-4 py-3 text-slate-400 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-navy-700">
            {loading
              ? Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} cols={7} />)
              : filtered.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-12 text-slate-400">No rooms found</td></tr>
              ) : filtered.map((room) => (
                <tr key={room.id} className="hover:bg-navy-700/30 transition-colors">
                  <td className="px-4 py-3 text-white font-medium">{room.roomNumber}</td>
                  <td className="px-4 py-3 text-slate-300">{room.style}</td>
                  <td className="px-4 py-3 text-slate-300">{room.floor}</td>
                  <td className="px-4 py-3 text-slate-300">{room.capacity}</td>
                  <td className="px-4 py-3 text-gold-400">${room.pricePerNight}</td>
                  <td className="px-4 py-3">{roomStatusBadge(room.status)}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2 flex-wrap">
                      {["Active", "Cleaning", "OOS"].includes(room.status) && (
                        <Button size="sm" variant="ghost" onClick={() => openInfoModal(room)}>Info</Button>
                      )}
                      {room.status === "Available" && (
                        <Button size="sm" onClick={() =>
                          router.push(`/reception/walkin?roomId=${room.id}&roomNumber=${room.roomNumber}`)
                        }>Book</Button>
                      )}
                      {!["Reserved", "Active"].includes(room.status) && (
                        <Button size="sm" variant="secondary" onClick={() => openUpdateModal(room)}>
                          Update Status
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {/* ── Status Update Modal ─────────────────────────────────── */}
      <Modal open={!!actionRoom} onClose={() => setActionRoom(null)}
        title={`Update Room ${actionRoom?.roomNumber}`}>
        {actionRoom && (
          <div className="space-y-4">
            <div>
              <label>New Status</label>
              <select value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value as RoomStatus)}>
                {getUpdateOptions(actionRoom).map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
              <p className="text-xs text-slate-500 mt-1">
                Current: <span className="text-slate-300">{actionRoom.status}</span>
              </p>
            </div>

            {selectedStatus === "OOS" && (
              <>
                <div>
                  <label>Maintenance Staff (required)</label>
                  {staffLoading ? <p className="text-xs text-slate-400 py-2">Loading…</p>
                    : staffList.length === 0 ? <p className="text-xs text-red-400 py-2">No staff available</p>
                    : (
                      <select value={selectedStaffId} onChange={(e) => setSelectedStaffId(e.target.value)}>
                        <option value="">— Select staff —</option>
                        {staffList.map((s) => <option key={s.id} value={s.id}>{s.email}</option>)}
                      </select>
                    )}
                </div>
                <div>
                  <label>Issue Description</label>
                  <input value={ticketDesc} onChange={(e) => setTicketDesc(e.target.value)}
                    placeholder="Describe the maintenance issue…" />
                </div>
              </>
            )}

            {selectedStatus === "Cleaning" && (
              <div>
                <label>Cleaning Staff (required)</label>
                {staffLoading ? <p className="text-xs text-slate-400 py-2">Loading…</p>
                  : staffList.length === 0 ? <p className="text-xs text-red-400 py-2">No staff available</p>
                  : (
                    <select value={selectedStaffId} onChange={(e) => setSelectedStaffId(e.target.value)}>
                      <option value="">— Select staff —</option>
                      {staffList.map((s) => <option key={s.id} value={s.id}>{s.email}</option>)}
                    </select>
                  )}
              </div>
            )}

            <div className="flex gap-3 justify-end">
              <Button variant="ghost" onClick={() => setActionRoom(null)}>Cancel</Button>
              <Button onClick={handleUpdateStatus} loading={updating}>Update</Button>
            </div>
          </div>
        )}
      </Modal>

      {/* ── Info Modal ──────────────────────────────────────────── */}
      <Modal open={!!infoRoom} onClose={() => { setInfoRoom(null); setInfoData(null); }}
        title={`Room ${infoRoom?.roomNumber} — ${infoRoom?.status}`}>
        {infoLoading ? (
          <p className="text-slate-400 text-sm py-4 text-center">Loading…</p>
        ) : !infoData ? (
          <p className="text-slate-400 text-sm py-4 text-center">No data available</p>
        ) : infoData.kind === "booking" ? (
          <div className="space-y-3 text-sm">
            {!infoData.booking ? (
              <p className="text-slate-400">No active booking found for this room</p>
            ) : (
              <>
                <InfoRow label="Guest" value={displayName(infoData.guest)} />
                {infoData.guest?.email && <InfoRow label="Email" value={infoData.guest.email} />}
                <InfoRow label="Check-in"  value={new Date(infoData.booking.checkIn).toLocaleDateString()} />
                <InfoRow label="Check-out" value={new Date(infoData.booking.checkOut).toLocaleDateString()} />
                <InfoRow label="Total"     value={`$${infoData.booking.totalPrice.toFixed(2)}`} highlight />
                <InfoRow label="Status"    value={infoData.booking.status} />
              </>
            )}
          </div>
        ) : infoData.kind === "cleaning" ? (
          <div className="space-y-2 text-sm">
            {infoData.logs.length === 0 ? (
              <p className="text-slate-400">No cleaning assignments found</p>
            ) : infoData.logs.map((log, i) => (
              <div key={log.id} className="bg-navy-700/50 rounded-lg p-3 space-y-1">
                <InfoRow label="Staff"    value={displayName(infoData.staffMap[log.staffId])} />
                <InfoRow label="Email"    value={infoData.staffMap[log.staffId]?.email ?? "—"} />
                <InfoRow label="Status"   value={log.status} />
                {log.durationMins > 0 && <InfoRow label="Duration" value={`${log.durationMins} min`} />}
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-2 text-sm">
            {infoData.tickets.length === 0 ? (
              <p className="text-slate-400">No maintenance tickets</p>
            ) : infoData.tickets.map((t) => (
              <div key={t.id} className="bg-navy-700/50 rounded-lg p-3 space-y-1">
                <InfoRow label="Priority"    value={t.priority} />
                <InfoRow label="Status"      value={t.status} />
                <p className="text-slate-300 text-xs">{t.description}</p>
                {t.assignedStaffId && (
                  <>
                    <InfoRow label="Assigned" value={displayName(infoData.staffMap[t.assignedStaffId])} />
                    <InfoRow label="Email"    value={infoData.staffMap[t.assignedStaffId]?.email ?? "—"} />
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </Modal>
    </div>
  );
}

function InfoRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex justify-between">
      <span className="text-slate-400">{label}</span>
      <span className={highlight ? "text-gold-400 font-semibold" : "text-white"}>{value}</span>
    </div>
  );
}
