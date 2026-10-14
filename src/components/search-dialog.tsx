"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { IconArrowUpRight, IconX } from "@tabler/icons-react";
import { useStore } from "./store";
import { kitLabel, money } from "@/lib/catalog";
import { searchCatalog } from "@/lib/search";
export function SearchDialog({ close }: { close: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [query, setQuery] = useState("");
  const { catalog, ready, error } = useStore();
  const results = searchCatalog(catalog, query);
  const count = results.kits.length + results.products.length;
  useEffect(() => {
    const element = dialog.current;
    const previous = document.body.style.overflow;
    const focused = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    element?.showModal();
    document.body.style.overflow = "hidden";
    return () => { element?.close(); document.body.style.overflow = previous; focused?.focus(); };
  }, []);
  return <dialog ref={dialog} className="search-dialog" aria-labelledby="search-title" onCancel={close}
    onClick={event => { if (event.target === event.currentTarget) close(); }}>
    <div className="search-inner">
      <div className="row between"><h2 id="search-title">Find your essentials.</h2>
        <button type="button" className="icon-button" aria-label="Close search" onClick={close}><IconX /></button>
      </div>
      <label htmlFor="site-search">Search kits or individual items</label>
      <input id="site-search" type="search" autoFocus autoComplete="off" maxLength={100} placeholder="Try towel, sports or Premium…" value={query} onChange={event => setQuery(event.target.value)} />
      {!query.trim() ? <p className="muted">Find a kit, an upgrade or the one thing you forgot to pack.</p> : !ready ? <p role="status">Loading the catalog…</p> : <>
        <p className="small muted" role="status">{count} {count === 1 ? "result" : "results"} for “{query}”</p>
        {error && <p role="alert">The catalog could not refresh. Try again shortly.</p>}
        {!results.kits.length && !results.products.length && <p>No matches. Try an item name such as bottle or notebook.</p>}
        {!!results.products.length && <section aria-labelledby="search-items"><h3 id="search-items">Individual essentials</h3>
          {results.products.map(product => <Link key={product.id} className="search-result" href={`/build-your-own?q=${encodeURIComponent(product.name)}`} onClick={close}>
            <span><strong>{product.name}</strong><small>{product.category}{product.stock === 0 ? " · Sold out" : ""}</small></span><span>{money(product.price)} <IconArrowUpRight size={16} /></span>
          </Link>)}
        </section>}
        {!!results.kits.length && <section aria-labelledby="search-kits"><h3 id="search-kits">Ready-made kits</h3>
          {results.kits.map(kit => <Link key={kit.id} className="search-result" href={`/kits/${kit.id}`} onClick={close}>
            <span><strong>{kit.name}</strong><small>{kit.type} · {kitLabel(kit.tier)}</small></span><span>{money(kit.price)} <IconArrowUpRight size={16} /></span>
          </Link>)}
        </section>}
      </>}
    </div>
  </dialog>;
}
