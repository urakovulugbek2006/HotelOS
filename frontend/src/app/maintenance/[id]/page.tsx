"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { format } from "date-fns";
import toast from "react-hot-toast";
import { ticketsApi } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import type { TicketResponse } from "@/types";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import { priorityBadge } from "@/components/ui/Badge";
import { PageLoader } from "@/components/ui/LoadingSkeleton";

export default function TicketDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuthStore();

  const [ticket, setTicket] = useState<TicketResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [resolving, setResolving] = useState(false);
  const [assignModal, setAssignModal] = useState(false);
  const [staffId, setStaffId] = useState("");
  const [assigning, setAssigning] = useState(false);

  useEffect(() => {
    ticketsApi
      .getById(id)
      .then(setTicket)
      .catch(() => toast.error("Ticket not found"))
      .finally(() => setLoading(false));
  }, [id]);

  const handleResolve = async () => {
    setResolving(true);
    try {
      const t = await ticketsApi.resolve(id);
      setTicket(t);
      toast.success("Ticket resolved ✅");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to resolve");
    } finally {
      setResolving(false);
    }
  };

  const handleAssign = async () => {
    if (!staffId.trim()) return;
    setAssigning(true);
    try {
      const t = await ticketsApi.assign(id, staffId.trim());
      setTicket(t);
      setAssignModal(false);
      toast.success("Staff assigned");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Assign failed");
    } finally {
      setAssigning(false);
    }
  };

  if (loading) return <PageLoader />;
  if (!ticket) return <div className="text-center py-20 text-slate-400">Ticket not found</div>;

  const isManager = user?.role === "Manager";
  const isMaintenance = user?.role === "MaintenanceStaff";
  const isResolved = ticket.status === "Resolved";

  return (
    <div className="max-w-xl">
      <button
        onClick={() => router.back()}
        className="text-slate-400 hover:text-gold-400 text-sm mb-6 transition-colors"
      >
        ← Back
      </button>

      <div className="bg-navy-800 border border-navy-700 rounded-xl p-6">
        <div className="flex items-start justify-between mb-6">
          <h1 className="text-xl font-bold text-white">Maintenance Ticket</h1>
          <div className="flex gap-2">
            {priorityBadge(ticket.priority)}
            <Badge
              label={ticket.status}
              variant={isResolved ? "green" : "yellow"}
            />
          </div>
        </div>

        <div className="space-y-4 text-sm mb-8">
          <Row label="Ticket ID" value={ticket.id.slice(0, 8).toUpperCase()} />
          <Row label="Room ID" value={ticket.roomId} />
          <Row label="Reported by" value={ticket.reportedBy} />
          <div>
            <p className="text-slate-400 mb-1">Description</p>
            <p className="text-white bg-navy-700 rounded-lg p-3">{ticket.description}</p>
          </div>
          <Row label="Est. duration" value={`${ticket.estimatedMins} min`} />
          {ticket.assignedStaffId && (
            <Row label="Assigned staff" value={ticket.assignedStaffId} />
          )}
          <Row label="Created" value={format(new Date(ticket.createdAt), "MMM d, yyyy h:mm a")} />
          {ticket.resolvedAt && (
            <Row label="Resolved" value={format(new Date(ticket.resolvedAt), "MMM d, yyyy h:mm a")} />
          )}
        </div>

        {!isResolved && (
          <div className="flex gap-3">
            {(isMaintenance || isManager) && (
              <Button onClick={handleResolve} loading={resolving}>
                ✅ Resolve Ticket
              </Button>
            )}
            {isManager && (
              <Button
                variant="secondary"
                onClick={() => setAssignModal(true)}
              >
                👤 Assign Staff
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Assign Modal */}
      <Modal
        open={assignModal}
        onClose={() => setAssignModal(false)}
        title="Assign Staff"
      >
        <div className="space-y-4">
          <div>
            <label>Staff member ID (UUID)</label>
            <input
              value={staffId}
              onChange={(e) => setStaffId(e.target.value)}
              placeholder="Staff account UUID"
            />
          </div>
          <div className="flex gap-3 justify-end">
            <Button variant="ghost" onClick={() => setAssignModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleAssign} loading={assigning}>
              Assign
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-slate-400">{label}</span>
      <span className="text-white font-medium text-right max-w-[60%] break-all">{value}</span>
    </div>
  );
}
