-- Storefront: products, access grants, admin tooling
-- Run this once in the Supabase SQL editor.

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text,
  price_kobo integer not null check (price_kobo > 0),
  duration_days integer not null default 30 check (duration_days > 0),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.product_access (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  product_id uuid not null references public.products (id) on delete cascade,
  granted_by uuid references auth.users (id) on delete set null,
  source text not null default 'manual' check (source in ('manual', 'flutterwave')),
  payment_reference text,
  starts_at timestamptz not null default now(),
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index if not exists product_access_user_idx on public.product_access (user_id);
create index if not exists product_access_product_idx on public.product_access (product_id);
create unique index if not exists product_access_payment_uidx
  on public.product_access (user_id, product_id, payment_reference)
  where payment_reference is not null;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from auth.users u
    where u.id = auth.uid()
      and u.raw_app_meta_data ->> 'role' = 'admin'
  );
$$;

revoke execute on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

create or replace function public.admin_list_users()
returns table (
  id uuid,
  email text,
  created_at timestamptz,
  last_sign_in_at timestamptz,
  confirmed boolean
)
language sql
stable
security definer
set search_path = public
as $$
  select u.id,
         u.email::text,
         u.created_at,
         u.last_sign_in_at,
         u.email_confirmed_at is not null
  from auth.users u
  where public.is_admin()
  order by u.created_at desc
  limit 1000;
$$;

revoke execute on function public.admin_list_users() from public;
grant execute on function public.admin_list_users() to authenticated;

create or replace function public.admin_grant_access(
  p_user_id uuid,
  p_product_id uuid,
  p_days integer
)
returns public.product_access
language plpgsql
security definer
set search_path = public
as $$
declare
  v_base timestamptz;
  v_row public.product_access;
begin
  if not public.is_admin() then
    raise exception 'not authorized';
  end if;
  if p_days is null or p_days < 1 or p_days > 3650 then
    raise exception 'days must be between 1 and 3650';
  end if;
  if not exists (select 1 from auth.users u where u.id = p_user_id) then
    raise exception 'user not found';
  end if;
  if not exists (select 1 from public.products p where p.id = p_product_id) then
    raise exception 'product not found';
  end if;

  select coalesce(max(pa.expires_at), now())
    into v_base
    from public.product_access pa
   where pa.user_id = p_user_id
     and pa.product_id = p_product_id
     and pa.expires_at > now();

  insert into public.product_access (user_id, product_id, granted_by, source, starts_at, expires_at)
  values (p_user_id, p_product_id, auth.uid(), 'manual', now(), v_base + make_interval(days => p_days))
  returning * into v_row;

  return v_row;
end;
$$;

revoke execute on function public.admin_grant_access(uuid, uuid, integer) from public;
grant execute on function public.admin_grant_access(uuid, uuid, integer) to authenticated;

alter table public.products enable row level security;
alter table public.product_access enable row level security;

drop policy if exists "products readable" on public.products;
create policy "products readable"
  on public.products for select
  to authenticated
  using (active or public.is_admin());

drop policy if exists "products admin insert" on public.products;
create policy "products admin insert"
  on public.products for insert
  to authenticated
  with check (public.is_admin());

drop policy if exists "products admin update" on public.products;
create policy "products admin update"
  on public.products for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "products admin delete" on public.products;
create policy "products admin delete"
  on public.products for delete
  to authenticated
  using (public.is_admin());

drop policy if exists "access own or admin" on public.product_access;
create policy "access own or admin"
  on public.product_access for select
  to authenticated
  using (user_id = auth.uid() or public.is_admin());

drop policy if exists "access admin insert" on public.product_access;
create policy "access admin insert"
  on public.product_access for insert
  to authenticated
  with check (public.is_admin());

drop policy if exists "access admin update" on public.product_access;
create policy "access admin update"
  on public.product_access for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "access admin delete" on public.product_access;
create policy "access admin delete"
  on public.product_access for delete
  to authenticated
  using (public.is_admin());

update auth.users
   set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || '{"role":"admin"}'::jsonb
 where lower(email) = 'info@majolat2000.com.ng';

insert into public.products (slug, name, description, price_kobo, duration_days)
values
  ('ai-starter-kit', 'AI Starter Kit', 'Prompts, templates and starter notebooks', 500000, 30),
  ('va-toolkit', 'Virtual Assistant Toolkit', 'SOPs, scripts and client onboarding docs', 300000, 30),
  ('resume-pack', 'CV & Resume Pack', 'ATS-ready resume templates and cover letters', 150000, 14)
on conflict (slug) do nothing;
