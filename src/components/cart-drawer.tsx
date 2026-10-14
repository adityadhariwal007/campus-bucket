"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { IconX } from "@tabler/icons-react";
import { useStore } from "./store";
import { ErrorMessage, Quantity } from "./ui";
import { entry, totals } from "@/lib/commerce";
import { money } from "@/lib/catalog";
export function CartDrawer({
  open,
  close,
}: {
  open: boolean;
  close: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const { cart, catalog, update, remove } = useStore();
  const [code, setCode] = useState("");
  const [applied, setApplied] = useState("");
  const [error, setError] = useState("");
  useEffect(() => {
    if (open) {
      dialog.current?.showModal();
      const old = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = old;
      };
    }
    dialog.current?.close();
  }, [open]);
  const amount = totals(cart, catalog, applied, "hostel");
  const remaining = Math.max(0, 1499 - amount.subtotal + amount.discount);
  return (
    <dialog
      ref={dialog}
      className="cart-drawer"
      aria-labelledby="drawer-title"
      onCancel={close}
      onClose={close}
      onClick={(e) => {
        if (e.target === e.currentTarget) close();
      }}
    >
      <div className="drawer-inner">
        <header className="row between">
          <h2 id="drawer-title">
            My bucket<span> ({cart.reduce((s, l) => s + l.quantity, 0)})</span>
          </h2>
          <button
            className="icon-button"
            aria-label="Close bucket"
            onClick={close}
          >
            <IconX />
          </button>
        </header>
        {cart.length ? (
          <>
            <div className="delivery-progress">
              <p>
                {remaining
                  ? `${money(remaining)} away from free hostel delivery.`
                  : "Hostel delivery is on us."}
              </p>
              <progress
                value={Math.min(1499, amount.subtotal - amount.discount)}
                max={1499}
                aria-label="Progress towards free hostel delivery"
              />
            </div>
            <div className="drawer-lines">
              {cart.map((l) => (
                <article className="drawer-line" key={l.key}>
                  <div className="row between">
                    <strong>
                      {entry(l, catalog)?.name || "Unavailable item"}
                    </strong>
                    <span>
                      {money((entry(l, catalog)?.price || 0) * l.quantity)}
                    </span>
                  </div>
                  <p className="small">
                    {Object.entries(l.sizes)
                      .map(([key, value]) => `${key}: ${value}`)
                      .join(" · ")}
                  </p>
                  <div className="row between">
                    <Quantity
                      value={l.quantity}
                      label={entry(l, catalog)?.name}
                      onChange={(q) => {
                        try {
                          update(l.key, q);
                          setError("");
                        } catch (e) {
                          setError((e as Error).message);
                        }
                      }}
                    />
                    <button
                      className="text-button"
                      onClick={() => remove(l.key)}
                    >
                      Remove
                    </button>
                  </div>
                </article>
              ))}
            </div>
            <form
              className="drawer-coupon"
              onSubmit={(e) => {
                e.preventDefault();
                try {
                  totals(cart, catalog, code);
                  setApplied(code.trim().toUpperCase());
                  setError("");
                } catch (e) {
                  setError((e as Error).message);
                }
              }}
            >
              <label htmlFor="drawer-code">Discount code</label>
              <div className="row">
                <input
                  id="drawer-code"
                  maxLength={30}
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="CAMPUS10"
                />
                <button className="button secondary">Apply</button>
              </div>
            </form>
            {applied && (
              <p role="status" className="small">
                {applied} applied: save {money(amount.discount)}.
              </p>
            )}
            <ErrorMessage message={error} />
            <div className="drawer-total">
              <div className="row between">
                <strong>Subtotal after discount</strong>
                <strong>{money(amount.subtotal - amount.discount)}</strong>
              </div>
              <p className="small">
                Pickup is free. Hostel delivery calculated at checkout.
              </p>
              <Link
                className="button primary full"
                href={`/checkout${applied ? `?code=${encodeURIComponent(applied)}` : ""}`}
                onClick={close}
              >
                Checkout ↗
              </Link>
              <Link className="text-link" href="/cart" onClick={close}>
                View full bucket
              </Link>
            </div>
          </>
        ) : (
          <div className="empty">
            <h3>A fresh start.</h3>
            <p>Your bucket is waiting for its first essential.</p>
            <Link className="button primary" href="/kits" onClick={close}>
              Explore the kits ↗
            </Link>
          </div>
        )}
      </div>
    </dialog>
  );
}
