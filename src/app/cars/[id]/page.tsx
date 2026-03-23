import Link from "next/link";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { findCarById } from "@/lib/server/auction-search-service";
import { toDisplayImageUrl } from "@/lib/image-url";
import { filterVehicleImages } from "@/lib/vehicle-image-filter";
import { CarImageGallery } from "@/components/car-image-gallery";
import { getCurrentUser } from "@/lib/server/auth";
import { addWatchedCar, isCarWatched, removeWatchedCar } from "@/lib/server/watchlist-repository";
import { getUserMaxBid, setUserMaxBid } from "@/lib/server/max-bid-repository";

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ vin?: string; img?: string; back?: string }>;
};

function formatUsd(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

const BID_STEP_OPTIONS_USD = [100, 500, 1000] as const;

export default async function CarDetailsPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const { vin, img, back } = await searchParams;
  const car = await findCarById(id, { vin });
  const currentUser = await getCurrentUser();
  const backHref = back ? `/cars?${back}` : "/cars";

  if (!car) {
    return (
      <div className="page-shell min-h-screen py-8">
        <main className="container-wide space-y-6">
          <Link className="btn-primary inline-flex" href={backHref}>
            Back to search
          </Link>

          <section className="card-surface p-8">
            <h1 className="font-heading text-3xl font-bold text-slate-900">Details unavailable</h1>
            <p className="mt-3 text-slate-700">
              This listing is visible in search results, but detailed data could not be loaded right now.
            </p>
            <p className="mt-2 text-sm text-slate-500">Listing ID: {id}</p>
          </section>
        </main>
      </div>
    );
  }

  const gallery = filterVehicleImages(car.imageUrls, car).map(toDisplayImageUrl);
  const selectedIdx = Math.max(0, Math.min(gallery.length - 1, Number(img ?? "0") || 0));
  const imageUrl = gallery[selectedIdx] ?? toDisplayImageUrl(car.imageUrl);
  const isWatched = currentUser ? await isCarWatched(currentUser, car.id) : false;
  const userMaxBid = currentUser ? await getUserMaxBid(currentUser, car.id) : null;
  const effectiveMaxBid = userMaxBid ?? car.currentBidUsd;
  const effectiveCurrentBid = userMaxBid ?? car.currentBidUsd;

  async function handleWatch() {
    "use server";

    const user = await getCurrentUser();
    if (!user) {
      redirect(`/login?next=${encodeURIComponent(`/cars/${encodeURIComponent(car.id)}`)}`);
    }

    await addWatchedCar(user, car);
    revalidatePath("/panel");
    revalidatePath(`/cars/${encodeURIComponent(car.id)}`);
  }

  async function handleUnwatch() {
    "use server";

    const user = await getCurrentUser();
    if (!user) {
      redirect(`/login?next=${encodeURIComponent(`/cars/${encodeURIComponent(car.id)}`)}`);
    }

    await removeWatchedCar(user, car.id);
    revalidatePath("/panel");
    revalidatePath(`/cars/${encodeURIComponent(car.id)}`);
  }

  async function handleAdjustMaxBid(formData: FormData) {
    "use server";

    const user = await getCurrentUser();
    if (!user) {
      redirect(`/login?next=${encodeURIComponent(`/cars/${encodeURIComponent(car.id)}`)}`);
    }

    const direction = String(formData.get("direction") ?? "").trim();
    const requestedStep = Number(formData.get("step") ?? BID_STEP_OPTIONS_USD[0]);
    const step = BID_STEP_OPTIONS_USD.includes(requestedStep as (typeof BID_STEP_OPTIONS_USD)[number])
      ? requestedStep
      : BID_STEP_OPTIONS_USD[0];
    const current = (await getUserMaxBid(user, car.id)) ?? car.currentBidUsd;
    const delta = direction === "minus" ? -step : step;
    const next = Math.max(0, current + delta);

    await setUserMaxBid(user, car.id, next, {
      ...car,
      currentBidUsd: next,
    });
    revalidatePath(`/cars/${encodeURIComponent(car.id)}`);
    revalidatePath("/panel");
  }

  async function handleSetMaxBid(formData: FormData) {
    "use server";

    const user = await getCurrentUser();
    if (!user) {
      redirect(`/login?next=${encodeURIComponent(`/cars/${encodeURIComponent(car.id)}`)}`);
    }

    const requestedAmount = Number(formData.get("maxBid") ?? "0");
    const next = Math.max(0, Number.isFinite(requestedAmount) ? Math.round(requestedAmount) : car.currentBidUsd);

    await setUserMaxBid(user, car.id, next, {
      ...car,
      currentBidUsd: next,
    });
    revalidatePath(`/cars/${encodeURIComponent(car.id)}`);
    revalidatePath("/panel");
  }

  return (
    <div className="page-shell min-h-screen py-8">
      <main className="container-wide space-y-6">
        <Link className="btn-primary inline-flex" href={backHref}>
          Back to search
        </Link>

        <section className="card-surface grid overflow-hidden lg:grid-cols-[1.05fr_0.95fr]">
          <div className="space-y-3 bg-slate-100 p-3">
            <CarImageGallery
              carId={car.id}
              vin={car.vin}
              make={car.make}
              model={car.model}
              back={back}
              initialSelectedIndex={selectedIdx}
              gallery={gallery}
              fallbackImage={imageUrl}
            />
          </div>

          <div className="space-y-6 p-6 sm:p-8">
            <header>
              <p className="badge">{car.source.toUpperCase()}</p>
              <h1 className="mt-3 font-heading text-4xl font-bold text-slate-900">
                {car.year} {car.make} {car.model}
              </h1>
              <p className="text-lg text-slate-600">{car.trim}</p>
              <div className="mt-4">
                {isWatched ? (
                  <form action={handleUnwatch}>
                    <button
                      className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-900 hover:bg-amber-100"
                      type="submit"
                    >
                      Remove from observed
                    </button>
                  </form>
                ) : (
                  <form action={handleWatch}>
                    <button
                      className="rounded-lg border border-teal-300 bg-teal-50 px-4 py-2 text-sm font-semibold text-teal-900 hover:bg-teal-100"
                      type="submit"
                    >
                      Observe this car
                    </button>
                  </form>
                )}
              </div>
            </header>

            <div className="grid gap-3 text-sm sm:grid-cols-2">
              <p>
                <strong>VIN:</strong> {car.vin}
              </p>
              <p>
                <strong>Lot:</strong> {car.lotNumber}
              </p>
              <p>
                <strong>Engine:</strong> {car.engine}
              </p>
              <p>
                <strong>Transmission:</strong> {car.transmission}
              </p>
              <p>
                <strong>Drivetrain:</strong> {car.drivetrain}
              </p>
              <p>
                <strong>Mileage:</strong> {car.mileageKm.toLocaleString()} km
              </p>
              <p>
                <strong>Location:</strong> {car.location}
              </p>
              <p>
                <strong>Title:</strong> {car.titleStatus}
              </p>
              <p>
                <strong>Damage:</strong> {car.damage.replaceAll("_", " ")}
              </p>
              <p>
                <strong>Seller:</strong> {car.sellerType}
              </p>
              <p>
                <strong>Run and drive:</strong> {car.runAndDrive ? "Yes" : "No"}
              </p>
              <p>
                <strong>Keys:</strong> {car.hasKeys ? "Yes" : "No"}
              </p>
            </div>

            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-sm text-slate-500">Current bid</p>
              <p className="text-3xl font-bold text-slate-900">{formatUsd(effectiveCurrentBid)}</p>
              <p className="text-sm text-slate-600">
                Estimate range {formatUsd(car.estimateMinUsd)} - {formatUsd(car.estimateMaxUsd)}
              </p>

              <div className="mt-4 rounded-lg border border-slate-200 bg-white p-3">
                <p className="text-xs uppercase tracking-[0.12em] text-slate-500">Your max bid</p>
                <p className="mt-1 text-2xl font-bold text-slate-900">{formatUsd(effectiveMaxBid)}</p>
                <p className="mt-1 text-xs text-slate-500">Use +/- with selected step or set exact amount.</p>

                <div className="mt-3 flex flex-wrap gap-2">
                  {BID_STEP_OPTIONS_USD.map((step) => (
                    <form action={handleAdjustMaxBid} className="flex items-center gap-1" key={`step-${step}`}>
                      <input name="step" type="hidden" value={String(step)} />
                      <button
                        className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-bold text-slate-700 hover:bg-slate-50"
                        name="direction"
                        value="minus"
                        type="submit"
                      >
                        -{formatUsd(step)}
                      </button>
                      <button
                        className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-bold text-slate-700 hover:bg-slate-50"
                        name="direction"
                        value="plus"
                        type="submit"
                      >
                        +{formatUsd(step)}
                      </button>
                    </form>
                  ))}
                </div>

                <form action={handleSetMaxBid} className="mt-3 flex flex-wrap items-center gap-2">
                  <label className="text-xs font-medium text-slate-600" htmlFor="maxBidInput">
                    Set amount
                  </label>
                  <input
                    className="w-40 rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-900"
                    defaultValue={String(effectiveMaxBid)}
                    id="maxBidInput"
                    min="0"
                    name="maxBid"
                    step="100"
                    type="number"
                  />
                  <button
                    className="rounded-lg border border-teal-300 bg-teal-50 px-3 py-1.5 text-sm font-semibold text-teal-900 hover:bg-teal-100"
                    type="submit"
                  >
                    Save amount
                  </button>
                </form>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
