import { test } from "node:test";
import assert from "node:assert/strict";
import {
  campusMeetingTime,
  isThaparEmail,
  secondLook,
  suggestedPrice,
  validateMarketListing,
} from "../src/lib/marketplace";
import { safeNext } from "../src/lib/security";
test("campus verification uses the exact domain; sign-in redirects remain allowlisted", () => {
  assert.equal(isThaparEmail("student@thapar.edu"), true);
  assert.equal(isThaparEmail(" STUDENT@THAPAR.EDU "), true);
  for (const email of [
    "student@thapar.edu.evil.test",
    "student@notthapar.edu",
    "x@@thapar.edu",
  ])
    assert.equal(isThaparEmail(email), false);
  assert.equal(safeNext("marketplace"), "/marketplace");
  assert.equal(safeNext("//evil.test"), "/orders");
});
test("campus meeting input is validated and always interpreted in IST", () => {
  assert.equal(
    campusMeetingTime("2026-10-20T15:30"),
    "2026-10-20T10:00:00.000Z",
  );
  for (const value of [
    "2026-02-31T12:00",
    "2026-10-20T25:00",
    "tomorrow",
    "2026-10-20T15:30Z",
  ])
    assert.throws(() => campusMeetingTime(value));
});
test("second look uses actual age and price suggestions never change the asking price", () => {
  const now = Date.parse("2026-10-20T00:00:00Z");
  assert.equal(
    secondLook({ status: "active", published_at: "2026-10-13T00:00:00Z" }, now),
    true,
  );
  assert.equal(
    secondLook({ status: "sold", published_at: "2026-10-01T00:00:00Z" }, now),
    false,
  );
  assert.equal(suggestedPrice(501), 450);
  const item = {
    title: "Calculator",
    description: "Working calculator with its original case.",
    category: "Electronics",
    condition: "Good",
    price: 500,
    defects: "None known",
    course: "",
    photos: ["real.jpg"],
  };
  assert.doesNotThrow(() => validateMarketListing(item));
  for (const price of [-1, 1.5, 200001, NaN])
    assert.throws(() => validateMarketListing({ ...item, price }));
  assert.throws(() => validateMarketListing({ ...item, photos: [] }));
});
