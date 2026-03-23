import { CarItem } from "@/lib/types";

function normalizeUrl(rawUrl: string) {
  try {
    const parsed = new URL(rawUrl);
    parsed.searchParams.delete("api_key");
    return parsed.toString();
  } catch {
    return rawUrl;
  }
}

function hasToken(text: string, token: string | undefined) {
  if (!token) {
    return false;
  }

  const normalizedToken = token.trim().toLowerCase();
  if (!normalizedToken) {
    return false;
  }

  return text.includes(normalizedToken);
}

function isMarketcheckCacheUrl(url: string) {
  return url.toLowerCase().includes("api.marketcheck.com/v2/image/cache/car/");
}

function isInventoryPhotoUrl(url: string) {
  return url.toLowerCase().includes("/inventoryphotos/");
}

function inventoryVehicleToken(url: string) {
  const lower = url.toLowerCase();
  const match = lower.match(/\/inventoryphotos\/[^/]+\/([^/]+)\/(?:ip|sp)\//i);
  return match?.[1] ?? "";
}

function isStockLike(url: string) {
  const lower = url.toLowerCase();

  return (
    lower.includes("/sp/") ||
    lower.includes("/stock/") ||
    lower.includes("stock") ||
    lower.includes("placeholder") ||
    lower.includes("default") ||
    lower.includes("noimage")
  );
}

function imageSignature(url: string) {
  const lower = url.toLowerCase();

  // Dealer inventory often contains duplicate pairs: /ip/{n}.jpg and /sp/{n}.jpg.
  // Normalize both to one signature so we keep only one best candidate.
  const inventoryMatch = lower.match(/^(https?:\/\/[^/]+\/inventoryphotos\/[^/]+\/[^/]+\/)(ip|sp)\/([^/?#]+)$/i);
  if (inventoryMatch) {
    return `${inventoryMatch[1]}${inventoryMatch[3]}`;
  }

  // BidCars often serves the same photo from multiple hosts (images.bid.cars and pluto.bid.car).
  // Normalize to filename so those mirrored URLs collapse into one image.
  const bidCarsMatch = lower.match(/^https?:\/\/(?:images\.bid\.cars|pluto\.bid\.car|(?:www\.)?bid\.cars)\/[^?#]*\/([^/?#]+\.(?:jpg|jpeg|png|webp))(?:[?#].*)?$/i);
  if (bidCarsMatch?.[1]) {
    return `bidcars:${bidCarsMatch[1]}`;
  }

  return lower;
}

function scoreImage(url: string, car: Pick<CarItem, "vin" | "lotNumber" | "id">) {
  const lower = url.toLowerCase();
  let score = 0;
  const vinLower = car.vin.trim().toLowerCase();
  const lotLower = car.lotNumber.trim().toLowerCase();

  if (hasToken(lower, car.vin)) {
    score += 120;
  }

  if (hasToken(lower, car.lotNumber)) {
    score += 80;
  }

  if (hasToken(lower, car.id.replace(/^marketcheck-/, ""))) {
    score += 40;
  }

  if (lower.includes("/inventoryphotos/")) {
    score += 25;
  }

  if (lower.includes("/ip/")) {
    score += 30;
  }

  if (isMarketcheckCacheUrl(lower)) {
    score += 20;
  }

  if (isInventoryPhotoUrl(lower)) {
    const token = inventoryVehicleToken(lower);
    if (token) {
      const matchesVehicle = token === vinLower || token === lotLower || hasToken(token, vinLower) || hasToken(token, lotLower);
      score += matchesVehicle ? 80 : -60;
    }
  }

  if (isStockLike(lower)) {
    score -= 140;
  }

  if (lower.includes("images.unsplash.com")) {
    score -= 180;
  }

  return score;
}

export function filterVehicleImages(
  imageUrls: string[] | undefined,
  car: Pick<CarItem, "vin" | "lotNumber" | "id" | "imageUrl">,
) {
  const normalized = [...new Set((imageUrls ?? []).map(normalizeUrl).filter(Boolean))];

  // Fallback to single image if gallery is empty.
  if (normalized.length === 0) {
    return [normalizeUrl(car.imageUrl)].filter(Boolean);
  }

  // Hard-remove stock/showroom-like images if there are other candidates.
  const nonStock = normalized.filter((url) => !isStockLike(url));
  const stockFilteredPool = nonStock.length > 0 ? nonStock : normalized;

  const vinLower = car.vin.trim().toLowerCase();
  const lotLower = car.lotNumber.trim().toLowerCase();
  const vinMatchedInventory = stockFilteredPool.filter((url) => {
    if (!isInventoryPhotoUrl(url)) {
      return false;
    }

    const lower = url.toLowerCase();
    if (hasToken(lower, vinLower) || hasToken(lower, lotLower)) {
      return true;
    }

    const token = inventoryVehicleToken(url);
    return Boolean(token && (token === vinLower || token === lotLower || hasToken(token, vinLower) || hasToken(token, lotLower)));
  });

  const sourcePreferredPool = vinMatchedInventory.length > 0 ? vinMatchedInventory : stockFilteredPool;

  // Deduplicate by normalized signature (helps remove ip/sp duplicate pairs).
  const bySignature = new Map<string, string>();
  for (const url of sourcePreferredPool) {
    const signature = imageSignature(url);
    if (!bySignature.has(signature)) {
      bySignature.set(signature, url);
    }
  }
  const deduped = [...bySignature.values()];

  const ranked = deduped
    .map((url) => ({ url, score: scoreImage(url, car) }))
    .sort((a, b) => b.score - a.score);

  const preferred = ranked.filter((item) => item.score >= 0).map((item) => item.url);

  if (preferred.length > 0) {
    return preferred;
  }

  return ranked.map((item) => item.url);
}

export function normalizeCarImages(car: CarItem): CarItem {
  const filtered = filterVehicleImages(car.imageUrls, car);

  return {
    ...car,
    imageUrls: filtered,
    imageUrl: filtered[0] ?? normalizeUrl(car.imageUrl),
  };
}
