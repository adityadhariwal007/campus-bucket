import test from "node:test";
import assert from "node:assert/strict";
import { proxyAccountRequest } from "../src/lib/account-proxy";
const allow = { limit: async () => ({ success: true }) };
const request = (path = "signup", body: unknown = { email: "student@example.com", password: "test-password", data: { name: "Student" } }, origin = "https://campusbucket.live") => new Request(`https://campusbucket.live/api/account/${path}`, { method: "POST", headers: { origin, apikey: "public-key", "content-type": "application/json", "cf-connecting-ip": "192.0.2.1" }, body: JSON.stringify(body) });
test("account proxy limits attempts before contacting the provider", async () => {
  let contacted = false;
  let key = "";
  const response = await proxyAccountRequest(request(), { limit: async (input) => { key = input.key; return { success: false }; } }, async () => { contacted = true; return new Response(); });
  assert.equal(response.status, 429); assert.equal(key, "192.0.2.1"); assert.equal(contacted, false);
  assert.equal(response.headers.get("retry-after"), "60");
});
test("account proxy rejects unsafe origins, redirects, bot fields and oversized bodies", async () => {
  const send = async () => { throw new Error("Must not contact upstream"); };
  assert.equal((await proxyAccountRequest(request("signup", undefined, "https://attacker.example"), allow, send)).status, 403);
  assert.equal((await proxyAccountRequest(request("signup?redirect_to=https%3A%2F%2Fattacker.example%2Flogin"), allow, send)).status, 400);
  assert.equal((await proxyAccountRequest(request("signup", { email: "student@example.com", password: "test-password", data: { website: "bot" } }), allow, send)).status, 400);
  assert.equal((await proxyAccountRequest(request("signup", { email: "student@example.com", password: "x".repeat(17000) }), allow, send)).status, 413);
  assert.equal((await proxyAccountRequest(request("admin"), allow, send)).status, 404);
});
test("account proxy forwards PKCE fields to the fixed provider and keeps responses private", async () => {
  let target = ""; let sent = "";
  const response = await proxyAccountRequest(request("recover?redirect_to=https%3A%2F%2Fcampusbucket.live%2Flogin", { email: "student@example.com", code_challenge: "challenge", code_challenge_method: "s256" }), allow, async (input, init) => {
    target = String(input); sent = String(init?.body);
    assert.equal(new Headers(init?.headers).get("apikey"), "public-key");
    return Response.json({ ok: true }, { headers: { "Access-Control-Allow-Origin": "*" } });
  });
  assert.ok(target.startsWith("https://zbdezzafnqwmqmdxdmmo.supabase.co/auth/v1/recover?"));
  assert.equal(JSON.parse(sent).code_challenge, "challenge");
  assert.equal(response.status, 200); assert.equal(response.headers.get("cache-control"), "no-store");
  assert.equal(response.headers.get("access-control-allow-origin"), null);
});
