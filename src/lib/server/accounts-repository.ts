import { promises as fs } from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

export type AccountRole = "admin" | "user";

export type AccountRecord = {
  username: string;
  role: AccountRole;
  passwordHash: string;
};

type AccountsPayload = {
  accounts: AccountRecord[];
};

const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "accounts.json");

function hashPassword(password: string) {
  return crypto.createHash("sha256").update(password).digest("hex");
}

function seedAccounts(): AccountsPayload {
  const adminUsername = process.env.DEMO_AUTH_USERNAME ?? "admin";
  const adminPassword = process.env.DEMO_AUTH_PASSWORD ?? "admin123";
  const userUsername = process.env.DEMO_USER_USERNAME ?? "user";
  const userPassword = process.env.DEMO_USER_PASSWORD ?? "user123";

  return {
    accounts: [
      {
        username: adminUsername,
        role: "admin",
        passwordHash: hashPassword(adminPassword),
      },
      {
        username: userUsername,
        role: "user",
        passwordHash: hashPassword(userPassword),
      },
    ],
  };
}

async function ensureDataFile() {
  await fs.mkdir(DATA_DIR, { recursive: true });

  try {
    await fs.access(DATA_FILE);
  } catch {
    const initial = seedAccounts();
    await fs.writeFile(DATA_FILE, JSON.stringify(initial, null, 2), "utf-8");
  }
}

async function readPayload(): Promise<AccountsPayload> {
  await ensureDataFile();
  const raw = await fs.readFile(DATA_FILE, "utf-8");

  try {
    const parsed = JSON.parse(raw) as AccountsPayload;
    return {
      accounts: Array.isArray(parsed.accounts) ? parsed.accounts : [],
    };
  } catch {
    return seedAccounts();
  }
}

async function writePayload(payload: AccountsPayload) {
  await ensureDataFile();
  await fs.writeFile(DATA_FILE, JSON.stringify(payload, null, 2), "utf-8");
}

export async function findAccountByUsername(username: string) {
  const payload = await readPayload();
  return payload.accounts.find((item) => item.username === username) ?? null;
}

export async function verifyAccountCredentials(username: string, password: string) {
  const account = await findAccountByUsername(username);

  if (!account) {
    return null;
  }

  const inputHash = hashPassword(password);
  return inputHash === account.passwordHash ? account : null;
}

export async function updateAccountPassword(username: string, newPassword: string) {
  const payload = await readPayload();
  const index = payload.accounts.findIndex((item) => item.username === username);

  if (index < 0) {
    return false;
  }

  payload.accounts[index] = {
    ...payload.accounts[index],
    passwordHash: hashPassword(newPassword),
  };

  await writePayload(payload);
  return true;
}
