import Link from "next/link";
import Image from "next/image";
import { getCurrentUser } from "@/lib/server/auth";

type SearchParams = {
  [key: string]: string | string[] | undefined;
};

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function Home({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;
  const logoutFlag = firstParam(params.logout) === "1";
  const user = await getCurrentUser();

  return (
    <div className="page-shell min-h-screen py-10 lg:py-16">
      <main className="container-wide grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-stretch">
        <section className="card-surface relative overflow-hidden p-7 sm:p-10">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(20,184,166,0.18),transparent_45%),radial-gradient(circle_at_bottom_right,rgba(245,158,11,0.14),transparent_45%)]" />

          {logoutFlag ? (
            <p className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-800">
              You have been signed out successfully.
            </p>
          ) : null}

          <div className="relative z-10">
            <p className="mb-4 inline-flex rounded-full bg-teal-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-teal-800">
              Auction Intelligence Platform
            </p>

            <h1 className="font-heading text-4xl font-bold leading-tight text-slate-900 sm:text-5xl">
              AutoSearch
              <span className="block text-teal-700">Find, compare, and track auction cars faster</span>
            </h1>

            <p className="mt-5 max-w-xl text-lg text-slate-700">
              AutoSearch helps you discover auction vehicles, inspect complete lot details, observe chosen cars,
              and plan your max bid before live auctions start.
            </p>

            <p className="mt-4 inline-flex rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">
              Logged in as: <strong className="ml-1">{user ?? "guest"}</strong>
            </p>
          </div>

          <div className="relative z-10 mt-8 flex flex-wrap gap-3">
            <Link className="btn-primary" href="/cars">
              Open vehicle search
            </Link>
            <Link className="btn-primary !bg-indigo-700 hover:!bg-indigo-900" href={user ? "/panel" : "/login"}>
              {user ? "Open user panel" : "Sign in"}
            </Link>
            <Link className="btn-primary !bg-slate-700 hover:!bg-slate-900" href="/import-lot">
              Import lot by URL
            </Link>
            <a className="btn-primary !bg-amber-600 hover:!bg-amber-700" href="#stack">
              How it works
            </a>
          </div>
        </section>

        <aside className="card-surface p-7 sm:p-8" id="stack">
          <div className="relative mb-5 aspect-[16/10] overflow-hidden rounded-xl bg-slate-200">
            <Image
              src="https://hips.hearstapps.com/hmg-prod/images/2024-ferrari-sf90-xx-stradale-111-654a677a25e4c.jpg?crop=1.00xw:0.752xh;0,0.0721xh&resize=980:*"
              alt="Ferrari SF90 XX Stradale on race track"
              fill
              unoptimized
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 36vw"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/45 to-transparent" />
            <p className="absolute right-3 bottom-3 rounded-full bg-black/45 px-3 py-1 text-xs font-semibold uppercase tracking-[0.1em] text-white">
              Performance First
            </p>
          </div>

          <h2 className="font-heading text-2xl font-bold text-slate-900">How AutoSearch works</h2>
          <ul className="mt-4 space-y-3 text-slate-700">
            <li>1. Search by lot number, VIN, make, source, year, and mileage.</li>
            <li>2. Open detailed lot view with technical specs, damage data, and full gallery.</li>
            <li>3. Observe selected cars and keep them in your personal panel.</li>
            <li>4. Set your max bid strategy and track it across details, cards, and panel.</li>
            <li>5. Import lots directly by URL to expand your private dataset.</li>
          </ul>

          <h3 className="mt-7 font-heading text-xl font-semibold text-slate-900">Technology</h3>
          <p className="mt-2 text-slate-700">Next.js App Router, TypeScript, Tailwind CSS, and Playwright-ready architecture.</p>
        </aside>
      </main>
    </div>
  );
}
