"use client";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useStore } from "@/components/store";
import { marketAction, marketRead } from "./api";
import { MarketGate } from "./provider";
import { ReportForm } from "./detail";
import {
  campusMeetingTime,
  displayMeetingTime,
  meetingPlaces,
  type MarketThread,
  type MarketMessage,
  type MarketMeetup,
  type MarketContact,
} from "@/lib/marketplace";
type Conversation = {
  thread: MarketThread;
  messages: MarketMessage[];
  meetups: MarketMeetup[];
  contacts: MarketContact[];
};
export function InboxPage() {
  return (
    <MarketGate>
      <Inbox />
    </MarketGate>
  );
}
function Inbox() {
  const params = useSearchParams();
  const selected = params.get("thread");
  const { account } = useStore();
  const [threads, setThreads] = useState<MarketThread[]>([]),
    [conversation, setConversation] = useState<Conversation | null>(null),
    [messages, setMessages] = useState<MarketMessage[]>([]),
    [loading, setLoading] = useState(true),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [pollError, setPollError] = useState(""),
    [notice, setNotice] = useState(""),
    [body, setBody] = useState(""),
    [report, setReport] = useState(false),
    [hasOlder, setHasOlder] = useState(true),
    [moreChats, setMoreChats] = useState(true);
  const messageId = useRef<string | null>(null),
    scroller = useRef<HTMLDivElement>(null),
    pinned = useRef(true),
    generation = useRef(0),
    readSequence = useRef(0);
  const current =
    conversation?.thread || threads.find((t) => t.id === selected);
  const refresh = useCallback(async () => {
    const version = generation.current;
    const request = ++readSequence.current;
    try {
      const [list, data] = await Promise.all([
        marketRead<MarketThread[]>("inbox"),
        selected
          ? marketRead<Conversation>("thread", selected)
          : Promise.resolve(null),
      ]);
      if (version !== generation.current || request !== readSequence.current) return;
      setThreads((old) =>
        [...new Map([...old, ...list].map((t) => [t.id, t])).values()].sort(
          (a, b) => b.updated_at.localeCompare(a.updated_at),
        ),
      );
      setConversation(data);
      if (data)
        setMessages((old) => {
          const map = new Map(old.map((m) => [m.id, m]));
          data.messages.forEach((m) => map.set(m.id, m));
          return [...map.values()].sort(
            (a, b) =>
              a.created_at.localeCompare(b.created_at) ||
              a.id.localeCompare(b.id),
          );
        });
      setPollError("");
    } catch (e) {
      if (version === generation.current && request === readSequence.current) setPollError((e as Error).message);
    } finally {
      if (version === generation.current && request === readSequence.current) setLoading(false);
    }
  }, [selected]);
  useEffect(() => {
    generation.current++;
    setMessages([]);
    setConversation(null);
    setBody("");
    messageId.current = null;
    setError("");
    setNotice("");
    setReport(false);
    setLoading(true);
    setHasOlder(true);
    pinned.current = true;
    void refresh();
    const poll = () => {
      if (!document.hidden) void refresh();
    };
    const timer = setInterval(poll, 6000);
    document.addEventListener("visibilitychange", poll);
    return () => {
      generation.current++;
      clearInterval(timer);
      document.removeEventListener("visibilitychange", poll);
    };
  }, [refresh]);
  useEffect(() => {
    if (pinned.current && scroller.current)
      scroller.current.scrollTop = scroller.current.scrollHeight;
  }, [messages.length, selected]);
  async function run(
    action: string,
    data: Record<string, unknown> = {},
    success = "Updated.",
  ) {
    if (busy || !selected) return;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await marketAction(action, { ...data, thread_id: selected });
      setNotice(success);
      await refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <header className="market-page-heading">
        <span className="eyebrow">THE CAMPUS CONVERSATION</span>
        <h1>
          Make the
          <br />
          <em>handover happen.</em>
        </h1>
        <p>
          Messages update automatically while this page is open. Contact details
          stay out of public listings.
        </p>
      </header>
      {pollError && (
        <div className="error-box" role="alert">
          {pollError}
          <button className="text-button" onClick={() => void refresh()}>
            Refresh conversations
          </button>
        </div>
      )}
      {loading ? (
        <p className="market-state" role="status">
          Opening your inbox…
        </p>
      ) : (
        <div className={`market-inbox ${selected ? "has-conversation" : ""}`}>
          <aside className="market-thread-list">
            <h2>Your chats</h2>
            {threads.length ? (
              threads.map((thread) => (
                <Link
                  key={thread.id}
                  className={selected === thread.id ? "selected" : ""}
                  href={`/marketplace/inbox?thread=${thread.id}`}
                >
                  <strong>{thread.title}</strong>
                  <span>{thread.other_name}</span>
                  <small>{thread.last_message.slice(0, 80)}</small>
                </Link>
              ))
            ) : (
              <div className="market-state">
                <p>No conversations yet. Start with a real campus find.</p>
                <Link href="/marketplace">Explore the market ↗</Link>
              </div>
            )}
            {threads.length >= 50 && moreChats && threads.length < 5000 && (
              <button
                className="text-button"
                disabled={busy}
                onClick={async () => {
                  setBusy(true);
                  try {
                    const next = await marketRead<MarketThread[]>(
                      "inbox",
                      null,
                      { offset: threads.length },
                    );
                    setThreads((old) => [
                      ...new Map(
                        [...old, ...next].map((t) => [t.id, t]),
                      ).values(),
                    ]);
                    setMoreChats(next.length === 50);
                  } catch (e) {
                    setError((e as Error).message);
                  } finally {
                    setBusy(false);
                  }
                }}
              >
                Load more conversations
              </button>
            )}
          </aside>
          <section className="market-conversation">
            {!selected ? (
              <div className="market-state">
                <h2>A hello starts here.</h2>
                <p>
                  Select a conversation. A seller receives a new-interest
                  notification when you first open a chat.
                </p>
              </div>
            ) : !current ? (
              <div className="market-state">
                <p>This conversation isn’t available to your account.</p>
                <Link href="/marketplace/inbox">Back to inbox</Link>
              </div>
            ) : (
              <>
                <header className="market-chat-header">
                  <Link className="market-chat-back" href="/marketplace/inbox">
                    ← Chats
                  </Link>
                  <div>
                    <h2>{current.other_name}</h2>
                    <Link href={`/marketplace/${current.listing_id}`}>
                      {current.title} ↗
                    </Link>
                  </div>
                  <button
                    className="text-button"
                    disabled={busy}
                    onClick={() =>
                      void run(
                        "block",
                        { enabled: !current.blocked_by_me },
                        current.blocked_by_me
                          ? "Member unblocked."
                          : "Member blocked. New contact is stopped.",
                      )
                    }
                  >
                    {current.blocked_by_me ? "Unblock" : "Block"}
                  </button>
                  <button
                    className="text-button"
                    onClick={() => setReport((v) => !v)}
                  >
                    Report
                  </button>
                </header>
                {report && (
                  <ReportForm
                    threadId={current.id}
                    done={() => {
                      setReport(false);
                      setNotice("Report sent to the moderation team.");
                    }}
                  />
                )}
                <div
                  ref={scroller}
                  className="market-messages"
                  role="log"
                  aria-label="Private messages"
                  aria-live="polite"
                  onScroll={() => {
                    const el = scroller.current;
                    if (el)
                      pinned.current =
                        el.scrollHeight - el.scrollTop - el.clientHeight < 90;
                  }}
                >
                  {messages.length >= 50 && hasOlder && (
                    <button
                      className="text-button"
                      disabled={busy}
                      onClick={async () => {
                        setBusy(true);
                        try {
                          const older = await marketRead<MarketMessage[]>(
                            "messages",
                            selected,
                            {
                              before: messages[0].created_at,
                              before_id: messages[0].id,
                            },
                          );
                          pinned.current = false;
                          setMessages((old) =>
                            [
                              ...new Map(
                                [...older, ...old].map((m) => [m.id, m]),
                              ).values(),
                            ].sort(
                              (a, b) =>
                                a.created_at.localeCompare(b.created_at) ||
                                a.id.localeCompare(b.id),
                            ),
                          );
                          setHasOlder(older.length === 50);
                        } catch (e) {
                          setError((e as Error).message);
                        } finally {
                          setBusy(false);
                        }
                      }}
                    >
                      Load earlier messages
                    </button>
                  )}
                  {!messages.length && (
                    <p className="market-chat-hint">
                      Ask about the condition, agree on a price and suggest a
                      public campus spot. Never share a UPI PIN or pay an
                      advance to secure an item.
                    </p>
                  )}
                  {messages.map((message) => (
                    <article
                      key={message.id}
                      className={`market-bubble ${message.author_id === account?.id ? "mine" : ""}`}
                    >
                      <p>{message.body}</p>
                      <time dateTime={message.created_at}>
                        {new Date(message.created_at).toLocaleTimeString(
                          "en-IN",
                          { hour: "2-digit", minute: "2-digit" },
                        )}
                      </time>
                    </article>
                  ))}
                </div>
                {current.blocked ? (
                  <p className="market-notice">
                    New messages and meetup activity are stopped for this
                    conversation.
                  </p>
                ) : (
                  <form
                    className="market-compose"
                    onSubmit={async (e) => {
                      e.preventDefault();
                      if (!body.trim() || busy) return;
                      setBusy(true);
                      setError("");
                      try {
                        if (!messageId.current)
                          messageId.current = crypto.randomUUID();
                        await marketAction("message", {
                          thread_id: selected,
                          body,
                          request_id: messageId.current,
                        });
                        setBody("");
                        messageId.current = null;
                        pinned.current = true;
                        await refresh();
                      } catch (err) {
                        setError((err as Error).message);
                      } finally {
                        setBusy(false);
                      }
                    }}
                  >
                    <label className="sr-only" htmlFor="market-message">
                      Your message
                    </label>
                    <textarea
                      id="market-message"
                      disabled={busy}
                      value={body}
                      maxLength={2000}
                      rows={2}
                      onChange={(e) => { messageId.current = null; setBody(e.target.value); }}
                      placeholder="Say hello. Ask about the item."
                      required
                    />
                    <button
                      className="button primary"
                      disabled={busy || !body.trim()}
                    >
                      {busy ? "Sending…" : "Send ↗"}
                    </button>
                  </form>
                )}
                {error && (
                  <p className="error-box" role="alert">
                    {error}
                  </p>
                )}
                {notice && (
                  <p role="status" className="market-notice">
                    {notice}
                  </p>
                )}
                <details className="market-meetup-panel" open>
                  <summary>A place to meet.</summary>
                  {conversation?.meetups
                    .filter((m) => m.status !== "cancelled")
                    .map((meetup) => (
                      <div className="market-meetup-card" key={meetup.id}>
                        <strong>{meetup.place}</strong>
                        <p>{displayMeetingTime(meetup.meet_at)}</p>
                        <span>
                          {meetup.status === "accepted"
                            ? "Agreed by both participants"
                            : "Waiting for the other participant"}
                        </span>
                        <div className="row">
                          {meetup.status === "proposed" &&
                            meetup.proposed_by !== account?.id && (
                              <button
                                className="button secondary"
                                disabled={busy || current.blocked}
                                onClick={() =>
                                  void run(
                                    "accept_meetup",
                                    { id: meetup.id },
                                    "Meetup accepted.",
                                  )
                                }
                              >
                                Accept meetup
                              </button>
                            )}
                          <button
                            className="text-button"
                            disabled={busy}
                            onClick={() =>
                              void run(
                                "cancel_meetup",
                                { id: meetup.id },
                                "Meetup cancelled. Shared numbers removed.",
                              )
                            }
                          >
                            Cancel meetup
                          </button>
                        </div>
                      </div>
                    ))}
                  {!conversation?.meetups.some(
                    (m) => m.status !== "cancelled",
                  ) &&
                    !current.blocked && (
                      <form
                        className="market-form-grid"
                        onSubmit={async (e) => {
                          e.preventDefault();
                          const form = new FormData(e.currentTarget);
                          try {
                            await run(
                              "propose_meetup",
                              {
                                place: form.get("place"),
                                meet_at: campusMeetingTime(
                                  String(form.get("meet_at")),
                                ),
                              },
                              "Meetup proposed. The other participant needs to accept.",
                            );
                          } catch (err) {
                            setError((err as Error).message);
                          }
                        }}
                      >
                        <label>
                          Public meeting point
                          <input
                            name="place"
                            list="market-meeting-places"
                            minLength={3}
                            maxLength={100}
                            required
                            placeholder="A public spot you both know"
                          />
                          <datalist id="market-meeting-places">
                            {meetingPlaces.map((place) => (
                              <option key={place} value={place} />
                            ))}
                          </datalist>
                        </label>
                        <label>
                          Date and time · IST
                          <input
                            name="meet_at"
                            type="datetime-local"
                            required
                          />
                        </label>
                        <button className="button secondary" disabled={busy}>
                          Propose meetup
                        </button>
                      </form>
                    )}
                  <p className="small muted">
                    Choose a busy, public place in daylight and bring a friend
                    if possible. Suggested locations are not officially
                    designated exchange points. Do not put hostel-room details
                    here.
                  </p>
                </details>
                {conversation?.meetups.some((m) => m.status === "accepted") &&
                  !current.blocked && (
                    <details className="market-meetup-panel">
                      <summary>Optional phone sharing.</summary>
                      <p>
                        Your number goes only to the other participant in this
                        chat. You can keep using chat instead.
                      </p>
                      {conversation.contacts.map((contact) => (
                        <p key={contact.user_id}>
                          <strong>
                            {contact.user_id === account?.id
                              ? "You shared"
                              : "The other participant shared"}
                            :
                          </strong>{" "}
                          <a href={`tel:+91${contact.phone}`}>
                            {contact.phone}
                          </a>
                          {contact.user_id === account?.id && (
                            <button
                              className="text-button"
                              disabled={busy}
                              onClick={() =>
                                void run(
                                  "contact",
                                  { consent: false },
                                  "Your shared number was removed.",
                                )
                              }
                            >
                              Remove my number
                            </button>
                          )}
                        </p>
                      ))}
                      <form
                        onSubmit={async (e) => {
                          e.preventDefault();
                          const form = new FormData(e.currentTarget);
                          await run(
                            "contact",
                            {
                              phone: form.get("phone"),
                              consent: form.get("consent") === "on",
                            },
                            "Your number is shared with this participant.",
                          );
                        }}
                      >
                        <label>
                          Your mobile number
                          <input
                            name="phone"
                            type="tel"
                            pattern="[6-9][0-9]{9}"
                            maxLength={10}
                            inputMode="numeric"
                            required
                          />
                        </label>
                        <label className="market-check">
                          <input name="consent" type="checkbox" required />I
                          choose to share this number with the other
                          participant.
                        </label>
                        <button className="button secondary" disabled={busy}>
                          Share my number
                        </button>
                      </form>
                    </details>
                  )}
                <div className="market-handover">
                  <h3>Close the loop.</h3>
                  {current.seller_confirmed && current.buyer_confirmed ? (
                    <p>Handover confirmed by both participants.</p>
                  ) : current.seller_id === account?.id ? (
                    <div className="row">
                      <button
                        className="button secondary"
                        disabled={
                          busy || current.seller_confirmed || current.blocked
                        }
                        onClick={() =>
                          void run("reserve", {}, "Item reserved.")
                        }
                      >
                        Reserve item
                      </button>
                      <button
                        className="text-button"
                        disabled={
                          busy || current.seller_confirmed || current.blocked
                        }
                        onClick={() =>
                          void run("release", {}, "Item available again.")
                        }
                      >
                        Make available
                      </button>
                      <button
                        className="button primary"
                        disabled={
                          busy || current.seller_confirmed || current.blocked
                        }
                        onClick={() => {
                          if (
                            window.confirm(
                              "Confirm you have handed this item to this buyer? The listing will be marked sold.",
                            )
                          )
                            void run(
                              "handover",
                              {},
                              "Marked handed over. The buyer can now confirm.",
                            );
                        }}
                      >
                        {current.seller_confirmed
                          ? "Waiting for buyer confirmation"
                          : "Confirm handed over"}
                      </button>
                    </div>
                  ) : (
                    <button
                      className="button secondary"
                      disabled={
                        busy ||
                        !current.seller_confirmed ||
                        current.buyer_confirmed ||
                        current.blocked
                      }
                      onClick={() => {
                        if (
                          window.confirm(
                            "Confirm that you received this item from this seller?",
                          )
                        )
                          void run(
                            "handover",
                            {},
                            "Handover confirmed by both participants.",
                          );
                      }}
                    >
                      {current.seller_confirmed
                        ? "Confirm item received"
                        : "Seller confirms handover first"}
                    </button>
                  )}
                  <p className="small muted">
                    A handover counts only after both sides confirm. This is a
                    receipt, not payment protection.
                  </p>
                </div>
              </>
            )}
          </section>
        </div>
      )}
    </>
  );
}
