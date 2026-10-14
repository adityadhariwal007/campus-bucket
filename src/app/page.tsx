"use client";
import { kitLabel } from "@/lib/catalog";
import Link from "next/link";
import { useState } from "react";
import { IconArrowUpRight } from "@tabler/icons-react";
import { useStore } from "@/components/store";
import { KitVisual } from "@/components/ui";
import { Photo } from "@/components/photo";
import { FAQ } from "@/components/faq";
import { CampusRibbon } from "@/components/campus-ribbon";
import { Motion } from "@/components/motion";
import { media } from "@/lib/media";
import { categories, money, tiers } from "@/lib/catalog";
import type { Category, Tier } from "@/lib/types";
function FeaturedKit({
  category,
  number,
}: {
  category: Category;
  number: number;
}) {
  const { catalog } = useStore();
  const [tier, setTier] = useState<Tier>("Scholar");
  const kit = catalog.kits.find((k) => k.type === category && k.tier === tier);
  if (!kit) return null;
  return (
    <article className="editorial-kit">
      <div className="row between marginal">
        <span>
          0{number} / {category.toUpperCase()}
        </span>
        <span>{kit.items.reduce((s, i) => s + i.quantity, 0)} essentials</span>
      </div>
      <Link
        href={`/kits/${kit.id}`}
        aria-label={`View ${kit.name} ${kitLabel(tier)}`}
      >
        <KitVisual kit={kit} />
      </Link>
      <div className="row between kit-title">
        <h3>{kit.name}</h3>
        <span className="price">{money(kit.price)}</span>
      </div>
      <div className="tier-tabs" aria-label={`${category} tier`}>
        {tiers.map((t) => (
          <button key={t} aria-pressed={t === tier} onClick={() => setTier(t)}>
            {kitLabel(t)}
          </button>
        ))}
      </div>
      <Link className="text-link" href={`/kits/${kit.id}`}>
        What's inside <IconArrowUpRight size={18} />
      </Link>
    </article>
  );
}
export default function Home() {
  const { catalog } = useStore();
  const [category, setCategory] = useState("All");
  const bundle = catalog.kits.find((k) => k.id === "ultimate-fresher");
  const separate = catalog.kits
    .filter((k) => k.type !== "Bundle" && k.tier === "Fresher")
    .reduce((s, k) => s + k.price, 0);
  return (
    <>
      <Motion refreshKey={category} />
      <section className="editorial-hero container">
        <div className="hero-title">
          <span className="eyebrow">FOR THE LIFE OUTSIDE YOUR SYLLABUS.</span>
          <h1>
            <span className="line-mask">
              <span>Campus life.</span>
            </span>
            <span className="line-mask">
              <em>Sorted.</em>
            </span>
          </h1>
        </div>
        <div className="hero-side">
          <p>
            Room essentials. Study staples. Sports stuff.
            <br />
            Your first semester, with less to carry.
          </p>
          <div className="hero-actions">
            <Link href="/kits" className="button primary">
              Pick your kit <IconArrowUpRight size={20} />
            </Link>
            <Link href="/build-your-own" className="text-link">
              Build your own ↗
            </Link>
          </div>
          <span className="chapter-badge" aria-label="Your next chapter">
            YOUR NEXT
            <br />
            <em>chapter</em>
            <br />↗
          </span>
        </div>
      </section>
      <section className="container market-home-callout">
        <span className="eyebrow">THAPAR MARKET / THE NEXT CHAPTER</span>
        <h2>
          Done with it?
          <br />
          <em>Someone isn’t.</em>
        </h2>
        <p>
          Books, cycles, hostel finds. Pass them on within your campus circle,
          with private chat and an agreed handover.
        </p>
        <Link className="button primary" href="/marketplace">
          Explore Thapar Market ↗
        </Link>
        <Link className="text-link" href="/marketplace/sell">
          Have something to sell? ↗
        </Link>
      </section>
      <CampusRibbon />
      <div
        className="marquee"
        role="img"
        aria-label="Bucket, towel, bottle, duffel, notebook and more"
      >
        <div className="marquee-track" aria-hidden="true">
          {[0, 1, 2, 3].map((i) => (
            <span key={i}>
              Bucket · Towel · Bottle · Duffel · Notebook · New beginnings
              ·{" "}
            </span>
          ))}
        </div>
      </div>
      <section
        className="unpack container section"
        aria-label="Unpack the bucket"
      >
        <div className="unpack-stage">
          <div className="unpack-heading">
            <span className="eyebrow">01 / SMALL THINGS. BIG DIFFERENCE.</span>
            <h2>
              Unpack
              <br />
              your <em>everyday.</em>
            </h2>
            <p>
              The things you forget to pack.
              <br />
              The things you use every day.
            </p>
          </div>
          <div className="unpack-visual">
            <Photo photo={media.cutouts.bucket} className="unpack-bucket" />
            {[
              ["towel", "For the 8 a.m. rush."],
              ["bottle", "Stay for one more lecture."],
              ["notebook", "Start with a blank page."],
            ].map(([key, caption], i) => (
              <div className={`unpack-item unpack-item-${i}`} key={key}>
                <Photo
                  photo={media.cutouts[key as keyof typeof media.cutouts]}
                />
                <span>
                  {key}
                  <small>{caption}</small>
                </span>
              </div>
            ))}
          </div>
          <div className="unpack-end">
            <span>HOSTEL KIT / PLUS</span>
            <strong>
              {money(
                catalog.kits.find((k) => k.id === "hostel-scholar")?.price ||
                  999,
              )}
            </strong>
            <Link className="text-link" href="/kits/hostel-scholar">
              Every item, accounted for ↗
            </Link>
          </div>
        </div>
      </section>
      <section className="kit-section section" id="collection">
        <div className="container">
          <div className="collection-heading">
            <span className="eyebrow">02 / PICK YOUR STARTING POINT</span>
            <h2>
              A kit for every
              <br />
              kind of <em>first.</em>
            </h2>
          </div>
          <div className="tabs category-tabs" aria-label="Kit categories">
            {["All", ...categories].map((c) => (
              <button
                key={c}
                aria-pressed={category === c}
                className={category === c ? "selected" : ""}
                onClick={() => setCategory(c)}
              >
                {c === "All" ? "All kits" : c}
              </button>
            ))}
          </div>
        </div>
        <div
          className="kit-rail-window"
          role="region"
          aria-label="Explore kit categories"
          tabIndex={0}
        >
          <div className="kit-rail">
            {categories
              .filter((c) => category === "All" || category === c)
              .map((c, i) => (
                <FeaturedKit key={c} category={c} number={i + 1} />
              ))}
          </div>
        </div>
        <div className="container collection-bottom">
          <span>Three tiers. Your call.</span>
          <Link className="text-link" href="/kits">
            Compare all kits ↗
          </Link>
        </div>
      </section>
      {bundle && (
        <section className="editorial-bundle dark-section">
          <div className="container bundle-layout">
            <div>
              <span className="eyebrow">THE ULTIMATE ESSENTIAL BUNDLE</span>
              <h2>
                New room.
                <br />
                New routine.
                <br />
                <em>One bucket.</em>
              </h2>
              <p>All three Essential kits. One less list to make.</p>
              <div className="bundle-price">
                <strong>{money(bundle.price)}</strong>
                <s>{money(separate)}</s>
              </div>
              <span className="saving-tag">
                Save ₹
                <span data-count={Math.max(0, separate - bundle.price)}>
                  {Math.max(0, separate - bundle.price)}
                </span>
              </span>
              <Link className="button butter" href="/kits/ultimate-fresher">
                Make it a bundle <IconArrowUpRight size={20} />
              </Link>
            </div>
            <div className="bundle-stack">
              {["Hostel", "Student", "Sports"].map((type, i) => (
                <div className={`bundle-stack-card stack-${i}`} key={type}>
                  <Photo photo={media.kits[type]} />
                  <span>{type} / Essential</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
      <section className="container section editorial-why">
        <div className="why-sticky">
          <span className="eyebrow">03 / LESS PACKING. MORE LIVING.</span>
          <h2>
            You've got
            <br />
            enough <em>firsts.</em>
          </h2>
          <p>The packing part can be simple.</p>
          <Link href="/about" className="text-link">
            Our story ↗
          </Link>
        </div>
        <div className="why-stories">
          {[
            [
              "One list. Done.",
              "No ten-shop marathon. Everyday essentials, packed together.",
            ],
            [
              "Your budget gets a say.",
              "Start with the basics. Add comforts. See every rupee before you choose.",
            ],
            [
              "Meet you on campus.",
              "Pick hostel delivery or campus pickup at checkout.",
            ],
          ].map(([title, body], i) => (
            <article key={title}>
              <span className="marginal">0{i + 1}</span>
              <h3>{title}</h3>
              <p>{body}</p>
              <Photo photo={i === 2 ? media.campus : media.why[i]} />
            </article>
          ))}
        </div>
      </section>
      <section className="builder-invite container">
        <span className="marginal">ALREADY OWN HALF THE LIST?</span>
        <h2>
          Make room for
          <br />
          <em>your version.</em>
        </h2>
        <Link className="button primary" href="/build-your-own">
          Build your own kit <IconArrowUpRight size={20} />
        </Link>
      </section>
      <section className="container section editorial-faq" id="faq">
        <div>
          <h2>
            Good
            <br />
            <em>questions.</em>
          </h2>
          <Link href="/about#contact" className="text-link">
            Ask us something else ↗
          </Link>
        </div>
        <FAQ />
      </section>
    </>
  );
}
