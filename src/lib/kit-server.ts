import "server-only";
import { cache } from "react";
import { serverSupabase } from "./supabase-server";
import { seedCatalog } from "./catalog";
export const publicKit = cache(async (id: string) => {
  const client = await serverSupabase();
  if (!client) return seedCatalog.kits.find((kit) => kit.id === id) || null;
  const { data, error } = await client.from("kits").select("id,name,tier,type,description").eq("id", id).maybeSingle();
  if (error) throw new Error("The kit catalog is temporarily unavailable.");
  return data;
});
