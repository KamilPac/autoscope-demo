export function toDisplayImageUrl(rawUrl: string) {
  if (!rawUrl) {
    return rawUrl;
  }

  try {
    const url = new URL(rawUrl);
    const isMarketcheckImage = url.hostname === "api.marketcheck.com" && url.pathname.startsWith("/v2/image/");

    if (!isMarketcheckImage) {
      return rawUrl;
    }

    const proxiedPath = `${url.pathname}${url.search}`;
    return `/api/image/marketcheck?url=${encodeURIComponent(proxiedPath)}`;
  } catch {
    return rawUrl;
  }
}
