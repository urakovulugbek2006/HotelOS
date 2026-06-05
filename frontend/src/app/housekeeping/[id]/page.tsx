"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { format } from "date-fns";
import toast from "react-hot-toast";
import { cleaningApi } from "@/lib/api";
import type { CleaningLogResponse } from "@/types";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { PageLoader } from "@/components/ui/LoadingSkeleton";

export default function CleaningDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [log, setLog] = useState<CleaningLogResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    cleaningApi
      .getById(id)
      .then(setLog)
      .catch(() => toast.error("Assignment not found"))
      .finally(() => setLoading(false));
  }, [id]);

  const handleStart = async () => {
    setActionLoading(true);
    try {
      const updated = await cleaningApi.start(id);
      setLog(updated);
      toast.success("Cleaning started");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to start");
    } finally {
      setActionLoading(false);
    }
  };

  const handleComplete = async () => {
    setActionLoading(true);
    try {
      const updated = await cleaningApi.complete(id);
      setLog(updated);
      toast.success("Room marked clean ✨");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to complete");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <PageLoader />;
  if (!log) return <div className="text-center py-20 text-slate-400">Assignment not found</div>;

  const statusVariant =
    log.status === "BeingCleaned" ? "yellow"
    : log.status === "Clean" ? "blue"
    : "green";

  return (
    <div className="max-w-lg">
      <button
        onClick={() => router.back()}
        className="text-slate-400 hover:text-gold-400 text-sm mb-6 transition-colors"
      >
        ← Back
      </button>

      <div className="bg-navy-800 border border-navy-700 rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-bold text-white">Cleaning Assignment</h1>
          <Badge label={log.status} variant={statusVariant} />
        </div>

        <div className="space-y-4 text-sm mb-8">
          <Row label="Assignment ID" value={log.id.slice(0, 8).toUpperCase()} />
          <Row label="Room ID" value={log.roomId} />
          <Row label="Staff ID" value={log.staffId} />
          <Row label="Started" value={format(new Date(log.startedAt), "MMM d, h:mm a")} />
          {log.completedAt && (
            <Row label="Completed" value={format(new Date(log.completedAt), "MMM d, h:mm a")} />
          )}
          {log.durationMins > 0 && (
            <Row label="Duration" value={`${log.durationMins} minutes`} />
          )}
          {log.notes && <Row label="Notes" value={log.notes} />}
        </div>

        <div className="flex gap-3">
          {log.status === "BeingCleaned" && (
            <Button onClick={handleStart} loading={actionLoading} variant="secondary">
              🧹 Mark In Progress
            </Button>
          )}
          {log.status !== "Completed" && log.status !== "Clean" ? (
            <Button onClick={handleComplete} loading={actionLoading}>
              ✅ Mark Complete
            </Button>
          ) : log.status === "Clean" ? (
            <Button onClick={handleComplete} loading={actionLoading}>
              ✅ Mark Complete
            </Button>
          ) : (
            <div className="text-emerald-400 text-sm flex items-center gap-2">
              ✨ Cleaning completed
            </div>
          )}
        </div>
      </div>
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
