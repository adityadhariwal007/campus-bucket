"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  IconBucket,
  IconShoppingBag,
  IconUser,
  IconMenu2,
  IconX,
  IconArrowUpRight,
} from "@tabler/icons-react";
import { CartDrawer } from "./cart-drawer";
import { useStore } from "./store";
export function Shell({ children }: { children: React.ReactNode }) {
  const { cart, error } = useStore();
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const [bucketOpen, setBucketOpen] = useState(false);
  const count = cart.reduce((s, l) => s + l.quantity, 0);
  const links = [
    ["/kits", "All kits"],
    ["/build-your-own", "Build your own"],
    ["/orders", "Track order"],
    ["/about", "Our story"],
  ];
  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <div className="announcement">
        New campus. New chapter. <strong>Get 10% off with CAMPUS10</strong>
        <span>Made for your firsts ↗</span>
      </div>
      <header className="site-header">
        <div className="nav-wrap">
          <Link className="brand" href="/" aria-label="Campus Bucket home">
            <span className="brand-icon">
              <IconBucket size={27} stroke={2} />
            </span>
            <span>
              campus
              <span className="brand-second">
                bucket<span className="brand-period">.</span>
              </span>
            </span>
          </Link>
          <nav className="desktop-nav" aria-label="Main navigation">
            {links.map(([href, label]) => (
              <Link
                key={href}
                href={href}
                className={path.startsWith(href) ? "active" : ""}
              >
                {label}
              </Link>
            ))}
          </nav>
          <div className="nav-actions">
            <Link
              href="/login"
              className="icon-button account-link"
              aria-label="Your account"
            >
              <IconUser size={22} />
            </Link>
            <Link href="/kits#search" className="text-link search-link">
              Search
            </Link>
            <button
              onClick={() => setBucketOpen(true)}
              className="cart-link"
              aria-haspopup="dialog"
            >
              <IconShoppingBag size={21} />
              <span>My bucket</span>
              <b>{count}</b>
            </button>
            <button
              className="icon-button mobile-toggle"
              aria-label={open ? "Close menu" : "Open menu"}
              aria-expanded={open}
              onClick={() => setOpen(!open)}
            >
              {open ? <IconX /> : <IconMenu2 />}
            </button>
          </div>
        </div>
        {open && (
          <nav className="mobile-nav" aria-label="Mobile navigation">
            {links.map(([href, label]) => (
              <Link key={href} href={href} onClick={() => setOpen(false)}>
                {label}
              </Link>
            ))}
            <Link href="/login" onClick={() => setOpen(false)}>
              My account
            </Link>
          </nav>
        )}
      </header>
      {error && (
        <div className="container">
          <p className="error-box" role="alert">
            {error}
          </p>
        </div>
      )}
      <main id="main">{children}</main>
      <CartDrawer open={bucketOpen} close={() => setBucketOpen(false)} />
      <footer className="footer">
        <div className="container newsletter">
          <div>
            <h2>Here for your next chapter.</h2>
            <p>Questions, ideas, or a campus we should know about?</p>
          </div>
          <a className="text-link" href="mailto:team@campusbucket.live">Say hello to Campus Bucket ↗</a>
        </div>
        <div className="container footer-top">
          <div>
            <Link className="brand" href="/">
              <span className="brand-icon">
                <IconBucket size={26} />
              </span>
              <span>
                campus<span className="brand-second">bucket.</span>
              </span>
            </Link>
            <p>
              A little less packing.
              <br />A lot more living.
            </p>
          </div>
          <div>
            <h4>Get campus ready</h4>
            <Link href="/kits">All kits</Link>
            <Link href="/kits/ultimate-fresher">Ultimate bundle</Link>
            <Link href="/build-your-own">Build your own</Link>
          </div>
          <div>
            <h4>Here to help</h4>
            <Link href="/orders">Track your order</Link>
            <Link href="/about#faq">FAQs</Link>
            <Link href="/about#contact">
              Contact us <IconArrowUpRight size={14} />
            </Link>
            <a href="mailto:team@campusbucket.live">team@campusbucket.live</a>
          </div>
          <div>
            <h4>The small print</h4>
            <Link href="/about#delivery">Delivery & returns</Link>
            <Link href="/about#privacy">Privacy</Link>
            <Link href="/admin">Admin dashboard</Link>
          </div>
        </div>
        <div className="container footer-wordmark" aria-hidden="true">
          campus bucket.
        </div>
        <div className="container footer-bottom">
          <span>
            © {new Date().getFullYear()} Campus Bucket. Made for your next
            chapter.
          </span>

        </div>
      </footer>
    </>
  );
}
