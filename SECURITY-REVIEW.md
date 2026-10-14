# Campus Bucket security review · 15 October 2026

This was a bounded review of the source, dependencies, database policies and live public endpoints. It was not an unrestricted penetration test or a guarantee that the site has no vulnerabilities. No customer account was accessed, password guessed, real signup submitted, order created or payment triggered.

## Findings to keep visible

- **Medium: leaked-password protection is disabled.** Supabase's security advisor reports this. Supabase makes this protection available on Pro and higher plans. The setting remains disabled and must be reviewed by the owner in Auth settings; no paid upgrade or credential change was made. Existing passwords remain handled by Supabase Auth; the application does not store plaintext passwords. Review this setting before increasing account volume: https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection
- **Low: edge throttling permits brief bursts.** Cloudflare's rate-limit binding is approximate per location. An initial strict six-request test did not receive a 429. A bounded sustained check did receive 429 responses; subsequent checks passed. The signup/recovery budget is configured at five attempts per IP per minute, not a guaranteed hard global ceiling. Direct Supabase Auth calls remain reachable and rely on Supabase's own controls. Consider a provider CAPTCHA if distributed signup abuse appears: https://developers.cloudflare.com/workers/runtime-apis/bindings/rate-limit/

## Evidence

- 16 non-destructive live checks passed: private files return 404; anonymous /admin redirects to login even with spoofed middleware headers; login responses are private and include CSP, frame restrictions, HSTS and nosniff; cross-origin account writes return 403; anonymous orders, users and admin membership access is rejected; a fabricated unsigned user token is rejected; anonymous admin RPC access is rejected; sustained invalid signup attempts are throttled. Invalid emails never reach SMTP.
- All six public database tables have RLS. Reviewed policies restrict profiles to their owner, orders to their owner or a verified administrator, and catalog mutation to verified administrators. No exposed public views were found.
- Database regression checks verify ownership isolation, metadata role spoofing cannot confer admin, profile ownership cannot be reassigned, admin functions reject customers, money/stock are authoritative, idempotency and rollback work, and anonymous mutations fail. These authenticated multi-user checks ran in a disposable database, not customer accounts in production.
- npm audit reported zero known dependency advisories at the time of review.
- Secret-pattern scan of 133 historical Git blobs found no matching private key, secret Supabase key, GitHub token, Brevo key or AWS access-key patterns. Large blobs above 2 MB were excluded. Pattern scanning cannot establish that no credential ever existed.
- Search uses literal string matching and React text rendering, not SQL interpolation or raw HTML. Unit/browser checks cover item contents, multiword queries, new level names, no results and an HTML injection payload. Dialog focus, Escape and mobile fit are checked separately.

## Recheck

```sh
npm test
npm run test:db
npm audit
node --env-file=.env.local tests/live-security.mjs
```

The live check uses only public configuration, caps its invalid-signup probes at 12, and may briefly apply a signup/recovery cooldown to the testing IP. Detailed transient output is stored in the ignored output folder. Real email delivery, Google consent, physical-device behavior, and an independent authenticated production penetration test remain unverified.

## Thapar marketplace extension · 15 October 2026

- All ten new public tables plus private mail/audit tables have RLS. No anonymous marketplace table/RPC access is granted. Direct listing-column access is restricted; sensitive notes are returned only through owner/admin reads. Real photos are in a private bucket with short-lived signed links.
- PostgreSQL regression tests execute the actual marketplace SQL with separate seller, buyer, unrelated member, manual-review applicant and administrator roles. They cover exact institutional domains, spoofed verification fields, ownership, pending listing isolation, private/unpublished photos, moderation-note isolation, reported-only chat inspection by admins, literal SQL/HTML payloads, message idempotency and quotas, older-message cursors, phone consent, blocked contacts, suspension, two-sided handovers and price-alert deduplication after resubmission.
- The email transport test uses local stand-ins for Vault, pg_net and cron. It checks private key access denial, configured/unconfigured states, opt-out, fixed provider destination, event-only email text, provider acceptance/rejection, ambiguous timeouts, and safe retry selection. No emails are sent by those tests.
- Live checks confirm clients cannot read Vault plaintext or private mail, run the mail worker, or call anonymous write RPCs. The scheduled worker has succeeded with no API key configured. The live database contains no seeded marketplace students or resale listings.
- The Supabase advisor reports two informational notices because the private outbox and audit tables intentionally have RLS without client policies; clients have no grants. No permissive policy was added to silence them. Reference: https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy
- The pre-existing leaked-password-protection warning remains. Runtime dependency audit reports zero known advisories for this release. This does not establish absence of vulnerabilities.

Marketplace testing is scoped, not an independent production penetration test. Authenticated multi-user flows were tested against disposable PostgreSQL, not real students' production accounts. Mailbox delivery awaits the owner's Brevo API key and a real connection test. Physical-phone camera/HEIC behavior and an actual student-to-student handover were not exercised. Phone-sharing revocation cannot erase a number someone has already copied; signed photos can similarly be copied by their recipients.
