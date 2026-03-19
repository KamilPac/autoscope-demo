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
