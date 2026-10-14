"use client";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { marketRead, marketAction, signMarketPhotos } from "./api";
import { MarketGate, useMarket } from "./provider";
import type { MarketListing, MarketMember } from "@/lib/marketplace";
import { money } from "@/lib/catalog";
type Report = {
  id: string;
  user_id: string;
  listing_id: string | null;
  thread_id: string | null;
  reason: string;
  details: string;
};
type AdminData = {
  members: MarketMember[];
  listings: MarketListing[];
  reports: Report[];
  mail: {
    queued: number;
    failed: number;
    accepted: number;
    configured: boolean;
  };
  audit: {
    action: string;
    target_id: string;
    note: string;
    created_at: string;
  }[];
};
export function MarketAdmin() {
  return (
    <MarketGate>
      <Moderation />
    </MarketGate>
  );
}
function Moderation() {
  const { status } = useMarket();
  const [data, setData] = useState<AdminData | null>(null),
    [photos, setPhotos] = useState<Record<string, string>>({}),
    [error, setError] = useState(""),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false),
    [inspected, setInspected] = useState("");
  const load = useCallback(async () => {
    try {
      const result = await marketRead<AdminData>("admin");
      setData(result);
      setPhotos(
        await signMarketPhotos(result.listings.flatMap((l) => l.photos)),
      );
    } catch (e) {
      setError((e as Error).message);
    }
  }, []);
  useEffect(() => {
    void load();
  }, [load]);
  async function act(
    action: string,
    payload: Record<string, unknown>,
    success = "Saved.",
  ) {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await marketAction(action, payload);
      await load();
      setMessage(success);
      return true;
    } catch (e) {
      setError((e as Error).message);
      return false;
    } finally {
      setBusy(false);
    }
  }
  function review(e: FormEvent<HTMLFormElement>, action: string, id: string) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    void act(action, {
      id,
      decision: f.get("decision"),
      note: f.get("note"),
      checked: f.get("checked") === "on",
    });
  }
  if (!status?.admin)
    return <p className="error-box">Store-admin access is required.</p>;
  return (
    <>
      <div className="market-page-heading">
        <span className="eyebrow">CAMPUS BUCKET / OPERATIONS</span>
        <h1>
          Keep the circle <em>good.</em>
        </h1>
        <div className="market-actions">
          <Link href="/admin" className="text-link">
            Store dashboard ↗
          </Link>
          <button
            disabled={busy}
            className="button secondary"
            onClick={() => {
              setError("");
              void load();
            }}
          >
            Refresh queues
          </button>
        </div>
      </div>
      {error && (
        <p className="error-box" role="alert">
          {error}
        </p>
      )}
      {message && (
        <p className="success-box" role="status">
          {message}
        </p>
      )}
      {!data ? (
        <p role="status">Opening moderation queues…</p>
      ) : (
        <>
          <nav
            className="market-admin-sections"
            aria-label="Moderation sections"
          >
            <a href="#students">Student reviews ({data.members.length})</a>
            <a href="#listings">Listings ({data.listings.length})</a>
            <a href="#reports">Reports ({data.reports.length})</a>
            <a href="#email">Email delivery</a>
            <a href="#audit">Audit trail</a>
          </nav>
          <section id="students" className="market-admin-section">
            <h2>01 / Student verification</h2>
            <p>
              Check programme, batch and roll details against evidence obtained
              through your approved campus process. Never approve on a display
              name alone. Do not ask for ID documents in marketplace chat.
            </p>
            {!data.members.length && <p>No student reviews waiting.</p>}
            {data.members.map((m) => (
              <article className="market-own-card" key={m.user_id}>
                <h3>{m.display_name}</h3>
                <p>
                  {m.programme} · {m.batch} · Roll: {m.roll_number}
                </p>
                <p>Status: {m.verification}</p>
                <code>{m.user_id}</code>
                <form onSubmit={(e) => review(e, "review_member", m.user_id)}>
                  <label>
                    Decision
                    <select name="decision" defaultValue="verified">
                      <option value="verified">Verify student</option>
                      <option value="rejected">Reject request</option>
                      <option value="suspended">Suspend access</option>
                    </select>
                  </label>
                  <label>
                    Review note
                    <textarea
                      name="note"
                      maxLength={500}
                      defaultValue={m.review_note}
                      required
                    />
                  </label>
                  <label className="market-check">
                    <input type="checkbox" name="checked" required />I checked
                    this student’s details.
                  </label>
                  <button className="button primary" disabled={busy}>
                    Save decision
                  </button>
                </form>
              </article>
            ))}
            <details>
              <summary>Suspend or restore a known member</summary>
              <p>
                Use the seller ID shown on a listing review, a report, or a
                previous review. This changes marketplace access only.
              </p>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const f = new FormData(e.currentTarget);
                  void act("review_member", {
                    id: f.get("id"),
                    decision: f.get("decision"),
                    note: f.get("note"),
                    checked: f.get("checked") === "on",
                  });
                }}
              >
                <label>
                  Member ID
                  <input name="id" pattern="[0-9a-fA-F-]{36}" required />
                </label>
                <label>
                  Decision
                  <select name="decision">
                    <option value="suspended">Suspend</option>
                    <option value="verified">Restore verified access</option>
                  </select>
                </label>
                <label>
                  Reason
                  <textarea name="note" maxLength={500} required />
                </label>
                <label className="market-check">
                  <input name="checked" type="checkbox" required />I checked the
                  account and the evidence.
                </label>
                <button disabled={busy} className="button secondary">
                  Apply decision
                </button>
              </form>
            </details>
          </section>
          <section id="listings" className="market-admin-section">
            <h2>02 / Listing review</h2>
            <p>
              Check actual-item photos, condition, defects, ownership claims and
              prohibited goods. Approval publishes the listing.
            </p>
            {!data.listings.length && <p>No listings waiting.</p>}
            {data.listings.map((l) => (
              <article className="market-own-card" key={l.id}>
                <div className="market-review-photos">
                  {l.photos.map(
                    (p) =>
                      photos[p] && (
                        <img
                          key={p}
                          src={photos[p]}
                          alt={`${l.title} — seller photo`}
                          width={500}
                          height={500}
                          loading="lazy"
                        />
                      ),
                  )}
                </div>
                <h3>
                  {l.title} · {money(l.price)}
                </h3>
                <p>
                  {l.category} · {l.condition} · {l.course}
                </p>
                <p>{l.description}</p>
                <p>
                  <strong>Defects:</strong> {l.defects}
                </p>
                <p>
                  Seller: {l.seller_name} ({l.verification_kind})
                </p>
                <code>{l.seller_id}</code>
                <form onSubmit={(e) => review(e, "review_listing", l.id)}>
                  <label>
                    Decision
                    <select name="decision">
                      <option value="active">Approve and publish</option>
                      <option value="rejected">
                        Reject with changes needed
                      </option>
                      <option value="withdrawn">Remove</option>
                    </select>
                  </label>
                  <label>
                    Note to seller
                    <textarea name="note" maxLength={500} required />
                  </label>
                  <button className="button primary" disabled={busy}>
                    Save listing review
                  </button>
                </form>
              </article>
            ))}
          </section>
          <section id="reports" className="market-admin-section">
            <h2>03 / Reports & intervention</h2>
            {!data.reports.length && <p>No open reports.</p>}
            {data.reports.map((r) => (
              <article className="market-own-card" key={r.id}>
                <h3>{r.reason}</h3>
                <p>{r.details}</p>
                <small>Reporter: {r.user_id}</small>
                <div className="market-actions">
                  <button
                    className="button secondary"
                    disabled={busy}
                    onClick={async () => {
                      setError("");
                      try {
                        const item = await marketRead(
                          r.listing_id ? "listing" : "thread",
                          r.listing_id || r.thread_id,
                        );
                        setInspected(JSON.stringify(item, null, 2));
                      } catch (e) {
                        setError((e as Error).message);
                      }
                    }}
                  >
                    Inspect reported {r.listing_id ? "listing" : "conversation"}
                  </button>
                  <button
                    className="text-button"
                    disabled={busy}
                    onClick={() =>
                      void act("resolve_report", {
                        id: r.id,
                        note: "Reviewed and resolved by store team",
                      })
                    }
                  >
                    Mark resolved
                  </button>
                </div>
              </article>
            ))}
            {inspected && (
              <details open>
                <summary>Reported record · private moderation view</summary>
                <pre className="market-inspection">{inspected}</pre>
                <button
                  className="text-button"
                  onClick={() => setInspected("")}
                >
                  Close record
                </button>
              </details>
            )}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const f = new FormData(e.currentTarget);
                void act("review_listing", {
                  id: f.get("id"),
                  decision: "withdrawn",
                  note: f.get("note"),
                });
              }}
            >
              <h3>Remove a published listing</h3>
              <label>
                Listing ID
                <input name="id" pattern="[0-9a-fA-F-]{36}" required />
              </label>
              <label>
                Reason
                <textarea name="note" required maxLength={500} />
              </label>
              <button className="button secondary" disabled={busy}>
                Remove listing
              </button>
            </form>
          </section>
          <section id="email" className="market-admin-section">
            <h2>04 / Seller email notifications</h2>
            <p>
              {data.mail.configured
                ? "A Brevo API key is stored privately."
                : "Add a Brevo API key to enable marketplace email. Account confirmation SMTP settings are separate."}{" "}
              The key is write-only here and stored in Supabase Vault; it is
              never returned to this page.
            </p>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const form = e.currentTarget;
                const key = new FormData(form).get("key");
                if (
                  await act(
                    "configure_email",
                    { key },
                    "Key saved. Send a connection test and check Brevo logs.",
                  )
                )
                  form.reset();
              }}
            >
              <label>
                Brevo API key
                <input
                  type="password"
                  name="key"
                  autoComplete="new-password"
                  minLength={40}
                  maxLength={300}
                  required
                  placeholder="Paste your API key here"
                />
              </label>
              <button className="button secondary" disabled={busy}>
                Save private key
              </button>
            </form>
            <p>
              Queued / sending: {data.mail.queued} · Provider accepted:{" "}
              {data.mail.accepted} · Failed: {data.mail.failed}
            </p>
            <p>
              Provider acceptance does not confirm inbox delivery. Unknown
              delivery outcomes are not retried automatically, to avoid
              duplicate emails.
            </p>
            <div className="market-actions">
              <button
                className="button primary"
                disabled={
                  busy || !data.mail.configured || !status.member?.email_alerts
                }
                onClick={() =>
                  void act(
                    "test_email",
                    {},
                    "Test queued to your signed-in account. Allow a minute, then check your inbox and Brevo transactional logs.",
                  )
                }
              >
                Send me a connection test
              </button>
              <button
                className="button secondary"
                disabled={busy || !data.mail.failed}
                onClick={() =>
                  void act(
                    "retry_mail",
                    {},
                    "Definite failures queued for retry; unknown delivery outcomes were left unchanged.",
                  )
                }
              >
                Retry definite failures
              </button>
            </div>
            {!status.member?.email_alerts && (
              <p>
                Enable email notifications in{" "}
                <Link href="/marketplace/mine">Your listings</Link> before
                testing.
              </p>
            )}
          </section>
          <section id="audit" className="market-admin-section">
            <h2>05 / Recent moderation trail</h2>
            <ul className="market-notifications">
              {data.audit.map((a, i) => (
                <li key={i}>
                  <strong>{a.action}</strong>
                  <small>
                    {new Date(a.created_at).toLocaleString("en-IN")} ·{" "}
                    {a.target_id}
                  </small>
                  <p>{a.note}</p>
                </li>
              ))}
            </ul>
          </section>
        </>
      )}
    </>
  );
}
