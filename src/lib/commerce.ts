import { sizes } from "./catalog";
import type { CartLine, Catalog, Customer, KitItem } from "./types";
export function contents(
  line: Pick<CartLine, "kind" | "id">,
  catalog: Catalog,
): KitItem[] {
  if (line.kind === "product")
    return catalog.products.some((p) => p.id === line.id)
      ? [{ product_id: line.id, quantity: 1 }]
      : [];
  return catalog.kits.find((k) => k.id === line.id)?.items || [];
}
export function entry(line: Pick<CartLine, "kind" | "id">, catalog: Catalog) {
  return line.kind === "kit"
    ? catalog.kits.find((k) => k.id === line.id)
    : catalog.products.find((p) => p.id === line.id);
}
export function availability(
  line: Pick<CartLine, "kind" | "id">,
  catalog: Catalog,
) {
  const e = entry(line, catalog),
    items = contents(line, catalog);
  if (!e || !items.length) return 0;
  return Math.min(
    e.stock,
    ...items.map((i) =>
      Math.floor(
        (catalog.products.find((p) => p.id === i.product_id)?.stock || 0) /
          i.quantity,
      ),
    ),
  );
}
export function validateCart(lines: CartLine[], catalog: Catalog) {
  if (!Array.isArray(lines) || lines.length === 0)
    throw new Error("Your bucket is empty. Add a kit to continue.");
  if (lines.length > 100)
    throw new Error("Please keep your cart under 100 different items.");
  const required: Record<string, number> = {},
    kitTotals: Record<string, number> = {};
  for (const l of lines) {
    if (
      !["kit", "product"].includes(l.kind) ||
      !Number.isInteger(l.quantity) ||
      l.quantity < 1 ||
      l.quantity > 20
    )
      throw new Error("Choose a quantity between 1 and 20.");
    const e = entry(l, catalog);
    if (!e || !contents(l, catalog).length)
      throw new Error(
        "An item is no longer available. Remove it from your bucket.",
      );
    if (l.kind === "kit") kitTotals[l.id] = (kitTotals[l.id] || 0) + l.quantity;
    for (const i of contents(l, catalog)) {
      const p = catalog.products.find((p) => p.id === i.product_id);
      if (!p) throw new Error("A kit item is unavailable.");
      required[p.id] = (required[p.id] || 0) + i.quantity * l.quantity;
      if (p.size_type && !sizes[p.size_type].includes(l.sizes?.[p.size_type]))
        throw new Error(`Choose a ${p.size_type} size for ${e.name}.`);
    }
  }
  for (const [id, q] of Object.entries(required)) {
    const p = catalog.products.find((p) => p.id === id)!;
    if (q > p.stock)
      throw new Error(
        `Only ${p.stock} of ${p.name} available. Please update your bucket.`,
      );
  }
  for (const [id, q] of Object.entries(kitTotals)) {
    const k = catalog.kits.find((k) => k.id === id)!;
    if (q > k.stock) throw new Error(`Only ${k.stock} of ${k.name} available.`);
  }
  return required;
}
export function totals(
  lines: CartLine[],
  catalog: Catalog,
  code = "",
  delivery = "pickup",
) {
  const subtotal = lines.reduce(
    (s, l) => s + (entry(l, catalog)?.price || 0) * l.quantity,
    0,
  );
  const normalized = code.trim().toUpperCase();
  if (normalized && normalized !== "CAMPUS10")
    throw new Error("That discount code is not valid. Try CAMPUS10.");
  const discount = normalized === "CAMPUS10" ? Math.round(subtotal * 0.1) : 0;
  const delivery_fee =
    delivery === "hostel" && subtotal - discount < 1499 ? 49 : 0;
  return {
    subtotal,
    discount,
    delivery_fee,
    total: subtotal - discount + delivery_fee,
  };
}
export function validateCustomer(c: Customer) {
  if (
    c &&
    Object.values(c).some(
      (v) => typeof v === "string" && /[\u0000-\u001f\u007f]/.test(v),
    )
  )
    throw new Error("Remove control characters from your details.");
  if (
    !c ||
    typeof c.name !== "string" ||
    c.name.trim().length < 2 ||
    c.name.length > 100
  )
    throw new Error("Enter your full name (2–100 characters).");
  if (
    typeof c.phone !== "string" ||
    !/^\d{10}$/.test(c.phone) ||
    !/^[6-9]/.test(c.phone)
  )
    throw new Error("Enter a valid 10-digit Indian mobile number.");
  if (
    typeof c.email !== "string" ||
    !/^\S+@\S+\.\S+$/.test(c.email) ||
    c.email.length > 254
  )
    throw new Error("Enter a valid email address.");
  if (!["hostel", "pickup"].includes(c.delivery))
    throw new Error("Choose a delivery option.");
  if (
    typeof c.campus !== "string" ||
    c.campus.trim().length < 2 ||
    c.campus.length > 150
  )
    throw new Error("Enter your college or campus name.");
  if (
    typeof c.address !== "string" ||
    c.address.length > 500 ||
    (c.delivery === "hostel" && c.address.trim().length < 5)
  )
    throw new Error("Enter your hostel name and room number.");
}
