"use client";
import { kitLabel } from "@/lib/catalog";
import Link from "next/link";
import { Photo } from "./photo";
import { media, productPhoto } from "@/lib/media";
import { IconArrowUpRight, IconMinus, IconPlus } from "@tabler/icons-react";
import { money } from "@/lib/catalog";
import { availability } from "@/lib/commerce";
import type { Kit, Product, Tier } from "@/lib/types";
import { useStore } from "./store";
export function ProductImage({
  product,
  className = "",
}: {
  product: Product;
  className?: string;
}) {
  return (
    <Photo
      photo={productPhoto(product)}
      className={`product-image ${className}`}
    />
  );
}
export function Badge({ tier }: { tier: Tier }) {
  return <span className={`badge ${tier.toLowerCase()}`}>{kitLabel(tier)}</span>;
}
export function KitVisual({
  kit,
  large = false,
}: {
  kit: Kit;
  large?: boolean;
}) {
  const photo = media.kits[kit.type];
  return (
    <div className={`kit-visual ${large ? "large" : ""}`} data-cursor="View">
      <Photo photo={photo} />
      {media.alternate[kit.type] && (
        <Photo photo={media.alternate[kit.type]} className="alternate-photo" />
      )}
    </div>
  );
}
export function KitCard({ kit }: { kit: Kit }) {
  const { catalog } = useStore();
  const count = kit.items.reduce((n, i) => n + i.quantity, 0);
  const stock = availability({ kind: "kit", id: kit.id }, catalog);
  return (
    <article className="kit-card">
      <Link
        href={`/kits/${kit.id}`}
        aria-label={`View ${kit.name} ${kitLabel(kit.tier)}`}
      >
        <KitVisual kit={kit} />
      </Link>
      <div className="card-body">
        <div className="row between">
          <Badge tier={kit.tier} />
          <span className="muted small">{count} essentials</span>
        </div>
        <h3>
          <Link href={`/kits/${kit.id}`}>{kit.name}</Link>
        </h3>
        <p>{kit.description}</p>
        <div className="row between card-bottom">
          <div>
            <span className="price">{money(kit.price)}</span>
            <span className="small muted"> / kit</span>
          </div>
          <Link
            className="circle-link"
            href={`/kits/${kit.id}`}
            aria-label={`Shop ${kit.name} ${kitLabel(kit.tier)}`}
          >
            <IconArrowUpRight size={22} />
          </Link>
        </div>
        {stock === 0 && (
          <span className="error small">Currently out of stock</span>
        )}
      </div>
    </article>
  );
}
export function Quantity({
  value,
  onChange,
  label = "Quantity",
  max = 20,
}: {
  value: number;
  onChange: (n: number) => void;
  label?: string;
  max?: number;
}) {
  return (
    <div className="quantity">
      <button
        type="button"
        disabled={value <= 1}
        onClick={() => onChange(value - 1)}
        aria-label={`Decrease ${label}`}
      >
        <IconMinus size={15} />
      </button>
      <span aria-label={`${label}: ${value}`}>{value}</span>
      <button
        type="button"
        disabled={value >= max}
        onClick={() => onChange(value + 1)}
        aria-label={`Increase ${label}`}
      >
        <IconPlus size={15} />
      </button>
    </div>
  );
}
export function ErrorMessage({ message }: { message: string }) {
  return message ? (
    <p className="error-box" role="alert">
      {message}
    </p>
  ) : null;
}
export function Loading() {
  return (
    <div className="loading" role="status" aria-label="Loading">
      <div />
      <div />
      <div />
      <span>Getting things ready…</span>
    </div>
  );
}
export function Empty({
  title,
  body,
  href = "/kits",
  action = "Explore the kits",
}: {
  title: string;
  body: string;
  href?: string;
  action?: string;
}) {
  return (
    <div className="empty">
      <span className="empty-symbol">↗</span>
      <h2>{title}</h2>
      <p>{body}</p>
      <Link href={href} className="button primary">
        {action}
      </Link>
    </div>
  );
}
export function PageHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
}) {
  return (
    <header className="page-heading">
      {eyebrow && <span className="eyebrow">{eyebrow}</span>}
      <h1>{title}</h1>
      {description && <p>{description}</p>}
    </header>
  );
}
