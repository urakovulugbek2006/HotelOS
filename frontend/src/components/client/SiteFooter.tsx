import Link from "next/link";

export default function SiteFooter() {
  return (
    <footer id="contact" className="relative mt-24 border-t border-white/[0.06]">
      <div className="max-w-7xl mx-auto px-5 sm:px-8 py-14">
        <div className="grid gap-10 md:grid-cols-4">
          <div className="md:col-span-2">
            <Link href="/" className="flex items-center gap-2.5 mb-4">
              <span className="grid place-items-center w-9 h-9 rounded-xl bg-gold-sheen text-navy-950 font-display text-xl font-bold">
                G
              </span>
              <span className="font-display text-xl text-white tracking-wide">
                Grand<span className="text-gold-400">Stay</span>
              </span>
            </Link>
            <p className="text-slate-400 text-sm leading-relaxed max-w-sm">
              A four-star retreat where every detail is connected in real time —
              from your reservation to room service to checkout.
            </p>
          </div>

          <div>
            <h4 className="text-white font-semibold text-sm mb-4">Explore</h4>
            <ul className="space-y-2.5 text-sm">
              <li><Link href="/rooms" className="text-slate-400 hover:text-gold-300 transition-colors">Rooms &amp; Suites</Link></li>
              <li><Link href="/#amenities" className="text-slate-400 hover:text-gold-300 transition-colors">Amenities</Link></li>
              <li><Link href="/guest" className="text-slate-400 hover:text-gold-300 transition-colors">My Stay</Link></li>
              <li><Link href="/login" className="text-slate-400 hover:text-gold-300 transition-colors">Staff Portal</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold text-sm mb-4">Contact</h4>
            <ul className="space-y-2.5 text-sm text-slate-400">
              <li>120 Riverside Avenue</li>
              <li>Reservations: +1 (555) 0100</li>
              <li>stay@grandstay.com</li>
            </ul>
          </div>
        </div>

        <div className="hairline my-10" />
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} GrandStay Hotel. All rights reserved.</p>
          <p className="flex items-center gap-2">
            Powered by <span className="text-gold-400 font-medium">HotelOS</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
