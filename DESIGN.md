# Campus Bucket editorial design

The layout uses the requested bone, ink, warm charcoal, muted stone and paper palette; Bricolage Grotesque, Instrument Serif and Instrument Sans are downloaded from Google Fonts at build time and served locally by Next.js.

All media slots live in `src/lib/media.ts`: source, accessible description, dimensions and focal point. Product photos and transparent cutouts remain empty, labeled frames for the owner to replace.  The homepage hero is text-only; its hostel photo, caption, preload and animation were removed at the owner’s request. The campus photograph uses the owner-provided campus.png, served from public/campus.png on the home and Our Story pages. Old generated imagery is archived outside public and no longer rendered.

GSAP 3.15.0, ScrollTrigger 3.15.0 and Lenis 1.3.26 use pinned jsDelivr URLs and SHA-384 integrity hashes in `src/lib/motion-scripts.json`. Motion is scoped to the homepage and cleans up on navigation. Reduced-motion users get static content; the desktop horizontal rail collapses to a vertical list on mobile. The native dialog handles cart focus, Escape and the mobile bottom-sheet presentation.

Prices and composition still come from Supabase. Tier controls update price/count; the builder has three category steps and a review step. Cart totals, coupons and sizing use the shared validated commerce logic.

The last user request removed demo language. Unconnected newsletter signup, fictional testimonials and unavailable payment badges were removed rather than presenting them as operational. The footer now offers a real contact address. Checkout plainly states that payment is not collected.

Not measured: a Lighthouse score of 90+, a 60fps guarantee on low-end devices, or real photo quality for the missing product images. Owner-supplied images should be optimized WebP/AVIF with the dimensions set in the config.

Our Story includes a founder section for Aditya Dhariwal with a portrait slot at `media.founder` in `src/lib/media.ts`. Set its `src` to your own photo URL. Contact links use team@campusbucket.live, +91 99912 50707, and Instagram @aditya.100_.
