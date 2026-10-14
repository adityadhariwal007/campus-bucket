import { Suspense } from "react";
import { SellPage } from "@/components/market/sell";
import { pageMetadata } from "@/lib/metadata";
export const metadata = pageMetadata(
  "/marketplace/sell",
  "Sell on Thapar Market",
  "List a real second-hand item for the Thapar campus community.",
  true,
);
export default function Page() {
  return (
    <Suspense fallback={<p role="status">Opening the listing form…</p>}>
      <SellPage />
    </Suspense>
  );
}
