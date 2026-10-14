import test from "node:test";
import assert from "node:assert/strict";
import { checkRequest } from "../src/lib/edge-security";
import { contentSecurityPolicy, safeNext } from "../src/lib/security";
const allow = { limit: async () => ({ success: true }) };
test("sensitive paths and cross-origin writes are rejected", async () => {
  for (const path of [
    "/.env.local",
    "/.git/config",
    "/%2eenv",
    "/supabase/seed.sql",
    "/output/campus-bucket-source.zip",
    "/_next/source.map",
  ]) {
    const response = await checkRequest(
      new Request(`https://campusbucket.live${path}`),
      allow,
    );
    assert.equal(response?.status, 404, path);
  }
  assert.equal(
    (
      await checkRequest(
        new Request("https://campusbucket.live/api/example", {
          method: "POST",
          headers: { origin: "https://attacker.example" },
        }),
        allow,
      )
    )?.status,
    403,
  );
  assert.equal(
    await checkRequest(new Request("https://campusbucket.live/kits"), allow),
    null,
  );
});
test("edge rate limiter returns 429 and uses Cloudflare's client IP", async () => {
  let key = "";
  const response = await checkRequest(
    new Request("https://campusbucket.live/", {
      headers: { "cf-connecting-ip": "192.0.2.10", "x-forwarded-for": "fake" },
    }),
    {
      limit: async (input) => {
        key = input.key;
        return { success: false };
      },
    },
  );
  assert.equal(key, "192.0.2.10");
  assert.equal(response?.status, 429);
  assert.equal(response?.headers.get("Retry-After"), "60");
});
test("production CSP requires script nonces and redirects stay on known pages", () => {
  const csp = contentSecurityPolicy("test-nonce");
  assert.match(csp, /script-src 'self' 'nonce-test-nonce' 'strict-dynamic';/);
  assert.ok(!csp.includes("unsafe-eval"));
  assert.match(csp, /frame-ancestors 'none'/);
  assert.equal(safeNext("//attacker.example"), "/orders");
  assert.equal(safeNext("admin"), "/admin");
});
