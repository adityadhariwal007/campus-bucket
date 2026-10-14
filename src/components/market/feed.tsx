"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { marketRead, signMarketPhotos } from "./api";
import { useMarket, MarketGate } from "./provider";
import { MarketCard } from "./cards";
import {
  marketCategories,
  marketConditions,
  type MarketListing,
} from "@/lib/marketplace";
export function MarketFeed({ initialQuery = "" }: { initialQuery?: string }) {
  return (
    <MarketGate>
      <Feed initialQuery={initialQuery} />
    </MarketGate>
  );
}
function Feed({ initialQuery }: { initialQuery: string }) {
  const { status } = useMarket();
  const [items, setItems] = useState<MarketListing[]>([]),
    [second, setSecond] = useState<MarketListing[]>([]),
    [photos, setPhotos] = useState<Record<string, string>>({}),
    [query, setQuery] = useState(initialQuery),
    [category, setCategory] = useState("All"),
    [condition, setCondition] = useState("All"),
    [sort, setSort] = useState("newest"),
    [min, setMin] = useState(""),
    [max, setMax] = useState(""),
    [offset, setOffset] = useState(0),
    [total, setTotal] = useState(0),
    [busy, setBusy] = useState(true),
    [error, setError] = useState(""),
    [retry, setRetry] = useState(0);
  useEffect(() => {
    let active = true;
    const timer = setTimeout(() => {
      setBusy(true);
      setError("");
      void (async () => {
        try {
          const result = await marketRead<{
            items: MarketListing[];
            total: number;
          }>("feed", null, {
            query,
            category,
            condition,
            sort,
            offset,
            ...(min !== "" ? { min: Number(min) } : {}),
            ...(max !== "" ? { max: Number(max) } : {}),
          });
          const featured =
            sort === "newest" && !query && offset === 0
              ? (
                  await marketRead<{ items: MarketListing[] }>("feed", null, {
                    sort: "second-look",
                    category,
                  })
                ).items.slice(0, 4)
              : [];
          const signed = await signMarketPhotos(
            [...result.items, ...featured]
              .map((l) => l.photos[0])
              .filter(Boolean),
          );
          if (active) {
            setItems(result.items);
            setSecond(featured);
            setPhotos(signed);
            setTotal(result.total);
          }
        } catch (e) {
          if (active) setError((e as Error).message);
        } finally {
          if (active) setBusy(false);
        }
      })();
    }, 250);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [
    query,
    category,
    condition,
    sort,
    min,
    max,
    offset,
    retry,
    status?.member?.user_id,
  ]);
  return (
    <div className="market-discover">
      <div className="market-filter-bar">
        <label className="market-search">
          <span>What are you looking for?</span>
          <input
            type="search"
            maxLength={100}
            placeholder="A calculator, cycle, or semester…"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setOffset(0);
            }}
          />
        </label>
        <label>
          Sort
          <select
            value={sort}
            onChange={(e) => {
              setSort(e.target.value);
              setOffset(0);
            }}
          >
            <option value="newest">Just listed</option>
            <option value="price-low">Price: low to high</option>
            <option value="price-high">Price: high to low</option>
            <option value="deadline">Leaving campus soon</option>
            <option value="second-look">Second look</option>
            <option value="saved">Saved + price alerts</option>
          </select>
        </label>
      </div>
      <div className="market-category-tabs" aria-label="Resale categories">
        {["All", ...marketCategories].map((c) => (
          <button
            key={c}
            aria-pressed={category === c}
            onClick={() => {
              setCategory(c);
              setOffset(0);
            }}
          >
            {c}
          </button>
        ))}
      </div>
      <details className="market-extra-filters">
        <summary>Condition & budget</summary>
        <div className="market-form-grid">
          <label>
            Condition
            <select
              value={condition}
              onChange={(e) => {
                setCondition(e.target.value);
                setOffset(0);
              }}
            >
              <option>All</option>
              {marketConditions.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </label>
          <label>
            Minimum ₹
            <input
              type="number"
              min={0}
              max={200000}
              value={min}
              onChange={(e) => {
                setMin(e.target.value);
                setOffset(0);
              }}
            />
          </label>
          <label>
            Maximum ₹
            <input
              type="number"
              min={0}
              max={200000}
              value={max}
              onChange={(e) => {
                setMax(e.target.value);
                setOffset(0);
              }}
            />
          </label>
        </div>
      </details>
      {error ? (
        <div className="error-box" role="alert">
          {error}
          <button
            className="text-button"
            onClick={() => setRetry((n) => n + 1)}
          >
            Retry
          </button>
        </div>
      ) : busy ? (
        <p className="market-state" role="status">
          Finding campus finds…
        </p>
      ) : (
        <>
          {!!second.length && (
            <section className="market-second-look">
              <div>
                <span className="eyebrow">
                  GOOD THINGS DESERVE ANOTHER LOOK
                </span>
                <h2>Still useful. Still here.</h2>
                <p>
                  Unsold finds get a fair rotation here. No paid popularity.
                </p>
              </div>
              <div className="market-strip">
                {second.map((l) => (
                  <MarketCard key={l.id} listing={l} photos={photos} />
                ))}
              </div>
            </section>
          )}
          <p className="market-result-count" role="status">
            {total} {total === 1 ? "find" : "finds"}
            {sort === "saved" ? " saved by you" : " in the campus circle"}
          </p>
          {items.length ? (
            <div className="market-grid">
              {items.map((l) => (
                <MarketCard key={l.id} listing={l} photos={photos} />
              ))}
            </div>
          ) : (
            <div className="market-state">
              <h2>
                {query || category !== "All"
                  ? "Nothing matches yet."
                  : "Be part of the first handover."}
              </h2>
              <p>
                {query
                  ? "Try another item, course or category."
                  : "Only real student listings appear here. Give something you own its next chapter."}
              </p>
              <Link href="/marketplace/sell" className="button primary">
                List your first item ↗
              </Link>
            </div>
          )}
          {total > 5000 && (
            <p>
              Narrow your search or category to browse beyond the first 5,000
              results.
            </p>
          )}
          {total > 24 && (
            <div className="market-pagination">
              <button
                className="button secondary"
                disabled={offset === 0}
                onClick={() => setOffset((n) => Math.max(0, n - 24))}
              >
                Previous
              </button>
              <span>
                {Math.floor(offset / 24) + 1} / {Math.ceil(total / 24)}
              </span>
              <button
                className="button secondary"
                disabled={offset + 24 >= total || offset + 24 > 5000}
                onClick={() => setOffset((n) => n + 24)}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
