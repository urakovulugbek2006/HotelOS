"use client";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { roomsApi } from "@/lib/api";
import type { RoomResponse, RoomStatus, RoomStyle } from "@/types";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import { roomStatusBadge } from "@/components/ui/Badge";
import { SkeletonRow } from "@/components/ui/LoadingSkeleton";

const STYLES: RoomStyle[] = ["Standard", "Deluxe", "FamilySuite", "BusinessSuite"];
const STATUSES: RoomStatus[] = ["Available", "Reserved", "Cleaning", "Active", "OOS", "Archived"];

export default function ManagerRoomsPage() {
  const [rooms, setRooms] = useState<RoomResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<RoomStatus | "">("");
  const [createModal, setCreateModal] = useState(false);
  const [bufferModal, setBufferModal] = useState<RoomResponse | null>(null);
  const [creating, setCreating] = useState(false);
  const [updatingBuffer, setUpdatingBuffer] = useState(false);
  const [restoring, setRestoring] = useState<string | null>(null);

  const [form, setForm] = useState({
    roomNumber: "",
    floor: 1,
    style: "Standard" as RoomStyle,
    pricePerNight: 120,
    capacity: 2,
    isSmokingAllowed: false,
    description: "",
  });

  const [bufferForm, setBufferForm] = useState({
    cleaningBufferMins: 60,
    maintenanceBufferMins: 120,
    bufferType: "CleaningAndMaintenance",
  });

  const loadRooms = () => {
    setLoading(true);
    roomsApi
      .getAll()
      .then(setRooms)
      .catch(() => toast.error("Failed to load rooms"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadRooms(); }, []);

  const set = (k: keyof typeof form) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const val = e.target.type === "number"
      ? Number(e.target.value)
      : e.target.type === "checkbox"
        ? (e.target as HTMLInputElement).checked
        : e.target.value;
    setForm((f) => ({ ...f, [k]: val }));
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      await roomsApi.create(form);
      toast.success("Room created");
      setCreateModal(false);
      loadRooms();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Create failed");
    } finally {
      setCreating(false);
    }
  };

  const handleArchive = async (id: string, roomNumber: string) => {
    if (!confirm(`Archive room ${roomNumber}?`)) return;
    try {
      await roomsApi.archive(id);
      toast.success("Room archived");
      loadRooms();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Archive failed");
    }
  };

  const handleRestore = async (id: string, roomNumber: string) => {
    if (!confirm(`Restore room ${roomNumber} to Available?`)) return;
    setRestoring(id);
    try {
      await roomsApi.restore(id);
      toast.success("Room restored");
      loadRooms();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Restore failed");
    } finally {
      setRestoring(null);
    }
  };

  const handleUpdateBuffer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bufferModal) return;

    const { cleaningBufferMins, maintenanceBufferMins, bufferType } = bufferForm;
    console.log(bufferForm);
    if (bufferType === "CleaningOnly") {
      if (cleaningBufferMins <= 0 || maintenanceBufferMins !== 0) {
        toast.error("Cleaning Only requires cleaning > 0 and maintenance = 0");
        return;
      }
    }
  
    if (bufferType === "MaintenanceOnly") {
      if (maintenanceBufferMins <= 0 || cleaningBufferMins !== 0) {
        toast.error("Maintenance Only requires maintenance > 0 and cleaning = 0");
        return;
      }
    }
  
    if (bufferType === "CleaningAndMaintenance") {
      if (cleaningBufferMins <= 0 || maintenanceBufferMins <= 0) {
        toast.error("Both buffers must be greater than 0");
        return;
      }
    }
    setUpdatingBuffer(true);
    try {
      await roomsApi.updateBuffer(bufferModal.id, bufferForm);
      toast.success("Buffer config updated");
      setBufferModal(null);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Update failed");
    } finally {
      setUpdatingBuffer(false);
    }
  };

  const filtered = filter ? rooms.filter((r) => r.status === filter) : rooms;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">Room Management</h1>
        <Button onClick={() => setCreateModal(true)}>+ Add Room</Button>
      </div>

      {/* Status filter */}
      <div className="flex gap-2 mb-4 flex-wrap">
        <button
          onClick={() => setFilter("")}
          className={`px-3 py-1.5 rounded-full text-sm transition-colors ${filter === "" ? "bg-gold-500 text-navy-900 font-semibold" : "bg-navy-700 text-slate-300 hover:text-white"}`}
        >
          All ({rooms.length})
        </button>
        {STATUSES.map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-3 py-1.5 rounded-full text-sm transition-colors ${filter === s ? "bg-gold-500 text-navy-900 font-semibold" : "bg-navy-700 text-slate-300 hover:text-white"}`}
          >
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
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400">No rooms</td>
                </tr>
              ) : (
                filtered.map((room) => (
                  <tr key={room.id} className="hover:bg-navy-700/30 transition-colors">
                    <td className="px-4 py-3 text-white font-medium">{room.roomNumber}</td>
                    <td className="px-4 py-3 text-slate-300">{room.style}</td>
                    <td className="px-4 py-3 text-slate-300">{room.floor}</td>
                    <td className="px-4 py-3 text-slate-300">{room.capacity}</td>
                    <td className="px-4 py-3 text-gold-400">${room.pricePerNight}</td>
                    <td className="px-4 py-3">{roomStatusBadge(room.status)}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        {room.status !== "Archived" && (
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => {
                              setBufferModal(room);
                              setBufferForm({ cleaningBufferMins: 60, maintenanceBufferMins: 120, bufferType: "CleaningAndMaintenance" });
                            }}
                          >
                            Buffer
                          </Button>
                        )}
                        {room.status === "Archived" ? (
                          <Button
                            size="sm"
                            variant="secondary"
                            loading={restoring === room.id}
                            onClick={() => handleRestore(room.id, room.roomNumber)}
                          >
                            Restore
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="danger"
                            onClick={() => handleArchive(room.id, room.roomNumber)}
                          >
                            Archive
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
          </tbody>
        </table>
      </div>

      {/* Create Room Modal */}
      <Modal open={createModal} onClose={() => setCreateModal(false)} title="Create New Room">
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label>Room Number</label>
              <input value={form.roomNumber} onChange={set("roomNumber")} placeholder="101" required />
            </div>
            <div>
              <label>Floor</label>
              <input type="number" value={form.floor} onChange={set("floor")} min={1} required />
            </div>
          </div>
          <div>
            <label>Style</label>
            <select value={form.style} onChange={set("style")}>
              {STYLES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label>Price per Night ($)</label>
              <input type="number" value={form.pricePerNight} onChange={set("pricePerNight")} min={1} step="0.01" required />
            </div>
            <div>
              <label>Capacity</label>
              <input type="number" value={form.capacity} onChange={set("capacity")} min={1} max={10} required />
            </div>
          </div>
          <div>
            <label>Description</label>
            <textarea
              value={form.description}
              onChange={set("description")}
              rows={2}
              placeholder="Room description…"
              className="bg-navy-700 border border-navy-600 text-white rounded-md px-3 py-2 w-full placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-gold-500/50 focus:border-gold-500"
            />
          </div>
          <div className="flex items-center gap-3">
            <input
              id="smoking"
              type="checkbox"
              checked={form.isSmokingAllowed}
              onChange={(e) => setForm((f) => ({ ...f, isSmokingAllowed: e.target.checked }))}
              className="w-auto border-none focus:ring-0"
            />
            <label htmlFor="smoking" className="mb-0">Smoking allowed</label>
          </div>
          <div className="flex gap-3 justify-end">
            <Button variant="ghost" type="button" onClick={() => setCreateModal(false)}>Cancel</Button>
            <Button type="submit" loading={creating}>Create Room</Button>
          </div>
        </form>
      </Modal>

      {/* Buffer Config Modal */}
      <Modal open={!!bufferModal} onClose={() => setBufferModal(null)} title={`Buffer Config — Room ${bufferModal?.roomNumber}`}>
        <form onSubmit={handleUpdateBuffer} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label>Cleaning Buffer (mins)</label>
              <input
                type="number"
                value={bufferForm.cleaningBufferMins}
                onChange={(e) => setBufferForm((f) => ({ ...f, cleaningBufferMins: Number(e.target.value) }))}
                min={0}
                required
              />
            </div>
            <div>
              <label>Maintenance Buffer (mins)</label>
              <input
                type="number"
                value={bufferForm.maintenanceBufferMins}
                onChange={(e) => setBufferForm((f) => ({ ...f, maintenanceBufferMins: Number(e.target.value) }))}
                min={0}
                required
              />
            </div>
          </div>
          <div>
            <label>Buffer Type</label>
            <select
              value={bufferForm.bufferType}
              onChange={(e) => setBufferForm((f) => ({ ...f, bufferType: e.target.value }))}
            >
              <option value="CleaningOnly">Only Cleaning</option>
              <option value="CleaningAndMaintenance">Cleaning and Meintenance</option>
              <option value="MaintenanceOnly">Only Maintenance</option>
            </select>
          </div>
          <div className="flex gap-3 justify-end">
            <Button variant="ghost" type="button" onClick={() => setBufferModal(null)}>Cancel</Button>
            <Button type="submit" loading={updatingBuffer}>Save Config</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
