import Link from "next/link";
import Image from "next/image";
import { findCarById } from "@/lib/server/auction-search-service";
import { toDisplayImageUrl } from "@/lib/image-url";

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

export default async function CarDetailsPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const { vin, img, back } = await searchParams;
  const car = await findCarById(id, { vin });
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

  const gallery = (car.imageUrls && car.imageUrls.length > 0 ? car.imageUrls : [car.imageUrl]).map(toDisplayImageUrl);
  const selectedIdx = Math.max(0, Math.min(gallery.length - 1, Number(img ?? "0") || 0));
  const imageUrl = gallery[selectedIdx] ?? toDisplayImageUrl(car.imageUrl);
  const viewerHref = `/cars/${encodeURIComponent(car.id)}/viewer?${new URLSearchParams({
    vin: car.vin,
    img: String(selectedIdx),
    ...(back ? { back } : {}),
  }).toString()}`;

  return (
    <div className="page-shell min-h-screen py-8">
      <main className="container-wide space-y-6">
        <Link className="btn-primary inline-flex" href={backHref}>
          Back to search
        </Link>

        <section className="card-surface grid overflow-hidden lg:grid-cols-[1.05fr_0.95fr]">
          <div className="space-y-3 bg-slate-100 p-3">
            <Link
              className="group block"
              href={viewerHref}
              target="_blank"
              rel="noopener noreferrer"
              title="Open full-size gallery in new tab"
            >
              <div className="relative min-h-72 overflow-hidden rounded-xl bg-slate-200">
                <Image
                  className="object-cover transition duration-300 group-hover:scale-[1.01]"
                  src={imageUrl}
                  alt={`${car.make} ${car.model}`}
                  fill
                  unoptimized
                  sizes="(max-width: 1024px) 100vw, 55vw"
                />
              </div>
              <p className="mt-2 text-xs font-medium uppercase tracking-[0.12em] text-slate-500">
                Click image to open full-size viewer
              </p>
            </Link>

            {gallery.length > 1 ? (
              <div className="grid grid-cols-5 gap-2 sm:grid-cols-6 lg:grid-cols-5">
                {gallery.slice(0, 18).map((photo, index) => (
                  <Link
                    key={`${car.id}-img-${index}`}
                    className={`relative block aspect-square overflow-hidden rounded-lg border ${
                      index === selectedIdx ? "border-teal-500" : "border-slate-300"
                    }`}
                    href={`/cars/${encodeURIComponent(car.id)}?${new URLSearchParams({
                      vin: car.vin,
                      img: String(index),
                      ...(back ? { back } : {}),
                    }).toString()}`}
                  >
                    <Image
                      className="object-cover"
                      src={photo}
                      alt={`${car.make} ${car.model} photo ${index + 1}`}
                      fill
                      unoptimized
                      sizes="140px"
                    />
                  </Link>
                ))}
              </div>
            ) : null}
          </div>

          <div className="space-y-6 p-6 sm:p-8">
            <header>
              <p className="badge">{car.source.toUpperCase()}</p>
              <h1 className="mt-3 font-heading text-4xl font-bold text-slate-900">
                {car.year} {car.make} {car.model}
              </h1>
              <p className="text-lg text-slate-600">{car.trim}</p>
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
              <p className="text-3xl font-bold text-slate-900">{formatUsd(car.currentBidUsd)}</p>
              <p className="text-sm text-slate-600">
                Estimate range {formatUsd(car.estimateMinUsd)} - {formatUsd(car.estimateMaxUsd)}
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
