-- Migration: Manual Affiliate Withdrawals & Paystack Integration
-- Run this in your Supabase SQL Editor.

-- 1. Add account_name and bank_name columns to public.withdrawals if they don't exist
alter table public.withdrawals add column if not exists account_name text;
alter table public.withdrawals add column if not exists bank_name text;

-- 2. Update status check constraint on public.withdrawals
-- Drops the old constraint if present and allows 'PENDING', 'APPROVED', 'SUCCESSFUL', 'FAILED', 'REJECTED'
alter table public.withdrawals drop constraint if exists withdrawals_status_check;
alter table public.withdrawals add constraint withdrawals_status_check 
  check (status in ('PENDING', 'APPROVED', 'SUCCESSFUL', 'FAILED', 'REJECTED'));

-- 3. Function for admin to approve a withdrawal manually
create or replace function public.admin_approve_withdrawal(
  p_withdrawal_id uuid,
  p_transfer_id text default null
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'not authorized';
  end if;

  update public.withdrawals
  set status = 'APPROVED',
      transfer_id = coalesce(p_transfer_id, transfer_id),
      updated_at = now()
  where id = p_withdrawal_id
    and status = 'PENDING';

  return found;
end;
$$;

-- 4. Function for admin to reject a withdrawal and refund wallet balance
create or replace function public.admin_reject_withdrawal(
  p_withdrawal_id uuid,
  p_reason text default 'Declined by administrator'
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_withdrawal public.withdrawals;
begin
  if not public.is_admin() then
    raise exception 'not authorized';
  end if;

  select * into v_withdrawal
  from public.withdrawals
  where id = p_withdrawal_id
  for update;

  if not found or v_withdrawal.status <> 'PENDING' then
    return false;
  end if;

  -- Mark as REJECTED
  update public.withdrawals
  set status = 'REJECTED',
      failure_reason = p_reason,
      updated_at = now()
  where id = p_withdrawal_id;

  -- Refund wallet balance back to affiliate
  update public.affiliate_profiles
  set wallet_balance = wallet_balance + v_withdrawal.amount,
      updated_at = now()
  where user_id = v_withdrawal.user_id;

  return true;
end;
$$;
