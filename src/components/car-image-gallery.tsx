"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { buildHiddenTemplateIndexes, clampIndex } from "@/lib/client-image-similarity";

type CarImageGalleryProps = {
  carId: string;
  vin: string;
  make: string;
  model: string;
  back?: string;
  initialSelectedIndex: number;
  gallery: string[];
  fallbackImage: string;
};

const EMPTY_HIDDEN = new Set<number>();

export function CarImageGallery({
  carId,
  vin,
  make,
  model,
  back,
  initialSelectedIndex,
  gallery,
  fallbackImage,
}: CarImageGalleryProps) {
  const galleryKey = useMemo(() => gallery.join("|"), [gallery]);
  const [hiddenIndexes, setHiddenIndexes] = useState<Set<number>>(new Set());
  const [processedGalleryKey, setProcessedGalleryKey] = useState(gallery.length < 4 ? galleryKey : "");

  useEffect(() => {
    if (gallery.length < 4) {
      return;
    }

    let cancelled = false;

    const run = async () => {
      const hidden = await buildHiddenTemplateIndexes(gallery);
      if (cancelled) {
        return;
      }

      setHiddenIndexes(hidden);
      setProcessedGalleryKey(galleryKey);
    };

    run();

    return () => {
      cancelled = true;
    };
  }, [gallery, galleryKey]);

  const activeHiddenIndexes = gallery.length < 4 ? EMPTY_HIDDEN : hiddenIndexes;
  const filterResolved = gallery.length < 4 || processedGalleryKey === galleryKey;

  const visibleIndexes = useMemo(
    () => gallery.map((_, index) => index).filter((index) => !activeHiddenIndexes.has(index)),
    [gallery, activeHiddenIndexes],
  );

  const visibleGallery = useMemo(() => visibleIndexes.map((index) => gallery[index]), [gallery, visibleIndexes]);
  const selectedFromOriginal = visibleIndexes.indexOf(initialSelectedIndex);
  const selectedIdx = clampIndex(selectedFromOriginal >= 0 ? selectedFromOriginal : 0, Math.max(visibleGallery.length - 1, 0));
  const imageUrl = visibleGallery[selectedIdx] ?? fallbackImage;
  const visibleParam = visibleIndexes.join(",");

  const viewerHref = `/cars/${encodeURIComponent(carId)}/viewer?${new URLSearchParams({
    vin,
    img: String(selectedIdx),
    ...(visibleParam ? { vis: visibleParam } : {}),
    ...(back ? { back } : {}),
  }).toString()}`;

  return (
    <>
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
            alt={`${make} ${model}`}
            fill
            unoptimized
            sizes="(max-width: 1024px) 100vw, 55vw"
          />
        </div>
        <p className="mt-2 text-xs font-medium uppercase tracking-[0.12em] text-slate-500">Click image to open full-size viewer</p>
      </Link>

      {filterResolved && visibleGallery.length > 1 ? (
        <div className="grid grid-cols-5 gap-2 sm:grid-cols-6 lg:grid-cols-5">
          {visibleGallery.slice(0, 18).map((photo, index) => (
            <Link
              key={`${carId}-img-${index}`}
              className={`relative block aspect-square overflow-hidden rounded-lg border ${
                index === selectedIdx ? "border-teal-500" : "border-slate-300"
              }`}
              href={`/cars/${encodeURIComponent(carId)}?${new URLSearchParams({
                vin,
                img: String(index),
                ...(back ? { back } : {}),
              }).toString()}`}
            >
              <Image
                className="object-cover"
                src={photo}
                alt={`${make} ${model} photo ${index + 1}`}
                fill
                unoptimized
                sizes="140px"
              />
            </Link>
          ))}
        </div>
      ) : null}

      {!filterResolved && gallery.length > 1 ? (
        <div className="grid grid-cols-5 gap-2 sm:grid-cols-6 lg:grid-cols-5">
          {gallery.slice(0, 10).map((_, index) => (
            <div
              key={`${carId}-thumb-skeleton-${index}`}
              className="aspect-square animate-pulse rounded-lg border border-slate-300 bg-slate-200/70"
            />
          ))}
        </div>
      ) : null}
    </>
  );
}
