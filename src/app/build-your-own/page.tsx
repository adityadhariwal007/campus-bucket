"use client";
import { useState } from "react";
import Link from "next/link";
import { IconPlus, IconCheck, IconArrowRight } from "@tabler/icons-react";
import { useStore } from "@/components/store";
import {
  ErrorMessage,
  PageHeading,
  ProductImage,
  Loading,
} from "@/components/ui";
import { totals } from "@/lib/commerce";
import { categories, money } from "@/lib/catalog";
import { SizeSelect } from "@/components/size-select";
import type { Product } from "@/lib/types";
function Item({ p }: { p: Product }) {
  const { add } = useStore();
  const [selected, setSelected] = useState<Record<string, string>>({}),
    [error, setError] = useState(""),
    [added, setAdded] = useState(false);
  return (
    <article className="individual-card">
      <ProductImage product={p} />
      <div className="individual-body">
        <span className="small muted">{p.category}</span>
        <h3>{p.name}</h3>
        <div className="row between">
          <strong>{money(p.price)}</strong>
          <span className="small muted">
            {p.stock > 0 ? `${p.stock} in stock` : "Sold out"}
          </span>
        </div>
        <SizeSelect
          line={{ kind: "product", id: p.id }}
          value={selected}
          onChange={setSelected}
        />
        <button
          className="button secondary full"
          disabled={!p.stock}
          onClick={() => {
            try {
              add({ kind: "product", id: p.id, quantity: 1, sizes: selected });
              setError("");
              setAdded(true);
            } catch (e) {
              setError((e as Error).message);
            }
          }}
        >
          {added ? <IconCheck size={17} /> : <IconPlus size={17} />}{" "}
          {added ? "Add another" : "Add to my kit"}
        </button>
        <ErrorMessage message={error} />
      </div>
    </article>
  );
}
export default function Build() {
  const { catalog, cart, ready } = useStore();
  const [category, setCategory] = useState("Hostel"),
    [search, setSearch] = useState("");
  const step = categories.indexOf(category as (typeof categories)[number]);
  const amount = totals(cart, catalog);
  const products = catalog.products.filter(
    (p) =>
      (category === "All" || p.category === category) &&
      p.name.toLowerCase().includes(search.toLowerCase()),
  );
  return (
    <div className="container page">
      <PageHeading
        eyebrow="YOUR KIT. YOUR RULES."
        title="Only what you need."
        description="Already have a bucket? Skip it. Love an extra notebook? Add it. Build a kit that's all you."
      />
      <nav className="builder-steps" aria-label="Build your kit steps">
        {categories.map((c, i) => (
          <button
            key={c}
            aria-current={category === c ? "step" : undefined}
            onClick={() => setCategory(c)}
          >
            0{i + 1}. {c}
          </button>
        ))}
        <Link className="button secondary" href="/cart">
          04. Review
        </Link>
      </nav>
      <div className="filters">
        <label>
          <span className="sr-only">Search items</span>
          <input
            type="search"
            placeholder="Find an essential…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </label>
      </div>
      {!ready ? (
        <Loading />
      ) : (
        <div className="product-grid">
          {products.map((p) => (
            <Item key={p.id} p={p} />
          ))}
        </div>
      )}
      {ready && !products.length && (
        <p>No matching essentials. Try another search.</p>
      )}
      <div className="builder-bar">
        <div>
          <strong>Made by you.</strong>
          <span>
            {cart.reduce((s, l) => s + l.quantity, 0)} items in your bucket ·{" "}
            {money(amount.subtotal)}
          </span>
        </div>
        <div className="row">
          {step > 0 && (
            <button
              className="text-button"
              onClick={() => setCategory(categories[step - 1])}
            >
              Back
            </button>
          )}
          {step < 2 ? (
            <button
              className="button primary"
              onClick={() => setCategory(categories[step + 1])}
            >
              Next: {categories[step + 1]} <IconArrowRight size={18} />
            </button>
          ) : (
            <Link className="button primary" href="/cart">
              Review my kit <IconArrowRight size={18} />
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
