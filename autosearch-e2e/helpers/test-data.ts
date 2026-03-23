export const TEST_USER = {
  username: "user",
  password: "user123",
} as const;

export const TEST_ADMIN = {
  username: "admin",
  password: "admin123",
} as const;

export const SEEDED_LOT = {
  lotNumber: "90000001",
  make: "BMW",
  model: "330i",
  year: 2020,
  detailTitle: "2020 BMW 330i",
} as const;

export const SEEDED_SOLD_LOT = {
  lotNumber: "90000002",
  make: "Audi",
  model: "A4",
  year: 2021,
  detailTitle: "2021 Audi A4",
} as const;

export const BID_VALUES = {
  maxBid: 12400,
  maxBidFormatted: "$12,400",
} as const;

export const IMPORT_MOCK = {
  lotUrl: "https://example.com/lot/99887766",
  message: "Lot imported successfully",
  detailsLine: "Imported: 2024 Ferrari SF90 (lot 99887766)",
  payload: {
    message: "Lot imported successfully",
    lot: {
      source: "marketcheck",
      lotNumber: "99887766",
      year: 2024,
      make: "Ferrari",
      model: "SF90",
    },
  },
} as const;
