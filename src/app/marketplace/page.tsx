import Link from "next/link";
import { MarketFeed } from "@/components/market/feed";
export default async function Marketplace({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  return (
    <>
      <header className="market-hero">
        <span className="eyebrow">CAMPUS BUCKET / THAPAR MARKET</span>
        <h1>
          Your old favourite.
          <br />
          <em>Someone’s next.</em>
        </h1>
        <div className="market-hero-bottom">
          <p>
            Books, cycles, hostel finds and the things you’re done with.
            <br />
            Pass them on. Keep it in the campus circle.
          </p>
          <Link href="/marketplace/sell" className="button primary">
            Sell an item ↗
          </Link>
        </div>
        <p className="market-pilot">
          Thapar launch pilot · No listing fee collected yet. ₹10 posting is
          planned for later.
        </p>
      </header>
      <MarketFeed key={typeof q === "string" ? q : ""} initialQuery={typeof q === "string" ? q.slice(0, 100) : ""} />
      <section className="market-how">
        <h2>
          A handover,
          <br />
          <em>not a hassle.</em>
        </h2>
        <ol>
          <li>
            <strong>A familiar circle.</strong>
            <p>
              Confirmed Thapar emails or a manual student review. Listings stay
              inside the community.
            </p>
          </li>
          <li>
            <strong>Talk before you travel.</strong>
            <p>
              Private chat, an agreed public meeting point, and phone sharing
              only when you choose.
            </p>
          </li>
          <li>
            <strong>Inspect. Exchange. Confirm.</strong>
            <p>
              Check the item before paying the seller. Both sides can confirm a
              completed handover.
            </p>
          </li>
        </ol>
        <Link className="text-link" href="/marketplace/guide">
          Read the marketplace guide ↗
        </Link>
      </section>
    </>
  );
}
