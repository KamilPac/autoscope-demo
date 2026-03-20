import { cookies } from "next/headers";
import { AUTH_COOKIE_NAME, AUTH_ROLE_COOKIE_NAME, PROFILE_COOKIE_NAME } from "@/lib/auth-constants";
import { AccountRole, verifyAccountCredentials } from "@/lib/server/accounts-repository";

export type UserProfile = {
  displayName?: string;
};

export async function authenticateUser(username: string, password: string) {
  const account = await verifyAccountCredentials(username, password);

  if (!account) {
    return null;
  }

  return {
    username: account.username,
    role: account.role,
  };
}

export async function getCurrentUser() {
  const store = await cookies();
  const user = store.get(AUTH_COOKIE_NAME)?.value;
  return user ?? null;
}

export async function getCurrentRole(): Promise<AccountRole | null> {
  const store = await cookies();
  const role = store.get(AUTH_ROLE_COOKIE_NAME)?.value;
  return role === "admin" || role === "user" ? role : null;
}

export async function getCurrentProfile(): Promise<UserProfile | null> {
  const store = await cookies();
  const raw = store.get(PROFILE_COOKIE_NAME)?.value;

  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as UserProfile;
    return typeof parsed === "object" && parsed ? parsed : null;
  } catch {
    return null;
  }
}
