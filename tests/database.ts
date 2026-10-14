import { PGlite } from "@electric-sql/pglite";
import { readFileSync } from "node:fs";
import assert from "node:assert/strict";
const db = new PGlite();
await db.exec(
  `create role anon;create role authenticated;create schema auth;create table auth.users(id uuid primary key,email text,raw_user_meta_data jsonb default '{}');create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;grant usage on schema auth to authenticated,anon;grant execute on function auth.uid() to authenticated,anon;alter default privileges in schema public grant all on tables to anon,authenticated;`,
);
await db.exec(readFileSync("supabase/schema.sql", "utf8"));
await db.exec(readFileSync("supabase/seed.sql", "utf8"));
const student = "11111111-1111-4111-8111-111111111111",
  other = "22222222-2222-4222-8222-222222222222",
  admin = "33333333-3333-4333-8333-333333333333";
await db.query(
  `insert into auth.users(id,email) values($1,'student@example.com'),($2,'other@example.com'),($3,'admin@example.com')`,
  [student, other, admin],
);
// Reproduce the live column rename and verify repair preserves profiles.
await db.query("update public.users set name='Existing student' where id=$1", [student]);
await db.exec("alter table public.users rename column name to team");
const signupProbe = "44444444-4444-4444-8444-444444444444";
await assert.rejects(
  () => db.query("insert into auth.users(id,email) values($1,'signup@example.com')", [signupProbe]),
  /column "name"/,
);
const profileRepair = readFileSync("supabase/migrations/20261014034805_restore_user_name_column.sql", "utf8");
await db.exec(profileRepair);
await db.exec(profileRepair);
assert.equal((await db.query<{name: string}>("select name from public.users where id=$1", [student])).rows[0].name, "Existing student");
await db.exec("begin");
await db.query("insert into auth.users(id,email,raw_user_meta_data) values($1,'signup@example.com',$2::jsonb)", [signupProbe, JSON.stringify({name:"New student"})]);
assert.equal((await db.query<{name: string}>("select name from public.users where id=$1", [signupProbe])).rows[0].name, "New student");
await db.exec("rollback");
await db.query("insert into public.admin_users values($1)", [admin]);
const customer = {
  name: "Aditi Rao",
  phone: "9876543210",
  email: "aditi@example.com",
  campus: "Demo campus",
  delivery: "hostel",
  address: "Block A room 12",
};
const cart = [
  { kind: "kit", id: "hostel-fresher", quantity: 1, sizes: {}, price: 1 },
];
async function asUser(uid: string) {
  await db.exec("reset role");
  await db.query(`select set_config('request.jwt.claim.sub',$1,false)`, [uid]);
  await db.exec("set role authenticated");
}
async function checkout(
  lines: unknown = cart,
  id = crypto.randomUUID(),
  c = customer,
  code = "CAMPUS10",
) {
  const r = await db.query<{ result: any }>(
    "select public.place_order($1::jsonb,$2::jsonb,$3,$4::uuid) result",
    [JSON.stringify(lines), JSON.stringify(c), code, id],
  );
  return r.rows[0].result;
}
await asUser(student);
const request = crypto.randomUUID();
const order = await checkout(cart, request);
assert.equal(order.total, 453);
assert.equal(order.items[0].price, 449);
assert.equal(
  order.items[0].contents.find((i: any) => i.product_id === "hanger").quantity,
  6,
);
assert.equal(order.status, "Placed");
assert.equal((await checkout(cart, request)).id, order.id);
assert.equal(
  (
    await db.query<{ stock: number }>(
      "select stock from products where id='bucket'",
    )
  ).rows[0].stock,
  119,
);
await assert.rejects(
  () =>
    checkout([{ kind: "kit", id: "student-scholar", quantity: 1, sizes: {} }]),
  /size/,
);
await assert.rejects(
  () =>
    checkout([{ kind: "kit", id: "hostel-fresher", quantity: 1.5, sizes: {} }]),
  /quantity/,
);
await assert.rejects(
  () => checkout(cart, crypto.randomUUID(), { ...customer, phone: "123" }),
  /mobile/,
);
await assert.rejects(
  () => checkout(cart, crypto.randomUUID(), customer, "INVALID"),
  /discount/,
);
await db.exec("update products set price=1 where id='bucket'");
assert.equal(
  (
    await db.query<{ price: number }>(
      "select price from products where id='bucket'",
    )
  ).rows[0].price,
  199,
);
await assert.rejects(
  () =>
    db.exec(
      "insert into admin_users values('44444444-4444-4444-8444-444444444444')",
    ),
  /permission/,
);
await assert.rejects(
  () =>
    db.query("select public.update_order_status($1,$2)", [
      order.id,
      "Delivered",
    ]),
  /Administrator/,
);
await assert.rejects(
  () => db.query("select public.save_kit($1)", [JSON.stringify({})]),
  /Administrator/,
);
await assert.rejects(() => db.exec("update orders set total=1"), /permission/);
// User-editable metadata must never grant store administrator permissions.
await db.exec("reset role");
await db.query("update auth.users set raw_user_meta_data=$1::jsonb where id=$2", [JSON.stringify({admin:true,role:"admin"}), other]);
await asUser(other);
assert.equal((await db.query<{admin:boolean}>("select private.is_admin() admin")).rows[0].admin, false);
await assert.rejects(() => db.query("select public.save_kit($1)", [JSON.stringify({})]), /Administrator/);
await assert.rejects(() => db.query("update users set id=$1 where id=$2", ["55555555-5555-4555-8555-555555555555",other]), /row-level security/);
assert.equal((await db.query("select * from orders")).rows.length, 0);
assert.equal((await db.query("select * from users")).rows.length, 1);
await db.exec("reset role");
await db.exec("update products set stock=1 where id='cap'");
await asUser(student);
await assert.rejects(
  () =>
    checkout([
      {
        kind: "kit",
        id: "student-scholar",
        quantity: 1,
        sizes: { shirt: "M", cap: "S/M" },
      },
      { kind: "kit", id: "sports-fresher", quantity: 1, sizes: { cap: "S/M" } },
    ]),
  /stock/,
);
assert.equal(
  (
    await db.query<{ stock: number }>(
      "select stock from products where id='cap'",
    )
  ).rows[0].stock,
  1,
);
await asUser(admin);
await db.query("select public.update_order_status($1,$2)", [
  order.id,
  "Packed",
]);
assert.equal(
  (await db.query<{ status: string }>("select status from orders")).rows[0]
    .status,
  "Packed",
);
const kit = {
  id: "test-kit",
  name: "Test Kit",
  type: "Hostel",
  tier: "Fresher",
  price: 299,
  stock: 4,
  description: "Test",
  items: [{ product_id: "bucket", quantity: 1 }],
};
await db.query("select public.save_kit($1)", [JSON.stringify(kit)]);
await assert.rejects(
  () =>
    db.query("select public.save_kit($1)", [
      JSON.stringify({
        ...kit,
        price: 999,
        items: [{ product_id: "missing-product", quantity: 1 }],
      }),
    ]),
  /foreign key/,
);
assert.equal(
  (
    await db.query<{ price: number }>(
      "select price from kits where id='test-kit'",
    )
  ).rows[0].price,
  299,
);
await asUser(other);
await assert.rejects(
  () =>
    checkout(cart, crypto.randomUUID(), {
      ...customer,
      name: "Test\u0007Name",
    }),
  /control characters/,
);
for (let i = 0; i < 10; i++)
  await checkout([{ kind: "product", id: "register", quantity: 1, sizes: {} }]);
await assert.rejects(
  () => checkout([{ kind: "product", id: "register", quantity: 1, sizes: {} }]),
  /Order limit/,
);
await asUser(student);
assert.equal((await checkout(cart, request)).id, order.id);
await db.exec("reset role;set role anon");
assert.equal((await db.query("select * from products")).rows.length, 30);
await assert.rejects(() => db.exec("select * from orders"), /permission/);
await assert.rejects(() => checkout(), /permission/);
await assert.rejects(
  () =>
    db.exec(
      "insert into products values('evil','Evil',1,1,'Hostel','sprite:0',null)",
    ),
  /permission/,
);
await db.close();
console.log(
  "Database checks passed: authoritative totals, size/input validation, rollback, shared stock, idempotency, owner isolation, admin access, and anonymous restrictions.",
);
