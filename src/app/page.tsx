import Link from "next/link";
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
      <main className="container-wide grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-stretch">
        <section className="card-surface p-7 sm:p-10">
          {logoutFlag ? (
            <p className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-800">
              You have been signed out successfully.
            </p>
          ) : null}

          <p className="mb-4 inline-flex rounded-full bg-teal-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-teal-800">
            Local Demo
          </p>

          <h1 className="font-heading text-4xl font-bold leading-tight text-slate-900 sm:text-5xl">
            AutoScope
            <span className="block text-teal-700">Auction Search Workspace</span>
          </h1>

          <p className="mt-5 max-w-xl text-lg text-slate-600">
            Demo lets you search vehicles inspired by US auction workflows. You can filter by make,
            source, year, mileage, and inspect every lot detail on a dedicated page.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
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
              See stack and goals
            </a>
          </div>
        </section>

        <aside className="card-surface p-7 sm:p-8" id="stack">
          <h2 className="font-heading text-2xl font-bold text-slate-900">Demo scope</h2>
          <ul className="mt-4 space-y-3 text-slate-700">
            <li>Search and filter vehicle catalog</li>
            <li>Car cards with lot metadata</li>
            <li>Detailed lot page with business fields</li>
            <li>Responsive layout for desktop and mobile</li>
          </ul>

          <h3 className="mt-7 font-heading text-xl font-semibold text-slate-900">Current frontend stack</h3>
          <p className="mt-2 text-slate-700">Next.js App Router, TypeScript, Tailwind CSS.</p>
        </aside>
      </main>
    </div>
  );
}
