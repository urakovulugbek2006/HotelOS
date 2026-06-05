interface Props {
  label: string;
  variant?: "green" | "yellow" | "red" | "blue" | "gray" | "orange" | "gold";
}

const styles = {
  green: "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30",
  yellow: "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30",
  red: "bg-red-500/20 text-red-400 border border-red-500/30",
  blue: "bg-blue-500/20 text-blue-400 border border-blue-500/30",
  gray: "bg-slate-500/20 text-slate-400 border border-slate-500/30",
  orange: "bg-orange-500/20 text-orange-400 border border-orange-500/30",
  gold: "bg-yellow-600/20 text-yellow-300 border border-yellow-600/30",
};

export default function Badge({ label, variant = "gray" }: Props) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${styles[variant]}`}>
      {label}
    </span>
  );
}

export function roomStatusBadge(status: string) {
  const map: Record<string, "green" | "yellow" | "red" | "blue" | "gray" | "orange" | "gold"> = {
    Available: "green",
    Reserved: "gold",
    Cleaning: "yellow",
    OOS: "red",
    Active: "blue",
    Archived: "gray",
  };
  return <Badge label={status} variant={map[status] ?? "gray"} />;
}

export function bookingStatusBadge(status: string) {
  const map: Record<string, "green" | "yellow" | "red" | "blue" | "gray" | "orange"> = {
    PendingPayment: "yellow",
    Confirmed: "blue",
    Active: "green",
    Cancelled: "gray",
    TimedOut: "red",
    Completed: "gray",
  };
  return <Badge label={status} variant={map[status] ?? "gray"} />;
}

export function orderStatusBadge(status: string) {
  const map: Record<string, "green" | "yellow" | "red" | "blue" | "gray" | "orange"> = {
    Received: "yellow",
    Preparing: "orange",
    OutForDelivery: "blue",
    Delivered: "green",
  };
  return <Badge label={status} variant={map[status] ?? "gray"} />;
}

export function priorityBadge(priority: string) {
  const map: Record<string, "green" | "yellow" | "red" | "blue" | "gray" | "orange"> = {
    Low: "green",
    Normal: "blue",
    High: "orange",
    Critical: "red",
  };
  return <Badge label={priority} variant={map[priority] ?? "gray"} />;
}
