"use client";
import { supabase } from "@/lib/supabase";
export async function marketRead<T>(
  section: string,
  id: string | null = null,
  filters: Record<string, unknown> = {},
): Promise<T> {
  if (!supabase) throw new Error("The live marketplace is not configured.");
  const { data, error } = await supabase.rpc("market_read", {
    p_section: section,
    p_id: id,
    p_filters: filters,
  });
  if (error) throw new Error(error.message);
  return data as T;
}
export async function marketAction<T = { ok: boolean; id: string }>(
  action: string,
  data: Record<string, unknown> = {},
): Promise<T> {
  if (!supabase) throw new Error("The live marketplace is not configured.");
  const result = await supabase.rpc("market_action", {
    p_action: action,
    p_data: data,
  });
  if (result.error) throw new Error(result.error.message);
  return result.data as T;
}
export async function signMarketPhotos(paths: string[]) {
  if (!paths.length || !supabase) return {} as Record<string, string>;
  const { data, error } = await supabase.storage
    .from("marketplace")
    .createSignedUrls([...new Set(paths)], 600);
  if (error)
    throw new Error("Item photos are temporarily unavailable. Please refresh.");
  return Object.fromEntries(
    data
      .filter((item) => item.signedUrl && !item.error)
      .map((item) => [item.path!, item.signedUrl!]),
  );
}
