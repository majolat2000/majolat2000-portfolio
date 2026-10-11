-- Migration: Fix referral double-counting and add referral count RPC
-- Run this in your Supabase SQL Editor

-- 1. Function to accurately count referred members (excluding anonymous or email-less sessions)
create or replace function public.get_affiliate_referral_count(p_affiliate_id uuid)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer;
begin
  select count(distinct coalesce(lower(u.email), ap.user_id::text))
  into v_count
  from public.affiliate_profiles ap
  join auth.users u on u.id = ap.user_id
  where ap.referred_by_id = p_affiliate_id
    and (u.is_anonymous is false or u.is_anonymous is null)
    and u.email is not null
    and trim(u.email) <> '';

  return coalesce(v_count, 0);
end;
$$;

grant execute on function public.get_affiliate_referral_count(uuid) to anon, authenticated, service_role;

-- 2. Update link_referral so anonymous or dummy users are never linked as referred members
create or replace function public.link_referral(p_user_id uuid, p_referral_code text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_affiliate_id uuid;
  v_user_email text;
  v_is_anonymous boolean;
begin
  if p_referral_code is null or trim(p_referral_code) = '' then
    return false;
  end if;

  -- Check user status in auth.users
  select email, coalesce(is_anonymous, false)
  into v_user_email, v_is_anonymous
  from auth.users
  where id = p_user_id;

  -- NEVER link anonymous guest sessions or sessions without a valid email
  if v_is_anonymous is true or v_user_email is null or trim(v_user_email) = '' then
    return false;
  end if;

  -- Ensure profile exists
  perform public.get_or_create_affiliate_profile(p_user_id);

  -- Find affiliate owner
  select user_id into v_affiliate_id
  from public.affiliate_profiles
  where lower(referral_code) = lower(trim(p_referral_code))
    and role in ('AFFILIATE', 'ADMIN');

  if not found or v_affiliate_id = p_user_id then
    return false;
  end if;

  -- Only link if user is not already linked
  update public.affiliate_profiles
  set referred_by_id = v_affiliate_id,
      updated_at = now()
  where user_id = p_user_id
    and referred_by_id is null;

  return found;
end;
$$;

grant execute on function public.link_referral(uuid, text) to anon, authenticated, service_role;

-- 3. Cleanup any stray anonymous or dummy user profiles that were linked previously
delete from public.affiliate_profiles
where user_id in (
  select id from auth.users where is_anonymous is true or email is null or trim(email) = ''
);
