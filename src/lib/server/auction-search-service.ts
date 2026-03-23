import { filterCars } from "@/lib/cars-filter";
import { CarItem, CarSearchQuery } from "@/lib/types";
import { AuctionProvider, deduplicateCars } from "@/lib/server/auction-provider";
import { HttpAuctionProvider } from "@/lib/server/http-provider";
import { getImportedLots } from "@/lib/server/imported-lots-repository";
import { MockAuctionProvider } from "@/lib/server/mock-provider";
import { findRecentCarById, rememberRecentCars } from "@/lib/server/recent-cars-repository";
import { getCachedSearchResults, setCachedSearchResults } from "@/lib/server/search-cache-repository";
import { normalizeCarImages } from "@/lib/vehicle-image-filter";

const CAR_LOOKUP_CACHE_LIMIT = 800;
const recentCarsCache = new Map<string, CarItem>();

function buildSearchCacheKey(query: CarSearchQuery) {
  return JSON.stringify({
    q: query.q ?? "",
    make: query.make ?? "all",
    source: query.source ?? "all",
    minYear: query.minYear ?? null,
    maxYear: query.maxYear ?? null,
    maxMileageKm: query.maxMileageKm ?? null,
  });
}

function rememberCars(cars: CarItem[]) {
  for (const car of cars) {
    recentCarsCache.set(car.id, car);
  }

  while (recentCarsCache.size > CAR_LOOKUP_CACHE_LIMIT) {
    const oldestKey = recentCarsCache.keys().next().value;

    if (!oldestKey) {
      break;
    }

    recentCarsCache.delete(oldestKey);
  }
}

function extractVinCandidate(id: string) {
  const decoded = decodeURIComponent(id).toUpperCase();
  const match = decoded.match(/[A-HJ-NPR-Z0-9]{17}/);
  return match?.[0];
}

function buildLookupQueries(id: string) {
  const candidates = [extractVinCandidate(id)];
  const withoutPrefix = id.replace(/^marketcheck-/, "");

  if (withoutPrefix && withoutPrefix !== id) {
    candidates.push(withoutPrefix);
  }

  candidates.push(id);

  return [...new Set(candidates.filter((value): value is string => Boolean(value && value.length > 0)))];
}

function providerForSource(source: "marketcheck"): AuctionProvider {
  const dataMode = process.env.AUCTION_DATA_MODE?.toLowerCase() ?? "demo";

  if (dataMode === "live") {
    const endpoint = process.env.MARKETCHECK_PROVIDER_URL;
    const apiKey = process.env.MARKETCHECK_PROVIDER_API_KEY;

    if (endpoint) {
      return new HttpAuctionProvider(source, endpoint, apiKey);
    }
  }

  return new MockAuctionProvider(source);
}

function selectProviders(query: CarSearchQuery) {
  void query;
  return [providerForSource("marketcheck")];
}

export async function searchCars(query: CarSearchQuery) {
  const providers = selectProviders(query);
  const cacheKey = buildSearchCacheKey(query);
  const cachedItems = await getCachedSearchResults(cacheKey);
  const providerItems = cachedItems
    ? cachedItems
    : (
        await Promise.all(
          providers.map(async (provider) => {
            try {
              return await provider.fetchCars(query);
            } catch {
              return [];
            }
          }),
        )
      ).flat();

  const normalizedProviderItems = providerItems.map(normalizeCarImages);

  if (!cachedItems) {
    await setCachedSearchResults(cacheKey, normalizedProviderItems);
  }

  const importedLots = await getImportedLots();

  const importedFiltered = importedLots.filter((item) => {
    if (!query.source || query.source === "all") {
      return true;
    }

    return item.source === query.source;
  }).map(normalizeCarImages);

  const merged = deduplicateCars([...importedFiltered, ...normalizedProviderItems]);
  rememberCars(merged);
  await rememberRecentCars(merged);

  return filterCars(merged, query);
}

export async function findCarById(id: string, hint?: { vin?: string }): Promise<CarItem | undefined> {
  const cached = recentCarsCache.get(id);

  if (cached) {
    return normalizeCarImages(cached);
  }

  const recentMatch = await findRecentCarById(id);
  if (recentMatch) {
    recentCarsCache.set(recentMatch.id, recentMatch);
    return normalizeCarImages(recentMatch);
  }

  const importedLots = await getImportedLots();
  const importedMatch = importedLots.find((item) => item.id === id);

  if (importedMatch) {
    recentCarsCache.set(importedMatch.id, importedMatch);
    return normalizeCarImages(importedMatch);
  }

  const source: CarSearchQuery["source"] = "all";
  const providers = selectProviders({ source });
  const lookupQueries = buildLookupQueries(id);

  if (hint?.vin) {
    lookupQueries.unshift(hint.vin.toUpperCase());
  }

  for (const queryText of lookupQueries) {
    const chunks = await Promise.all(
      providers.map(async (provider) => {
        try {
          return await provider.fetchCars({ source, q: queryText });
        } catch {
          return [];
        }
      }),
    );

    const merged = deduplicateCars([...chunks.flat()]).map(normalizeCarImages);
    rememberCars(merged);

    const exactMatch = merged.find((item) => item.id === id);
    if (exactMatch) {
      return exactMatch;
    }

    const vinCandidate = extractVinCandidate(id);
    if (vinCandidate) {
      const byVin = merged.find((item) => item.vin.toUpperCase() === vinCandidate);
      if (byVin) {
        return byVin;
      }
    }
  }

  return undefined;
}
