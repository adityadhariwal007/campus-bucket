import { MarketProvider, MarketNav } from "@/components/market/provider";
import { pageMetadata } from "@/lib/metadata";
export const metadata = pageMetadata(
  "/marketplace",
  "Thapar Market",
  "Buy and sell second-hand college essentials within the Thapar community. Private chat, agreed campus meetups and real student listings.",
);
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <MarketProvider>
      <div className="container market-shell">
        <MarketNav />
        {children}
      </div>
    </MarketProvider>
  );
}
