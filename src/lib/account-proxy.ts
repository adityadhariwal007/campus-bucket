import type { RateLimit } from "./edge-security";
const upstreamOrigin = "https://zbdezzafnqwmqmdxdmmo.supabase.co";
export async function proxyAccountRequest(request: Request, limiter: RateLimit, send: typeof fetch = fetch) {
  const url = new URL(request.url);
  const action = url.pathname.split("/").pop();
  const fail = (msg: string, status: number) => Response.json({ msg }, { status, headers: { "Cache-Control": "no-store", ...(status === 429 ? { "Retry-After": "60" } : {}) } });
  if (request.method !== "POST" || !["signup", "recover"].includes(action || "")) return fail("Not found", 404);
  if (request.headers.get("origin") !== url.origin || request.headers.get("sec-fetch-site") === "cross-site") return fail("Forbidden origin", 403);
  // Cloudflare counters are approximate per location; Supabase also enforces Auth limits.
  if (!(await limiter.limit({ key: request.headers.get("cf-connecting-ip") || "local-preview" })).success) return fail("Too many attempts. Wait one minute and try again.", 429);
  if (Number(request.headers.get("content-length") || 0) > 16384) return fail("Request too large", 413);
  const reader = request.body?.getReader();
  if (!reader) return fail("Invalid request", 400);
  const chunks: Uint8Array[] = [];
  let length = 0;
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    length += value.byteLength;
    if (length > 16384) { await reader.cancel(); return fail("Request too large", 413); }
    chunks.push(value);
  }
  const bytes = new Uint8Array(length);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  const body = new TextDecoder().decode(bytes);
  let data: Record<string, unknown>;
  try { data = JSON.parse(body); } catch { return fail("Invalid request", 400); }
  if (!data || typeof data !== "object" || typeof data.email !== "string" || data.email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) return fail("Enter a valid email address", 400);
  const meta = data.data as Record<string, unknown> | undefined;
  if (meta?.website) return fail("Unable to submit this form", 400);
  if (action === "signup" && (typeof data.password !== "string" || data.password.length < 8 || data.password.length > 128)) return fail("Use a password of 8–128 characters", 400);
  const target = new URL(`/auth/v1/${action}`, upstreamOrigin);
  const redirect = url.searchParams.get("redirect_to");
  if (redirect) {
    try {
      const destination = new URL(redirect);
      if (!["https://campusbucket.live", "https://www.campusbucket.live"].includes(destination.origin) || destination.pathname !== "/login") return fail("Invalid redirect", 400);
      target.searchParams.set("redirect_to", destination.href);
    } catch { return fail("Invalid redirect", 400); }
  }
  const headers = new Headers({ "Content-Type": "application/json" });
  for (const key of ["apikey", "authorization", "x-supabase-api-version", "x-client-info"]) {
    const value = request.headers.get(key); if (value) headers.set(key, value);
  }
  try {
    const result = await send(target.href, { method: "POST", headers, body, redirect: "error", signal: AbortSignal.timeout(15000) });
    const responseHeaders = new Headers({ "Content-Type": "application/json", "Cache-Control": "no-store" });
    const retry = result.headers.get("retry-after"); if (retry) responseHeaders.set("Retry-After", retry);
    return new Response(result.body, { status: result.status, headers: responseHeaders });
  } catch { return fail("Account service unavailable. Please try again shortly.", 503); }
}
