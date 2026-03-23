import { promises as fs } from "node:fs";
import path from "node:path";
import { CarItem } from "@/lib/types";

type WatchlistEntry = {
  car: CarItem;
  addedAt: string;
};

export type WatchedCarRecord = {
  car: CarItem;
  addedAt: string;
};

type WatchlistPayload = {
  users: Record<string, WatchlistEntry[]>;
};

const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "watchlist.json");

async function ensureDataFile() {
  await fs.mkdir(DATA_DIR, { recursive: true });

  try {
    await fs.access(DATA_FILE);
  } catch {
    await fs.writeFile(DATA_FILE, JSON.stringify({ users: {} }, null, 2), "utf-8");
  }
}

async function readPayload(): Promise<WatchlistPayload> {
  await ensureDataFile();
  const raw = await fs.readFile(DATA_FILE, "utf-8");

  try {
    const parsed = JSON.parse(raw) as WatchlistPayload;
    const users = parsed && typeof parsed === "object" && parsed.users && typeof parsed.users === "object" ? parsed.users : {};
    return { users };
  } catch {
    return { users: {} };
  }
}

async function writePayload(payload: WatchlistPayload) {
  await ensureDataFile();
  await fs.writeFile(DATA_FILE, JSON.stringify(payload, null, 2), "utf-8");
}

function sanitizeEntries(entries: WatchlistEntry[]) {
  return [...entries]
    .filter((entry) => entry && entry.car && typeof entry.car.id === "string")
    .sort((a, b) => (a.addedAt < b.addedAt ? 1 : -1));
}

export async function getWatchedCarsWithMeta(username: string): Promise<WatchedCarRecord[]> {
  const payload = await readPayload();
  const entries = sanitizeEntries(payload.users[username] ?? []);

  return entries.map((entry) => ({
    car: entry.car,
    addedAt: entry.addedAt,
  }));
}

export async function getWatchedCars(username: string): Promise<CarItem[]> {
  const entries = await getWatchedCarsWithMeta(username);
  return entries.map((entry) => entry.car);
}

export async function isCarWatched(username: string, carId: string): Promise<boolean> {
  const payload = await readPayload();
  const entries = payload.users[username] ?? [];
  return entries.some((entry) => entry.car.id === carId);
}

export async function addWatchedCar(username: string, car: CarItem) {
  const payload = await readPayload();
  const current = sanitizeEntries(payload.users[username] ?? []);
  const existing = current.find((entry) => entry.car.id === car.id);

  const next: WatchlistEntry[] = existing
    ? current.map((entry) =>
        entry.car.id === car.id
          ? {
              ...entry,
              car,
            }
          : entry,
      )
    : [{ car, addedAt: new Date().toISOString() }, ...current];

  payload.users[username] = sanitizeEntries(next).slice(0, 200);
  await writePayload(payload);
}

export async function removeWatchedCar(username: string, carId: string) {
  const payload = await readPayload();
  const current = payload.users[username] ?? [];
  payload.users[username] = current.filter((entry) => entry.car.id !== carId);
  await writePayload(payload);
}
