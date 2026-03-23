const HASHABLE_PROXY_PREFIX = "/api/image/marketcheck";
const SIMILARITY_THRESHOLD = 0.9;

export function clampIndex(index: number, max: number) {
  return Math.max(0, Math.min(max, index));
}

function hammingDistance(a: string, b: string) {
  const len = Math.min(a.length, b.length);
  let distance = Math.abs(a.length - b.length);

  for (let i = 0; i < len; i += 1) {
    if (a[i] !== b[i]) {
      distance += 1;
    }
  }

  return distance;
}

function similarity(a: string, b: string) {
  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) {
    return 0;
  }

  return 1 - hammingDistance(a, b) / maxLen;
}

async function computeDiffHash(src: string): Promise<string | null> {
  const isHashable = src.startsWith(HASHABLE_PROXY_PREFIX) || src.includes(`${HASHABLE_PROXY_PREFIX}?`);
  if (!isHashable) {
    return null;
  }

  return new Promise((resolve) => {
    const img = new window.Image();
    img.crossOrigin = "anonymous";
    img.referrerPolicy = "no-referrer";

    img.onload = () => {
      try {
        const width = 9;
        const height = 8;
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const context = canvas.getContext("2d", { willReadFrequently: true });

        if (!context) {
          resolve(null);
          return;
        }

        context.drawImage(img, 0, 0, width, height);
        const data = context.getImageData(0, 0, width, height).data;

        let bits = "";
        for (let y = 0; y < height; y += 1) {
          for (let x = 0; x < width - 1; x += 1) {
            const left = (y * width + x) * 4;
            const right = (y * width + x + 1) * 4;

            const leftGray = data[left] * 0.299 + data[left + 1] * 0.587 + data[left + 2] * 0.114;
            const rightGray = data[right] * 0.299 + data[right + 1] * 0.587 + data[right + 2] * 0.114;
            bits += leftGray > rightGray ? "1" : "0";
          }
        }

        resolve(bits);
      } catch {
        resolve(null);
      }
    };

    img.onerror = () => resolve(null);
    img.src = src;
  });
}

function findTemplateCluster(hashes: Array<string | null>) {
  const validIndexes = hashes
    .map((hash, index) => ({ hash, index }))
    .filter((entry): entry is { hash: string; index: number } => Boolean(entry.hash));

  if (validIndexes.length < 4) {
    return null;
  }

  let best: number[] = [];

  for (const candidate of validIndexes) {
    const cluster = validIndexes
      .filter((entry) => similarity(candidate.hash, entry.hash) >= SIMILARITY_THRESHOLD)
      .map((entry) => entry.index);

    if (cluster.length > best.length) {
      best = cluster;
    }
  }

  if (best.length < 3) {
    return null;
  }

  const outside = hashes.length - best.length;
  if (outside < 3) {
    return null;
  }

  return new Set(best);
}

export async function buildHiddenTemplateIndexes(gallery: string[]) {
  const hashes = await Promise.all(gallery.map((src) => computeDiffHash(src)));
  return findTemplateCluster(hashes) ?? new Set<number>();
}

export function parseVisibleIndexesParam(value: string | undefined, max: number) {
  if (!value) {
    return [];
  }

  const seen = new Set<number>();
  const parsed = value
    .split(",")
    .map((part) => Number(part.trim()))
    .filter((index) => Number.isInteger(index) && index >= 0 && index <= max)
    .filter((index) => {
      if (seen.has(index)) {
        return false;
      }
      seen.add(index);
      return true;
    });

  return parsed;
}
