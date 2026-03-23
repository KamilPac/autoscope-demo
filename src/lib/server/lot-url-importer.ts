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

type BrowserExtractResult = {
  html: string;
  fields: Array<[string, string]>;
  images: string[];
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

function cleanRepeatedFieldValue(value: string | null | undefined, fallback: string) {
  const initial = sanitizeExtractedValue(value);
  if (!initial) {
    return fallback;
  }

  let cleaned = normalizeSpaces(initial.replace(/\s*\|\s*$/, ""));

  const duplicatedWithPipe = cleaned.match(/^(.{2,120}?)\s*\|\s*\1$/i);
  if (duplicatedWithPipe?.[1]) {
    cleaned = normalizeSpaces(duplicatedWithPipe[1]);
  }

  if (cleaned.length >= 4 && cleaned.length % 2 === 0) {
    const half = cleaned.length / 2;
    const left = cleaned.slice(0, half).trim();
    const right = cleaned.slice(half).trim();
    if (left && right && normalizeLabelKey(left) === normalizeLabelKey(right)) {
      cleaned = left;
    }
  }

  const finalValue = sanitizeExtractedValue(cleaned);
  return finalValue ?? fallback;
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

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function sanitizeExtractedValue(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  const normalized = normalizeSpaces(decodeHtmlEntities(value).replace(/<[^>]+>/g, " "));
  if (!normalized) {
    return null;
  }

  const lowered = normalized.toLowerCase();
  if (
    lowered === "span" ||
    lowered.includes("span class") ||
    lowered.includes("meta name") ||
    lowered === "href" ||
    lowered.startsWith("class ") ||
    lowered === "id" ||
    lowered === "type" ||
    lowered === "content" ||
    lowered === "src"
  ) {
    return null;
  }

  return normalized;
}

function extractLabeledFields(html: string) {
  const fields = new Map<string, string>();
  const pushPair = (labelRaw: string | undefined, valueRaw: string | undefined) => {
    const label = normalizeLabelKey(labelRaw ?? "");
    const value = sanitizeExtractedValue(valueRaw);

    if (!label || !value) {
      return;
    }

    fields.set(label, value);
  };

  const titlePattern = /<span[^>]*title=["']([^"']+)["'][^>]*>[\s\S]*?<\/span>\s*<div[^>]*title=["']([^"']*)["']/gi;
  for (const match of html.matchAll(titlePattern)) {
    pushPair(match[1], match[2]);
  }

  const thTdPattern = /<tr[^>]*>[\s\S]{0,220}?<th[^>]*>([\s\S]*?)<\/th>[\s\S]{0,260}?<td[^>]*>([\s\S]*?)<\/td>[\s\S]*?<\/tr>/gi;
  for (const match of html.matchAll(thTdPattern)) {
    pushPair(match[1], match[2]);
  }

  const dtDdPattern = /<dt[^>]*>([\s\S]*?)<\/dt>[\s\S]{0,260}?<dd[^>]*>([\s\S]*?)<\/dd>/gi;
  for (const match of html.matchAll(dtDdPattern)) {
    pushPair(match[1], match[2]);
  }

  const rowPattern = /<div[^>]*class=["'][^"']*(?:row|item|field)[^"']*["'][^>]*>[\s\S]{0,260}?<span[^>]*class=["'][^"']*(?:label|name|title)[^"']*["'][^>]*>([\s\S]*?)<\/span>[\s\S]{0,260}?<span[^>]*class=["'][^"']*(?:value|data)[^"']*["'][^>]*>([\s\S]*?)<\/span>[\s\S]*?<\/div>/gi;
  for (const match of html.matchAll(rowPattern)) {
    pushPair(match[1], match[2]);
  }

  const jsonLabelPattern = /"label"\s*:\s*"([^"]{2,80})"[\s\S]{0,120}?"value"\s*:\s*"([^"]{1,140})"/gi;
  for (const match of html.matchAll(jsonLabelPattern)) {
    pushPair(match[1], match[2].replace(/\\\//g, "/"));
  }

  return fields;
}

function mapFromPairs(pairs: Array<[string, string]>) {
  const fields = new Map<string, string>();

  for (const [rawLabel, rawValue] of pairs) {
    const label = normalizeLabelKey(rawLabel);
    const value = sanitizeExtractedValue(rawValue);
    if (!label || !value) {
      continue;
    }

    fields.set(label, value);
  }

  return fields;
}

function mergeFields(primary: Map<string, string>, secondary: Map<string, string>) {
  const merged = new Map<string, string>(primary);
  for (const [key, value] of secondary.entries()) {
    merged.set(key, value);
  }
  return merged;
}

function isChallengePage(html: string) {
  const lowered = html.toLowerCase();
  return (
    lowered.includes("just a moment") ||
    lowered.includes("cf-challenge") ||
    lowered.includes("cloudflare") ||
    lowered.includes("enable javascript and cookies to continue")
  );
}

async function fetchWithBrowser(url: string): Promise<BrowserExtractResult> {
  const playwright = await import("playwright");
  const runExtract = async (headless: boolean) => {
    const browser = await playwright.chromium.launch({
      headless,
      args: ["--disable-blink-features=AutomationControlled"],
    });

    try {
      const context = await browser.newContext({
        locale: "pl-PL",
        userAgent:
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        viewport: { width: 1480, height: 1000 },
      });

      const page = await context.newPage();
      await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 });
      await page.waitForTimeout(headless ? 3500 : 6000);

      const extracted = await page.evaluate(() => {
        const normalize = (value: string) => value.replace(/\s+/g, " ").trim();

        const fields: Array<[string, string]> = [];
        const pushField = (labelRaw: string | null | undefined, valueRaw: string | null | undefined) => {
          const label = normalize(labelRaw ?? "").replace(/:+$/, "");
          const value = normalize(valueRaw ?? "");
          if (!label || !value || label.length < 2 || value.length < 1) {
            return;
          }

          fields.push([label, value]);
        };

        for (const row of Array.from(document.querySelectorAll("li, tr, .row, .item, .field"))) {
          const text = normalize((row as HTMLElement).innerText || row.textContent || "");
          const colon = text.match(/^([^:]{2,50}):\s*(.{1,180})$/);
          if (colon) {
            pushField(colon[1], colon[2]);
          }
        }

        for (const labelEl of Array.from(document.querySelectorAll("span, div, th, dt, strong, b"))) {
          const labelText = normalize((labelEl as HTMLElement).innerText || labelEl.textContent || "");
          if (!labelText || !labelText.endsWith(":")) {
            continue;
          }

          const cleanedLabel = labelText.slice(0, -1).trim();
          const sibling = (labelEl as HTMLElement).nextElementSibling as HTMLElement | null;
          if (sibling) {
            const siblingText = normalize(sibling.innerText || sibling.textContent || "");
            if (siblingText) {
              pushField(cleanedLabel, siblingText);
              continue;
            }
          }
        }

        const pageText = normalize(document.body.innerText || "");
        const patterns: Array<[string, RegExp]> = [
          ["Lokalizacja", /Lokalizacja:\s*([^\n]{2,80})/i],
          ["Przebieg", /Przebieg\s*([^\n]{2,80})/i],
          ["Status", /Status\s*([^\n]{2,80})/i],
          ["Kluczyk", /Kluczyk\s*([^\n]{2,80})/i],
          ["ACV • ERC", /ACV\s*[•/]\s*ERC\s*([^\n]{2,120})/i],
          ["Rodzaj nadwozia", /Rodzaj nadwozia\s*([^\n]{2,80})/i],
          ["Silnik", /Silnik\s*([^\n]{2,100})/i],
          ["Skrzynia biegów", /Skrzynia bieg[oó]w\s*([^\n]{2,80})/i],
          ["Typ napędu", /Typ nap[eę]du\s*([^\n]{2,80})/i],
          ["Typ paliwa", /Typ paliwa\s*([^\n]{2,80})/i],
          ["Główne uszkodzenie", /G[łl][oó]wne uszk\.?\s*([^\n]{2,80})/i],
          ["Pozostałe uszkodzenie", /Pozosta[łl]e uszk\.?\s*([^\n]{2,80})/i],
          ["Status sprzedaży", /Status sprzeda[żz]y\s*([^\n]{2,80})/i],
        ];

        for (const [label, pattern] of patterns) {
          const match = pageText.match(pattern);
          if (match?.[1]) {
            pushField(label, match[1]);
          }
        }

        const images = Array.from(document.querySelectorAll("img"))
          .map((img) => (img as HTMLImageElement).currentSrc || (img as HTMLImageElement).src || "")
          .map((src) => normalize(src))
          .filter((src) => /^https?:\/\//i.test(src));

        return {
          html: document.documentElement.outerHTML,
          fields,
          images,
        };
      });

      await context.close();
      return extracted;
    } finally {
      await browser.close();
    }
  };

  const headlessResult = await runExtract(true);
  if (!isChallengePage(headlessResult.html)) {
    return headlessResult;
  }

  return runExtract(false);
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

function extractFieldByVisibleLabel(html: string, labels: string[]) {
  for (const label of labels) {
    const escaped = escapeRegex(label);

    const withTitle = new RegExp(
      `<span[^>]*title=["']${escaped}["'][^>]*>[\\s\\S]*?<\\/span>[\\s\\S]{0,220}?<div[^>]*title=["']([^"']+)["']`,
      "i",
    );
    const withTitleMatch = html.match(withTitle);
    const valueFromTitle = sanitizeExtractedValue(withTitleMatch?.[1]);
    if (valueFromTitle) {
      return valueFromTitle;
    }

    const withSpan = new RegExp(`>${escaped}<\\/span>[\\s\\S]{0,260}?<span[^>]*>([^<]{1,140})<\\/span>`, "i");
    const withSpanMatch = html.match(withSpan);
    const valueFromSpan = sanitizeExtractedValue(withSpanMatch?.[1]);
    if (valueFromSpan) {
      return valueFromSpan;
    }
  }

  return null;
}

function extractFieldFromPageText(html: string, labels: string[]) {
  const plainText = normalizeSpaces(
    decodeHtmlEntities(
      html
        .replace(/<script[\s\S]*?<\/script>/gi, " ")
        .replace(/<style[\s\S]*?<\/style>/gi, " ")
        .replace(/<[^>]+>/g, " "),
    ),
  );

  for (const label of labels) {
    const escaped = escapeRegex(label).replace(/\s+/g, "\\s+");
    const withColon = new RegExp(`${escaped}\\s*:\\s*([^$]{1,140}?)(?=(?:\\s+[A-ZĄĆĘŁŃÓŚŹŻ][^:]{1,40}:)|$)`, "i");
    const colonMatch = plainText.match(withColon);
    const colonValue = sanitizeExtractedValue(colonMatch?.[1]);
    if (colonValue) {
      return colonValue;
    }

    const withoutColon = new RegExp(`${escaped}\\s+([^$]{1,120}?)(?=(?:\\s+[A-ZĄĆĘŁŃÓŚŹŻ][^:]{1,40}\\s)|$)`, "i");
    const plainMatch = plainText.match(withoutColon);
    const plainValue = sanitizeExtractedValue(plainMatch?.[1]);
    if (plainValue) {
      return plainValue;
    }
  }

  return null;
}

function readField(html: string, fields: Map<string, string>, labels: string[]) {
  return fieldFromMap(fields, labels) ?? extractFieldByVisibleLabel(html, labels) ?? extractFieldFromPageText(html, labels);
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
  const fromField = fields ? readField(html, fields, ["Przebieg", "Mileage", "Odometer"]) : null;
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
    ? readField(html, fields, ["Current bid", "Current price", "Aktualna licytacja", "Aktualna oferta", "Winning bid", "Bid"])
    : null;

  if (fromField) {
    const amount = Number(fromField.replace(/[^0-9.]/g, ""));
    if (Number.isFinite(amount)) {
      return Math.round(amount);
    }
  }

  const bidMatch = html.match(/(?:current\s+bid|current_bid|high\s+bid|max\s+bid|winning\s+bid|aktualna\s+licytacja)[^$0-9]{0,40}\$?\s*([0-9][0-9,\.]{1,12})/i);
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
  const value = fieldFromMap(fields, ["ACV • ERC", "ACV/ERC", "ACV ERC", "Acv/Erc"]);
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
    const sanitized = sanitizeExtractedValue(locationMatch[1]);
    if (sanitized) {
      return sanitized;
    }
  }

  return url.hostname;
}

function inferLocationWithFields(html: string, url: URL, fields?: Map<string, string>) {
  const fromField = fields ? readField(html, fields, ["Lokalizacja", "Location", "Yard", "Branch"]) : null;
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
    const sanitized = sanitizeExtractedValue(candidate);
    if (sanitized && sanitized.length >= 2) {
      return sanitized;
    }
  }

  return fallback;
}

function inferTitleStatus(html: string) {
  const titleMatch = html.match(/(?:title\s*status|title)[^A-Za-z0-9]{0,20}([A-Za-z ]{3,40})/i);
  if (titleMatch?.[1]) {
    const sanitized = sanitizeExtractedValue(titleMatch[1]);
    if (sanitized) {
      return sanitized;
    }
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
  const fromField = fields ? readField(html, fields, ["Klucz dostępny", "Klucz dostepny", "Kluczyki", "Has keys", "Keys"]) : null;
  if (fromField) {
    return /tak|yes|available|1/i.test(normalizeLabelKey(fromField));
  }

  return inferHasKeys(html);
}

function inferRunAndDriveWithFields(html: string, fields?: Map<string, string>) {
  const fromField = fields ? readField(html, fields, ["Stan", "Condition", "Status"]) : null;
  if (fromField) {
    return /odpala|run|drive|rusza/i.test(normalizeLabelKey(fromField));
  }

  return inferRunAndDrive(html);
}

function inferAuctionStatus(html: string, fields?: Map<string, string>) {
  const fromField = fields ? readField(html, fields, ["Status sprzedaży", "Status sprzedazy", "Sale status"]) : null;
  if (fromField) {
    return fromField;
  }

  const match = html.match(/(?:sale\s+status|status\s+sprzed[aą]?[żz]y)[^A-Za-z0-9]{0,25}([A-Za-z\s]+)/i);
  if (match?.[1]) {
    return sanitizeExtractedValue(match[1]) ?? undefined;
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

function imageCanonicalKey(urlValue: string) {
  try {
    const parsed = new URL(urlValue);
    const host = parsed.hostname.toLowerCase();
    const pathParts = parsed.pathname.split("/").filter(Boolean);
    const last = decodeURIComponent(pathParts[pathParts.length - 1] ?? "").toLowerCase();

    if ((host.includes("images.bid.cars") || host.includes("pluto.bid.car") || host.includes("bid.cars")) && last) {
      return `bidcars:${last}`;
    }

    if (host.includes("dreambid") && last) {
      return `${host}:${last}`;
    }

    return `${host}:${parsed.pathname.toLowerCase()}`;
  } catch {
    return urlValue.toLowerCase();
  }
}

function extractImageUrls(html: string, url: URL) {
  const found = new Map<string, string>();

  const pushImage = (candidate: string) => {
    const absolute = absoluteUrlOrNull(candidate, url);
    if (!absolute || shouldSkipImage(absolute)) {
      return;
    }

    const key = imageCanonicalKey(absolute);
    if (!found.has(key)) {
      found.set(key, absolute);
    }
  };

  const metaCandidates = [
    extractMetaContent(html, "og:image"),
    extractMetaContent(html, "twitter:image"),
    extractMetaContent(html, "twitter:image:src"),
  ].filter((value): value is string => Boolean(value));

  for (const item of metaCandidates) {
    pushImage(item);
  }

  const attributePattern = /(src|data-src|data-lazy|data-original|data-image|content)=["']([^"']+\.(?:jpg|jpeg|png|webp)(?:\?[^"']*)?)["']/gi;
  for (const match of html.matchAll(attributePattern)) {
    pushImage(match[2]);
  }

  const absolutePattern = /https?:\/\/[^\s"'<>]+\.(?:jpg|jpeg|png|webp)(?:\?[^\s"'<>]*)?/gi;
  for (const match of html.matchAll(absolutePattern)) {
    pushImage(match[0]);
  }

  const jsonPhotoPattern = /"(?:photo_links_cached|photo_links|images|imageUrls|gallery|photos)"\s*:\s*\[([\s\S]*?)\]/gi;
  for (const block of html.matchAll(jsonPhotoPattern)) {
    const rawBlock = block[1] ?? "";
    for (const imageMatch of rawBlock.matchAll(/"(https?:\\\/\\\/[^"\\]+(?:\\\/[^"\\]+)*\.(?:jpg|jpeg|png|webp)(?:\\\?[^"\\]+)?)"/gi)) {
      const decoded = imageMatch[1].replace(/\\\//g, "/");
      pushImage(decoded);
    }
  }

  return [...found.values()];
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

  let html = "";
  let browserFields = new Map<string, string>();
  let browserImages: string[] = [];
  const isBidCarsLike = /(^|\.)bid\.cars$/i.test(parsedUrl.hostname) || /(^|\.)dreambid\.pl$/i.test(parsedUrl.hostname);

  if (isBidCarsLike) {
    try {
      const browserExtracted = await fetchWithBrowser(parsedUrl.toString());
      if (!isChallengePage(browserExtracted.html)) {
        html = browserExtracted.html;
        browserFields = mapFromPairs(browserExtracted.fields);
        browserImages = browserExtracted.images;
      }
    } catch {
      // Continue with HTTP response fallback when browser extraction fails.
    }
  }

  if (!html && response.ok) {
    html = await response.text();
  }

  if (!response.ok || isChallengePage(html)) {
    if (!isBidCarsLike) {
      throw new Error(
        response.status === 403
          ? "Auction page blocked automated access (Cloudflare/anti-bot)."
          : `Could not fetch lot page (${response.status})`,
      );
    }

    try {
      const browserExtracted = await fetchWithBrowser(parsedUrl.toString());
      html = browserExtracted.html;
      browserFields = mapFromPairs(browserExtracted.fields);
      browserImages = browserExtracted.images;
    } catch {
      throw new Error("Auction page blocked automated access and browser-rendered fallback failed.");
    }
  }

  const labeledFields = mergeFields(extractLabeledFields(html), browserFields);
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
  const rawImages = [...new Set([...browserImages, ...extractImageUrls(html, parsedUrl)])];
  const lotScopedImages = rawImages.filter((item) => {
    const decoded = decodeURIComponent(item);
    return hasToken(item, lotNumber) || hasToken(decoded, lotNumber) || hasToken(item, vin) || hasToken(decoded, vin);
  });
  const sourceImages = lotScopedImages.length > 0 ? lotScopedImages : rawImages;
  const preliminaryImage = rawImages[0] ?? jsonLdVehicle.imageUrl ?? inferImageUrl(html);
  const filteredImageUrls = filterVehicleImages(sourceImages.length > 0 ? sourceImages : [preliminaryImage], {
    id: `${source}-${lotNumber}`,
    vin,
    lotNumber,
    imageUrl: preliminaryImage,
  });
  const canonicalizedImageUrls = new Map<string, string>();
  for (const item of filteredImageUrls) {
    const key = imageCanonicalKey(item);
    if (!canonicalizedImageUrls.has(key)) {
      canonicalizedImageUrls.set(key, item);
    }
  }
  const imageUrls = [...canonicalizedImageUrls.values()];
  const imageUrl = imageUrls[0] ?? preliminaryImage;
  const limitedAccess = detectLimitedAccess(html);
  const driveInfo = readField(html, labeledFields, ["Napęd", "Naped", "Powertrain", "Układ napędowy", "Drive train"]);
  const driveParts = driveInfo ? driveInfo.split("•").map((part) => normalizeSpaces(part)) : [];
  const transmission =
    driveParts.find((part) => /\bat\b|\bmt\b|automatic|manual|cvt|dct/i.test(part)) ??
    (limitedAccess ? "AT" : inferValueByLabel(html, ["Skrzynia biegów", "Transmission", "Gearbox"], "AT"));
  const drivetrain =
    driveParts.find((part) => /4x4|awd|fwd|rwd/i.test(part)) ??
    (limitedAccess ? "Not provided" : inferValueByLabel(html, ["Typ napędu", "Drivetrain", "Drive type", "Drive train"], "Not provided"));
  const inferredEngine =
    driveParts
      .filter((part) => !/4x4|awd|fwd|rwd|\bat\b|\bmt\b|automatic|manual|cvt|dct/i.test(part))
      .join(" • ") ||
    (limitedAccess ? "Not provided" : inferValueByLabel(html, ["Silnik", "Engine", "Motor", "Cylinders", "Powertrain"], "Not provided"));
  const engineCandidate = /^(type|cycle)$/i.test(normalizeLabelKey(inferredEngine)) ? "Not provided" : inferredEngine;
  const engine = cleanRepeatedFieldValue(engineCandidate, "Not provided");
  const bodyStyle = cleanRepeatedFieldValue(
    readField(html, labeledFields, ["Rodzaj nadwozia", "Body style", "Body type", "Typ"]),
    "Not provided",
  );
  const exteriorColor = cleanRepeatedFieldValue(
    readField(html, labeledFields, ["Kolor karoserii", "Kolor", "Exterior color", "Color"]),
    "Not provided",
  );
  const fuelType = cleanRepeatedFieldValue(readField(html, labeledFields, ["Typ paliwa", "Fuel type", "Fuel"]), "Not provided");
  const normalizedTransmission = cleanRepeatedFieldValue(transmission, "AT");
  const normalizedDrivetrain = cleanRepeatedFieldValue(drivetrain, "Not provided");
  const sellerType =
    readField(html, labeledFields, ["Typ sprzedawcy", "Sprzedawca", "Seller type", "Seller", "Sale type"]) ??
    (limitedAccess ? "Unknown" : inferValueByLabel(html, ["Typ sprzedawcy", "Seller type", "Seller", "Sale type"], "Unknown"));
  const documentType = readField(html, labeledFields, ["Typ dokumentu", "Document type", "Title type"]);
  const documentStatus = readField(html, labeledFields, ["Status dokumentów", "Status dokumentow", "Document status", "Title status"]);
  const titleStatus = [documentType, documentStatus].filter(Boolean).join(" • ") || (limitedAccess ? "Imported" : inferTitleStatus(html));
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
    drivetrain: normalizedDrivetrain,
    transmission: normalizedTransmission,
    bodyStyle,
    exteriorColor,
    fuelType,
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
