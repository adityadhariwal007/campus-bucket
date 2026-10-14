"use client";
import { useEffect, useState } from "react";
import { useStore } from "@/components/store";
import { Empty, ErrorMessage, Loading, PageHeading } from "@/components/ui";
import { OrderCard } from "@/components/order-card";
import type { Order } from "@/lib/types";
export default function Orders() {
  const store = useStore();
  const [orders, setOrders] = useState<Order[]>([]),
    [busy, setBusy] = useState(true),
    [error, setError] = useState(""),
    [search, setSearch] = useState("");
  async function refresh() {
    setBusy(true);
    setError("");
    try {
      setOrders(await store.getOrders());
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  useEffect(() => {
    if (store.ready) void refresh();
  }, [store.ready, store.account?.id]);
  if (!store.ready)
    return (
      <div className="container page">
        <Loading />
      </div>
    );
  if (!store.account)
    return (
      <Empty
        title="Your orders, all together."
        body="Sign in to see where your campus essentials are headed."
        href="/login"
        action="Sign in"
      />
    );
  const own = orders.filter((o) => o.user_id === store.account?.id);
  const filtered = own.filter((o) =>
    o.id.toLowerCase().includes(search.toLowerCase().replace(/^cb-/, "")),
  );
  return (
    <div className="container page orders-page">
      <PageHeading
        eyebrow="FOLLOW YOUR FRESH START"
        title="Your orders."
        description="From our bucket to your doorstep. Follow every step here."
      />
      <div className="row between order-search">
        <label>
          <span className="sr-only">Search order number</span>
          <input
            type="search"
            placeholder="Search order number"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </label>
        <button className="button secondary" disabled={busy} onClick={refresh}>
          {busy ? "Refreshing…" : "Refresh status"}
        </button>
      </div>
      <ErrorMessage message={error} />
      {busy ? (
        <Loading />
      ) : filtered.length ? (
        filtered.map((o) => <OrderCard order={o} key={o.id} />)
      ) : (
        <Empty
          title={search ? "No matching order." : "Your first order awaits."}
          body={
            search
              ? "Try the first eight characters of your order number."
              : "Choose your essentials and we’ll keep you updated here."
          }
        />
      )}
    </div>
  );
}
