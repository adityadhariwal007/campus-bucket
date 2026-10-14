import test from "node:test";
import assert from "node:assert/strict";
import { kitLabel, seedCatalog, tiers } from "../src/lib/catalog";
import { matchesQuery, searchCatalog } from "../src/lib/search";
test("new level names preserve stored keys, saved carts and historical order labels", () => {
  assert.deepEqual(tiers.map(kitLabel), ["Essential", "Plus", "Premium"]);
  assert.equal(kitLabel("Hostel Kit Scholar"), "Hostel Kit Plus");
  assert.equal(kitLabel("Ultimate Fresher Bundle"), "Ultimate Essential Bundle");
  assert.equal(kitLabel("student-scholar"), "student-scholar");
});
test("search matches kit contents, categories, new levels and multiple words", () => {
  assert.ok(searchCatalog(seedCatalog, "  TOWEL  ").kits.some(k => k.id === "hostel-scholar"));
  assert.ok(searchCatalog(seedCatalog, "sports premium").kits.some(k => k.id === "sports-topper"));
  assert.ok(searchCatalog(seedCatalog, "steel bottle").products.some(p => p.id === "steel-bottle"));
  assert.deepEqual(searchCatalog(seedCatalog, ""), {kits: [], products: []});
  assert.deepEqual(searchCatalog(seedCatalog, '<img src=x onerror=alert(1)>'), {kits: [], products: []});
  assert.equal(matchesQuery("Sports Premium", "premium sports"), true);
  assert.equal(matchesQuery("Hostel Essential", "hostel premium"), false);
});
