import { CarItem, CarSearchQuery } from "@/lib/types";

const PAGE_SIZE = 9;

function compareBySort(a: CarItem, b: CarItem, sort: NonNullable<CarSearchQuery["sort"]>) {
  if (sort === "newest") {
    return b.year - a.year;
  }

  if (sort === "price_low") {
    return a.currentBidUsd - b.currentBidUsd;
  }

  if (sort === "price_high") {
    return b.currentBidUsd - a.currentBidUsd;
  }

  return a.estimateMaxUsd - b.estimateMaxUsd;
}

export function filterCars(cars: CarItem[], query: CarSearchQuery) {
  const q = query.q?.trim().toLowerCase();
  const sort = query.sort ?? "ending_soon";

  const filtered = cars
    .filter((car) => {
      if (q) {
        const searchable = [
          car.make,
          car.model,
          car.trim,
          car.vin,
          car.lotNumber,
          car.location,
        ]
          .join(" ")
          .toLowerCase();

        if (!searchable.includes(q)) {
          return false;
        }
      }

      if (query.make && query.make !== "all" && car.make !== query.make) {
        return false;
      }

      if (query.source && query.source !== "all" && car.source !== query.source) {
        return false;
      }

      if (query.damage && query.damage !== "all" && car.damage !== query.damage) {
        return false;
      }

      if (query.minYear && car.year < query.minYear) {
        return false;
      }

      if (query.maxYear && car.year > query.maxYear) {
        return false;
      }

      if (query.maxMileageKm && car.mileageKm > query.maxMileageKm) {
        return false;
      }

      return true;
    })
    .sort((a, b) => compareBySort(a, b, sort));

  const page = query.page && query.page > 0 ? query.page : 1;
  const totalItems = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * PAGE_SIZE;
  const pagedItems = filtered.slice(start, start + PAGE_SIZE);

  return {
    items: pagedItems,
    totalItems,
    totalPages,
    page: safePage,
    pageSize: PAGE_SIZE,
  };
}
