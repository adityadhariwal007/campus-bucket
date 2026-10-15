import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { buckReaction, hideCompanionOn } from "../src/lib/companion";
test("Buck reacts to real cart changes and errors without inventing order or chat activity", () => {
  assert.equal(
    buckReaction("/", true, false, false, false).expression,
    "neutral",
  );
  assert.equal(
    buckReaction("/marketplace", true, false, false, false).expression,
    "curious",
  );
  assert.equal(
    buckReaction("/cart", true, false, false, false).expression,
    "thoughtful",
  );
  assert.equal(
    buckReaction("/", false, false, false, false).expression,
    "thoughtful",
  );
  assert.equal(buckReaction("/", true, false, true, false).expression, "happy");
  assert.equal(buckReaction("/", true, true, true, true).expression, "gentle");
  assert.equal(
    buckReaction("/order-success", true, false, false, false).expression,
    "neutral",
  );
  for (const route of [
    "/admin",
    "/admin/marketplace",
    "/checkout",
    "/login",
    "/marketplace/inbox",
    "/marketplace/sell",
  ])
    assert.equal(hideCompanionOn(route), true);
  assert.equal(hideCompanionOn("/marketplace"), false);
});
test("all six exported expressions are local, script-free artwork and retain the brand palette", () => {
  for (const name of [
    "neutral",
    "curious",
    "happy",
    "thoughtful",
    "gentle",
    "blink",
  ]) {
    const svg = readFileSync(`public/avatar/buck-${name}.svg`, "utf8");
    assert.match(svg, /viewBox="-150 -175 300 330"/);
    assert.ok(
      !/NaN|Infinity|<script|foreignObject|on\w+=|https?:/i.test(
        svg.replace("http://www.w3.org/2000/svg", ""),
      ),
    );
    assert.match(svg, /#302d27/);
    assert.ok(Buffer.byteLength(svg) < 12000);
  }
});
