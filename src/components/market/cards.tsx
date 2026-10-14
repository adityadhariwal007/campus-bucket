"use client";
import Link from "next/link";
import { money } from "@/lib/catalog";
import { secondLook, type MarketListing } from "@/lib/marketplace";
export function MarketCard({
  listing,
  photos,
}: {
  listing: MarketListing;
  photos: Record<string, string>;
}) {
  const src = photos[listing.photos[0]];
  return (
    <article className="market-card">
      <Link
        href={`/marketplace/${listing.id}`}
        className="market-card-image"
        aria-label={`View ${listing.title}`}
      >
        {src ? (
          <img
            src={src}
            alt={listing.title}
            width={600}
            height={600}
            loading="lazy"
            decoding="async"
          />
        ) : (
          <span>Photo unavailable</span>
        )}
      </Link>
      <div className="row between market-card-meta">
        <span>{listing.category}</span>
        <strong>{listing.price === 0 ? "Free" : money(listing.price)}</strong>
      </div>
      <h3>
        <Link href={`/marketplace/${listing.id}`}>{listing.title}</Link>
      </h3>
      <p>
        {listing.condition}
        {listing.course && ` · ${listing.course}`}
      </p>
      <div className="market-card-tags">
        {listing.previous_price !== null &&
          listing.price < listing.previous_price && <span>Price dropped</span>}
        {secondLook(listing) && <span>Second look</span>}
        {listing.available_until && (
          <span>
            Available until{" "}
            {new Date(listing.available_until + "T12:00:00").toLocaleDateString(
              "en-IN",
              { day: "numeric", month: "short" },
            )}
          </span>
        )}
      </div>
    </article>
  );
}
