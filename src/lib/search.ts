import { kitLabel } from "./catalog";
import type { Catalog } from "./types";
export function matchesQuery(text: string, query: string) {
  const tokens = query.trim().toLocaleLowerCase("en-IN").split(/\s+/).filter(Boolean);
  const haystack = text.toLocaleLowerCase("en-IN");
  return tokens.every(token => haystack.includes(token));
}
export function searchCatalog(catalog: Catalog, query: string) {
  if (!query.trim()) return { kits: [], products: [] };
  return {
    kits: catalog.kits.filter(kit => matchesQuery([
      kitLabel(kit.name), kit.type, kitLabel(kit.tier), kitLabel(kit.description),
      ...kit.items.map(item => catalog.products.find(p => p.id === item.product_id)?.name || ""),
    ].join(" "), query)),
    products: catalog.products.filter(p => matchesQuery(`${p.name} ${p.category}`, query)),
  };
}
