-- Per-user checkout limits are enforced inside the authoritative transaction.
create or replace function private.checkout(p_lines jsonb,p_customer jsonb,p_code text,p_request_id uuid) returns jsonb
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
