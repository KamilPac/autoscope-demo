import Link from "next/link";
import { findCarById } from "@/lib/server/auction-search-service";
import { toDisplayImageUrl } from "@/lib/image-url";
import { filterVehicleImages } from "@/lib/vehicle-image-filter";
import { CarImageViewer } from "@/components/car-image-viewer";
import { parseVisibleIndexesParam } from "@/lib/client-image-similarity";

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ vin?: string; img?: string; back?: string; vis?: string }>;
};

export default async function CarImageViewerPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const { vin, img, back, vis } = await searchParams;
  const car = await findCarById(id, { vin });

  if (!car) {
    return (
      <div className="min-h-screen bg-black px-6 py-8 text-white">
        <div className="mx-auto max-w-5xl space-y-6">
          <Link className="inline-flex rounded-lg bg-white/15 px-4 py-2 text-sm hover:bg-white/25" href="/cars">
            Back to search
          </Link>
          <p className="text-lg">Could not load vehicle images for this listing.</p>
        </div>
      </div>
    );
  }

  const gallery = filterVehicleImages(car.imageUrls, car).map(toDisplayImageUrl);
  const rawSelected = Number(img ?? "0");
  const selectedIdx = Number.isFinite(rawSelected) ? Math.max(0, Math.floor(rawSelected)) : 0;
  const initialVisibleIndexes = parseVisibleIndexesParam(vis, gallery.length - 1);

  return (
    <CarImageViewer
      carId={car.id}
      vin={car.vin}
      make={car.make}
      model={car.model}
      back={back}
      initialSelectedIndex={selectedIdx}
      gallery={gallery}
      fallbackImage={toDisplayImageUrl(car.imageUrl)}
      initialVisibleIndexes={initialVisibleIndexes}
    />
  );
}
