import { CarItem, DamageType } from "@/lib/types";
import { filterVehicleImages } from "@/lib/vehicle-image-filter";

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=1200&q=80";

type ImportedLotPayload = {
  lot: CarItem;
  warning?: string;
};

type MaybeVehicleData = {
  year?: number;
  make?: string;
  model?: string;
  trim?: string;
  imageUrl?: string;
};

const KNOWN_MAKES = [
  "Acura",
  "Audi",
  "BMW",
  "Buick",
  "Cadillac",
  "Chevrolet",
  "Chrysler",
  "Dodge",
  "Ford",
  "GMC",
  "Honda",
  "Hyundai",
  "Infiniti",
  "Jeep",
  "Kia",
  "Lexus",
  "Mazda",
  "Mercedes",
  "Mercedes-Benz",
  "Mini",
  "Mitsubishi",
  "Nissan",
  "Porsche",
  "Ram",
  "Subaru",
  "Tesla",
  "Toyota",
  "Volkswagen",
  "Volvo",
];

function extractLotNumber(url: URL, html: string) {
  const fromQuery = url.searchParams.get("lot") ?? url.searchParams.get("lotNumber") ?? url.searchParams.get("lotId");
  if (fromQuery && /^\d{6,}$/.test(fromQuery)) {
    return fromQuery;
  }

  const fromPath = url.pathname.match(/(\d{6,})/);
  if (fromPath?.[1]) {
    return fromPath[1];
  }

  const fromHtml = html.match(/lot[^0-9]{0,12}(\d{6,})/i);
  if (fromHtml?.[1]) {
    return fromHtml[1];
  }

  return `${Date.now()}`;
}

function slugTokensFromUrl(url: URL) {
  const path = decodeURIComponent(url.pathname).toLowerCase();
  const cleaned = path
    .replace(/[^a-z0-9\-_/]/g, " ")
    .replace(/[\/._]/g, "-")
    .replace(/-+/g, "-")
    .trim();

  return cleaned
    .split("-")
    .map((part) => part.trim())
    .filter(Boolean)
    .filter((token) => !["lot", "details", "vehicle", "auction", "us", "en", "sale"].includes(token));
}

function titleCaseWord(value: string) {
  return value.slice(0, 1).toUpperCase() + value.slice(1).toLowerCase();
}

function inferVehicleFromUrl(url: URL): MaybeVehicleData {
  const tokens = slugTokensFromUrl(url);

  if (tokens.length === 0) {
    return {};
  }

  const yearIndex = tokens.findIndex((token) => /^(19\d{2}|20\d{2})$/.test(token));
  const year = yearIndex >= 0 ? Number(tokens[yearIndex]) : undefined;

  const makeIndex = tokens.findIndex((token) =>
    KNOWN_MAKES.some((make) => make.toLowerCase() === token.toLowerCase()),
  );

  if (makeIndex < 0) {
    return { year };
  }

  const normalizedMake =
    KNOWN_MAKES.find((make) => make.toLowerCase() === tokens[makeIndex].toLowerCase()) ??
    titleCaseWord(tokens[makeIndex]);

  const modelToken = tokens[makeIndex + 1];
  const model = modelToken ? titleCaseWord(modelToken) : undefined;

  const trimTokens = tokens.slice(makeIndex + 2, makeIndex + 5).filter((token) => !/^\d{6,}$/.test(token));
  const trim = trimTokens.length > 0 ? trimTokens.map(titleCaseWord).join(" ") : undefined;

  return {
    year,
    make: normalizedMake,
    model,
    trim,
  };
}

function normalizeSpaces(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function decodeHtmlEntities(value: string) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ");
}

function normalizeLabelKey(value: string) {
  return decodeHtmlEntities(value)
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function extractLabeledFields(html: string) {
  const fields = new Map<string, string>();
  const pattern = /<span[^>]*title=["']([^"']+)["'][^>]*>[\s\S]*?<\/span>\s*<div[^>]*title=["']([^"']*)["']/gi;

  for (const match of html.matchAll(pattern)) {
    const labelRaw = match[1];
    const valueRaw = match[2];

    const label = normalizeLabelKey(labelRaw);
    const value = normalizeSpaces(decodeHtmlEntities(valueRaw));

    if (!label || !value) {
      continue;
    }

    fields.set(label, value);
  }

  return fields;
}

function fieldFromMap(fields: Map<string, string>, labels: string[]) {
  for (const label of labels) {
    const key = normalizeLabelKey(label);
    const value = fields.get(key);
    if (value) {
      return value;
    }
  }

  return null;
}

function hasToken(text: string, token: string | undefined) {
  if (!token) {
    return false;
  }

  const normalized = token.trim().toLowerCase();
  if (!normalized) {
    return false;
  }

  return text.toLowerCase().includes(normalized);
}

function extractMetaContent(html: string, metaName: string) {
  const escaped = metaName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const patternA = new RegExp(
    `<meta[^>]+(?:name|property)=['\"]${escaped}['\"][^>]+content=['\"]([^'\"]+)['\"][^>]*>`,
    "i",
  );
  const patternB = new RegExp(
    `<meta[^>]+content=['\"]([^'\"]+)['\"][^>]+(?:name|property)=['\"]${escaped}['\"][^>]*>`,
    "i",
  );

  const matched = html.match(patternA) ?? html.match(patternB);
  return matched?.[1] ? decodeHtmlEntities(normalizeSpaces(matched[1])) : null;
}

function extractJsonLdBlocks(html: string) {
  const blocks = html.match(/<script[^>]+type=['\"]application\/ld\+json['\"][^>]*>[\s\S]*?<\/script>/gi) ?? [];

  return blocks
    .map((block) => block.replace(/^<script[^>]*>/i, "").replace(/<\/script>$/i, "").trim())
    .map((payload) => {
      try {
        return JSON.parse(payload) as unknown;
      } catch {
        return null;
      }
    })
    .filter((item): item is unknown => item !== null);
}

function vehicleFromJsonLd(html: string): MaybeVehicleData {
  const blocks = extractJsonLdBlocks(html);

  const candidates: Record<string, unknown>[] = [];

  for (const block of blocks) {
    if (Array.isArray(block)) {
      for (const entry of block) {
        if (entry && typeof entry === "object") {
          candidates.push(entry as Record<string, unknown>);
        }
      }
      continue;
    }

    if (block && typeof block === "object") {
      const obj = block as Record<string, unknown>;
      candidates.push(obj);

      const graph = obj["@graph"];
      if (Array.isArray(graph)) {
        for (const entry of graph) {
          if (entry && typeof entry === "object") {
            candidates.push(entry as Record<string, unknown>);
          }
        }
      }
    }
  }

  for (const entry of candidates) {
    const typeValue = String(entry["@type"] ?? "").toLowerCase();
    if (!typeValue.includes("vehicle") && !typeValue.includes("product")) {
      continue;
    }

    const year = Number(entry["vehicleModelDate"] ?? entry["modelDate"] ?? entry["year"]);
    const make = typeof entry.brand === "string" ? entry.brand : String(entry.make ?? "");
    const model = String(entry.model ?? "");
    const trim = String(entry.trim ?? entry.name ?? "");
    const imageRaw = entry.image;
    const imageUrl =
      typeof imageRaw === "string"
        ? imageRaw
        : Array.isArray(imageRaw) && typeof imageRaw[0] === "string"
          ? imageRaw[0]
          : undefined;

    return {
      year: Number.isFinite(year) ? year : undefined,
      make: make || undefined,
      model: model || undefined,
      trim: trim || undefined,
      imageUrl,
    };
  }

  return {};
}

function extractVin(html: string) {
  const vinMatch = html.match(/\b([A-HJ-NPR-Z0-9]{17})\b/);
  return vinMatch?.[1] ?? "UNKNOWNVIN0000000";
}

function extractVinFromUrl(url: URL) {
  const raw = decodeURIComponent(`${url.pathname} ${url.search}`);
  const vinMatch = raw.match(/\b([A-HJ-NPR-Z0-9]{17})\b/i);
  return vinMatch?.[1]?.toUpperCase() ?? null;
}

function extractTitle(html: string) {
  const titleMatch = html.match(/<title[^>]*>(.*?)<\/title>/i);
  if (!titleMatch?.[1]) {
    return "Imported lot";
  }

  return normalizeSpaces(decodeHtmlEntities(titleMatch[1]));
}

function detectLimitedAccess(html: string) {
  const lowered = html.toLowerCase();
  const signals = [
    "captcha",
    "verify you are human",
    "access denied",
    "cloudflare",
    "cf-chl",
    "bot detection",
  ];

  return signals.some((signal) => lowered.includes(signal));
}

function inferDamage(html: string): DamageType {
  const lowered = html.toLowerCase();

  if (lowered.includes("rollover")) {
    return "rollover";
  }

  if (lowered.includes("rear end")) {
    return "rear_end";
  }

  if (lowered.includes("side")) {
    return "side";
  }

  if (lowered.includes("hail")) {
    return "hail";
  }

  if (lowered.includes("mechanical")) {
    return "mechanical";
  }

  if (lowered.includes("front end")) {
    return "front_end";
  }

  return "normal_wear";
}

function inferDamageFromText(value: string | null): DamageType | null {
  if (!value) {
    return null;
  }

  const lowered = normalizeLabelKey(value);

  if (lowered.includes("przod") || lowered.includes("front")) {
    return "front_end";
  }

  if (lowered.includes("tyl") || lowered.includes("rear")) {
    return "rear_end";
  }

  if (lowered.includes("bok") || lowered.includes("side")) {
    return "side";
  }

  if (lowered.includes("rollover")) {
    return "rollover";
  }

  if (lowered.includes("hail")) {
    return "hail";
  }

  if (lowered.includes("mechanical") || lowered.includes("mechanic")) {
    return "mechanical";
  }

  return null;
}

function inferYear(title: string) {
  const match = title.match(/\b(19\d{2}|20\d{2})\b/);
  return match?.[1] ? Number(match[1]) : 2000;
}

function inferMileageKm(html: string, fields?: Map<string, string>) {
  const fromField = fields ? fieldFromMap(fields, ["Przebieg", "Mileage", "Odometer"]) : null;
  if (fromField) {
    const kmMatch = fromField.match(/([0-9][0-9\s,.]{1,12})\s*km/i);
    if (kmMatch?.[1]) {
      const km = Number(kmMatch[1].replace(/[^0-9]/g, ""));
      if (Number.isFinite(km) && km > 0) {
        return km;
      }
    }

    const mileMatch = fromField.match(/([0-9][0-9\s,.]{1,12})\s*mi/i);
    if (mileMatch?.[1]) {
      const miles = Number(mileMatch[1].replace(/[^0-9]/g, ""));
      if (Number.isFinite(miles) && miles > 0) {
        return Math.round(miles * 1.60934);
      }
    }
  }

  const mileageMatch = html.match(/(?:odometer|mileage)[^0-9]{0,30}([0-9][0-9,\.]{1,10})/i);
  if (!mileageMatch?.[1]) {
    return 0;
  }

  const miles = Number(mileageMatch[1].replace(/[^0-9]/g, ""));
  if (!Number.isFinite(miles) || miles <= 0) {
    return 0;
  }

  return Math.round(miles * 1.60934);
}

function inferBidUsd(html: string, fields?: Map<string, string>) {
  const fromField = fields
    ? fieldFromMap(fields, ["Current bid", "Current price", "Aktualna licytacja", "Aktualna oferta", "Winning bid"])
    : null;

  if (fromField) {
    const amount = Number(fromField.replace(/[^0-9.]/g, ""));
    if (Number.isFinite(amount)) {
      return Math.round(amount);
    }
  }

  const bidMatch = html.match(/(?:current\s+bid|current_bid|high\s+bid|max\s+bid|winning\s+bid)[^$0-9]{0,40}\$?\s*([0-9][0-9,\.]{1,12})/i);
  if (!bidMatch?.[1]) {
    return 0;
  }

  const amount = Number(bidMatch[1].replace(/[^0-9.]/g, ""));
  return Number.isFinite(amount) ? Math.round(amount) : 0;
}

function inferMoneyNearLabel(html: string, labels: string[], fields?: Map<string, string>) {
  if (fields) {
    const fieldValue = fieldFromMap(fields, labels);
    if (fieldValue) {
      const values = [...fieldValue.matchAll(/([0-9][0-9\s,.]{1,12})\s*\$/g)].map((match) =>
        Number(match[1].replace(/[^0-9]/g, "")),
      );

      const normalized = values.filter((value) => Number.isFinite(value));
      if (normalized.length > 0) {
        return Math.round(normalized[0]);
      }
    }
  }

  for (const label of labels) {
    const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const pattern = new RegExp(`${escaped}[^$0-9]{0,40}\\$?\\s*([0-9][0-9,\\.]{1,12})`, "i");
    const match = html.match(pattern);

    if (match?.[1]) {
      const amount = Number(match[1].replace(/[^0-9.]/g, ""));
      if (Number.isFinite(amount)) {
        return Math.round(amount);
      }
    }
  }

  return null;
}

function inferAcvErc(fields: Map<string, string>) {
  const value = fieldFromMap(fields, ["ACV • ERC", "ACV/ERC", "ACV ERC"]);
  if (!value) {
    return { acv: null, erc: null };
  }

  const amounts = [...value.matchAll(/([0-9][0-9\s,.]{1,12})\s*\$/g)]
    .map((match) => Number(match[1].replace(/[^0-9]/g, "")))
    .filter((amount) => Number.isFinite(amount));

  return {
    acv: amounts[0] ?? null,
    erc: amounts[1] ?? null,
  };
}

function inferLocation(html: string, url: URL) {
  const locationMatch = html.match(/(?:location|yard|branch)[^A-Za-z0-9]{0,20}([A-Za-z0-9 ,.-]{4,60})/i);
  if (locationMatch?.[1]) {
    return normalizeSpaces(locationMatch[1]);
  }

  return url.hostname;
}

function inferLocationWithFields(html: string, url: URL, fields?: Map<string, string>) {
  const fromField = fields ? fieldFromMap(fields, ["Lokalizacja", "Location", "Yard", "Branch"]) : null;
  if (fromField) {
    return fromField;
  }

  return inferLocation(html, url);
}

function inferValueByLabel(html: string, labels: string[], fallback: string) {
  for (const label of labels) {
    const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const pattern = new RegExp(`${escaped}[^A-Za-z0-9]{0,30}([A-Za-z0-9 ,\\-\\/.]{2,60})`, "i");
    const match = html.match(pattern);

    if (!match?.[1]) {
      continue;
    }

    const candidate = normalizeSpaces(decodeHtmlEntities(match[1])).replace(/[:|].*$/, "").trim();
    if (candidate.length >= 2) {
      return candidate;
    }
  }

  return fallback;
}

function inferTitleStatus(html: string) {
  const titleMatch = html.match(/(?:title\s*status|title)[^A-Za-z0-9]{0,20}([A-Za-z ]{3,40})/i);
  if (titleMatch?.[1]) {
    return normalizeSpaces(titleMatch[1]);
  }

  return "Imported";
}

function inferRunAndDrive(html: string) {
  return /run\s*(and|&)\s*drive/i.test(html);
}

function inferHasKeys(html: string) {
  return /\b(has\s+keys|keys\s*:\s*yes)\b/i.test(html);
}

function inferHasKeysWithFields(html: string, fields?: Map<string, string>) {
  const fromField = fields ? fieldFromMap(fields, ["Klucz dostępny", "Klucz dostepny", "Has keys", "Keys"]) : null;
  if (fromField) {
    return /tak|yes|available|1/i.test(normalizeLabelKey(fromField));
  }

  return inferHasKeys(html);
}

function inferRunAndDriveWithFields(html: string, fields?: Map<string, string>) {
  const fromField = fields ? fieldFromMap(fields, ["Stan", "Condition", "Status"]) : null;
  if (fromField) {
    return /odpala|run|drive|rusza/i.test(normalizeLabelKey(fromField));
  }

  return inferRunAndDrive(html);
}

function inferAuctionStatus(html: string, fields?: Map<string, string>) {
  const fromField = fields ? fieldFromMap(fields, ["Status sprzedaży", "Status sprzedazy", "Sale status"]) : null;
  if (fromField) {
    return fromField;
  }

  const match = html.match(/(?:sale\s+status|status\s+sprzed[aą]?[żz]y)[^A-Za-z0-9]{0,25}([A-Za-z\s]+)/i);
  if (match?.[1]) {
    return normalizeSpaces(match[1]);
  }

  return undefined;
}

function absoluteUrlOrNull(value: string, baseUrl: URL) {
  try {
    const normalized = new URL(value, baseUrl);
    if (!/^https?:$/i.test(normalized.protocol)) {
      return null;
    }
    return normalized.toString();
  } catch {
    return null;
  }
}

function shouldSkipImage(url: string) {
  const lowered = url.toLowerCase();

  return (
    lowered.includes("logo") ||
    lowered.includes("icon") ||
    lowered.includes("sprite") ||
    lowered.includes("avatar") ||
    lowered.includes("placeholder") ||
    lowered.includes("1x1")
  );
}

function extractImageUrls(html: string, url: URL) {
  const found = new Set<string>();

  const metaCandidates = [
    extractMetaContent(html, "og:image"),
    extractMetaContent(html, "twitter:image"),
    extractMetaContent(html, "twitter:image:src"),
  ].filter((value): value is string => Boolean(value));

  for (const item of metaCandidates) {
    const absolute = absoluteUrlOrNull(item, url);
    if (absolute && !shouldSkipImage(absolute)) {
      found.add(absolute);
    }
  }

  const attributePattern = /(src|data-src|data-lazy|data-original|data-image|content)=["']([^"']+\.(?:jpg|jpeg|png|webp)(?:\?[^"']*)?)["']/gi;
  for (const match of html.matchAll(attributePattern)) {
    const candidate = match[2];
    const absolute = absoluteUrlOrNull(candidate, url);
    if (absolute && !shouldSkipImage(absolute)) {
      found.add(absolute);
    }
  }

  const absolutePattern = /https?:\/\/[^\s"'<>]+\.(?:jpg|jpeg|png|webp)(?:\?[^\s"'<>]*)?/gi;
  for (const match of html.matchAll(absolutePattern)) {
    const candidate = match[0];
    if (!shouldSkipImage(candidate)) {
      found.add(candidate);
    }
  }

  const jsonPhotoPattern = /"(?:photo_links_cached|photo_links|images|imageUrls|gallery|photos)"\s*:\s*\[(.*?)\]/gis;
  for (const block of html.matchAll(jsonPhotoPattern)) {
    const rawBlock = block[1] ?? "";
    for (const imageMatch of rawBlock.matchAll(/"(https?:\\\/\\\/[^"\\]+(?:\\\/[^"\\]+)*\.(?:jpg|jpeg|png|webp)(?:\\\?[^"\\]+)?)"/gi)) {
      const decoded = imageMatch[1].replace(/\\\//g, "/");
      if (!shouldSkipImage(decoded)) {
        found.add(decoded);
      }
    }
  }

  return [...found];
}

function inferImageUrl(html: string) {
  const fromMeta =
    extractMetaContent(html, "og:image") ??
    extractMetaContent(html, "twitter:image") ??
    extractMetaContent(html, "twitter:image:src");

  if (fromMeta && /^https?:\/\//i.test(fromMeta)) {
    return fromMeta;
  }

  const fromMarkup = html.match(/https?:\/\/[^\s"'<>]+\.(?:jpg|jpeg|png|webp)(?:\?[^\s"'<>]*)?/i);
  if (fromMarkup?.[0]) {
    return fromMarkup[0];
  }

  return FALLBACK_IMAGE;
}

function inferMakeModel(title: string) {
  const cleaned = title.replace(/\|.*$/, "").trim();
  const parts = cleaned.split(/\s+/);

  if (parts.length < 3) {
    return {
      make: "Unknown",
      model: "Model",
      trim: "Imported",
    };
  }

  const yearLike = parts[0].match(/^(19\d{2}|20\d{2})$/);
  const startIndex = yearLike ? 1 : 0;

  const maybeMake = parts[startIndex] ?? "Unknown";
  const normalizedMake =
    KNOWN_MAKES.find((item) => item.toLowerCase() === maybeMake.toLowerCase()) ?? maybeMake;

  return {
    make: normalizedMake,
    model: parts[startIndex + 1] ?? "Model",
    trim: parts.slice(startIndex + 2, startIndex + 6).join(" ") || "Imported",
  };
}

export async function importLotFromUrl(rawUrl: string): Promise<ImportedLotPayload> {
  let parsedUrl: URL;

  try {
    parsedUrl = new URL(rawUrl);
  } catch {
    throw new Error("Invalid URL format");
  }

  const source = "marketcheck" as const;

  const response = await fetch(parsedUrl.toString(), {
    method: "GET",
    cache: "no-store",
    headers: {
      "User-Agent": "AutoScopeDemo/1.0 (+local import)",
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.9",
    },
  });

  if (!response.ok) {
    throw new Error(`Could not fetch lot page (${response.status})`);
  }

  const html = await response.text();
  const labeledFields = extractLabeledFields(html);
  const pageTitle =
    extractMetaContent(html, "og:title") ?? extractMetaContent(html, "twitter:title") ?? extractTitle(html);
  const jsonLdVehicle = vehicleFromJsonLd(html);
  const urlVehicle = inferVehicleFromUrl(parsedUrl);
  const year = jsonLdVehicle.year ?? urlVehicle.year ?? inferYear(pageTitle);
  const lotNumber = extractLotNumber(parsedUrl, html);
  const vin = extractVin(html) !== "UNKNOWNVIN0000000" ? extractVin(html) : (extractVinFromUrl(parsedUrl) ?? "UNKNOWNVIN0000000");
  const makeModel = inferMakeModel(pageTitle);
  const mileageKm = inferMileageKm(html, labeledFields);
  const auctionStatus = inferAuctionStatus(html, labeledFields);
  const isSold = auctionStatus ? /sprzedan|sold/i.test(normalizeLabelKey(auctionStatus)) : false;
  const parsedBid = inferBidUsd(html, labeledFields);
  const lotAsNumber = Number(lotNumber);
  const currentBidUsd = isSold || (!Number.isNaN(lotAsNumber) && parsedBid === lotAsNumber) ? 0 : parsedBid;
  const acvErc = inferAcvErc(labeledFields);
  const estimateMin =
    acvErc.acv ??
    inferMoneyNearLabel(html, ["estimate min", "min estimate", "starting bid", "opening bid"], labeledFields) ??
    null;
  const estimateMax =
    acvErc.erc ??
    inferMoneyNearLabel(html, ["estimate max", "max estimate", "buy now", "retail value", "estimated retail value"], labeledFields) ??
    null;
  const rawImages = extractImageUrls(html, parsedUrl);
  const lotScopedImages = rawImages.filter((item) => {
    const decoded = decodeURIComponent(item);
    return hasToken(item, lotNumber) || hasToken(decoded, lotNumber) || hasToken(item, vin) || hasToken(decoded, vin);
  });
  const sourceImages = lotScopedImages.length >= 3 ? lotScopedImages : rawImages;
  const preliminaryImage = rawImages[0] ?? jsonLdVehicle.imageUrl ?? inferImageUrl(html);
  const imageUrls = filterVehicleImages(sourceImages.length > 0 ? sourceImages : [preliminaryImage], {
    id: `${source}-${lotNumber}`,
    vin,
    lotNumber,
    imageUrl: preliminaryImage,
  });
  const imageUrl = imageUrls[0] ?? preliminaryImage;
  const limitedAccess = detectLimitedAccess(html);
  const driveInfo = fieldFromMap(labeledFields, ["Napęd", "Naped", "Powertrain"]);
  const driveParts = driveInfo ? driveInfo.split("•").map((part) => normalizeSpaces(part)) : [];
  const transmission =
    driveParts.find((part) => /\bat\b|\bmt\b|automatic|manual|cvt|dct/i.test(part)) ??
    inferValueByLabel(html, ["transmission", "gearbox"], "AT");
  const drivetrain =
    driveParts.find((part) => /4x4|awd|fwd|rwd/i.test(part)) ?? inferValueByLabel(html, ["drivetrain", "drive type", "drive train"], "Not provided");
  const engine =
    driveParts
      .filter((part) => !/4x4|awd|fwd|rwd|\bat\b|\bmt\b|automatic|manual|cvt|dct/i.test(part))
      .join(" • ") || inferValueByLabel(html, ["engine", "motor", "cylinders", "powertrain"], "Not provided");
  const sellerType =
    fieldFromMap(labeledFields, ["Typ sprzedawcy", "Sprzedawca", "Seller type", "Seller", "Sale type"]) ??
    inferValueByLabel(html, ["seller type", "seller", "sale type"], "Unknown");
  const documentType = fieldFromMap(labeledFields, ["Typ dokumentu", "Document type", "Title type"]);
  const documentStatus = fieldFromMap(labeledFields, ["Status dokumentów", "Status dokumentow", "Document status", "Title status"]);
  const titleStatus = [documentType, documentStatus].filter(Boolean).join(" • ") || inferTitleStatus(html);
  const mainDamage = inferDamageFromText(fieldFromMap(labeledFields, ["Uszkodzenie główne", "Uszkodzenie glowne", "Primary damage"]));
  const secondaryDamage = inferDamageFromText(fieldFromMap(labeledFields, ["Uszkodzenie dodatkowe", "Secondary damage"]));
  const damage = mainDamage ?? secondaryDamage ?? inferDamage(html);

  const lot: CarItem = {
    id: `${source}-${lotNumber}`,
    source,
    lotNumber,
    vin,
    year,
    make: jsonLdVehicle.make ?? urlVehicle.make ?? makeModel.make,
    model: jsonLdVehicle.model ?? urlVehicle.model ?? makeModel.model,
    trim: jsonLdVehicle.trim ?? urlVehicle.trim ?? (limitedAccess ? "Imported (limited data)" : makeModel.trim),
    engine,
    drivetrain,
    transmission,
    mileageKm,
    location: inferLocationWithFields(html, parsedUrl, labeledFields),
    damage,
    titleStatus,
    sellerType,
    runAndDrive: inferRunAndDriveWithFields(html, labeledFields),
    hasKeys: inferHasKeysWithFields(html, labeledFields),
    auctionStatus,
    estimateMinUsd: estimateMin ?? (currentBidUsd > 0 ? Math.round(currentBidUsd * 0.95) : 0),
    estimateMaxUsd: estimateMax ?? (currentBidUsd > 0 ? Math.round(currentBidUsd * 1.2) : 0),
    currentBidUsd,
    imageUrl,
    imageUrls,
  };

  const sparseData =
    lot.make === "Unknown" ||
    lot.model === "Model" ||
    lot.vin === "UNKNOWNVIN0000000" ||
    lot.imageUrl === FALLBACK_IMAGE;

  return {
    lot,
    ...(limitedAccess || sparseData
      ? {
          warning:
            "Imported with partial data. Auction page likely returned limited content (anti-bot/login protection or dynamic JS-only fields).",
        }
      : {}),
  };
}
