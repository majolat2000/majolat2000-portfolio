-- Migration: Ensure public.link_referral is executable by all roles and auto-links on auth.users insert
grant execute on function public.link_referral(uuid, text) to anon, authenticated, service_role;

-- Function: Trigger function to link referral automatically when user signs up
create or replace function public.on_auth_user_created_link_referral()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_ref text;
begin
  if new.raw_user_meta_data is not null then
    v_ref := new.raw_user_meta_data->>'referral_code';
    if v_ref is not null and trim(v_ref) <> '' then
      perform public.link_referral(new.id, trim(v_ref));
    end if;
  end if;
  return new;
exception when others then
  -- Do not block user registration if referral code fails or does not exist
  return new;
end;
$$;

drop trigger if exists tr_on_auth_user_created_link_referral on auth.users;
create trigger tr_on_auth_user_created_link_referral
  after insert on auth.users
  for each row execute function public.on_auth_user_created_link_referral();
