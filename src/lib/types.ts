export type AuctionSource = "marketcheck";

export type DamageType =
  | "front_end"
  | "rear_end"
  | "side"
  | "hail"
  | "mechanical"
  | "minor_dent_scratches"
  | "all_over"
  | "undercarriage"
  | "rollover"
  | "normal_wear";

export type CarItem = {
  id: string;
  source: AuctionSource;
  lotNumber: string;
  vin: string;
  year: number;
  make: string;
  model: string;
  trim: string;
  engine: string;
  drivetrain: string;
  transmission: string;
  bodyStyle?: string;
  exteriorColor?: string;
  fuelType?: string;
  mileageKm: number;
  location: string;
  damage: DamageType;
  titleStatus: string;
  sellerType: string;
  runAndDrive: boolean;
  hasKeys: boolean;
  auctionStatus?: string;
  estimateMinUsd: number;
  estimateMaxUsd: number;
  currentBidUsd: number;
  imageUrl: string;
  imageUrls?: string[];
};

export type CarSearchQuery = {
  q?: string;
  make?: string;
  source?: AuctionSource | "all";
  minYear?: number;
  maxYear?: number;
  maxMileageKm?: number;
  sort?: "ending_soon" | "newest" | "price_low" | "price_high";
  page?: number;
};
