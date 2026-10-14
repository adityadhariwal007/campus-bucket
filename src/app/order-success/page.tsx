"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { IconCheck, IconArrowRight } from "@tabler/icons-react";
import { useStore } from "@/components/store";
import { OrderCard } from "@/components/order-card";
import { Empty, Loading, ErrorMessage } from "@/components/ui";
import type { Order } from "@/lib/types";
export default function Success() {
  const store = useStore();
  const [order, setOrder] = useState<Order | null>(null),
    [busy, setBusy] = useState(true),
    [error, setError] = useState("");
  useEffect(() => {
    if (!store.ready) return;
    const id = new URLSearchParams(window.location.search).get("id");
    store
      .getOrders()
      .then((all) =>
        setOrder(
          all.find((o) => o.id === id && o.user_id === store.account?.id) ||
            null,
        ),
      )
      .catch((e) => setError(e.message))
      .finally(() => setBusy(false));
  }, [store.ready, store.account?.id]);
  if (busy)
    return (
      <div className="container page">
        <Loading />
      </div>
    );
  if (error)
    return (
      <div className="container page">
        <ErrorMessage message={error} />
        <Link href="/orders">View orders</Link>
      </div>
    );
  if (!order)
    return (
      <Empty
        title="Looking for your order?"
        body="Sign in and open My Orders to find your confirmation."
        href="/orders"
        action="My orders"
      />
    );
  return (
    <div className="container page success-page">
      <div className="success-icon">
        <IconCheck size={36} />
      </div>
      <span className="eyebrow">ONE LESS THING ON YOUR LIST</span>
      <h1>Your order is in.</h1>
      <p>Your order has been submitted. No payment was collected.</p>
      <OrderCard order={order} expanded />
      <div className="row center">
        <Link className="button primary" href="/orders">
          Track my order <IconArrowRight size={18} />
        </Link>
        <Link className="text-link" href="/kits">
          Keep exploring
        </Link>
      </div>
    </div>
  );
}
