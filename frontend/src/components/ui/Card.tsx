import { HTMLAttributes } from "react";

interface Props extends HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export default function Card({ children, className = "", ...rest }: Props) {
  return (
    <div
      className={`bg-navy-800 border border-navy-700 rounded-xl p-6 ${className}`}
      {...rest}
    >
      {children}
    </div>
  );
}

const borderAccent = {
  gold: "border-t-amber-500",
  green: "border-t-emerald-500",
  blue: "border-t-blue-500",
  red: "border-t-red-500",
};

const valueColors = {
  gold: "text-amber-400",
  green: "text-emerald-400",
  blue: "text-blue-400",
  red: "text-red-400",
};

export function StatCard({
  label,
  value,
  color = "gold",
}: {
  label: string;
  value: string | number;
  color?: "gold" | "green" | "blue" | "red";
}) {
  return (
    <div
      className={`bg-navy-800 border border-navy-700 border-t-2 ${borderAccent[color]} rounded-lg px-5 py-4`}
    >
      <p className={`text-2xl font-semibold tabular-nums ${valueColors[color]}`}>{value}</p>
      <p className="text-sm text-slate-400 mt-1">{label}</p>
    </div>
  );
}
