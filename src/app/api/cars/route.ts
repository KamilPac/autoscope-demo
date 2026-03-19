import { NextRequest, NextResponse } from "next/server";
import { searchCars } from "@/lib/server/auction-search-service";
import { getAuctionRuntimeState } from "@/lib/server/runtime-state";
import { parseSearchParams } from "@/lib/server/search-params";

function convertUrlSearchParams(searchParams: URLSearchParams) {
  const entries: Record<string, string> = {};
  searchParams.forEach((value, key) => {
    entries[key] = value;
  });

  return entries;
}

export async function GET(request: NextRequest) {
  try {
    const parsed = parseSearchParams(convertUrlSearchParams(request.nextUrl.searchParams));
    const result = await searchCars(parsed);
    const runtime = getAuctionRuntimeState();

    return NextResponse.json(
      {
        ...result,
        meta: {
          runtime,
        },
      },
      { status: 200 },
    );
  } catch (error) {
    return NextResponse.json(
      {
        message: "Failed to load cars",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
