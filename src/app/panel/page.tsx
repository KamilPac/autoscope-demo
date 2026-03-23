import Link from "next/link";
import { cookies } from "next/headers";
import Image from "next/image";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { AUTH_COOKIE_NAME, AUTH_ROLE_COOKIE_NAME, PROFILE_COOKIE_NAME } from "@/lib/auth-constants";
import { getCurrentProfile, getCurrentRole, getCurrentUser } from "@/lib/server/auth";
import { AccountSettingsForm } from "@/components/account-settings-form";
import { getWatchedCarsWithMeta, removeWatchedCar } from "@/lib/server/watchlist-repository";
import { getUserMaxBidEntries } from "@/lib/server/max-bid-repository";
import { filterVehicleImages } from "@/lib/vehicle-image-filter";
import { toDisplayImageUrl } from "@/lib/image-url";

type SearchParams = {
  tab?: string;
};

function formatUsd(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

async function handleLogout() {
  "use server";
  const store = await cookies();
  store.delete(AUTH_COOKIE_NAME);
  store.delete(AUTH_ROLE_COOKIE_NAME);
  store.delete(PROFILE_COOKIE_NAME);
  redirect("/?logout=1");
}

export default async function UserPanelPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const user = await getCurrentUser();
  const role = await getCurrentRole();
  const profile = await getCurrentProfile();
  const query = await searchParams;
  const shownName = profile?.displayName?.trim() || user || "User";
  const roleLabel = role === "admin" ? "Administrator" : "User";
  const requestedTab = (query.tab ?? "profile").toLowerCase();
  const activeTab = requestedTab === "observed" || requestedTab === "bids" ? requestedTab : "profile";
  const watchedEntries = user ? await getWatchedCarsWithMeta(user) : [];
  const watchedCount = watchedEntries.length;
  const bidEntries = user ? await getUserMaxBidEntries(user) : [];
  const bidsCount = bidEntries.length;

  async function handleRemoveObserved(formData: FormData) {
    "use server";

    const currentUser = await getCurrentUser();
    if (!currentUser) {
      redirect("/login?next=%2Fpanel%3Ftab%3Dobserved");
    }

    const carId = String(formData.get("carId") ?? "").trim();
    if (!carId) {
      return;
    }

    await removeWatchedCar(currentUser, carId);
    revalidatePath("/panel");
  }

  return (
    <div className="page-shell min-h-screen py-10 lg:py-16">
      <main className="container-wide max-w-3xl space-y-6">
        <section className="card-surface p-7 sm:p-8">
          <p className="mb-2 text-xs uppercase tracking-[0.14em] text-slate-600">User panel</p>
          <h1 className="font-heading text-3xl font-bold text-slate-900">Welcome {shownName}</h1>
          <p className="mt-2 text-slate-600">You can now access search and filters available for your account.</p>
          <p className="mt-1 text-sm text-slate-500">Logged in as: {user ?? "unknown"}</p>
          <p className="mt-1 text-sm text-slate-500">Role: {roleLabel}</p>

          <div className="mt-7 flex flex-wrap gap-3">
            <Link className="btn-primary" href="/cars">
              Open vehicle search
            </Link>
            <Link className="btn-primary !bg-slate-700 hover:!bg-slate-900" href="/import-lot">
              Import lot
            </Link>
            <Link className="btn-primary !bg-amber-600 hover:!bg-amber-700" href="/">
              Home
            </Link>
          </div>

          <form className="mt-6" action={handleLogout}>
            <button className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50" type="submit">
              Sign out
            </button>
          </form>

          <div className="mt-8 flex flex-wrap gap-2">
            <Link
              className={`rounded-lg px-4 py-2 text-sm font-semibold ${
                activeTab === "profile" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
              href="/panel?tab=profile"
            >
              Profile
            </Link>
            <Link
              className={`rounded-lg px-4 py-2 text-sm font-semibold ${
                activeTab === "observed" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
              href="/panel?tab=observed"
            >
              Observed ({watchedCount})
            </Link>
            <Link
              className={`rounded-lg px-4 py-2 text-sm font-semibold ${
                activeTab === "bids" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
              href="/panel?tab=bids"
            >
              Bids ({bidsCount})
            </Link>
          </div>

          {activeTab === "profile" ? (
            <section className="mt-8 rounded-xl border border-slate-200 bg-slate-50 p-4">
              <h2 className="font-heading text-xl font-semibold text-slate-900">Account settings</h2>
              <p className="mt-1 text-sm text-slate-600">Simple profile settings used in the app header and panel.</p>
              <AccountSettingsForm initialDisplayName={profile?.displayName ?? ""} roleLabel={roleLabel} />
            </section>
          ) : null}

          {activeTab === "observed" ? (
            <section className="mt-8 rounded-xl border border-slate-200 bg-slate-50 p-4">
              <h2 className="font-heading text-xl font-semibold text-slate-900">Observed cars</h2>
              <p className="mt-1 text-sm text-slate-600">Cars you marked from details page are listed below.</p>

              {watchedEntries.length === 0 ? (
                <p className="mt-4 rounded-lg border border-slate-200 bg-white p-3 text-sm text-slate-600">No observed cars yet.</p>
              ) : (
                <div className="mt-4 space-y-3">
                  {watchedEntries.map((entry) => {
                    const { car, addedAt } = entry;
                    const gallery = filterVehicleImages(car.imageUrls, car).map(toDisplayImageUrl);
                    const imageUrl = gallery[0] ?? toDisplayImageUrl(car.imageUrl);
                    const addedLabel = new Intl.DateTimeFormat("en-US", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    }).format(new Date(addedAt));

                    return (
                      <article className="rounded-xl border border-slate-200 bg-white p-3" key={car.id}>
                        <div className="grid gap-3 sm:grid-cols-[120px_minmax(0,1fr)]">
                          <div className="relative h-24 overflow-hidden rounded-lg bg-slate-200">
                            <Image
                              className="object-cover"
                              src={imageUrl}
                              alt={`${car.make} ${car.model}`}
                              fill
                              unoptimized
                              sizes="120px"
                            />
                          </div>

                          <div className="space-y-2">
                            <p className="text-xs uppercase tracking-[0.12em] text-slate-500">Lot {car.lotNumber}</p>
                            <h3 className="font-heading text-xl font-semibold text-slate-900">
                              {car.year} {car.make} {car.model}
                            </h3>
                            <p className="text-sm text-slate-600">{car.trim}</p>
                            <p className="text-xs text-slate-500">Added: {addedLabel}</p>

                            <div className="flex flex-wrap gap-2 pt-1">
                              <Link
                                className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                                href={`/cars/${encodeURIComponent(car.id)}?${new URLSearchParams({ vin: car.vin }).toString()}`}
                              >
                                Open details
                              </Link>

                              <form action={handleRemoveObserved}>
                                <input name="carId" type="hidden" value={car.id} />
                                <button
                                  className="rounded-lg border border-red-300 bg-red-50 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-100"
                                  type="submit"
                                >
                                  Remove
                                </button>
                              </form>
                            </div>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </section>
          ) : null}

          {activeTab === "bids" ? (
            <section className="mt-8 rounded-xl border border-slate-200 bg-slate-50 p-4">
              <h2 className="font-heading text-xl font-semibold text-slate-900">Bidding plan</h2>
              <p className="mt-1 text-sm text-slate-600">Cars where you set your max bid amount.</p>

              {bidEntries.length === 0 ? (
                <p className="mt-4 rounded-lg border border-slate-200 bg-white p-3 text-sm text-slate-600">No bids set yet.</p>
              ) : (
                <div className="mt-4 space-y-3">
                  {bidEntries.map((entry) => {
                    const car = entry.car;
                    const updatedLabel = new Intl.DateTimeFormat("en-US", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    }).format(new Date(entry.updatedAt));

                    const imageUrl = car
                      ? (filterVehicleImages(car.imageUrls, car).map(toDisplayImageUrl)[0] ?? toDisplayImageUrl(car.imageUrl))
                      : "";

                    return (
                      <article className="rounded-xl border border-slate-200 bg-white p-3" key={entry.carId}>
                        <div className="grid gap-3 sm:grid-cols-[120px_minmax(0,1fr)]">
                          <div className="relative h-24 overflow-hidden rounded-lg bg-slate-200">
                            {imageUrl ? (
                              <Image
                                className="object-cover"
                                src={imageUrl}
                                alt={car ? `${car.make} ${car.model}` : entry.carId}
                                fill
                                unoptimized
                                sizes="120px"
                              />
                            ) : null}
                          </div>

                          <div className="space-y-2">
                            <p className="text-xs uppercase tracking-[0.12em] text-slate-500">{car ? `Lot ${car.lotNumber}` : `ID ${entry.carId}`}</p>
                            <h3 className="font-heading text-xl font-semibold text-slate-900">
                              {car ? `${car.year} ${car.make} ${car.model}` : "Saved bid"}
                            </h3>
                            {car ? <p className="text-sm text-slate-600">{car.trim}</p> : null}
                            <p className="text-sm font-semibold text-teal-700">Your max bid: {formatUsd(entry.amountUsd)}</p>
                            <p className="text-xs text-slate-500">Updated: {updatedLabel}</p>

                            {car ? (
                              <div className="pt-1">
                                <Link
                                  className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                                  href={`/cars/${encodeURIComponent(car.id)}?${new URLSearchParams({ vin: car.vin }).toString()}`}
                                >
                                  Open details
                                </Link>
                              </div>
                            ) : null}
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </section>
          ) : null}

          {role === "admin" ? (
            <section className="mt-8 rounded-xl border border-slate-200 bg-white p-4">
              <h2 className="font-heading text-xl font-semibold text-slate-900">Admin cars panel</h2>
              <p className="mt-1 text-sm text-slate-600">Open a dedicated admin view to browse and delete single cars.</p>
              <Link className="btn-primary mt-4 inline-flex" href="/panel/admin-cars">
                Open admin cars panel
              </Link>
            </section>
          ) : null}
        </section>
      </main>
    </div>
  );
}
