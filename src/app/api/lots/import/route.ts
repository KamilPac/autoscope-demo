import { NextRequest, NextResponse } from "next/server";
import { addImportedLot } from "@/lib/server/imported-lots-repository";
import { importLotFromUrl } from "@/lib/server/lot-url-importer";

export async function POST(request: NextRequest) {
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
