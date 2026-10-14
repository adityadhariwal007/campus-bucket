# Campus Bucket deployment

Verified 14 October 2026.

- Primary: https://campusbucket.live
- Also live: https://www.campusbucket.live
- Hosting: Cloudflare Workers with OpenNext
- Worker: `campus-bucket`
- Deployed version: `ac35e377-158a-4ab1-87c3-e61427f1ce69`
- Routes: `campusbucket.live/*` and `www.campusbucket.live/*`
- Next.js 16.3.8; OpenNext Cloudflare 1.20.11; Wrangler 4.150.0
- Existing proxied DNS records and email routing are preserved. No paid plan or Images service was enabled.
- Live Supabase project: `zbdezzafnqwmqmdxdmmo`. The build includes its public URL and publishable key; no service-role credential is shipped.
- Six tables have RLS. The catalog contains 30 products, 10 kits and 66 kit-item rows. The order-limits migration is applied.
- Cloudflare `SITE_LIMITER`: 300 Worker requests/IP/minute. Database order quota: 10/hour and 50/day/account.

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
