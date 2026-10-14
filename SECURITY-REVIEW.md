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
