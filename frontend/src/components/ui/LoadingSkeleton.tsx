const shimmer =
  "relative overflow-hidden bg-white/[0.04] before:absolute before:inset-0 " +
  "before:-translate-x-full before:animate-[shimmer_1.6s_infinite] " +
  "before:bg-gradient-to-r before:from-transparent before:via-white/[0.06] before:to-transparent";

export function SkeletonRow({ cols = 4 }: { cols?: number }) {
  return (
    <tr>
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-4 py-3.5">
          <div className={`h-4 rounded ${shimmer}`} />
        </td>
      ))}
    </tr>
  );
}

export function SkeletonCard() {
  return (
    <div className="glass rounded-2xl p-6">
      <div className={`h-5 rounded w-2/3 mb-3 ${shimmer}`} />
      <div className={`h-4 rounded w-1/2 mb-2 ${shimmer}`} />
      <div className={`h-4 rounded w-3/4 ${shimmer}`} />
    </div>
  );
}

export function SkeletonGrid({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

export function PageLoader() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <span className="absolute inset-0 rounded-full bg-gold-500/40 animate-pulse-ring" />
          <svg className="animate-spin h-9 w-9 text-gold-400 relative" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
            <path className="opacity-90" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
        </div>
        <p className="text-slate-400 text-sm tracking-wide">Loading…</p>
      </div>
    </div>
  );
}
