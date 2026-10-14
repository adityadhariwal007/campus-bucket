"use client";
import { searchCatalog } from "@/lib/search";
import { kitLabel } from "@/lib/catalog";
import { useState } from "react";
import { useStore } from "@/components/store";
import { KitCard, PageHeading, Loading } from "@/components/ui";
import { categories, tiers } from "@/lib/catalog";
export default function Kits() {
  const { catalog, ready } = useStore();
  const [category, setCategory] = useState("All"),
    [tier, setTier] = useState("All"),
    [search, setSearch] = useState("");
  const candidates = search.trim() ? searchCatalog(catalog, search).kits : catalog.kits;
  const matches = candidates.filter(
    (k) =>
      (category === "All" || k.type === category) &&
      (tier === "All" || k.tier === tier),
  );
  return (
    <div className="container page">
      <PageHeading
        eyebrow="YOUR CAMPUS CHECKLIST, DONE"
        title="Find your kind of ready."
        description="Three essentials. Three tiers. A fresh start that fits you."
      />
      <div className="filters">
        <div className="tabs">
          {["All", ...categories, "Bundle"].map((c) => (
            <button
              key={c}
              className={category === c ? "selected" : ""}
              onClick={() => setCategory(c)}
            >
              {c === "All" ? "All kits" : c}
            </button>
          ))}
        </div>
        <div className="filter-fields">
          <label>
            <span className="sr-only">Filter by tier</span>
            <select value={tier} onChange={(e) => setTier(e.target.value)}>
              <option value="All">Every tier</option>
              {tiers.map((t) => (
                <option key={t} value={t}>{kitLabel(t)}</option>
              ))}
            </select>
          </label>
          <label>
            <span className="sr-only">Search kits</span>
            <input
              id="search"
              type="search"
              placeholder="Find your kit…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </label>
        </div>
      </div>
      <p className="muted small">
        {matches.length} kits to start your next chapter
      </p>
      {!ready ? (
        <Loading />
      ) : (
        <div className="kit-grid">
          {matches.map((k) => (
            <KitCard key={k.id} kit={k} />
          ))}
        </div>
      )}
      {ready && !matches.length && (
        <div className="empty">
          <h2>No kits match just yet.</h2>
          <button
            className="button secondary"
            onClick={() => {
              setCategory("All");
              setTier("All");
              setSearch("");
            }}
          >
            Clear filters
          </button>
        </div>
      )}
    </div>
  );
}
