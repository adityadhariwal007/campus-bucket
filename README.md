# Campus Bucket

Live: [campusbucket.live](https://campusbucket.live) · [Thapar Market](https://campusbucket.live/marketplace)

Campus essentials store and a Thapar-first student resale marketplace. Next.js, React, Supabase and Cloudflare Workers. The existing store, orders and admin accounts remain connected to the same database.

## Run locally

Install Node.js 22 or 24 LTS, open this project folder in a terminal, then:

```sh
npm ci
cp .env.example .env.local
```

Fill in the two public settings in `.env.local` using your Supabase project's Connect/API settings:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=YOUR-PUBLISHABLE-KEY
```

These are public client configuration. Never add a service-role key, database password or Brevo API key to a `NEXT_PUBLIC_` variable. Keep `.env.local` out of Git.

```sh
npm run dev
```

Open the localhost address printed in the terminal. Stop with Control+C. Local browsing without database settings does not provide working accounts or a marketplace.

## Where things live

```text
src/app/marketplace/          Discover, detail, sell, inbox, own listings, guide
src/app/admin/marketplace/    Server-protected moderation dashboard
src/components/market/       Marketplace UI and authenticated database calls
src/lib/marketplace.ts       Validation, types and campus-time helpers
supabase/marketplace.sql     Marketplace tables, RLS, checked RPCs, storage
supabase/marketplace-email.sql  Vault, private outbox, scheduled delivery
src/components/store.tsx    Existing store/cart/account integration
supabase/schema.sql          Existing store schema and checkout rules
supabase/seed.sql            Store kits/products only; no resale listings
MARKETPLACE-PLAN.md           Research, differentiation and launch operations
SECURITY-REVIEW.md            Findings and testing limits
```

## Database setup

The live project is `zbdezzafnqwmqmdxdmmo`. **The store and both marketplace migrations are already installed there. Do not rerun their CREATE statements on it.** Live marketplace starts empty, with no invented students or listings.

For a separate empty Supabase project, run these files once in SQL Editor, in this order:

1. `supabase/schema.sql`
2. `supabase/seed.sql` (editable store inventory)
3. `supabase/marketplace.sql`
4. `supabase/marketplace-email.sql` (hosted Supabase with Vault, pg_net and pg_cron)

Expose only `public` in the Data API; never expose `private`, `vault`, `net` or `cron`. New marketplace tables are protected by RLS. Writes use checked functions; changing the UI cannot grant ownership, verification or admin rights.

In Supabase Auth, keep email confirmation enabled, set the Site URL to `https://campusbucket.live`, and allow your actual localhost login URL plus `https://campusbucket.live/login` as redirects. Google OAuth and account email use the existing provider configuration. Changing your project also requires updating the fixed provider/domain security settings in `src/lib/security.ts`, `src/lib/account-proxy.ts`, and `worker.ts` as applicable.

The two confirmed store admin accounts are `founder@campusbucket.live` and `team@campusbucket.live`. Their privileges come from `admin_users`, not the email typed into a form. Sign in normally, then open the marketplace section in the admin dashboard.

## Operate Thapar Market

- Confirmed `@thapar.edu` members can join automatically. Other students submit programme, batch and roll number; an admin must verify those details independently and record a review decision. Do not approve an unverifiable claim.
- Listings need 1–4 actual-item photos and review before publication. The website resizes photos and strips metadata. Editing details returns a listing to review; price-only updates can stay live.
- Interested buyers open participant-only chat. Both sides agree a public meeting point/time. Phone sharing requires consent; blocking removes shared numbers. Members can report listings/conversations.
- Only a seller confirmation followed by the buyer's confirmation counts as a completed handover. Students inspect and pay each other directly. There is no escrow or guaranteed buyer protection.
- Active unsold items aged seven days rotate in Second look. Sellers receive at most a weekly nudge. Price suggestions never apply automatically; actual price drops notify saved-item followers.
- The scheduled job expires listings after 45 days or an earlier availability deadline. It also runs the durable email queue every minute.

### Enable marketplace emails

Working Supabase SMTP is separate from marketplace transactional emails.

1. In Brevo, create an **API key**, not an SMTP key. Ensure `team@campusbucket.live` is an authorised sender.
2. Sign in as a store admin, open **Marketplace → Email delivery**, and paste the key into the password field. It is stored in Supabase Vault and never returned to the browser. Do not paste it in chat or source code.
3. Enable your own email notifications under **Your listings**, then send a connection test from the dashboard.
4. Allow a minute, check the recipient inbox/spam and Brevo transactional logs. “Provider accepted” is not proof of inbox delivery. Unknown outcomes need checking before any manual resend.

The queue is installed, but the live marketplace API key has not yet been supplied. In-app notifications work independently of email. Members can switch email alerts off.

## Payments

No online payment is collected for store orders or resale items. The owner deferred the proposed ₹10 listing-fee payment decision. The marketplace pilot collects no posting fee. Integrate and verify a real payment provider before charging anyone; never accept screenshots as automatic payment verification.

## Check and deploy

```sh
npm run typecheck
npm test
npm run test:db
npm run test:marketplace
npm run build:cloudflare
npm run preview:cloudflare
```

The database suites use disposable PostgreSQL instances and synthetic data; they never contact real students. The marketplace suite also substitutes an isolated mail transport to check provider responses and retries without sending email.

After your Cloudflare account is authorised in Wrangler:

```sh
npm run deploy:cloudflare
```

`wrangler.jsonc` contains the existing custom-domain routes and rate-limit bindings. Rebuild before deployment after public environment changes. Keep the current OpenNext/Workers hosting; changing hosts requires a separate adapter/deployment configuration.

Optional bounded live checks, using only public settings:

```sh
node --env-file=.env.local tests/marketplace-live.mjs
```

Database migrations and Worker releases have separate rollback lifecycles. A Worker rollback does not undo database changes. Review the dated security/verification records before widening launch.

## Buck, the campus companion

Buck uses local SVG exports from the selected Bible Strong Avatar Lab repository, with a custom Campus Bucket definition. Neutral stone, charcoal eyes, olive celebration and muted clay reassurance match the existing site. Tap to open a short shopping conversation. Mobile controls, dialogs and key form/chat routes take priority over the character.

Edit or re-export using `assets/avatar/README.md`; source artwork is `assets/avatar/buck.avatar.json`. The offline authoring helper's AGPL licence is included separately; the upstream engine is not loaded by the website. A six-expression sheet is available at `/avatar/buck-reactions.svg`.


### Buck shopping conversations

Buck uses Cloudflare Workers AI (`@cf/meta/llama-3.3-70b-instruct-fp8-fast`) through the server-only `AI` binding. The `/api/buck` endpoint loads the current public catalog from Supabase with the existing publishable key, never a service-role key or customer session. It fails closed if the catalog or AI service is unavailable. For local end-to-end checks use the Cloudflare production preview; plain Next development has no AI binding.

Only visitor-written chat turns and the current path are sent to Cloudflare with public catalog/store facts. No cart/account/order data is sent, and no transcript is saved in our database or browser storage. Closing chat clears it. Replies are rendered as text; links, contents, sizes and prices are generated by the server from available catalog IDs. Model-invented IDs, markup, URLs and numeric claims in prose are rejected. This reduces hallucination risk; it does not make model-written prose infallible.

Controls: same-origin POST only; bounded 12KB request bodies; at most nine recent messages; 600-character questions; eight requests/minute per Cloudflare client IP/location; bounded model output; no tools or write permissions. These approximate rate limits are abuse controls, not a global spending cap. Workers AI uses the account's allocation/billing; monitor usage in Cloudflare. We did not upgrade the plan. If the allowance is exhausted, the chat shows a retry/support message and shopping stays available.
