"use client";
import { kitLabel } from "@/lib/catalog";
import Link from "next/link";
import { useState } from "react";
import { IconTrash, IconArrowRight } from "@tabler/icons-react";
import { useStore } from "@/components/store";
import {
  Empty,
  PageHeading,
  ProductImage,
  KitVisual,
  Quantity,
  ErrorMessage,
  Loading,
} from "@/components/ui";
import { CartSummary } from "@/components/cart-summary";
import { entry, totals } from "@/lib/commerce";
import { money } from "@/lib/catalog";
import type { Kit, Product } from "@/lib/types";
export default function Cart() {
  const { cart, catalog, update, remove, ready } = useStore();
  const [error, setError] = useState("");
  if (!ready)
    return (
      <div className="container page">
        <Loading />
      </div>
    );
  if (!cart.length)
    return (
      <Empty
        title="Your bucket is waiting."
        body="A fresh start begins with a few good essentials. Let's find yours."
      />
    );
  return (
    <div className="container page">
      <PageHeading
        title="Your bucket of beginnings."
        description="One last look before your campus essentials are sorted."
      />
      <div className="checkout-grid">
        <div>
          <ErrorMessage message={error} />
          {cart.map((l) => {
            const e = entry(l, catalog);
            return (
              <article className="cart-item" key={l.key}>
                <Link
                  className="cart-image"
                  href={l.kind === "kit" ? `/kits/${l.id}` : "/build-your-own"}
                >
                  {e &&
                    (l.kind === "kit" ? (
                      <KitVisual kit={e as Kit} />
                    ) : (
                      <ProductImage product={e as Product} />
                    ))}
                </Link>
                <div className="cart-description">
                  <span className="small muted">
                    {l.kind === "kit" ? kitLabel((e as Kit)?.tier || "") : "Your own kit"}
                  </span>
                  <h3>{e?.name || "Unavailable item"}</h3>
                  <p className="small muted">
                    {Object.entries(l.sizes)
                      .map(([k, v]) => `${k}: ${v}`)
                      .join(" · ")}
                  </p>
                  <div className="row">
                    <Quantity
                      value={l.quantity}
                      label={e?.name}
                      onChange={(n) => {
                        try {
                          update(l.key, n);
                          setError("");
                        } catch (e) {
                          setError((e as Error).message);
                        }
                      }}
                    />
                    <button
                      className="icon-button"
                      aria-label={`Remove ${e?.name || "item"}`}
                      onClick={() => remove(l.key)}
                    >
                      <IconTrash size={18} />
                    </button>
                  </div>
                </div>
                <strong>{money((e?.price || 0) * l.quantity)}</strong>
              </article>
            );
          })}
          <Link href="/kits" className="text-link">
            ← Keep exploring
          </Link>
        </div>
        <aside className="summary-card">
          <h2>The good stuff, totalled.</h2>
          <CartSummary amount={totals(cart, catalog)} />
          <Link className="button primary full" href="/checkout">
            Go to checkout <IconArrowRight size={18} />
          </Link>
          <p className="small muted">
            Pickup is free. Choose hostel delivery and add a discount code at
            checkout.
          </p>
        </aside>
      </div>
    </div>
  );
}
