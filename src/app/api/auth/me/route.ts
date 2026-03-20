import { NextResponse } from "next/server";
import { getCurrentProfile, getCurrentRole, getCurrentUser } from "@/lib/server/auth";

export async function GET() {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ user: null }, { status: 200 });
  }

  const profile = await getCurrentProfile();
  const role = await getCurrentRole();
  return NextResponse.json({ user, role, profile }, { status: 200 });
}
