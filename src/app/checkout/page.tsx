"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  IconBuildingCommunity,
  IconPackage,
  IconLock,
  IconArrowRight,
} from "@tabler/icons-react";
import { useStore } from "@/components/store";
import { Empty, PageHeading, ErrorMessage, Loading } from "@/components/ui";
import { CartSummary } from "@/components/cart-summary";
import { totals } from "@/lib/commerce";
import type { Customer } from "@/lib/types";
export default function Checkout() {
  const store = useStore();
  const router = useRouter();
  const [delivery, setDelivery] = useState<"hostel" | "pickup">("hostel"),
    [code, setCode] = useState(""),
    [applied, setApplied] = useState(""),
    [error, setError] = useState(""),
    [couponError, setCouponError] = useState(""),
    [busy, setBusy] = useState(false),
    [requestId] = useState(() => crypto.randomUUID());
  useEffect(() => {
    const coupon = new URLSearchParams(window.location.search).get("code");
    if (coupon === "CAMPUS10") {
      setCode(coupon);
      setApplied(coupon);
    }
  }, []);
  if (!store.ready)
    return (
      <div className="container page">
        <Loading />
      </div>
    );
  if (!store.cart.length)
    return (
      <Empty
        title="Let's fill that bucket first."
        body="Add your favorite essentials before checking out."
      />
    );
  if (!store.account)
    return (
      <Empty
        title="Keep your orders together."
        body="Sign in to place your order and track its journey to campus."
        href="/login?next=checkout"
        action="Sign in to continue"
      />
    );
  const amount = totals(store.cart, store.catalog, applied, delivery);
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const form = new FormData(e.currentTarget);
      const customer: Customer = {
        name: String(form.get("name")).trim(),
        phone: String(form.get("phone")).trim(),
        email: String(form.get("email")).trim(),
        delivery,
        campus: String(form.get("campus")).trim(),
        address: String(form.get("address") || "").trim(),
      };
      const order = await store.placeOrder(customer, applied, requestId);
      store.clear();
      router.push(`/order-success?id=${order.id}`);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="container page">
      <PageHeading
        eyebrow="THE LAST STEP BEFORE YOUR NEXT CHAPTER"
        title="Where are we headed?"
      />
      <form onSubmit={submit} className="checkout-grid">
        <div className="form-panel">
          <h2>01. A little about you</h2>
          <div className="form-grid">
            <label>
              Full name
              <input
                name="name"
                autoComplete="name"
                required
                minLength={2}
                maxLength={100}
                defaultValue={store.account.name}
              />
            </label>
            <label>
              Mobile number
              <input
                name="phone"
                type="tel"
                autoComplete="tel-national"
                inputMode="numeric"
                required
                pattern="[6-9][0-9]{9}"
                maxLength={10}
                placeholder="10-digit Indian number"
              />
            </label>
            <label className="span-2">
              Email address
              <input
                name="email"
                type="email"
                autoComplete="email"
                required
                maxLength={254}
                defaultValue={store.account.email}
              />
            </label>
          </div>
          <h2>02. Your delivery plan</h2>
          <div className="delivery-options">
            {(["hostel", "pickup"] as const).map((d) => (
              <label key={d} className={delivery === d ? "selected" : ""}>
                <input
                  type="radio"
                  name="delivery"
                  value={d}
                  checked={delivery === d}
                  onChange={() => setDelivery(d)}
                />
                {d === "hostel" ? <IconBuildingCommunity /> : <IconPackage />}
                <span>
                  <strong>
                    {d === "hostel" ? "To my hostel" : "Campus pickup"}
                  </strong>
                  <small>
                    {d === "hostel" ? "₹49, free above ₹1,499" : "Always free"}
                  </small>
                </span>
              </label>
            ))}
          </div>
          <label>
            College / campus name
            <input
              name="campus"
              required
              minLength={2}
              maxLength={150}
              placeholder="Your college and campus"
            />
          </label>
          {delivery === "hostel" ? (
            <label>
              Hostel name & room number
              <textarea
                name="address"
                required
                minLength={5}
                maxLength={500}
                placeholder="Hostel, block, room number, and any delivery directions"
                rows={3}
              />
            </label>
          ) : (
            <p className="info-box">
              Pickup is coordinated at your campus main gate. The store team
              must confirm a time before you visit.
            </p>
          )}
          <h2>03. Payment</h2>
          <div className="info-box">
            <IconLock size={20} />
            <div>
              <strong>Payment at checkout</strong>
              <p>
                No payment is collected at checkout. Your order is submitted to the store team for confirmation.
              </p>
            </div>
          </div>
          <ErrorMessage message={error} />
        </div>
        <aside className="summary-card">
          <h2>Your fresh start</h2>
          <p className="muted">
            {store.cart.reduce((s, l) => s + l.quantity, 0)} items in your
            bucket
          </p>
          <CartSummary amount={amount} />
          <label>
            Have a discount code?
            <div className="coupon-input">
              <input
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="CAMPUS10"
                maxLength={30}
              />
              <button
                type="button"
                className="button secondary"
                onClick={() => {
                  try {
                    totals(store.cart, store.catalog, code, delivery);
                    setApplied(code.trim().toUpperCase());
                    setCouponError("");
                  } catch (e) {
                    setCouponError((e as Error).message);
                  }
                }}
              >
                Apply
              </button>
            </div>
          </label>
          <ErrorMessage message={couponError} />
          {applied && (
            <p className="success-message" role="status">
              CAMPUS10 applied · 10% saved{" "}
              <button
                className="text-button"
                type="button"
                onClick={() => {
                  setApplied("");
                  setCode("");
                }}
              >
                Remove
              </button>
            </p>
          )}
          <button className="button primary full" type="submit" disabled={busy}>
            {busy ? "Placing your order…" : "Place order"}
            <IconArrowRight size={18} />
          </button>
          <p className="small muted">
            By continuing, you agree to our{" "}
            <Link href="/terms">terms & conditions</Link> and{" "}
            <Link href="/privacy">privacy policy</Link>.
          </p>
        </aside>
      </form>
    </div>
  );
}
