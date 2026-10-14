"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useStore } from "@/components/store";
import { supabase } from "@/lib/supabase";
import {
  marketCategories,
  marketConditions,
  validateMarketListing,
  type MarketListing,
} from "@/lib/marketplace";
import { marketAction, marketRead, signMarketPhotos } from "./api";
import { MarketGate } from "./provider";
async function compressedPhoto(file: File) {
  if (
    !["image/jpeg", "image/png", "image/webp"].includes(file.type) ||
    file.size > 10 * 1024 * 1024
  )
    throw new Error(
      "Use JPG, PNG or WebP photos up to 10 MB each. Export HEIC photos as JPG first.",
    );
  const bitmap = await createImageBitmap(file);
  try {
    if (bitmap.width * bitmap.height > 40000000)
      throw new Error("This photo is too large. Export a smaller copy.");
    const scale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Your browser could not prepare the photo.");
    context.fillStyle = "#fff";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    return await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob(
        (blob) =>
          blob && blob.size <= 4194304
            ? resolve(blob)
            : reject(new Error("Try a smaller item photo.")),
        "image/jpeg",
        0.82,
      ),
    );
  } finally {
    bitmap.close();
  }
}
export function SellPage() {
  return (
    <MarketGate>
      <Sell />
    </MarketGate>
  );
}
function Sell() {
  const params = useSearchParams();
  const edit = params.get("edit");
  const router = useRouter();
  const { account } = useStore();
  const draft = useRef<string | null>(null);
  const [existing, setExisting] = useState<MarketListing | null>(null),
    [loading, setLoading] = useState(!!edit),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [progress, setProgress] = useState(""),
    [files, setFiles] = useState<File[]>([]),
    [keep, setKeep] = useState<string[]>([]),
    [signed, setSigned] = useState<Record<string, string>>({});
  const previews = useMemo(
    () => files.map((file) => URL.createObjectURL(file)),
    [files],
  );
  useEffect(
    () => () => previews.forEach((url) => URL.revokeObjectURL(url)),
    [previews],
  );
  useEffect(() => {
    let active = true;
    if (!edit) {
      setLoading(false);
      return;
    }
    void marketRead<MarketListing>("listing", edit)
      .then(async (listing) => {
        if (listing.seller_id !== account?.id)
          throw new Error("Only the seller can edit this listing.");
        const photos = await signMarketPhotos(listing.photos);
        if (active) {
          setExisting(listing);
          setKeep(listing.photos);
          setSigned(photos);
          draft.current = listing.id;
        }
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
  }, [edit, account?.id]);
  if (loading)
    return (
      <p role="status" className="market-state">
        Opening your listing…
      </p>
    );
  if (edit && !existing)
    return (
      <div className="market-state">
        <p role="alert">{error || "Listing unavailable."}</p>
        <Link href="/marketplace/mine">Back to your listings</Link>
      </div>
    );
  return (
    <>
      <header className="market-page-heading">
        <span className="eyebrow">PASS IT ON, THAPAR</span>
        <h1>
          {edit ? "A little update." : "Give it a"}
          <br />
          <em>{edit ? "A fresh look." : "second chapter."}</em>
        </h1>
        <p>Actual photos. Honest condition. One item, one listing.</p>
        <p className="small">
          Pilot: no fee collected. ₹10 posting will be considered later.
          Listings are reviewed before appearing.
        </p>
      </header>
      <form
        key={edit || "new"}
        className="market-sell-form"
        onSubmit={async (event) => {
          event.preventDefault();
          if (busy) return;
          setBusy(true);
          setError("");
          const form = new FormData(event.currentTarget);
          const uploaded: string[] = [];
          try {
            const data = {
              title: String(form.get("title")),
              description: String(form.get("description")),
              category: String(form.get("category")),
              condition: String(form.get("condition")),
              price: Number(form.get("price")),
              defects: String(form.get("defects")),
              course: String(form.get("course") || ""),
              photos: [...keep, ...files],
            };
            validateMarketListing(data);
            if (!supabase || !account) throw new Error("Please sign in again.");
            if (!draft.current) draft.current = crypto.randomUUID();
            setProgress("Saving your draft…");
            const result = await marketAction("draft", { id: draft.current });
            for (let index = 0; index < files.length; index++) {
              setProgress(`Preparing photo ${index + 1} of ${files.length}…`);
              const blob = await compressedPhoto(files[index]);
              const path = `${account.id}/${result.id}/${crypto.randomUUID()}.jpg`;
              const upload = await supabase.storage
                .from("marketplace")
                .upload(path, blob, {
                  contentType: "image/jpeg",
                  upsert: false,
                  cacheControl: "600",
                });
              if (upload.error) throw new Error(upload.error.message);
              uploaded.push(path);
            }
            setProgress("Submitting for review…");
            await marketAction("submit", {
              ...data,
              id: result.id,
              photos: [...keep, ...uploaded],
              available_until: String(form.get("available_until") || ""),
            });
            const removed =
              existing?.photos.filter((path) => !keep.includes(path)) || [];
            if (removed.length)
              await supabase.storage.from("marketplace").remove(removed);
            router.push("/marketplace/mine?submitted=1");
          } catch (e) {
            setError((e as Error).message);
            if (uploaded.length && supabase)
              await supabase.storage.from("marketplace").remove(uploaded);
          } finally {
            setBusy(false);
            setProgress("");
          }
        }}
      >
        <section>
          <h2>The essentials.</h2>
          <label>
            What are you selling?
            <input
              name="title"
              minLength={5}
              maxLength={100}
              required
              defaultValue={existing?.title}
              placeholder="e.g. Casio scientific calculator with case"
            />
          </label>
          <div className="market-form-grid">
            <label>
              Category
              <select
                name="category"
                defaultValue={existing?.category || marketCategories[0]}
              >
                {marketCategories.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </label>
            <label>
              Condition
              <select
                name="condition"
                defaultValue={existing?.condition || "Good"}
              >
                {marketConditions.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </label>
            <label>
              Asking price ₹
              <input
                name="price"
                type="number"
                min={0}
                max={200000}
                step={1}
                required
                defaultValue={existing?.price}
                placeholder="0 for a giveaway"
              />
            </label>
          </div>
          <label>
            Describe the actual item
            <textarea
              name="description"
              minLength={20}
              maxLength={2000}
              rows={5}
              required
              defaultValue={existing?.description}
              placeholder="Age, what's included, why you're passing it on, and anything the buyer should inspect."
            />
          </label>
          <label>
            Defects or missing parts
            <textarea
              name="defects"
              minLength={2}
              maxLength={500}
              rows={2}
              required
              defaultValue={existing?.defects}
              placeholder="Be specific, or write ‘None known’."
            />
          </label>
          <div className="market-form-grid">
            <label>
              Course / semester tag (optional)
              <input
                name="course"
                maxLength={80}
                defaultValue={existing?.course}
                placeholder="e.g. Semester 2 · UTA018"
              />
            </label>
            <label>
              Available until (optional)
              <input
                name="available_until"
                type="date"
                defaultValue={existing?.available_until || ""}
              />
            </label>
          </div>
        </section>
        <section>
          <h2>Let the item speak.</h2>
          <p>
            Add 1–4 real photos. Show the whole item and any defects. Photos are
            resized and location metadata is stripped before upload.
          </p>
          <div className="market-upload-previews">
            {keep.map((path) => (
              <div key={path}>
                <img
                  src={signed[path]}
                  alt="Existing item photo"
                  width={240}
                  height={240}
                />
                <button
                  type="button"
                  onClick={() =>
                    setKeep((old) => old.filter((x) => x !== path))
                  }
                >
                  Remove photo
                </button>
              </div>
            ))}
            {previews.map((url, i) => (
              <div key={url}>
                <img
                  src={url}
                  alt={`Selected item photo ${i + 1}`}
                  width={240}
                  height={240}
                />
                <button
                  type="button"
                  onClick={() =>
                    setFiles((old) => old.filter((_, index) => index !== i))
                  }
                >
                  Remove photo
                </button>
              </div>
            ))}
          </div>
          <label>
            Choose photos
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              onChange={(e) => {
                const selected = Array.from(e.target.files || []);
                if (selected.length + keep.length > 4) {
                  setError("Choose up to four photos in total.");
                  return;
                }
                setFiles(selected);
                setError("");
              }}
            />
          </label>
          <small>
            JPG, PNG or WebP · up to 10 MB each. For HEIC, export a JPG from
            your phone.
          </small>
        </section>
        <label className="market-check">
          <input type="checkbox" required />I own this item, have disclosed its
          condition, and it complies with the{" "}
          <Link href="/marketplace/guide">marketplace rules</Link>. I have kept
          phone numbers and room details out of the listing.
        </label>
        {edit && (
          <p className="market-notice">
            Editing listing details sends it back for review. For a price-only
            change, use Your listings to keep it live.
          </p>
        )}
        {error && (
          <p className="error-box" role="alert">
            {error}
          </p>
        )}
        <button className="button primary" disabled={busy}>
          {busy ? progress : "Submit for review ↗"}
        </button>
        <Link className="text-link" href="/marketplace/mine">
          Your listings ↗
        </Link>
      </form>
    </>
  );
}
