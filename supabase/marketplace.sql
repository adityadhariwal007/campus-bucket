-- Thapar Market: applied after schema.sql. All mutations pass through checked RPCs.
begin;
create table public.market_members (
 user_id uuid primary key references auth.users(id) on delete cascade,
 display_name text not null check(length(trim(display_name)) between 2 and 40),
 programme text not null default '' check(length(programme)<=80), batch text not null default '' check(length(batch)<=20),
 roll_number text not null default '' check(length(roll_number)<=40),
 verification text not null default 'pending' check(verification in ('pending','verified','rejected','suspended')),
 verification_kind text not null default '' check(verification_kind in ('','email','review')),
 review_note text not null default '' check(length(review_note)<=500), email_alerts boolean not null default true,
 created_at timestamptz not null default now()
);
create table public.market_listings (
 id uuid primary key default gen_random_uuid(), seller_id uuid not null references public.market_members(user_id),
 title text not null default '' check(length(title)<=100), description text not null default '' check(length(description)<=2000),
 category text not null default 'Other' check(category in ('Books & course gear','Electronics','Hostel essentials','Cycles','Sports','Clothing','Other')),
 condition text not null default 'Good' check(condition in ('Like new','Good','Used','Needs repair')),
 defects text not null default '' check(length(defects)<=500), course text not null default '' check(length(course)<=80),
 price integer not null default 0 check(price between 0 and 200000), previous_price integer,
 photos text[] not null default '{}' check(cardinality(photos)<=4), available_until date,
 status text not null default 'draft' check(status in ('draft','pending','active','reserved','sold','withdrawn','rejected','expired')),
 moderation_note text not null default '', created_at timestamptz not null default now(), published_at timestamptz,
 updated_at timestamptz not null default now(), price_changed_at timestamptz, nudged_at timestamptz
);
create index market_listings_seller_idx on public.market_listings(seller_id,created_at desc);
create index market_listings_feed_idx on public.market_listings(status,published_at desc,id);
create index market_listings_search_idx on public.market_listings using gin(to_tsvector('english',title||' '||description||' '||course||' '||category));
create table public.market_threads (
 id uuid primary key default gen_random_uuid(), listing_id uuid not null references public.market_listings(id),
 buyer_id uuid not null references public.market_members(user_id), seller_id uuid not null references public.market_members(user_id),
 seller_confirmed boolean not null default false,buyer_confirmed boolean not null default false,
 created_at timestamptz not null default now(),updated_at timestamptz not null default now(),
 unique(listing_id,buyer_id),check(buyer_id<>seller_id),check(not buyer_confirmed or seller_confirmed)
);
create index market_threads_buyer_idx on public.market_threads(buyer_id,updated_at desc);
create index market_threads_seller_idx on public.market_threads(seller_id,updated_at desc);
create table public.market_messages (
 id uuid primary key default gen_random_uuid(), thread_id uuid not null references public.market_threads(id),
 author_id uuid not null references public.market_members(user_id), body text not null check(length(trim(body)) between 1 and 2000),
 request_id uuid not null,created_at timestamptz not null default now(),unique(author_id,request_id)
);
create index market_messages_thread_idx on public.market_messages(thread_id,created_at desc,id);
create index market_messages_author_idx on public.market_messages(author_id,created_at desc);
create table public.market_meetups (
 id uuid primary key default gen_random_uuid(),thread_id uuid not null references public.market_threads(id),
 proposed_by uuid not null references public.market_members(user_id), place text not null check(length(trim(place)) between 3 and 100),
 meet_at timestamptz not null,status text not null default 'proposed' check(status in ('proposed','accepted','cancelled')),
 created_at timestamptz not null default now()
);
create index market_meetups_thread_idx on public.market_meetups(thread_id,created_at desc);
create index market_meetups_proposer_idx on public.market_meetups(proposed_by);
create unique index market_meetups_open_idx on public.market_meetups(thread_id) where status in ('proposed','accepted');
create table public.market_contacts (
 thread_id uuid not null references public.market_threads(id),user_id uuid not null references public.market_members(user_id),
 phone text not null check(phone ~ '^[6-9][0-9]{9}$'),created_at timestamptz not null default now(),primary key(thread_id,user_id)
);
create index market_contacts_user_idx on public.market_contacts(user_id);
create table public.market_saves (
 user_id uuid not null references public.market_members(user_id),listing_id uuid not null references public.market_listings(id),
 created_at timestamptz not null default now(),primary key(user_id,listing_id)
);
create index market_saves_listing_idx on public.market_saves(listing_id);
create table public.market_blocks (
 user_id uuid not null references public.market_members(user_id),blocked_id uuid not null references public.market_members(user_id),
 created_at timestamptz not null default now(),primary key(user_id,blocked_id),check(user_id<>blocked_id)
);
create index market_blocks_blocked_idx on public.market_blocks(blocked_id);
create table public.market_reports (
 id uuid primary key default gen_random_uuid(),user_id uuid not null references public.market_members(user_id),
 listing_id uuid references public.market_listings(id),thread_id uuid references public.market_threads(id),
 reason text not null check(reason in ('Scam','Prohibited item','Harassment','Other')),details text not null check(length(trim(details)) between 5 and 1000),
 status text not null default 'open' check(status in ('open','resolved')),created_at timestamptz not null default now(),check(num_nonnulls(listing_id,thread_id)=1)
);
create index market_reports_user_idx on public.market_reports(user_id,created_at desc);
create index market_reports_listing_idx on public.market_reports(listing_id);
create index market_reports_thread_idx on public.market_reports(thread_id);
create table public.market_notifications (
 id uuid primary key default gen_random_uuid(),user_id uuid not null references public.market_members(user_id),
 title text not null,link text not null,seen boolean not null default false,created_at timestamptz not null default now()
);
create index market_notifications_user_idx on public.market_notifications(user_id,created_at desc);
create table private.market_mail (
 id uuid primary key default gen_random_uuid(),user_id uuid not null references public.market_members(user_id),
 kind text not null,title text not null,link text not null,dedupe text not null unique,
 status text not null default 'queued' check(status in ('queued','sending','accepted','failed')),
 attempts integer not null default 0,request_id bigint,last_attempt_at timestamptz,created_at timestamptz not null default now(),error text not null default ''
);
create index market_mail_pending_idx on private.market_mail(status,created_at);
create index market_mail_user_idx on private.market_mail(user_id);
create table private.market_audit (id bigint generated always as identity primary key,admin_id uuid not null,action text not null,target_id uuid not null,note text not null default '',created_at timestamptz not null default now());
revoke all on private.market_mail,private.market_audit from public,anon,authenticated;
alter table private.market_mail enable row level security;
alter table private.market_audit enable row level security;
create function private.market_verified(p_uid uuid default auth.uid()) returns boolean language sql stable security definer set search_path='' as $$
 select p_uid is not null and (exists(select 1 from public.admin_users where user_id=p_uid) or exists(
 select 1 from public.market_members m join auth.users u on u.id=m.user_id where m.user_id=p_uid and m.verification='verified'
 and u.email_confirmed_at is not null and (m.verification_kind='review' or lower(u.email) ~ '^[^[:space:]@]+@thapar\.edu$')));
$$;
create function private.market_participant(p_thread uuid) returns boolean language sql stable security definer set search_path='' as $$
 select private.market_verified() and exists(select 1 from public.market_threads t where t.id=p_thread and auth.uid() in(t.buyer_id,t.seller_id));
$$;
create function private.market_blocked(p_a uuid,p_b uuid) returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.market_blocks where (user_id=p_a and blocked_id=p_b) or (user_id=p_b and blocked_id=p_a));
$$;
create function private.market_photo_allowed(p_name text) returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.market_listings l where split_part(p_name,'/',1)=l.seller_id::text and split_part(p_name,'/',2)=l.id::text
 and (l.seller_id=auth.uid() or private.is_admin() or (private.market_verified() and private.market_verified(l.seller_id) and p_name=any(l.photos) and l.status in ('active','reserved','sold'))));
$$;
revoke all on function private.market_verified(uuid),private.market_participant(uuid),private.market_blocked(uuid,uuid),private.market_photo_allowed(text) from public,anon;
grant execute on function private.market_verified(uuid),private.market_participant(uuid),private.market_photo_allowed(text) to authenticated;
-- Internal delivery helpers are replaced by marketplace-email.sql in hosted Supabase.
create function private.market_email_configured() returns boolean language sql stable security definer set search_path='' as $$select false;$$;
create function private.market_configure_email(p_key text) returns void language plpgsql security definer set search_path='' as $$begin raise exception 'Marketplace email integration is not installed.';end;$$;
revoke all on function private.market_email_configured(),private.market_configure_email(text) from public,anon,authenticated;
create function private.market_notify(p_user uuid,p_kind text,p_title text,p_link text,p_dedupe text) returns void language plpgsql security definer set search_path='' as $$
begin
 if exists(select 1 from private.market_mail where dedupe=p_dedupe) then return; end if;
 insert into public.market_notifications(user_id,title,link) values(p_user,p_title,p_link);
 if exists(select 1 from public.market_members where user_id=p_user and email_alerts and verification='verified') then
  insert into private.market_mail(user_id,kind,title,link,dedupe) values(p_user,p_kind,p_title,p_link,p_dedupe) on conflict(dedupe) do nothing;
 end if;
end;$$;
revoke all on function private.market_notify(uuid,text,text,text,text) from public,anon,authenticated;
create function private.market_price_alerts(p_listing public.market_listings) returns void language plpgsql security definer set search_path='' as $$
declare recipient uuid;
begin
 if p_listing.price>=p_listing.previous_price or p_listing.previous_price is null or p_listing.price_changed_at is null then return;end if;
 for recipient in select user_id from public.market_saves where listing_id=p_listing.id and user_id<>p_listing.seller_id and not private.market_blocked(user_id,p_listing.seller_id) loop
  perform private.market_notify(recipient,'price_drop','Price drop: '||p_listing.title,'/marketplace/'||p_listing.id,'drop:'||p_listing.id||':'||recipient||':'||extract(epoch from p_listing.price_changed_at)::text);
 end loop;
end;$$;
revoke all on function private.market_price_alerts(public.market_listings) from public,anon,authenticated;
-- New public tables are read-only through RLS; RPCs own all state transitions.
do $$declare t text;begin foreach t in array array['market_members','market_listings','market_threads','market_messages','market_meetups','market_contacts','market_saves','market_blocks','market_reports','market_notifications'] loop
 execute format('alter table public.%I enable row level security',t);
 execute format('revoke all on public.%I from public,anon,authenticated',t);
 execute format('grant select on public.%I to authenticated',t);
end loop;end;$$;
revoke select on public.market_listings from authenticated;
grant select(id,seller_id,status,photos) on public.market_listings to authenticated;
create policy market_member_read on public.market_members for select to authenticated using(user_id=(select auth.uid()) or (select private.is_admin()));
create policy market_listing_read on public.market_listings for select to authenticated using(seller_id=(select auth.uid()) or (select private.is_admin()) or ((select private.market_verified()) and private.market_verified(seller_id) and status in ('active','reserved','sold')));
create policy market_thread_read on public.market_threads for select to authenticated using((select private.market_verified()) and (select auth.uid()) in(buyer_id,seller_id));
create policy market_message_read on public.market_messages for select to authenticated using(private.market_participant(thread_id));
create policy market_meetup_read on public.market_meetups for select to authenticated using(private.market_participant(thread_id));
create policy market_contact_read on public.market_contacts for select to authenticated using(private.market_participant(thread_id));
create policy market_save_read on public.market_saves for select to authenticated using(user_id=(select auth.uid()));
create policy market_block_read on public.market_blocks for select to authenticated using(user_id=(select auth.uid()));
create policy market_report_read on public.market_reports for select to authenticated using(user_id=(select auth.uid()) or (select private.is_admin()));
create policy market_notification_read on public.market_notifications for select to authenticated using(user_id=(select auth.uid()));

create function private.market_action(p_action text,p_data jsonb default '{}') returns jsonb language plpgsql security definer set search_path='' as $$
declare u uuid:=auth.uid(); d public.market_listings; t public.market_threads; m public.market_meetups; target uuid; result uuid; name text; allowed boolean; amount integer; urls text[]; n integer;
begin
 if u is null then raise exception 'Sign in to continue.';end if;
 if jsonb_typeof(p_data)<>'object' or pg_column_size(p_data)>20000 then raise exception 'Invalid or oversized request.';end if;
 if p_action='join' then
  if not exists(select 1 from auth.users where id=u and email_confirmed_at is not null) then raise exception 'Confirm your sign-in email first.';end if;
  if length(trim(coalesce(p_data->>'display_name',''))) not between 2 and 40 or length(coalesce(p_data->>'programme',''))>80 or length(coalesce(p_data->>'batch',''))>20 or length(coalesce(p_data->>'roll_number',''))>40 then raise exception 'Check your display name and student details.';end if;
  select lower(email) ~ '^[^[:space:]@]+@thapar\.edu$' into allowed from auth.users where id=u;
  if not allowed and not private.is_admin() and (length(trim(coalesce(p_data->>'roll_number','')))<4 or length(trim(coalesce(p_data->>'programme','')))<2 or length(trim(coalesce(p_data->>'batch','')))<2) then raise exception 'Add your roll number, programme and batch for manual review.';end if;
  insert into public.market_members(user_id,display_name,programme,batch,roll_number,verification,verification_kind,email_alerts)
  values(u,trim(p_data->>'display_name'),coalesce(p_data->>'programme',''),coalesce(p_data->>'batch',''),coalesce(p_data->>'roll_number',''),case when allowed or private.is_admin() then 'verified' else 'pending' end,case when allowed then 'email' when private.is_admin() then 'review' else '' end,coalesce((p_data->>'email_alerts')::boolean,true)) on conflict(user_id) do nothing;
  return jsonb_build_object('ok',true);
 end if;
 if private.is_admin() and p_action in ('review_member','review_listing','resolve_report','configure_email','test_email','retry_mail') then
  target:=nullif(p_data->>'id','')::uuid;
  if p_action='configure_email' then perform private.market_configure_email(p_data->>'key');return jsonb_build_object('ok',true);end if;
  if p_action='retry_mail' then update private.market_mail set status='queued',attempts=0,error='' where status='failed' and error not like 'Delivery status unknown%';return jsonb_build_object('ok',true);end if;
  if p_action='test_email' then
   if not private.market_email_configured() then raise exception 'Configure the Brevo API key first.';end if;
   if not exists(select 1 from public.market_members where user_id=u and email_alerts and verification='verified') then raise exception 'Join the marketplace and enable email alerts first.';end if;
   perform private.market_notify(u,'test','Your Thapar Market email connection test','/marketplace',gen_random_uuid()::text);return jsonb_build_object('ok',true);
  end if;
  if p_action='review_member' then
   if p_data->>'decision' not in ('verified','rejected','suspended') then raise exception 'Invalid review decision.';end if;
   if not coalesce((p_data->>'checked')::boolean,false) then raise exception 'Confirm that you checked this student.';end if;
   update public.market_members set verification=p_data->>'decision',verification_kind='review',review_note=left(coalesce(p_data->>'note',''),500) where user_id=target;
  elsif p_action='review_listing' then
   if p_data->>'decision' not in ('active','rejected','withdrawn') then raise exception 'Invalid listing decision.';end if;
   select * into d from public.market_listings where id=target for update;
   if not found or d.status='draft' or d.status='sold' then raise exception 'This listing cannot be reviewed.';end if;
   if p_data->>'decision'='active' and (not private.market_verified(d.seller_id) or cardinality(d.photos)<1) then raise exception 'Verify the seller and listing photos before approval.';end if;
   update public.market_listings set status=p_data->>'decision',moderation_note=left(coalesce(p_data->>'note',''),500),published_at=case when p_data->>'decision'='active' then coalesce(published_at,now()) else published_at end,updated_at=now() where id=target returning * into d;
   if p_data->>'decision'='active' then perform private.market_price_alerts(d);end if;
  else update public.market_reports set status='resolved' where id=target;end if;
  if not found then raise exception 'The review target no longer exists.';end if;
  if p_action='review_member' and p_data->>'decision'<>'verified' then
   delete from public.market_contacts where thread_id in(select id from public.market_threads where target in(buyer_id,seller_id));
   update public.market_meetups set status='cancelled' where thread_id in(select id from public.market_threads where target in(buyer_id,seller_id)) and status in ('proposed','accepted');
  end if;
  insert into private.market_audit(admin_id,action,target_id,note) values(u,p_action,target,left(coalesce(p_data->>'note',''),500));
  return jsonb_build_object('ok',true);
 end if;
 if p_action='alerts' then update public.market_members set email_alerts=(p_data->>'enabled')::boolean where user_id=u;return jsonb_build_object('ok',true);end if;
 if p_action='withdraw' then
  update public.market_listings set status='withdrawn',updated_at=now() where id=(p_data->>'id')::uuid and seller_id=u and status<>'sold';
  if not found then raise exception 'This listing cannot be withdrawn.';end if;return jsonb_build_object('ok',true);
 end if;
 if not private.market_verified(u) then raise exception 'Thapar verification is required.';end if;
 -- Serialise per-member writes so limits hold under concurrent requests.
 perform user_id from public.market_members where user_id=u for update;
 if p_action='draft' then
  target:=(p_data->>'id')::uuid;
  if exists(select 1 from public.market_listings where id=target and seller_id=u) then return jsonb_build_object('id',target);end if;
  if (select count(*) from public.market_listings where seller_id=u and created_at>now()-interval '1 day')>=10 then raise exception 'Daily listing limit reached. Try tomorrow.';end if;
  if (select count(*) from public.market_listings where seller_id=u and status in ('draft','pending','active','reserved'))>=10 then raise exception 'You can have up to ten open listings.';end if;
  insert into public.market_listings(id,seller_id) values(target,u);return jsonb_build_object('id',target);
 elsif p_action in ('submit','price','sold_elsewhere') then
  select * into d from public.market_listings where id=(p_data->>'id')::uuid and seller_id=u for update;
  if not found then raise exception 'Listing not found or not yours.';end if;
  if d.status not in ('draft','pending','active','reserved','rejected') then raise exception 'This listing can no longer be edited.';end if;
  if p_action='sold_elsewhere' then update public.market_listings set status='sold',updated_at=now() where id=d.id;return jsonb_build_object('ok',true);end if;
  if (p_data->>'price')::numeric<>trunc((p_data->>'price')::numeric) then raise exception 'Use a whole-rupee price.';end if;
  amount:=(p_data->>'price')::integer;if amount is null or amount not between 0 and 200000 then raise exception 'Price must be between ₹0 and ₹2,00,000.';end if;
  if amount<>d.price and d.price_changed_at>now()-interval '1 hour' then raise exception 'Update a listing price at most once per hour.';end if;
  if p_action='price' then
   if amount=d.price then return jsonb_build_object('ok',true);end if;
   update public.market_listings set price=amount,previous_price=d.price,price_changed_at=now(),updated_at=now() where id=d.id returning * into d;
   if d.status='active' then perform private.market_price_alerts(d);end if;
   return jsonb_build_object('ok',true);
  end if;
  if length(trim(coalesce(p_data->>'title',''))) not between 5 and 100 or length(trim(coalesce(p_data->>'description',''))) not between 20 and 2000 or length(trim(coalesce(p_data->>'defects',''))) not between 2 and 500 or length(coalesce(p_data->>'course',''))>80 then raise exception 'Check the title, description, defects and course tag.';end if;
  if p_data->>'category' not in ('Books & course gear','Electronics','Hostel essentials','Cycles','Sports','Clothing','Other') or p_data->>'condition' not in ('Like new','Good','Used','Needs repair') then raise exception 'Choose a valid category and condition.';end if;
  if jsonb_typeof(p_data->'photos') is distinct from 'array' or jsonb_array_length(p_data->'photos') not between 1 and 4 then raise exception 'Add 1–4 actual item photos.';end if;
  select array_agg(value) into urls from jsonb_array_elements_text(p_data->'photos');
  if cardinality(urls)<>(select count(distinct x) from unnest(urls)x) or exists(select 1 from unnest(urls)x where x not like u::text||'/'||d.id::text||'/%' or not exists(select 1 from storage.objects o where o.bucket_id='marketplace' and o.name=x)) then raise exception 'Use only your own uploaded listing photos.';end if;
  if nullif(p_data->>'available_until','')::date<(now() at time zone 'Asia/Kolkata')::date or nullif(p_data->>'available_until','')::date>(now() at time zone 'Asia/Kolkata')::date+60 then raise exception 'Choose a handover deadline within 60 days.';end if;
  update public.market_listings set title=trim(p_data->>'title'),description=trim(p_data->>'description'),category=p_data->>'category',condition=p_data->>'condition',defects=trim(p_data->>'defects'),course=trim(coalesce(p_data->>'course','')),previous_price=case when d.title='' then null when amount<>d.price then d.price else d.previous_price end,price_changed_at=case when d.title='' then null when amount<>d.price then now() else d.price_changed_at end,price=amount,photos=urls,available_until=nullif(p_data->>'available_until','')::date,status='pending',moderation_note='',updated_at=now() where id=d.id;
  return jsonb_build_object('id',d.id);
 elsif p_action='interest' then
  select * into d from public.market_listings where id=(p_data->>'id')::uuid for update;
  if not found or d.status<>'active' or not private.market_verified(d.seller_id) or d.available_until<(now() at time zone 'Asia/Kolkata')::date then raise exception 'This item is no longer available.';end if;
  if d.seller_id=u then raise exception 'This is your own listing.';end if;
  if private.market_blocked(u,d.seller_id) then raise exception 'You cannot contact this member.';end if;
  select id into result from public.market_threads where listing_id=d.id and buyer_id=u;
  if result is not null then return jsonb_build_object('id',result);end if;
  if (select count(*) from public.market_threads where buyer_id=u and created_at>now()-interval '1 day')>=10 then raise exception 'You can start ten new conversations per day.';end if;
  insert into public.market_threads(listing_id,buyer_id,seller_id) values(d.id,u,d.seller_id) returning id into result;
  perform private.market_notify(d.seller_id,'interest','A student is interested in '||d.title,'/marketplace/inbox?thread='||result,'interest:'||result);
  return jsonb_build_object('id',result);
 elsif p_action='save' then
  target:=(p_data->>'id')::uuid;
  if not exists(select 1 from public.market_listings where id=target and status in ('active','reserved') and private.market_verified(seller_id)) then raise exception 'Item is unavailable.';end if;
  if coalesce((p_data->>'enabled')::boolean,false) then insert into public.market_saves(user_id,listing_id) values(u,target) on conflict do nothing;else delete from public.market_saves where user_id=u and listing_id=target;end if;
  return jsonb_build_object('ok',true);
 elsif p_action='report' then
  target:=nullif(p_data->>'thread_id','')::uuid;
  if target is not null and not private.market_participant(target) then raise exception 'Conversation not found.';end if;
  if target is null and not exists(select 1 from public.market_listings where id=(p_data->>'listing_id')::uuid and status in ('active','reserved','sold')) then raise exception 'Listing not found.';end if;
  if (select count(*) from public.market_reports where user_id=u and created_at>now()-interval '1 day')>=5 then raise exception 'Daily reporting limit reached. Contact the store for urgent issues.';end if;
  insert into public.market_reports(user_id,listing_id,thread_id,reason,details) values(u,case when target is null then (p_data->>'listing_id')::uuid else null end,target,p_data->>'reason',trim(p_data->>'details'));
  return jsonb_build_object('ok',true);
 elsif p_action='read_notifications' then update public.market_notifications set seen=true where user_id=u;return jsonb_build_object('ok',true);
 end if;
 -- Conversation mutations always resolve participants from the stored thread.
 select * into t from public.market_threads where id=(p_data->>'thread_id')::uuid and u in(buyer_id,seller_id) for update;
 if not found then raise exception 'Conversation not found.';end if;
 target:=case when t.buyer_id=u then t.seller_id else t.buyer_id end;
 if p_action='contact' and not coalesce((p_data->>'consent')::boolean,false) then delete from public.market_contacts where thread_id=t.id and user_id=u;return jsonb_build_object('ok',true);end if;
 if p_action='block' then
  if (p_data->>'enabled')::boolean then insert into public.market_blocks(user_id,blocked_id) values(u,target) on conflict do nothing;delete from public.market_contacts where thread_id in(select id from public.market_threads where (buyer_id=u and seller_id=target) or (buyer_id=target and seller_id=u));else delete from public.market_blocks where user_id=u and blocked_id=target;end if;return jsonb_build_object('ok',true);
 end if;
 if (private.market_blocked(u,target) or not private.market_verified(target)) and p_action<>'cancel_meetup' then raise exception 'This conversation cannot receive new activity.';end if;
 if p_action='message' then
  select id into result from public.market_messages where author_id=u and request_id=(p_data->>'request_id')::uuid;
  if result is not null then return jsonb_build_object('id',result);end if;
  if (select count(*) from public.market_messages where author_id=u and created_at>now()-interval '1 minute')>=20 or (select count(*) from public.market_messages where author_id=u and created_at>now()-interval '1 day')>=300 then raise exception 'Message limit reached. Try again later.';end if;
  if p_data->>'body' ~ '[[:cntrl:]]' and replace(replace(p_data->>'body',chr(10),''),chr(13),'') ~ '[[:cntrl:]]' then raise exception 'Remove control characters from your message.';end if;
  insert into public.market_messages(thread_id,author_id,body,request_id) values(t.id,u,trim(p_data->>'body'),(p_data->>'request_id')::uuid) returning id into result;
  update public.market_threads set updated_at=now() where id=t.id;return jsonb_build_object('id',result);
 elsif p_action='propose_meetup' then
  if (p_data->>'meet_at')::timestamptz<=now() or (p_data->>'meet_at')::timestamptz>now()+interval '30 days' then raise exception 'Choose a future meeting within 30 days.';end if;
  insert into public.market_meetups(thread_id,proposed_by,place,meet_at) values(t.id,u,trim(p_data->>'place'),(p_data->>'meet_at')::timestamptz) returning id into result;
  perform private.market_notify(target,'meetup','A campus meetup has been proposed','/marketplace/inbox?thread='||t.id,'meetup:'||result);
  return jsonb_build_object('id',result);
 elsif p_action in ('accept_meetup','cancel_meetup') then
  select * into m from public.market_meetups where id=(p_data->>'id')::uuid and thread_id=t.id for update;
  if not found then raise exception 'Meetup not found.';end if;
  if p_action='accept_meetup' then
   if m.proposed_by=u or m.status<>'proposed' or m.meet_at<=now() then raise exception 'Only the other participant can accept a future proposal.';end if;
   update public.market_meetups set status='accepted' where id=m.id;
   perform private.market_notify(target,'meetup','Your campus meetup was accepted','/marketplace/inbox?thread='||t.id,'accepted:'||m.id);
  else update public.market_meetups set status='cancelled' where id=m.id;delete from public.market_contacts where thread_id=t.id;end if;
  return jsonb_build_object('ok',true);
 elsif p_action='contact' then
  if not coalesce((p_data->>'consent')::boolean,false) then delete from public.market_contacts where thread_id=t.id and user_id=u;return jsonb_build_object('ok',true);end if;
  if not exists(select 1 from public.market_meetups where thread_id=t.id and status='accepted' and meet_at>now()-interval '1 day') then raise exception 'Agree on a meetup before sharing a number.';end if;
  if coalesce((p_data->>'consent')::boolean,false) then
   insert into public.market_contacts(thread_id,user_id,phone) values(t.id,u,p_data->>'phone') on conflict(thread_id,user_id) do update set phone=excluded.phone;
  else delete from public.market_contacts where thread_id=t.id and user_id=u;end if;
  return jsonb_build_object('ok',true);
 elsif p_action in ('reserve','release','handover') then
  select * into d from public.market_listings where id=t.listing_id for update;
  if p_action in ('reserve','release') then
   if t.seller_id<>u or d.status not in ('active','reserved') then raise exception 'Only the seller can reserve or release this item.';end if;
   update public.market_listings set status=case when p_action='reserve' then 'reserved' else 'active' end,updated_at=now() where id=d.id;
  elsif u=t.seller_id then
   if d.status not in ('active','reserved') or exists(select 1 from public.market_threads where listing_id=d.id and seller_confirmed and id<>t.id) then raise exception 'This item is already closed.';end if;
   update public.market_threads set seller_confirmed=true where id=t.id;
   update public.market_listings set status='sold',updated_at=now() where id=d.id;
   perform private.market_notify(t.buyer_id,'handover','Confirm your handover for '||d.title,'/marketplace/inbox?thread='||t.id,'handover:'||t.id);
  else
   if not t.seller_confirmed then raise exception 'The seller must confirm the handover first.';end if;
   update public.market_threads set buyer_confirmed=true where id=t.id;
  end if;return jsonb_build_object('ok',true);
 end if;
 raise exception 'Unsupported marketplace action.';
end;$$;
revoke all on function private.market_action(text,jsonb) from public,anon;
grant execute on function private.market_action(text,jsonb) to authenticated;
create function public.market_action(p_action text,p_data jsonb default '{}') returns jsonb language sql security invoker set search_path='' as $$select private.market_action(p_action,p_data);$$;
revoke all on function public.market_action(text,jsonb) from public,anon;
grant execute on function public.market_action(text,jsonb) to authenticated;

create function private.market_listing_json(p_listing public.market_listings) returns jsonb language sql stable security definer set search_path='' as $$
 select (case when p_listing.seller_id=auth.uid() or private.is_admin() then to_jsonb(p_listing) else to_jsonb(p_listing)-'moderation_note'-'nudged_at' end)||jsonb_build_object('seller_name',m.display_name,'verification_kind',m.verification_kind,
 'handovers',(select count(*) from public.market_threads where seller_id=m.user_id and seller_confirmed and buyer_confirmed),
 'interest_count',case when p_listing.seller_id=auth.uid() or private.is_admin() then (select count(*) from public.market_threads where listing_id=p_listing.id) else null end)
 from public.market_members m where m.user_id=p_listing.seller_id;
$$;
revoke all on function private.market_listing_json(public.market_listings) from public,anon,authenticated;
create function private.market_read(p_section text,p_id uuid default null,p_filters jsonb default '{}') returns jsonb language plpgsql stable security definer set search_path='' as $$
declare u uuid:=auth.uid();result jsonb;d public.market_listings;t public.market_threads;total integer;skip integer;needle text;cat text;sort text;low integer;high integer;
begin
 if u is null then raise exception 'Sign in to continue.';end if;
 if pg_column_size(p_filters)>4000 then raise exception 'Invalid filters.';end if;
 if p_section='status' then
  return jsonb_build_object('member',(select to_jsonb(m) from public.market_members m where user_id=u),'verified',private.market_verified(u),'admin',private.is_admin(),
  'email_eligible',exists(select 1 from auth.users where id=u and email_confirmed_at is not null and lower(email) ~ '^[^[:space:]@]+@thapar\.edu$'),'email_configured',private.market_email_configured());
 end if;
 if p_section='admin' and private.is_admin() then
  return jsonb_build_object('members',coalesce((select jsonb_agg(to_jsonb(m) order by m.created_at) from public.market_members m where verification in ('pending','suspended','rejected')),'[]'),
   'listings',coalesce((select jsonb_agg(private.market_listing_json(l) order by l.created_at) from public.market_listings l where l.status='pending'),'[]'),
   'reports',coalesce((select jsonb_agg(to_jsonb(r) order by r.created_at) from public.market_reports r where status='open'),'[]'),
   'mail',jsonb_build_object('queued',(select count(*) from private.market_mail where status in ('queued','sending')),'failed',(select count(*) from private.market_mail where status='failed'),'accepted',(select count(*) from private.market_mail where status='accepted'),'configured',private.market_email_configured()),
   'audit',coalesce((select jsonb_agg(x) from (select action,target_id,note,created_at from private.market_audit order by created_at desc limit 30)x),'[]'));
 end if;
 if p_section='notifications' then return coalesce((select jsonb_agg(to_jsonb(n) order by n.created_at desc) from (select * from public.market_notifications where user_id=u order by created_at desc limit 50)n),'[]');end if;
 if p_section='mine' then return coalesce((select jsonb_agg(private.market_listing_json(l) order by l.created_at desc) from public.market_listings l where seller_id=u),'[]');end if;
 if not private.market_verified(u) then raise exception 'Thapar verification is required.';end if;
 if p_section='feed' then
  needle:=left(trim(coalesce(p_filters->>'query','')),100);cat:=coalesce(p_filters->>'category','All');sort:=coalesce(p_filters->>'sort','newest');
  -- shortcut: offset browsing is capped at 5,000; use cursors if campus inventory exceeds this.
  skip:=greatest(0,least(coalesce((p_filters->>'offset')::integer,0),5000));low:=greatest(0,coalesce((p_filters->>'min')::integer,0));high:=least(200000,coalesce((p_filters->>'max')::integer,200000));
  with eligible as (select l.* from public.market_listings l where l.status='active' and private.market_verified(l.seller_id) and (l.available_until is null or l.available_until>=(now() at time zone 'Asia/Kolkata')::date)
   and (cat='All' or l.category=cat) and (coalesce(p_filters->>'condition','All')='All' or l.condition=p_filters->>'condition') and l.price between low and high
   and (needle='' or to_tsvector('english',l.title||' '||l.description||' '||l.course||' '||l.category)@@websearch_to_tsquery('english',needle))
   and (sort<>'saved' or exists(select 1 from public.market_saves where user_id=u and listing_id=l.id))
   and (sort<>'second-look' or l.published_at<=now()-interval '7 days')),
  page as(select * from eligible order by
   case when sort='price-low' then price end asc,
   case when sort='price-high' then price end desc,
   case when sort='deadline' then available_until end asc nulls last,
   case when sort='second-look' then md5(id::text||(now() at time zone 'Asia/Kolkata')::date::text) end,
   published_at desc,id desc limit 24 offset skip)
  select jsonb_build_object('items',coalesce((select jsonb_agg(private.market_listing_json(p)) from page p),'[]'),'total',(select count(*) from eligible),'offset',skip) into result;
  return result;
 elsif p_section='listing' then
  select * into d from public.market_listings where id=p_id and (seller_id=u or private.is_admin() or (status in ('active','reserved','sold') and private.market_verified(seller_id)));
  if not found then raise exception 'This listing is unavailable.';end if;
  return private.market_listing_json(d)||jsonb_build_object('saved',exists(select 1 from public.market_saves where user_id=u and listing_id=d.id));
 elsif p_section='inbox' then
  return coalesce((select jsonb_agg(x order by updated_at desc) from (
   select t.*,l.title,m.display_name other_name,
    coalesce((select body from public.market_messages where thread_id=t.id order by created_at desc,id desc limit 1),'New interest. Say hello.') last_message,
    private.market_blocked(t.buyer_id,t.seller_id) blocked,exists(select 1 from public.market_blocks where user_id=u and blocked_id=m.user_id) blocked_by_me
   from public.market_threads t join public.market_listings l on l.id=t.listing_id join public.market_members m on m.user_id=case when t.buyer_id=u then t.seller_id else t.buyer_id end
   where u in(t.buyer_id,t.seller_id) order by t.updated_at desc limit 50 offset greatest(0,least(coalesce((p_filters->>'offset')::integer,0),5000)))x),'[]');
 elsif p_section in ('thread','messages') then
  select * into t from public.market_threads where id=p_id and (u in(buyer_id,seller_id) or (private.is_admin() and exists(select 1 from public.market_reports where thread_id=p_id)));
  if not found then raise exception 'Conversation not found.';end if;
  select coalesce(jsonb_agg(x order by created_at,id),'[]') into result from (
   select * from public.market_messages where thread_id=t.id and (not(p_filters?'before') or (created_at,id)<((p_filters->>'before')::timestamptz,(p_filters->>'before_id')::uuid)) order by created_at desc,id desc limit 50)x;
  if p_section='messages' then return result;end if;
  return jsonb_build_object('thread',to_jsonb(t)||jsonb_build_object('title',(select title from public.market_listings where id=t.listing_id),'other_name',(select display_name from public.market_members where user_id=case when t.buyer_id=u then t.seller_id else t.buyer_id end),'blocked',private.market_blocked(t.buyer_id,t.seller_id),'blocked_by_me',exists(select 1 from public.market_blocks where user_id=u and blocked_id=case when t.buyer_id=u then t.seller_id else t.buyer_id end)),'messages',result,'meetups',coalesce((select jsonb_agg(to_jsonb(m) order by created_at desc) from public.market_meetups m where thread_id=t.id),'[]'),
   'contacts',coalesce((select jsonb_agg(to_jsonb(c)) from public.market_contacts c where thread_id=t.id),'[]'));
 end if;
 raise exception 'Unsupported marketplace view.';
end;$$;
revoke all on function private.market_read(text,uuid,jsonb) from public,anon;
grant execute on function private.market_read(text,uuid,jsonb) to authenticated;
create function public.market_read(p_section text,p_id uuid default null,p_filters jsonb default '{}') returns jsonb language sql security invoker set search_path='' as $$select private.market_read(p_section,p_id,p_filters);$$;
revoke all on function public.market_read(text,uuid,jsonb) from public,anon;
grant execute on function public.market_read(text,uuid,jsonb) to authenticated;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('marketplace','marketplace',false,4194304,array['image/jpeg','image/png','image/webp']);
create policy market_image_read on storage.objects for select to authenticated using(bucket_id='marketplace' and private.market_photo_allowed(name));
create function private.market_upload_allowed(p_name text) returns boolean language plpgsql security definer set search_path='' as $$
begin
 if not private.market_verified() or split_part(p_name,'/',1)<>auth.uid()::text then return false;end if;
 -- Serialize uploads for this owner so parallel requests cannot bypass the storage quota.
 perform pg_advisory_xact_lock(hashtextextended('market-upload:'||auth.uid()::text,0));
 return exists(select 1 from public.market_listings l where l.id::text=split_part(p_name,'/',2) and l.seller_id=auth.uid() and l.status in ('draft','pending','rejected','active','reserved'))
 and (select count(*) from storage.objects where bucket_id='marketplace' and split_part(name,'/',1)=auth.uid()::text)<60;
end;$$;
revoke all on function private.market_upload_allowed(text) from public,anon;
grant execute on function private.market_upload_allowed(text) to authenticated;
create policy market_image_upload on storage.objects for insert to authenticated with check(bucket_id='marketplace' and private.market_upload_allowed(name));
create policy market_image_delete on storage.objects for delete to authenticated using(bucket_id='marketplace' and split_part(name,'/',1)=(select auth.uid())::text
 and not exists(select 1 from public.market_listings l where name=any(l.photos) and l.status in ('active','reserved','sold','pending')));

create function private.market_housekeeping() returns void language plpgsql security definer set search_path='' as $$
declare l public.market_listings;
begin
 update public.market_listings set status='expired',updated_at=now() where status in ('active','reserved') and ((available_until is not null and available_until<(now() at time zone 'Asia/Kolkata')::date) or published_at<now()-interval '45 days');
 for l in select * from public.market_listings where status='active' and published_at<now()-interval '7 days' and (nudged_at is null or nudged_at<now()-interval '7 days') and private.market_verified(seller_id) order by nudged_at nulls first limit 50 for update skip locked loop
  perform private.market_notify(l.seller_id,'price_nudge','Give '||l.title||' a second look: improve the photos or consider your price.','/marketplace/mine','nudge:'||l.id||':'||(now() at time zone 'Asia/Kolkata')::date);
  update public.market_listings set nudged_at=now() where id=l.id;
 end loop;
end;$$;
revoke all on function private.market_housekeeping() from public,anon,authenticated;
commit;
