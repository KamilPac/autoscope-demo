"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { buildHiddenTemplateIndexes } from "@/lib/client-image-similarity";

type CarCardImageProps = {
  carId: string;
  make: string;
  model: string;
  gallery: string[];
  fallbackImage: string;
};

const EMPTY_LIST: number[] = [];

export function CarCardImage({ carId, make, model, gallery, fallbackImage }: CarCardImageProps) {
  const galleryKey = useMemo(() => gallery.join("|"), [gallery]);
  const [hiddenByGalleryKey, setHiddenByGalleryKey] = useState<Record<string, number[]>>({});
  const [failedUrls, setFailedUrls] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (gallery.length < 4 || hiddenByGalleryKey[galleryKey]) {
      return;
    }

    let cancelled = false;

    const run = async () => {
      const hidden = await buildHiddenTemplateIndexes(gallery);
      if (cancelled) {
        return;
      }

      setHiddenByGalleryKey((current) => {
        if (current[galleryKey]) {
          return current;
        }

        return {
          ...current,
          [galleryKey]: [...hidden],
        };
      });
    };

    run();

    return () => {
      cancelled = true;
    };
  }, [gallery, galleryKey, hiddenByGalleryKey]);

  const hiddenIndexes = useMemo(() => {
    if (gallery.length < 4) {
      return new Set<number>();
    }

    return new Set(hiddenByGalleryKey[galleryKey] ?? EMPTY_LIST);
  }, [gallery.length, galleryKey, hiddenByGalleryKey]);

  const resolved = gallery.length < 4 || Boolean(hiddenByGalleryKey[galleryKey]);

  const visibleGallery = useMemo(() => {
    const visible = gallery.filter((url, index) => !hiddenIndexes.has(index) && !failedUrls.has(url));
    return visible.length > 0 ? visible : [fallbackImage].filter(Boolean);
  }, [fallbackImage, failedUrls, gallery, hiddenIndexes]);

  const currentImage = visibleGallery[0] ?? fallbackImage;

  return (
    <div className="relative h-44 w-full bg-slate-200">
      {resolved ? (
        <Image
          className="object-cover"
          src={currentImage}
          alt={`${make} ${model}`}
          fill
          unoptimized
          sizes="(max-width: 768px) 100vw, 33vw"
          onError={() => {
            if (!currentImage) {
              return;
            }

            setFailedUrls((current) => {
              if (current.has(currentImage)) {
                return current;
              }

              const next = new Set(current);
              next.add(currentImage);
              return next;
            });
          }}
        />
      ) : (
        <div className="h-full w-full animate-pulse bg-slate-300/70" />
      )}
      <span className="sr-only">{carId}</span>
    </div>
  );
}
