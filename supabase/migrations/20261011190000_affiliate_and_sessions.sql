-- Migration: Affiliate Marketing, Instant Withdrawals, Commission Splitting & Single Device Session Enforcement
-- Run this in your Supabase SQL Editor.

-- 1. Create affiliate_profiles table
create table if not exists public.affiliate_profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  role text not null default 'USER' check (role in ('USER', 'AFFILIATE', 'ADMIN')),
  referral_code text unique,
  referred_by_id uuid references auth.users (id) on delete set null,
  wallet_balance numeric not null default 0 check (wallet_balance >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists affiliate_profiles_referral_code_idx on public.affiliate_profiles (referral_code);
create index if not exists affiliate_profiles_referred_by_idx on public.affiliate_profiles (referred_by_id);

-- 2. Create withdrawals table
create table if not exists public.withdrawals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  amount numeric not null check (amount > 0),
  account_bank text not null,
  account_number text not null,
  transfer_ref text unique not null,
  transfer_id text,
  status text not null default 'PENDING' check (status in ('PENDING', 'SUCCESSFUL', 'FAILED')),
  failure_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists withdrawals_user_idx on public.withdrawals (user_id);
create index if not exists withdrawals_transfer_ref_idx on public.withdrawals (transfer_ref);

-- 3. Create user_sessions table for Single Device & 24h Sliding Inactivity Enforcement
create table if not exists public.user_sessions (
  user_id uuid primary key references auth.users (id) on delete cascade,
  session_id text not null,
  device_info text,
  last_active_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

-- Enable RLS
alter table public.affiliate_profiles enable row level security;
alter table public.withdrawals enable row level security;
alter table public.user_sessions enable row level security;

-- Policies
drop policy if exists "affiliate_profiles_self_read" on public.affiliate_profiles;
create policy "affiliate_profiles_self_read"
  on public.affiliate_profiles for select
  to authenticated
  using (user_id = auth.uid() or public.is_admin());

drop policy if exists "withdrawals_self_read" on public.withdrawals;
create policy "withdrawals_self_read"
  on public.withdrawals for select
  to authenticated
  using (user_id = auth.uid() or public.is_admin());

drop policy if exists "user_sessions_self_manage" on public.user_sessions;
create policy "user_sessions_self_manage"
  on public.user_sessions for all
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Function: Ensure an affiliate profile exists for user
create or replace function public.get_or_create_affiliate_profile(p_user_id uuid)
returns public.affiliate_profiles
language plpgsql
security definer
set search_path = public
as $$
declare
  v_profile public.affiliate_profiles;
  v_is_admin boolean;
begin
  select exists (
    select 1 from auth.users u
    where u.id = p_user_id and u.raw_app_meta_data ->> 'role' = 'admin'
  ) into v_is_admin;

  select * into v_profile
  from public.affiliate_profiles
  where user_id = p_user_id;

  if not found then
    insert into public.affiliate_profiles (user_id, role, wallet_balance)
    values (p_user_id, case when v_is_admin then 'ADMIN' else 'USER' end, 0)
    returning * into v_profile;
  end if;

  return v_profile;
end;
$$;

-- Function: Link user to an affiliate via referral code
create or replace function public.link_referral(p_user_id uuid, p_referral_code text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_affiliate_id uuid;
begin
  if p_referral_code is null or trim(p_referral_code) = '' then
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

-- Function: Admin upgrade to affiliate
create or replace function public.admin_upgrade_to_affiliate(
  p_user_id uuid,
  p_custom_code text default null
)
returns public.affiliate_profiles
language plpgsql
security definer
set search_path = public
as $$
declare
  v_profile public.affiliate_profiles;
  v_code text;
  v_count integer := 0;
begin
  if not public.is_admin() then
    raise exception 'not authorized';
  end if;

  perform public.get_or_create_affiliate_profile(p_user_id);

  if p_custom_code is not null and trim(p_custom_code) <> '' then
    v_code := lower(trim(p_custom_code));
  else
    -- Generate code based on user id slice + random characters
    v_code := 'ref_' || substr(md5(p_user_id::text || clock_timestamp()::text), 1, 8);
  end if;

  -- Loop to avoid collision
  loop
    select count(*) into v_count from public.affiliate_profiles where referral_code = v_code and user_id <> p_user_id;
    exit when v_count = 0;
    v_code := 'ref_' || substr(md5(p_user_id::text || clock_timestamp()::text || random()::text), 1, 8);
  end loop;

  update public.affiliate_profiles
  set role = 'AFFILIATE',
      referral_code = coalesce(referral_code, v_code),
      updated_at = now()
  where user_id = p_user_id
  returning * into v_profile;

  return v_profile;
end;
$$;

-- Function: Atomic wallet deduction for instant withdrawal (prevents double spending)
create or replace function public.deduct_wallet_balance_for_withdrawal(
  p_user_id uuid,
  p_amount numeric
)
returns numeric
language plpgsql
security definer
set search_path = public
as $$
declare
  v_current_balance numeric;
  v_new_balance numeric;
begin
  if p_amount <= 0 then
    raise exception 'amount must be greater than zero';
  end if;

  -- Select with row-level lock
  select wallet_balance into v_current_balance
  from public.affiliate_profiles
  where user_id = p_user_id
  for update;

  if not found then
    raise exception 'affiliate profile not found';
  end if;

  if v_current_balance < p_amount then
    raise exception 'insufficient_balance';
  end if;

  v_new_balance := v_current_balance - p_amount;

  update public.affiliate_profiles
  set wallet_balance = v_new_balance,
      updated_at = now()
  where user_id = p_user_id;

  return v_new_balance;
end;
$$;

-- Function: Refund failed withdrawal
create or replace function public.refund_failed_withdrawal(
  p_transfer_ref text,
  p_reason text default null
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_withdrawal public.withdrawals;
begin
  select * into v_withdrawal
  from public.withdrawals
  where transfer_ref = p_transfer_ref
  for update;

  if not found then
    return false;
  end if;

  if v_withdrawal.status <> 'PENDING' then
    return false; -- Already processed or refunded
  end if;

  -- Mark withdrawal as FAILED
  update public.withdrawals
  set status = 'FAILED',
      failure_reason = coalesce(p_reason, failure_reason),
      updated_at = now()
  where id = v_withdrawal.id;

  -- Refund wallet balance
  update public.affiliate_profiles
  set wallet_balance = wallet_balance + v_withdrawal.amount,
      updated_at = now()
  where user_id = v_withdrawal.user_id;

  return true;
end;
$$;

-- Function: Mark withdrawal as SUCCESSFUL
create or replace function public.mark_withdrawal_successful(
  p_transfer_ref text,
  p_transfer_id text default null
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.withdrawals
  set status = 'SUCCESSFUL',
      transfer_id = coalesce(p_transfer_id, transfer_id),
      updated_at = now()
  where transfer_ref = p_transfer_ref
    and status = 'PENDING';

  return found;
end;
$$;

-- Function: Credit 30% affiliate commission on payment
create or replace function public.credit_affiliate_commission(
  p_buyer_id uuid,
  p_order_amount numeric,
  p_source text default 'purchase'
)
returns numeric
language plpgsql
security definer
set search_path = public
as $$
declare
  v_affiliate_id uuid;
  v_commission numeric;
begin
  if p_order_amount <= 0 then
    return 0;
  end if;

  -- Check if buyer has a referred_by_id
  select referred_by_id into v_affiliate_id
  from public.affiliate_profiles
  where user_id = p_buyer_id;

  if v_affiliate_id is null then
    return 0;
  end if;

  -- Calculate 30% commission
  v_commission := round(p_order_amount * 0.30, 2);

  if v_commission <= 0 then
    return 0;
  end if;

  -- Credit affiliate wallet
  update public.affiliate_profiles
  set wallet_balance = wallet_balance + v_commission,
      updated_at = now()
  where user_id = v_affiliate_id;

  return v_commission;
end;
$$;

-- Function: Validate or register user session (Single Device & Sliding Inactivity)
create or replace function public.validate_or_register_session(
  p_user_id uuid,
  p_session_id text,
  p_force boolean default false,
  p_device_info text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_existing public.user_sessions;
  v_now timestamptz := now();
  v_timeout_interval interval := interval '24 hours';
begin
  select * into v_existing
  from public.user_sessions
  where user_id = p_user_id
  for update;

  if found then
    -- Check if session expired due to inactivity
    if (v_existing.last_active_at + v_timeout_interval) < v_now then
      -- Expired session, overwrite
      update public.user_sessions
      set session_id = p_session_id,
          device_info = coalesce(p_device_info, device_info),
          last_active_at = v_now
      where user_id = p_user_id;

      return jsonb_build_object('status', 'ok', 'message', 'Session renewed after inactivity');
    end if;

    -- Different device / session
    if v_existing.session_id <> p_session_id then
      if not p_force then
        return jsonb_build_object(
          'status', 'conflict',
          'message', 'You are currently logged in on another device.',
          'last_active_at', v_existing.last_active_at
        );
      else
        -- Force override old session
        update public.user_sessions
        set session_id = p_session_id,
            device_info = coalesce(p_device_info, device_info),
            last_active_at = v_now
        where user_id = p_user_id;

        return jsonb_build_object('status', 'ok', 'message', 'Previous session superseded');
      end if;
    else
      -- Same session, update last_active_at
      update public.user_sessions
      set last_active_at = v_now
      where user_id = p_user_id;

      return jsonb_build_object('status', 'ok');
    end if;
  else
    -- New record
    insert into public.user_sessions (user_id, session_id, device_info, last_active_at)
    values (p_user_id, p_session_id, p_device_info, v_now);

    return jsonb_build_object('status', 'ok');
  end if;
end;
$$;

-- Function: Touch session (keep alive and check if active)
create or replace function public.touch_session(
  p_user_id uuid,
  p_session_id text
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_now timestamptz := now();
  v_timeout_interval interval := interval '24 hours';
  v_existing public.user_sessions;
begin
  select * into v_existing
  from public.user_sessions
  where user_id = p_user_id;

  if not found then
    return false;
  end if;

  -- If session ID doesn't match, user logged in elsewhere!
  if v_existing.session_id <> p_session_id then
    return false;
  end if;

  -- If inactive for > 24 hours, session expired!
  if (v_existing.last_active_at + v_timeout_interval) < v_now then
    return false;
  end if;

  update public.user_sessions
  set last_active_at = v_now
  where user_id = p_user_id;

  return true;
end;
$$;

-- Grants
grant execute on function public.get_or_create_affiliate_profile(uuid) to authenticated;
grant execute on function public.link_referral(uuid, text) to authenticated;
grant execute on function public.admin_upgrade_to_affiliate(uuid, text) to authenticated;
grant execute on function public.validate_or_register_session(uuid, text, boolean, text) to authenticated;
grant execute on function public.touch_session(uuid, text) to authenticated;
