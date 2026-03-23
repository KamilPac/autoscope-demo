import Link from "next/link";
import { CarItem } from "@/lib/types";
import { toDisplayImageUrl } from "@/lib/image-url";
import { filterVehicleImages } from "@/lib/vehicle-image-filter";
import { CarCardImage } from "@/components/car-card-image";

function formatUsd(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

type CarCardProps = {
  car: CarItem;
  returnQuery?: string;
  userMaxBid?: number;
};

export function CarCard({ car, returnQuery, userMaxBid }: CarCardProps) {
  const gallery = filterVehicleImages(car.imageUrls, car).map(toDisplayImageUrl);
  const imageUrl = gallery[0] ?? toDisplayImageUrl(car.imageUrl);
  const effectiveCurrentBid = typeof userMaxBid === "number" ? userMaxBid : car.currentBidUsd;
  const detailParams = new URLSearchParams({
    vin: car.vin,
    ...(returnQuery ? { back: returnQuery } : {}),
  }).toString();

  return (
    <article className="card-surface overflow-hidden">
      <div className="relative">
        <CarCardImage carId={car.id} make={car.make} model={car.model} gallery={gallery} fallbackImage={imageUrl} />
        <span className="badge absolute top-3 left-3">{car.source.toUpperCase()}</span>
      </div>

      <div className="space-y-4 p-4">
        <div>
          <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Lot {car.lotNumber}</p>
          <h3 className="font-heading text-xl font-bold text-slate-900">
            {car.year} {car.make} {car.model}
          </h3>
          <p className="text-sm text-slate-600">{car.trim}</p>
        </div>

        <div className="grid grid-cols-2 gap-2 text-sm text-slate-700">
          <p>{car.engine}</p>
          <p>{car.transmission}</p>
          <p>{car.mileageKm.toLocaleString()} km</p>
          <p>{car.location}</p>
        </div>

        <div className="rounded-xl bg-slate-50 p-3 text-sm">
          <p className="text-slate-500">Current bid</p>
          <p className="text-xl font-semibold text-slate-900">{formatUsd(effectiveCurrentBid)}</p>
          <p className="text-slate-500">
            Estimate {formatUsd(car.estimateMinUsd)} - {formatUsd(car.estimateMaxUsd)}
          </p>
          {typeof userMaxBid === "number" ? <p className="mt-1 text-xs font-semibold text-teal-700">Your max bid: {formatUsd(userMaxBid)}</p> : null}
        </div>

        <Link
          className="btn-primary inline-flex w-full justify-center"
          href={`/cars/${encodeURIComponent(car.id)}?${detailParams}`}
        >
          View details
        </Link>
      </div>
    </article>
  );
}
