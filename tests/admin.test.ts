import test from "node:test";
import assert from "node:assert/strict";
import { loginDestination } from "../src/lib/security";
import { matchesStock } from "../src/lib/admin";

test("verified admins go to their dashboard; customers keep safe shopping destinations", () => {
  for (const next of [null, "checkout", "admin", "https://attacker.example"]) {
    assert.equal(loginDestination(true, next), "/admin");
  }
  assert.equal(loginDestination(false, "checkout"), "/checkout");
  assert.equal(loginDestination(false, "admin"), "/orders");
  assert.equal(loginDestination(false, "//attacker.example"), "/orders");
});

test("stock filters distinguish zero, low stock boundaries, and stocked items", () => {
  assert.equal(matchesStock(0, "Low"), false);
  assert.equal(matchesStock(1, "Low"), true);
  assert.equal(matchesStock(5, "Low"), true);
  assert.equal(matchesStock(6, "Low"), false);
  assert.equal(matchesStock(0, "Out"), true);
  assert.equal(matchesStock(1, "Out"), false);
  assert.equal(matchesStock(0, "All"), true);
  assert.equal(matchesStock(100, "All"), true);
});
