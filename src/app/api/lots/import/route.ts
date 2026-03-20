import { NextRequest, NextResponse } from "next/server";
import { AUTH_ROLE_COOKIE_NAME } from "@/lib/auth-constants";
import { addImportedLot } from "@/lib/server/imported-lots-repository";
import { importLotFromUrl } from "@/lib/server/lot-url-importer";

export async function POST(request: NextRequest) {
  if (request.cookies.get(AUTH_ROLE_COOKIE_NAME)?.value !== "admin") {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  try {
    const body = (await request.json()) as { url?: string };

    if (!body?.url) {
      return NextResponse.json({ message: "Missing field: url" }, { status: 400 });
    }

    const imported = await importLotFromUrl(body.url);
    await addImportedLot(imported.lot);

    return NextResponse.json(
      {
        message: "Lot imported successfully",
        lot: imported.lot,
        warning: imported.warning,
      },
      { status: 200 },
    );
  } catch (error) {
    return NextResponse.json(
      {
        message: "Import failed",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 422 },
    );
  }
}
