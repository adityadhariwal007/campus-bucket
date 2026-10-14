import { writeFileSync } from "node:fs";
import { seedCatalog } from "../src/lib/catalog";
const quote = (v: unknown) =>
  v === null
    ? "null"
    : typeof v === "number"
      ? String(v)
      : `'${String(v).replaceAll("'", "''")}'`;
const insert = (table: string, columns: string[], rows: unknown[][]) =>
  `insert into public.${table} (${columns.join(",")}) values\n${rows.map((r) => `(${r.map(quote).join(",")})`).join(",\n")}\non conflict do nothing;\n`;
let sql =
  "-- Sample INR prices. Safe to rerun: existing catalog edits are preserved.\nbegin;\n";
sql += insert(
  "products",
  ["id", "name", "price", "stock", "category", "image", "size_type"],
  seedCatalog.products.map((p) => [
    p.id,
    p.name,
    p.price,
    p.stock,
    p.category,
    p.image,
    p.size_type,
  ]),
);
sql += insert(
  "kits",
  ["id", "name", "type", "tier", "price", "stock", "description"],
  seedCatalog.kits.map((k) => [
    k.id,
    k.name,
    k.type,
    k.tier,
    k.price,
    k.stock,
    k.description,
  ]),
);
sql += insert(
  "kit_items",
  ["kit_id", "product_id", "quantity"],
  seedCatalog.kits.flatMap((k) =>
    k.items.map((i) => [k.id, i.product_id, i.quantity]),
  ),
);
sql += "commit;\n";
writeFileSync("supabase/seed.sql", sql);
