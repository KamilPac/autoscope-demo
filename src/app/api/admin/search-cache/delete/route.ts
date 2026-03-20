import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { AUTH_ROLE_COOKIE_NAME } from "@/lib/auth-constants";
import { deleteImportedLotById } from "@/lib/server/imported-lots-repository";
import { deleteRecentCarById } from "@/lib/server/recent-cars-repository";
import { deleteCarFromSearchCache } from "@/lib/server/search-cache-repository";

export async function POST(request: NextRequest) {
  const store = await cookies();
  const role = store.get(AUTH_ROLE_COOKIE_NAME)?.value;

  if (role !== "admin") {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  try {
    const payload = (await request.json()) as { id?: string };
    const id = payload.id?.trim() ?? "";

    if (!id) {
      return NextResponse.json({ message: "Missing id" }, { status: 400 });
    }

    const [deletedFromCache, deletedFromImported, deletedFromRecent] = await Promise.all([
      deleteCarFromSearchCache(id),
      deleteImportedLotById(id),
      deleteRecentCarById(id),
    ]);

    const deleted = deletedFromCache || deletedFromImported || deletedFromRecent;

    if (!deleted) {
      return NextResponse.json({ message: "Car not found in local data stores" }, { status: 404 });
    }

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch {
    return NextResponse.json({ message: "Delete failed" }, { status: 500 });
  }
}
