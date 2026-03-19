import { CARS_DATA } from "@/lib/cars-data";
import { CarSearchQuery } from "@/lib/types";
import { AuctionProvider } from "@/lib/server/auction-provider";

export class MockAuctionProvider implements AuctionProvider {
  readonly source: "marketcheck";

  constructor(source: "marketcheck") {
    this.source = source;
  }

  async fetchCars(query: CarSearchQuery) {
    void query;
    return CARS_DATA.filter((item) => item.source === this.source);
  }
}
