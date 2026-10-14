import { MarketDetail } from "@/components/market/detail";
import { pageMetadata } from "@/lib/metadata";
export const metadata = pageMetadata(
  "/marketplace",
  "Thapar campus find",
  "View a student-listed second-hand item in the private Thapar campus marketplace.",
  true,
);
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <MarketDetail id={id} />;
}
