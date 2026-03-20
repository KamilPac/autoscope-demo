import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { AUTH_COOKIE_NAME, PROFILE_COOKIE_NAME } from "@/lib/auth-constants";

export async function POST(request: NextRequest) {
  const store = await cookies();
  const currentUser = store.get(AUTH_COOKIE_NAME)?.value;

  if (!currentUser) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const payload = (await request.json()) as { displayName?: string };
    const displayName = (payload.displayName ?? "").trim().slice(0, 40);

    const response = NextResponse.json({ ok: true }, { status: 200 });
    response.cookies.set(PROFILE_COOKIE_NAME, JSON.stringify({ displayName }), {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });

    return response;
  } catch {
    return NextResponse.json({ message: "Failed to update settings" }, { status: 500 });
  }
}
