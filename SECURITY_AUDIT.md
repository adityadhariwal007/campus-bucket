# Campus Bucket security review · 14 October 2026

What this repo does: public kit catalog, browser cart, Supabase email accounts, transactional orders and stock, and a restricted store administration page. Assumed load: a small public shop with concurrent checkouts and untrusted browser/API clients.

## Changes completed

1. **Server-side admin protection.** `/admin` verifies the Supabase user and a database-owned `admin_users` membership before rendering. Browser sessions now use the official SSR cookie client. Database authorization independently checks every privileged mutation. User-editable metadata is never used for permission decisions.
2. **Strict script policy and response protection.** Every dynamic HTML response has a fresh nonce; scripts require that nonce and trusted dynamic loading. No production unsafe-eval. CSP also blocks framing, plugins and foreign form targets. Added nosniff, frame denial, referrer/permissions policies and HTTPS HSTS. HTML is private/no-store so nonces and authenticated content do not enter shared caches. Inline styles remain allowed for React/GSAP; inline scripts do not.
3. **Rate limits.** Cloudflare's binding allows 300 Worker requests per IP per minute. It uses Cloudflare's ingress IP, not client-supplied X-Forwarded-For. This is an approximate per-location edge limit, not a global billing quota. Direct Supabase checkout calls additionally enforce 10 successful new orders/hour and 50/day per account under a transaction lock. Retries of an existing request remain idempotent. Invalid RPC calls do not consume the database order quota. Supabase Auth supplies its separate login/email limits.
4. **Request boundaries.** The Worker rejects cross-origin writes, sensitive dotfiles, database/source folders, SQL, archives, logs and source maps. No permissive website CORS header is added. Supabase's cross-origin Data API intentionally uses bearer tokens and RLS, not ambient website cookies. Price, stock, quantity, size, coupon and customer checks are authoritative in SQL. Oversized checkout payloads and control characters are rejected. React renders user input as text; no raw HTML rendering, eval, or SQL string interpolation was found in app paths.
5. **Dependencies and files.** Updated OpenNext Cloudflare to 1.20.11 and Wrangler to 4.150.0; added pinned @supabase/ssr 0.12.7. Removed unused old font packages. Next 16.3.8 remains pinned for adapter compatibility; the previous 16.4 deployment failed at runtime. npm audit reports zero known vulnerabilities. Source maps and X-Powered-By are disabled. Old generated product assets moved out of public into assets/previous-design.

## Secrets, passwords and database

- `.env.local` contains only NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY. These are intentionally public identifiers, not server credentials. No service-role key is required or placed in the browser.
- Source pattern scan found no private key, secret Supabase key, AWS access key, GitHub token, Stripe secret or JWT credential patterns. Values were not printed. Pattern matching cannot prove absence of every possible secret.
- This directory has no Git repository/history to scan. No history was rewritten and no credential was rotated without evidence of a leak.
- Passwords go directly to Supabase Auth over HTTPS. The app does not log, store or hash passwords itself. Supabase documents salted bcrypt storage: https://supabase.com/docs/guides/auth/password-security .
- All six exposed tables have RLS enabled. Live Supabase security advisor returned no warnings after the migration. The database tests verify owner isolation, denied anonymous operations, denied non-admin writes, atomic rollback, shared inventory, authoritative prices, idempotency, malformed input and order quotas.

## Open findings before accepting paid orders

1. **Must finish: email delivery and a confirmed administrator.** User selected founder@campusbucket.live. There were zero Auth users and zero administrators at audit time. No unverified account was promoted. Custom SMTP provider/configuration and a complete delivered confirmation-email/login flow remain unverified. Supabase's default SMTP is restricted to team addresses: https://supabase.com/docs/guides/auth/auth-smtp . Keep email verification enabled.
2. **Must finish: payments and fulfilment.** No payment provider is connected. Checkout records an unpaid order; database references retain the existing `mock_` marker internally. Customer UI explicitly says no payment is collected. Do not treat these as paid transactions. Final campus coverage, delivery/returns terms and operational processes need the owner.
3. **Should improve before growth:** MFA for store administrators, Auth password policy/CAPTCHA review, live email recovery, traffic monitoring and alerting, database backup/restore exercise, and pagination beyond the existing 200-order list. Admin access should be granted only to the confirmed founder account.

## Verification and limits

`npm run typecheck`, 8 Node tests, and the PGlite PostgreSQL schema tests passed. Production Cloudflare build and live HTTP/browser checks are recorded in VERIFICATION.md. Live HTML inspection found all 18 initial script tags carried the matching nonce.

This is a code/configuration review and targeted testing, not an independent penetration test or a guarantee against compromise. No destructive testing, bulk traffic attack, real payment, live two-user signup, SMTP delivery or password reset was performed. Cloudflare's limit does not cover direct Supabase reads or invalid RPC floods; RLS and Supabase's platform protections remain necessary. Supabase cookies are readable by its browser client by design, so XSS prevention remains essential.

## 14 October follow-up

Both owner-approved addresses, founder@campusbucket.live and team@campusbucket.live, now have confirmed accounts and verified administrator membership. Subsequent signup logs show Brevo SMTP rejects the configured login with 535 5.7.8 Authentication failed. Confirmation delivery remains blocked pending correction of the SMTP login/key pair by the owner. Email confirmation remains enabled.
