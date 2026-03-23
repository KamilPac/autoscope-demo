import { promises as fs } from "node:fs";
import path from "node:path";
import { CarItem } from "@/lib/types";

const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "search-cache.json");
const MAX_ENTRIES = 120;

type CacheEntry = {
  key: string;
  items: CarItem[];
};

type CachePayload = {
  entries: CacheEntry[];
};

export type SearchCacheListItem = {
  key: string;
  itemsCount: number;
  query: {
    q?: string;
    make?: string;
    source?: string;
    minYear?: number | null;
    maxYear?: number | null;
    maxMileageKm?: number | null;
  };
};

export type SearchCacheCarItem = {
  id: string;
  source: string;
  year: number;
  make: string;
  model: string;
  vin: string;
  lotNumber: string;
  imageUrl: string;
  imageUrls?: string[];
  occurrences: number;
};

async function ensureDataFile() {
  await fs.mkdir(DATA_DIR, { recursive: true });

  try {
    await fs.access(DATA_FILE);
  } catch {
    const initial: CachePayload = { entries: [] };
    await fs.writeFile(DATA_FILE, JSON.stringify(initial, null, 2), "utf-8");
  }
}

async function readPayload(): Promise<CachePayload> {
  await ensureDataFile();
  const raw = await fs.readFile(DATA_FILE, "utf-8");

  try {
    const parsed = JSON.parse(raw) as CachePayload;
    return { entries: Array.isArray(parsed.entries) ? parsed.entries : [] };
  } catch {
    return { entries: [] };
  }
}

async function writePayload(payload: CachePayload) {
  await ensureDataFile();
  await fs.writeFile(DATA_FILE, JSON.stringify(payload, null, 2), "utf-8");
}

export async function getCachedSearchResults(key: string) {
  const payload = await readPayload();

  // Normalize old cache format that may still include expiresAt.
  const normalized = payload.entries.map((entry) => ({ key: entry.key, items: entry.items }));
  if (normalized.length !== payload.entries.length || JSON.stringify(normalized) !== JSON.stringify(payload.entries)) {
    await writePayload({ entries: normalized.slice(0, MAX_ENTRIES) });
  }

  return normalized.find((entry) => entry.key === key)?.items;
}

export async function setCachedSearchResults(key: string, items: CarItem[]) {
  const payload = await readPayload();
  const filtered = payload.entries.filter((entry) => entry.key !== key);
  filtered.unshift({ key, items });

  await writePayload({ entries: filtered.slice(0, MAX_ENTRIES) });
}

export async function listCachedSearches(): Promise<SearchCacheListItem[]> {
  const payload = await readPayload();

  return payload.entries.map((entry) => {
    let query: SearchCacheListItem["query"] = {};

    try {
      const parsed = JSON.parse(entry.key) as SearchCacheListItem["query"];
      query = typeof parsed === "object" && parsed ? parsed : {};
    } catch {
      query = {};
    }

    return {
      key: entry.key,
      itemsCount: Array.isArray(entry.items) ? entry.items.length : 0,
      query,
    };
  });
}

export async function deleteCachedSearch(key: string) {
  const payload = await readPayload();
  const filtered = payload.entries.filter((entry) => entry.key !== key);

  if (filtered.length === payload.entries.length) {
    return false;
  }

  await writePayload({ entries: filtered });
  return true;
}

export async function listCachedCars(): Promise<SearchCacheCarItem[]> {
  const payload = await readPayload();
  const map = new Map<string, SearchCacheCarItem>();

  for (const entry of payload.entries) {
    for (const car of entry.items) {
      const existing = map.get(car.id);

      if (existing) {
        existing.occurrences += 1;
        continue;
      }

      map.set(car.id, {
        id: car.id,
        source: car.source,
        year: car.year,
        make: car.make,
        model: car.model,
        vin: car.vin,
        lotNumber: car.lotNumber,
        imageUrl: car.imageUrl,
        imageUrls: car.imageUrls,
        occurrences: 1,
      });
    }
  }

  return [...map.values()].sort((a, b) => b.year - a.year);
}

export async function deleteCarFromSearchCache(carId: string) {
  const payload = await readPayload();
  const updatedEntries = payload.entries
    .map((entry) => ({
      ...entry,
      items: entry.items.filter((item) => item.id !== carId),
    }))
    .filter((entry) => entry.items.length > 0);

  const changed = JSON.stringify(updatedEntries) !== JSON.stringify(payload.entries);
  if (!changed) {
    return false;
  }

  await writePayload({ entries: updatedEntries });
  return true;
}
