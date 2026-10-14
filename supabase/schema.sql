-- Run once in a new Supabase project's SQL Editor, then run seed.sql.
begin;
create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to authenticated;
create table public.users (
 id uuid primary key references auth.users(id) on delete cascade,
 name text not null default '', phone text not null default '', email text not null default '', address text not null default ''
);
create table public.admin_users (user_id uuid primary key references auth.users(id) on delete cascade);
create table public.products (
 id text primary key check (id ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and length(id)<=80),
 name text not null check(length(trim(name)) between 1 and 120),
 price integer not null check(price between 1 and 1000000), stock integer not null check(stock between 0 and 100000),
 category text not null check(category in ('Hostel','Student','Sports')),
 image text not null check(image ~ '^sprite:([0-9]|[12][0-9])$' or image ~ '^https://'),
 size_type text check(size_type in ('shirt','cap','shoe'))
);
create table public.kits (
 id text primary key check (id ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and length(id)<=80),
 name text not null check(length(trim(name)) between 1 and 120), type text not null check(type in ('Hostel','Student','Sports','Bundle')),
 tier text not null check(tier in ('Fresher','Scholar','Topper')), price integer not null check(price between 1 and 1000000),
 stock integer not null check(stock between 0 and 100000), description text not null default '' check(length(description)<=500)
);
create table public.kit_items (
 kit_id text references public.kits(id) on delete cascade, product_id text references public.products(id),
 quantity integer not null check(quantity between 1 and 100), primary key(kit_id,product_id)
);
create index kit_items_product_idx on public.kit_items(product_id);
create table public.orders (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id),
 items jsonb not null, customer jsonb not null,
 subtotal bigint not null check(subtotal>0), discount bigint not null check(discount>=0), delivery_fee integer not null check(delivery_fee>=0),
 total bigint not null check(total=subtotal-discount+delivery_fee and total>0),
 status text not null default 'Placed' check(status in ('Placed','Packed','Out for delivery','Delivered')),
 payment_id text not null check(payment_id like 'mock_%'), created_at timestamptz not null default now(),
 request_id uuid not null, unique(user_id,request_id)
);
create index orders_user_created_idx on public.orders(user_id,created_at desc);
create index orders_created_idx on public.orders(created_at desc);
alter table public.users enable row level security;
alter table public.admin_users enable row level security;
alter table public.products enable row level security;
alter table public.kits enable row level security;
alter table public.kit_items enable row level security;
alter table public.orders enable row level security;
-- Supabase may apply broad default grants to new public tables. Reset them first.
revoke all on public.users,public.admin_users,public.products,public.kits,public.kit_items,public.orders from anon,authenticated;
create function private.is_admin() returns boolean language sql stable security definer set search_path='' as $$
 select auth.uid() is not null and exists(select 1 from public.admin_users where user_id=auth.uid());
$$;
revoke all on function private.is_admin() from public,anon;
grant execute on function private.is_admin() to authenticated;
grant select on public.products,public.kits,public.kit_items to anon,authenticated;
grant select on public.orders,public.admin_users to authenticated;
grant select,update on public.users to authenticated;
grant insert,update on public.products to authenticated;
create policy public_products on public.products for select to anon,authenticated using(true);
create policy public_kits on public.kits for select to anon,authenticated using(true);
create policy public_kit_items on public.kit_items for select to anon,authenticated using(true);
create policy own_profile on public.users for select to authenticated using(id=(select auth.uid()));
create policy update_profile on public.users for update to authenticated using(id=(select auth.uid())) with check(id=(select auth.uid()));
create policy own_admin_flag on public.admin_users for select to authenticated using(user_id=(select auth.uid()));
create policy admin_insert_product on public.products for insert to authenticated with check((select private.is_admin()));
create policy admin_update_product on public.products for update to authenticated using((select private.is_admin())) with check((select private.is_admin()));
create policy own_orders on public.orders for select to authenticated using(user_id=(select auth.uid()) or (select private.is_admin()));
-- Trigger functions cannot be invoked directly; new profiles follow Auth signup.
create function private.new_user() returns trigger language plpgsql security definer set search_path='' as $$
 begin insert into public.users(id,name,email) values(new.id,left(coalesce(new.raw_user_meta_data->>'name',''),100),coalesce(new.email,'')); return new; end;
$$;
revoke all on function private.new_user() from public,anon,authenticated;
create trigger create_user_profile after insert on auth.users for each row execute function private.new_user();

-- This privileged transaction has one public wrapper, authenticated callers only.
create function private.checkout(p_lines jsonb,p_customer jsonb,p_code text,p_request_id uuid) returns jsonb
language plpgsql security definer set search_path='' as $$
declare
 uid uuid:=auth.uid(); l jsonb; p public.products; k public.kits; req record; previous public.orders; saved public.orders;
 line_id text; line_kind text; qty integer; line_price integer; line_name text; size_key text; size_value text;
 needed jsonb:='{}'; kit_needed jsonb:='{}'; snapshot jsonb:='[]'; clean_sizes jsonb; line_contents jsonb; item record;
 subtotal bigint:=0; discount bigint:=0; fee integer:=0; code text:=upper(trim(coalesce(p_code,'')));
begin
 if uid is null then raise exception 'Sign in before checkout.'; end if;
 if p_request_id is null then raise exception 'A checkout reference is required.'; end if;
 perform pg_advisory_xact_lock(hashtextextended('checkout:'||uid::text,0));
 select * into previous from public.orders where user_id=uid and request_id=p_request_id;
 if found then return to_jsonb(previous); end if;
 -- This cap applies even when callers bypass the website and call the RPC directly.
 if (select count(*) from public.orders where user_id=uid and created_at>now()-interval '1 hour')>=10
   or (select count(*) from public.orders where user_id=uid and created_at>now()-interval '1 day')>=50
 then raise exception 'Order limit reached. Please try again later.'; end if;
 if pg_column_size(p_lines)>50000 or pg_column_size(p_customer)>8000 or length(p_code)>30 then raise exception 'Request is too large.'; end if;
 if exists(select 1 from jsonb_each_text(case when jsonb_typeof(p_customer)='object' then p_customer else '{}'::jsonb end) where value ~ '[[:cntrl:]]') then raise exception 'Remove control characters from your details.'; end if;
 if jsonb_typeof(p_lines) is distinct from 'array' then raise exception 'Invalid cart.'; end if;
 if jsonb_array_length(p_lines) not between 1 and 100 then raise exception 'Choose between 1 and 100 cart lines.'; end if;
 if p_customer is null or jsonb_typeof(p_customer)<>'object'
  or coalesce(length(trim(p_customer->>'name')),0) not between 2 and 100
  or coalesce(p_customer->>'phone','') !~ '^[6-9][0-9]{9}$'
  or coalesce(p_customer->>'email','') !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
  or length(p_customer->>'email')>254
  or coalesce(p_customer->>'delivery','') not in ('hostel','pickup')
  or coalesce(length(trim(p_customer->>'campus')),0) not between 2 and 150
  or coalesce(length(p_customer->>'address'),0)>500
  or (p_customer->>'delivery'='hostel' and coalesce(length(trim(p_customer->>'address')),0)<5)
 then raise exception 'Check your name, mobile, email, campus, and delivery address.'; end if;
 if code not in ('','CAMPUS10') then raise exception 'That discount code is not valid.'; end if;
 -- Lock kit rows before reading composition. Admin kit edits use the same lock.
 perform id from public.kits where id in(select value->>'id' from jsonb_array_elements(p_lines) where value->>'kind'='kit') order by id for update;
 for l in select value from jsonb_array_elements(p_lines) loop
  line_kind:=l->>'kind'; line_id:=l->>'id';
  if coalesce(line_kind,'') not in ('kit','product') or jsonb_typeof(l->'quantity') is distinct from 'number'
    or (l->>'quantity')::numeric<>trunc((l->>'quantity')::numeric) or (l->>'quantity')::numeric not between 1 and 20
    or jsonb_typeof(l->'sizes') is distinct from 'object' then raise exception 'Invalid cart item or quantity.'; end if;
  qty:=(l->>'quantity')::integer;
  if line_kind='kit' then
   select * into k from public.kits where id=line_id;
   if not found then raise exception 'A kit is no longer available.'; end if;
   if not exists(select 1 from public.kit_items where kit_id=line_id) then raise exception 'This kit has no items.'; end if;
   kit_needed:=jsonb_set(kit_needed,array[line_id],to_jsonb(coalesce((kit_needed->>line_id)::integer,0)+qty));
  elsif not exists(select 1 from public.products where id=line_id) then raise exception 'A product is no longer available.';
  end if;
  for item in select product_id,quantity from public.kit_items where line_kind='kit' and kit_id=line_id
    union all select line_id,1 where line_kind='product' loop
   needed:=jsonb_set(needed,array[item.product_id],to_jsonb(coalesce((needed->>item.product_id)::integer,0)+item.quantity*qty));
  end loop;
 end loop;
 -- Every order locks products in the same order, including items shared across kits.
 perform id from public.products where id in(select jsonb_object_keys(needed)) order by id for update;
 for req in select key,value::text::integer as quantity from jsonb_each(needed) loop
  select * into p from public.products where id=req.key;
  if not found or p.stock<req.quantity then raise exception 'Not enough stock for %. Update your bucket.',coalesce(p.name,req.key); end if;
 end loop;
 for req in select key,value::text::integer as quantity from jsonb_each(kit_needed) loop
  select * into k from public.kits where id=req.key;
  if k.stock<req.quantity then raise exception 'Not enough kits in stock for %.',k.name; end if;
 end loop;
 for l in select value from jsonb_array_elements(p_lines) loop
  line_kind:=l->>'kind';line_id:=l->>'id';qty:=(l->>'quantity')::integer;clean_sizes:='{}';
  if line_kind='kit' then select price,name into line_price,line_name from public.kits where id=line_id;
  else select price,name into line_price,line_name from public.products where id=line_id; end if;
  for size_key in select distinct pr.size_type from public.products pr where pr.size_type is not null and
    ((line_kind='product' and pr.id=line_id) or (line_kind='kit' and pr.id in(select product_id from public.kit_items where kit_id=line_id))) loop
   size_value:=l->'sizes'->>size_key;
   if size_value is null or (size_key='shirt' and size_value not in ('S','M','L','XL','XXL'))
    or (size_key='cap' and size_value not in ('S/M','L/XL'))
    or (size_key='shoe' and size_value not in ('UK 5','UK 6','UK 7','UK 8','UK 9','UK 10','UK 11','UK 12')) then raise exception 'Choose a valid % size for %.',size_key,line_name; end if;
   clean_sizes:=jsonb_set(clean_sizes,array[size_key],to_jsonb(size_value));
  end loop;
  select jsonb_agg(jsonb_build_object('product_id',pr.id,'name',pr.name,'quantity',c.quantity)) into line_contents
  from (select product_id,quantity from public.kit_items where line_kind='kit' and kit_id=line_id union all select line_id,1 where line_kind='product') c join public.products pr on pr.id=c.product_id;
  snapshot:=snapshot||jsonb_build_array(jsonb_build_object('key',gen_random_uuid()::text,'kind',line_kind,'id',line_id,'quantity',qty,'sizes',clean_sizes,'name',line_name,'price',line_price,'contents',line_contents));
  subtotal:=subtotal+line_price::bigint*qty;
 end loop;
 if code='CAMPUS10' then discount:=round(subtotal::numeric*.1); end if;
 if p_customer->>'delivery'='hostel' and subtotal-discount<1499 then fee:=49; end if;
 update public.products set stock=stock-(needed->>id)::integer where needed ? id;
 update public.kits set stock=stock-(kit_needed->>id)::integer where kit_needed ? id;
 insert into public.users(id,name,phone,email,address) values(uid,p_customer->>'name',p_customer->>'phone',p_customer->>'email',coalesce(p_customer->>'address',''))
 on conflict(id) do update set name=excluded.name,phone=excluded.phone,email=excluded.email,address=excluded.address;
 insert into public.orders(user_id,items,customer,subtotal,discount,delivery_fee,total,payment_id,request_id)
 values(uid,snapshot,jsonb_build_object('name',p_customer->>'name','phone',p_customer->>'phone','email',p_customer->>'email','campus',p_customer->>'campus','delivery',p_customer->>'delivery','address',coalesce(p_customer->>'address','')),subtotal,discount,fee,subtotal-discount+fee,'mock_'||gen_random_uuid()::text,p_request_id) returning * into saved;
 return to_jsonb(saved);
end;
$$;
revoke all on function private.checkout(jsonb,jsonb,text,uuid) from public,anon;
grant execute on function private.checkout(jsonb,jsonb,text,uuid) to authenticated;
create function public.place_order(p_lines jsonb,p_customer jsonb,p_code text,p_request_id uuid) returns jsonb
language sql security invoker set search_path='' as $$select private.checkout(p_lines,p_customer,p_code,p_request_id);$$;
revoke all on function public.place_order(jsonb,jsonb,text,uuid) from public,anon;
grant execute on function public.place_order(jsonb,jsonb,text,uuid) to authenticated;

create function private.save_kit(p_kit jsonb) returns void language plpgsql security definer set search_path='' as $$
declare i jsonb;
begin
 if not private.is_admin() then raise exception 'Administrator access required.'; end if;
 if jsonb_typeof(p_kit->'items') is distinct from 'array' then raise exception 'Kit items are required.'; end if;
 if jsonb_array_length(p_kit->'items') not between 1 and 100 then raise exception 'Choose 1–100 kit items.'; end if;
 if (p_kit->>'price')::numeric<>trunc((p_kit->>'price')::numeric) or (p_kit->>'stock')::numeric<>trunc((p_kit->>'stock')::numeric) then raise exception 'Price and stock must be whole numbers.'; end if;
 insert into public.kits(id,name,type,tier,price,stock,description) values(p_kit->>'id',p_kit->>'name',p_kit->>'type',p_kit->>'tier',(p_kit->>'price')::integer,(p_kit->>'stock')::integer,coalesce(p_kit->>'description',''))
 on conflict(id) do update set name=excluded.name,type=excluded.type,tier=excluded.tier,price=excluded.price,stock=excluded.stock,description=excluded.description;
 delete from public.kit_items where kit_id=p_kit->>'id';
 for i in select value from jsonb_array_elements(p_kit->'items') loop
  if jsonb_typeof(i->'quantity') is distinct from 'number' or (i->>'quantity')::numeric<>trunc((i->>'quantity')::numeric) then raise exception 'Item quantities must be whole numbers.'; end if;
  insert into public.kit_items(kit_id,product_id,quantity) values(p_kit->>'id',i->>'product_id',(i->>'quantity')::integer);
 end loop;
end;$$;
revoke all on function private.save_kit(jsonb) from public,anon;
grant execute on function private.save_kit(jsonb) to authenticated;
create function public.save_kit(p_kit jsonb) returns void language sql security invoker set search_path='' as $$select private.save_kit(p_kit);$$;
revoke all on function public.save_kit(jsonb) from public,anon;
grant execute on function public.save_kit(jsonb) to authenticated;
create function private.update_order_status(p_id uuid,p_status text) returns void language plpgsql security definer set search_path='' as $$
begin
 if not private.is_admin() then raise exception 'Administrator access required.'; end if;
 if p_status is null or p_status not in ('Placed','Packed','Out for delivery','Delivered') then raise exception 'Invalid order status.'; end if;
 update public.orders set status=p_status where id=p_id;
 if not found then raise exception 'Order not found.'; end if;
end;$$;
revoke all on function private.update_order_status(uuid,text) from public,anon;
grant execute on function private.update_order_status(uuid,text) to authenticated;
create function public.update_order_status(p_id uuid,p_status text) returns void language sql security invoker set search_path='' as $$select private.update_order_status(p_id,p_status);$$;
revoke all on function public.update_order_status(uuid,text) from public,anon;
grant execute on function public.update_order_status(uuid,text) to authenticated;
commit;
