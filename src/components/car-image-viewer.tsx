"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { buildHiddenTemplateIndexes, clampIndex } from "@/lib/client-image-similarity";

type CarImageViewerProps = {
  carId: string;
  vin: string;
  make: string;
  model: string;
  back?: string;
  initialSelectedIndex: number;
  gallery: string[];
  fallbackImage: string;
  initialVisibleIndexes?: number[];
};

function buildHiddenFromVisible(visible: number[], total: number) {
  if (visible.length === 0) {
    return new Set<number>();
  }

  const visibleSet = new Set(visible);
  const hidden = new Set<number>();
  for (let i = 0; i < total; i += 1) {
    if (!visibleSet.has(i)) {
      hidden.add(i);
    }
  }
  return hidden;
}

export function CarImageViewer({
  carId,
  vin,
  make,
  model,
  back,
  initialSelectedIndex,
  gallery,
  fallbackImage,
  initialVisibleIndexes = [],
}: CarImageViewerProps) {
  const [hiddenIndexes, setHiddenIndexes] = useState<Set<number>>(() => buildHiddenFromVisible(initialVisibleIndexes, gallery.length));

  useEffect(() => {
    if (initialVisibleIndexes.length > 0) {
      return;
    }

    let cancelled = false;

    const run = async () => {
      const hidden = await buildHiddenTemplateIndexes(gallery);
      if (cancelled) {
        return;
      }

      setHiddenIndexes(hidden);
    };

    run();

    return () => {
      cancelled = true;
    };
  }, [gallery, initialVisibleIndexes]);

  const visibleIndexes = useMemo(
    () => gallery.map((_, index) => index).filter((index) => !hiddenIndexes.has(index)),
    [gallery, hiddenIndexes],
  );

  const visibleGallery = useMemo(() => visibleIndexes.map((index) => gallery[index]), [gallery, visibleIndexes]);
  const selectedIdx = clampIndex(initialSelectedIndex, Math.max(visibleGallery.length - 1, 0));
  const current = visibleGallery[selectedIdx] ?? fallbackImage;
  const prevIdx = selectedIdx > 0 ? selectedIdx - 1 : visibleGallery.length - 1;
  const nextIdx = selectedIdx < visibleGallery.length - 1 ? selectedIdx + 1 : 0;
  const visibleParam = visibleIndexes.join(",");

  const shared = {
    vin,
    ...(visibleParam ? { vis: visibleParam } : {}),
    ...(back ? { back } : {}),
  };

  const detailsHref = `/cars/${encodeURIComponent(carId)}?${new URLSearchParams({
    ...shared,
    img: String(selectedIdx),
  }).toString()}`;

  const prevHref = `/cars/${encodeURIComponent(carId)}/viewer?${new URLSearchParams({
    ...shared,
    img: String(prevIdx),
  }).toString()}`;

  const nextHref = `/cars/${encodeURIComponent(carId)}/viewer?${new URLSearchParams({
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

        {visibleGallery.length > 1 ? (
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
            alt={`${make} ${model} image ${selectedIdx + 1}`}
            fill
            unoptimized
            sizes="95vw"
            priority
          />
        </div>

        {visibleGallery.length > 1 ? (
          <Link
            aria-label="Next image"
            className="absolute right-4 z-20 flex h-12 w-12 items-center justify-center rounded-full bg-black/45 text-2xl hover:bg-black/65"
            href={nextHref}
          >
            <span aria-hidden>›</span>
          </Link>
        ) : null}

        <div className="absolute right-4 bottom-4 rounded-md bg-black/55 px-3 py-2 text-xs tracking-[0.08em] text-white/85">
          {selectedIdx + 1} / {visibleGallery.length || 1}
        </div>
      </main>
    </div>
  );
}
