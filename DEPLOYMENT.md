# Campus Bucket deployment

Verified 15 October 2026.

- Primary: https://campusbucket.live
- Also live: https://www.campusbucket.live
- Hosting: Cloudflare Workers with OpenNext
- Worker: `campus-bucket`
- Deployed version: `ceb5fac0-4360-471f-a0d0-74fc66116c13`
- Routes: `campusbucket.live/*` and `www.campusbucket.live/*`
- Next.js 16.3.8; OpenNext Cloudflare 1.20.11; Wrangler 4.150.0
- Existing proxied DNS records and email routing are preserved. No paid plan or Images service was enabled.
- Live Supabase project: `zbdezzafnqwmqmdxdmmo`. The build includes its public URL and publishable key; no service-role credential is shipped.
- Six tables have RLS. The catalog contains 30 products, 10 kits and 66 kit-item rows. The order-limits migration is applied.
- Cloudflare `SITE_LIMITER`: 300 Worker requests/IP/minute; signup/recovery gateway: approximately 5 attempts/IP/minute per location (brief bursts can pass). Database order quota: 10/hour and 50/day/account.

## Redeploy

With the existing ignored `.env.local` public settings and authenticated Wrangler:

```sh
npm run typecheck
npm test
npm run test:db
npm run build:cloudflare
npm run deploy:cloudflare
```

The public environment settings are compiled into the browser bundle; rebuild after changing them. Never put a service-role key or database password in a public variable.

## Remaining launch setup

- Both `founder@campusbucket.live` and `team@campusbucket.live` now have confirmed accounts and verified administrator membership. A full SMTP delivery/recovery flow has not been independently tested.
- Checkout collects no payment. A payment provider must be integrated and verified before accepting online payments.
- Owner supplies final product photos, prices, campus coverage and store policies.

The older `campus-bucket.vercel.app` deployment has not been updated to this release. Use the custom domain above.

To restore the former parking origin, remove only the two Worker routes; preserve the zone and DNS records. For a release rollback, select a prior Worker version in Cloudflare. Database migrations have a separate lifecycle and are not reverted by a Worker rollback.

Live database repair: restore_user_name_column applied 14 October 2026; restores users.name from the renamed team column. No frontend redeployment is required. Keep schema column names aligned with signup triggers and checkout RPCs.

## Saved-folder release — 14 October 2026

Deployed all current application files, including the Google sign-in UI and saved CSS changes. Removed token logging and the browser-only account fallback after rejected Google authentication. The Google debug HTML is preserved locally in output/local-only and is not published.

Validation: typecheck, eight unit checks, database suite, and Cloudflare production build passed. Live main routes return 200; anonymous /admin redirects to login; /.env.local and /google-login.html return 404. The Google button renders without browser errors.

Google provider was subsequently enabled and verified through live Supabase Auth settings (external.google=true). A complete Google sign-in and email delivery remain unverified.

Latest release includes the admin dashboard, automatic verified-admin routing, homepage scroll ribbon, inset header divider and four icons, header logout, password recovery, and Google button initialization fix.

## Launch and mobile release · 15 October 2026

Live version above includes policy pages, social metadata/card, icons, custom 404, signup/recovery abuse controls, existing analytics verification and mobile refinements. Phone kit browsing uses native horizontal scrolling; scroll-driven translations are progressive enhancements and respect reduced motion. No photos or dependencies added for the mobile work. Live checks pass for 22 routes and 39 internal links. Type checking, 16 unit checks, database checks and production build pass. Legal copy and real email/auth delivery still need owner review; no online payment has been enabled.

## Shop names and search release · 15 October 2026

Essential / Plus / Premium display names preserve stored keys and existing kit links. Header heart removed; search opens a phone-friendly native dialog with kit-contents and individual-item matching. Story policy sections removed; standalone policy links retained. Responsive campus WebP variants and uncropped product frames included. Security findings and scoped live checks are in SECURITY-REVIEW.md. No database records or schema changed for this release.

## Thapar Market pilot · 15 October 2026

New marketplace source is described in README.md and MARKETPLACE-PLAN.md. Supabase migration records: `20261014222201_thapar_marketplace` and `20261014222202_thapar_marketplace_email` (UTC database versions). Applied through the signed-in SQL Editor after the migration connector returned an internal request-state error; checked database functions and privileges directly afterward.

The private bucket, verified-member access, listing review, participant chat, meetup consent, seller tools, moderation, durable outbox and minute scheduler are installed. No real accounts, fake resale stock or pretend transactions were seeded. The existing store seed is separate.

**Owner setup still needed:** sign in as an existing administrator, open the marketplace dashboard, create your marketplace profile when prompted, and add a Brevo **API** key under Email delivery. SMTP already working for signup does not supply this credential. Enable your email preference and send a connection test. Do not report emails as delivered from the provider-accepted counter alone.

Posting-fee collection is disabled for the pilot at the owner's request; the intended ₹10 method remains undecided. No new payment or paid service was purchased. Existing customers' store data and orders remain in place. Worker rollback and database rollback remain separate.

Published Worker version: `8575a36c-2d3d-49f9-839a-5015e10ed417`. All 22 bounded marketplace live checks pass. The deployment's Node child-process deprecation message comes from the installed deployment tooling; no user input is interpolated into deployment commands.

## Buck campus companion · 15 October 2026

Published Cloudflare version `c23471d0-73e9-4cfa-892c-9c5d670ca7e6`. Custom six-expression artwork was exported from the user-selected Bible Strong Avatar Lab at its pinned revision. The website uses local SVG assets and original interaction code; no third-party avatar runtime or new dependency is installed. Licence/provenance and reproduction details are in `assets/avatar/README.md`.

23 unit checks, type checking and the Cloudflare production build pass. Live mobile greeting and matching happy artwork render at 390 × 700 with no captured console errors or horizontal overflow. Screenshot: `output/buck-live-mobile.png`. The full expression sheet is `output/buck-reactions.png`, also published as `/avatar/buck-reactions.svg`. Existing payment/email configuration and database records were not changed.
