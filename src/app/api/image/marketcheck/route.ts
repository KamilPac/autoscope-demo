import { NextRequest } from "next/server";

const PLACEHOLDER_URL =
  "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=1200&q=80";

function badRequest(message: string) {
  return new Response(message, { status: 400 });
}

export async function GET(request: NextRequest) {
  const raw = request.nextUrl.searchParams.get("url");
  const apiKey = process.env.MARKETCHECK_PROVIDER_API_KEY;

  if (!raw) {
    return badRequest("Missing image url");
  }

  if (!apiKey) {
    return Response.redirect(PLACEHOLDER_URL, 307);
  }

  let target: URL;

  try {
    target = new URL(raw, "https://api.marketcheck.com");
  } catch {
    return badRequest("Invalid image url");
  }

  const isAllowedHost = target.hostname === "api.marketcheck.com";
  const isAllowedPath = target.pathname.startsWith("/v2/image/");

  if (!isAllowedHost || !isAllowedPath) {
    return badRequest("Image url not allowed");
  }

  target.searchParams.set("api_key", apiKey);

  const upstream = await fetch(target.toString(), {
    method: "GET",
    cache: "no-store",
  });

  if (!upstream.ok) {
    return Response.redirect(PLACEHOLDER_URL, 307);
  }

  const bytes = await upstream.arrayBuffer();
  const contentType = upstream.headers.get("content-type") ?? "image/jpeg";

  return new Response(bytes, {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=3600",
    },
  });
}
