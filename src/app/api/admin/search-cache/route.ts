import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { AUTH_ROLE_COOKIE_NAME } from "@/lib/auth-constants";
import { getImportedLots } from "@/lib/server/imported-lots-repository";
import { getRecentCars } from "@/lib/server/recent-cars-repository";
import { listCachedCars } from "@/lib/server/search-cache-repository";
import { normalizeCarImages } from "@/lib/vehicle-image-filter";

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
    imageUrls?: string[];
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
      imageUrls: car.imageUrls,
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
      if (!existing.imageUrls || existing.imageUrls.length === 0) {
        existing.imageUrls = car.imageUrls;
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
      imageUrls: car.imageUrls,
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
      if (!existing.imageUrls || existing.imageUrls.length === 0) {
        existing.imageUrls = car.imageUrls;
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
      imageUrls: car.imageUrls,
      inSearchCache: false,
      inImportedLots: false,
      inRecentCars: true,
    });
  }

  const entries = [...byId.values()]
    .map((entry) => {
      const normalized = normalizeCarImages({
        id: entry.id,
        source: entry.source as "marketcheck",
        lotNumber: entry.lotNumber,
        vin: entry.vin,
        year: entry.year,
        make: entry.make,
        model: entry.model,
        trim: "",
        engine: "",
        drivetrain: "",
        transmission: "",
        mileageKm: 0,
        location: "",
        damage: "normal_wear",
        titleStatus: "",
        sellerType: "",
        runAndDrive: false,
        hasKeys: false,
        estimateMinUsd: 0,
        estimateMaxUsd: 0,
        currentBidUsd: 0,
        imageUrl: entry.imageUrl,
        imageUrls: entry.imageUrls,
      });

      return {
        ...entry,
        imageUrl: normalized.imageUrl,
      };
    })
    .sort((a, b) => b.year - a.year);
  return NextResponse.json({ entries }, { status: 200 });
}
