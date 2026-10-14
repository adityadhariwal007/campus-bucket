import type { MetadataRoute } from "next";
import { serverSupabase } from "@/lib/supabase-server";
import { seedCatalog } from "@/lib/catalog";
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const client = await serverSupabase();
  let kits: { id: string }[] = seedCatalog.kits;
  if (client) {
    const { data, error } = await client.from("kits").select("id");
    if (error) throw new Error("Catalog unavailable");
    kits = data;
  }
  return ["/", "/marketplace", "/marketplace/guide", "/kits", "/build-your-own", "/about", "/terms", "/privacy", ...kits.map((kit) => `/kits/${encodeURIComponent(kit.id)}`)].map((path) => ({ url: `https://campusbucket.live${path}` }));
}
