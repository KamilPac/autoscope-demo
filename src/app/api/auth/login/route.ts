import { NextRequest, NextResponse } from "next/server";
import { AUTH_COOKIE_NAME, AUTH_ROLE_COOKIE_NAME } from "@/lib/auth-constants";
import { authenticateUser } from "@/lib/server/auth";

export async function POST(request: NextRequest) {
  try {
    const payload = (await request.json()) as { username?: string; password?: string };
    const username = payload.username?.trim() ?? "";
    const password = payload.password?.trim() ?? "";

    if (!username || !password) {
      return NextResponse.json({ message: "Missing credentials" }, { status: 400 });
    }

    const account = await authenticateUser(username, password);

    if (!account) {
      return NextResponse.json({ message: "Invalid username or password" }, { status: 401 });
    }

    const response = NextResponse.json({ ok: true }, { status: 200 });
    response.cookies.set(AUTH_COOKIE_NAME, account.username, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });
    response.cookies.set(AUTH_ROLE_COOKIE_NAME, account.role, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });

    return response;
  } catch {
    return NextResponse.json({ message: "Login failed" }, { status: 500 });
  }
}
