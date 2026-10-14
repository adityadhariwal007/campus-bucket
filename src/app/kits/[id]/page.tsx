"use client";
import { kitLabel } from "@/lib/catalog";
import { use, useState } from "react";
import Link from "next/link";
import {
  IconArrowRight,
  IconCheck,
  IconShoppingBag,
  IconTruck,
} from "@tabler/icons-react";
import { useStore } from "@/components/store";
import {
  Badge,
  KitVisual,
  ProductImage,
  Quantity,
  ErrorMessage,
  Empty,
  Loading,
} from "@/components/ui";
import { Photo } from "@/components/photo";
import { media } from "@/lib/media";
import { SizeSelect } from "@/components/size-select";
import { money, tierCopy } from "@/lib/catalog";
import { availability } from "@/lib/commerce";
export default function Detail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  return <DetailContent key={id} id={id} />;
}
function DetailContent({ id }: { id: string }) {
  const { catalog, add, ready } = useStore();
  const [selected, setSelected] = useState<Record<string, string>>({}),
    [quantity, setQuantity] = useState(1),
    [error, setError] = useState(""),
    [added, setAdded] = useState(false);
  const [pincode, setPincode] = useState("");
  const [deliveryMessage, setDeliveryMessage] = useState("");
  const kit = catalog.kits.find((k) => k.id === id);
  if (!ready)
    return (
      <div className="container page">
        <Loading />
      </div>
    );
  if (!kit)
    return (
      <Empty
        title="That kit isn't here."
        body="Find your next favorite in our collection."
      />
    );
  const stock = availability({ kind: "kit", id }, catalog);
  const related = catalog.kits.filter(
    (k) => k.type === kit.type && k.type !== "Bundle",
  );
  function addKit() {
    try {
      add({ kind: "kit", id, quantity, sizes: selected });
      setError("");
      setAdded(true);
    } catch (e) {
      setError((e as Error).message);
    }
  }
  return (
    <div className="container page">
      <div className="breadcrumbs">
        <Link href="/kits">All kits</Link>
        <span>/</span>
        {kit.name}
        <span>/</span>
        {kitLabel(kit.tier)}
      </div>
      <div className="detail-grid">
        <div>
          <KitVisual kit={kit} large />
          <p className="muted small image-note">
            Labeled frames are awaiting original product photography.
          </p>
          {media.alternate[kit.type] && (
            <Photo
              photo={media.alternate[kit.type]}
              className="detail-secondary-photo"
            />
          )}
        </div>
        <div className="detail-copy">
          <Badge tier={kit.tier} />
          <h1>{kit.name}</h1>
          <p className="lead">{kit.description}</p>
          <div className="detail-price">
            {money(kit.price)}
            <span>Inclusive of taxes</span>
          </div>
          {related.length > 0 && (
            <div className="tier-picker">
              {related.map((k) => (
                <Link
                  key={k.id}
                  href={`/kits/${k.id}`}
                  className={k.id === id ? "selected" : ""}
                >
                  <strong>{kitLabel(k.tier)}</strong>
                  <span>{money(k.price)}</span>
                </Link>
              ))}
            </div>
          )}
          <SizeSelect
            line={{ kind: "kit", id }}
            value={selected}
            onChange={setSelected}
          />
          <div className="row purchase-row">
            <Quantity
              value={quantity}
              max={Math.min(stock, 20)}
              onChange={setQuantity}
            />
            <button
              className="button primary"
              disabled={!stock}
              onClick={addKit}
            >
              <IconShoppingBag size={20} />
              {stock ? "Add to bucket" : "Sold out"}
            </button>
          </div>
          <ErrorMessage message={error} />
          {added && (
            <p className="success-message" role="status">
              Added!{" "}
              <Link href="/cart">
                View your bucket <IconArrowRight size={15} />
              </Link>
            </p>
          )}
          <form
            className="delivery-check"
            onSubmit={(e) => {
              e.preventDefault();
              setDeliveryMessage(
                /^[1-9][0-9]{5}$/.test(pincode)
                  ? "Valid pincode format. Contact us to confirm service at your campus."
                  : "Enter a 6-digit Indian pincode.",
              );
            }}
          >
            <label>
              Delivery option
              <select defaultValue="hostel">
                <option value="hostel">
                  Hostel delivery · ₹49, free from ₹1,499
                </option>
                <option value="pickup">Campus pickup · Free</option>
              </select>
            </label>
            <label htmlFor="pincode">Check your pincode</label>
            <div className="row">
              <input
                id="pincode"
                inputMode="numeric"
                maxLength={6}
                value={pincode}
                onChange={(e) => setPincode(e.target.value.replace(/\D/g, ""))}
                placeholder="110001"
              />
              <button className="button secondary">Check</button>
            </div>
            <p role="status" className="small">
              {deliveryMessage}
            </p>
            <p className="small">
              Choose your final delivery option at checkout.
            </p>
          </form>
          <div className="detail-promises">
            <span>
              <IconCheck size={18} />
              {stock} kits available
            </span>
            <span>
              <IconTruck size={18} />
              Campus pickup or hostel delivery
            </span>
          </div>
        </div>
      </div>
      <section className="section">
        <h2>Good things inside.</h2>
        <p>Every item, accounted for. No surprises when you unpack.</p>
        <div className="contents-grid">
          {kit.items.map((i) => {
            const p = catalog.products.find((p) => p.id === i.product_id);
            return p ? (
              <div className="content-item" key={p.id}>
                <ProductImage product={p} />
                <div>
                  <strong>{p.name}</strong>
                  <span className="muted small">Quantity: {i.quantity}</span>
                </div>
              </div>
            ) : null;
          })}
        </div>
      </section>
      {related.length > 0 && (
        <section className="section comparison">
          <h2>Pick your level of sorted.</h2>
          <p>Same new chapter. Three ways to start it.</p>
          <div className="compare-grid">
            {related.map((k) => (
              <article
                className={
                  k.id === id ? "compare-card current" : "compare-card"
                }
                key={k.id}
              >
                <Badge tier={k.tier} />
                <h3>{money(k.price)}</h3>
                <p>{tierCopy[k.tier]}</p>
                <ul>
                  {k.items.map((i) => (
                    <li key={i.product_id}>
                      <IconCheck size={17} />
                      <span>
                        {i.quantity} ×{" "}
                        {
                          catalog.products.find((p) => p.id === i.product_id)
                            ?.name
                        }
                      </span>
                    </li>
                  ))}
                </ul>
                <Link href={`/kits/${k.id}`} className="button secondary">
                  {k.id === id ? "Currently viewing" : `Choose ${kitLabel(k.tier)}`}
                </Link>
              </article>
            ))}
          </div>
        </section>
      )}
      <div className="detail-add-bar">
        <div>
          <strong>
            {kit.name} / {kitLabel(kit.tier)}
          </strong>
          <span>
            {money(kit.price)} × {quantity}
          </span>
        </div>
        <div>
          <button
            className="button primary"
            data-cursor="Add"
            disabled={!stock}
            onClick={addKit}
          >
            {stock ? "Add to bucket ↗" : "Sold out"}
          </button>
          {error && (
            <p role="alert" className="small">
              {error}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
