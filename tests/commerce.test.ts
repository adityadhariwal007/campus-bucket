import { test } from "node:test";
import assert from "node:assert/strict";
import { seedCatalog } from "../src/lib/catalog";
import {
  availability,
  totals,
  validateCart,
  validateCustomer,
} from "../src/lib/commerce";
import type { CartLine } from "../src/lib/types";
const line = (
  id: string,
  quantity = 1,
  sizes: Record<string, string> = {},
): CartLine => ({ key: id, id, kind: "kit", quantity, sizes });
test("all nine tiers and the bundle match the requested contents", () => {
  assert.equal(seedCatalog.kits.length, 10);
  assert.equal(seedCatalog.products.length, 30);
  const hostel = seedCatalog.kits.find((k) => k.id === "hostel-topper")!;
  assert.equal(hostel.items.length, 11);
  assert.equal(
    hostel.items.find((i) => i.product_id === "hanger")?.quantity,
    6,
  );
  const student = seedCatalog.kits.find((k) => k.id === "student-topper")!;
  assert.equal(
    student.items.find((i) => i.product_id === "tshirt")?.quantity,
    2,
  );
  assert.equal(
    student.items.find((i) => i.product_id === "register")?.quantity,
    4,
  );
  const bundle = seedCatalog.kits.find((k) => k.id === "ultimate-fresher")!;
  assert.equal(bundle.price, 1149);
  assert.equal(bundle.items.length, 11);
});
test("discount rounding and delivery threshold are consistent", () => {
  assert.deepEqual(
    totals([line("hostel-fresher")], seedCatalog, "campus10", "hostel"),
    { subtotal: 449, discount: 45, delivery_fee: 49, total: 453 },
  );
  assert.equal(
    totals(
      [line("student-scholar", 1, { shirt: "M", cap: "S/M" })],
      seedCatalog,
      "CAMPUS10",
      "hostel",
    ).delivery_fee,
    0,
  );
  assert.equal(
    totals([line("hostel-fresher")], seedCatalog, "", "pickup").total,
    449,
  );
  assert.throws(
    () => totals([line("hostel-fresher")], seedCatalog, "INVALID"),
    /not valid/,
  );
});
test("sizes, integer quantities, empty carts and unavailable products are rejected", () => {
  assert.throws(() => validateCart([], seedCatalog), /empty/);
  assert.throws(
    () => validateCart([line("student-scholar")], seedCatalog),
    /size/,
  );
  assert.throws(
    () => validateCart([line("hostel-fresher", 1.5)], seedCatalog),
    /quantity/,
  );
  assert.throws(
    () => validateCart([line("hostel-fresher", -1)], seedCatalog),
    /quantity/,
  );
  assert.throws(
    () => validateCart([line("missing")], seedCatalog),
    /no longer/,
  );
  assert.doesNotThrow(() =>
    validateCart(
      [line("student-scholar", 1, { shirt: "M", cap: "S/M" })],
      seedCatalog,
    ),
  );
});
test("shared stock is counted across kits, custom items and sizes", () => {
  const catalog = structuredClone(seedCatalog);
  catalog.products.find((p) => p.id === "cap")!.stock = 1;
  assert.throws(
    () =>
      validateCart(
        [
          line("student-scholar", 1, { shirt: "M", cap: "S/M" }),
          line("sports-fresher", 1, { cap: "L/XL" }),
        ],
        catalog,
      ),
    /Only 1/,
  );
  catalog.products.find((p) => p.id === "hanger")!.stock = 5;
  assert.equal(availability({ kind: "kit", id: "hostel-fresher" }, catalog), 0);
});
test("customer validation rejects missing hostel details and invalid numbers", () => {
  const customer = {
    name: "Aditi Rao",
    phone: "9876543210",
    email: "aditi@example.com",
    campus: "Demo campus",
    delivery: "hostel" as const,
    address: "Block A, room 12",
  };
  assert.doesNotThrow(() => validateCustomer(customer));
  assert.throws(
    () => validateCustomer({ ...customer, phone: "123" }),
    /mobile/,
  );
  assert.throws(() => validateCustomer({ ...customer, address: "" }), /hostel/);
  assert.doesNotThrow(() =>
    validateCustomer({ ...customer, delivery: "pickup", address: "" }),
  );
});
