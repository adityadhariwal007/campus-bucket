"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { IconArrowUp, IconX } from "@tabler/icons-react";
import { money } from "@/lib/catalog";
import type { BuckMessage, BuckReply } from "@/lib/buck-chat";
import type { BuckExpression } from "@/lib/companion";
export function BuckChat({
  path,
  onClose,
  onExpression,
}: {
  path: string;
  onClose: () => void;
  onExpression: (expression: BuckExpression) => void;
}) {
  const [messages, setMessages] = useState<
    (BuckMessage & { picks?: BuckReply["picks"] })[]
  >([]);
  const [draft, setDraft] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const pending = useRef<AbortController | null>(null),
    thread = useRef<HTMLDivElement>(null);
  useEffect(
    () => () => {
      pending.current?.abort();
      pending.current = null;
    },
    [],
  );
  useEffect(() => {
    if (thread.current) thread.current.scrollTop = thread.current.scrollHeight;
  }, [messages, busy, error]);
  async function send(event: React.FormEvent) {
    event.preventDefault();
    if (busy || !draft.trim()) return;
    const question = draft.trim();
    const history: BuckMessage[] = [
      ...messages.slice(-8).map(({ role, content }) => ({ role, content })),
      { role: "user", content: question },
    ];
    setBusy(true);
    setError("");
    onExpression("thoughtful");
    const controller = new AbortController();
    pending.current = controller;
    const timer = setTimeout(() => controller.abort(), 35000);
    try {
      const response = await fetch("/api/buck", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history, path }),
        signal: controller.signal,
      });
      const data = await response.json().catch(() => null);
      if (!response.ok || !data?.message || !Array.isArray(data.picks))
        throw new Error(
          data?.error || "Buck couldn’t connect. Please try again shortly.",
        );
      setMessages((previous) => [
        ...previous,
        { role: "user", content: question },
        { role: "assistant", content: data.message, picks: data.picks },
      ]);
      setDraft("");
      onExpression(data.expression);
    } catch (e) {
      if (!controller.signal.aborted || pending.current === controller) {
        setError(
          controller.signal.aborted
            ? "That took too long. Your message is still here; try again."
            : (e as Error).message,
        );
        onExpression("gentle");
      }
    } finally {
      clearTimeout(timer);
      if (pending.current === controller) {
        pending.current = null;
        setBusy(false);
      }
    }
  }
  return (
    <section className="buck-chat" id="buck-note" aria-label="Chat with Buck">
      <header className="buck-chat-heading">
        <div>
          <strong>Hey, I’m Buck.</strong>
          <span>Your campus shopping buddy</span>
        </div>
        <button type="button" onClick={onClose} aria-label="Close Buck’s chat">
          <IconX size={20} />
        </button>
      </header>
      <div
        className="buck-thread"
        ref={thread}
        role="log"
        aria-live="polite"
        aria-relevant="additions"
      >
        <p className="buck-message">
          Hostel move, study setup, or something for the gym? Tell me what you
          need. I’ll help you find your fit.
        </p>
        {messages.map((message, index) => (
          <div
            key={index}
            className={`buck-message buck-message-${message.role}`}
          >
            <span className="sr-only">
              {message.role === "user" ? "You: " : "Buck: "}
            </span>
            <p>{message.content}</p>
            {message.picks?.map((pick) => (
              <Link
                className="buck-pick"
                key={pick.id}
                href={pick.href}
                onClick={onClose}
              >
                <strong>
                  {pick.name} <span>{money(pick.price)} ↗</span>
                </strong>
                <span>{pick.contents}</span>
                {pick.sizes && <span>Sizes: {pick.sizes}</span>}
              </Link>
            ))}
          </div>
        ))}
        {busy && (
          <p className="buck-thinking" role="status">
            Buck’s checking the shelves…
          </p>
        )}
        {error && (
          <p className="buck-chat-error" role="alert">
            {error}
          </p>
        )}
      </div>
      <form className="buck-compose" onSubmit={send}>
        <label className="sr-only" htmlFor="buck-question">
          Message Buck
        </label>
        <input
          id="buck-question"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          maxLength={600}
          placeholder="Tell me what you need…"
          autoComplete="off"
          disabled={busy}
          required
        />
        <button
          type="submit"
          disabled={busy || !draft.trim()}
          aria-label="Send message to Buck"
        >
          <IconArrowUp size={21} />
        </button>
      </form>
      <p className="buck-disclosure">
        AI suggestions can be wrong. Check product details. Chat is sent to
        Google; don’t share personal details.{" "}
        <Link href="/privacy">Privacy</Link>
      </p>
      <nav className="buck-chat-links" aria-label="Shopping help">
        <Link href="/cart" onClick={onClose}>
          My bucket
        </Link>
        <Link href="/orders" onClick={onClose}>
          Track order
        </Link>
        <Link href="/terms#delivery" onClick={onClose}>
          Delivery & returns
        </Link>
        <a href="mailto:team@campusbucket.live">Contact team</a>
      </nav>
    </section>
  );
}
