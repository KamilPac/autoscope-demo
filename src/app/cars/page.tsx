import Link from "next/link";
import { redirect } from "next/navigation";
import { CarCard } from "@/components/car-card";
import { CarFilters } from "@/components/car-filters";
import { searchCars } from "@/lib/server/auction-search-service";
import { getAuctionRuntimeState } from "@/lib/server/runtime-state";
import { buildQueryString, parseSearchParams } from "@/lib/server/search-params";
import { getCurrentProfile, getCurrentUser } from "@/lib/server/auth";
import { getUserMaxBidEntries } from "@/lib/server/max-bid-repository";

type SearchParams = {
  [key: string]: string | string[] | undefined;
};

export default async function CarsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login?next=%2Fcars");
  }

  const profile = await getCurrentProfile();
  const shownName = profile?.displayName?.trim() || user || "User";
  const params = parseSearchParams(await searchParams);
  const result = await searchCars(params);
  const bidEntries = await getUserMaxBidEntries(user);
  const maxBidByCarId = new Map(bidEntries.map((entry) => [entry.carId, entry.amountUsd]));
  const runtimeState = getAuctionRuntimeState();
  const returnQuery = buildQueryString(params, result.page);

  return (
    <div className="page-shell min-h-screen py-8">
      <main className="container-wide space-y-6">
        <header className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.14em] text-slate-600">AutoScope Demo</p>
            <h1 className="font-heading text-4xl font-bold text-slate-900">Vehicle Search</h1>
            <p className="text-slate-600">{result.totalItems} matching vehicles in local demo dataset</p>
          </div>

          <div className="flex gap-2">
            <Link className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50" href="/panel">
              {shownName}
            </Link>
            <Link className="btn-primary !bg-slate-700 hover:!bg-slate-900" href="/import-lot">
              Import lot
            </Link>
            <Link className="btn-primary" href="/">
              Back to home
            </Link>
          </div>
        </header>

        {runtimeState.mode === "demo" ? (
          <section className="card-surface border-l-4 border-l-amber-500 bg-amber-50/60 p-4 text-sm text-amber-900">
            <strong>Demo mode:</strong> filters work on local sample dataset. To use real auction data,
            configure <code className="mx-1 rounded bg-amber-100 px-1">.env.local</code> and MarketCheck provider URL.
          </section>
        ) : runtimeState.liveReady ? (
          <section className="card-surface border-l-4 border-l-emerald-600 bg-emerald-50/60 p-4 text-sm text-emerald-900">
            <strong>Live mode active:</strong> app can fetch data from configured provider endpoints.
          </section>
        ) : (
          <section className="card-surface border-l-4 border-l-red-500 bg-red-50/60 p-4 text-sm text-red-900">
            <strong>Live mode selected, but provider not configured:</strong> add
            <code className="mx-1 rounded bg-red-100 px-1">MARKETCHECK_PROVIDER_URL</code>
            in <code className="mx-1 rounded bg-red-100 px-1">.env.local</code>.
          </section>
        )}

        <section className="grid gap-4 lg:grid-cols-[300px_minmax(0,1fr)] lg:gap-6">
          <aside>
            <CarFilters
              initialValues={{
                q: params.q ?? "",
                make: params.make ?? "all",
                source: params.source ?? "all",
                minYear: params.minYear ? String(params.minYear) : "",
                maxYear: params.maxYear ? String(params.maxYear) : "",
                maxMileageKm: params.maxMileageKm ? String(params.maxMileageKm) : "",
                sort: params.sort ?? "ending_soon",
              }}
            />
          </aside>

          <div className="space-y-4">
            {result.items.length > 0 ? (
              <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {result.items.map((car) => (
                  <CarCard key={car.id} car={car} returnQuery={returnQuery} userMaxBid={maxBidByCarId.get(car.id)} />
                ))}
              </section>
            ) : (
              <section className="card-surface p-7 text-center text-slate-700">
                No results for current filters. Try wider year range or clear search term.
              </section>
            )}

            <nav className="flex items-center justify-between rounded-xl border border-[var(--line)] bg-white p-3 text-sm text-slate-700">
              <p>
                Page {result.page} of {result.totalPages}
              </p>

              <div className="flex gap-2">
                {result.page > 1 ? (
                  <Link
                    className="rounded-lg border border-slate-300 px-3 py-1.5 hover:bg-slate-50"
                    href={`/cars?${buildQueryString(params, result.page - 1)}`}
                  >
                    Previous
                  </Link>
                ) : null}

                {result.page < result.totalPages ? (
                  <Link
                    className="rounded-lg border border-slate-300 px-3 py-1.5 hover:bg-slate-50"
                    href={`/cars?${buildQueryString(params, result.page + 1)}`}
                  >
                    Next
                  </Link>
                ) : null}
              </div>
            </nav>
          </div>
        </section>
      </main>
    </div>
  );
}
