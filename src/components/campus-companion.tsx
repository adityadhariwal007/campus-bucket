"use client";
import { useEffect, useRef, useState } from "react";
import { buckReaction, hideCompanionOn } from "@/lib/companion";
export function CampusCompanion({
  path,
  count,
  ready,
  hasError,
}: {
  path: string;
  count: number;
  ready: boolean;
  hasError: boolean;
}) {
  const [mounted, setMounted] = useState(false),
    [open, setOpen] = useState(false),
    [added, setAdded] = useState(false),
    [blocking, setBlocking] = useState(false);
  const previous = useRef<number | null>(null);
  useEffect(() => {
    try {
      // Clear the retired dismissal preference for returning visitors.
      sessionStorage.removeItem("cb-buck-hidden");
    } catch {
      /* Browser storage is optional. */
    }
    setMounted(true);
  }, []);
  useEffect(() => {
    if (!ready) return;
    const increased = previous.current !== null && count > previous.current;
    previous.current = count;
    setAdded(increased);
    if (!increased) return;
    const timer = setTimeout(() => setAdded(false), 2400);
    return () => clearTimeout(timer);
  }, [count, ready]);
  useEffect(() => {
    setOpen(false);
  }, [path]);
  useEffect(() => {
    if (hideCompanionOn(path)) return;
    const narrow = window.matchMedia("(max-width: 767px)");
    if (!("IntersectionObserver" in window)) {
      setBlocking(narrow.matches);
      return;
    }
    let observer: IntersectionObserver | undefined;
    // A native observer reserves the corner for real controls, without a scroll listener.
    const watch = () => {
      observer?.disconnect();
      setBlocking(false);
      if (!narrow.matches) return;
      const hits = new Set<Element>();
      observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (entry.isIntersecting) hits.add(entry.target);
            else hits.delete(entry.target);
          }
          setBlocking(hits.size > 0);
        },
        {
          rootMargin: `-${Math.max(0, window.innerHeight - 100)}px 0px 0px -${Math.max(0, window.innerWidth - 86)}px`,
          threshold: 0,
        },
      );
      document
        .querySelectorAll(
          "main a,main button,main summary,footer a,footer button",
        )
        .forEach((element) => observer?.observe(element));
    };
    watch();
    window.addEventListener("resize", watch);
    const changes = new MutationObserver(watch);
    const main = document.querySelector("main");
    if (main) changes.observe(main, { childList: true, subtree: true });
    return () => {
      observer?.disconnect();
      changes.disconnect();
      window.removeEventListener("resize", watch);
    };
  }, [path, ready]);
  if (!mounted || hideCompanionOn(path)) return null;
  const reaction = buckReaction(path, ready, hasError, added, open);
  return (
    <aside
      hidden={blocking && !open}
      className="campus-companion"
      aria-label="Campus companion"
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          setOpen(false);
          event.stopPropagation();
        }
      }}
    >
      {open && (
        <div className="buck-note" id="buck-note">
          <strong>Hey, I’m Buck.</strong>
          <p role="status">{reaction.message}</p>
        </div>
      )}
      <button
        type="button"
        className={`buck-button buck-${reaction.expression}`}
        aria-label={
          open
            ? "Close Buck’s greeting"
            : "Say hello to Buck, your campus companion"
        }
        aria-expanded={open}
        aria-controls={open ? "buck-note" : undefined}
        onClick={() => setOpen((value) => !value)}
      >
        <span className="buck-art" key={reaction.expression}>
          <img
            src={`/avatar/buck-${reaction.expression}.svg`}
            width={72}
            height={80}
            alt=""
            decoding="async"
          />
          {reaction.expression === "neutral" && (
            <img
              className="buck-blink"
              src="/avatar/buck-blink.svg"
              width={72}
              height={80}
              alt=""
              aria-hidden="true"
              decoding="async"
            />
          )}
        </span>
      </button>
    </aside>
  );
}
