"use client";
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { MarketGate, useMarket } from "./provider";
import { marketAction, marketRead } from "./api";
import { money } from "@/lib/catalog";
import {
  secondLook,
  suggestedPrice,
  type MarketListing,
} from "@/lib/marketplace";
type Notice = {
  id: string;
  title: string;
  link: string;
  seen: boolean;
  created_at: string;
};
export function MyMarket() {
  return (
    <MarketGate>
      <MyListings />
    </MarketGate>
  );
}
function MyListings() {
  const { status, refresh } = useMarket();
  const [items, setItems] = useState<MarketListing[]>([]),
    [notices, setNotices] = useState<Notice[]>([]),
    [busy, setBusy] = useState(true),
    [acting, setActing] = useState(false),
    [error, setError] = useState(""),
    [message, setMessage] = useState("");
  const load = useCallback(async () => {
    setError("");
    try {
      const [list, news] = await Promise.all([
        marketRead<MarketListing[]>("mine"),
        marketRead<Notice[]>("notifications"),
      ]);
      setItems(list);
      setNotices(news);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }, []);
  useEffect(() => {
    void load();
  }, [load]);
  async function act(action: string, data: Record<string, unknown>) {
    setActing(true);
    setError("");
    setMessage("");
    try {
      await marketAction(action, data);
      await load();
      setMessage("Saved.");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setActing(false);
    }
  }
  return (
    <>
      <div className="market-page-heading">
        <span className="eyebrow">YOUR CORNER OF CAMPUS</span>
        <h1>
          Pass it <em>forward.</em>
        </h1>
        <Link className="button primary" href="/marketplace/sell">
          List an item ↗
        </Link>
      </div>
      {error && (
        <p className="error-box" role="alert">
          {error} <button onClick={() => void load()}>Retry</button>
        </p>
      )}
      {message && <p role="status">{message}</p>}
      <section className="market-settings">
        <h2>Your notifications</h2>
        <label className="market-check">
          <input
            type="checkbox"
            checked={status?.member?.email_alerts ?? false}
            disabled={acting}
            onChange={async (e) => {
              setActing(true);
              try {
                await marketAction("alerts", { enabled: e.target.checked });
                await refresh();
              } catch (e) {
                setError((e as Error).message);
              } finally {
                setActing(false);
              }
            }}
          />
          Email buyer interest, meetup and handover updates, saved-item price drops and unsold-item
          reminders.
        </label>
        <p>
          Chat stays in your inbox. No chat messages or phone numbers are
          included in email.
        </p>
        {notices.some((n) => !n.seen) && (
          <button
            className="text-button"
            disabled={acting}
            onClick={() => void act("read_notifications", {})}
          >
            Mark notifications read
          </button>
        )}
        <ul className="market-notifications">
          {notices.map((n) => (
            <li key={n.id}>
              <Link href={n.link}>
                {!n.seen && <span aria-label="Unread">● </span>}
                {n.title} ↗
              </Link>
              <small>
                {new Date(n.created_at).toLocaleDateString("en-IN")}
              </small>
            </li>
          ))}
        </ul>
      </section>
      {busy ? (
        <p role="status">Opening your listings…</p>
      ) : !items.length ? (
        <div className="market-state">
          <h2>Your next chapter starts with one listing.</h2>
          <p>
            Real photos. An honest price. A little more room in your hostel.
          </p>
        </div>
      ) : (
        <div className="market-own-list">
          {items.map((l) => (
            <article className="market-own-card" key={l.id}>
              <div className="row between">
                <span className="market-status">{l.status}</span>
                <strong>{money(l.price)}</strong>
              </div>
              <h2>{l.title}</h2>
              <p>
                {l.interest_count ?? 0} interested{" "}
                {l.interest_count === 1 ? "student" : "students"}
              </p>
              {l.moderation_note && (
                <p className="market-review-note">
                  Team note: {l.moderation_note}
                </p>
              )}
              {secondLook(l) && (
                <p className="market-review-note">
                  Your item gets a fair turn in Second look. Consider clearer
                  photos, more detail or a price around{" "}
                  {money(suggestedPrice(l.price))}. You choose whether to change
                  it.
                </p>
              )}
              <div className="market-actions">
                <Link className="text-link" href={`/marketplace/${l.id}`}>
                  View ↗
                </Link>
                {!["sold", "withdrawn", "expired"].includes(l.status) && (
                  <Link
                    className="text-link"
                    href={`/marketplace/sell?edit=${l.id}`}
                  >
                    Edit & resubmit ↗
                  </Link>
                )}
                <Link className="text-link" href="/marketplace/inbox">
                  Buyer conversations ↗
                </Link>
              </div>
              {["active", "reserved", "pending", "rejected", "draft"].includes(
                l.status,
              ) && (
                <>
                  <form
                    className="market-inline-form"
                    onSubmit={(e) => {
                      e.preventDefault();
                      void act("price", {
                        id: l.id,
                        price: Number(
                          new FormData(e.currentTarget).get("price"),
                        ),
                      });
                    }}
                  >
                    <label>
                      New price ₹
                      <input
                        name="price"
                        type="number"
                        min={0}
                        max={200000}
                        step={1}
                        defaultValue={l.price}
                        required
                      />
                    </label>
                    <button className="button secondary" disabled={acting}>
                      Update price
                    </button>
                  </form>
                  <small>
                    One price change per hour. Saved-item followers are notified
                    of a reduction.
                  </small>
                  <div className="market-actions">
                    <button
                      className="text-button"
                      disabled={acting}
                      onClick={() => {
                        if (
                          window.confirm(
                            "Withdraw this listing from the marketplace?",
                          )
                        )
                          void act("withdraw", { id: l.id });
                      }}
                    >
                      Withdraw
                    </button>
                    {["active", "reserved"].includes(l.status) && (
                      <button
                        className="text-button"
                        disabled={acting}
                        onClick={() => {
                          if (
                            window.confirm(
                              "Mark this sold outside Campus Bucket? This does not create a verified handover.",
                            )
                          )
                            void act("sold_elsewhere", { id: l.id });
                        }}
                      >
                        Sold elsewhere
                      </button>
                    )}
                  </div>
                </>
              )}
            </article>
          ))}
        </div>
      )}
    </>
  );
}
