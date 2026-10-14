"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/components/store";
import { money } from "@/lib/catalog";
import { secondLook, type MarketListing } from "@/lib/marketplace";
import { marketAction, marketRead, signMarketPhotos } from "./api";
import { MarketGate } from "./provider";
export function MarketDetail({ id }: { id: string }) {
  return (
    <MarketGate>
      <Detail id={id} />
    </MarketGate>
  );
}
function Detail({ id }: { id: string }) {
  const router = useRouter();
  const { account } = useStore();
  const [item, setItem] = useState<(MarketListing & { saved: boolean }) | null>(
      null,
    ),
    [photos, setPhotos] = useState<Record<string, string>>({}),
    [selected, setSelected] = useState(0),
    [loading, setLoading] = useState(true),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [report, setReport] = useState(false),
    [message, setMessage] = useState("");
  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const listing = await marketRead<MarketListing & { saved: boolean }>(
          "listing",
          id,
        );
        const signed = await signMarketPhotos(listing.photos);
        if (active) {
          setItem(listing);
          setPhotos(signed);
        }
      } catch (e) {
        if (active) setError((e as Error).message);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [id]);
  if (loading)
    return (
      <p className="market-state" role="status">
        Opening this campus find…
      </p>
    );
  if (!item)
    return (
      <div className="market-state">
        <h1>This find isn’t available.</h1>
        <p>{error}</p>
        <Link href="/marketplace">Back to the market ↗</Link>
      </div>
    );
  const own = item.seller_id === account?.id;
  return (
    <>
      <div className="market-breadcrumb">
        <Link href="/marketplace">Thapar Market</Link>
        <span>/</span>
        <span>{item.category}</span>
      </div>
      <div className="market-detail-grid">
        <div>
          <div className="market-detail-image">
            {photos[item.photos[selected]] ? (
              <img
                src={photos[item.photos[selected]]}
                alt={item.title}
                width={1000}
                height={1000}
              />
            ) : (
              <p>Photo unavailable</p>
            )}
          </div>
          <div className="market-photo-thumbs">
            {item.photos.map((path, i) => (
              <button
                key={path}
                aria-label={`View photo ${i + 1}`}
                aria-pressed={selected === i}
                onClick={() => setSelected(i)}
              >
                <img
                  src={photos[path]}
                  alt={`${item.title}, photo ${i + 1}`}
                  width={90}
                  height={90}
                />
              </button>
            ))}
          </div>
        </div>
        <div className="market-detail-copy">
          <span className="eyebrow">
            {item.category} / {item.condition}
          </span>
          <h1>{item.title}</h1>
          <div className="market-price">
            {item.price === 0 ? "Free" : money(item.price)}
            {item.previous_price !== null &&
              item.price < item.previous_price && (
                <span>
                  <s>{money(item.previous_price)}</s> Price dropped
                </span>
              )}
          </div>
          <div className="market-card-tags">
            <span>{item.status}</span>
            {secondLook(item) && <span>Second look</span>}
            {item.course && <span>{item.course}</span>}
          </div>
          <p className="market-description">{item.description}</p>
          <div className="market-condition">
            <h2>Know before you meet.</h2>
            <p>
              <strong>Defects / missing parts:</strong> {item.defects}
            </p>
            {item.available_until && (
              <p>
                <strong>Available until:</strong> {item.available_until}
              </p>
            )}
            <p>
              Inspect the item in person before you pay. Campus Bucket does not
              hold the item payment.
            </p>
          </div>
          <div className="market-seller">
            <strong>{item.seller_name}</strong>
            <span>
              {item.verification_kind === "email"
                ? "Thapar email confirmed"
                : "Student reviewed by the team"}
            </span>
            <small>
              {item.handovers} {item.handovers === 1 ? "handover" : "handovers"}{" "}
              confirmed by both participants
            </small>
          </div>
          {own ? (
            <Link className="button primary" href="/marketplace/mine">
              Manage your listing ↗
            </Link>
          ) : (
            <div className="market-detail-actions">
              <button
                className="button primary"
                disabled={busy || item.status !== "active"}
                onClick={async () => {
                  setBusy(true);
                  setError("");
                  try {
                    const result = await marketAction("interest", { id });
                    router.push(`/marketplace/inbox?thread=${result.id}`);
                  } catch (e) {
                    setError((e as Error).message);
                    setBusy(false);
                  }
                }}
              >
                {busy
                  ? "Opening chat…"
                  : item.status === "active"
                    ? "I’m interested · Chat ↗"
                    : "This item is " + item.status}
              </button>
              <button
                className="button secondary"
                disabled={busy}
                onClick={async () => {
                  setBusy(true);
                  setError("");
                  try {
                    await marketAction("save", { id, enabled: !item.saved });
                    setItem({ ...item, saved: !item.saved });
                    setMessage(
                      !item.saved
                        ? "Saved. Price alerts follow your email preference."
                        : "Removed from saved items.",
                    );
                  } catch (e) {
                    setError((e as Error).message);
                  } finally {
                    setBusy(false);
                  }
                }}
              >
                {item.saved ? "Unsave item" : "Save + price alerts"}
              </button>
            </div>
          )}
          {error && (
            <p className="error-box" role="alert">
              {error}
            </p>
          )}
          {message && <p role="status">{message}</p>}
          <p className="small muted">
            Chat stays private. Agree on a public campus meeting point; phone
            sharing is optional.
          </p>
          <button
            className="text-button"
            onClick={() => setReport((value) => !value)}
          >
            Report this listing
          </button>
          {report && (
            <ReportForm
              listingId={id}
              done={() => {
                setReport(false);
                setMessage("Report received. The team will review it.");
              }}
            />
          )}
        </div>
      </div>
    </>
  );
}
export function ReportForm({
  listingId,
  threadId,
  done,
}: {
  listingId?: string;
  threadId?: string;
  done: () => void;
}) {
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  return (
    <form
      className="market-report"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        const data = new FormData(e.currentTarget);
        try {
          await marketAction("report", {
            listing_id: listingId,
            thread_id: threadId,
            reason: data.get("reason"),
            details: data.get("details"),
          });
          done();
        } catch (err) {
          setError((err as Error).message);
        } finally {
          setBusy(false);
        }
      }}
    >
      <label>
        Reason
        <select name="reason">
          {["Scam", "Prohibited item", "Harassment", "Other"].map((r) => (
            <option key={r}>{r}</option>
          ))}
        </select>
      </label>
      <label>
        What happened?
        <textarea
          name="details"
          minLength={5}
          maxLength={1000}
          required
          rows={3}
        />
      </label>
      {error && <p role="alert">{error}</p>}
      <button className="button secondary" disabled={busy}>
        {busy ? "Sending…" : "Send report"}
      </button>
    </form>
  );
}
