import { PGlite } from "@electric-sql/pglite";
import { readFileSync } from "node:fs";
import assert from "node:assert/strict";
const db = new PGlite();
await db.exec(`create role anon;create role authenticated;create schema auth;create table auth.users(id uuid primary key,email text,email_confirmed_at timestamptz default now(),raw_user_meta_data jsonb default '{}');create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;grant usage on schema auth to authenticated,anon;grant execute on function auth.uid() to authenticated,anon;alter default privileges in schema public grant all on tables to anon,authenticated;
create schema storage;create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);create table storage.objects(id uuid default gen_random_uuid(),bucket_id text,name text unique);alter table storage.objects enable row level security;grant usage on schema storage to authenticated;grant select,insert,delete on storage.objects to authenticated;`);
await db.exec(readFileSync("supabase/schema.sql", "utf8"));
await db.exec(readFileSync("supabase/marketplace.sql", "utf8"));
const seller = "11111111-1111-4111-8111-111111111111",
  buyer = "22222222-2222-4222-8222-222222222222",
  stranger = "33333333-3333-4333-8333-333333333333",
  manual = "44444444-4444-4444-8444-444444444444",
  admin = "55555555-5555-4555-8555-555555555555",
  fake = "66666666-6666-4666-8666-666666666666";
for (const [id, email] of [
  [seller, "seller@thapar.edu"],
  [buyer, "buyer@thapar.edu"],
  [stranger, "stranger@thapar.edu"],
  [manual, "student@gmail.com"],
  [admin, "founder@campusbucket.live"],
  [fake, "fake@thapar.edu.attacker.example"],
])
  await db.query("insert into auth.users(id,email) values($1,$2)", [id, email]);
await db.query("insert into public.admin_users values($1)", [admin]);
async function as(id: string) {
  await db.exec("reset role");
  await db.query("select set_config('request.jwt.claim.sub',$1,false)", [id]);
  await db.exec("set role authenticated");
}
async function act(action: string, data: Record<string, unknown> = {}) {
  return (
    await db.query<{ v: any }>("select public.market_action($1,$2::jsonb) v", [
      action,
      JSON.stringify(data),
    ])
  ).rows[0].v;
}
async function read(
  section: string,
  id: string | null = null,
  filters: Record<string, unknown> = {},
) {
  return (
    await db.query<{ v: any }>("select public.market_read($1,$2,$3::jsonb) v", [
      section,
      id,
      JSON.stringify(filters),
    ])
  ).rows[0].v;
}
for (const id of [seller, buyer, stranger, admin]) {
  await as(id);
  await act("join", {
    display_name: id === seller ? "Seller" : "Student",
    email_alerts: true,
  });
  assert.equal((await read("status")).verified, true);
}
await as(manual);
await act("join", {
  display_name: "Manual student",
  programme: "Engineering",
  batch: "2026",
  roll_number: "10260001",
  verification: "verified",
});
assert.equal((await read("status")).verified, false);
await assert.rejects(() => read("feed"), /verification/);
await as(fake);
await act("join", {
  display_name: "Fake domain",
  programme: "Engineering",
  batch: "2026",
  roll_number: "10260002",
});
assert.equal((await read("status")).verified, false);
await as(admin);
await act("review_member", {
  id: manual,
  decision: "verified",
  checked: true,
  note: "Checked enrollment outside the app",
});
await as(manual);
assert.equal((await read("status")).verified, true);
await as(seller);
const listing = crypto.randomUUID();
await act("draft", { id: listing });
await act("draft", { id: listing });
const photo = `${seller}/${listing}/actual.jpg`;
await db.query(
  "insert into storage.objects(bucket_id,name) values('marketplace',$1)",
  [photo],
);
const item = {
  id: listing,
  title: "Engineering calculator",
  description: "A working calculator for semester one, with its original case.",
  category: "Electronics",
  condition: "Good",
  defects: "None known",
  price: 500,
  course: "Semester 1",
  photos: [photo],
};
await assert.rejects(
  () => act("submit", { ...item, photos: [`${buyer}/${listing}/stolen.jpg`] }),
  /own uploaded/,
);
await act("submit", item);
assert.equal((await read("mine"))[0].status, "pending");
await as(stranger);
assert.equal((await db.query("select id from market_listings")).rows.length, 0);
assert.equal((await db.query("select * from storage.objects")).rows.length, 0);
await assert.rejects(() => act("submit", item), /not yours/);
await assert.rejects(
  () => db.exec("update market_members set verification='verified'"),
  /permission/,
);
await as(admin);
await act("review_listing", { id: listing, decision: "active" });
await as(seller);
const extraPhoto = `${seller}/${listing}/not-published.jpg`;
await db.query(
  "insert into storage.objects(bucket_id,name) values('marketplace',$1)",
  [extraPhoto],
);
await as(stranger);
assert.equal(
  (await db.query("select * from storage.objects where name=$1", [extraPhoto]))
    .rows.length,
  0,
);
await assert.rejects(
  () => db.exec("select moderation_note from market_listings"),
  /permission/,
);
await as(buyer);
assert.equal(
  (await read("feed", null, { query: "calculator semester" })).items.length,
  1,
);
assert.equal(
  (await read("feed", null, { query: "';drop table users;--" })).items.length,
  0,
);
const thread = (await act("interest", { id: listing })).id;
assert.equal((await act("interest", { id: listing })).id, thread);
await db.exec("reset role");
assert.equal(
  (
    await db.query<{ n: number }>(
      "select count(*)::int n from private.market_mail where kind='interest'",
    )
  ).rows[0].n,
  1,
);
await as(buyer);
const req = crypto.randomUUID();
await act("message", {
  thread_id: thread,
  body: "Is this still available?",
  request_id: req,
});
await act("message", {
  thread_id: thread,
  body: "Is this still available?",
  request_id: req,
});
assert.equal((await read("thread", thread)).messages.length, 1);
await assert.rejects(
  () =>
    act("contact", { thread_id: thread, phone: "9876543210", consent: true }),
  /Agree on a meetup/,
);
const meet = (
  await act("propose_meetup", {
    thread_id: thread,
    place: "Campus cafeteria entrance",
    meet_at: new Date(Date.now() + 86400000).toISOString(),
  })
).id;
await assert.rejects(
  () => act("accept_meetup", { thread_id: thread, id: meet }),
  /other participant/,
);
await as(stranger);
await assert.rejects(() => read("thread", thread), /not found/);
assert.equal((await db.query("select * from market_messages")).rows.length, 0);
assert.equal((await db.query("select * from market_contacts")).rows.length, 0);
await assert.rejects(
  () =>
    act("message", {
      thread_id: thread,
      body: "Intruder",
      request_id: crypto.randomUUID(),
    }),
  /not found/,
);
await as(seller);
await act("accept_meetup", { thread_id: thread, id: meet });
await act("contact", { thread_id: thread, phone: "9876543210", consent: true });
await as(admin);
await assert.rejects(() => read("thread", thread), /not found/);
await as(buyer);
await act("report", {
  thread_id: thread,
  reason: "Other",
  details: "Please review this conversation for the test.",
});
await as(admin);
assert.equal((await read("thread", thread)).messages.length, 1);
await as(buyer);
assert.equal((await read("thread", thread)).contacts[0].phone, "9876543210");
await assert.rejects(
  () => act("handover", { thread_id: thread }),
  /seller must confirm/,
);
await act("save", { id: listing, enabled: true });
await as(seller);
await act("price", { id: listing, price: 450 });
assert.equal((await read("mine"))[0].price, 450);
assert.equal((await read("mine"))[0].previous_price, 500);
await db.exec("reset role");
assert.equal(
  (
    await db.query<{ n: number }>(
      "select count(*)::int n from private.market_mail where kind='price_drop'",
    )
  ).rows[0].n,
  1,
);
await db.exec(
  "update market_listings set published_at=now()-interval '8 days'",
);
await db.exec("select private.market_housekeeping()");
await db.exec("select private.market_housekeeping()");
assert.equal(
  (
    await db.query<{ n: number }>(
      "select count(*)::int n from private.market_mail where kind='price_nudge'",
    )
  ).rows[0].n,
  1,
);
await as(seller);
await assert.rejects(() => act("price", { id: listing, price: 400 }), /hour/);
await db.exec("reset role");
await db.exec(
  "update market_listings set price_changed_at=now()-interval '2 hours'",
);
await as(seller);
await act("submit", { ...item, price: 400 });
assert.equal((await read("mine"))[0].previous_price, 450);
await as(buyer);
assert.equal((await read("feed")).items.length, 0);
await as(admin);
await act("review_listing", { id: listing, decision: "active" });
await db.exec("reset role");
assert.equal(
  (
    await db.query<{ n: number }>(
      "select count(*)::int n from private.market_mail where kind='price_drop'",
    )
  ).rows[0].n,
  2,
);
await as(seller);
await act("submit", { ...item, price: 400 });
await as(admin);
await act("review_listing", { id: listing, decision: "active" });
await db.exec("reset role");
assert.equal(
  (
    await db.query<{ n: number }>(
      "select count(*)::int n from private.market_mail where kind='price_drop'",
    )
  ).rows[0].n,
  2,
);
await as(buyer);
assert.equal(
  (await read("feed", null, { sort: "second-look" })).items.length,
  1,
);
await act("block", { thread_id: thread, enabled: true });
await as(seller);
assert.equal((await read("thread", thread)).contacts.length, 0);
await act("contact", { thread_id: thread, consent: false });
await assert.rejects(
  () =>
    act("message", {
      thread_id: thread,
      body: "blocked",
      request_id: crypto.randomUUID(),
    }),
  /cannot receive/,
);
await as(buyer);
await act("block", { thread_id: thread, enabled: false });
await as(buyer);
for (let i = 0; i < 19; i++)
  await act("message", {
    thread_id: thread,
    body: i === 0 ? "<script>alert(1)</script>" : "Question " + i,
    request_id: crypto.randomUUID(),
  });
await assert.rejects(
  () =>
    act("message", {
      thread_id: thread,
      body: "One too many",
      request_id: crypto.randomUUID(),
    }),
  /Message limit/,
);
await db.exec("reset role");
for (let i = 0; i < 65; i++)
  await db.query(
    "insert into market_messages(thread_id,author_id,body,request_id,created_at)values($1,$2,'Earlier message',$3,now()-interval '2 hours'-($4::int*interval '1 minute'))",
    [thread, buyer, crypto.randomUUID(), i],
  );
await as(buyer);
const newest = (await read("thread", thread)).messages;
assert.equal(newest.length, 50);
const earlier = await read("messages", thread, {
  before: newest[0].created_at,
  before_id: newest[0].id,
});
assert.equal(earlier.length, 35);
assert.equal(new Set([...newest, ...earlier].map((m) => m.id)).size, 85);
await as(seller);
await act("handover", { thread_id: thread });
assert.equal((await read("mine"))[0].handovers, 0);
await as(buyer);
await act("handover", { thread_id: thread });
assert.equal((await read("listing", listing)).handovers, 1);
await assert.rejects(
  () => act("interest", { id: listing }),
  /no longer available/,
);
await as(stranger);
assert.equal((await db.query("select * from market_members")).rows.length, 1);
await assert.rejects(
  () => db.exec("select * from private.market_mail"),
  /permission/,
);
await assert.rejects(
  () => act("configure_email", { key: "not-a-key" }),
  /Conversation not found|Unsupported/,
);
await db.exec("reset role;set role anon");
await assert.rejects(
  () => db.exec("select * from market_listings"),
  /permission/,
);
await assert.rejects(() => read("feed"), /permission/);
await as(admin);await act('review_member',{id:buyer,decision:'suspended',checked:true,note:'Test suspension'});await as(buyer);await assert.rejects(()=>read('thread',thread),/verification/);assert.equal((await db.query('select * from market_messages')).rows.length,0);await as(admin);await act('review_member',{id:buyer,decision:'verified',checked:true,note:'Test restored'});
await db.exec("reset role");
await db.exec(`create schema vault;create schema net;create schema cron;
create table vault.secrets(id uuid primary key default gen_random_uuid(),name text unique,secret text);
create view vault.decrypted_secrets as select id,name,secret decrypted_secret from vault.secrets;
create function vault.create_secret(new_secret text,new_name text,new_description text) returns uuid language sql as $$insert into vault.secrets(name,secret)values(new_name,new_secret)returning id$$;
create function vault.update_secret(secret_id uuid,new_secret text) returns void language sql as $$update vault.secrets set secret=new_secret where id=secret_id$$;
create table net._http_response(id bigint,status_code integer,timed_out boolean,error_msg text);
create table net.test_requests(id bigint generated always as identity,url text,headers jsonb,body jsonb);
create function net.http_post(url text,headers jsonb,body jsonb,timeout_milliseconds integer) returns bigint language sql as $$insert into net.test_requests(url,headers,body)values(url,headers,body)returning id$$;
create function cron.schedule(job_name text,schedule text,command text) returns bigint language sql as $$select 1::bigint$$;`);
const emailSQL = readFileSync("supabase/marketplace-email.sql", "utf8").replace(
  /^create extension.*$/gm,
  "",
);
await db.exec(emailSQL);
await as(buyer);
await assert.rejects(
  () => act("configure_email", { key: "xkeysib-" + "test".repeat(15) }),
  /Conversation not found|Unsupported/,
);
await as(admin);
assert.equal((await read("admin")).mail.configured, false);
await act("configure_email", { key: "xkeysib-" + "test".repeat(15) });
assert.equal((await read("admin")).mail.configured, true);
await assert.rejects(
  () => db.exec("select * from vault.decrypted_secrets"),
  /permission/,
);
await act("alerts", { enabled: false });
await assert.rejects(() => act("test_email"), /enable email alerts/);
await act("alerts", { enabled: true });
await act("test_email");
await db.exec("reset role");
await db.exec("select private.market_tick()");
const sent = await db.query<{
  id: number;
  url: string;
  body: any;
  headers: any;
}>("select * from net.test_requests");
assert.ok(sent.rows.length > 0);
assert.ok(
  sent.rows.every((r) => r.url === "https://api.brevo.com/v3/smtp/email"),
);
assert.ok(sent.rows.every((r) => !r.body.textContent.includes("9876543210")));
await db.query("insert into net._http_response values($1,201,false,null)", [
  sent.rows[0].id,
]);
if (sent.rows[1])
  await db.query("insert into net._http_response values($1,401,false,null)", [
    sent.rows[1].id,
  ]);
if (sent.rows[2])
  await db.query("insert into net._http_response values($1,null,true,null)", [
    sent.rows[2].id,
  ]);
await db.exec("select private.market_tick()");
assert.equal(
  (
    await db.query<{ n: number }>(
      "select count(*)::int n from private.market_mail where status='accepted'",
    )
  ).rows[0].n,
  1,
);
const unknownBefore = (
  await db.query<{ n: number }>(
    "select count(*)::int n from private.market_mail where error like 'Delivery status unknown%'",
  )
).rows[0].n;
assert.ok(unknownBefore > 0);
await as(admin);
await act("retry_mail");
await db.exec("reset role");
assert.equal(
  (
    await db.query<{ n: number }>(
      "select count(*)::int n from private.market_mail where status='failed' and error like 'Delivery status unknown%'",
    )
  ).rows[0].n,
  unknownBefore,
);
await db.exec("set role anon");
await assert.rejects(
  () => db.exec("select private.market_tick()"),
  /permission/,
);
await db.close();
console.log(
  "Marketplace database checks passed: verification, private images, ownership, moderation, search, isolated/idempotent chat, consent, blocking, handovers, alerts and anonymous restrictions.",
);
