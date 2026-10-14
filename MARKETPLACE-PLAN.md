# Campus Bucket · Thapar Market

## Launch decision

Thapar-first student resale pilot inside the existing cream/charcoal website. Fee collection is deferred by the owner. No payment is taken in the pilot; the intended future listing fee is ₹10, with payment verification to be designed before charging anyone. Product payments stay between students after inspection. No escrow, guaranteed sales, university endorsement or official safe-meetup claims.

## What the research changes

- DormXchange and CampusExchanges already offer campus email verification and local exchange. These are baseline trust features, not a unique selling point: https://www.dormxchange.com/ and https://campusexchanges.com/
- ReLoop Mart is already described by its builder as a TIET resale marketplace. Campus Bucket should not advertise itself as Thapar's first resale platform: https://www.linkedin.com/posts/aman-yadav-8684242b3_thaparfind-reloopmart-tiet-activity-7481327526875893760-fSOD
- Thapar's own student information supports institutional @thapar.edu addresses. Ownership of that email is labeled precisely; it is not a guarantee of current enrollment. Other students can request manual review: https://updated.thapar.edu/upload/files/STUDENT%20REPRESENTATIVES%20LIST2025.pdf
- OfferUp recommends in-app messaging, public daytime meetups and inspecting before paying. Numbers and hostel room details should not be public: https://help.offerup.com/hc/en-us/articles/360032330891-Safety-tips-for-meeting-up

## Differentiators to implement

1. Course/semester tags and availability dates: search for what your next semester needs and when it can be handed over.
2. Honest second-look rotation: unsold listings older than seven days get their own discovery section, without fake popularity. Sellers receive a reminder to improve photos/description or consider a price reduction. Prices never change automatically.
3. An agreed-meetup card in private chat, optional consent-based phone sharing, and a two-sided handover confirmation. Only two confirmed participants count as a completed handover.
4. Save-with-price-alerts, actual price-drop labels, disclosed defects and real item photographs.
5. Moderation, member verification, blocking/reporting, private listing photos and database-enforced participant access from day one.

## Build order

Database/RLS and adversarial tests → real-photo listings and search → private chat and meetups → seller tools and moderation → durable transactional email queue → mobile review, deployment and GitHub backup.

No invented listings, reviews, handover counts or pretend buttons. Empty and unconfigured states must explain what is actually available.

## Launch operations

Recruit initial sellers through owner-led outreach; seed real inventory rather than artificial listings. Start with course books, calculators, cycles and hostel move-out essentials. Run a recurring exchange window only after campus permission and a real location are agreed. Seek student-society ambassadors and handover feedback; do not claim partnerships before agreement. Measure real published listings, first-interest conversion and confirmed handovers, not made-up savings or carbon figures.

Brevo SMTP for account confirmation does not automatically grant transactional API access. A write-only admin setup will store the marketplace API credential privately. Email queue status must distinguish queued, provider-accepted and failed; provider acceptance does not prove inbox delivery.

## Delivered folder structure

```text
src/app/marketplace/{page,layout}.tsx
src/app/marketplace/[id]/page.tsx
src/app/marketplace/{sell,inbox,mine,guide}/page.tsx
src/app/admin/marketplace/page.tsx
src/components/market/{provider,feed,cards,detail,sell,inbox,mine,admin}.tsx
src/components/market/api.ts
src/lib/marketplace.ts
supabase/marketplace.sql
supabase/marketplace-email.sql
tests/marketplace.test.ts
tests/marketplace-database.ts
tests/marketplace-live.mjs
```

## Owner launch checklist

1. Add the Brevo API key in the private admin email setting and verify a real test in the inbox and provider logs. SMTP alone does not activate marketplace alerts.
2. Establish who checks manual student claims, what independent evidence is acceptable, and a daily moderation routine. Do not publish unverified requests just to fill the feed.
3. Recruit a small real seller cohort around semester books/calculators and move-out cycles/hostel essentials. Ask for clear item photos and honest defects.
4. Announce the market with real listing links. Promote course tags, agreed campus handovers and Second look; avoid “first”, “safest”, inflated handover counts or guaranteed savings.
5. Observe first-interest and two-sided completion counts before deciding the ₹10 payment method. A fee decision needs an actual payment integration and clear disclosure.

Technical pilot limits: search/inbox offset browsing stops at 5,000; inbox loads 50 conversations at a time and messages page in batches of 50. Add cursor pagination before crossing those browsing limits. Photos use short-lived signed URLs, so refreshing renews access; a recipient can still copy an image they can view. Chat polling runs every six seconds only while the inbox is visible. This implementation has no fake typing indicators, unread counters or real-time-delivery claims.
