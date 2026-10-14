import test from "node:test";
import assert from "node:assert/strict";
import { ribbonProgress, validateNewPassword } from "../src/lib/account-ui";
test("scroll ribbon clamps progress and respects reduced motion", () => {
  assert.equal(ribbonProgress(1200, 330, 800, false), 0);
  assert.equal(ribbonProgress(-500, 330, 800, false), 1);
  assert.ok(ribbonProgress(550, 330, 800, false) > 0);
  assert.ok(ribbonProgress(550, 330, 800, false) < 1);
  assert.equal(ribbonProgress(1200, 330, 800, true), 1);
});
test("password update validates length and confirmation", () => {
  assert.throws(() => validateNewPassword("short", "short"));
  assert.throws(() => validateNewPassword("valid-password", "different"));
  assert.throws(() => validateNewPassword("a".repeat(129), "a".repeat(129)));
  assert.doesNotThrow(() => validateNewPassword("valid-password", "valid-password"));
});

test("ribbon is completely hidden in its initial server-rendered markup", async () => {
  const { renderToStaticMarkup } = await import("react-dom/server");
  const { createElement } = await import("react");
  const { CampusRibbon } = await import("../src/components/campus-ribbon");
  const html = renderToStaticMarkup(createElement(CampusRibbon));
  assert.match(html, /data-started="false"/);
  assert.match(html, /stroke-dashoffset="1"/);
});
