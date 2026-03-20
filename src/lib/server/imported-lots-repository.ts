 import { promises as fs } from "node:fs";
import path from "node:path";
import { CarItem } from "@/lib/types";

const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "imported-lots.json");

type ImportedLotsPayload = {
  items: CarItem[];
};

async function ensureDataFile() {
  await fs.mkdir(DATA_DIR, { recursive: true });

  try {
    await fs.access(DATA_FILE);
  } catch {
    const initial: ImportedLotsPayload = { items: [] };
    await fs.writeFile(DATA_FILE, JSON.stringify(initial, null, 2), "utf-8");
  }
}

async function readPayload(): Promise<ImportedLotsPayload> {
  await ensureDataFile();

  const raw = await fs.readFile(DATA_FILE, "utf-8");

  try {
    const parsed = JSON.parse(raw) as ImportedLotsPayload;
    return { items: Array.isArray(parsed.items) ? parsed.items : [] };
  } catch {
    return { items: [] };
  }
}

async function writePayload(payload: ImportedLotsPayload) {
  await ensureDataFile();
  await fs.writeFile(DATA_FILE, JSON.stringify(payload, null, 2), "utf-8");
}

export async function getImportedLots() {
  const payload = await readPayload();
  return payload.items;
}

export async function addImportedLot(item: CarItem) {
  const payload = await readPayload();
  const existingIndex = payload.items.findIndex((stored) => stored.id === item.id);

  if (existingIndex >= 0) {
    payload.items[existingIndex] = item;
  } else {
    payload.items.unshift(item);
  }

  await writePayload(payload);
}

export async function addImportedLots(items: CarItem[]) {
  if (items.length === 0) {
    return;
  }

  const payload = await readPayload();

  for (const item of items) {
    const existingIndex = payload.items.findIndex((stored) => stored.id === item.id);

    if (existingIndex >= 0) {
      payload.items[existingIndex] = item;
    } else {
      payload.items.unshift(item);
    }
  }

  await writePayload(payload);
}

export async function deleteImportedLotById(id: string) {
  const payload = await readPayload();
  const filtered = payload.items.filter((item) => item.id !== id);

  if (filtered.length === payload.items.length) {
    return false;
  }

  await writePayload({ items: filtered });
  return true;
}
