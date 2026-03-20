import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { AUTH_ROLE_COOKIE_NAME } from "@/lib/auth-constants";
import { getImportedLots } from "@/lib/server/imported-lots-repository";
import { getRecentCars } from "@/lib/server/recent-cars-repository";
import { listCachedCars } from "@/lib/server/search-cache-repository";

export async function GET() {
  const store = await cookies();
  const role = store.get(AUTH_ROLE_COOKIE_NAME)?.value;

  if (role !== "admin") {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const [cachedCars, importedCars, recentCars] = await Promise.all([
    listCachedCars(),
    getImportedLots(),
    getRecentCars(),
  ]);

  const byId = new Map<string, {
    id: string;
    source: string;
    year: number;
    make: string;
    model: string;
    vin: string;
    lotNumber: string;
    imageUrl: string;
    inSearchCache: boolean;
    inImportedLots: boolean;
    inRecentCars: boolean;
  }>();

  for (const car of cachedCars) {
    byId.set(car.id, {
      id: car.id,
      source: car.source,
      year: car.year,
      make: car.make,
      model: car.model,
      vin: car.vin,
      lotNumber: car.lotNumber,
      imageUrl: car.imageUrl,
      inSearchCache: true,
      inImportedLots: false,
      inRecentCars: false,
    });
  }

  for (const car of importedCars) {
    const existing = byId.get(car.id);
    if (existing) {
      existing.inImportedLots = true;
      if (!existing.imageUrl) {
        existing.imageUrl = car.imageUrl;
      }
      continue;
    }

    byId.set(car.id, {
      id: car.id,
      source: car.source,
      year: car.year,
      make: car.make,
      model: car.model,
      vin: car.vin,
      lotNumber: car.lotNumber,
      imageUrl: car.imageUrl,
      inSearchCache: false,
      inImportedLots: true,
      inRecentCars: false,
    });
  }

  for (const car of recentCars) {
    const existing = byId.get(car.id);
    if (existing) {
      existing.inRecentCars = true;
      if (!existing.imageUrl) {
        existing.imageUrl = car.imageUrl;
      }
      continue;
    }

    byId.set(car.id, {
      id: car.id,
      source: car.source,
      year: car.year,
      make: car.make,
      model: car.model,
      vin: car.vin,
      lotNumber: car.lotNumber,
      imageUrl: car.imageUrl,
      inSearchCache: false,
      inImportedLots: false,
      inRecentCars: true,
    });
  }

  const entries = [...byId.values()].sort((a, b) => b.year - a.year);
  return NextResponse.json({ entries }, { status: 200 });
}
