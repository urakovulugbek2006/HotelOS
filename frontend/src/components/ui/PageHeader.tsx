interface Props {
  title: string;
  subtitle?: string;
  live?: boolean;
  actions?: React.ReactNode;
}

export default function PageHeader({ title, subtitle, live, actions }: Props) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
      <div>
        <h1 className="font-display text-3xl sm:text-[2rem] leading-tight text-white tracking-tight">
          {title}
        </h1>
        {subtitle && <p className="text-slate-400 text-sm mt-1.5">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-3">
        {live && (
          <span className="inline-flex items-center gap-2 text-xs text-emerald-300 bg-emerald-500/10 ring-1 ring-inset ring-emerald-500/25 rounded-full px-3 py-1.5">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
            </span>
            Live
          </span>
        )}
        {actions}
      </div>
    </div>
  );
}
