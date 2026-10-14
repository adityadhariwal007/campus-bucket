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
