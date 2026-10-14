"use client";
import Link from "next/link";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { useStore } from "@/components/store";
import { marketRead, marketAction } from "./api";
import type { MarketStatus } from "@/lib/marketplace";
const Context = createContext<{
  status: MarketStatus | null;
  loading: boolean;
  error: string;
  refresh: () => Promise<void>;
}>({ status: null, loading: true, error: "", refresh: async () => {} });
export function MarketProvider({ children }: { children: ReactNode }) {
  const { account, ready } = useStore();
  const [status, setStatus] = useState<MarketStatus | null>(null),
    [loading, setLoading] = useState(true),
    [error, setError] = useState("");
  const refresh = useCallback(async () => {
    if (!account) {
      setStatus(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    try {
      setStatus(await marketRead<MarketStatus>("status"));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [account?.id]);
  useEffect(() => {
    let active = true;
    setStatus(null);
    setError("");
    if (!ready) return;
    if (!account) {
      setLoading(false);
      return;
    }
    setLoading(true);
    void marketRead<MarketStatus>("status")
      .then((value) => {
        if (active) setStatus(value);
      })
      .catch((e) => {
        if (active) setError(e.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [ready, account?.id]);
  return (
    <Context.Provider value={{ status, loading, error, refresh }}>
      {children}
    </Context.Provider>
  );
}
export function useMarket() {
  return useContext(Context);
}
export function MarketNav() {
  const { account } = useStore();
  return (
    <nav className="market-nav" aria-label="Thapar marketplace">
      <Link href="/marketplace">Discover</Link>
      <Link href="/marketplace/sell">Sell an item</Link>
      <Link href="/marketplace/inbox">Inbox</Link>
      <Link href="/marketplace/mine">Your listings</Link>
      <Link href="/marketplace/guide">How it works</Link>
      {account?.admin && <Link href="/admin/marketplace">Moderation</Link>}
    </nav>
  );
}
export function MarketGate({ children }: { children: ReactNode }) {
  const { account, ready } = useStore();
  const { status, loading, error, refresh } = useMarket();
  if (!ready || loading)
    return (
      <p className="market-state" role="status">
        Opening Thapar Market…
      </p>
    );
  if (!account)
    return (
      <div className="market-state">
        <h2>A campus-sized circle.</h2>
        <p>
          Sign in to join Thapar Market. Listings, photos and conversations are
          visible only to verified members.
        </p>
        <Link className="button primary" href="/login?next=marketplace">
          Sign in to continue ↗
        </Link>
      </div>
    );
  if (error)
    return (
      <div className="market-state">
        <p role="alert">{error}</p>
        <button className="button secondary" onClick={() => void refresh()}>
          Try again
        </button>
      </div>
    );
  if (!status?.member) return <JoinMarket />;
  if (!status.verified)
    return (
      <div className="market-state">
        <h2>
          {status.member.verification === "pending"
            ? "Your review is in the queue."
            : "Your marketplace access needs a review."}
        </h2>
        <p>
          {status.member.verification === "pending"
            ? "The team will check your student details before opening listings and chat. Your details are not shown to other students."
            : status.member.review_note ||
              "Contact team@campusbucket.live for help."}
        </p>
        <button className="button secondary" onClick={() => void refresh()}>
          Check verification
        </button>
        <a className="text-link" href="mailto:team@campusbucket.live">
          Contact the team ↗
        </a>
      </div>
    );
  return children;
}
function JoinMarket() {
  const { status, refresh } = useMarket();
  const { account } = useStore();
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  return (
    <form
      className="market-join"
      onSubmit={async (event) => {
        event.preventDefault();
        setBusy(true);
        setError("");
        const form = new FormData(event.currentTarget);
        try {
          await marketAction("join", {
            ...Object.fromEntries(form.entries()),
            email_alerts: form.get("email_alerts") === "true",
          });
          await refresh();
        } catch (e) {
          setError((e as Error).message);
        } finally {
          setBusy(false);
        }
      }}
    >
      <span className="eyebrow">THAPAR, LET’S KEEP IT IN THE CIRCLE</span>
      <h2>Make yourself known.</h2>
      <p>
        {status?.email_eligible
          ? "Your confirmed Thapar email can open access immediately."
          : status?.admin
            ? "Create a marketplace profile to manage the campus community."
            : "Use your existing account and request a manual student review. We do not collect student-ID photos."}
      </p>
      <label>
        Display name
        <input
          name="display_name"
          autoComplete="nickname"
          minLength={2}
          maxLength={40}
          defaultValue={account?.name || ""}
          required
        />
      </label>
      {!status?.email_eligible && !status?.admin && (
        <div className="market-form-grid">
          <label>
            Programme
            <input
              name="programme"
              maxLength={80}
              placeholder="e.g. BE Computer Engineering"
              required
            />
          </label>
          <label>
            Batch / graduation year
            <input
              name="batch"
              maxLength={20}
              placeholder="e.g. 2026–2030"
              required
            />
          </label>
          <label>
            Roll number
            <input name="roll_number" maxLength={40} minLength={4} required />
          </label>
        </div>
      )}
      <label className="market-check">
        <input
          type="checkbox"
          name="email_alerts"
          value="true"
          defaultChecked
        />
        Email me about buyer interest, meetup and handover updates, saved-item price drops and occasional
        unsold-item reminders.
      </label>

      <label className="market-check">
        <input type="checkbox" required />
        I’m part of the Thapar community and agree to the{" "}
        <Link href="/marketplace/guide">marketplace rules</Link> and{" "}
        <Link href="/privacy">privacy policy</Link>.
      </label>
      {error && (
        <p className="error-box" role="alert">
          {error}
        </p>
      )}
      <button className="button primary" disabled={busy}>
        {busy
          ? "Checking…"
          : status?.email_eligible
            ? "Join Thapar Market"
            : "Submit student details"}{" "}
        ↗
      </button>
    </form>
  );
}
