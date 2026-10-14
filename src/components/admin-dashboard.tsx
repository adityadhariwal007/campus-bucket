"use client";
import { useEffect, useState } from "react";
import { IconPlus, IconEdit, IconX } from "@tabler/icons-react";
import { useStore } from "@/components/store";
import {
  Empty,
  ErrorMessage,
  Loading,
  PageHeading,
  ProductImage,
} from "@/components/ui";
import { OrderCard } from "@/components/order-card";
import { categories, money, tiers } from "@/lib/catalog";
import { matchesStock } from "@/lib/admin";
import { statuses, type Kit, type Order, type Product } from "@/lib/types";
const blankProduct: Product = {
  id: "",
  name: "",
  price: 0,
  stock: 0,
  category: "Hostel",
  image: "sprite:0",
  size_type: null,
};
const blankKit: Kit = {
  id: "",
  name: "",
  type: "Hostel",
  tier: "Fresher",
  price: 0,
  stock: 0,
  description: "",
  items: [],
};
export default function Admin() {
  const store = useStore();
  const [tab, setTab] = useState("Overview"),
    [orders, setOrders] = useState<Order[]>([]),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [message, setMessage] = useState(""),
    [editing, setEditing] = useState<{
      kind: "product" | "kit";
      data: Product | Kit;
      isNew: boolean;
    } | null>(null),
    [search, setSearch] = useState(""),
    [status, setStatus] = useState("All"),
    [category, setCategory] = useState("All"),
    [stock, setStock] = useState("All");
  async function refresh() {
    setBusy(true);
    setError("");
    try {
      await store.reload();
      setOrders(await store.getOrders());
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  useEffect(() => {
    if (store.ready && store.account?.admin) void refresh();
  }, [store.ready, store.account?.admin]);
  if (!store.ready)
    return (
      <div className="container page">
        <Loading />
      </div>
    );
  if (!store.account)
    return (
      <Empty
        title="The backstage of Campus Bucket."
        body={
          store.demo
            ? "Sign in with the demo account to explore catalog and order management."
            : "Sign in with an authorized administrator account."
        }
        href="/login"
        action="Sign in"
      />
    );
  if (!store.account.admin)
    return (
      <Empty
        title="This page is for the store team."
        body="Your account doesn't have administrator access. You can still find and track all your orders."
        href="/orders"
        action="My orders"
      />
    );
  async function save(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!editing || busy) return;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const d = editing.data;
      if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(d.id) || d.id.length > 80)
        throw new Error(
          "Use a lowercase ID with letters, numbers, and hyphens (up to 80 characters).",
        );
      if (
        !d.name.trim() ||
        d.name.length > 120 ||
        !Number.isInteger(d.price) ||
        d.price < 1 ||
        d.price > 1000000 ||
        !Number.isInteger(d.stock) ||
        d.stock < 0 ||
        d.stock > 100000
      )
        throw new Error(
          "Enter a name, a whole-rupee price (1–1,000,000), and stock (0–100,000).",
        );
      if (
        editing.isNew &&
        (editing.kind === "product"
          ? store.catalog.products
          : store.catalog.kits
        ).some((x) => x.id === d.id)
      )
        throw new Error("That ID already exists. Choose another ID.");
      if (editing.kind === "product") {
        const p = d as Product;
        if (
          !/^sprite:([0-9]|[12][0-9])$/.test(p.image) &&
          !/^https:\/\//.test(p.image)
        )
          throw new Error(
            "Image must be sprite:0 through sprite:29, or an HTTPS image URL.",
          );
        await store.saveProduct({ ...p, name: p.name.trim() });
      } else {
        const k = d as Kit;
        if (
          !k.items.length ||
          k.items.some(
            (i) =>
              !Number.isInteger(i.quantity) ||
              i.quantity < 1 ||
              i.quantity > 100,
          )
        )
          throw new Error("Choose at least one kit item with quantity 1–100.");
        await store.saveKit({ ...k, name: k.name.trim() });
      }
      setEditing(null);
      setMessage("Saved. Your storefront is up to date.");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  function field(name: string, value: unknown) {
    setEditing((prev) =>
      prev ? { ...prev, data: { ...prev.data, [name]: value } } : prev,
    );
  }
  const products = store.catalog.products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) &&
    (category === "All" || p.category === category) && matchesStock(p.stock, stock),
  );
  const kits = store.catalog.kits.filter((k) =>
    `${k.name} ${k.tier}`.toLowerCase().includes(search.toLowerCase()) &&
    (category === "All" || k.type === category) && matchesStock(k.stock, stock),
  );
  const visibleOrders = orders.filter((o) =>
    `${o.id} ${o.customer.name} ${o.customer.campus}`
      .toLowerCase()
      .includes(search.toLowerCase().replace(/^cb-/, "")) && (status === "All" || o.status === status),
  );
  return (
    <div className="container page admin-workspace">
      <PageHeading
        eyebrow="CAMPUS BUCKET / BACKSTAGE"
        title="Store dashboard."
        description="Your daily overview, customer orders, and catalog — all in one place."
      />
      {store.demo && (
        <p className="info-box">
          Demo admin: changes affect only this browser. Real admin access is
          controlled by your Supabase administrator list.
        </p>
      )}
      <div className="admin-stats">
        <div>
          <strong>{orders.length}</strong>
          <span>Orders loaded (latest 200)</span>
        </div>
        <div>
          <strong>
            {orders.filter((o) => o.status !== "Delivered").length}
          </strong>
          <span>Awaiting delivery</span>
        </div>
        <div>
          <strong>{money(orders.reduce((n, o) => n + o.total, 0))}</strong>
          <span>Order value · latest 200, not payments received</span>
        </div>
      </div>
      <div className="admin-toolbar">
        <div className="tabs">
          {["Overview", "Orders", "Products", "Kits"].map((t) => (
            <button
              className={tab === t ? "selected" : ""}
              aria-pressed={tab === t}
              key={t}
              onClick={() => {
                setTab(t);
                setEditing(null);
                setSearch("");
                setStatus("All");
                setCategory("All");
                setStock("All");
                setError("");
              }}
            >
              {t}
            </button>
          ))}
        </div>
        <div className="row">
          <button
            className="button secondary"
            disabled={busy}
            onClick={refresh}
          >
            Refresh
          </button>
          {(tab === "Products" || tab === "Kits") && (
            <button
              className="button primary"
              onClick={() => {
                setEditing({
                  kind: tab === "Products" ? "product" : "kit",
                  data: structuredClone(
                    tab === "Products" ? blankProduct : blankKit,
                  ),
                  isNew: true,
                });
                setError("");
              }}
            >
              <IconPlus size={17} />
              Add {tab === "Products" ? "product" : "kit"}
            </button>
          )}
        </div>
      </div>
      <ErrorMessage message={error} />
      {message && (
        <p className="success-message" role="status">
          {message}
        </p>
      )}
      {editing && (
        <form onSubmit={save} className="admin-editor">
          <div className="row between">
            <h2>
              {editing.isNew ? "Add" : "Edit"} {editing.kind}
            </h2>
            <button
              type="button"
              className="icon-button"
              aria-label="Close editor"
              onClick={() => setEditing(null)}
            >
              <IconX />
            </button>
          </div>
          <div className="form-grid">
            <label>
              ID
              <input
                required
                value={editing.data.id}
                disabled={!editing.isNew}
                onChange={(e) => field("id", e.target.value)}
                placeholder="e.g. cotton-towel"
                maxLength={80}
              />
            </label>
            <label>
              Name
              <input
                required
                value={editing.data.name}
                onChange={(e) => field("name", e.target.value)}
                maxLength={120}
              />
            </label>
            <label>
              Price (₹, whole rupees)
              <input
                required
                type="number"
                min={1}
                max={1000000}
                step={1}
                value={editing.data.price}
                onChange={(e) => field("price", Number(e.target.value))}
              />
            </label>
            <label>
              Stock
              <input
                required
                type="number"
                min={0}
                max={100000}
                step={1}
                value={editing.data.stock}
                onChange={(e) => field("stock", Number(e.target.value))}
              />
            </label>
            {editing.kind === "product" ? (
              <>
                <label>
                  Category
                  <select
                    value={(editing.data as Product).category}
                    onChange={(e) => field("category", e.target.value)}
                  >
                    {categories.map((c) => (
                      <option key={c}>{c}</option>
                    ))}
                  </select>
                </label>
                <label>
                  Size selector
                  <select
                    value={(editing.data as Product).size_type || ""}
                    onChange={(e) => field("size_type", e.target.value || null)}
                  >
                    <option value="">No sizing</option>
                    <option value="shirt">T-shirt</option>
                    <option value="cap">Cap</option>
                    <option value="shoe">Shoe</option>
                  </select>
                </label>
                <label className="span-2">
                  Image (HTTPS URL or sprite:0 to sprite:29)
                  <input
                    required
                    value={(editing.data as Product).image}
                    onChange={(e) => field("image", e.target.value)}
                  />
                </label>
              </>
            ) : (
              <>
                <label>
                  Category
                  <select
                    value={(editing.data as Kit).type}
                    onChange={(e) => field("type", e.target.value)}
                  >
                    {[...categories, "Bundle"].map((c) => (
                      <option key={c}>{c}</option>
                    ))}
                  </select>
                </label>
                <label>
                  Tier
                  <select
                    value={(editing.data as Kit).tier}
                    onChange={(e) => field("tier", e.target.value)}
                  >
                    {tiers.map((t) => (
                      <option key={t}>{t}</option>
                    ))}
                  </select>
                </label>
                <label className="span-2">
                  Description
                  <textarea
                    maxLength={500}
                    value={(editing.data as Kit).description}
                    onChange={(e) => field("description", e.target.value)}
                  />
                </label>
              </>
            )}
          </div>
          {editing.kind === "kit" && (
            <>
              <h3>What's inside</h3>
              <p className="small muted">
                Set quantities. Zero leaves an item out of the kit.
              </p>
              <div className="admin-items">
                {store.catalog.products.map((p) => (
                  <label key={p.id}>
                    {p.name}
                    <input
                      aria-label={`Quantity of ${p.name}`}
                      type="number"
                      min={0}
                      max={100}
                      step={1}
                      value={
                        (editing.data as Kit).items.find(
                          (i) => i.product_id === p.id,
                        )?.quantity || 0
                      }
                      onChange={(e) => {
                        const q = Number(e.target.value);
                        field("items", [
                          ...(editing.data as Kit).items.filter(
                            (i) => i.product_id !== p.id,
                          ),
                          ...(q > 0 ? [{ product_id: p.id, quantity: q }] : []),
                        ]);
                      }}
                    />
                  </label>
                ))}
              </div>
            </>
          )}
          <button className="button primary" disabled={busy}>
            {busy ? "Saving…" : "Save changes"}
          </button>
        </form>
      )}
      {tab !== "Overview" && <div className="admin-filters">
        <label>Search {tab.toLowerCase()}
          <input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder={tab === "Orders" ? "Order number, customer or campus" : "Search by name"} />
        </label>
        {tab === "Orders" ? <label>Order status
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="All">All statuses</option>
            {statuses.map((s) => <option key={s}>{s}</option>)}
          </select>
        </label> : <>
          <label>Category<select value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="All">All categories</option>
            {[...categories, ...(tab === "Kits" ? ["Bundle"] : [])].map((c) => <option key={c}>{c}</option>)}
          </select></label>
          <label>Stock<select value={stock} onChange={(e) => setStock(e.target.value)}>
            <option value="All">All stock</option><option value="Low">Low stock (1–5)</option><option value="Out">Out of stock</option>
          </select></label>
        </>}
      </div>}
      {busy && !editing ? (
        <Loading />
      ) : tab === "Overview" ? (
        <div className="admin-overview">
          <section className="admin-panel">
            <span className="eyebrow">FULFILMENT</span><h2>Orders by stage</h2>
            <p className="muted">Select a stage to view orders and update their delivery status.</p>
            <div className="admin-stage-list">{statuses.map((s) => <button key={s} onClick={() => { setTab("Orders"); setStatus(s); setSearch(""); }}>
              <span>{s}</span><strong>{orders.filter((o) => o.status === s).length}</strong>
            </button>)}</div>
            <p className="small muted">Based on the latest 200 orders.</p>
          </section>
          <section className="admin-panel">
            <span className="eyebrow">CATALOG & STOCK</span><h2>Keep essentials ready</h2>
            <p>{store.catalog.products.length} products · {store.catalog.kits.length} kits</p>
            <div className="admin-stage-list">
              <button onClick={() => { setTab("Products"); setStock("Low"); setCategory("All"); setSearch(""); }}><span>Products running low</span><strong>{store.catalog.products.filter((p) => matchesStock(p.stock, "Low")).length}</strong></button>
              <button onClick={() => { setTab("Products"); setStock("Out"); setCategory("All"); setSearch(""); }}><span>Products out of stock</span><strong>{store.catalog.products.filter((p) => p.stock === 0).length}</strong></button>
              <button onClick={() => { setTab("Kits"); setStock("Out"); setCategory("All"); setSearch(""); }}><span>Kits out of stock</span><strong>{store.catalog.kits.filter((k) => k.stock === 0).length}</strong></button>
            </div>
          </section>
        </div>
      ) : tab === "Orders" ? (
        visibleOrders.length ? (
          visibleOrders.map((o) => (
            <div className="admin-order" key={o.id}>
              <div className="admin-order-control">
                <div>
                  <strong>{o.customer.name}</strong>
                  <br />
                  <small>
                    {o.customer.phone} · {o.customer.email}
                  </small>
                </div>
                <label>
                  <span className="sr-only">Status for {o.id}</span>
                  <select
                    value={o.status}
                    disabled={busy}
                    onChange={async (e) => {
                      setBusy(true);
                      setError("");
                      try {
                        await store.setStatus(
                          o.id,
                          e.target.value as Order["status"],
                        );
                        setOrders(await store.getOrders());
                        setMessage("Order status updated.");
                      } catch (e) {
                        setError((e as Error).message);
                      } finally {
                        setBusy(false);
                      }
                    }}
                  >
                    {statuses.map((s) => (
                      <option key={s}>{s}</option>
                    ))}
                  </select>
                </label>
              </div>
              <OrderCard order={o} />
            </div>
          ))
        ) : (
          <Empty
            title="No matching orders."
            body="Try another search or status. New orders appear after refreshing."
          />
        )
      ) : (tab === "Products" ? products : kits).length === 0 ? (
        <Empty title="No matching items." body="Try another category, stock filter, or search." />
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>{tab === "Products" ? "Product" : "Kit"}</th>
                <th>Category</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {tab === "Products"
                ? products.map((p) => (
                    <tr key={p.id}>
                      <td>
                        <div className="table-product">
                          <ProductImage product={p} />
                          <span>
                            {p.name}
                            <small>{p.id}</small>
                          </span>
                        </div>
                      </td>
                      <td>{p.category}</td>
                      <td>{money(p.price)}</td>
                      <td>{p.stock}</td>
                      <td>
                        <button
                          className="icon-button"
                          aria-label={`Edit ${p.name}`}
                          onClick={() => {
                            setEditing({
                              kind: "product",
                              data: { ...p },
                              isNew: false,
                            });
                            setError("");
                          }}
                        >
                          <IconEdit size={18} />
                        </button>
                      </td>
                    </tr>
                  ))
                : kits.map((k) => (
                    <tr key={k.id}>
                      <td>
                        {k.name}
                        <br />
                        <small className="muted">
                          {k.tier} ·{" "}
                          {k.items.reduce((s, i) => s + i.quantity, 0)} items
                        </small>
                      </td>
                      <td>{k.type}</td>
                      <td>{money(k.price)}</td>
                      <td>{k.stock}</td>
                      <td>
                        <button
                          className="icon-button"
                          aria-label={`Edit ${k.name} ${k.tier}`}
                          onClick={() => {
                            setEditing({
                              kind: "kit",
                              data: structuredClone(k),
                              isNew: false,
                            });
                            setError("");
                          }}
                        >
                          <IconEdit size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
