import { getCloudflareContext } from "@opennextjs/cloudflare";
import { createClient } from "@supabase/supabase-js";
import { handleBuck, type BuckAI } from "@/lib/buck-chat";
import type { RateLimit } from "@/lib/edge-security";
import type { Catalog } from "@/lib/types";
export async function POST(request: Request) {
  try {
    const { env } = await getCloudflareContext({ async: true });
    const bindings = env as unknown as { AI?: BuckAI; BUCK_LIMITER: RateLimit };
    return await handleBuck(request, {
      ai: bindings.AI,
      limiter: bindings.BUCK_LIMITER,
      catalog: async () => {
        const url = process.env.NEXT_PUBLIC_SUPABASE_URL,
          key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
        if (!url || !key) throw new Error("Catalog unavailable");
        // Public catalog only: never forward account cookies or use a service-role key.
        const db = createClient(url, key, {
          auth: { persistSession: false, autoRefreshToken: false },
          global: {
            fetch: (input, init) =>
              fetch(input, {
                ...init,
                signal: AbortSignal.timeout(8000),
                cache: "no-store",
              }),
          },
        });
        const [p, k] = await Promise.all([
          db.from("products").select("id,name,price,stock,category,size_type"),
          db
            .from("kits")
            .select(
              "id,name,type,tier,price,stock,items:kit_items(product_id,quantity)",
            ),
        ]);
        if (p.error || k.error || !p.data || !k.data)
          throw new Error("Catalog unavailable");
        return { products: p.data, kits: k.data } as Catalog;
      },
    });
  } catch {
    return Response.json(
      { error: "Buck’s chat is unavailable. Please try again shortly." },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
