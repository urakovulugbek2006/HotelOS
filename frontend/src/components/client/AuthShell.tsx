import Link from "next/link";

interface Props {
  title: string;
  subtitle: string;
  headline?: React.ReactNode;
  blurb?: string;
  children: React.ReactNode;
}

export default function AuthShell({ title, subtitle, headline, blurb, children }: Props) {
  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Brand side */}
      <div className="hidden lg:flex relative flex-col justify-between p-14 overflow-hidden">
        <div className="absolute inset-0 bg-ink-radial" />
        <div className="absolute inset-0 bg-dot-grid opacity-60" />
        <div className="absolute inset-0 bg-hero-glow" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 rounded-full bg-gold-500/10 blur-3xl" />
        <Link href="/" className="relative flex items-center gap-3">
          <span className="grid place-items-center w-10 h-10 rounded-xl bg-gold-sheen text-navy-950 font-display text-2xl font-bold shadow-gold">G</span>
          <span className="font-display text-xl text-white tracking-wide">Grand<span className="text-gold-400">Stay</span></span>
        </Link>
        <div className="relative">
          <p className="eyebrow mb-6"><span className="h-px w-8 bg-gold-500/50" /> Guest Portal</p>
          <h1 className="font-display text-5xl text-white leading-[1.05] mb-5">
            {headline ?? (
              <>
                Your stay,
                <br />
                <span className="text-gradient-gold italic">in your hands.</span>
              </>
            )}
          </h1>
          <p className="text-slate-400 text-[15px] leading-relaxed max-w-sm">
            {blurb ?? "Manage bookings, order room service, and track requests in real time — from anywhere."}
          </p>
        </div>
        <p className="relative text-xs text-slate-500">© {new Date().getFullYear()} GrandStay Hotel</p>
      </div>

      {/* Form side */}
      <div className="flex items-center justify-center p-6 sm:p-10 relative">
        <div className="absolute inset-0 lg:hidden bg-ink-radial" />
        <div className="w-full max-w-sm relative animate-fade-up py-10">
          <Link href="/" className="flex items-center gap-3 mb-10 lg:hidden">
            <span className="grid place-items-center w-9 h-9 rounded-xl bg-gold-sheen text-navy-950 font-display text-xl font-bold">G</span>
            <span className="font-display text-lg text-white tracking-wide">Grand<span className="text-gold-400">Stay</span></span>
          </Link>
          <div className="mb-8">
            <h2 className="font-display text-3xl text-white mb-1.5">{title}</h2>
            <p className="text-slate-400 text-sm">{subtitle}</p>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
