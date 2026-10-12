-- Migration: Add Password Reset OTP & Brute-Force Lockout fields to affiliate_profiles
-- Run this in your Supabase SQL Editor

-- 1. Add reset_otp, reset_otp_expires_at, failed_otp_attempts, account_locked_until columns
alter table public.affiliate_profiles
  add column if not exists reset_otp text,
  add column if not exists reset_otp_expires_at timestamptz,
  add column if not exists failed_otp_attempts integer not null default 0,
  add column if not exists account_locked_until timestamptz;

-- 2. Indexes for fast lookups
create index if not exists affiliate_profiles_reset_otp_idx
  on public.affiliate_profiles (reset_otp_expires_at);

-- 3. Cleanup function for expired OTPs
create or replace function public.cleanup_expired_otps()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.affiliate_profiles
  set reset_otp = null,
      reset_otp_expires_at = null
  where reset_otp_expires_at < now();
end;
$$;
