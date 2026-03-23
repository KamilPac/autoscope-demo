import { promises as fs } from "node:fs";
import path from "node:path";
import { CarItem } from "@/lib/types";

type StoredBidEntry = {
  amountUsd: number;
  updatedAt: string;
  car?: CarItem;
};

export type UserMaxBidRecord = {
  carId: string;
  amountUsd: number;
  updatedAt: string;
  car?: CarItem;
};

type MaxBidPayload = {
  users: Record<string, Record<string, number | StoredBidEntry>>;
};

const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "user-max-bids.json");

async function ensureDataFile() {
  await fs.mkdir(DATA_DIR, { recursive: true });

  try {
    await fs.access(DATA_FILE);
  } catch {
    await fs.writeFile(DATA_FILE, JSON.stringify({ users: {} }, null, 2), "utf-8");
  }
}

async function readPayload(): Promise<MaxBidPayload> {
  await ensureDataFile();
  const raw = await fs.readFile(DATA_FILE, "utf-8");

  try {
    const parsed = JSON.parse(raw) as MaxBidPayload;
    const users = parsed && typeof parsed === "object" && parsed.users && typeof parsed.users === "object" ? parsed.users : {};
    return { users };
  } catch {
    return { users: {} };
  }
}

async function writePayload(payload: MaxBidPayload) {
  await ensureDataFile();
  await fs.writeFile(DATA_FILE, JSON.stringify(payload, null, 2), "utf-8");
}

function normalizeBid(value: number) {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.max(0, Math.round(value));
}

function parseEntry(carId: string, raw: number | StoredBidEntry | undefined): UserMaxBidRecord | null {
  if (typeof raw === "number") {
    return {
      carId,
      amountUsd: normalizeBid(raw),
      updatedAt: new Date(0).toISOString(),
    };
  }

  if (!raw || typeof raw !== "object") {
    return null;
  }

  return {
    carId,
    amountUsd: normalizeBid(raw.amountUsd),
    updatedAt: typeof raw.updatedAt === "string" ? raw.updatedAt : new Date(0).toISOString(),
    car: raw.car,
  };
}

export async function getUserMaxBidEntries(username: string): Promise<UserMaxBidRecord[]> {
  const payload = await readPayload();
  const rawUser = payload.users[username] ?? {};

  return Object.entries(rawUser)
    .map(([carId, raw]) => parseEntry(carId, raw))
    .filter((entry): entry is UserMaxBidRecord => Boolean(entry))
    .sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));
}

export async function getUserMaxBid(username: string, carId: string) {
  const entries = await getUserMaxBidEntries(username);
  const match = entries.find((entry) => entry.carId === carId);
  if (!match) {
    return null;
  }

  return match.amountUsd;
}

export async function setUserMaxBid(username: string, carId: string, amountUsd: number, car?: CarItem) {
  const payload = await readPayload();
  const normalized = normalizeBid(amountUsd);

  if (!payload.users[username]) {
    payload.users[username] = {};
  }

  const previous = parseEntry(carId, payload.users[username][carId]);
  payload.users[username][carId] = {
    amountUsd: normalized,
    updatedAt: new Date().toISOString(),
    car: car ?? previous?.car,
  };
  await writePayload(payload);

  return normalized;
}
