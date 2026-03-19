import { CarItem, CarSearchQuery } from "@/lib/types";

export interface AuctionProvider {
  readonly source: "marketcheck";
  fetchCars(query: CarSearchQuery): Promise<CarItem[]>;
}

export function deduplicateCars(items: CarItem[]) {
  const seen = new Set<string>();

  return items.filter((item) => {
    if (seen.has(item.id)) {
      return false;
    }

    seen.add(item.id);
    return true;
  });
}
