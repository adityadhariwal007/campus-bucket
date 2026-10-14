import { notFound, redirect } from "next/navigation";
import { serverSupabase } from "@/lib/supabase-server";
import AdminDashboard from "@/components/admin-dashboard";
export const dynamic = "force-dynamic";
export default async function Admin() {
  const supabase = await serverSupabase();
  if (!supabase) {
    if (process.env.NODE_ENV === "production") notFound();
    return <AdminDashboard />;
  }
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) redirect("/login?next=admin");
  const { data: admin } = await supabase
    .from("admin_users")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!admin) notFound();
  return <AdminDashboard />;
}
