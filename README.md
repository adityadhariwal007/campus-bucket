# Campus Bucket

Live website: https://campusbucket.live (also https://www.campusbucket.live)

A responsive campus essentials store built with Next.js, React, Tailwind CSS, and Supabase. Includes all nine requested kit tiers, the Ultimate Fresher Bundle, 30 individual products, editable photography slots, cart, checkout, account pages, tracking, and a catalog/order admin dashboard.

**Checkout currently collects no payment.** Without Supabase settings, the app runs as a browser-local demo. With Supabase configured, email accounts, stock, orders, and administrator permissions use your database. Demo data is not automatically uploaded to Supabase.

## 1. Run it on your computer

Install Node.js 22 or 24 LTS from https://nodejs.org. Open Terminal in this project folder, then run:

```sh
npm ci
npm run dev
```

Open the local address printed in Terminal, normally http://localhost:3000. If another app uses that port, Next.js chooses the next free one.

No keys are needed to explore the demo. Click the account icon, then **Explore with a demo account**. This also unlocks the demo admin dashboard. Use made-up customer details. Demo data persists in this browser; the demo sign-in lasts for the browser tab session. Clear this site's browser storage to start fresh.

To stop the server, press Control+C in Terminal.

## 2. Project structure

```text
src/
  app/
    page.tsx                 Homepage
    kits/page.tsx            Category, tier, and search filters
    kits/[id]/page.tsx       Contents, quantities, sizes, comparison
    build-your-own/page.tsx  Individual item shopping
    cart/page.tsx            Quantity edits, remove, totals
    checkout/page.tsx        Address, pickup, discounts, unpaid order submission
    order-success/page.tsx   Saved order confirmation
    orders/page.tsx          Customer order tracking
    login/page.tsx           Supabase signup/login or demo access
    about/page.tsx           Story, FAQ, contact, draft policies
    admin/page.tsx           Product/kit editing and order status
    globals.css              Editorial design tokens and responsive styles
    layout.tsx               Fonts, navigation, footer, store provider
    loading.tsx / error.tsx / not-found.tsx
  components/                Shared store, cards, size controls, totals
  lib/
    catalog.ts               Editable seed catalog and sample prices
    commerce.ts              Cart, stock, discount, address validation
    supabase.ts              Browser client with public key only
    types.ts                 Shared data types
supabase/
  schema.sql                 Tables, policies, transactional functions
  seed.sql                   30 products, 10 kits, all kit items
  generate-seed.ts            Rebuild seed.sql from catalog.ts
src/lib/media.ts             All image URLs, descriptions, sizes and crops
worker.ts                    Cloudflare rate limit and request protection
src/middleware.ts            CSP nonces and authentication cookie refresh
assets/previous-design/      Archived generated images, not publicly served
 tests/                      Commerce tests and database security checks
```

The UI talks directly to Supabase's authenticated Data API. Checkout is one database transaction, so there is no separate API server to configure. Privileged operations live in the non-exposed `private` schema and require a signed-in user or an administrator check. Public wrappers run with caller permissions. Never expose the `private` schema in your Data API settings.

## 3. Supabase accounts and database

The deployed website already uses project `zbdezzafnqwmqmdxdmmo`. Its schema, seed, RLS and security migration are installed. Do not run schema.sql again on that project. Public confirmation-email delivery and the first administrator still need setup. The owner chose `founder@campusbucket.live`.

For a separate, empty installation only:

1. Create a new project at https://supabase.com/dashboard. Choose your region and save the database password privately.
2. Open **SQL Editor**. Paste the entire contents of `supabase/schema.sql` and click **Run**. Run it once, on an empty project.
3. Open another SQL query, paste `supabase/seed.sql`, and run it. The seed can be rerun without overwriting existing prices or stock.
4. Open the project's **Connect** dialog or API settings. Copy the **Project URL** and **publishable key**.
5. Copy `.env.example` to `.env.local` in this folder. Fill in:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=YOUR-PUBLISHABLE-KEY
```

These two settings are intended for the browser. **Never put a service-role key, secret key, database password, or Razorpay secret in a `NEXT_PUBLIC_` variable.** This application does not need a service-role key.

6. Under **Authentication → URL Configuration**, set the Site URL to your app's URL and add `http://localhost:3000/login` (or your actual local port) and `https://YOUR-DEPLOYMENT/login` to allowed redirect URLs.
7. Enable email/password authentication. Keep email confirmation enabled. For a real launch, configure reliable SMTP in Supabase.
8. Restart `npm run dev`. In the app, choose **Create an account**, complete the form, confirm your email, and sign in.
9. Add the first store administrator through SQL Editor after that person has signed up:

```sql
insert into public.admin_users (user_id)
select id from auth.users where lower(email) = 'founder@campusbucket.live'
  and email_confirmed_at is not null
on conflict do nothing;
```

This grants access only after the selected founder email is confirmed. Sign out and sign back in to refresh the admin UI. Ordinary users cannot grant themselves admin access. Removing the row revokes database admin operations immediately.

If catalog access fails, confirm the public schema is exposed to the Data API. The schema already explicitly grants necessary table access and enables row-level security on every public table.

## 4. Try a complete order

1. Open Student Kit → Scholar.
2. Choose cap and t-shirt sizes, then **Add to bucket**.
3. Edit the quantity in your bucket and continue to checkout.
4. Sign in if prompted. Enter a full name, valid-format 10-digit Indian mobile number, email, and campus.
5. Choose hostel delivery and enter a hostel/room, or choose campus pickup.
6. Apply **CAMPUS10** for 10% off. Discount amounts round to whole rupees. Pickup is free. Hostel delivery is ₹49 unless the post-discount item total is at least ₹1,499.
7. Choose **Place order**. No payment is collected. The order is saved for store-team confirmation; it must not be treated as paid.
8. Open My Orders. In a separate admin session, advance the order through Placed → Packed → Out for delivery → Delivered. Use **Refresh status** to see the change.

The database recalculates prices from its own catalog, checks all required sizes, counts shared items across kits, locks stock, and saves orders atomically. Retrying the same checkout reference returns the existing order. Order prices are saved at purchase time.

## 5. Edit kits, prices, and stock

The admin dashboard lets authorized users create/edit products and kits, set whole-rupee prices, update stock, set size selectors, choose kit contents and quantities, and update order status. It intentionally provides no destructive delete action. Set stock to zero to stop sales.

- Product image: an HTTPS image URL. Empty or legacy sprite values display a labeled placeholder until you add your photos.
- Stock: both the kit's available quantity and its component product inventory limit purchases. Six hangers are consumed for one Hostel Kit.
- Sizing: one shared shirt size per kit, one cap size, and one shoe size where relevant. Buy separate items to mix sizes. Stock is currently per product, not per size.
- Student Topper includes two premium notebooks and two campus t-shirts. Sports Topper uses running shoes for the requested shoes-or-sport-specific-gear choice.
- The Ultimate Bundle contains all three **Fresher** kits and costs ₹1,149 versus ₹1,347 separately.

To change the initial demo/seed catalog, edit `src/lib/catalog.ts`, then run `npm run seed:generate`. Existing database rows and browser demo data are deliberately not overwritten. Use the admin panel for an existing store.

Discount and delivery rules live in `src/lib/commerce.ts` and `private.checkout` in `supabase/schema.sql`. Keep both in sync when changing these rules. Promotional text is in the shell and checkout pages.

## 6. Deploy on Vercel

### Easy route: GitHub import

1. Create a GitHub repository and upload this project. Include `package-lock.json`. Do not upload `node_modules`, `.next`, or `.env.local`.
2. At https://vercel.com/new, import that repository.
3. Select **Next.js**. Leave the root directory as the repository root. The build command is `npm run build`; Vercel detects the output automatically.
4. To keep the demo, leave environment settings empty. For shared database accounts/orders, add the two `NEXT_PUBLIC_SUPABASE_...` values above to the correct Vercel environment before building.
5. Click **Deploy**. Open the resulting HTTPS address.
6. For Supabase, update its Site URL and allowed login redirect URL to match the deployment.
7. When public environment settings change, redeploy; Next.js embeds them at build time.

### Terminal route

```sh
npx vercel login
npx vercel link
npx vercel deploy
```

Choose the intended account and the Campus Bucket project. The first deployment is a preview. After checking it, use `npx vercel deploy --prod` for production. Never turn off deployment protection just to test a protected preview.

## 7. Deploy on Cloudflare

This project includes a Cloudflare Workers build using the OpenNext adapter. Next.js is pinned to 16.3.8 because the adapter's runtime does not yet handle the preview manifest introduced in 16.4. The nested `glob` override fixes a build-tool security advisory.

```sh
npm ci
npx wrangler login --scopes account:read user:read workers:write workers_scripts:write workers_routes:write zone:read
npm run build:cloudflare
npm run preview:cloudflare
```

Open the preview address and check the store. Stop it with Control+C, then publish:

```sh
npm run deploy:cloudflare
```

`wrangler.jsonc` selects your Cloudflare account and routes all requests for `campusbucket.live` and `www.campusbucket.live` to the Worker. Both hostnames must retain proxied DNS records in the Cloudflare zone. The existing records and email settings are preserved; the Worker serves the full site before requests reach the old parking origin. Cloudflare supplies HTTPS through the zone's certificate. Responsive photo URLs are defined in `src/lib/media.ts`; a paid Cloudflare Images binding is not required.

If Supabase is enabled, set the two public values in `.env.local` before building locally, or as build variables in Cloudflare Workers Builds. Update Supabase's Site URL to `https://campusbucket.live` and allow `https://campusbucket.live/login`. Rebuild and deploy whenever these public settings change. Never publish database passwords or service-role keys.

## 8. Checks

```sh
npm run typecheck
npm test
npm run test:db
npm run build
```

`test:db` uses embedded PostgreSQL through PGlite, creates temporary Auth roles, and tests the actual SQL files. It does not connect to or change a live Supabase project. It checks prices, discount totals, retries, rollback, stock aggregation, user isolation, and admin permissions. The chosen Supabase project is connected; delivered confirmation emails and the complete hosted signup/login flow still need verification.

For production locally: `npm run build` then `npm start`. If a local sandbox blocks Turbopack workers, `npm run build -- --webpack` is also supported.

## 9. Before accepting real orders

Checkout collects no payment and saves an unpaid order for store-team confirmation. A future Razorpay integration needs server-created payment orders, server-side signature verification, verified webhooks, and a stock reservation/expiry strategy before real money changes hands.

Configure an SMTP provider, confirm the founder account, and then grant its administrator membership using the SQL above. Publish supported campuses and pickup hours, finalize delivery/returns/privacy policies, add your product photos, and set final prices and stock. The admin list loads the latest 200 orders; add pagination before the shop exceeds that volume.

Earlier generated visuals are archived in `assets/previous-design` and are not publicly served. Current photo slots are documented in `DESIGN.md`.

## Latest editorial design and security update

All new photography is left to the owner. Replace image URLs in `src/lib/media.ts`; empty product/cutout slots show neutral labeled frames. Google Fonts are self-hosted at build time. Motion library URLs and integrity hashes are pinned in `src/lib/motion-scripts.json`. No unconnected newsletter form or fictional reviews are displayed.

See `DESIGN.md` for the component and media guide, `SECURITY_AUDIT.md` for findings and limits, and `VERIFICATION.md` for test evidence. The database now caps each account at 10 new orders/hour and 50/day. The deployed Cloudflare binding rate-limits site requests. Admin pages verify the session on the server; RLS independently protects database writes.

To redeploy after an edit, run `npm run typecheck`, `npm test`, `npm run test:db`, `npm run build:cloudflare`, then `npm run deploy:cloudflare`. Keep `.env.local` out of archives and source control; only the public Supabase URL and publishable key are needed. The older Vercel deployment is not the current release.
