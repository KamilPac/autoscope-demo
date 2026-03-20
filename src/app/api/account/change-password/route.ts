import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { AUTH_COOKIE_NAME } from "@/lib/auth-constants";
import { updateAccountPassword, verifyAccountCredentials } from "@/lib/server/accounts-repository";

export async function POST(request: NextRequest) {
  const store = await cookies();
  const currentUser = store.get(AUTH_COOKIE_NAME)?.value;

  if (!currentUser) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const payload = (await request.json()) as {
      currentPassword?: string;
      newPassword?: string;
    };

    const currentPassword = payload.currentPassword?.trim() ?? "";
    const newPassword = payload.newPassword?.trim() ?? "";

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ message: "Missing password fields" }, { status: 400 });
    }

    if (newPassword.length < 8) {
      return NextResponse.json({ message: "New password must be at least 8 characters" }, { status: 400 });
    }

    const account = await verifyAccountCredentials(currentUser, currentPassword);
    if (!account) {
      return NextResponse.json({ message: "Current password is incorrect" }, { status: 401 });
    }

    const updated = await updateAccountPassword(currentUser, newPassword);
    if (!updated) {
      return NextResponse.json({ message: "Account not found" }, { status: 404 });
    }

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch {
    return NextResponse.json({ message: "Failed to change password" }, { status: 500 });
  }
}
