-- Migration: Strictly attribute and count referrals for new account registrations only
-- Run this in your Supabase SQL Editor

-- 1. Tighten link_referral so existing users who already had accounts cannot be linked retroactively
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
  v_meta_ref text;
  v_created_at timestamptz;
begin
  if p_referral_code is null or trim(p_referral_code) = '' then
    return false;
  end if;

  -- Check user status and metadata in auth.users
  select email, coalesce(is_anonymous, false), raw_user_meta_data->>'referral_code', created_at
  into v_user_email, v_is_anonymous, v_meta_ref, v_created_at
  from auth.users
  where id = p_user_id;

  -- NEVER link anonymous guest sessions or sessions without a valid email
  if v_is_anonymous is true or v_user_email is null or trim(v_user_email) = '' then
    return false;
  end if;

  -- STRICT GUARD: Only link if user registered with a referral code OR account was created in the last 15 minutes (registration window)
  -- Existing users created in the past who simply sign in must NEVER be attributed to an affiliate
  if (v_meta_ref is null or trim(v_meta_ref) = '') and (v_created_at < now() - interval '15 minutes') then
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

-- 2. Update get_affiliate_referral_count to strictly count registrations that used the affiliate's custom referral link or code
create or replace function public.get_affiliate_referral_count(p_affiliate_id uuid)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer;
begin
  select count(distinct lower(u.email))
  into v_count
  from public.affiliate_profiles ap
  join auth.users u on u.id = ap.user_id
  where ap.referred_by_id = p_affiliate_id
    and (u.is_anonymous is false or u.is_anonymous is null)
    and u.email is not null
    and trim(u.email) <> ''
    and (
      (u.raw_user_meta_data->>'referral_code' is not null and trim(u.raw_user_meta_data->>'referral_code') <> '')
      or u.created_at >= '2026-10-11 00:00:00+00'::timestamptz
    );

  return coalesce(v_count, 0);
end;
$$;

grant execute on function public.get_affiliate_referral_count(uuid) to anon, authenticated, service_role;

-- 3. Cleanup: un-link older accounts that already had accounts before referral and did not register with a referral code
update public.affiliate_profiles ap
set referred_by_id = null
from auth.users u
where ap.user_id = u.id
  and ap.referred_by_id is not null
  and (u.raw_user_meta_data->>'referral_code' is null or trim(u.raw_user_meta_data->>'referral_code') = '')
  and u.created_at < '2026-10-11 00:00:00+00'::timestamptz;
