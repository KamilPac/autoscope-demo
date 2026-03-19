import { CarItem, CarSearchQuery } from "@/lib/types";
import { AuctionProvider } from "@/lib/server/auction-provider";

function toNumber(value: unknown, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function toText(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function sanitizeImageUrl(urlValue: string) {
  try {
    const url = new URL(urlValue);
    url.searchParams.delete("api_key");
    return url.toString();
  } catch {
    return urlValue;
  }
}

function extractImageUrls(item: Record<string, unknown>) {
  const media = (item.media ?? {}) as Record<string, unknown>;
  const cached = Array.isArray(media.photo_links_cached) ? media.photo_links_cached : [];
  const direct = Array.isArray(media.photo_links) ? media.photo_links : [];

  const list = [...cached, ...direct]
    .filter((value): value is string => typeof value === "string" && value.length > 0)
    .map(sanitizeImageUrl);

  return [...new Set(list)];
}

function firstImage(item: Record<string, unknown>) {
  const selected = extractImageUrls(item)[0];

  if (selected) {
    return selected;
  }

  return "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=1200&q=80";
}

function locationFromDealer(item: Record<string, unknown>) {
  const dealer = (item.dealer ?? {}) as Record<string, unknown>;
  const city = toText(dealer.city);
  const state = toText(dealer.state);

  if (city && state) {
    return `${city}, ${state}`;
  }

  if (city) {
    return city;
  }

  return "Not provided";
}

function normalizeIncomingItem(
  source: "marketcheck",
  item: Record<string, unknown>,
  idx: number,
): CarItem {
  const build = (item.build ?? {}) as Record<string, unknown>;
  const year = toNumber(build.year ?? item.year, 2000);
  const lotNumber = String(item.stock_no ?? item.id ?? item.lotNumber ?? `${source}-${idx}`);
  const vin = String(item.vin ?? "UNKNOWNVIN0000000");
  const currentPrice = toNumber(item.price, 0);
  const cleanTitle = item.carfax_clean_title;
  const titleStatus =
    typeof cleanTitle === "boolean" ? (cleanTitle ? "Clean" : "Issue reported") : "Unknown";

  return {
    id: `${source}-${String(item.id ?? lotNumber)}`,
    source,
    lotNumber,
    vin,
    year,
    make: String(build.make ?? item.make ?? "Unknown"),
    model: String(build.model ?? item.model ?? "Model"),
    trim: String(build.trim ?? item.trim ?? "Base"),
    engine: String(build.engine ?? item.engine ?? "Not provided"),
    drivetrain: String(build.drivetrain ?? item.drivetrain ?? "Not provided"),
    transmission: String(build.transmission ?? item.transmission ?? "AT"),
    mileageKm: Math.round(toNumber(item.miles, 0) * 1.60934),
    location: locationFromDealer(item),
    damage: "normal_wear",
    titleStatus,
    sellerType: String(item.seller_type ?? "Unknown"),
    runAndDrive: Boolean(item.runAndDrive ?? item.run_and_drive ?? false),
    hasKeys: Boolean(item.hasKeys ?? item.has_keys ?? false),
    estimateMinUsd: Math.round(currentPrice * 0.95),
    estimateMaxUsd: Math.round(currentPrice * 1.1),
    currentBidUsd: currentPrice,
    imageUrl: firstImage(item),
    imageUrls: extractImageUrls(item),
  };
}

export class HttpAuctionProvider implements AuctionProvider {
  readonly source: "marketcheck";
  private readonly endpoint: string;
  private readonly apiKey?: string;

  constructor(source: "marketcheck", endpoint: string, apiKey?: string) {
    this.source = source;
    this.endpoint = endpoint;
    this.apiKey = apiKey;
  }

  async fetchCars(query: CarSearchQuery): Promise<CarItem[]> {
    const isVinLookup = Boolean(query.q && /^[A-HJ-NPR-Z0-9]{17}$/i.test(query.q.trim()));
    const vinLookup = isVinLookup ? query.q?.trim().toUpperCase() : undefined;

    const params = new URLSearchParams({
      ...(this.apiKey ? { api_key: this.apiKey } : {}),
      ...(query.q ? { search: query.q } : {}),
      ...(vinLookup ? { vin: vinLookup } : {}),
      ...(query.make && query.make !== "all" ? { make: query.make } : {}),
      ...(query.minYear ? { year: String(query.minYear) } : {}),
      ...(query.maxMileageKm ? { miles_range: `0-${query.maxMileageKm}` } : {}),
      car_type: "used",
      rows: query.q ? "100" : "50",
    });

    const response = await fetch(`${this.endpoint}?${params.toString()}`, {
      headers: { Accept: "application/json" },
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`${this.source.toUpperCase()} provider responded with ${response.status}`);
    }

    const payload = (await response.json()) as
      | { listings?: Record<string, unknown>[]; items?: Record<string, unknown>[] }
      | Record<string, unknown>[];
    const items = Array.isArray(payload) ? payload : payload.listings ?? payload.items ?? [];

    return items.map((item, idx) => normalizeIncomingItem(this.source, item, idx));
  }
}
