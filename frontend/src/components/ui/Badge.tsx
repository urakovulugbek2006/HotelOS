interface Props {
  label: string;
  variant?: "green" | "yellow" | "red" | "blue" | "gray" | "orange" | "gold";
  dot?: boolean;
}

const styles = {
  green: "bg-emerald-500/12 text-emerald-300 ring-1 ring-inset ring-emerald-500/25",
  yellow: "bg-amber-500/12 text-amber-300 ring-1 ring-inset ring-amber-500/25",
  red: "bg-rose-500/12 text-rose-300 ring-1 ring-inset ring-rose-500/25",
  blue: "bg-sky-500/12 text-sky-300 ring-1 ring-inset ring-sky-500/25",
  gray: "bg-slate-500/12 text-slate-300 ring-1 ring-inset ring-slate-500/25",
  orange: "bg-orange-500/12 text-orange-300 ring-1 ring-inset ring-orange-500/25",
  gold: "bg-gold-500/12 text-gold-300 ring-1 ring-inset ring-gold-500/25",
};

const dotColors = {
  green: "bg-emerald-400",
  yellow: "bg-amber-400",
  red: "bg-rose-400",
  blue: "bg-sky-400",
  gray: "bg-slate-400",
  orange: "bg-orange-400",
  gold: "bg-gold-400",
};

export default function Badge({ label, variant = "gray", dot = true }: Props) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[variant]}`}
    >
      {dot && <span className={`w-1.5 h-1.5 rounded-full ${dotColors[variant]}`} />}
      {label}
    </span>
  );
}

type Variant = "green" | "yellow" | "red" | "blue" | "gray" | "orange" | "gold";

export function roomStatusBadge(status: string) {
  const map: Record<string, Variant> = {
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
  const map: Record<string, Variant> = {
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
  const map: Record<string, Variant> = {
    Received: "yellow",
    Preparing: "orange",
    OutForDelivery: "blue",
    Delivered: "green",
  };
  return <Badge label={status} variant={map[status] ?? "gray"} />;
}

export function priorityBadge(priority: string) {
  const map: Record<string, Variant> = {
    Low: "green",
    Normal: "blue",
    High: "orange",
    Critical: "red",
  };
  return <Badge label={priority} variant={map[priority] ?? "gray"} />;
}
