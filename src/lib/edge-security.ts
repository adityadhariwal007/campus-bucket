import { securityHeaders } from "./security";
export type RateLimit = {
  limit: (options: { key: string }) => Promise<{ success: boolean }>;
};
export async function checkRequest(request: Request, limiter: RateLimit) {
  const url = new URL(request.url);
  let path: string;
  try {
    path = decodeURIComponent(url.pathname);
  } catch {
    return new Response("Invalid URL", {
      status: 400,
      headers: securityHeaders,
    });
  }
  if (
    /(?:^|\/)\.(?!well-known\/)|\.(?:sql|map|zip|bak|log)$|^\/(?:src|node_modules|supabase|output)(?:\/|$)/i.test(
      path,
    )
  )
    return new Response("Not found", { status: 404, headers: securityHeaders });
  if (!["GET", "HEAD", "OPTIONS"].includes(request.method)) {
    const origin = request.headers.get("origin");
    if (
      origin !== url.origin ||
      request.headers.get("sec-fetch-site") === "cross-site"
    )
      return new Response("Forbidden origin", {
        status: 403,
        headers: securityHeaders,
      });
  }
  // Cloudflare supplies this header at ingress. Never use spoofable forwarded IP headers.
  const ip = request.headers.get("cf-connecting-ip") || "local-preview";
  const { success } = await limiter.limit({ key: ip });
  if (!success)
    return new Response("Too many requests. Please try again shortly.", {
      status: 429,
      headers: {
        ...securityHeaders,
        "Retry-After": "60",
        "Cache-Control": "no-store",
      },
    });
  return null;
}
