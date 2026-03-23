import Image from "next/image";
import Link from "next/link";

export function AppBrandBanner() {
  return (
    <header className="border-b border-[var(--line)] bg-slate-950 text-white shadow-[0_6px_30px_rgba(2,6,23,0.38)]">
      <div className="container-wide flex flex-wrap items-center justify-between gap-3 py-3">
        <Link className="group inline-flex items-center gap-3" href="/">
          <span className="relative h-10 w-10 overflow-hidden rounded-xl border border-cyan-400/40 bg-slate-900">
            <Image src="/icons/car-badge.svg" alt="AutoSearch car icon" fill className="object-cover" sizes="40px" priority />
          </span>
          <span>
            <span className="block font-heading text-2xl font-bold tracking-wide text-white">AutoSearch</span>
            <span className="block text-[11px] uppercase tracking-[0.16em] text-cyan-300">Race-ready auction intelligence</span>
          </span>
        </Link>

        <nav className="flex flex-wrap items-center gap-2 text-sm">
          <Link className="rounded-lg border border-cyan-400/30 bg-cyan-500/10 px-3 py-1.5 font-semibold text-cyan-100 hover:bg-cyan-400/20" href="/cars">
            Vehicle search
          </Link>
          <Link className="rounded-lg border border-indigo-400/30 bg-indigo-500/10 px-3 py-1.5 font-semibold text-indigo-100 hover:bg-indigo-400/20" href="/panel">
            Panel
          </Link>
          <Link className="rounded-lg border border-amber-400/40 bg-amber-500/10 px-3 py-1.5 font-semibold text-amber-100 hover:bg-amber-400/20" href="/import-lot">
            Import lot
          </Link>
        </nav>
      </div>
    </header>
  );
}
