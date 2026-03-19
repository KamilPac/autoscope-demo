import Link from "next/link";
import Image from "next/image";
import { findCarById } from "@/lib/server/auction-search-service";
import { toDisplayImageUrl } from "@/lib/image-url";

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ vin?: string; img?: string; back?: string }>;
};

function clampIndex(raw: string | undefined, max: number) {
  const parsed = Number(raw ?? "0");

  if (!Number.isFinite(parsed)) {
    return 0;
  }

  return Math.max(0, Math.min(max, Math.floor(parsed)));
}

export default async function CarImageViewerPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const { vin, img, back } = await searchParams;
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

  const gallery = (car.imageUrls && car.imageUrls.length > 0 ? car.imageUrls : [car.imageUrl]).map(toDisplayImageUrl);
  const selectedIdx = clampIndex(img, gallery.length - 1);
  const current = gallery[selectedIdx] ?? toDisplayImageUrl(car.imageUrl);
  const prevIdx = selectedIdx > 0 ? selectedIdx - 1 : gallery.length - 1;
  const nextIdx = selectedIdx < gallery.length - 1 ? selectedIdx + 1 : 0;

  const shared = {
    vin: car.vin,
    ...(back ? { back } : {}),
  };

  const detailsHref = `/cars/${encodeURIComponent(car.id)}?${new URLSearchParams({
    ...shared,
    img: String(selectedIdx),
  }).toString()}`;

  const prevHref = `/cars/${encodeURIComponent(car.id)}/viewer?${new URLSearchParams({
    ...shared,
    img: String(prevIdx),
  }).toString()}`;

  const nextHref = `/cars/${encodeURIComponent(car.id)}/viewer?${new URLSearchParams({
    ...shared,
    img: String(nextIdx),
  }).toString()}`;

  return (
    <div className="min-h-screen bg-black text-white">
      <main className="relative mx-auto flex min-h-screen w-full max-w-[1800px] items-center justify-center px-4 py-6">
        <div className="absolute top-4 left-4 z-20 flex gap-2">
          <Link className="rounded-lg bg-white/15 px-4 py-2 text-sm hover:bg-white/25" href={detailsHref}>
            Back to details
          </Link>
        </div>

        {gallery.length > 1 ? (
          <Link
            aria-label="Previous image"
            className="absolute left-4 z-20 flex h-12 w-12 items-center justify-center rounded-full bg-black/45 text-2xl hover:bg-black/65"
            href={prevHref}
          >
            <span aria-hidden>‹</span>
          </Link>
        ) : null}

        <div className="relative h-[90vh] w-[95vw] overflow-hidden rounded-xl border border-white/20 bg-black">
          <Image
            className="object-contain"
            src={current}
            alt={`${car.make} ${car.model} image ${selectedIdx + 1}`}
            fill
            unoptimized
            sizes="95vw"
            priority
          />
        </div>

        {gallery.length > 1 ? (
          <Link
            aria-label="Next image"
            className="absolute right-4 z-20 flex h-12 w-12 items-center justify-center rounded-full bg-black/45 text-2xl hover:bg-black/65"
            href={nextHref}
          >
            <span aria-hidden>›</span>
          </Link>
        ) : null}

        <div className="absolute right-4 bottom-4 rounded-md bg-black/55 px-3 py-2 text-xs tracking-[0.08em] text-white/85">
          {selectedIdx + 1} / {gallery.length}
        </div>
      </main>
    </div>
  );
}
