import { CarSearchQuery } from "@/lib/types";

type SearchParams = {
  [key: string]: string | string[] | undefined;
};

function toNumber(value: string | string[] | undefined) {
  const raw = Array.isArray(value) ? value[0] : value;
  if (!raw) {
    return undefined;
  }

  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function toString(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }

  return value ?? "";
}

export function parseSearchParams(searchParams: SearchParams): CarSearchQuery {
  return {
    q: toString(searchParams.q),
    make: toString(searchParams.make) || "all",
    source: (toString(searchParams.source) as CarSearchQuery["source"]) || "all",
    damage: (toString(searchParams.damage) as CarSearchQuery["damage"]) || "all",
    minYear: toNumber(searchParams.minYear),
    maxYear: toNumber(searchParams.maxYear),
    maxMileageKm: toNumber(searchParams.maxMileageKm),
    sort: (toString(searchParams.sort) as CarSearchQuery["sort"]) || "ending_soon",
    page: toNumber(searchParams.page),
  };
}

export function buildQueryString(params: CarSearchQuery, page: number) {
  return new URLSearchParams({
    ...(params.q ? { q: params.q } : {}),
    ...(params.make && params.make !== "all" ? { make: params.make } : {}),
    ...(params.source && params.source !== "all" ? { source: params.source } : {}),
    ...(params.damage && params.damage !== "all" ? { damage: params.damage } : {}),
    ...(params.minYear ? { minYear: String(params.minYear) } : {}),
    ...(params.maxYear ? { maxYear: String(params.maxYear) } : {}),
    ...(params.maxMileageKm ? { maxMileageKm: String(params.maxMileageKm) } : {}),
    ...(params.sort ? { sort: params.sort } : {}),
    page: String(page),
  }).toString();
}
