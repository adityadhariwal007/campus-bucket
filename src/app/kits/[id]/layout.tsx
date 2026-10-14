import { kitLabel } from "@/lib/catalog";
import { notFound } from "next/navigation";
import { publicKit } from "@/lib/kit-server";
import { pageMetadata } from "@/lib/metadata";
type Props = { children: React.ReactNode; params: Promise<{ id: string }> };
export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  const kit = await publicKit(id);
  if (!kit) notFound();
  return pageMetadata(`/kits/${encodeURIComponent(id)}`, `${kitLabel(kit.name)} · ${kitLabel(kit.tier)}`, kitLabel(kit.description || `See every item inside the ${kitLabel(kit.tier)} ${kit.name} and choose your campus essentials.`));
}
export default async function Layout({ children, params }: Props) {
  if (!await publicKit((await params).id)) notFound();
  return children;
}
