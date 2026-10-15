# Verification record

Current release verified 14 October 2026. Cloudflare version: `0a2d4944-4528-4001-98a7-b74eefda70a8`.

## Automated checks

- TypeScript passes; all 8 commerce/security tests pass.
- PGlite executes the real PostgreSQL schema and seed. Checks cover authoritative prices, required sizes, customer validation, owner isolation, denied anonymous/non-admin access, shared stock, rollback, idempotency and account order quotas.
- Production Cloudflare build and deployment succeed. The middleware deprecation warning remains for adapter compatibility.
- Dependency audit: zero known vulnerabilities at the time checked.
- Live Supabase security advisor: no warnings after applying the order-limit migration.

## Live HTTP checks

`output/live-security-checks.json` records the responses. Both HTTPS hostnames return 200. Home, kits, kit detail, builder, cart, checkout, login, orders, order-success and about return 200. Unauthenticated `/admin` redirects to `/login?next=admin`. Requests for `.env.local`, `.git/config`, SQL source and an output archive return 404.

The home response has a nonce-based CSP, HSTS, private/no-store caching, nosniff and frame denial. All 18 initial script tags carry the response's matching nonce. Baseline security headers have single values.

## Browser checks

- Live homepage renders with no captured console warnings/errors.
- Document width equals viewport width at 375, 768, 1280 and 1920 pixels. This checks horizontal overflow, not every possible device.
- Live desktop screenshot: `output/campus-bucket-editorial-live.png`.
- Local production UI flow: Hostel Scholar detail → add to drawer → CAMPUS10 coupon → quantity two. Subtotal ₹1,998, discount ₹200, total ₹1,798 and free delivery. Checkout link retains the coupon. Escape closes the native cart dialog.
- Existing design and photos retained; no further photos added after the user's instruction. Customer-facing demo/mock wording, fictional testimonials and the unconnected newsletter form were removed. Checkout clearly states no payment is collected.

## Not verified

Custom SMTP, delivered signup/confirmation/recovery emails, live two-user account isolation and founder administrator login remain unverified. At audit time the live project had zero Auth users, administrators and orders. Database isolation was tested with simulated Auth roles in PostgreSQL, not real hosted customer accounts. No real payment was taken. No independent penetration test, destructive/load testing or Lighthouse benchmark was run. See SECURITY_AUDIT.md for remaining risks.

## Homepage photo removal

Deployed version `08938598-5de8-4bcb-9530-46aa219f93e7` removes the hostel hero photo, caption, preload, media entry and associated animation/styles. TypeScript and the Cloudflare production build pass. Live browser checks confirm no hero image, no horizontal overflow at mobile/desktop widths, and the decorative badge remains inside the mobile hero. Screenshot: `output/campus-bucket-no-hero-photo.png`. Checkout/database tests were not repeated for this presentation-only change.

## Founder and contact update

Version `9a2ae8b8-3644-4e09-a543-0e828a69b7ea` adds the owner-supplied founder name, Instagram, phone and team email, with an empty portrait slot. TypeScript and Cloudflare production build pass. Live DOM verifies the exact Instagram, tel and mailto destinations. Preview: `output/campus-bucket-founder-live.png`. Supabase Auth logs show confirmation sending currently fails with SMTP 535 5.7.8 Authentication failed; Brevo credential correction and delivery verification remain pending.

The subsequent mobile correction is deployed as `c4b0ae02-f24a-42f0-a7ae-e6dd85c3f75f`. The campus image is constrained to its column. Live mobile document width equals 375px viewport width. SMTP screenshot identifies a literal placeholder in the Username field; owner must replace it with the actual Brevo SMTP Login and an active SMTP key before retrying.

## Signup schema repair · 14 October 2026

Auth logs identified SQLSTATE 42703: the signup trigger referenced a missing public.users.name column. The live column was named team. Applied restore_user_name_column to rename it back without dropping data. Regression test reproduces the missing-column failure, applies the migration twice, preserves an existing profile name, and verifies new profile creation. All PostgreSQL checks and TypeScript pass. A rolled-back live trigger probe succeeds under the management connection; there are zero persisted probe accounts. All 3 existing profiles, RLS and both administrator memberships remain. A probe using SET ROLE supabase_auth_admin was denied by the management role, so this does not constitute a hosted Auth signup/email-delivery test.

Security advisor now reports leaked-password protection disabled; its availability/configuration remains for a separate Auth settings review. No RLS or permission protections were removed for this repair.

## Header, ribbon, and account controls — 14 October 2026

- Added a curved text ribbon with scroll-driven reveal and reduced-motion support; checked the homepage at desktop and 375px width.
- Header has an inset divider, search/account/heart/bucket icons, and a signed-in logout action. The heart links to kit discovery; no wishlist storage is introduced.
- Google initialization now reruns after the form mounts and has an OAuth fallback while its script loads.
- Added reset-email request and recovery-password forms using Supabase Auth. Reset links return to the existing /login URL and should be opened in the requesting browser (PKCE). No password-reset email was sent during testing.
- Admin overview, order stages, catalog filters, stock filters, and automatic routing for verified admin membership are included. Public admin links are removed.
- Twelve unit checks, database authorization checks, type checking and Cloudflare build passed. Authenticated logout, real Google consent, and reset-email delivery still need owner verification.

## Header visibility repair — 15 October 2026

Removed scroll-driven header hiding and compact-height changes. These classes were applied outside GSAP's context and could persist after homepage navigation, leaving the logo and navigation partly offscreen. Header now retains its normal sticky position and full height. Typecheck, 12 unit checks, and Cloudflare build passed.

## Launch polish — 15 October 2026

- Ribbon server markup starts with a fully hidden SVG and reveals only after scrolling; native scroll reveal works independently of animation libraries.
- Terms, privacy and social-preview pages added; branded favicon, touch icon and 1200×630 Open Graph/Twitter card are served.
- Unique titles, descriptions, canonical URLs, social metadata, private-page noindex, robots.txt and a live-catalog sitemap are in place. Missing kit IDs now return HTTP 404; removing the outer loading boundary prevents streaming an early success status. Per-page loading states remain.
- Sixteen unit checks, database checks, type checking and Cloudflare build passed. Live audit: 22 routes and 39 internal links, no broken anchors or images missing alt attributes. No AI badge was found in source or live DOM.
- Signup/recovery use a same-origin Worker gateway with a five-attempts/minute/IP budget, input/body validation, trusted upstream, private responses and origin checks. Signup/recovery forms include a honeypot. Supabase's own authentication limits and existing order quotas remain. The public Supabase API remains directly reachable by design; this is basic abuse protection, not proof that all bots are blocked. Shared networks may encounter the one-minute cooldown.
- Existing Cloudflare Web Analytics automatic setup was verified: the dashboard shows visits, and the beacon is present without browser errors. No duplicate tracker was added.
- Campus photo: 798,817 bytes PNG → 175,968 bytes WebP (78% smaller). Original PNG retained.
- Google PageSpeed Insights mobile, slow 4G/Moto G Power: performance 73 → 92; accessibility 90 → 100; best practices 100; SEO 100. Final lab metrics: FCP 1.6s, LCP 3.2s, TBT 70ms, CLS 0, speed index 3.1s. No CrUX field data available.
- Report: https://pagespeed.web.dev/analysis/https-campusbucket-live/gmj428kvfh?form_factor=mobile
- The initial direct PageSpeed API request was quota-limited; the public interface completed both audits. Animation libraries now wait for scrolling, the headline stays visible, and the low-contrast heading fade, prohibited marquee ARIA and footer heading order were corrected.

Limits: legal wording has not been reviewed by a lawyer. No real password-reset email or paid checkout was triggered during this release. Lighthouse scores are lab measurements and may vary.

## Mobile refinement · 15 October 2026

Phone browser checks at 320px and 390px: no document horizontal overflow; 320px navigation remains 80px high on one row; headline fits on two lines. Mobile menu opens/closes. Kit rail accepts keyboard horizontal scrolling and exposes a focusable named region. Native scroll-timeline support confirmed; unpack translation moves from 28px to 0 as content passes through the viewport. Ribbon starts hidden and reveals after scrolling. No photos or motion dependencies added. Native reduced-motion media query excludes the new animations; actual device/Safari testing and authenticated mobile logout were not performed.

Final Worker version: `31cc181a-8ca8-4142-bb48-46c4a3ead6c3`. Live 22-route/39-link audit passes. At 320px, login, kit detail, build-your-own, cart, checkout, about, privacy and terms have no horizontal document overflow. Production screenshots: `output/campus-bucket-mobile-live.png` and `output/campus-bucket-mobile-unpack-live.png`.

## Levels, search and security review · 15 October 2026

Essential / Plus / Premium labels applied across public pages, admin controls, metadata, cart and historical order names. Stable tier keys and URLs retained. Removed heart navigation; header search opens a native modal, handles literal multiword queries and kit contents, and links individual matches to a filtered builder. Verified repeated product navigation, HTML-like search input (no injected elements), Escape and focus restoration. At 320px the dialog and page have no horizontal overflow. Our Story policy sections removed; footer links now point to standalone policies and terms#delivery.

Campus photo uses 480px (about 15KB), 960px (about 50KB) and 1600px sources; 390px browser selected the 480px source. Product/kit photographs use contain to preserve the whole item. No new photos added.

Eighteen unit checks, disposable-database authorization checks, production build and sixteen live security probes passed. npm audit: zero known advisories. Six live tables have RLS. Historical secret-pattern scan: 133 blobs, zero matches. Security advisor warning and rate-limit consistency limitation are documented in SECURITY-REVIEW.md. The initial strict burst-limit assertion failed; it was replaced with a bounded sustained check matching the documented platform behavior, not treated as a hard global five-request guarantee.

Final release `ceb5fac0-4360-471f-a0d0-74fc66116c13`: live audit passed 22 pages and 38 internal links; homepage visible text has no old level names; individual search result opens the correct filtered builder. Proof: output/campus-bucket-search-mobile-live.png.

## Thapar Market pilot · 15 October 2026

Cloudflare version: `8575a36c-2d3d-49f9-839a-5015e10ed417`. Published to both custom-domain Worker routes.

- TypeScript, 21 unit checks, original store database suite, marketplace database/transport suite and the production Cloudflare build pass. Runtime dependency audit reports zero known advisories.
- All 22 bounded live marketplace checks pass. Anonymous access to ten marketplace tables and both RPCs is denied; the private image bucket is not listable anonymously; five marketplace pages render with private/security headers; moderation redirects to login; SQL/environment files return 404. Evidence: ignored `output/marketplace-live-checks.json`.
- All 12 marketplace tables have RLS. Authenticated clients cannot read decrypted Vault secrets or the private mail queue, or execute the email worker. The minute scheduler has run successfully. Production started with zero marketplace profiles and listings.
- Mobile landing/guide inspected at 320 and 390 pixels; tablet navigation inspected at 768. No horizontal document overflow was observed. Header search carries the typed query into marketplace search. Sign-in and guest gates render correctly. No captured browser warnings/errors on the inspected pages.
- Live phone proof: `output/campus-bucket-marketplace-mobile-live.png`. Scroll translations are progressive CSS enhancements; reduced-motion and non-supporting browsers retain content.
- The 14 deployed private marketplace functions were compared to their tested source definitions after publishing the SQL. Marketplace migration records use UTC versions `20261014222201` and `20261014222202`.

Limits: authenticated multi-user access rules were exercised in disposable PostgreSQL, not a real production student handover. No owner credentials were used to complete the new marketplace opt-in, no student listings were fabricated, and no actual marketplace email was sent. Brevo API setup and inbox delivery remain pending; SMTP confirmation email is a separate system. Physical-device photo upload, a fresh field performance score, and an independent penetration test were not performed. The earlier store PageSpeed result should not be presented as a new marketplace score.

## Buck companion · 15 October 2026

- Six original Campus Bucket expressions exported from Bible Strong Avatar Lab `79fe9ba06e4874b11394b8e8a3f2c493c9d197ba`. The exported SVGs total about 47 KB before compression; no avatar runtime or new project dependency is installed. Editable definition, authoring helper and licence/provenance notes are included.
- TypeScript and all 23 unit checks pass. Checks cover truthful reaction precedence, protected/form-route exclusions and script-free local artwork. The production Cloudflare build passes.
- Browser checks: warm neutral/olive artwork and greeting on desktop/390px phone layout; real cart addition produces the happy expression; restored cart remains neutral; mobile corner observer hides the avatar where a CTA would be covered; native search dialog hides it; Escape closes its greeting; hiding removes it across navigation/reload. No captured console warnings/errors in the tested flows.
- All motion is finite and opt-in via `prefers-reduced-motion: no-preference`. Buck does not read form values, send data or claim to be a support chatbot. The session hide preference is disclosed in Privacy.
- Reaction proof: `output/buck-reactions.png`. Physical-device testing and an OS-level reduced-motion preference were not exercised; reduced-motion CSS was reviewed.

Buck live confirmation: `c23471d0-73e9-4cfa-892c-9c5d670ca7e6` renders the mobile greeting and olive happy face without captured console warnings/errors. Width remains 390px at the 390px viewport. The local cart item used for checking the celebration was removed afterward; no order was submitted. Live asset checks cover all seven SVG files and confirm the offline authoring script stays private.
