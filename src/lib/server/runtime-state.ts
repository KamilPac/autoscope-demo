export type AuctionRuntimeState = {
  mode: "demo" | "live";
  marketcheckConfigured: boolean;
  liveReady: boolean;
};

export function getAuctionRuntimeState(): AuctionRuntimeState {
  const mode = process.env.AUCTION_DATA_MODE?.toLowerCase() === "live" ? "live" : "demo";
  const marketcheckConfigured = Boolean(process.env.MARKETCHECK_PROVIDER_URL);

  return {
    mode,
    marketcheckConfigured,
    liveReady: mode === "live" && marketcheckConfigured,
  };
}
