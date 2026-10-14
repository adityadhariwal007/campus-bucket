"use client";
export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="empty">
      <h1>Something didn't load.</h1>
      <p>
        Your saved bucket is still in this browser. Try loading the page again.
      </p>
      <button className="button primary" onClick={reset}>
        Try again
      </button>
    </div>
  );
}
