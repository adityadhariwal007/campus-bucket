-- Hosted Supabase integration. No credentials are stored in source or public tables.
begin;
create extension if not exists pg_net with schema extensions;
create extension if not exists pg_cron;
revoke usage on schema net,cron from public,anon,authenticated;
create or replace function private.market_email_configured() returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from vault.secrets where name='campus_bucket_market_brevo');
$$;
create or replace function private.market_configure_email(p_key text) returns void language plpgsql security definer set search_path='' as $$
declare k uuid;
begin
 if not private.is_admin() then raise exception 'Administrator access required.';end if;
 if p_key is null or length(p_key) not between 40 and 300 or p_key !~ '^xkeysib-[A-Za-z0-9_-]+$' then raise exception 'Use a Brevo API key, not an SMTP key.';end if;
 select id into k from vault.secrets where name='campus_bucket_market_brevo';
 if k is null then perform vault.create_secret(p_key,'campus_bucket_market_brevo','Campus Bucket marketplace transactional email');else perform vault.update_secret(k,p_key);end if;
end;$$;
revoke all on function private.market_email_configured(),private.market_configure_email(text) from public,anon,authenticated;
create function private.market_tick() returns void language plpgsql security definer set search_path='' as $$
declare mail private.market_mail;r record;api_key text;recipient text;req bigint;
begin
 if not pg_try_advisory_xact_lock(hashtext('campus_bucket_market_tick')) then return;end if;
 perform private.market_housekeeping();
 -- Reconcile actual provider responses, never claim inbox delivery from HTTP acceptance.
 for mail in select * from private.market_mail where status='sending' for update skip locked loop
  select status_code,timed_out,error_msg into r from net._http_response where id=mail.request_id;
  if found then
   if r.status_code between 200 and 299 then update private.market_mail set status='accepted',error='' where id=mail.id;
   elsif (r.status_code=429 or r.status_code>=500) and mail.attempts<5 then update private.market_mail set status='queued',error='Temporary provider error' where id=mail.id;
   else update private.market_mail set status='failed',error=case when r.timed_out or r.status_code is null then 'Delivery status unknown. Check Brevo before resending.' else 'Provider rejected request (HTTP '||r.status_code||')' end where id=mail.id;end if;
  elsif mail.last_attempt_at<now()-interval '10 minutes' then update private.market_mail set status='failed',error='Delivery status unknown. Check Brevo before resending.' where id=mail.id;end if;
 end loop;
 select decrypted_secret into api_key from vault.decrypted_secrets where name='campus_bucket_market_brevo';
 if api_key is null then return;end if;
 for mail in select * from private.market_mail where status='queued' and attempts<5 and (last_attempt_at is null or last_attempt_at<now()-make_interval(mins=>greatest(1,attempts*2))) order by created_at limit 10 for update skip locked loop
  select u.email into recipient from auth.users u join public.market_members m on m.user_id=u.id where u.id=mail.user_id and u.email_confirmed_at is not null and m.email_alerts and m.verification='verified';
  if recipient is null then update private.market_mail set status='failed',error='Member disabled alerts or is no longer eligible' where id=mail.id;continue;end if;
  req:=net.http_post(url:='https://api.brevo.com/v3/smtp/email',headers:=jsonb_build_object('Content-Type','application/json','api-key',api_key),
   body:=jsonb_build_object('sender',jsonb_build_object('name','Campus Bucket','email','team@campusbucket.live'),'to',jsonb_build_array(jsonb_build_object('email',recipient)),
    'subject','Thapar Market: '||left(mail.title,140),'textContent',mail.title||E'\n\nOpen Campus Bucket: https://campusbucket.live'||mail.link||E'\n\nMeet in a public campus location, inspect before paying, and keep your contact details private. Manage email alerts in Your listings.\n\nCampus Bucket is an independent student marketplace, not affiliated with TIET.',
    'headers',jsonb_build_object('idempotencyKey',mail.id::text)),timeout_milliseconds:=15000);
  update private.market_mail set status='sending',request_id=req,attempts=attempts+1,last_attempt_at=now(),error='' where id=mail.id;
 end loop;
end;$$;
revoke all on function private.market_tick() from public,anon,authenticated;
select cron.schedule('campus-bucket-market','* * * * *','select private.market_tick();');
commit;
