import { promises as fs } from "node:fs";
import path from "node:path";
import { CarItem } from "@/lib/types";

const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "recent-cars.json");
const MAX_ITEMS = 1200;

type RecentCarsPayload = {
  items: CarItem[];
};

async function ensureDataFile() {
  await fs.mkdir(DATA_DIR, { recursive: true });

  try {
    await fs.access(DATA_FILE);
  } catch {
    const initial: RecentCarsPayload = { items: [] };
    await fs.writeFile(DATA_FILE, JSON.stringify(initial, null, 2), "utf-8");
  }
}

async function readPayload(): Promise<RecentCarsPayload> {
  await ensureDataFile();
  const raw = await fs.readFile(DATA_FILE, "utf-8");

  try {
    const parsed = JSON.parse(raw) as RecentCarsPayload;
    return { items: Array.isArray(parsed.items) ? parsed.items : [] };
  } catch {
    return { items: [] };
  }
}

async function writePayload(payload: RecentCarsPayload) {
  await ensureDataFile();
  await fs.writeFile(DATA_FILE, JSON.stringify(payload, null, 2), "utf-8");
}

export async function rememberRecentCars(cars: CarItem[]) {
  if (cars.length === 0) {
    return;
  }

  const payload = await readPayload();
  const indexById = new Map(payload.items.map((item, idx) => [item.id, idx]));

  for (const car of cars) {
    const existingIndex = indexById.get(car.id);

    if (existingIndex === undefined) {
      payload.items.unshift(car);
      continue;
    }

    payload.items.splice(existingIndex, 1);
    payload.items.unshift(car);
  }

  payload.items = payload.items.slice(0, MAX_ITEMS);
  await writePayload(payload);
}

export async function findRecentCarById(id: string) {
  const payload = await readPayload();
  return payload.items.find((item) => item.id === id);
}
