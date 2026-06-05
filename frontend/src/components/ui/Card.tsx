import { HTMLAttributes } from "react";

interface Props extends HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  hover?: boolean;
}

export default function Card({ children, className = "", hover, ...rest }: Props) {
  return (
    <div
      className={`glass rounded-2xl p-6 shadow-card ${
        hover ? "transition-all duration-300 hover:border-white/15 hover:-translate-y-0.5" : ""
      } ${className}`}
      {...rest}
    >
      {children}
    </div>
  );
}

const accents = {
  gold: { bar: "from-gold-400 to-gold-600", value: "text-gold-300", glow: "bg-gold-500/10" },
  green: { bar: "from-emerald-300 to-emerald-600", value: "text-emerald-300", glow: "bg-emerald-500/10" },
  blue: { bar: "from-sky-300 to-blue-600", value: "text-sky-300", glow: "bg-sky-500/10" },
  red: { bar: "from-rose-300 to-red-600", value: "text-rose-300", glow: "bg-rose-500/10" },
};

export function StatCard({
  label,
  value,
  color = "gold",
  hint,
}: {
  label: string;
  value: string | number;
  color?: "gold" | "green" | "blue" | "red";
  hint?: string;
}) {
  const a = accents[color];
  return (
    <div className="group relative glass rounded-2xl px-5 py-5 overflow-hidden shadow-card transition-all duration-300 hover:border-white/15 hover:-translate-y-0.5">
      {/* corner glow */}
      <div className={`absolute -right-6 -top-6 w-24 h-24 rounded-full blur-2xl ${a.glow}`} />
      <div className={`absolute left-0 top-0 h-full w-[3px] bg-gradient-to-b ${a.bar}`} />
      <p className={`text-3xl font-semibold tabular-nums tracking-tight ${a.value}`}>{value}</p>
      <p className="text-sm text-slate-400 mt-1.5">{label}</p>
      {hint && <p className="text-[11px] text-slate-500 mt-0.5">{hint}</p>}
    </div>
  );
}
