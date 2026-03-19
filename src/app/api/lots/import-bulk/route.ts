import { NextRequest, NextResponse } from "next/server";
import { CarItem } from "@/lib/types";
import { addImportedLots } from "@/lib/server/imported-lots-repository";

type BulkImportPayload = {
  lots?: CarItem[];
};

function isValidLot(item: unknown): item is CarItem {
  if (!item || typeof item !== "object") {
    return false;
  }

  const candidate = item as Record<string, unknown>;

  return (
    typeof candidate.id === "string" &&
    typeof candidate.source === "string" &&
    typeof candidate.lotNumber === "string" &&
    typeof candidate.make === "string" &&
    typeof candidate.model === "string"
  );
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as BulkImportPayload;
    const inputLots = Array.isArray(body?.lots) ? body.lots : [];

    const validLots = inputLots.filter(isValidLot);

    if (validLots.length === 0) {
      return NextResponse.json(
        {
          message: "No valid lots in payload",
          importedCount: 0,
        },
        { status: 400 },
      );
    }

    await addImportedLots(validLots);

    return NextResponse.json(
      {
        message: "Bulk import completed",
        importedCount: validLots.length,
      },
      { status: 200 },
    );
  } catch (error) {
    return NextResponse.json(
      {
        message: "Bulk import failed",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 422 },
    );
  }
}
