-- Signup and checkout require name; renaming preserves existing profile values.
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema='public' and table_name='users' and column_name='name'
  ) then return; end if;
  alter table public.users rename column team to name;
end;
$$;
